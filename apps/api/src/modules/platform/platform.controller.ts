import { Controller, Get, Post, Body } from '@nestjs/common';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformController {
  constructor(private readonly svc: PlatformService) {}

  @Get()
  overview() { return this.svc.getOverview(); }

  @Get('health')
  health() { return this.svc.checkHealth(); }

  @Get('uptime')
  uptime() { return { uptime: this.svc.getUptime() }; }

  @Post('metrics')
  recordMetric(@Body() body: { name: string; value: number; unit: string }) {
    return this.svc.recordMetric(body.name, body.value, body.unit);
  }
}
