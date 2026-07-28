import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Locator, Page, chromium } from 'playwright';
import { EnvironmentVariables } from '../config/environment';
import { RawCollectedReview } from '../ingestion/ingestion.types';
import { BOOKING_REVIEW_SELECTORS, BOOKING_SELECTOR_VERSION } from './booking-review.selectors';
import { CollectableProperty, CollectionResult } from './scraper.types';

export class CollectionBlockedError extends Error {}

@Injectable()
export class BookingReviewCollector {
  private readonly logger = new Logger(BookingReviewCollector.name);

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  async collect(property: CollectableProperty): Promise<CollectionResult> {
    const headless = this.config.get('SCRAPER_HEADLESS', { infer: true });
    const timeout = this.config.get('SCRAPER_TIMEOUT_MS', { infer: true });
    const maxPages = this.config.get('SCRAPER_MAX_PAGES', { infer: true });
    const delay = this.config.get('SCRAPER_DELAY_MS', { infer: true });
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext({
      locale: 'en-AU',
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(timeout);

    const warnings: string[] = [];
    const reviews: RawCollectedReview[] = [];
    let pagesVisited = 0;

    try {
      await page.goto(property.bookingUrl, {
        waitUntil: 'domcontentloaded',
        timeout,
      });
      await this.assertNotBlocked(page);
      await this.clickFirstVisible(page, BOOKING_REVIEW_SELECTORS.cookieConsent);
      await this.clickFirstVisible(page, BOOKING_REVIEW_SELECTORS.reviewSection);
      await page
        .locator('[data-testid="fr-read-all-reviews"]')
        .first()
        .waitFor({ state: 'visible', timeout: Math.min(timeout, 10_000) })
        .catch(() => undefined);
      const openedReviews = await this.openReviewDialog(page);
      if (!openedReviews) {
        throw new Error('The public page did not expose its review dialog control.');
      }
      try {
        await this.revealAllReviews(page);
        await this.waitForReviewCards(page);
      } catch {
        await this.saveDiagnosticScreenshot(page, `${property.slug}-property-page`);
        throw new Error('The public review dialog opened, but no review cards became available.');
      }

      for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
        await this.assertNotBlocked(page);
        const pageReviews = await this.extractPage(page, property.bookingUrl);
        if (!pageReviews.length) {
          if (!reviews.length) throw new Error('No public review cards were found.');
          warnings.push(`No review cards were found on page ${pageNumber}.`);
          break;
        }

        reviews.push(...pageReviews);
        pagesVisited += 1;
        if (pageNumber === maxPages) break;

        const next = await this.firstVisible(page, BOOKING_REVIEW_SELECTORS.nextPage);
        if (!next || (await next.isDisabled().catch(() => false))) break;

        const firstCardText = await this.cardLocator(page).first().textContent();
        try {
          await next.click();
          await page.waitForTimeout(delay);
          await page.waitForFunction(
            ({ selector, previous }) => document.querySelector(selector)?.textContent !== previous,
            {
              selector: BOOKING_REVIEW_SELECTORS.card.join(', '),
              previous: firstCardText,
            },
            { timeout },
          );
        } catch (error) {
          warnings.push(`Pagination stopped after page ${pageNumber}: ${this.safeMessage(error)}`);
          break;
        }
      }

      return {
        reviews,
        pagesVisited,
        selectorVersion: BOOKING_SELECTOR_VERSION,
        warnings,
      };
    } catch (error) {
      await this.saveDiagnosticScreenshot(page, property.slug);
      throw error;
    } finally {
      await context.close().catch(() => undefined);
      await browser.close().catch(() => undefined);
    }
  }

  private async extractPage(page: Page, sourceUrl: string): Promise<RawCollectedReview[]> {
    const cards = this.cardLocator(page);
    const count = await cards.count();
    const reviews: RawCollectedReview[] = [];

    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);
      const reviewer = await this.reviewerDetails(card);
      reviews.push({
        externalReviewId: await this.reviewId(card),
        reviewerName:
          (await this.firstText(card, BOOKING_REVIEW_SELECTORS.reviewerName)) ?? reviewer.name,
        reviewerCountry:
          (await this.firstText(card, BOOKING_REVIEW_SELECTORS.reviewerCountry)) ??
          reviewer.country,
        ratingText: await this.firstText(card, BOOKING_REVIEW_SELECTORS.rating),
        title: await this.firstText(card, BOOKING_REVIEW_SELECTORS.title),
        reviewText: await this.firstText(card, BOOKING_REVIEW_SELECTORS.reviewText),
        positiveComment: await this.firstText(card, BOOKING_REVIEW_SELECTORS.positiveComment),
        negativeComment: await this.firstText(card, BOOKING_REVIEW_SELECTORS.negativeComment),
        reviewDateText: await this.firstText(card, BOOKING_REVIEW_SELECTORS.reviewDate),
        stayDateText: await this.firstText(card, BOOKING_REVIEW_SELECTORS.stayDate),
        roomType: await this.firstText(card, BOOKING_REVIEW_SELECTORS.roomType),
        travellerType: await this.firstText(card, BOOKING_REVIEW_SELECTORS.travellerType),
        nightsStayedText: await this.firstText(card, BOOKING_REVIEW_SELECTORS.nightsStayed),
        sourceUrl,
      });
    }

    return reviews;
  }

  private cardLocator(page: Page): Locator {
    return page.locator(BOOKING_REVIEW_SELECTORS.card.join(', '));
  }

  private async waitForReviewCards(page: Page): Promise<void> {
    await this.cardLocator(page).first().waitFor({ state: 'visible' });
  }

  private async openReviewDialog(page: Page): Promise<boolean> {
    const button = page.getByRole('button', { name: /read all reviews/i }).first();
    if ((await button.count()) && (await button.isVisible().catch(() => false))) {
      await button.click();
      await page.waitForTimeout(750);
      return true;
    }

    return this.clickFirstVisible(page, BOOKING_REVIEW_SELECTORS.openReviews);
  }

  private async revealAllReviews(page: Page): Promise<void> {
    // The review dialog can initially retain a previous filter state. Booking
    // renders the reset action as different element types across page variants,
    // so target its accessible text instead of coupling this flow to a tag name.
    await page.waitForTimeout(500);
    if (
      await this.cardLocator(page)
        .first()
        .isVisible()
        .catch(() => false)
    )
      return;

    const showAll = page.getByText('Show all reviews', { exact: true }).first();
    if ((await showAll.count()) && (await showAll.isVisible().catch(() => false))) {
      await showAll.click();
      await page.waitForTimeout(750);

      // Resetting modal filters can close the dialog on some Booking page
      // variants. Reopen it once so extraction sees the unfiltered cards.
      if (
        !(await this.cardLocator(page)
          .first()
          .isVisible()
          .catch(() => false))
      ) {
        await this.openReviewDialog(page);
      }
    }
  }

  private async reviewId(card: Locator): Promise<string | null> {
    for (const attribute of ['data-review-id', 'data-id', 'id']) {
      const value = await card.getAttribute(attribute);
      if (value?.trim()) return value.trim();
    }
    return null;
  }

  private async reviewerDetails(
    card: Locator,
  ): Promise<{ name: string | null; country: string | null }> {
    const avatar = card.locator('[data-testid="review-avatar"]').first();
    if (!(await avatar.count())) return { name: null, country: null };

    return avatar.evaluate((element) => {
      const leafText = Array.from(element.querySelectorAll('div,span'))
        .filter((child) => child.children.length === 0)
        .map((child) => child.textContent?.trim() ?? '')
        .filter(Boolean);
      const name =
        leafText.find((text) => !/\breviews?\b/i.test(text) && !/^\d+$/.test(text)) ?? null;
      const country =
        [...leafText]
          .reverse()
          .find((text) => text !== name && !/\breviews?\b/i.test(text) && !/^\d+$/.test(text)) ??
        null;
      return { name, country };
    });
  }

  private async firstText(root: Locator, selectors: readonly string[]): Promise<string | null> {
    for (const selector of selectors) {
      const locator = root.locator(selector).first();
      if ((await locator.count()) && (await locator.isVisible().catch(() => false))) {
        const text = await locator.textContent();
        if (text?.trim()) return text.trim();
      }
    }
    return null;
  }

  private async clickFirstVisible(page: Page, selectors: readonly string[]): Promise<boolean> {
    const locator = await this.firstVisible(page, selectors);
    if (!locator) return false;
    try {
      await locator.click();
      return true;
    } catch {
      return false;
    }
  }

  private async firstVisible(page: Page, selectors: readonly string[]): Promise<Locator | null> {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      if ((await locator.count()) && (await locator.isVisible().catch(() => false))) {
        return locator;
      }
    }
    return null;
  }

  private async assertNotBlocked(page: Page): Promise<void> {
    const body = (
      await page
        .locator('body')
        .innerText()
        .catch(() => '')
    ).slice(0, 20_000);
    if (
      /verify that you.re not a robot|captcha|access denied|unusual traffic|security check/i.test(
        body,
      )
    ) {
      throw new CollectionBlockedError(
        'Booking.com requested an access verification. The collector stopped safely.',
      );
    }
    if (/page not found|we (?:could not|couldn't|cannot) find that page/i.test(body)) {
      throw new Error('Booking.com no longer exposes reviews at the configured public page path.');
    }
  }

  private async saveDiagnosticScreenshot(page: Page, slug: string): Promise<void> {
    if (this.config.get('NODE_ENV', { infer: true }) === 'production') return;
    try {
      const directory = join(process.cwd(), '.scraper-debug');
      await mkdir(directory, { recursive: true });
      await page.screenshot({
        path: join(directory, `${slug}-${Date.now()}.png`),
        fullPage: false,
      });
    } catch (error) {
      this.logger.debug(`Diagnostic screenshot unavailable: ${this.safeMessage(error)}`);
    }
  }

  private safeMessage(error: unknown): string {
    return error instanceof Error
      ? error.message.replace(/\u001b\[[0-9;]*m/g, '').slice(0, 300)
      : 'Unknown browser error';
  }
}
