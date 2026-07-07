import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * pii-detector.e2e.test.ts - Phase-20 T39
 * 用途: PII 检测器 e2e 验证
 *
 * 验收 (6 cases):
 * - AC-1: 中国大陆手机号检测 (含无效号)
 * - AC-2: Email 检测 (含子域名)
 * - AC-3: 中国身份证 (含校验位)
 * - AC-4: 信用卡 Luhn 校验 (含无效卡号)
 * - AC-5: IPv4 检测
 * - AC-6: 综合文本多 PII 检测 + 置信度过滤
 */
import { PIIDetectorService, PIIKind } from './pii-detector.service';

describe('PIIDetectorService · Phase-20 T39', () => {
  let svc: PIIDetectorService;

  beforeEach(() => {
    svc = new PIIDetectorService();
  });

  // AC-1: 中国大陆手机号 (1[3-9]xxxxxxxxx,11 位)
  it('AC-1 phone detection: 11-digit CN mobile', () => {
    const text = '联系电话: 13812345678,备用 15987654321';
    const matches = svc.detect(text, { kinds: ['phone'] });
    expect(matches.length).toBe(2);
    expect(matches[0].value).toBe('13812345678');
    expect(matches[1].value).toBe('15987654321');
    expect(matches[0].kind).toBe('phone');
    expect(matches[0].confidence).toBeGreaterThanOrEqual(0.9);
  });

  // AC-2: Email (含子域名)
  it('AC-2 email detection: standard + subdomain', () => {
    const text = 'Contact: alice@example.com or support@mail.example.co.uk';
    const matches = svc.detect(text, { kinds: ['email'] });
    expect(matches.length).toBe(2);
    expect(matches[0].value).toBe('alice@example.com');
    expect(matches[1].value).toBe('support@mail.example.co.uk');
  });

  // AC-3: 中国身份证 (18 位 + 校验位)
  it('AC-3 ID card: 18-digit with checksum validation', () => {
    // 110101199003078013 (有效校验位,sum=218, 218%11=9, codes[9]='3')
    const validId = '110101199003078013';
    // 110101199003078010 (校验位错误,应降级置信度)
    const invalidId = '110101199003078010';
    const text = `valid: ${validId} invalid: ${invalidId}`;
    // 默认 minConfidence=0.8,只有有效校验位通过 (confidence 0.99)
    const all = svc.detect(text, { kinds: ['idCard'] });
    expect(all.length).toBe(1);
    const validMatch = all.find((m) => m.value === validId);
    expect(validMatch).toBeDefined();
    expect(validMatch!.confidence).toBeGreaterThan(0.95); // 校验通过高置信度
    // 放宽阈值,无效校验位也出现但低置信度 (0.6)
    const withLowerThreshold = svc.detect(text, {
      kinds: ['idCard'],
      minConfidence: 0.5,
    });
    expect(withLowerThreshold.length).toBe(2);
    const invalidMatch = withLowerThreshold.find((m) => m.value === invalidId);
    expect(invalidMatch).toBeDefined();
    expect(invalidMatch!.confidence).toBeLessThan(0.8);
  });

  // AC-4: 信用卡 Luhn 校验
  it('AC-4 credit card: Luhn-valid vs invalid', () => {
    // 4111-1111-1111-1111 (Visa 测试号,Luhn 通过)
    const valid = '4111111111111111';
    // 4111-1111-1111-1112 (末位错,Luhn 失败)
    const invalid = '4111111111111112';
    const text = `valid: ${valid} invalid: ${invalid}`;
    const highConf = svc.detect(text, { kinds: ['creditCard'], minConfidence: 0.9 });
    expect(highConf.length).toBe(1);
    expect(highConf[0].value.replace(/[ -]/g, '')).toBe(valid);
    expect(highConf[0].confidence).toBe(0.95);
    // 放宽阈值,无效卡号也出现但低置信度
    const lowConf = svc.detect(text, { kinds: ['creditCard'], minConfidence: 0.3 });
    expect(lowConf.length).toBe(2);
    const invalidMatch = lowConf.find((m) => m.value.replace(/[ -]/g, '') === invalid);
    expect(invalidMatch!.confidence).toBeLessThan(0.5);
  });

  // AC-5: IPv4 地址 (含边界)
  it('AC-5 IPv4 detection: valid + boundary', () => {
    const text = 'Server: 192.168.1.1, Edge: 10.0.0.255, Bad: 999.1.1.1';
    const matches = svc.detect(text, { kinds: ['ip'] });
    // 999.1.1.1 不合法,不应被识别
    expect(matches.length).toBe(2);
    expect(matches[0].value).toBe('192.168.1.1');
    expect(matches[1].value).toBe('10.0.0.255');
  });

  // AC-6: 综合多 PII 检测 + 分组 + 计数
  it('AC-6 mixed text: detect all kinds + group + count', () => {
    const text = `
      User: alice@example.com
      Phone: 13812345678
      IP: 203.0.113.42
      Server: 10.0.0.1
    `;
    const all = svc.detect(text);
    // 至少 4 个 PII
    expect(all.length).toBeGreaterThanOrEqual(4);

    const grouped = svc.detectGrouped(text);
    expect(grouped.email.length).toBe(1);
    expect(grouped.phone.length).toBe(1);
    expect(grouped.ip.length).toBe(2);

    const counts = svc.count(text);
    expect(counts.email).toBe(1);
    expect(counts.phone).toBe(1);
    expect(counts.ip).toBe(2);
    expect(counts.creditCard).toBe(0);

    expect(svc.hasPII(text)).toBe(true);
    expect(svc.hasPII('no sensitive data here')).toBe(false);
  });
});
