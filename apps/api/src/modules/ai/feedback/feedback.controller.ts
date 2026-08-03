import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { TenantGuard } from '../../agent/tenant.guard'

@Controller('ai/feedback')
@UseGuards(TenantGuard)
export class FeedbackController {
  constructor(private readonly svc: FeedbackService) {}

  @Post()
  submit(@Body() body: {
    userId: string; tenantId: string; type: string; score: number;
    content: string; source: string; category: string; metadata?: Record<string, unknown>;
  }) {
    return this.svc.submit({
      userId: body.userId, tenantId: body.tenantId,
      type: body.type as 'rating' | 'comment' | 'report' | 'suggestion',
      score: body.score, content: body.content, source: body.source,
      category: body.category, metadata: body.metadata ?? {},
    });
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string, @Body() body: { resolution: string }) {
    return this.svc.resolve(id, body.resolution);
  }

  @Get()
  list(
    @Query('tenantId') tenantId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.svc.list({
      tenantId, type,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
  }

  @Get('stats')
  stats(@Query('tenantId') tenantId?: string) {
    return this.svc.getStats(tenantId);
  }
}
