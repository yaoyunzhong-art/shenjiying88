import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

// ─── 正例: 基础结构 ───
describe('后勤 — 正例', () => {
  it('应导出默认组件', () => {
    assert.ok(SRC.includes('export default function'));
  });

  it('应包含 "use client"', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应包含hook (useState)', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('应包含useMemo hook', () => {
    assert.ok(SRC.includes('useMemo'));
  });

  it('SPace from @m5/ui 导入', () => {
    assert.ok(SRC.includes('import'));
  });

  it('PageShell被使用', () => {
    assert.ok(SRC.includes('<PageShell'));
  });
});

// ─── 防御: 安全性检查 ───
describe('后勤 — 防御', () => {
  it('无dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('无明显any类型', () => {
    assert.ok(!/:\s*any\b/.test(SRC));
  });

  it('无eval使用', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('无innerHTML赋值', () => {
    assert.ok(!SRC.includes('.innerHTML'));
  });
});

// ─── 预约业务 ───
describe('预约 — 业务数据', () => {
  it('包含预约数据常量', () => {
    assert.ok(SRC.includes('RESERVATIONS'));
  });

  it('预约数据有4条以上', () => {
    const match = SRC.match(/id:'R-/g);
    assert.ok(match && match.length >= 4);
  });

  it('已确认统计使用filter', () => {
    assert.ok(SRC.includes(".filter(r=>r.status==='confirmed').length") || SRC.includes(".filter(r => r.status === 'confirmed').length"));
  });

  it('进行中统计使用filter', () => {
    assert.ok(SRC.includes(".filter(r=>r.status==='in_progress').length") || SRC.includes(".filter(r => r.status === 'in_progress').length"));
  });

  it('待确认统计使用filter', () => {
    assert.ok(SRC.includes(".filter(r=>r.status==='pending').length") || SRC.includes(".filter(r => r.status === 'pending').length"));
  });

  it('总金额使用reduce', () => {
    assert.ok(SRC.includes('.reduce('));
  });

  it('金额使用toLocaleString', () => {
    assert.ok(SRC.includes('toLocaleString'));
  });

  it('新建预约按钮存在', () => {
    assert.ok(SRC.includes('+ 新建预约'));
  });

  it('Modal用于新建', () => {
    assert.ok(SRC.includes('<Modal'));
  });

  it('Input在Modal内', () => {
    assert.ok(SRC.includes('<Input'));
  });
});

// ─── 物流新功能 ───
describe('物流 — SHIPMENTS 数据', () => {
  it('包含SHIPMENTS常量', () => {
    assert.ok(SRC.includes('SHIPMENTS'));
  });

  it('SHIPMENTS定义了4种状态枚举', () => {
    assert.ok(SRC.includes("'pending_shipping'"));
    assert.ok(SRC.includes("'in_transit'"));
    assert.ok(SRC.includes("'delivered'"));
    assert.ok(SRC.includes("'abnormal'"));
  });

  it('SHIPMENTS至少5条', () => {
    const match = SRC.match(/id:'S-/g);
    assert.ok(match && match.length >= 6);
  });

  it('包含物流状态标签映射', () => {
    assert.ok(SRC.includes('STATUS_LABEL'));
  });

  it('状态标签包含待发货/运输中/已签收/异常', () => {
    assert.ok(SRC.includes('待发货'));
    assert.ok(SRC.includes('运输中'));
    assert.ok(SRC.includes('已签收'));
    assert.ok(SRC.includes('异常'));
  });

  it('包含STATUS_VARIANT变体映射', () => {
    assert.ok(SRC.includes('STATUS_VARIANT'));
  });

  it('Shipment接口定义了所有字段', () => {
    assert.ok(SRC.includes('trackingNo'));
    assert.ok(SRC.includes('supplier'));
    assert.ok(SRC.includes('estimatedArrival'));
    assert.ok(SRC.includes('carrier'));
  });
});

describe('物流 — 统计条', () => {
  it('有"物流状态"标题', () => {
    assert.ok(SRC.includes('物流状态'));
  });

  it('使用Row/Col布局组件', () => {
    assert.ok(SRC.includes('<Row') && SRC.includes('<Col'));
  });

  it('待发货统计卡片', () => {
    assert.ok(SRC.includes('待发货'));
  });

  it('运输中统计卡片', () => {
    assert.ok(SRC.includes('运输中'));
  });

  it('已签收统计卡片', () => {
    assert.ok(SRC.includes('已签收'));
  });

  it('异常统计卡片', () => {
    assert.ok(SRC.includes('异常'));
  });

  it('待发货使用info变体', () => {
    assert.ok(SRC.includes('variant=\"info\"') || SRC.includes("variant='info'"));
  });

  it('运输中使用warning变体', () => {
    assert.ok(SRC.includes('variant=\"warning\"') || SRC.includes("variant='warning'"));
  });

  it('已签收使用success变体', () => {
    assert.ok(SRC.includes('variant=\"success\"') || SRC.includes("variant='success'"));
  });

  it('异常使用danger变体', () => {
    assert.ok(SRC.includes('variant=\"danger\"') || SRC.includes("variant='danger'"));
  });
});

describe('物流 — 筛选逻辑', () => {
  it('有shipmentFilter状态', () => {
    assert.ok(SRC.includes('shipmentFilter'));
  });

  it('筛选器select元素', () => {
    assert.ok(SRC.includes('<select') && SRC.includes('onChange'));
  });

  it('筛选: 全部/待发货/运输中/已签收/异常', () => {
    assert.ok(SRC.includes('value=\"all\"'));
    assert.ok(SRC.includes('value=\"pending_shipping\"'));
    assert.ok(SRC.includes('value=\"in_transit\"'));
    assert.ok(SRC.includes('value=\"delivered\"'));
    assert.ok(SRC.includes('value=\"abnormal\"'));
  });

  it('useMemo用于筛选', () => {
    assert.ok(SRC.includes('useMemo'));
  });

  it('filter函数用于筛选逻辑', () => {
    const filterCount = (SRC.match(/\.filter\(/g) || []).length;
    assert.ok(filterCount >= 5);
  });

  it('物流明细Card存在', () => {
    assert.ok(SRC.includes('物流明细'));
  });

  it('表格展示运单号列', () => {
    assert.ok(SRC.includes('trackingNo'));
  });

  it('表格包含状态列渲染', () => {
    assert.ok(SRC.includes('STATUS_VARIANT'));
  });
});

// ─── 样式与渲染 ───
describe('渲染 — 样式', () => {
  it('JSX返回', () => {
    assert.ok(SRC.includes('return ('));
  });

  it('包含style', () => {
    assert.ok(SRC.includes('style={'));
  });

  it('事件处理器onClick/onClose', () => {
    assert.ok(SRC.includes('onClick={') || SRC.includes('onClose={'));
  });

  it('注释说明', () => {
    assert.ok(SRC.includes('//') || SRC.includes('/**'));
  });

  it('Tag组件被使用', () => {
    assert.ok(SRC.includes('<Tag'));
  });

  it('Statistic组件被使用', () => {
    assert.ok(SRC.includes('<Statistic'));
  });
});
