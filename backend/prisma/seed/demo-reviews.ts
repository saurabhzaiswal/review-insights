import { createHash } from 'node:crypto';
import { Prisma, PrismaClient, Sentiment } from '@prisma/client';
import { SENTIMENT_THRESHOLDS } from '../../src/common/constants/sentiment.constants';

type DemoReviewTemplate = {
  rating: number;
  title: string | null;
  positiveComment: string | null;
  negativeComment: string | null;
  reviewText: string | null;
  topicKeys: string[];
};

const reviewers = [
  ['Amelia', 'Australia'],
  ['Noah', 'New Zealand'],
  ['Olivia', 'United Kingdom'],
  ['Liam', 'Canada'],
  ['Mia', null],
  ['Ethan', 'Singapore'],
  ['Sofia', 'Spain'],
  ['Lucas', 'France'],
  ['Isla', 'Ireland'],
  ['Harper', null],
  ['Leo', 'Germany'],
  ['Grace', 'United States'],
] as const;

const templates: DemoReviewTemplate[] = [
  {
    rating: 9.2,
    title: 'Friendly team and an excellent location',
    positiveComment:
      'The receptionist was warm and helpful, and the station was an easy walk away.',
    negativeComment: null,
    reviewText: 'A smooth city stay with a friendly welcome.',
    topicKeys: ['staff', 'location'],
  },
  {
    rating: 4.4,
    title: 'Bathroom needed a deeper clean',
    positiveComment: 'The location was convenient.',
    negativeComment: 'The bathroom had dusty corners and the linen appeared stained.',
    reviewText: 'Housekeeping standards need attention.',
    topicKeys: ['cleanliness', 'location'],
  },
  {
    rating: 6.8,
    title: 'Comfortable but noisy at night',
    positiveComment: 'The bed was comfortable and the room was tidy.',
    negativeComment: 'Street noise and music made it difficult to sleep.',
    reviewText: null,
    topicKeys: ['room-condition', 'noise'],
  },
  {
    rating: 8.7,
    title: 'Simple self check-in',
    positiveComment: 'The access code arrived on time and check-in was very easy.',
    negativeComment: null,
    reviewText: 'Clear arrival instructions made the stay stress free.',
    topicKeys: ['check-in'],
  },
  {
    rating: 3.9,
    title: 'Several maintenance problems',
    positiveComment: null,
    negativeComment:
      'The shower pressure was poor, the air conditioning was unreliable, and the window was damaged.',
    reviewText: 'The room needs maintenance before it is sold again.',
    topicKeys: ['facilities', 'room-condition'],
  },
  {
    rating: 9.0,
    title: 'Clean and good value',
    positiveComment: 'Fresh sheets, a spotless bathroom, and a fair price for central Sydney.',
    negativeComment: null,
    reviewText: null,
    topicKeys: ['cleanliness', 'value', 'location'],
  },
  {
    rating: 5.2,
    title: 'Arrival support was disappointing',
    positiveComment: 'The room itself was acceptable.',
    negativeComment:
      'Reception was closed when we arrived and the staff response about the missing key was rude.',
    reviewText: 'The late check-in process needs a reliable support option.',
    topicKeys: ['check-in', 'staff'],
  },
  {
    rating: 7.1,
    title: null,
    positiveComment: 'Wi-Fi was quick and the shower worked well.',
    negativeComment: 'The lift was unavailable during part of the stay.',
    reviewText: 'A reasonable stay with one facilities issue.',
    topicKeys: ['facilities'],
  },
  {
    rating: 8.4,
    title: 'Small room, great sleep',
    positiveComment: 'The mattress and pillows were very comfortable and everything worked.',
    negativeComment: 'The room was smaller than expected.',
    reviewText: null,
    topicKeys: ['room-condition'],
  },
  {
    rating: 4.8,
    title: 'Too expensive for the room provided',
    positiveComment: 'Public transport was nearby.',
    negativeComment: 'The cramped old room felt overpriced for its condition.',
    reviewText: 'The price did not match the room quality.',
    topicKeys: ['value', 'room-condition', 'location'],
  },
  {
    rating: 9.5,
    title: 'Spotless room and thoughtful service',
    positiveComment:
      'The room and bathroom were spotless, and the manager quickly helped with our bags.',
    negativeComment: null,
    reviewText: 'We would happily stay again.',
    topicKeys: ['cleanliness', 'staff'],
  },
  {
    rating: 6.3,
    title: 'Convenient for a short visit',
    positiveComment: 'Central location with buses and restaurants nearby.',
    negativeComment: 'Thin walls meant we could hear other guests.',
    reviewText: null,
    topicKeys: ['location', 'noise'],
  },
];

function calendarDateParts(now: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: value('year'), month: value('month'), day: value('day') };
}

function comparableReviewDate(index: number, timeZone: string): Date {
  const { year, month, day } = calendarDateParts(new Date(), timeZone);
  const today = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  const currentMonday = new Date(today);
  currentMonday.setUTCDate(today.getUTCDate() - daysSinceMonday);

  const isPreviousPeriod = index % 2 === 1;
  const date = new Date(currentMonday);
  date.setUTCDate(
    currentMonday.getUTCDate() -
      (isPreviousPeriod ? 7 : 0) +
      (index % (daysSinceMonday + 1)),
  );
  return date;
}

function sentimentFor(rating: number): Sentiment {
  if (rating >= SENTIMENT_THRESHOLDS.positiveMinimum) return Sentiment.POSITIVE;
  if (rating >= SENTIMENT_THRESHOLDS.neutralMinimum) return Sentiment.NEUTRAL;
  return Sentiment.NEGATIVE;
}

function normalizeForFingerprint(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function fingerprintFor(input: {
  propertyId: string;
  reviewerName: string;
  reviewDate: Date;
  template: DemoReviewTemplate;
}): string {
  const normalized = [
    input.propertyId,
    input.reviewerName,
    input.reviewDate.toISOString().slice(0, 10),
    input.template.rating,
    input.template.positiveComment,
    input.template.negativeComment,
    input.template.reviewText,
  ]
    .map(normalizeForFingerprint)
    .join('|');

  return createHash('sha256').update(normalized).digest('hex');
}

export async function seedDemoReviews(prisma: PrismaClient): Promise<number> {
  const [properties, topics] = await Promise.all([
    prisma.property.findMany({ where: { active: true }, orderBy: { slug: 'asc' } }),
    prisma.topic.findMany({ where: { active: true } }),
  ]);

  if (properties.length !== 4 || topics.length !== 8) {
    throw new Error('Seed the four properties and eight topics before demo reviews.');
  }

  const timeZone = process.env.APP_TIMEZONE ?? 'Australia/Sydney';
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));
  const reviewInputs = properties.flatMap((property, propertyIndex) =>
    templates.map((template, templateIndex) => {
      const reviewer = reviewers[(templateIndex + propertyIndex * 3) % reviewers.length];
      const reviewDate = comparableReviewDate(templateIndex, timeZone);
      const reviewerName = reviewer[0];
      const externalReviewId = `synthetic-${property.slug}-${templateIndex + 1}`;

      return {
        property,
        template,
        externalReviewId,
        data: {
          propertyId: property.id,
          externalReviewId,
          fingerprint: fingerprintFor({
            propertyId: property.id,
            reviewerName,
            reviewDate,
            template,
          }),
          reviewerName,
          reviewerCountry: reviewer[1],
          rating: new Prisma.Decimal(template.rating),
          title: template.title,
          reviewText: template.reviewText,
          positiveComment: template.positiveComment,
          negativeComment: template.negativeComment,
          reviewDate,
          stayDate: templateIndex % 5 === 0 ? null : reviewDate,
          roomType: templateIndex % 4 === 0 ? null : 'Standard double room',
          travellerType: templateIndex % 3 === 0 ? 'Couple' : 'Solo traveller',
          nightsStayed: templateIndex % 5 === 0 ? null : (templateIndex % 4) + 1,
          sourceUrl: property.bookingUrl,
          sentiment: sentimentFor(template.rating),
          isSynthetic: true,
          scrapedAt: new Date(),
        } satisfies Prisma.ReviewUncheckedCreateInput,
      };
    }),
  );

  // Upsert by the source identifier so rerunning the seed updates changing
  // comparable-week dates without accumulating duplicate demo reviews.
  const reviews = await prisma.$transaction(
    reviewInputs.map((input) =>
      prisma.review.upsert({
        where: {
          propertyId_externalReviewId: {
            propertyId: input.property.id,
            externalReviewId: input.externalReviewId,
          },
        },
        create: input.data,
        update: input.data,
        select: { id: true, externalReviewId: true },
      }),
    ),
  );

  const inputByExternalId = new Map(
    reviewInputs.map((input) => [input.externalReviewId, input]),
  );
  const reviewTopicRows: Prisma.ReviewTopicCreateManyInput[] = reviews.flatMap((review) => {
    const input = inputByExternalId.get(review.externalReviewId ?? '');
    if (!input) return [];

    return input.template.topicKeys.map((topicKey) => {
      const topic = topicByKey.get(topicKey);
      if (!topic) throw new Error(`Unknown demo topic: ${topicKey}`);

      return {
        reviewId: review.id,
        topicId: topic.id,
        sentiment: sentimentFor(input.template.rating),
        confidence: new Prisma.Decimal('1.000'),
        matchedText: `Synthetic demo classification: ${topic.displayName}`,
      };
    });
  });

  await prisma.$transaction([
    prisma.reviewTopic.deleteMany({
      where: { reviewId: { in: reviews.map((review) => review.id) } },
    }),
    prisma.reviewTopic.createMany({ data: reviewTopicRows }),
  ]);

  return reviews.length;
}
