/**
 * Phase 102 语音处理 Controller (V11 Sprint 3 Day 38)
 */

import {
  Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { VoiceProcessingService } from './voice-processing.service'
import type {
  CreateTtsTaskDto, CreateSttTaskDto, CloneVoiceDto, EnrollVoiceprintDto,
  IdentifySpeakerDto, ListTtsQuery, ListSttQuery,
} from './voice-processing.dto'

@Controller('voice')
export class VoiceProcessingController {
  constructor(private readonly service: VoiceProcessingService) {}

  // ============ TTS ============
  @Post('tts/tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTts(@Body() body: CreateTtsTaskDto) { return this.service.createTtsTask(body) }

  @Get('tts/tasks')
  async listTts(@Query() query: ListTtsQuery) {
    const items = await this.service.listTtsTasks(query)
    return { items, total: items.length }
  }

  @Get('tts/tasks/:id')
  async getTts(@Param('id') id: string) { return this.service.getTtsTask(id) }

  @Post('tts/tasks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelTts(@Param('id') id: string) { return this.service.cancelTtsTask(id) }

  // ============ STT ============
  @Post('stt/tasks')
  @HttpCode(HttpStatus.CREATED)
  async createStt(@Body() body: CreateSttTaskDto) { return this.service.createSttTask(body) }

  @Get('stt/tasks')
  async listStt(@Query() query: ListSttQuery) {
    const items = await this.service.listSttTasks(query)
    return { items, total: items.length }
  }

  @Get('stt/tasks/:id')
  async getStt(@Param('id') id: string) { return this.service.getSttTask(id) }

  @Get('stt/tasks/:id/segments')
  async listSttSegments(@Param('id') id: string) {
    const items = await this.service.listSttSegments(id)
    return { items, total: items.length }
  }

  @Post('stt/tasks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelStt(@Param('id') id: string) { return this.service.cancelSttTask(id) }

  // ============ Voice Clone ============
  @Post('clones')
  @HttpCode(HttpStatus.CREATED)
  async cloneVoice(@Body() body: CloneVoiceDto) { return this.service.cloneVoice(body) }

  @Get('clones')
  async listClones() { return { items: await this.service.listVoiceClones() } }

  @Delete('clones/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClone(@Param('id') id: string) { await this.service.deleteVoiceClone(id) }

  // ============ Voiceprint ============
  @Post('voiceprints')
  @HttpCode(HttpStatus.CREATED)
  async enrollVoiceprint(@Body() body: EnrollVoiceprintDto) { return this.service.enrollVoiceprint(body) }

  @Get('voiceprints')
  async listVoiceprints() { return { items: await this.service.listVoiceprints() } }

  @Post('voiceprints/identify')
  @HttpCode(HttpStatus.OK)
  async identify(@Body() body: IdentifySpeakerDto) {
    const items = await this.service.identifySpeakers(body)
    return { items }
  }

  // ============ Engines & Voices ============
  @Get('engines/tts')
  async listTtsEngines() { return { items: this.service.listTtsEngines() } }

  @Get('engines/stt')
  async listSttEngines() { return { items: this.service.listSttEngines() } }

  @Get('voices')
  async listVoices(@Query('engine') engine?: any) {
    return { items: this.service.listVoices(engine) }
  }

  // ============ Stats ============
  @Get('stats')
  async stats() { return this.service.getVoiceStats() }
}