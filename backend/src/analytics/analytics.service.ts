import { Injectable } from '@nestjs/common';
import { Sentiment } from '@prisma/client';
import { AnalyticsQueryDto } from '../common/dto/analytics-query.dto';
import { DatePeriodService } from '../common/services/date-period.service';
import { metricChange, percentage, rounded } from '../common/utilities/metrics';
import { dateOnly, decimalToNumber } from '../common/utilities/prisma-values';
import { reviewWhereForPeriod } from '../common/utilities/review-where';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datePeriods: DatePeriodService,
  ) {}

  async propertyRatings(query: AnalyticsQueryDto) {
    const periods = this.datePeriods.getComparablePeriods(query.from, query.to);
    const currentWhere = reviewWhereForPeriod(periods.current, query.propertyIds);
    const previousWhere = reviewWhereForPeriod(periods.previous, query.propertyIds);
    const propertyWhere = {
      active: true,
      id: query.propertyIds?.length ? { in: query.propertyIds } : undefined,
    };

    const [properties, current, previous, sentiments] = await Promise.all([
      this.prisma.property.findMany({
        where: propertyWhere,
        orderBy: { name: 'asc' },
        select: { id: true, slug: true, name: true },
      }),
      this.prisma.review.groupBy({
        by: ['propertyId'],
        where: currentWhere,
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.review.groupBy({
        by: ['propertyId'],
        where: previousWhere,
        _avg: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['propertyId', 'sentiment'],
        where: currentWhere,
        _count: { _all: true },
      }),
    ]);

    const currentByProperty = new Map(current.map((row) => [row.propertyId, row]));
    const previousByProperty = new Map(previous.map((row) => [row.propertyId, row]));

    return properties.map((property) => {
      const currentRow = currentByProperty.get(property.id);
      const currentAverage = decimalToNumber(currentRow?._avg.rating);
      const previousAverage = decimalToNumber(previousByProperty.get(property.id)?._avg.rating);
      const reviewCount = currentRow?._count._all ?? 0;
      const sentimentCount = (sentiment: Sentiment): number =>
        sentiments.find((row) => row.propertyId === property.id && row.sentiment === sentiment)
          ?._count._all ?? 0;

      return {
        ...property,
        averageRating: currentAverage === null ? null : rounded(currentAverage),
        previousAverageRating: previousAverage === null ? null : rounded(previousAverage),
        reviewCount,
        positivePercentage: percentage(sentimentCount(Sentiment.POSITIVE), reviewCount),
        negativePercentage: percentage(sentimentCount(Sentiment.NEGATIVE), reviewCount),
        ...metricChange(currentAverage, previousAverage),
      };
    });
  }

  async ratingTrend(query: AnalyticsQueryDto) {
    const { current } = this.datePeriods.getComparablePeriods(query.from, query.to);
    const rows = await this.prisma.review.groupBy({
      by: ['reviewDate'],
      where: reviewWhereForPeriod(current, query.propertyIds),
      orderBy: { reviewDate: 'asc' },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      date: dateOnly(row.reviewDate),
      averageRating: rounded(decimalToNumber(row._avg.rating) ?? 0),
      reviewCount: row._count._all,
    }));
  }

  async sentimentTrend(query: AnalyticsQueryDto) {
    const { current } = this.datePeriods.getComparablePeriods(query.from, query.to);
    const rows = await this.prisma.review.groupBy({
      by: ['reviewDate', 'sentiment'],
      where: reviewWhereForPeriod(current, query.propertyIds),
      orderBy: { reviewDate: 'asc' },
      _count: { _all: true },
    });
    const byDate = new Map<
      string,
      { date: string; positive: number; neutral: number; negative: number }
    >();

    for (const row of rows) {
      const date = dateOnly(row.reviewDate);
      const point = byDate.get(date) ?? {
        date,
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      point[row.sentiment.toLowerCase() as keyof Omit<typeof point, 'date'>] = row._count._all;
      byDate.set(date, point);
    }
    return [...byDate.values()];
  }

  async topics(query: AnalyticsQueryDto) {
    const { current } = this.datePeriods.getComparablePeriods(query.from, query.to);
    const reviewWhere = reviewWhereForPeriod(current, query.propertyIds);
    const [reviewCount, topicGroups, topics] = await Promise.all([
      this.prisma.review.count({ where: reviewWhere }),
      this.prisma.reviewTopic.groupBy({
        by: ['topicId'],
        where: { review: reviewWhere },
        _count: { _all: true },
        orderBy: { _count: { topicId: 'desc' } },
      }),
      this.prisma.topic.findMany({
        where: { active: true },
        select: { id: true, key: true, displayName: true },
      }),
    ]);
    const topicById = new Map(topics.map((topic) => [topic.id, topic]));

    return topicGroups.map((group) => ({
      ...topicById.get(group.topicId),
      reviewCount: group._count._all,
      reviewPercentage: percentage(group._count._all, reviewCount),
    }));
  }
}
