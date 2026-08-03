/**
 * dual-channel-router.ts — 双通道主备路由
 *
 * WP-13A: 邮件 + 短信双通道
 * BS-0168 ~ BS-0184
 *
 * 双通道路由策略：
 *   primary → fallback（一个通道挂了走另一个）
 *   主通道发送失败时自动降级到备用通道
 */

import { Injectable, Logger } from '@nestjs/common'
import type { PushChannel, PushChannelRequest, PushChannelResponse } from './push-channel.interface'
import { DEFAULT_CHANNEL_ROUTING, type ChannelRoutingConfig } from './push-channel.interface'

@Injectable()
export class DualChannelRouter {
  private readonly logger = new Logger(DualChannelRouter.name)
  private channels = new Map<string, PushChannel>()

  /**
   * 注册推送通道
   */
  register(channel: PushChannel): void {
    this.channels.set(channel.name, channel)
    this.logger.debug(`[Router] Channel registered: ${channel.name}`)
  }

  /**
   * 获取通道
   */
  getChannel(name: string): PushChannel | undefined {
    return this.channels.get(name)
  }

  /**
   * 获取所有已注册通道
   */
  getChannels(): PushChannel[] {
    return Array.from(this.channels.values())
  }

  /**
   * 获取通道数量
   */
  get channelCount(): number {
    return this.channels.size
  }

  /**
   * 发送推送（双通道主备路由）
   *
   * 策略:
   *   1. 先尝试主通道 (primary)
   *   2. 主通道失败时，自动切换到备用通道 (fallback)
   *   3. 两个通道都失败则返回最后一次的错误
   */
  async send(
    request: PushChannelRequest,
    routing?: ChannelRoutingConfig,
  ): Promise<PushChannelResponse> {
    const config = routing ?? DEFAULT_CHANNEL_ROUTING

    // 主通道
    const primaryChannel = this.channels.get(config.primary)
    if (!primaryChannel) {
      this.logger.warn(`[Router] Primary channel "${config.primary}" not registered, trying fallback`)
      return this.sendViaFallback(request, config.fallback)
    }

    this.logger.log(`[Router] Sending via primary channel: ${config.primary}`)

    try {
      const response = await primaryChannel.send(request)
      if (response.success) {
        return response
      }

      // 主通道发送失败，降级到备用通道
      this.logger.warn(
        `[Router] Primary channel failed: error=${response.error}, falling back to ${config.fallback}`
      )
    } catch (err) {
      this.logger.warn(
        `[Router] Primary channel threw: ${err}, falling back to ${config.fallback}`
      )
    }

    return this.sendViaFallback(request, config.fallback)
  }

  /**
   * 通过备用通道发送
   */
  private async sendViaFallback(
    request: PushChannelRequest,
    fallbackChannelName: string,
  ): Promise<PushChannelResponse> {
    const fallbackChannel = this.channels.get(fallbackChannelName)
    if (!fallbackChannel) {
      this.logger.error(`[Router] Fallback channel "${fallbackChannelName}" not registered`)
      return {
        success: false,
        error: `Fallback channel "${fallbackChannelName}" not registered`,
        elapsedMs: 0,
      }
    }

    this.logger.log(`[Router] Sending via fallback channel: ${fallbackChannelName}`)

    try {
      return await fallbackChannel.send(request)
    } catch (err) {
      this.logger.error(`[Router] Fallback channel also failed: ${err}`)
      return {
        success: false,
        error: `All channels failed. Last error: ${err}`,
        elapsedMs: 0,
      }
    }
  }

  /**
   * 健康检查所有通道
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    for (const [name, channel] of this.channels) {
      try {
        results[name] = await channel.healthCheck()
      } catch {
        results[name] = false
      }
    }
    return results
  }
}
