import { Injectable } from '@nestjs/common';
import { Sentiment } from '@prisma/client';
import { AnalyticsQueryDto } from '../common/dto/analytics-query.dto';
import { DatePeriodService } from '../common/services/date-period.service';
import { metricChange, rounded } from '../common/utilities/metrics';
import { dateOnly, decimalToNumber } from '../common/utilities/prisma-values';
import { reviewWhereForPeriod } from '../common/utilities/review-where';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datePeriods: DatePeriodService,
  ) {}

  async overview(query: AnalyticsQueryDto) {
    const periods = this.datePeriods.getComparablePeriods(query.from, query.to);
    const currentWhere = reviewWhereForPeriod(periods.current, query.propertyIds);
    const previousWhere = reviewWhereForPeriod(periods.previous, query.propertyIds);

    const [current, previous, currentSentiments, previousSentiments] =
      await this.prisma.$transaction([
        this.prisma.review.aggregate({
          where: currentWhere,
          _avg: { rating: true },
          _count: { id: true },
        }),
        this.prisma.review.aggregate({
          where: previousWhere,
          _avg: { rating: true },
          _count: { id: true },
        }),
        this.prisma.review.groupBy({
          by: ['sentiment'],
          where: currentWhere,
          orderBy: { sentiment: 'asc' },
          _count: { _all: true },
        }),
        this.prisma.review.groupBy({
          by: ['sentiment'],
          where: previousWhere,
          orderBy: { sentiment: 'asc' },
          _count: { _all: true },
        }),
      ]);

    const currentAverage = decimalToNumber(current._avg.rating);
    const previousAverage = decimalToNumber(previous._avg.rating);

    return {
      period: {
        current: {
          from: dateOnly(periods.current.from),
          to: dateOnly(periods.current.to),
        },
        previous: {
          from: dateOnly(periods.previous.from),
          to: dateOnly(periods.previous.to),
        },
      },
      averageRating: currentAverage === null ? null : rounded(currentAverage),
      previousAverageRating: previousAverage === null ? null : rounded(previousAverage),
      ...metricChange(currentAverage, previousAverage),
      reviewCount: current._count.id,
      previousReviewCount: previous._count.id,
      sentimentCounts: this.sentimentCounts(currentSentiments),
      previousSentimentCounts: this.sentimentCounts(previousSentiments),
    };
  }

  private sentimentCounts(
    groups: Array<{
      sentiment: Sentiment;
      _count?: true | { _all?: number };
    }>,
  ) {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    for (const group of groups) {
      const count =
        typeof group._count === 'object' && group._count !== null ? (group._count._all ?? 0) : 0;
      counts[group.sentiment.toLowerCase() as keyof typeof counts] = count;
    }
    return counts;
  }
}
