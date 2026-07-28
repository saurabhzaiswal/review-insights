import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { BookingReviewCollector } from './booking-review.collector';
import { ReviewIngestionService } from './review-ingestion.service';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';

@Module({
  imports: [IngestionModule],
  controllers: [ScraperController],
  providers: [BookingReviewCollector, ReviewIngestionService, ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
