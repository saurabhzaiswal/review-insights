import { Module } from '@nestjs/common';
import { ReviewClassifierService } from './review-classifier.service';
import { ReviewFingerprintService } from './review-fingerprint.service';
import { ReviewNormalizerService } from './review-normalizer.service';

@Module({
  providers: [ReviewNormalizerService, ReviewFingerprintService, ReviewClassifierService],
  exports: [ReviewNormalizerService, ReviewFingerprintService, ReviewClassifierService],
})
export class IngestionModule {}
