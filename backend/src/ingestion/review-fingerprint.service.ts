import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { NormalizedReview } from './ingestion.types';

function stable(value: string | null): string {
  return value?.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim() ?? '';
}

@Injectable()
export class ReviewFingerprintService {
  create(propertyId: string, review: NormalizedReview): string {
    const content = [
      propertyId,
      review.reviewDate.toISOString().slice(0, 10),
      review.rating.toFixed(1),
      stable(review.reviewerName),
      stable(review.title),
      stable(review.reviewText),
      stable(review.positiveComment),
      stable(review.negativeComment),
    ].join('\u001f');

    return createHash('sha256').update(content, 'utf8').digest('hex');
  }
}
