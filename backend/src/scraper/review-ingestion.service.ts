import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RawCollectedReview } from '../ingestion/ingestion.types';
import { ReviewClassifierService } from '../ingestion/review-classifier.service';
import { ReviewFingerprintService } from '../ingestion/review-fingerprint.service';
import { ReviewNormalizerService } from '../ingestion/review-normalizer.service';
import { IngestionResult } from './scraper.types';

@Injectable()
export class ReviewIngestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: ReviewNormalizerService,
    private readonly fingerprint: ReviewFingerprintService,
    private readonly classifier: ReviewClassifierService,
  ) {}

  async ingest(propertyId: string, rawReviews: RawCollectedReview[]): Promise<IngestionResult> {
    const topics = await this.prisma.topic.findMany({
      where: { active: true },
      select: { id: true, key: true },
    });
    const topicIds = new Map(topics.map((topic) => [topic.key, topic.id]));
    const result: IngestionResult = {
      inserted: 0,
      updated: 0,
      duplicatesSkipped: 0,
      rejected: 0,
      errors: [],
    };

    for (const [index, raw] of rawReviews.entries()) {
      try {
        const review = this.normalizer.normalize(raw);
        const fingerprint = this.fingerprint.create(propertyId, review);
        const classification = this.classifier.classify(review);
        const outcome = await this.prisma.$transaction(async (transaction) => {
          const identifiers: Prisma.ReviewWhereInput[] = [{ fingerprint }];
          if (review.externalReviewId) {
            identifiers.push({ externalReviewId: review.externalReviewId });
          }

          const existing = await transaction.review.findFirst({
            where: { propertyId, OR: identifiers },
            select: {
              id: true,
              fingerprint: true,
              externalReviewId: true,
              isSynthetic: true,
            },
          });

          const data = {
            externalReviewId: review.externalReviewId,
            fingerprint,
            reviewerName: review.reviewerName,
            reviewerCountry: review.reviewerCountry,
            rating: review.rating,
            title: review.title,
            reviewText: review.reviewText,
            positiveComment: review.positiveComment,
            negativeComment: review.negativeComment,
            reviewDate: review.reviewDate,
            stayDate: review.stayDate,
            roomType: review.roomType,
            travellerType: review.travellerType,
            nightsStayed: review.nightsStayed,
            sourceUrl: review.sourceUrl,
            sentiment: classification.sentiment,
            isSynthetic: false,
            scrapedAt: new Date(),
          };

          if (
            existing &&
            existing.fingerprint === fingerprint &&
            existing.externalReviewId === review.externalReviewId &&
            !existing.isSynthetic
          ) {
            return 'duplicate' as const;
          }

          const saved = existing
            ? await transaction.review.update({
                where: { id: existing.id },
                data,
                select: { id: true },
              })
            : await transaction.review.create({
                data: { propertyId, ...data },
                select: { id: true },
              });

          await transaction.reviewTopic.deleteMany({ where: { reviewId: saved.id } });
          const topicRows = classification.topics.flatMap((topic) => {
            const topicId = topicIds.get(topic.key);
            return topicId
              ? [
                  {
                    reviewId: saved.id,
                    topicId,
                    sentiment: topic.sentiment,
                    confidence: topic.confidence,
                    matchedText: topic.matchedText,
                  },
                ]
              : [];
          });
          if (topicRows.length) {
            await transaction.reviewTopic.createMany({ data: topicRows });
          }

          return existing ? ('updated' as const) : ('inserted' as const);
        });

        if (outcome === 'inserted') result.inserted += 1;
        if (outcome === 'updated') result.updated += 1;
        if (outcome === 'duplicate') result.duplicatesSkipped += 1;
      } catch (error) {
        result.rejected += 1;
        result.errors.push(`Review ${index + 1}: ${this.safeMessage(error)}`);
      }
    }

    return result;
  }

  private safeMessage(error: unknown): string {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return 'A duplicate review was detected by the database.';
    }
    return error instanceof Error ? error.message.slice(0, 300) : 'Unknown ingestion error';
  }
}
