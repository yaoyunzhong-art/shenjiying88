/**
 * channels/index.ts — 统一导出
 */
export { PushChannel, PushChannelRequest, PushChannelResponse, ChannelRoutingConfig, DEFAULT_CHANNEL_ROUTING } from './push-channel.interface'
export { EmailPushChannel } from './email-channel'
export { SmsPushChannel } from './sms-channel'
export { DualChannelRouter } from './dual-channel-router'
