import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

function commaSeparatedValues(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const values = Array.isArray(value) ? value : String(value).split(',');
  return values
    .map(String)
    .map((item) => item.trim())
    .filter(Boolean);
}

export class AnalyticsQueryDto {
  @IsOptional()
  @Transform(({ value }) => commaSeparatedValues(value))
  @IsUUID('all', { each: true })
  propertyIds?: string[];

  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
