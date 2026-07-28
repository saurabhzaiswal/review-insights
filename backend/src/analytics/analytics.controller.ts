import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsQueryDto } from '../common/dto/analytics-query.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('property-ratings')
  @ApiOperation({ summary: 'Compare rating performance by property' })
  propertyRatings(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.propertyRatings(query);
  }

  @Get('rating-trend')
  @ApiOperation({ summary: 'Get daily average rating trend' })
  ratingTrend(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.ratingTrend(query);
  }

  @Get('sentiment-trend')
  @ApiOperation({ summary: 'Get daily positive, neutral, and negative counts' })
  sentimentTrend(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.sentimentTrend(query);
  }

  @Get('topics')
  @ApiOperation({ summary: 'Get operational topic frequency' })
  topics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.topics(query);
  }
}
