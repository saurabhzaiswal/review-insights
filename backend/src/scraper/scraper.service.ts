import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, ScraperRunStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { BookingReviewCollector } from './booking-review.collector';
import { ReviewIngestionService } from './review-ingestion.service';
import { CollectableProperty } from './scraper.types';

type PreparedRun = {
  id: string;
  property: CollectableProperty;
};

@Injectable()
export class ScraperService implements OnModuleInit {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly collector: BookingReviewCollector,
    private readonly ingestion: ReviewIngestionService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.recoverStaleRuns();
  }

  async start(propertyIds?: string[]) {
    const runs = await this.prepareRuns(propertyIds);
    void this.executeRuns(runs).catch((error: unknown) => {
      this.logger.error(`Background review collection failed: ${this.safeMessage(error)}`);
    });

    return {
      accepted: true,
      runIds: runs.map((run) => run.id),
      propertyCount: runs.length,
      message: `Review update started for ${runs.length} ${runs.length === 1 ? 'hotel' : 'hotels'}.`,
    };
  }

  async runAndWait(propertyIds?: string[]) {
    const runs = await this.prepareRuns(propertyIds);
    await this.executeRuns(runs);
    return this.listRuns(runs.length);
  }

  async status() {
    const [activeRuns, lastSuccessfulRun, latestByProperty] = await Promise.all([
      this.prisma.scraperRun.count({ where: { status: ScraperRunStatus.RUNNING } }),
      this.prisma.scraperRun.findFirst({
        where: { status: { in: [ScraperRunStatus.SUCCESS, ScraperRunStatus.PARTIAL] } },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
      this.prisma.scraperRun.findMany({
        where: { propertyId: { not: null } },
        orderBy: { startedAt: 'desc' },
        distinct: ['propertyId'],
        include: { property: { select: { id: true, name: true, slug: true } } },
      }),
    ]);

    return {
      status: activeRuns ? 'running' : lastSuccessfulRun ? 'ready' : 'not_run',
      isRunning: activeRuns > 0,
      activeRunCount: activeRuns,
      lastSuccessfulSync: lastSuccessfulRun?.completedAt ?? null,
      properties: latestByProperty.map((run) => ({
        property: run.property,
        status: run.status.toLowerCase(),
        startedAt: run.startedAt,
        completedAt: run.completedAt,
      })),
    };
  }

  async listRuns(limit = 20) {
    const runs = await this.prisma.scraperRun.findMany({
      take: Math.min(Math.max(limit, 1), 50),
      orderBy: { startedAt: 'desc' },
      include: { property: { select: { id: true, name: true, slug: true } } },
    });

    return {
      data: runs.map((run) => ({
        ...run,
        status: run.status.toLowerCase(),
      })),
    };
  }

  private async prepareRuns(propertyIds?: string[]): Promise<PreparedRun[]> {
    await this.recoverStaleRuns();
    const selectedIds = [...new Set(propertyIds ?? [])];
    const properties = await this.prisma.property.findMany({
      where: {
        active: true,
        id: selectedIds.length ? { in: selectedIds } : undefined,
      },
      select: { id: true, slug: true, name: true, bookingUrl: true },
      orderBy: { name: 'asc' },
    });

    if (!properties.length) {
      throw new NotFoundException('No active hotels matched the review update request.');
    }
    if (selectedIds.length && properties.length !== selectedIds.length) {
      throw new NotFoundException('One or more selected hotels are unavailable.');
    }

    const active = await this.prisma.scraperRun.findFirst({
      where: {
        status: ScraperRunStatus.RUNNING,
        propertyId: { in: properties.map((property) => property.id) },
      },
      include: { property: { select: { name: true } } },
    });
    if (active) {
      throw new ConflictException(
        `${active.property?.name ?? 'A selected hotel'} is already being updated.`,
      );
    }

    const createdRuns = await this.prisma.$transaction(
      properties.map((property) =>
        this.prisma.scraperRun.create({
          data: {
            propertyId: property.id,
            status: ScraperRunStatus.RUNNING,
            metadata: {
              trigger: 'manual',
            },
          },
          select: { id: true },
        }),
      ),
    );
    return createdRuns.map((run, index) => ({ id: run.id, property: properties[index] }));
  }

  private async executeRuns(runs: PreparedRun[]): Promise<void> {
    // Sequential properties keep request rate conservative and isolate failures.
    for (const run of runs) {
      await this.executePropertyRun(run);
    }
  }

  private async executePropertyRun(run: PreparedRun): Promise<void> {
    try {
      const collected = await this.collector.collect(run.property);
      const saved = await this.ingestion.ingest(run.property.id, collected.reviews);
      const hasWarnings = collected.warnings.length > 0 || saved.rejected > 0;
      const errors = [...collected.warnings, ...saved.errors].slice(0, 10);

      await this.prisma.scraperRun.update({
        where: { id: run.id },
        data: {
          status: hasWarnings ? ScraperRunStatus.PARTIAL : ScraperRunStatus.SUCCESS,
          reviewsFound: collected.reviews.length,
          reviewsInserted: saved.inserted,
          reviewsUpdated: saved.updated,
          duplicatesSkipped: saved.duplicatesSkipped,
          completedAt: new Date(),
          errorMessage: errors.length ? errors.join('\n').slice(0, 2_000) : null,
          metadata: {
            selectorVersion: collected.selectorVersion,
            pagesVisited: collected.pagesVisited,
            rejectedReviews: saved.rejected,
          },
        },
      });
    } catch (error) {
      const message = this.safeMessage(error);
      this.logger.warn(`${run.property.name} review update failed: ${message}`);
      await this.prisma.scraperRun.update({
        where: { id: run.id },
        data: {
          status: ScraperRunStatus.FAILED,
          completedAt: new Date(),
          errorMessage: message,
          metadata: { safeStop: true },
        },
      });
    }
  }

  private async recoverStaleRuns(): Promise<void> {
    const staleBefore = new Date(Date.now() - 60 * 60 * 1_000);
    await this.prisma.scraperRun.updateMany({
      where: {
        status: ScraperRunStatus.RUNNING,
        startedAt: { lt: staleBefore },
      },
      data: {
        status: ScraperRunStatus.FAILED,
        completedAt: new Date(),
        errorMessage: 'The previous collection process stopped before completion.',
        metadata: { recoveredAsStale: true } satisfies Prisma.InputJsonValue,
      },
    });
  }

  private safeMessage(error: unknown): string {
    if (!(error instanceof Error)) return 'Unknown collection error';
    return error.message
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/\s*Call log:[\s\S]*$/i, '')
      .trim()
      .slice(0, 2_000);
  }
}
