import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UsePipes, ValidationPipe, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common'
import { CompetitorTrackService } from './competitor-track.service'
import { TrackQueryDto, CreateCompetitorDto, UpdateCompetitorDto } from './competitor-track.dto'
import type { CompetitorDto, TrackSummaryDto, CompetitorListDto } from './competitor-track.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('competitor-track')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class CompetitorTrackController {
  constructor(private readonly competitorTrackService: CompetitorTrackService) {}

  /** GET /competitor-track - 竞品列表 */
  @Get()
  async findAll(@Query() query: TrackQueryDto): Promise<{ success: boolean; data: CompetitorListDto }> {
    const items = await this.competitorTrackService.findAll(query.city, query.category, query.minRating)
    return {
      success: true,
      data: {
        items,
        total: items.length,
        page: 1,
        pageSize: items.length
      }
    }
  }

  /** GET /competitor-track/summary - 竞品汇总 */
  @Get('summary')
  async getSummary(): Promise<{ success: boolean; data: TrackSummaryDto }> {
    const summary = await this.competitorTrackService.getSummary()
    return { success: true, data: summary }
  }

  /** GET /competitor-track/comparison - 竞品对比分析 */
  @Get('comparison')
  async getComparison(@Query('ids') ids: string): Promise<{
    success: boolean
    data: { competitors: CompetitorDto[]; comparison: { avgRating: number; avgPriceLevel: number; totalVisitors: number; bestRated: string; mostVisited: string } }
  }> {
    if (!ids) {
      throw new BadRequestException('ids query parameter is required (comma-separated)')
    }
    const idList = ids.split(',').map(id => id.trim())
    const result = await this.competitorTrackService.getComparison(idList)
    return { success: true, data: result }
  }

  /** GET /competitor-track/:id - 按 ID 查询 */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<{ success: boolean; data: CompetitorDto | null }> {
    const competitor = await this.competitorTrackService.findById(id)
    if (!competitor) {
      throw new NotFoundException(`Competitor with id "${id}" not found`)
    }
    return { success: true, data: competitor }
  }

  /** POST /competitor-track - 创建竞品 */
  @Post()
  async create(@Body() body: CreateCompetitorDto): Promise<{ success: boolean; data: CompetitorDto }> {
    const result = await this.competitorTrackService.create(body)
    return { success: true, data: result }
  }

  /** PATCH /competitor-track/:id - 更新竞品 */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCompetitorDto
  ): Promise<{ success: boolean; data: CompetitorDto }> {
    const result = await this.competitorTrackService.update(id, body)
    return { success: true, data: result }
  }

  /** DELETE /competitor-track/:id - 删除竞品 */
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    await this.competitorTrackService.delete(id)
    return { success: true, message: `Competitor "${id}" deleted successfully` }
  }
}
