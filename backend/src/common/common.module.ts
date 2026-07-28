import { Global, Module } from '@nestjs/common';
import { DatePeriodService } from './services/date-period.service';

@Global()
@Module({
  providers: [DatePeriodService],
  exports: [DatePeriodService],
})
export class CommonModule {}
