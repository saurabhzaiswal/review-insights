export type AppEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  NODE_ENV: AppEnvironment;
  PORT: number;
  APP_NAME: string;
  APP_VERSION: string;
  APP_TIMEZONE: string;
  CORS_ORIGINS: string;
  DATABASE_URL: string;
  SCRAPER_HEADLESS: boolean;
  SCRAPER_MAX_PAGES: number;
  SCRAPER_TIMEOUT_MS: number;
  SCRAPER_DELAY_MS: number;
}

const supportedEnvironments: AppEnvironment[] = ['development', 'test', 'production'];

function integerInRange(
  value: unknown,
  fallback: number,
  name: string,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return parsed;
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const nodeEnv = String(config.NODE_ENV ?? 'development') as AppEnvironment;
  const port = Number(config.PORT ?? 3000);
  const appName = String(config.APP_NAME ?? 'Azzurro Review Insights API').trim();
  const appVersion = String(config.APP_VERSION ?? '0.1.0').trim();
  const appTimezone = String(config.APP_TIMEZONE ?? 'Australia/Sydney').trim();
  const corsOrigins = String(config.CORS_ORIGINS ?? 'http://localhost:5173').trim();
  const databaseUrl = String(config.DATABASE_URL ?? '').trim();
  const scraperHeadless = String(config.SCRAPER_HEADLESS ?? 'true').toLowerCase() !== 'false';
  const scraperMaxPages = integerInRange(config.SCRAPER_MAX_PAGES, 3, 'SCRAPER_MAX_PAGES', 1, 20);
  const scraperTimeoutMs = integerInRange(
    config.SCRAPER_TIMEOUT_MS,
    30_000,
    'SCRAPER_TIMEOUT_MS',
    5_000,
    120_000,
  );
  const scraperDelayMs = integerInRange(
    config.SCRAPER_DELAY_MS,
    1_200,
    'SCRAPER_DELAY_MS',
    250,
    10_000,
  );

  if (!supportedEnvironments.includes(nodeEnv)) {
    throw new Error(`NODE_ENV must be one of: ${supportedEnvironments.join(', ')}`);
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  if (!appName) {
    throw new Error('APP_NAME cannot be empty');
  }

  if (!appVersion) {
    throw new Error('APP_VERSION cannot be empty');
  }

  try {
    new Intl.DateTimeFormat('en-AU', { timeZone: appTimezone }).format();
  } catch {
    throw new Error('APP_TIMEZONE must be a valid IANA timezone');
  }

  if (!corsOrigins) {
    throw new Error('CORS_ORIGINS must contain at least one allowed origin');
  }

  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    APP_NAME: appName,
    APP_VERSION: appVersion,
    APP_TIMEZONE: appTimezone,
    CORS_ORIGINS: corsOrigins,
    DATABASE_URL: databaseUrl,
    SCRAPER_HEADLESS: scraperHeadless,
    SCRAPER_MAX_PAGES: scraperMaxPages,
    SCRAPER_TIMEOUT_MS: scraperTimeoutMs,
    SCRAPER_DELAY_MS: scraperDelayMs,
  };
}

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
