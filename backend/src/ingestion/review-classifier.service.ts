import { Injectable } from '@nestjs/common';
import { Sentiment } from '@prisma/client';
import { SENTIMENT_THRESHOLDS } from '../common/constants/sentiment.constants';
import { ClassifiedReview, NormalizedReview, TopicClassification } from './ingestion.types';

const TOPIC_RULES = [
  {
    key: 'cleanliness',
    phrases: ['clean', 'dirty', 'spotless', 'hygiene', 'mould', 'mold', 'dust', 'stain'],
  },
  {
    key: 'check-in',
    phrases: ['check-in', 'check in', 'arrival', 'access code', 'room key', 'key card'],
  },
  {
    key: 'staff',
    phrases: ['staff', 'receptionist', 'manager', 'service', 'rude', 'helpful', 'friendly'],
  },
  {
    key: 'noise',
    phrases: ['noise', 'noisy', 'loud', 'quiet', 'street sound', 'traffic sound', 'nightclub'],
  },
  {
    key: 'facilities',
    phrases: [
      'wifi',
      'wi-fi',
      'lift',
      'elevator',
      'air conditioning',
      'shower',
      'kitchen',
      'laundry',
    ],
  },
  {
    key: 'location',
    phrases: ['location', 'station', 'transport', 'walking distance', 'central', 'nearby'],
  },
  {
    key: 'room-condition',
    phrases: ['room', 'bed', 'mattress', 'broken', 'maintenance', 'cramped', 'window', 'carpet'],
  },
  {
    key: 'value',
    phrases: ['value', 'price', 'expensive', 'cheap', 'cost', 'overpriced', 'money'],
  },
] as const;

function searchable(...values: Array<string | null>): string {
  return values
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matches(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'iu').test(text);
}

@Injectable()
export class ReviewClassifierService {
  classify(review: NormalizedReview): ClassifiedReview {
    const sentiment = this.sentimentForRating(review.rating);
    const positiveText = searchable(review.positiveComment);
    const negativeText = searchable(review.negativeComment);
    const generalText = searchable(review.title, review.reviewText);

    const topics = TOPIC_RULES.flatMap<TopicClassification>((rule) => {
      const negativeMatches = rule.phrases.filter((phrase) => matches(negativeText, phrase));
      const positiveMatches = rule.phrases.filter((phrase) => matches(positiveText, phrase));
      const generalMatches = rule.phrases.filter((phrase) => matches(generalText, phrase));
      const matched = [...new Set([...negativeMatches, ...positiveMatches, ...generalMatches])];
      if (!matched.length) return [];

      const topicSentiment = negativeMatches.length
        ? Sentiment.NEGATIVE
        : positiveMatches.length
          ? Sentiment.POSITIVE
          : sentiment;

      return [
        {
          key: rule.key,
          sentiment: topicSentiment,
          confidence: Math.min(0.95, 0.65 + (matched.length - 1) * 0.1),
          matchedText: matched.slice(0, 4).join(', '),
        },
      ];
    });

    return { sentiment, topics };
  }

  sentimentForRating(rating: number): Sentiment {
    if (rating >= SENTIMENT_THRESHOLDS.positiveMinimum) return Sentiment.POSITIVE;
    if (rating >= SENTIMENT_THRESHOLDS.neutralMinimum) return Sentiment.NEUTRAL;
    return Sentiment.NEGATIVE;
  }
}
