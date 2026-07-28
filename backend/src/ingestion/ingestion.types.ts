import { Sentiment } from '@prisma/client';

export interface RawCollectedReview {
  externalReviewId?: string | null;
  reviewerName?: string | null;
  reviewerCountry?: string | null;
  ratingText?: string | null;
  title?: string | null;
  reviewText?: string | null;
  positiveComment?: string | null;
  negativeComment?: string | null;
  reviewDateText?: string | null;
  stayDateText?: string | null;
  roomType?: string | null;
  travellerType?: string | null;
  nightsStayedText?: string | null;
  sourceUrl: string;
}

export interface NormalizedReview {
  externalReviewId: string | null;
  reviewerName: string | null;
  reviewerCountry: string | null;
  rating: number;
  title: string | null;
  reviewText: string | null;
  positiveComment: string | null;
  negativeComment: string | null;
  reviewDate: Date;
  stayDate: Date | null;
  roomType: string | null;
  travellerType: string | null;
  nightsStayed: number | null;
  sourceUrl: string;
}

export interface TopicClassification {
  key: string;
  sentiment: Sentiment;
  confidence: number;
  matchedText: string;
}

export interface ClassifiedReview {
  sentiment: Sentiment;
  topics: TopicClassification[];
}
