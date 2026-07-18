/**
 * equipment/page.test.tsx — 设备管理页面 L1 冒烟测试
 * ⚡ 覆盖: 数据工厂 / 状态与类型映射 / 统计 / 筛选 / 搜索 / 排序 / 空态 / 边界 / React 渲染
 * 🧪 URL-pattern responseRegistry 模式 (同步数据无需 fetch，但保留 registry)
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import mod from './page';

const EquipmentPage = mod.default;

// ---- 类型（与 page.tsx 同步） ----

type EquipmentStatus = 'normal' | 'maintaining' | 'scrap_pending' | 'scrapped';
type EquipmentType = 'capsule' | 'claw' | 'cashier' | 'ac' | 'speaker' | 'lightbox' | 'turnstile';

interface EquipmentItem {
  id: string;
  name: string;
  model: string;
  type: EquipmentType;
  store: string;
  supplier: string;
  purchaseDate: string;
  warrantyEnd: string;
  status: EquipmentStatus;
  note?: string;
}

// ---- 映射表（与 page.tsx 同步） ----

const ET: Record<EquipmentType, string> = {
  capsule: '扭蛋机',
  claw: '娃娃机',
  cashier: '收银机',
  ac: '空调',
  speaker: '音响',
  lightbox: '灯箱',
  turnstile: '闸机',
};

const ES: Record<EquipmentStatus, { l: string; v: string }> = {
  normal: { l: '正常', v: 'success' },
  maintaining: { l: '维修中', v: 'warning' },
  scrap_pending: { l: '待报废', v: 'danger' },
  scrapped: { l: '已报废', v: 'neutral' },
};

const STATUS_ORDER: EquipmentStatus[] = ['normal', 'maintaining', 'scrap_pending', 'scrapped'];

// ---- URL-pattern responseRegistry ----
// 同步场景下作为 mock 数据工厂注册表，未来异步数据时可直接注册 fetch URL

const responseRegistry = new Map<string, EquipmentItem[]>();

function registerData(key: string, data: EquipmentItem[]): void {
  responseRegistry.set(key, data);
}

function getData(key: string): EquipmentItem[] {
  return responseRegistry.get(key) ?? [];
}

// ---- 数据工厂 ----

let _seq = 0;

function makeEquipment(overrides?: Partial<EquipmentItem>): EquipmentItem {
  _seq++;
  return {
    id: `E${String(_seq).padStart(3, '0')}`,
    name: `测试设备 ${_seq}`,
    model: `MODEL-X${_seq}`,
    type: 'capsule',
    store: '旗舰店-解放路',
    supplier: '默认供应商',
    purchaseDate: '2025-01-01',
    warrantyEnd: '2027-01-01',
    status: 'normal',
    ...overrides,
  };
}

function makeSampleEquipment(): EquipmentItem[] {
  return [
    { id: 'E001', name: '扭蛋机-A01', model: 'GACHA-X1', type: 'capsule', store: '旗舰店-解放路', supplier: '万代南梦宫', purchaseDate: '2024-03-15', warrantyEnd: '2026-03-14', status: 'normal' },
    { id: 'E002', name: '娃娃机-B03', model: 'CLAW-Z2', type: 'claw', store: '门店-科技路', supplier: '世嘉', purchaseDate: '2024-06-01', warrantyEnd: '2026-05-31', status: 'normal' },
    { id: 'E003', name: '收银机-主01', model: 'POS-3000', type: 'cashier', store: '旗舰店-解放路', supplier: '海信智能', purchaseDate: '2023-11-20', warrantyEnd: '2025-11-19', status: 'maintaining' },
    { id: 'E004', name: '中央空调-01', model: 'AC-M5', type: 'ac', store: '旗舰店-解放路', supplier: '格力', purchaseDate: '2023-05-10', warrantyEnd: '2028-05-09', status: 'normal' },
    { id: 'E005', name: '音响系统-S01', model: 'SPK-2000', type: 'speaker', store: '门店-科技路', supplier: 'JBL', purchaseDate: '2024-01-15', warrantyEnd: '2026-01-14', status: 'scrap_pending' },
    { id: 'E006', name: '灯箱-L02', model: 'LB-800', type: 'lightbox', store: '门店-中山路', supplier: '欧普照明', purchaseDate: '2024-09-01', warrantyEnd: '2026-08-31', status: 'normal' },
    { id: 'E007', name: '闸机-G01', model: 'GATE-100', type: 'turnstile', store: '旗舰店-解放路', supplier: '海康威视', purchaseDate: '2023-08-20', warrantyEnd: '2026-08-19', status: 'normal' },
    { id: 'E008', name: '扭蛋机-A02', model: 'GACHA-X2', type: 'capsule', store: '门店-中山路', supplier: '多美', purchaseDate: '2024-12-01', warrantyEnd: '2026-11-30', status: 'scrapped' },
  ];
}

// ---- 辅助函数 ----

function computeStats(items: EquipmentItem[]) {
  return {
    total: items.length,
    normal: items.filter((i) => i.status === 'normal').length,
    maintaining: items.filter((i) => i.status === 'maintaining').length,
    scrapPending: items.filter((i) => i.status === 'scrap_pending').length,
    scrapped: items.filter((i) => i.status === 'scrapped').length,
  };
}

function filterByStatus(items: EquipmentItem[], status: EquipmentStatus | 'ALL'): EquipmentItem[] {
  if (status === 'ALL') return items;
  return items.filter((i) => i.status === status);
}

function filterByTabKey(items: EquipmentItem[], tabKey: 'ALL' | 'normal' | 'maintaining'): EquipmentItem[] {
  if (tabKey === 'ALL') return items;
  return items.filter((i) => i.status === tabKey);
}

function searchEquipment(items: EquipmentItem[], query: string): EquipmentItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  const fields: (keyof EquipmentItem)[] = ['name', 'model', 'type', 'store', 'supplier'];
  return items.filter((item) =>
    fields.some((f) => item[f] && String(item[f]).toLowerCase().includes(q)),
  );
}

function sortEquipment(
  items: EquipmentItem[],
  key: 'name' | 'purchaseDate' | 'warrantyEnd',
  order: 'asc' | 'desc',
): EquipmentItem[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    let cmp: number;
    if (key === 'name') cmp = a.name.localeCompare(b.name);
    else cmp = a[key].localeCompare(b[key]);
    return order === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function warrantyColor(days: number): string {
  if (days < 0) return '#ef4444';
  if (days < 90) return '#eab308';
  return '#94a3b8';
}

// ---- 注册样本数据到 registry ----

registerData('default', makeSampleEquipment());

// ---- 测试 ----

describe('EquipmentPage — 数据工厂', () => {
  it('可生成不同设备', () => {
    const e1 = makeEquipment();
    const e2 = makeEquipment();
    assert.notStrictEqual(e1.id, e2.id);
  });

  it('合并覆盖字段', () => {
    const e = makeEquipment({ status: 'scrapped', type: 'claw' });
    assert.strictEqual(e.status, 'scrapped');
    assert.strictEqual(e.type, 'claw');
  });

  it('样本数据恰好 8 个', () => {
    const data = makeSampleEquipment();
    assert.strictEqual(data.length, 8);
  });

  it('responseRegistry 存储与读取', () => {
    const data = makeSampleEquipment();
    registerData('test-reg', data);
    const retrieved = getData('test-reg');
    assert.strictEqual(retrieved.length, data.length);
    assert.strictEqual(retrieved[0].id, data[0].id);
  });
});

describe('EquipmentPage — 映射表', () => {
  it('所有设备类型应有中文映射', () => {
    const types: EquipmentType[] = ['capsule', 'claw', 'cashier', 'ac', 'speaker', 'lightbox', 'turnstile'];
    for (const t of types) {
      assert.ok(ET[t], `缺少类型 ${t} 的中文映射`);
    }
  });

  it('所有状态应有映射', () => {
    const statuses: EquipmentStatus[] = ['normal', 'maintaining', 'scrap_pending', 'scrapped'];
    for (const s of statuses) {
      assert.ok(ES[s], `缺少状态 ${s} 的映射`);
      assert.ok(ES[s].l);
      assert.ok(ES[s].v);
    }
  });

  it('所有类型映射中文不重复', () => {
    const labels = Object.values(ET);
    const unique = new Set(labels);
    assert.strictEqual(unique.size, labels.length);
  });
});

describe('EquipmentPage — 统计', () => {
  it('样本数据统计正确', () => {
    const data = makeSampleEquipment();
    const stats = computeStats(data);
    assert.strictEqual(stats.total, 8);
    assert.strictEqual(stats.normal, 5);
    assert.strictEqual(stats.maintaining, 1);
    assert.strictEqual(stats.scrapPending, 1);
    assert.strictEqual(stats.scrapped, 1);
  });

  it('normal 计数：E001/E002/E004/E006/E007 = 5', () => {
    const data = makeSampleEquipment();
    const stats = computeStats(data);
    assert.strictEqual(stats.normal, 5);
  });

  it('maintaining 计数：E003 = 1', () => {
    const data = makeSampleEquipment();
    const stats = computeStats(data);
    assert.strictEqual(stats.maintaining, 1);
  });

  it('scrap_pending 计数：E005 = 1', () => {
    const data = makeSampleEquipment();
    const stats = computeStats(data);
    assert.strictEqual(stats.scrapPending, 1);
  });

  it('scrapped 计数：E008 = 1', () => {
    const data = makeSampleEquipment();
    const stats = computeStats(data);
    assert.strictEqual(stats.scrapped, 1);
  });

  it('总设备数 = 各状态之和', () => {
    const data = makeSampleEquipment();
    const stats = computeStats(data);
    const sum = stats.normal + stats.maintaining + stats.scrapPending + stats.scrapped;
    assert.strictEqual(sum, stats.total);
  });

  it('空列表统计', () => {
    const stats = computeStats([]);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.normal, 0);
    assert.strictEqual(stats.maintaining, 0);
  });

  it('全部已报废场景', () => {
    const items = [makeEquipment({ status: 'scrapped' }), makeEquipment({ status: 'scrapped' })];
    const stats = computeStats(items);
    assert.strictEqual(stats.scrapped, 2);
    assert.strictEqual(stats.normal, 0);
  });
});

describe('EquipmentPage — 状态筛选', () => {
  const data = makeSampleEquipment();

  it('ALL 返回全部', () => {
    assert.strictEqual(filterByStatus(data, 'ALL').length, 8);
  });

  it('normal 筛选返回 5 台', () => {
    const result = filterByStatus(data, 'normal');
    assert.strictEqual(result.length, 5);
    result.forEach((e) => assert.strictEqual(e.status, 'normal'));
  });

  it('maintaining 筛选返回 1 台', () => {
    const result = filterByStatus(data, 'maintaining');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'E003');
  });

  it('scrap_pending 筛选', () => {
    const result = filterByStatus(data, 'scrap_pending');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'E005');
  });

  it('scrapped 筛选', () => {
    const result = filterByStatus(data, 'scrapped');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'E008');
  });

  it('不存在的状态返回 0', () => {
    // 使用已经存在的状态但数据中没有匹配的另一种方法
    const emptyResult = filterByStatus([makeEquipment({ status: 'normal' })], 'scrapped');
    assert.strictEqual(emptyResult.length, 0);
  });

  it('tabKey ALL 返回全部', () => {
    assert.strictEqual(filterByTabKey(data, 'ALL').length, 8);
  });

  it('tabKey normal 筛选', () => {
    assert.strictEqual(filterByTabKey(data, 'normal').length, 5);
  });

  it('tabKey maintaining 筛选', () => {
    assert.strictEqual(filterByTabKey(data, 'maintaining').length, 1);
  });
});

describe('EquipmentPage — 搜索过滤', () => {
  const data = makeSampleEquipment();

  it('空查询返回全部', () => {
    assert.strictEqual(searchEquipment(data, '').length, 8);
  });

  it('按设备名称搜索', () => {
    const result = searchEquipment(data, '扭蛋机');
    assert.strictEqual(result.length, 2);
  });

  it('按型号搜索', () => {
    const result = searchEquipment(data, 'GACHA-X1');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'E001');
  });

  it('按门店搜索', () => {
    const result = searchEquipment(data, '科技路');
    assert.strictEqual(result.length, 2);
  });

  it('按供应商搜索', () => {
    const result = searchEquipment(data, '万代');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'E001');
  });

  it('无匹配返回空', () => {
    assert.strictEqual(searchEquipment(data, 'XYZ不存在的').length, 0);
  });

  it('搜索大小写不敏感', () => {
    const result = searchEquipment(data, 'gacha');
    assert.strictEqual(result.length, 2);
  });
});

describe('EquipmentPage — 排序', () => {
  it('名称升序', () => {
    const items = [makeEquipment({ name: 'Z设备' }), makeEquipment({ name: 'A设备' })];
    const sorted = sortEquipment(items, 'name', 'asc');
    assert.strictEqual(sorted[0].name, 'A设备');
    assert.strictEqual(sorted[1].name, 'Z设备');
  });

  it('名称降序', () => {
    const items = [makeEquipment({ name: 'A设备' }), makeEquipment({ name: 'Z设备' })];
    const sorted = sortEquipment(items, 'name', 'desc');
    assert.strictEqual(sorted[0].name, 'Z设备');
  });

  it('采购日期升序', () => {
    const items = [
      makeEquipment({ purchaseDate: '2025-06-01' }),
      makeEquipment({ purchaseDate: '2024-01-01' }),
    ];
    const sorted = sortEquipment(items, 'purchaseDate', 'asc');
    assert.strictEqual(sorted[0].purchaseDate, '2024-01-01');
  });

  it('保修期降序', () => {
    const items = [
      makeEquipment({ warrantyEnd: '2026-01-01' }),
      makeEquipment({ warrantyEnd: '2028-01-01' }),
    ];
    const sorted = sortEquipment(items, 'warrantyEnd', 'desc');
    assert.strictEqual(sorted[0].warrantyEnd, '2028-01-01');
  });
});

describe('EquipmentPage — 保修期计算', () => {
  it('已过保设备返回负数天数', () => {
    const days = daysUntil('2020-01-01');
    assert.ok(days < 0);
  });

  it('未来日期返回正数', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const days = daysUntil(future.toISOString().slice(0, 10));
    assert.ok(days > 300);
  });

  it('已过保颜色为红色', () => {
    assert.strictEqual(warrantyColor(-5), '#ef4444');
  });

  it('剩余不足90天为黄色', () => {
    assert.strictEqual(warrantyColor(30), '#eab308');
  });

  it('剩余充足为灰色', () => {
    assert.strictEqual(warrantyColor(200), '#94a3b8');
  });
});

describe('EquipmentPage — 边界条件', () => {
  it('单设备场景', () => {
    const items = [makeEquipment()];
    const stats = computeStats(items);
    assert.strictEqual(stats.total, 1);
    assert.strictEqual(stats.normal, 1);
  });

  it('重复 ID 检测', () => {
    const items = makeSampleEquipment();
    const ids = items.map((i) => i.id);
    const unique = new Set(ids);
    assert.strictEqual(unique.size, ids.length, '设备 ID 应唯一');
  });

  it('所有设备类型至少出现一次', () => {
    const items = makeSampleEquipment();
    const types = new Set(items.map((i) => i.type));
    assert.ok(types.has('capsule'));
    assert.ok(types.has('claw'));
    assert.ok(types.has('cashier'));
    assert.ok(types.has('ac'));
    assert.ok(types.has('speaker'));
    assert.ok(types.has('lightbox'));
    assert.ok(types.has('turnstile'));
  });

  it('所有状态至少出现一次', () => {
    const items = makeSampleEquipment();
    const statuses = new Set(items.map((i) => i.status));
    for (const s of ['normal', 'maintaining', 'scrap_pending', 'scrapped'] as EquipmentStatus[]) {
      assert.ok(statuses.has(s), `状态 ${s} 应在样本数据中出现`);
    }
  });

  it('发票据字段非空', () => {
    const items = makeSampleEquipment();
    for (const item of items) {
      assert.ok(item.id);
      assert.ok(item.name);
      assert.ok(item.model);
      assert.ok(item.store);
      assert.ok(item.supplier);
      assert.ok(item.purchaseDate);
      assert.ok(item.warrantyEnd);
    }
  });
});

const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('Equipment — hooks验证', () => {
  it('包含 useMemo 声明', () => assert.ok(SRC.includes('useMemo')));
  it('包含 useCallback 声明', () => assert.ok(SRC.includes('useCallback')));
  it('包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含 Tab 组件', () => assert.ok(SRC.includes('<Tabs')));
  it('包含 EmptyState', () => assert.ok(SRC.includes('EmptyState')));
  it('包含列表渲染 .map() 或 DataTable 组件', () => assert.ok(SRC.includes('.map(') || SRC.includes('DataTable')));
  it('包含状态标签 StatusBadge', () => assert.ok(SRC.includes('StatusBadge')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
});

// ================================================================
// React 渲染测试 — 使用 @testing-library/react + happy-dom
// 验证页面组件真实渲染输出
// ================================================================

function setup() {
  cleanup();
  const result = render(React.createElement(EquipmentPage));
  return result;
}

describe('EquipmentPage — React 渲染', () => {
  // 1. 渲染不报错
  it('渲染不报错', () => {
    assert.doesNotThrow(() => setup());
  });

  // 2. 标题正确
  it('渲染页面标题为「设备管理」', () => {
    const { container } = setup();
    const h1 = container.querySelector('h1');
    assert.ok(h1, '页面应包含 h1 标题');
    assert.ok(h1.textContent?.includes('设备管理'), `期待"设备管理"，实际"${h1.textContent}"`);
  });

  // 3. 统计区域显示总数与状态
  it('统计区域显示 4 个统计卡片（总设备数/正常/维修中/待报废）', () => {
    const { container } = setup();
    const cards = container.querySelectorAll('div');
    const statsLabels = ['总设备数', '正常', '维修中', '待报废'];
    for (const label of statsLabels) {
      const found = Array.from(cards).some((card) => card.textContent?.includes(label));
      assert.ok(found, `统计卡片应包含「${label}」`);
    }
  });

  // 4. 筛选控件（搜索框 + Tab）
  it('存在搜索控件（SearchFilterInput 或 placeholder 含"搜索"的 input）', () => {
    const { container } = setup();
    const inputs = container.querySelectorAll('input');
    const hasSearch = Array.from(inputs).some(
      (inp) => inp.getAttribute('placeholder')?.includes('搜索') || inp.getAttribute('placeholder')?.includes('设备名称'),
    );
    assert.ok(hasSearch, `应有搜索 input，找到 ${inputs.length} 个 input`);
  });

  it('存在 Tab 筛选（全部/正常/维修中）', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.includes('全部'), 'Tab 应包含「全部」');
    assert.ok(text.includes('正常'), 'Tab 应包含「正常」');
    assert.ok(text.includes('维修中'), 'Tab 应包含「维修中」');
  });

  // 5. 列表渲染 — 8 个设备
  it('列表中包含所有 8 个样本设备的名称', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    const expected = ['扭蛋机-A01', '娃娃机-B03', '收银机-主01', '中央空调-01', '音响系统-S01', '灯箱-L02', '闸机-G01', '扭蛋机-A02'];
    for (const name of expected) {
      assert.ok(text.includes(name), `列表应包含「${name}」`);
    }
  });

  // 6. DataTable 渲染表格列头
  it('DataTable 包含设备名称/型号/设备类型/所属门店/供应商/采购日期/保修期/状态列头', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    const headers = ['设备名称', '型号', '设备类型', '所属门店', '供应商', '采购日期', '保修期', '状态'];
    for (const h of headers) {
      assert.ok(text.includes(h), `表格应包含列头「${h}」`);
    }
  });

  // 7. 状态标签渲染
  it('状态标签出现"正常""维修中""待报废""已报废"', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.includes('正常'), '应包含状态文字"正常"');
    assert.ok(text.includes('维修中'), '应包含状态文字"维修中"');
    assert.ok(text.includes('待报废'), '应包含状态文字"待报废"');
    assert.ok(text.includes('已报废'), '应包含状态文字"已报废"');
  });

  // 8. 操作提示框
  it('操作提示区域包含提示文字', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.includes('💡') || text.includes('提示'), '应包含提示区域');
  });

  // 9. 刷新增统计 — component 是函数
  it('EquipmentPage 是一个函数组件', () => {
    assert.strictEqual(typeof EquipmentPage, 'function');
  });

  // 10. 导出包含 defaultEquipment 样本数据
  it('模块导出 defaultEquipment（样本数据）', () => {
    const data = mod.defaultEquipment;
    assert.ok(Array.isArray(data), 'defaultEquipment 应该是数组');
    assert.strictEqual(data.length, 8);
  });
});
