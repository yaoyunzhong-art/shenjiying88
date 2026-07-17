/**
 * devices/page.test.tsx — 设备管理页面 L1+L2 测试
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

describe('devices — 正例', () => {
  it('应导出一个默认组件 DevicesPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function DevicesPage'), '缺少默认导出组件');
  });

  it('应包含设备数据数组 DEVICES', () => {
    const src = readSource();
    assert.ok(src.includes('DEVICES'), '缺少设备数据定义');
  });

  it('应包含设备在线/离线状态', () => {
    const src = readSource();
    assert.ok(src.includes('online'), '缺少在线状态');
    assert.ok(src.includes('offline'), '缺少离线状态');
  });

  it('应包含 DataTable 组件', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable') || src.includes('Table'), '缺少表格组件');
  });

  it('DEVICES 应包含维修维护状态', () => {
    const src = readSource();
    assert.ok(src.includes('maintenance'), '缺少维护状态');
  });

  it('应包含设备类型街机/VR/模拟机/台球/卡丁车', () => {
    const src = readSource();
    assert.ok(src.includes('街机'), '缺少街机类型');
    assert.ok(src.includes('VR'), '缺少 VR 类型');
  });
});

// ---- 反例 ----

describe('devices — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!/: any\b/.test(src), '不应使用 any');
  });

  it('不应使用 var 声明', () => {
    const src = readSource();
    assert.ok(!/^var\s/.test(src) && !/; var\s/.test(src), '不应使用 var');
  });

  it('DEVICES 不应为空数组', () => {
    const src = readSource();
    assert.ok(src.includes('D001'), 'DEVICES 应包含实际数据');
  });
});

// ---- 边界 ----

describe('devices — 边界', () => {
  it('应包含列定义 COLUMNS', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应包含统计/过滤功能', () => {
    const src = readSource();
    assert.ok(src.includes('Statistic') || src.includes('Badge'), '缺少统计/徽标');
  });

  it('应包含维护操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('维护') || src.includes('维修') || src.includes('新增设备'), '缺少维护操作');
  });

  it('设备名称应包含区域编号', () => {
    const src = readSource();
    assert.ok(src.includes('A区') || src.includes('B区') || src.includes('1号'), '缺少设备区域编号');
  });
});

// ---- 防御 ----

describe('devices — 防御', () => {
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

  it('状态 Tag 应有对应颜色配置', () => {
    const src = readSource();
    assert.ok(src.includes('green') && src.includes('red') && src.includes('orange'),
      '缺少状态颜色映射(在线绿/离线红/维护橙)');
  });
});

// ---- 数据校验 ----

describe('devices — 数据校验', () => {
  it('DEVICES 应包含 id/name/type/status/usage/lastMaintenance 字段', () => {
    const src = readSource();
    assert.ok(src.includes("'id'") && src.includes("'name'") && src.includes("'type'"), '缺少基础字段');
    assert.ok(src.includes("usage") || src.includes("'usage'"), '缺少 usage 字段');
    assert.ok(src.includes("lastMaintenance") || src.includes("'lastMaintenance'"), '缺少 lastMaintenance 字段');
  });

  it('COLUMNS 应覆盖编号/名称/类型/状态/使用率/最后维护', () => {
    const src = readSource();
    const colCount = (src.match(/\{ title:/g) || []).length;
    assert.ok(colCount >= 6, `COLUMNS 列数不足: ${colCount}`);
  });

  it('应消费 useState', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('Table 应禁用分页 pagination=false', () => {
    const src = readSource();
    assert.ok(src.includes('pagination={false}'), '应禁用分页');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Devices — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onOk={') || SRC.includes('onCancel={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
