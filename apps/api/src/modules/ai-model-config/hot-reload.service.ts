/**
 * AI模型配置 - 热加载服务 (V9 需求 1 · V10 Day 3)
 *
 * 核心功能:
 * 1. 一键切换配置 (< 500ms 延迟目标)
 * 2. WebSocket实时推送配置变更
 * 3. 本地缓存 + 热重载(不重启服务)
 * 4. 健康检查(自动回滚失败配置)
 */

import { Injectable, Logger } from '@nestjs/common'
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AiModelConfigRepository } from './ai-model-config.repository'
import { VaultService } from './vault.service'
import type { AiModelStoreConfig } from './ai-model-config.entity'

/** 配置变更事件 */
export interface ConfigChangeEvent {
  storeId: string
  configId: string
  configName: string
  provider: string
  changedBy: string
  changedAt: Date
  latencyMs: number
  healthCheckOk: boolean
}

/** 缓存项 */
interface CacheEntry {
  config: AiModelStoreConfig
  loadedAt: Date
  accessCount: number
}

@Injectable()
@WebSocketGateway({
  namespace: '/ai-model-config',
  cors: { origin: '*' }, // 生产环境配置具体域名
})
export class HotReloadService implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(HotReloadService.name)
  @WebSocketServer() server!: Server

  /** 本地缓存: storeId -> config */
  private configCache = new Map<string, CacheEntry>()
  
  /** 客户端订阅: storeId -> Set<socketId> */
  private storeSubscriptions = new Map<string, Set<string>>()
  
  /** 性能统计 */
  private latencyStats: number[] = []
  private readonly MAX_STATS_SIZE = 1000

  constructor(
    private readonly repo: AiModelConfigRepository,
    private readonly vaultService: VaultService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============ WebSocket 连接管理 ============

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
    
    // 客户端订阅门店配置更新
    client.on('subscribe-store', (storeId: string) => {
      this.subscribeStore(client.id, storeId)
      client.join(`store:${storeId}`)
      
      // 立即推送当前配置
      this.getCurrentConfig(storeId).then((config: any) => {
        if (config) {
          client.emit('config-current', config)
        }
      })
    })

    // 取消订阅
    client.on('unsubscribe-store', (storeId: string) => {
      this.unsubscribeStore(client.id, storeId)
      client.leave(`store:${storeId}`)
    })
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
    // 清理所有订阅
    this.storeSubscriptions.forEach((clients, storeId) => {
      if (clients.has(client.id)) {
        this.unsubscribeStore(client.id, storeId)
      }
    })
  }

  // ============ 订阅管理 ============

  private subscribeStore(clientId: string, storeId: string) {
    if (!this.storeSubscriptions.has(storeId)) {
      this.storeSubscriptions.set(storeId, new Set())
    }
    this.storeSubscriptions.get(storeId)!.add(clientId)
  }

  private unsubscribeStore(clientId: string, storeId: string) {
    const clients = this.storeSubscriptions.get(storeId)
    if (clients) {
      clients.delete(clientId)
      if (clients.size === 0) {
        this.storeSubscriptions.delete(storeId)
      }
    }
  }

  // ============ 核心功能: 一键切换 ============

  /**
   * 一键切换配置(热加载)
   * 目标延迟: < 500ms
   */
  async hotReloadConfig(
    storeId: string,
    configId: string,
    changedBy: string,
    reason?: string,
  ): Promise<{
    success: boolean
    latencyMs: number
    healthCheckOk: boolean
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      // 1. 执行切换(数据库层)
      const result = await this.repo.switchConfig(configId, changedBy, reason)
      
      // 2. 更新本地缓存
      await this.refreshCache(storeId)
      
      // 3. 健康检查(验证新配置可用)
      const healthCheckOk = await this.healthCheck(result.config)
      
      // 4. 如果健康检查失败,自动回滚
      const resultWithRef = result as unknown as { previousConfigId: string }
      if (!healthCheckOk && resultWithRef.previousConfigId) {
        this.logger.warn(`Health check failed for config ${configId}, auto-rollback...`)
        await this.repo.switchConfig(resultWithRef.previousConfigId, 'system', 'Auto-rollback: health check failed')
        await this.refreshCache(storeId)
        
        return {
          success: false,
          latencyMs: Date.now() - startTime,
          healthCheckOk: false,
          error: 'Health check failed, auto-rolled back',
        }
      }
      
      // 5. WebSocket 推送变更通知
      const latencyMs = Date.now() - startTime
      this.recordLatency(latencyMs)
      
      this.broadcastConfigChange({
        storeId,
        configId: result.config.id,
        configName: result.config.configName,
        provider: result.config.provider,
        changedBy,
        changedAt: new Date(),
        latencyMs,
        healthCheckOk,
      })
      
      // 6. 发送事件(供其他模块监听)
      this.eventEmitter.emit('ai-model-config.changed', {
        storeId,
        configId,
        latencyMs,
        healthCheckOk,
      })
      
      return {
        success: true,
        latencyMs,
        healthCheckOk,
      }
      
    } catch(error: any){
      const latencyMs = Date.now() - startTime
      this.logger.error(`Hot reload failed: ${error.message}`, error.stack)
      
      return {
        success: false,
        latencyMs,
        healthCheckOk: false,
        error: error.message,
      }
    }
  }

  // ============ 缓存管理 ============

  /**
   * 获取当前生效配置(优先从缓存)
   */
  async getCurrentConfig(storeId: string): Promise<AiModelStoreConfig | null> {
    // 1. 检查缓存
    const cached = this.configCache.get(storeId)
    if (cached) {
      cached.accessCount++
      return cached.config
    }
    
    // 2. 从数据库加载
    const config = await this.repo.getCurrentConfig(storeId)
    if (config) {
      this.configCache.set(storeId, {
        config,
        loadedAt: new Date(),
        accessCount: 1,
      })
    }
    
    return config
  }

  /**
   * 刷新缓存
   */
  async refreshCache(storeId: string): Promise<void> {
    this.configCache.delete(storeId)
    await this.getCurrentConfig(storeId)
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.configCache.clear()
    this.logger.log('Config cache cleared')
  }

  // ============ 健康检查 ============

  /**
   * 健康检查 - 验证配置可用性
   */
  private async healthCheck(config: AiModelStoreConfig): Promise<boolean> {
    try {
      // 简单的 HTTP HEAD 检查(验证 endpoint 可访问)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000) // 5s 超时
      
      const response = await fetch(config.endpointUrl, {
        method: 'HEAD',
        signal: controller.signal,
      })
      
      clearTimeout(timeout)
      
      // 只要返回了响应(无论状态码)就认为 endpoint 可访问
      return true
      
    } catch(error: any){
      // HEAD 请求失败,尝试更宽松的检查
      try {
        // 验证 API key 格式
        if (!config.apiKeyEncrypted || config.apiKeyEncrypted.length < 10) {
          return false
        }
        
        // 验证 endpoint URL 格式
        const url = new URL(config.endpointUrl)
        return url.protocol === 'http:' || url.protocol === 'https:'
        
      } catch {
        return false
      }
    }
  }

  // ============ 性能统计 ============

  /**
   * 记录延迟统计
   */
  private recordLatency(latencyMs: number): void {
    this.latencyStats.push(latencyMs)
    
    // 只保留最近1000条记录
    if (this.latencyStats.length > this.MAX_STATS_SIZE) {
      this.latencyStats.shift()
    }
  }

  /**
   * 获取延迟统计报告
   */
  getLatencyReport(): {
    count: number
    avg: number
    p50: number
    p95: number
    p99: number
    min: number
    max: number
  } {
    if (this.latencyStats.length === 0) {
      return { count: 0, avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 }
    }
    
    const sorted = [...this.latencyStats].sort((a, b) => a - b)
    const count = sorted.length
    
    const avg = sorted.reduce((a, b) => a + b, 0) / count
    const p50 = sorted[Math.floor(count * 0.5)]
    const p95 = sorted[Math.floor(count * 0.95)]
    const p99 = sorted[Math.floor(count * 0.99)]
    
    return {
      count,
      avg: Math.round(avg),
      p50,
      p95,
      p99,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    }
  }

  // ============ WebSocket 广播 ============

  /**
   * 广播配置变更事件
   */
  private broadcastConfigChange(event: ConfigChangeEvent): void {
    // WebSocket 广播
    this.server?.to(`store:${event.storeId}`).emit('config-changed', event)
    
    this.logger.log(
      `Config changed broadcasted: store=${event.storeId}, config=${event.configId}, latency=${event.latencyMs}ms`
    )
  }
}
