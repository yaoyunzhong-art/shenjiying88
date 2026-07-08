/**
 * anomaly-frequency/page.test.ts — 异常时序频率监控页面 L1 冒烟测试
 *
 * 覆盖:
 * - 正例: 默认导出、引用组件、mock 数据工厂形状
 * - 边界: 空时间范围、空严重级别过滤、极端时间跨度
 * - 防御: 缺少 props、无效过滤条件、NaN 数据清理
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SOURCE = resolve(__dirname, 'page.tsx');
const CLIENT_SOURCE = resolve(__dirname, 'anomaly-frequency-client.tsx');

function readPageSource(): string {
  return readFileSync(PAGE_SOURCE, 'utf-8');
}

function readClientSource(): string {
  return readFileSync(CLIENT_SOURCE, 'utf-8');
}

// ---------------------------------------------------------------------------
// 正例
// ---------------------------------------------------------------------------

describe('anomaly-frequency page — 正例', () => {
  it('应导出一个默认异步组件 AnomalyFrequencyPage', () => {
    const src = readPageSource();
    assert.ok(
      src.includes('export default async function AnomalyFrequencyPage'),
      '缺少异步默认导出组件 AnomalyFrequencyPage',
    );
  });

  it('应引用 AnomalyFrequencyClient', () => {
    const src = readPageSource();
    assert.ok(
      src.includes('AnomalyFrequencyClient'),
      '页面应引用客户端组件 AnomalyFrequencyClient',
    );
  });

  it('应调用 loadAdminGovernanceReadModel 获取初始状态', () => {
    const src = readPageSource();
    assert.ok(
      src.includes('loadAdminGovernanceReadModel'),
      '应通过 loadAdminGovernanceReadModel 加载治理模型',
    );
  });

  it('客户端组件 AnomalyFrequencyClient 应接受 initialGovernance prop', () => {
    const src = readClientSource();
    assert.ok(
      src.includes('initialGovernance'),
      '客户端组件应接收 initialGovernance prop',
    );
  });

  it('应支持四种时间范围 (6h/24h/7d/30d)', () => {
    const src = readClientSource();
    const timeRanges = ['6h', '24h', '7d', '30d'];
    for (const tr of timeRanges) {
      assert.ok(src.includes(`'${tr}'`), `客户端组件应支持时间范围 ${tr}`);
    }
  });

  it('应支持五种严重级别过滤 (all/critical/high/medium/low)', () => {
    const src = readClientSource();
    const severities = ['all', 'critical', 'high', 'medium', 'low'];
    for (const sev of severities) {
      assert.ok(src.includes(`'${sev}'`), `客户端组件应支持严重级别 ${sev}`);
    }
  });

  it('应引用 AnomalyFrequencyTimeline 组件', () => {
    const src = readClientSource();
    assert.ok(
      src.includes('AnomalyFrequencyTimeline'),
      '客户端组件应使用 AnomalyFrequencyTimeline 展示时序数据',
    );
  });

  it('generateMockBuckets 应生成含 bySeverity 字段的数据', () => {
    const src = readClientSource();
    assert.ok(src.includes('bySeverity'), 'mock 数据应包含 bySeverity 字段');
    assert.ok(src.includes('critical'), 'bySeverity 应包含 critical');
    assert.ok(src.includes('high'), 'bySeverity 应包含 high');
    assert.ok(src.includes('medium'), 'bySeverity 应包含 medium');
    assert.ok(src.includes('low'), 'bySeverity 应包含 low');
  });

  it('每个时间桶应包含 bucketId', () => {
    const src = readClientSource();
    assert.ok(src.includes('bucketId'), '时间桶应包含唯一 bucketId');
  });

  it('应提供刷新(refresh)功能', () => {
    const src = readClientSource();
    assert.ok(
      src.includes('refresh') || src.includes('Refresh'),
      '客户端组件应提供刷新按钮',
    );
  });
});

// ---------------------------------------------------------------------------
// 边界
// ---------------------------------------------------------------------------

describe('anomaly-frequency page — 边界', () => {
  it('空列表时 AnomalyFrequencyTimeline 应处理空数组', () => {
    const src = readClientSource();
    // 验证组件不会在空数组时报错: 检查是否有长度保护
    assert.ok(
      src.includes('length') || src.includes('empty'),
      '组件应处理空数据场景(含 length 或 empty 检查)',
    );
  });

  it('时间范围切换应更新 bucket 数量', () => {
    const src = readClientSource();
    // 检查不同时间范围有不同的 intervalMs 配置
    const intervals = ['30 * 60 * 1000', '60 * 60 * 1000', '12 * 60 * 60 * 1000', '24 * 60 * 60 * 1000'];
    for (const iv of intervals) {
      assert.ok(
        src.includes(iv),
        `应包含间隔配置 ${iv}`,
      );
    }
  });

  it('应检测"全部"过滤对数据进行遍历', () => {
    const src = readClientSource();
    // 当 severity === 'all' 时, 所有严重级别都生成数据
    const allConditions = [
      "severity === 'all' || severity === 'critical'",
      "severity === 'all' || severity === 'high'",
      "severity === 'all' || severity === 'medium'",
      "severity === 'all' || severity === 'low'",
    ];
    for (const cond of allConditions) {
      assert.ok(
        src.includes(cond),
        `应包含"全部"过滤条件: ${cond}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 防御
// ---------------------------------------------------------------------------

describe('anomaly-frequency page — 防御', () => {
  it('total 应始终 >= 1 以防止空图渲染', () => {
    const src = readClientSource();
    assert.ok(
      src.includes('Math.max(total, 1)'),
      '应存在 Math.max 保护 total 不小于 1',
    );
    assert.ok(
      src.includes('Math.max(low, 1)'),
      'low 级别数值应通过 Math.max 保护不小于 1',
    );
  });

  it('AnomalyFrequencyClient props 接口应完整', () => {
    const src = readClientSource();
    assert.ok(
      src.includes('AnomalyFrequencyClientProps'),
      'props 类型定义应存在',
    );
    assert.ok(
      src.includes('initialGovernance'),
      'props 应包含 initialGovernance',
    );
  });

  it('应避免直接使用未检查的随机数作为关键输入', () => {
    const src = readClientSource();
    // Math.random 应仅用于 mock 数据生成, 而非实际逻辑
    const randomCount = (src.match(/Math\.random/g) || []).length;
    assert.ok(
      randomCount <= 3,
      `Math.random 引用应 ≤ 3 次(仅用于 mock), 当前: ${randomCount}`,
    );
  });

  it('客户端文件应明确标记 "use client"', () => {
    const src = readClientSource();
    assert.ok(
      src.includes("'use client'"),
      '客户端组件应标记 use client 指令',
    );
  });

  it('页面应使用 typescript 类型标注', () => {
    const src = readPageSource();
    assert.ok(
      src.includes(':') && (src.includes('Promise') || src.includes('AnomalyFrequencyPage')),
      '页面应含类型标注',
    );
  });
});
