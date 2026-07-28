import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 'Azzurro Review Insights API' })
  service!: string;

  @ApiProperty({ example: 'development' })
  environment!: string;

  @ApiProperty({ example: '0.1.0' })
  version!: string;

  @ApiProperty({ example: '2026-07-28T05:30:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 42.18, description: 'Process uptime in seconds' })
  uptimeSeconds!: number;
}
