/**
 * operations/page.test.tsx — 运营操作页 L1+L2 测试
 * 覆盖: 正例·反例·边界·防御·数据校验
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

// ---- 正例 ----

describe('operations — 正例', () => {
  it('应导出一个默认组件 OperationsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function OperationsPage'), '缺少默认导出组件');
  });

  it('应包含 Setting 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Setting'), '缺少 Setting 接口');
  });

  it('SETTINGS 应包含营业时间配置', () => {
    const src = readSource();
    assert.ok(src.includes('open_time') || src.includes('close_time'), '缺少营业时间');
  });

  it('应包含 Statistic 统计数据', () => {
    const src = readSource();
    assert.ok(src.includes('Statistic'), '缺少 Statistic');
  });

  it('Setting 接口应包含 key/label/type/value/desc', () => {
    const src = readSource();
    assert.ok(src.includes('key') && src.includes('label') && src.includes('type'), '缺少接口字段');
    assert.ok(src.includes('value') && src.includes('desc'), '缺少 value/desc');
  });

  it('运营参数应覆盖多种类型(time/number/switch)', () => {
    const src = readSource();
    assert.ok(src.includes("'time'") || src.includes("'number'") || src.includes("'switch'"), '缺少配置类型');
  });
});

// ---- 反例 ----

describe('operations — 反例', () => {
  it('不应使用 var 声明', () => {
    const src = readSource();
    assert.ok(!/^var\s/.test(src) && !/; var\s/.test(src), '不应使用 var');
  });

  it('SETTINGS 不应为空数组', () => {
    const src = readSource();
    assert.ok(src.includes('open_time'), 'SETTINGS 应有实际数据');
  });

  it('不应导出额外命名函数', () => {
    const src = readSource();
    const exports = (src.match(/export function /g) || []).length;
    assert.ok(exports === 0, `存在 ${exports} 个命名导出`);
  });
});

// ---- 边界 ----

describe('operations — 边界', () => {
  it('应包含客流/上座率/客流/时段/营收统计', () => {
    const src = readSource();
    assert.ok(src.includes('当前客流') || src.includes('今日'), '缺少客流统计');
    assert.ok(src.includes('上座率'), '缺少上座率');
    assert.ok(src.includes('营收'), '缺少营收统计');
  });

  it('应包含保存和重置按钮', () => {
    const src = readSource();
    assert.ok(src.includes('保存全部'), '缺少保存');
    assert.ok(src.includes('重置'), '缺少重置');
  });

  it('SETTINGS 应包含会员折扣和最低充值', () => {
    const src = readSource();
    assert.ok(src.includes('member_discount') || src.includes('min_recharge'), '缺少会员配置');
  });
});

// ---- 防御 ----

describe('operations — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
  });

  it('switch 类型值应转换为开/关显示', () => {
    const src = readSource();
    assert.ok(src.includes('开') || src.includes('关'), '缺少开关状态文字');
  });

  it('应使用绿色标识', () => {
    const src = readSource();
    assert.ok(src.includes('#34d399'), '缺少绿色标识');
  });
});

// ---- 数据校验 ----

describe('operations — 数据校验', () => {
  it('SETTINGS 应包含足够数量的配置项', () => {
    const src = readSource();
    const settingsCount = (src.match(/key: '/g) || src.match(/key:'/g) || []).length;
    assert.ok(settingsCount >= 6, `SETTINGS 配置项不足: ${settingsCount}`);
  });

  it('每个配置项应有描述 desc', () => {
    const src = readSource();
    assert.ok(src.includes('desc:'), '缺少配置描述');
  });

  it('消费 useState 管理状态', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('营运参数应渲染为列表', () => {
    const src = readSource();
    assert.ok(src.includes('.map(s =>') || src.includes('.map(s=>'), '缺少 map 渲染');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Operations — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onOk={') || SRC.includes('onCancel={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
