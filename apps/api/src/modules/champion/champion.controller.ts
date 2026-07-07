/**
 * Champion Controller
 *
 * Champion Dashboard API 端点
 * - POST /champions — 注册 Champion
 * - POST /champions/contribution — 记录知识贡献
 * - GET /champions — 列出 Champion
 * - GET /champions/ranking — 排行榜
 * - GET /champions/timeline — 决策时间线
 * - GET /champions/knowledge-map — 知识地图
 * - GET /champions/:id — 查询单个 Champion
 */

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  RegisterChampionDto,
  RecordContributionDto,
  RankingQueryDto,
  TimelineQueryDto,
} from './champion.dto';
import { ChampionService } from './champion.service';

@Controller('champions')
export class ChampionController {
  constructor(private readonly championService: ChampionService) {}

  @Post()
  registerChampion(@Body() body: RegisterChampionDto) {
    return this.championService.registerChampion({
      name: body.name,
      role: body.role as any,
      joinedAt: body.joinedAt,
    });
  }

  @Post('contribution')
  recordContribution(@Body() body: RecordContributionDto) {
    return this.championService.recordContribution({
      championId: body.championId,
      kind: body.kind as any,
      refId: body.refId,
      description: body.description,
      occurredAt: body.occurredAt,
    });
  }

  @Get()
  listChampions(@Query('role') role?: string) {
    return this.championService.listChampions(role as any);
  }

  @Get('ranking')
  getRanking(@Query() _query: RankingQueryDto) {
    return this.championService.getRanking();
  }

  @Get('timeline')
  getDecisionTimeline(@Query() query: TimelineQueryDto) {
    return this.championService.getDecisionTimeline({
      championId: query.championId,
      sinceDate: query.sinceDate,
    });
  }

  @Get('knowledge-map')
  getKnowledgeMap() {
    return this.championService.getKnowledgeMap();
  }

  @Get(':id')
  getChampion(@Param('id') id: string) {
    const champion = this.championService.getChampion(id);
    if (!champion) {
      throw new HttpException('Champion not found', HttpStatus.NOT_FOUND);
    }
    return champion;
  }
}
