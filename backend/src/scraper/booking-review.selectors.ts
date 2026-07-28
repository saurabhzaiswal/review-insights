/**
 * Booking.com changes its markup regularly. Keeping fallbacks in one place
 * makes selector maintenance observable and avoids spreading page knowledge
 * across persistence code.
 */
export const BOOKING_REVIEW_SELECTORS = {
  cookieConsent: [
    '#onetrust-accept-btn-handler',
    'button[data-testid="accept-all"]',
    'button[aria-label*="Accept"]',
  ],
  reviewSection: [
    '[data-testid="Property-Header-Nav-Tab-Trigger-reviews"]',
    'a[href="#blockdisplay4"]',
  ],
  openReviews: [
    '[data-testid="fr-read-all-reviews"]',
    '[data-testid="review-score-read-all-actionable"]',
    'a[data-testid="reviews-link"]',
    '[data-testid="review-score-right-component"] button',
  ],
  card: ['[data-testid="review-card"]', '.review_list_new_item_block', '.c-review-block'],
  reviewerName: [
    '[data-testid="reviewer-name"]',
    '.bui-avatar-block__title',
    '.c-review-block__guest',
  ],
  reviewerCountry: [
    '[data-testid="reviewer-country"]',
    '.bui-avatar-block__subtitle',
    '.c-review-block__country',
  ],
  rating: ['[data-testid="review-score"]', '.bui-review-score__badge', '.c-review-block__rating'],
  title: ['[data-testid="review-title"]', '.c-review-block__title'],
  reviewText: ['[data-testid="review-text"]', '.c-review__body'],
  positiveComment: [
    '[data-testid="review-positive-text"]',
    '.c-review__row--positive .c-review__body',
  ],
  negativeComment: [
    '[data-testid="review-negative-text"]',
    '.c-review__row--negative .c-review__body',
  ],
  reviewDate: ['[data-testid="review-date"]', '.c-review-block__date'],
  stayDate: ['[data-testid="review-stay-date"]', '.c-review-block__stay-date'],
  roomType: ['[data-testid="review-room-name"]', '.c-review-block__room-info'],
  travellerType: [
    '[data-testid="review-traveller-type"]',
    '[data-testid="review-traveler-type"]',
    '.c-review-block__travel-purpose',
  ],
  nightsStayed: [
    '[data-testid="review-nights"]',
    '[data-testid="review-num-nights"]',
    '.c-review-block__stay-date',
  ],
  nextPage: [
    'button[aria-label="Next page"]',
    'button[data-testid="pagination-next"]',
    '.bui-pagination__next-arrow',
  ],
} as const;

export const BOOKING_SELECTOR_VERSION = '2026-07-28';
