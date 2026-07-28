import { Property } from '@prisma/client';
import { RawCollectedReview } from '../ingestion/ingestion.types';

export type CollectableProperty = Pick<Property, 'id' | 'slug' | 'name' | 'bookingUrl'>;

export interface CollectionResult {
  reviews: RawCollectedReview[];
  pagesVisited: number;
  selectorVersion: string;
  warnings: string[];
}

export interface IngestionResult {
  inserted: number;
  updated: number;
  duplicatesSkipped: number;
  rejected: number;
  errors: string[];
}
