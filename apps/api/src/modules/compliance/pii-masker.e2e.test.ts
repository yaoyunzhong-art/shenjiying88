import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * pii-masker.e2e.test.ts - Phase-20 T40
 * 用途: 数据脱敏 e2e 验证
 *
 * 验收 (6 cases):
 * - AC-1: 单个 phone / email / idCard / creditCard / IP 脱敏
 * - AC-2: 文本多 PII 一次性脱敏
 * - AC-3: 替换字符自定义
 * - AC-4: 反向: 无 PII 文本不变
 * - AC-5: withKind 标记
 * - AC-6: maskRatio 统计
 */
import { PIIDetectorService } from './pii-detector.service';
import { PIIMaskerService } from './pii-masker.service';

describe('PIIMaskerService · Phase-20 T40', () => {
  let detector: PIIDetectorService;
  let masker: PIIMaskerService;

  beforeEach(() => {
    detector = new PIIDetectorService();
    masker = new PIIMaskerService(detector);
  });

  // AC-1: 5 种 PII 单个脱敏
  it('AC-1 individual masking: phone/email/idCard/creditCard/ip', () => {
    expect(masker.maskPhone('13812345678')).toBe('138****5678');
    expect(masker.maskEmail('alice@example.com')).toBe('a***@example.com');
    expect(masker.maskIdCard('110101199003078013')).toBe('110101********8013');
    expect(masker.maskCreditCard('4111111111111111')).toBe('411111******1111');
    expect(masker.maskIP('192.168.1.42')).toBe('192.168.*.*');
  });

  // AC-2: 文本多 PII 一次性脱敏
  it('AC-2 text masking: multiple PII at once', () => {
    const text = 'User alice@example.com (13812345678) from 192.168.1.1';
    const masked = masker.maskText(text);
    expect(masked).toContain('a***@example.com');
    expect(masked).toContain('138****5678');
    expect(masked).toContain('192.168.*.*');
    expect(masked).not.toContain('alice@example.com');
    expect(masked).not.toContain('13812345678');
    expect(masked).not.toContain('192.168.1.1');
  });

  // AC-3: 替换字符自定义
  it('AC-3 custom mask character', () => {
    const text = 'Phone: 13812345678';
    const masked = masker.maskText(text, { maskChar: '#' });
    expect(masked).toBe('Phone: 138####5678');
  });

  // AC-4: 反向 - 无 PII 文本不变
  it('AC-4 no PII: text unchanged', () => {
    const text = 'Hello world, this is a normal text';
    const masked = masker.maskText(text);
    expect(masked).toBe(text);
    expect(masker.maskText('')).toBe('');
  });

  // AC-5: withKind 标记
  it('AC-5 withKind: prefix PII type', () => {
    const text = 'Contact: alice@example.com or 13812345678';
    const masked = masker.maskText(text, { withKind: true });
    expect(masked).toContain('email:a***@example.com');
    expect(masked).toContain('phone:138****5678');
  });

  // AC-6: maskRatio 统计
  it('AC-6 maskRatio: coverage calculation', () => {
    const text = 'Call 13812345678 now';
    const ratio = masker.maskRatio(text);
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(1);
    expect(masker.maskRatio('no PII here')).toBe(0);
  });
});
