import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsQueryDto } from '../common/dto/analytics-query.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get current and previous comparable-period KPIs' })
  overview(@Query() query: AnalyticsQueryDto) {
    return this.dashboardService.overview(query);
  }
}
