import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ScraperService } from './scraper.service';

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  const logger = new Logger('ReviewCollectionCli');

  try {
    const propertyIds = process.argv.slice(2).filter((value) => !value.startsWith('-'));
    const result = await app
      .get(ScraperService)
      .runAndWait(propertyIds.length ? propertyIds : undefined);
    logger.log(JSON.stringify(result));
  } finally {
    await app.close();
  }
}

run().catch((error: unknown) => {
  const logger = new Logger('ReviewCollectionCli');
  logger.error(error instanceof Error ? error.message : 'Review collection failed.');
  process.exitCode = 1;
});
