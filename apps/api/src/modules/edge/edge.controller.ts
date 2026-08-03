/**
 * 边缘计算 - Controller
 *
 * RESTful API:
 * - 边缘节点: GET /edge/nodes, POST /edge/nodes, PATCH /edge/nodes/:id, DELETE /edge/nodes/:id
 * - 离线排队: POST /edge/tickets/issue, POST /edge/tickets/call-next, POST /edge/tickets/:id/complete,
 *             POST /edge/tickets/:id/cancel, GET /edge/tickets/:id/position, POST /edge/tickets/sync
 * - 时间同步: POST /edge/clock/sync, POST /edge/clock/calibrate, GET /edge/clock/tolerance
 * - AI推理:   POST /edge/inference/load, POST /edge/inference/run, POST /edge/inference/unload,
 *             POST /edge/inference/cache, GET /edge/inference/cached
 * - 健康检查: GET /edge/health
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import {
  EdgeNodeService,
  EdgeInferenceService,
  EdgeModelCache,
} from './edge-ai.service'
import {
  OfflineTicketService,
  TimeSyncService,
} from './edge-computing.service'
import { runWithTenant, type TenantContext } from '../../common/context/tenant-context'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('edge')
@UseGuards(TenantGuard)
export class EdgeController {
  constructor(
    private readonly nodeService: EdgeNodeService,
    private readonly ticketService: OfflineTicketService,
    private readonly timeSyncService: TimeSyncService,
    private readonly inferenceService: EdgeInferenceService,
    private readonly modelCache: EdgeModelCache,
  ) {}

  // ============ 1. 边缘节点管理 ============

  /** GET /edge/nodes */
  @Get('nodes')
  async listNodes(@Req() req: Request) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const data = this.nodeService.listDevices().map((d) => ({
        ...d,
        tenantId: ctx.tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      return { data, total: data.length }
    })
  }

  /** GET /edge/nodes/:id */
  @Get('nodes/:id')
  async getNode(@Req() req: Request, @Param('id') id: string) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const device = this.nodeService.listDevices().find((d) => d.deviceId === id)
      if (!device) throw new NotFoundException(`Edge node ${id} not found`)
      return { data: device }
    })
  }

  /** POST /edge/nodes */
  @Post('nodes')
  @HttpCode(HttpStatus.CREATED)
  async registerNode(@Req() req: Request, @Body() body: any) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      // 边缘节点注册通过 EdgeNodeService 处理
      const device = this.nodeService.registerDevice({
        deviceId: `edge-${Date.now().toString(36)}`,
        name: body.name ?? 'New Edge Node',
        platform: body.platform ?? 'linux',
        capabilities: body.capabilities ?? [],
        memoryMb: body.memoryMb ?? 2048,
        status: 'online',
      })
      return { data: device }
    })
  }

  /** DELETE /edge/nodes/:id */
  @Delete('nodes/:id')
  @HttpCode(HttpStatus.OK)
  async deleteNode(@Req() req: Request, @Param('id') id: string) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const removed = this.nodeService.removeDevice(id)
      if (!removed) throw new NotFoundException(`Edge node ${id} not found`)
      return { success: true, message: `Node ${id} removed` }
    })
  }

  // ============ 2. 离线排队 ============

  /** POST /edge/tickets/issue */
  @Post('tickets/issue')
  @HttpCode(HttpStatus.CREATED)
  async issueTicket(@Req() req: Request, @Body() body: { storeId: string; customerId?: string; priority?: number }) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const ticket = this.ticketService.issueTicket(body.storeId, body.customerId, body.priority ?? 0)
      return { data: ticket }
    })
  }

  /** POST /edge/tickets/call-next */
  @Post('tickets/call-next')
  @HttpCode(HttpStatus.OK)
  async callNext(@Req() req: Request, @Body() body: { storeId: string }) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const result = this.ticketService.callNext(body.storeId)
      return { data: result }
    })
  }

  /** POST /edge/tickets/:id/complete */
  @Post('tickets/:id/complete')
  @HttpCode(HttpStatus.OK)
  async completeTicket(@Req() req: Request, @Param('id') id: string) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const success = this.ticketService.completeTicket(id)
      if (!success) throw new NotFoundException(`Ticket ${id} not found or already completed`)
      return { success: true, message: `Ticket ${id} completed` }
    })
  }

  /** POST /edge/tickets/:id/cancel */
  @Post('tickets/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelTicket(@Req() req: Request, @Param('id') id: string) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const success = this.ticketService.cancelTicket(id)
      if (!success) throw new NotFoundException(`Ticket ${id} not found or cannot be cancelled`)
      return { success: true, message: `Ticket ${id} cancelled` }
    })
  }

  /** GET /edge/tickets/:id/position */
  @Get('tickets/:id/position')
  async getQueuePosition(@Req() req: Request, @Param('id') id: string) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const position = this.ticketService.getQueuePosition(id)
      if (!position) throw new NotFoundException(`Ticket ${id} not found`)
      return { data: position }
    })
  }

  /** POST /edge/tickets/sync */
  @Post('tickets/sync')
  @HttpCode(HttpStatus.OK)
  async syncQueue(@Req() req: Request, @Body() body: { storeId: string }) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const result = this.ticketService.syncQueueToServer(body.storeId)
      return { data: result }
    })
  }

  // ============ 3. 时间同步 ============

  /** POST /edge/clock/sync */
  @Post('clock/sync')
  @HttpCode(HttpStatus.OK)
  async syncClock(@Req() req: Request, @Body() body: { clientTime: number }) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const result = this.timeSyncService.syncClock(body.clientTime)
      return { data: result }
    })
  }

  /** POST /edge/clock/calibrate */
  @Post('clock/calibrate')
  @HttpCode(HttpStatus.OK)
  async calibrateClock(
    @Req() req: Request,
    @Body() body: { samples: Array<{ clientTime: number; serverTime: number }> },
  ) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const offset = this.timeSyncService.calibrateWithSamples(body.samples)
      return { data: { offset, synced: true } }
    })
  }

  /** GET /edge/clock/tolerance?serverTime=...&toleranceMs=... */
  @Get('clock/tolerance')
  async checkClockTolerance(
    @Req() req: Request,
    @Query('serverTime') serverTimeStr: string,
    @Query('toleranceMs') toleranceMsStr?: string,
  ) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const serverTime = parseInt(serverTimeStr, 10)
      const toleranceMs = parseInt(toleranceMsStr ?? '500', 10)
      const result = this.timeSyncService.isWithinTolerance(serverTime, toleranceMs)
      return { data: result }
    })
  }

  // ============ 4. AI 推理 ============

  /** POST /edge/inference/load */
  @Post('inference/load')
  @HttpCode(HttpStatus.OK)
  async loadModel(@Req() req: Request, @Body() body: { modelId: string; deviceId: string }) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const modelInfo = await this.inferenceService.loadModel(body.modelId, body.deviceId)
      return { data: modelInfo }
    })
  }

  /** POST /edge/inference/run */
  @Post('inference/run')
  @HttpCode(HttpStatus.OK)
  async runInference(
    @Req() req: Request,
    @Body() body: { modelId: string; deviceId: string; inputData: unknown },
  ) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const result = await this.inferenceService.runInference(body.modelId, body.inputData, body.deviceId)
      return { data: result }
    })
  }

  /** POST /edge/inference/unload */
  @Post('inference/unload')
  @HttpCode(HttpStatus.OK)
  async unloadModel(@Req() req: Request, @Body() body: { modelId: string; deviceId: string }) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      await this.inferenceService.unloadModel(body.modelId, body.deviceId)
      return { success: true, message: `Model ${body.modelId} unloaded from ${body.deviceId}` }
    })
  }

  /** POST /edge/inference/cache */
  @Post('inference/cache')
  @HttpCode(HttpStatus.OK)
  async cacheModel(@Req() req: Request, @Body() body: { modelId: string; version: string }) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const cached = await this.modelCache.cacheModel(body.modelId, body.version)
      return { data: cached }
    })
  }

  /** GET /edge/inference/cached */
  @Get('inference/cached')
  async listCachedModels(@Req() req: Request) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const data = this.modelCache.listCachedModels()
      return { data, total: data.length }
    })
  }

  // ============ 5. 健康检查 ============

  /** GET /edge/health */
  @Get('health')
  async health(@Req() req: Request) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => ({
      status: 'ok',
      nodes: this.nodeService.listDevices().length,
      serverTime: Date.now(),
      timestamp: new Date().toISOString(),
    }))
  }

  // ============ 私有 ============

  private extractTenant(req: Request): TenantContext {
    const u = (req as unknown as { user?: Record<string, unknown> }).user ?? {}
    const user = u as Record<string, unknown>
    return {
      tenantId: (user.tenantId ?? 'default-tenant') as string,
      storeId: user.storeId as string | undefined,
      userId: (user.id ?? user.userId) as string | undefined,
      role: user.role as import('../../common/context/tenant-context').TenantRole,
    }
  }
}
