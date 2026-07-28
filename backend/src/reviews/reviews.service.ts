import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { dateOnly, decimalToNumber } from '../common/utilities/prisma-values';
import { PrismaService } from '../database/prisma.service';
import { ReviewQueryDto, ReviewSort } from './dto/review-query.dto';

const reviewInclude = {
  property: { select: { id: true, slug: true, name: true } },
  topics: {
    orderBy: { topic: { displayName: 'asc' as const } },
    select: {
      sentiment: true,
      confidence: true,
      matchedText: true,
      topic: { select: { id: true, key: true, displayName: true } },
    },
  },
} satisfies Prisma.ReviewInclude;

type ReviewWithRelations = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ReviewQueryDto) {
    if (
      query.minRating !== undefined &&
      query.maxRating !== undefined &&
      query.minRating > query.maxRating
    ) {
      throw new BadRequestException('minRating must not be greater than maxRating.');
    }

    const where = this.buildWhere(query);
    const orderBy = this.orderBy(query.sort);
    const skip = (query.page - 1) * query.limit;
    const [total, reviews] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        include: reviewInclude,
        orderBy,
        skip,
        take: query.limit,
      }),
    ]);

    return {
      data: reviews.map((review) => this.toResponse(review)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: skip + reviews.length < total,
      },
    };
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: reviewInclude,
    });
    if (!review) throw new NotFoundException('Review not found.');
    return this.toResponse(review);
  }

  private buildWhere(query: ReviewQueryDto): Prisma.ReviewWhereInput {
    return {
      propertyId: query.propertyId,
      sentiment: query.sentiment,
      reviewDate:
        query.from || query.to
          ? {
              gte: query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined,
              lte: query.to ? new Date(`${query.to}T00:00:00.000Z`) : undefined,
            }
          : undefined,
      rating:
        query.minRating !== undefined || query.maxRating !== undefined
          ? { gte: query.minRating, lte: query.maxRating }
          : undefined,
      topics: query.topic ? { some: { topic: { key: query.topic.toLowerCase() } } } : undefined,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: 'insensitive' } },
            { reviewText: { contains: query.search, mode: 'insensitive' } },
            { positiveComment: { contains: query.search, mode: 'insensitive' } },
            { negativeComment: { contains: query.search, mode: 'insensitive' } },
            { reviewerName: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
  }

  private orderBy(sort: ReviewSort): Prisma.ReviewOrderByWithRelationInput[] {
    if (sort === ReviewSort.OLDEST) return [{ reviewDate: 'asc' }, { id: 'asc' }];
    if (sort === ReviewSort.LOWEST_RATING) {
      return [{ rating: 'asc' }, { reviewDate: 'desc' }, { id: 'asc' }];
    }
    return [{ reviewDate: 'desc' }, { id: 'desc' }];
  }

  private toResponse(review: ReviewWithRelations) {
    return {
      ...review,
      rating: decimalToNumber(review.rating),
      reviewDate: dateOnly(review.reviewDate),
      stayDate: review.stayDate ? dateOnly(review.stayDate) : null,
      topics: review.topics.map((match) => ({
        ...match.topic,
        sentiment: match.sentiment.toLowerCase(),
        confidence: decimalToNumber(match.confidence),
        matchedText: match.matchedText,
      })),
      sentiment: review.sentiment.toLowerCase(),
    };
  }
}
