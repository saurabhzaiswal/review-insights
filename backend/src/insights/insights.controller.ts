import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsQueryDto } from '../common/dto/analytics-query.dto';
import { InsightsService } from './insights.service';

@ApiTags('Insights')
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'Get evidence-backed operational insight statements' })
  findAll(@Query() query: AnalyticsQueryDto) {
    return this.insightsService.findAll(query);
  }
}
