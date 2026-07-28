import { Injectable } from '@nestjs/common';
import { Sentiment } from '@prisma/client';
import { AnalyticsQueryDto } from '../common/dto/analytics-query.dto';
import { DatePeriodService } from '../common/services/date-period.service';
import { percentage } from '../common/utilities/metrics';
import { dateOnly } from '../common/utilities/prisma-values';
import { reviewWhereForPeriod } from '../common/utilities/review-where';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datePeriods: DatePeriodService,
  ) {}

  async findAll(query: AnalyticsQueryDto) {
    const { current } = this.datePeriods.getComparablePeriods(query.from, query.to);
    const negativeReviewWhere = {
      ...reviewWhereForPeriod(current, query.propertyIds),
      sentiment: Sentiment.NEGATIVE,
    };
    const [negativeReviewCount, groups, topics] = await Promise.all([
      this.prisma.review.count({ where: negativeReviewWhere }),
      this.prisma.reviewTopic.groupBy({
        by: ['topicId'],
        where: {
          sentiment: Sentiment.NEGATIVE,
          review: negativeReviewWhere,
        },
        _count: { _all: true },
      }),
      this.prisma.topic.findMany({
        where: { active: true },
        select: { id: true, key: true, displayName: true },
      }),
    ]);
    const topicById = new Map(topics.map((topic) => [topic.id, topic]));
    const insights = groups
      .map((group) => {
        const topic = topicById.get(group.topicId);
        const topicPercentage = percentage(group._count._all, negativeReviewCount);
        return {
          topic,
          negativeReviewCount: group._count._all,
          totalNegativeReviewCount: negativeReviewCount,
          percentage: topicPercentage,
          statement:
            topic && topicPercentage !== null
              ? `${topicPercentage}% of negative reviews in this period mentioned ${topic.displayName.toLowerCase()}.`
              : null,
        };
      })
      .filter((insight) => insight.topic)
      .sort((a, b) => b.negativeReviewCount - a.negativeReviewCount);

    return {
      period: { from: dateOnly(current.from), to: dateOnly(current.to) },
      negativeReviewCount,
      insights,
    };
  }
}
