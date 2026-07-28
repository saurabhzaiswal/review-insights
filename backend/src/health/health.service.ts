import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/environment';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables, true>) {}

  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: this.configService.get('APP_NAME', { infer: true }),
      environment: this.configService.get('NODE_ENV', { infer: true }),
      version: this.configService.get('APP_VERSION', { infer: true }),
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(2)),
    };
  }
}
