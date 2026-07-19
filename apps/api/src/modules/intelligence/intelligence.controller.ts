import { Controller, Get, Param, Post, Body, Query, NotFoundException } from '@nestjs/common'
import { IntelligenceService } from './intelligence.service'

@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly svc: IntelligenceService) {}

  @Post('feasibility')
  feasibility(@Body() body: { city: string; district: string; budget: number }) {
    if (!body.city?.trim() || !body.district?.trim()) throw new NotFoundException('城市和区域不能为空')
    return this.svc.generateFeasibilityReport(body.city.trim(), body.district.trim(), body.budget || 300)
  }

  @Get('operations/:storeId')
  operations(@Param('storeId') storeId: string, @Query('category') category?: string) {
    return this.svc.generateOperationAdvice(storeId, category)
  }

  @Get('monitor/:storeId')
  monitor(@Param('storeId') storeId: string, @Query('city') city?: string) {
    return this.svc.monitorCompetitor(storeId, city)
  }
}
