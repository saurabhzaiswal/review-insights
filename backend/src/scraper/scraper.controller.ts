import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ScraperRunsQueryDto } from './dto/scraper-runs-query.dto';
import { StartScraperDto } from './dto/start-scraper.dto';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  sync(@Body() body: StartScraperDto) {
    return this.scraperService.start(body.propertyIds);
  }

  @Get('status')
  status() {
    return this.scraperService.status();
  }

  @Get('runs')
  runs(@Query() query: ScraperRunsQueryDto) {
    return this.scraperService.listRuns(query.limit);
  }
}
