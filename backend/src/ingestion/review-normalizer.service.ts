import { Injectable } from '@nestjs/common';
import { NormalizedReview, RawCollectedReview } from './ingestion.types';

const MONTHS = new Map(
  [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ].map((month, index) => [month, index]),
);

function optionalText(value: string | null | undefined, maximum: number): string | null {
  const cleaned = value?.normalize('NFKC').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maximum) : null;
}

function requiredUrl(value: string): string {
  const cleaned = optionalText(value, 500);
  if (!cleaned) throw new Error('A collected review must include its public source URL.');

  try {
    const url = new URL(cleaned);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString().slice(0, 500);
  } catch {
    throw new Error('The collected review source URL is invalid.');
  }
}

@Injectable()
export class ReviewNormalizerService {
  normalize(raw: RawCollectedReview): NormalizedReview {
    const rating = this.parseRating(raw.ratingText);
    const reviewDate = this.parseDate(raw.reviewDateText, true);
    const stayDate = this.parseDate(raw.stayDateText, false);
    if (!reviewDate) throw new Error('The collected review date is missing.');
    const title = optionalText(raw.title, 500);
    const reviewText = optionalText(raw.reviewText, 20_000);
    const positiveComment = optionalText(raw.positiveComment, 20_000);
    const negativeComment = optionalText(raw.negativeComment, 20_000);

    if (!title && !reviewText && !positiveComment && !negativeComment) {
      throw new Error('The collected review has no readable feedback text.');
    }

    return {
      externalReviewId: optionalText(raw.externalReviewId, 160),
      reviewerName: optionalText(raw.reviewerName, 160),
      reviewerCountry: optionalText(raw.reviewerCountry, 100),
      rating,
      title,
      reviewText,
      positiveComment,
      negativeComment,
      reviewDate,
      stayDate,
      roomType: optionalText(raw.roomType, 200),
      travellerType: optionalText(raw.travellerType, 100),
      nightsStayed: this.parseNights(raw.nightsStayedText),
      sourceUrl: requiredUrl(raw.sourceUrl),
    };
  }

  private parseRating(value: string | null | undefined): number {
    const match = value?.replace(',', '.').match(/\d+(?:\.\d+)?/);
    const rating = match ? Number(match[0]) : Number.NaN;
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      throw new Error('The collected review rating must be between 0 and 10.');
    }
    return Math.round(rating * 10) / 10;
  }

  private parseDate(value: string | null | undefined, required: boolean): Date | null {
    const cleaned = optionalText(value, 120)
      ?.replace(/^(reviewed|review date|date of stay|stayed)\s*:?\s*/i, '')
      .replace(/^in\s+/i, '');

    if (!cleaned) {
      if (required) throw new Error('The collected review date is missing.');
      return null;
    }

    const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return this.utcDate(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    }

    const namedMatch = cleaned.match(/(?:[A-Za-z]+,\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (namedMatch) {
      const month = MONTHS.get(namedMatch[2].toLowerCase());
      if (month !== undefined) {
        return this.utcDate(Number(namedMatch[3]), month, Number(namedMatch[1]));
      }
    }

    // Month-only stay dates are not precise enough for a database date.
    if (/^[A-Za-z]+\s+\d{4}$/.test(cleaned)) return null;

    const timestamp = Date.parse(cleaned);
    if (Number.isFinite(timestamp)) {
      const parsed = new Date(timestamp);
      return this.utcDate(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
    }

    if (required) throw new Error(`Unable to parse review date: ${cleaned}`);
    return null;
  }

  private utcDate(year: number, month: number, day: number): Date {
    const date = new Date(Date.UTC(year, month, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month ||
      date.getUTCDate() !== day
    ) {
      throw new Error('The collected review contains an invalid calendar date.');
    }
    return date;
  }

  private parseNights(value: string | null | undefined): number | null {
    const match = value?.match(/\d+/);
    if (!match) return null;
    const nights = Number(match[0]);
    return Number.isInteger(nights) && nights > 0 && nights <= 365 ? nights : null;
  }
}
