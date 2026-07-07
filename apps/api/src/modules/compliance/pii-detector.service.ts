/**
 * pii-detector.service.ts - Phase-20 T39
 * 用途: PII (Personally Identifiable Information) 自动检测
 * 关联: phase-20-compliance/spec.md §Phase 1
 *
 * 检测范围:
 * - phone: 中国大陆手机号 (1[3-9]xxxxxxxxx)
 * - email: RFC 5322 简化版
 * - ID card: 18 位身份证 (含校验位)
 * - credit card: Luhn 校验
 * - IP: IPv4 地址
 *
 * 输出: PIIMatch[] (含 kind, value, start, end, confidence)
 */
import { Injectable, Logger } from '@nestjs/common';

export type PIIKind = 'phone' | 'email' | 'idCard' | 'creditCard' | 'ip';

export interface PIIMatch {
  kind: PIIKind;
  value: string;
  start: number;
  end: number;
  confidence: number; // 0-1
}

export interface PIIDetectOptions {
  kinds?: PIIKind[]; // 限定检测类型,默认全部
  minConfidence?: number; // 最低置信度阈值,默认 0.8
}

// 正则表达式库 (按 kind 索引)
const PATTERNS: Record<PIIKind, { source: string; flags: string; confidence: number }> = {
  // 中国大陆手机号: 1[3-9] 开头 + 9 位数字
  phone: {
    source: '\\b1[3-9]\\d{9}\\b',
    flags: 'g',
    confidence: 0.95,
  },
  // Email: 简化版 (RFC 5322 子集)
  email: {
    source: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
    flags: 'g',
    confidence: 0.9,
  },
  // 中国身份证: 18 位 (前 17 位数字 + 末位校验位 数字/X)
  idCard: {
    source: '\\b[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]\\b',
    flags: 'g',
    confidence: 0.98,
  },
  // 信用卡: 13-19 位数字,经 Luhn 校验
  creditCard: {
    source: '\\b(?:\\d[ -]?){13,19}\\b',
    flags: 'g',
    confidence: 0.85, // 基础置信度,Luhn 通过后 +0.1
  },
  // IPv4: 0-255.0-255.0-255.0-255
  ip: {
    source: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    flags: 'g',
    confidence: 0.9,
  },
};

/**
 * Luhn 校验 - 信用卡号合法性
 * 规则: 从右到左,奇数位 *2 (>9 则 -9),偶数位不变,总和 % 10 == 0
 */
function isLuhnValid(cardNumber: string): boolean {
  const digits = cardNumber.replace(/[^\d]/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isSecond = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (isSecond) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isSecond = !isSecond;
  }
  return sum % 10 === 0;
}

/**
 * 身份证校验位计算 - 用于提高 idCard 置信度
 * 规则: 加权因子 + 校验码映射
 */
function isValidIdCardChecksum(id: string): boolean {
  if (id.length !== 18) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (id.charCodeAt(i) - 48) * weights[i];
  }
  const expected = codes[sum % 11];
  return id[17].toUpperCase() === expected;
}

@Injectable()
export class PIIDetectorService {
  private readonly logger = new Logger(PIIDetectorService.name);

  /**
   * 检测文本中的 PII
   * @param text 待检测文本
   * @param options 检测选项
   * @returns PIIMatch 列表 (按 start 升序)
   */
  detect(text: string, options: PIIDetectOptions = {}): PIIMatch[] {
    if (!text || typeof text !== 'string') return [];
    const kinds = options.kinds ?? (Object.keys(PATTERNS) as PIIKind[]);
    const minConfidence = options.minConfidence ?? 0.8;

    const matches: PIIMatch[] = [];
    for (const kind of kinds) {
      const pattern = PATTERNS[kind];
      if (!pattern) continue;

      // 每次调用创建新 RegExp,避免 /g 标志的 lastIndex 状态污染 (并发/共享场景)
      const regex = new RegExp(pattern.source, pattern.flags);
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        const value = m[0];
        let confidence = pattern.confidence;

        // 信用卡: Luhn 校验额外加分
        if (kind === 'creditCard') {
          confidence = isLuhnValid(value) ? 0.95 : 0.4; // 未通过 Luhn 置信度骤降
        }

        // 身份证: 校验位验证
        if (kind === 'idCard') {
          confidence = isValidIdCardChecksum(value) ? 0.99 : 0.6;
        }

        if (confidence < minConfidence) continue;

        matches.push({
          kind,
          value,
          start: m.index,
          end: m.index + value.length,
          confidence,
        });

        // 防止 zero-length 死循环
        if (m.index === regex.lastIndex) regex.lastIndex++;
      }
    }

    // 按 start 升序
    matches.sort((a, b) => a.start - b.start);
    return matches;
  }

  /**
   * 检测并返回分组结果 (按 kind 聚合)
   */
  detectGrouped(text: string, options?: PIIDetectOptions): Record<PIIKind, PIIMatch[]> {
    const all = this.detect(text, options);
    const grouped: Record<PIIKind, PIIMatch[]> = {
      phone: [],
      email: [],
      idCard: [],
      creditCard: [],
      ip: [],
    };
    for (const m of all) grouped[m.kind].push(m);
    return grouped;
  }

  /**
   * 快速检测 - 仅返回布尔值,不含细节
   */
  hasPII(text: string, options?: PIIDetectOptions): boolean {
    return this.detect(text, options).length > 0;
  }

  /**
   * 统计各 kind 数量
   */
  count(text: string, options?: PIIDetectOptions): Record<PIIKind, number> {
    const grouped = this.detectGrouped(text, options);
    return {
      phone: grouped.phone.length,
      email: grouped.email.length,
      idCard: grouped.idCard.length,
      creditCard: grouped.creditCard.length,
      ip: grouped.ip.length,
    };
  }
}