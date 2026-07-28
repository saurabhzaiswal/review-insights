import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class StartScraperDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsUUID('7', { each: true })
  propertyIds?: string[];
}
