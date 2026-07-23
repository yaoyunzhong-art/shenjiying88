/**
 * sms-channel.ts — 短信推送通道
 *
 * WP-13A: 短信通道骨架
 * BS-0168 ~ BS-0184
 *
 * 当前实现为模拟发送骨架。
 * 生产部署需要:
 * 1. 配置短信服务商信息（环境变量或配置中心）
 * 2. 接入实际短信 SDK (阿里云短信 / 腾讯云短信 / Twilio / AWS SNS)
 *
 * 配置方式 (环境变量):
 *   SMS_PROVIDER=aliyun         # 短信服务商: aliyun | tencent | twilio | aws
 *   SMS_ACCESS_KEY_ID=xxx
 *   SMS_ACCESS_KEY_SECRET=xxx
 *   SMS_SIGN_NAME=深机营        # 短信签名
 *   SMS_TEMPLATE_CODE=SMS_xxxxx # 短信模板
 *
 * 或通过配置中心推送:
 *   sms.provider / sms.accessKeyId / sms.accessKeySecret / sms.signName
 */

import { Injectable, Logger } from '@nestjs/common'
import { PushBusinessPriority } from '../push-priority.enum'
import type { PushChannel, PushChannelRequest, PushChannelResponse } from './push-channel.interface'

@Injectable()
export class SmsPushChannel implements PushChannel {
  readonly name = 'sms'
  readonly available = true
  private readonly logger = new Logger(SmsPushChannel.name)

  /**
   * 发送短信推送
   *
   * 当前实现：
   *   - 模拟发送，仅日志记录
   *   - 返回模拟成功
   *
   * 生产实现：
   *   示例: 阿里云短信 SDK
   *   import Dysmsapi from '@alicloud/dysmsapi'
   *   const client = new Dysmsapi({
   *     accessKeyId: process.env.SMS_ACCESS_KEY_ID,
   *     accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET,
   *     endpoint: 'dysmsapi.aliyuncs.com',
   *   })
   *   await client.sendSms({
   *     PhoneNumbers: request.recipient,
   *     SignName: process.env.SMS_SIGN_NAME,
   *     TemplateCode: process.env.SMS_TEMPLATE_CODE,
   *     TemplateParam: JSON.stringify({ content: request.body }),
   *   })
   */
  async send(request: PushChannelRequest): Promise<PushChannelResponse> {
    const startedAt = Date.now()

    // ✋ 这里接入真实短信提供方
    // 示例: 阿里云短信 (需安装 @alicloud/dysmsapi)
    // const Dysmsapi = require('@alicloud/dysmsapi20170525')
    // const OpenApi = require('@alicloud/openapi-client')
    // const config = new OpenApi.Config({
    //   accessKeyId: process.env.SMS_ACCESS_KEY_ID,
    //   accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET,
    // })
    // config.endpoint = 'dysmsapi.aliyuncs.com'
    // const client = new Dysmsapi(config)
    // const sendReq = new Dysmsapi.SendSmsRequest({
    //   phoneNumbers: request.recipient,
    //   signName: process.env.SMS_SIGN_NAME,
    //   templateCode: process.env.SMS_TEMPLATE_CODE,
    //   templateParam: JSON.stringify({ content: request.body }),
    // })
    // await client.sendSms(sendReq)

    const elapsedMs = Date.now() - startedAt

    this.logger.log(
      `[SmsChannel] SEND to=${request.recipient} body=${request.body.slice(0, 50)}... priority=${request.priority} elapsed=${elapsedMs}ms`
    )

    return {
      success: true,
      providerId: `sms-mock-${Date.now()}`,
      elapsedMs,
    }
  }

  async healthCheck(): Promise<boolean> {
    // ✋ 生产实现：配置验证
    // return !!(process.env.SMS_ACCESS_KEY_ID && process.env.SMS_ACCESS_KEY_SECRET)
    return true
  }
}
