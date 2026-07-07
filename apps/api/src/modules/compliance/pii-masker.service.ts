/**
 * pii-masker.service.ts - Phase-20 T40
 * 用途: PII 数据脱敏 (maskPII)
 * 关联: phase-20-compliance/spec.md §Phase 1
 *
 * 脱敏策略:
 * - phone: 138****1234 (前 3 + 后 4)
 * - email: a***@example.com (首字母 + *** + @domain)
 * - idCard: 110101********1234 (前 6 + 后 4)
 * - creditCard: 411111******1111 (前 6 + 后 4)
 * - ip: 192.168.*.* (前 2 段保留)
 *
 * 反向: unmask 不可逆 (单向函数,只有 hash + verify)
 */
import { Injectable, Logger } from '@nestjs/common';
import { PIIDetectorService, PIIMatch, PIIKind } from './pii-detector.service';

export interface MaskOptions {
  /**
   * 替换字符,默认 '*'
   */
  maskChar?: string;
  /**
   * 是否保留原始类型信息 (如 'PHONE:138****1234')
   */
  withKind?: boolean;
}

@Injectable()
export class PIIMaskerService {
  private readonly logger = new Logger(PIIMaskerService.name);

  constructor(private readonly detector: PIIDetectorService) {}

  /**
   * 脱敏单个 phone: 138****1234
   */
  maskPhone(value: string, maskChar = '*'): string {
    if (value.length < 7) return value; // 太短不处理
    return value.slice(0, 3) + maskChar.repeat(4) + value.slice(-4);
  }

  /**
   * 脱敏单个 email: a***@example.com
   */
  maskEmail(value: string, maskChar = '*'): string {
    const atIdx = value.indexOf('@');
    if (atIdx <= 0) return value;
    const local = value.slice(0, atIdx);
    const domain = value.slice(atIdx);
    if (local.length <= 1) return local + maskChar.repeat(3) + domain;
    return local[0] + maskChar.repeat(3) + domain;
  }

  /**
   * 脱敏单个 ID card: 110101********1234
   */
  maskIdCard(value: string, maskChar = '*'): string {
    if (value.length < 10) return value;
    return value.slice(0, 6) + maskChar.repeat(8) + value.slice(-4);
  }

  /**
   * 脱敏单个 credit card: 411111******1111
   */
  maskCreditCard(value: string, maskChar = '*'): string {
    const digits = value.replace(/[^\d]/g, '');
    if (digits.length < 13) return value;
    return digits.slice(0, 6) + maskChar.repeat(6) + digits.slice(-4);
  }

  /**
   * 脱敏单个 IP: 192.168.*.*
   */
  maskIP(value: string, maskChar = '*'): string {
    const parts = value.split('.');
    if (parts.length !== 4) return value;
    return [parts[0], parts[1], maskChar, maskChar].join('.');
  }

  /**
   * 通用脱敏 - 根据 PII kind 调用对应策略
   */
  mask(value: string, kind: PIIKind, maskChar = '*'): string {
    switch (kind) {
      case 'phone':
        return this.maskPhone(value, maskChar);
      case 'email':
        return this.maskEmail(value, maskChar);
      case 'idCard':
        return this.maskIdCard(value, maskChar);
      case 'creditCard':
        return this.maskCreditCard(value, maskChar);
      case 'ip':
        return this.maskIP(value, maskChar);
      default:
        return value;
    }
  }

  /**
   * 文本脱敏 - 检测 + 替换所有 PII
   * @param text 待脱敏文本
   * @param options 脱敏选项
   * @returns 脱敏后文本 (PII 全部替换为 masked)
   */
  maskText(text: string, options: MaskOptions = {}): string {
    if (!text || typeof text !== 'string') return text;
    const maskChar = options.maskChar ?? '*';
    const matches = this.detector.detect(text);
    if (matches.length === 0) return text;

    // 从右向左替换,避免 index 错位
    let result = text;
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const masked = this.mask(m.value, m.kind, maskChar);
      const replacement = options.withKind ? `${m.kind}:${masked}` : masked;
      result = result.slice(0, m.start) + replacement + result.slice(m.end);
    }
    return result;
  }

  /**
   * 批量脱敏 - 用于日志/导出场景
   */
  maskBatch(texts: string[], options?: MaskOptions): string[] {
    return texts.map((t) => this.maskText(t, options));
  }

  /**
   * 脱敏率 - 统计文本中 PII 被替换的比例 (0-1)
   */
  maskRatio(text: string): number {
    if (!text) return 0;
    const matches = this.detector.detect(text);
    const maskedLength = matches.reduce((sum, m) => sum + (m.end - m.start), 0);
    return maskedLength / text.length;
  }
}