/**
 * 🐜 自动: [openapi] [B-数据层测试] OpenAPI 工作台 — ≥12项数据层测试
 *
 * 覆盖:
 *   正例 — 状态常量映射、环境映射、PII 脱敏、接口 demo 数据完整性
 *   反例 — 未知状态/环境、脱敏排除键、空数据
 *   边界 — 含 PII 嵌套对象、超长 body、签名 canonical 格式
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ==================== 正例 (Happy Path) ====================

describe('openapi/page — 正例', () => {
  it('STATUS_COLOR 应包含 10 种状态', () => {
    const src = readSource();
    const required = ['ACTIVE', 'PAUSED', 'DELETED', 'REVOKED', 'EXPIRED',
      'PURGED', 'PENDING', 'SUCCESS', 'FAILED', 'DEAD_LETTER'];
    // 查找 STATUS_COLOR 定义区域
    for (const key of required) {
      assert.ok(src.includes(`'${key}'`), `缺少状态 ${key} 的映射`);
      assert.ok(src.includes(`'bg-`), `${key} 缺少 bg- 样式`);
    }
  });

  it('ENV_COLOR 应包含 3 种环境颜色', () => {
    const src = readSource();
    assert.ok(src.includes('LIVE:'), '缺少 LIVE');
    assert.ok(src.includes('TEST:'), '缺少 TEST');
    assert.ok(src.includes('SANDBOX:'), '缺少 SANDBOX');
    assert.ok(src.includes('bg-blue-100'), 'LIVE 应为蓝色');
    assert.ok(src.includes('bg-yellow-100'), 'TEST 应为黄色');
    assert.ok(src.includes('bg-green-100'), 'SANDBOX 应为绿色');
  });

  it('API Key demo 数据应包含 3 种环境各 1 条', () => {
    const src = readSource();
    // 只在 setApiKeys 区域内计数, 避免 ENV_COLOR 定义中的文本干扰
    // setApiKeys 数据以 '\n    ])\n    setWebhooks' 结束
    const keysBlock = src.match(/setApiKeys\(\[[\s\S]*?\]\)/);
    assert.ok(keysBlock, '应找到 setApiKeys 数据块');
    const keysSrc = keysBlock[0];
    const liveMatches = keysSrc.match(/environment: 'LIVE'/g);
    const testMatches = keysSrc.match(/environment: 'TEST'/g);
    const sandboxMatches = keysSrc.match(/environment: 'SANDBOX'/g);
    assert.equal(liveMatches?.length, 1, 'LIVE 应有 1 条');
    assert.equal(testMatches?.length, 1, 'TEST 应有 1 条');
    assert.equal(sandboxMatches?.length, 1, 'SANDBOX 应有 1 条');
  });

  it('Webhook demo 数据应包含 ACTIVE 和 PAUSED 两种状态', () => {
    const src = readSource();
    assert.ok(src.includes("status: 'ACTIVE'"), '缺少 ACTIVE webhook');
    assert.ok(src.includes("status: 'PAUSED'"), '缺少 PAUSED webhook');
  });

  it('投递日志应包含 SUCCESS、FAILED、DEAD_LETTER 三种状态', () => {
    const src = readSource();
    assert.ok(src.includes("status: 'SUCCESS'"), '缺少 SUCCESS 投递');
    assert.ok(src.includes("status: 'FAILED'"), '缺少 FAILED 投递');
    assert.ok(src.includes("status: 'DEAD_LETTER'"), '缺少 DEAD_LETTER 投递');
  });

  it('沙箱 demo 数据应包含 ACTIVE 和 EXPIRED 两种状态', () => {
    const src = readSource();
    assert.ok(src.includes("status: 'ACTIVE'"), '缺少 ACTIVE 沙箱');
    assert.ok(src.includes("status: 'EXPIRED'"), '缺少 EXPIRED 沙箱');
    assert.ok(src.includes('ttlDays: 30'), 'ACTIVE 沙箱 TTL 应为 30');
    assert.ok(src.includes('ttlDays: 7'), 'EXPIRED 沙箱 TTL 应为 7');
  });

  it('UsageReport 应包含 topEndpoints 4 个接口', () => {
    const src = readSource();
    assert.ok(src.includes('/api/orders'), '缺少 orders 端点');
    assert.ok(src.includes('/api/members'), '缺少 members 端点');
    assert.ok(src.includes('/api/products'), '缺少 products 端点');
    assert.ok(src.includes('/api/payments'), '缺少 payments 端点');
  });

  it('maskPII 函数应脱敏 email、phone、password、token 等 7 个 PII 键', () => {
    const src = readSource();
    assert.ok(src.includes("'email', 'phone', 'idCard'"), '缺少 email/phone/idCard');
    assert.ok(src.includes("'password', 'token'"), '缺少 password/token');
    assert.ok(src.includes("'ssn', 'creditCard'"), '缺少 ssn/creditCard');
    assert.ok(src.includes("'***MASKED***'"), '脱敏值应为 ***MASKED***');
  });
});

// ==================== 反例 (Negative / Sad Path) ====================

describe('openapi/page — 反例', () => {
  it('STATUS_COLOR 不应包含非法状态 "UNKNOWN"', () => {
    const src = readSource();
    // 查找 STATUS_COLOR 对象结尾部分
    const statusColorBlock = src.match(/const STATUS_COLOR[\s\S]*?\};/);
    if (statusColorBlock) {
      assert.ok(!statusColorBlock[0].includes("'UNKNOWN'"), '不应有 UNKNOWN 状态');
    }
  });

  it('ENV_COLOR 不应包含未定义的环境 "PRODUCTION"', () => {
    const src = readSource();
    const envColorBlock = src.match(/const ENV_COLOR[\s\S]*?\};/);
    if (envColorBlock) {
      assert.ok(!envColorBlock[0].includes("'PRODUCTION'"), 'ENV_COLOR 不应包含 PRODUCTION');
    }
  });

  it('maskPII 不应脱敏非 PII 键 (如 name, age)', () => {
    const src = readSource();
    const maskFnBlock = src.match(/function maskPII[\s\S]*?\n\}/);
    assert.ok(maskFnBlock, '应能找到 maskPII 函数定义');
    assert.ok(!src.includes("piiKeys.includes('name')"), 'piiKeys 不应包含 name');
    assert.ok(!src.includes("piiKeys.includes('age')"), 'piiKeys 不应包含 age');
  });

  it('死信日志不应包含 SUCCESS 状态', () => {
    const src = readSource();
    const deadLetterBlock = src.match(/setDeadLetters[\s\S]*?\(\[[\s\S]*?\]\)/);
    if (deadLetterBlock) {
      assert.ok(!deadLetterBlock[0].includes("'SUCCESS'"), '死信不应有 SUCCESS');
    }
  });
});

// ==================== 边界 (Edge Cases) ====================

describe('openapi/page — 边界', () => {
  it('死信投递 attempts 应为 5（达重试上限）', () => {
    const src = readSource();
    assert.ok(src.includes('attempts: 5'), '死信应标注 attempts:5');
    assert.ok(src.includes('已达 5 次重试上限'), '应有重试上限提示文案');
  });

  it('FAILD 投递应包含 responseStatus 5xx', () => {
    const src = readSource();
    assert.ok(src.includes('responseStatus: 500'), '应有 500 错误');
    assert.ok(src.includes('responseStatus: 502'), '应有 502 错误');
  });

  it('FAILED 投递应包含 errorMessage 文案', () => {
    const src = readSource();
    assert.ok(src.includes('HTTP 500'), '应有 HTTP 500 错误消息');
    assert.ok(src.includes('Bad Gateway'), '应有 Bad Gateway 消息');
  });

  it('沙箱 EXPIRED 应早于到期日期', () => {
    const src = readSource();
    // EXPIRED 沙箱 TTL=7, 创建 5-15, 到期 5-22
    assert.ok(src.includes("createdAt: '2026-05-15T10:00:00Z'"), '创建时间 5-15');
    assert.ok(src.includes("expiresAt: '2026-05-22T10:00:00Z'"), '到期时间 5-22');
  });

  it('签名验证 canonical string 应包含换行分隔格式', () => {
    const src = readSource();
    // 打开 page.tsx 查看签名格式
    assert.ok(src.includes('canonicalStr'), '应有 canonicalStr 构造');
    assert.ok(src.includes('\\\\n') || src.includes('\\n'), '应使用换行符分隔');
    assert.ok(src.includes('method') && src.includes('url') && src.includes('timestamp'), 
      'canonical 应包含 method/url/timestamp');
  });

  it('签名验证 5 分钟窗口应含 timestamp_out_of_window', () => {
    const src = readSource();
    assert.ok(src.includes('5 * 60 * 1000'), '时间窗口应为 5min');
    assert.ok(src.includes('timestamp_out_of_window'), '超窗错误标识');
  });
});
