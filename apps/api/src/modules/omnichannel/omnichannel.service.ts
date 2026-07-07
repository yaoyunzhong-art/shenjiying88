/**
 * omnichannel.service.ts - T112-3 全渠道触达任务
 * 用途: 全渠道触达（P0-P3 + 短信双通道 + 海外邮件）
 *
 * 核心服务:
 * - OmnichannelReachService: 全渠道触达（SMS/Email/Push/App）
 * - SMSDualChannelService: P0-3 短信双通道（主/备通道自动切换）
 * - InternationalEmailService: P1-7 海外邮件（多语言模板）
 */
import { Injectable, Logger } from '@nestjs/common';

// ── Types ──
export type Channel = 'SMS' | 'Email' | 'Push' | 'App';

export type ChannelStatus = 'available' | 'maintenance' | 'failed';

export interface ReachResult {
  success: boolean;
  messageId: string;
  channel: Channel;
  timestamp: Date;
  error?: string;
}

export interface ReachHistory {
  id: string;
  memberId: string;
  channel: Channel;
  content: string;
  status: 'sent' | 'delivered' | 'failed';
  messageId: string;
  timestamp: Date;
}

export interface SMSDeliveryStatus {
  messageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  channel: 'primary' | 'backup';
  timestamp: Date;
}

export interface EmailDeliveryStatus {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  locale: string;
  timestamp: Date;
}

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'es-ES';

export interface EmailRecipient {
  to: string;
  name?: string;
}

// ── OmnichannelReachService ──
@Injectable()
export class OmnichannelReachService {
  private readonly logger = new Logger(OmnichannelReachService.name);
  private readonly reachHistory: ReachHistory[] = [];
  private readonly channelStatuses = new Map<Channel, ChannelStatus>([
    ['SMS', 'available'],
    ['Email', 'available'],
    ['Push', 'available'],
    ['App', 'available'],
  ]);

  /**
   * 通过指定渠道触达会员
   */
  async reach(memberId: string, channel: Channel, content: string): Promise<ReachResult> {
    const status = this.channelStatuses.get(channel);
    if (status === 'maintenance' || status === 'failed') {
      return {
        success: false,
        messageId: '',
        channel,
        timestamp: new Date(),
        error: `Channel ${channel} is ${status}`,
      };
    }

    const messageId = this.generateMessageId();
    const result: ReachResult = {
      success: true,
      messageId,
      channel,
      timestamp: new Date(),
    };

    this.reachHistory.push({
      id: this.generateMessageId(),
      memberId,
      channel,
      content,
      status: 'sent',
      messageId,
      timestamp: new Date(),
    });

    this.logger.log(`Reach [${channel}] -> member ${memberId}: ${messageId}`);
    return result;
  }

  /**
   * 批量触达
   */
  async reachAll(memberIds: string[], channel: Channel, content: string): Promise<ReachResult[]> {
    const results: ReachResult[] = [];
    for (const memberId of memberIds) {
      const result = await this.reach(memberId, channel, content);
      results.push(result);
    }
    return results;
  }

  /**
   * 获取触达历史
   */
  getReachHistory(memberId: string): ReachHistory[] {
    return this.reachHistory.filter((h) => h.memberId === memberId);
  }

  /**
   * 获取渠道状态
   */
  getChannelStatus(channel: Channel): ChannelStatus {
    return this.channelStatuses.get(channel) ?? 'failed';
  }

  /**
   * 设置渠道状态（用于维护/故障场景）
   */
  setChannelStatus(channel: Channel, status: ChannelStatus): void {
    this.channelStatuses.set(channel, status);
    this.logger.log(`Channel ${channel} status set to ${status}`);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

// ── SMSDualChannelService (P0-3) ──
@Injectable()
export class SMSDualChannelService {
  private readonly logger = new Logger(SMSDualChannelService.name);
  private readonly deliveryRecords = new Map<string, SMSDeliveryStatus>();

  /**
   * 主通道发送（运营商A）
   */
  async sendViaPrimary(phone: string, content: string): Promise<SMSDeliveryStatus> {
    this.logger.log(`SMS [Primary] -> ${phone}`);
    const messageId = this.generateMessageId();
    const status: SMSDeliveryStatus = {
      messageId,
      status: 'sent',
      channel: 'primary',
      timestamp: new Date(),
    };
    this.deliveryRecords.set(messageId, status);
    return status;
  }

  /**
   * 备用通道发送（运营商B）
   */
  async sendViaBackup(phone: string, content: string): Promise<SMSDeliveryStatus> {
    this.logger.log(`SMS [Backup] -> ${phone}`);
    const messageId = this.generateMessageId();
    const status: SMSDeliveryStatus = {
      messageId,
      status: 'sent',
      channel: 'backup',
      timestamp: new Date(),
    };
    this.deliveryRecords.set(messageId, status);
    return status;
  }

  /**
   * 主通道失败后自动切换备用通道
   */
  async sendWithFallback(phone: string, content: string): Promise<SMSDeliveryStatus> {
    try {
      const primaryResult = await this.sendViaPrimary(phone, content);
      if (primaryResult.status === 'sent') {
        return primaryResult;
      }
    } catch (err) {
      this.logger.warn(`Primary channel failed, switching to backup: ${err}`);
    }

    // Fallback to backup channel
    const backupResult = await this.sendViaBackup(phone, content);
    return backupResult;
  }

  /**
   * 获取短信投递状态
   */
  getDeliveryStatus(messageId: string): SMSDeliveryStatus | undefined {
    return this.deliveryRecords.get(messageId);
  }

  private generateMessageId(): string {
    return `sms_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

// ── InternationalEmailService (P1-7) ──
@Injectable()
export class InternationalEmailService {
  private readonly logger = new Logger(InternationalEmailService.name);
  private readonly deliveryRecords = new Map<string, EmailDeliveryStatus>();

  private readonly emailTemplates = new Map<string, Record<Locale, string>>([
    [
      'welcome',
      {
        'zh-CN': '欢迎 {name} 加入我们！',
        'en-US': 'Welcome {name} to our platform!',
        'ja-JP': '{name}様ようこそ！',
        'ko-KR': '{name}님 환영합니다!',
        'es-ES': '¡Bienvenido {name} a nuestra plataforma!',
      },
    ],
    [
      'promotion',
      {
        'zh-CN': '亲爱的 {name}，您有一张 {discount} 折优惠券！',
        'en-US': 'Dear {name}, you have a {discount}% off coupon!',
        'ja-JP': '亲爱的{name}様、{discount}%オフクーポンをどうぞ！',
        'ko-KR': '친애하는 {name}님, {discount}% 할인 쿠폰이 있습니다!',
        'es-ES': 'Querido {name}, ¡tienes un cupón de {discount}% de descuento!',
      },
    ],
  ]);

  /**
   * 发送国际化邮件
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    locale: Locale = 'en-US',
  ): Promise<EmailDeliveryStatus> {
    this.logger.log(`Email [${locale}] -> ${to}: ${subject}`);
    const messageId = this.generateMessageId();
    const status: EmailDeliveryStatus = {
      messageId,
      status: 'sent',
      locale,
      timestamp: new Date(),
    };
    this.deliveryRecords.set(messageId, status);
    return status;
  }

  /**
   * 批量发送邮件
   */
  async sendBulkEmail(
    recipients: EmailRecipient[],
    subject: string,
    body: string,
    locale: Locale = 'en-US',
  ): Promise<EmailDeliveryStatus[]> {
    const results: EmailDeliveryStatus[] = [];
    for (const recipient of recipients) {
      const result = await this.sendEmail(recipient.to, subject, body, locale);
      results.push(result);
    }
    return results;
  }

  /**
   * 获取邮件投递状态
   */
  getEmailStatus(messageId: string): EmailDeliveryStatus | undefined {
    return this.deliveryRecords.get(messageId);
  }

  /**
   * 渲染本地化邮件模板
   */
  renderTemplate(templateId: string, locale: Locale, data: Record<string, string>): string {
    const template = this.emailTemplates.get(templateId);
    if (!template) {
      return `Template ${templateId} not found`;
    }

    const localizedTemplate = template[locale] ?? template['en-US'];
    return localizedTemplate.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  /**
   * 注册自定义邮件模板
   */
  registerTemplate(templateId: string, localizedContents: Record<Locale, string>): void {
    this.emailTemplates.set(templateId, localizedContents);
  }

  private generateMessageId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
