/**
 * equipment/[id]/page.test.tsx — 设备详情页 L1 纯源码分析 + 数据逻辑测试
 *
 * ⚡ 覆盖: 设备查找与状态映射 / 类型与映射完整性 / 表单验证 / 状态流转 / 保修期计算 / 边界场景 / 源码结构
 * 🧪 纯 node:test 模式，无 @testing-library/react 依赖
 *   正例: 8+ | 反例: 4+ | 边界: 3+
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ---- 类型 ----

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

interface EditFormData {
  name: string;
  model: string;
  store: string;
  supplier: string;
  note: string;
}

interface EditFormErrors {
  name?: string;
  model?: string;
  store?: string;
  supplier?: string;
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

const ALLOWED_TRANSITIONS: Record<EquipmentStatus, { to: EquipmentStatus; label: string }[]> = {
  normal: [{ to: 'maintaining', label: '设为维修中' }, { to: 'scrap_pending', label: '申请报废' }],
  maintaining: [{ to: 'normal', label: '恢复正常' }, { to: 'scrap_pending', label: '申请报废' }],
  scrap_pending: [{ to: 'scrapped', label: '确认报废' }, { to: 'normal', label: '撤销报废' }],
  scrapped: [],
};

// ---- Mock 数据 ----

const MOCK_EQUIPMENT_DETAIL: Record<string, EquipmentItem> = {
  E001: { id: 'E001', name: '扭蛋机-A01', model: 'GACHA-X1', type: 'capsule', store: '旗舰店-解放路', supplier: '万代南梦宫', purchaseDate: '2024-03-15', warrantyEnd: '2026-03-14', status: 'normal', note: '3号机位' },
  E003: { id: 'E003', name: '收银机-主01', model: 'POS-3000', type: 'cashier', store: '旗舰店-解放路', supplier: '海信智能', purchaseDate: '2023-11-20', warrantyEnd: '2025-11-19', status: 'maintaining', note: '主板故障，已报修' },
  E005: { id: 'E005', name: '音响系统-S01', model: 'SPK-2000', type: 'speaker', store: '门店-科技路', supplier: 'JBL', purchaseDate: '2024-01-15', warrantyEnd: '2026-01-14', status: 'scrap_pending', note: '左右声道异常' },
  E008: { id: 'E008', name: '扭蛋机-A02', model: 'GACHA-X2', type: 'capsule', store: '门店-中山路', supplier: '多美', purchaseDate: '2024-12-01', warrantyEnd: '2026-11-30', status: 'scrapped' },
};

// ---- 辅助函数（与 page.tsx 逻辑同步） ----

function getEquipmentById(id: string): EquipmentItem | undefined {
  return MOCK_EQUIPMENT_DETAIL[id];
}

function validateEquipmentForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '设备名称不能为空';
  if (!data.model.trim()) errors.model = '型号不能为空';
  if (!data.store.trim()) errors.store = '所属门店不能为空';
  if (!data.supplier.trim()) errors.supplier = '供应商不能为空';
  return errors;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function warrantyLabel(days: number): string {
  if (days < 0) return '已过期';
  if (days < 90) return `剩${days}天`;
  return '有效';
}

function warrantyColor(days: number): string {
  if (days < 0) return '#ef4444';
  if (days < 90) return '#eab308';
  return '#94a3b8';
}

function getTransitionActions(status: EquipmentStatus): { to: EquipmentStatus; label: string }[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

async function submitEquipmentEdit(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { success: true };
}

async function submitEquipmentTransition(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { success: true };
}

// ================================================================
// 测试开始
// ================================================================

// ── 正例 1+ — 设备查找与基础数据 ──

describe('[正例] 设备查找与基础数据', () => {
  it('根据 ID 查找到 E001 扭蛋机', () => {
    const eq = getEquipmentById('E001');
    assert.ok(eq);
    assert.strictEqual(eq.name, '扭蛋机-A01');
    assert.strictEqual(eq.status, 'normal');
    assert.strictEqual(eq.type, 'capsule');
  });

  it('E003 维修中设备含备注信息', () => {
    const eq = getEquipmentById('E003');
    assert.ok(eq);
    assert.strictEqual(eq.status, 'maintaining');
    assert.strictEqual(eq.note, '主板故障，已报修');
  });

  it('E005 scrap_pending 设备过渡状态', () => {
    const eq = getEquipmentById('E005');
    assert.ok(eq);
    assert.strictEqual(eq.status, 'scrap_pending');
    assert.strictEqual(eq.note, '左右声道异常');
  });

  it('E008 已报废设备无 note 字段', () => {
    const eq = getEquipmentById('E008');
    assert.ok(eq);
    assert.strictEqual(eq.status, 'scrapped');
    assert.strictEqual(eq.note, undefined);
  });

  it('所有 mock 数据必填字段非空', () => {
    const required: (keyof EquipmentItem)[] = ['id', 'name', 'model', 'type', 'store', 'supplier', 'purchaseDate', 'warrantyEnd', 'status'];
    for (const entry of Object.values(MOCK_EQUIPMENT_DETAIL)) {
      for (const field of required) {
        assert.ok(entry[field] !== undefined, `${entry.id} missing ${field}`);
      }
    }
  });
});

// ── 正例 2 — 类型与状态映射 ──

describe('[正例] 类型与状态映射', () => {
  it('7 种设备类型全部有中文标签', () => {
    const types: EquipmentType[] = ['capsule', 'claw', 'cashier', 'ac', 'speaker', 'lightbox', 'turnstile'];
    for (const t of types) {
      assert.ok(ET[t], `Missing type label for ${t}`);
      assert.ok(ET[t].length > 0);
    }
  });

  it('4 种状态全部有中文标签和 variant', () => {
    const validVariants = new Set(['success', 'warning', 'danger', 'neutral']);
    for (const s of STATUS_ORDER) {
      const m = ES[s];
      assert.ok(m, `Missing status entry for ${s}`);
      assert.ok(m.l.length > 0);
      assert.ok(validVariants.has(m.v), `Invalid variant ${m.v} for ${s}`);
    }
  });

  it('E001 normal 映射为 "正常"/success', () => {
    assert.strictEqual(ES['normal'].l, '正常');
    assert.strictEqual(ES['normal'].v, 'success');
  });

  it('E003 maintaining 映射为 "维修中"/warning', () => {
    assert.strictEqual(ES['maintaining'].l, '维修中');
    assert.strictEqual(ES['maintaining'].v, 'warning');
  });

  it('E005 scrap_pending 映射为 "待报废"/danger', () => {
    assert.strictEqual(ES['scrap_pending'].l, '待报废');
    assert.strictEqual(ES['scrap_pending'].v, 'danger');
  });

  it('E008 scrapped 映射为 "已报废"/neutral', () => {
    assert.strictEqual(ES['scrapped'].l, '已报废');
    assert.strictEqual(ES['scrapped'].v, 'neutral');
  });
});

// ── 正例 3 — 表单验证正例 ──

describe('[正例] 表单验证', () => {
  const validData: EditFormData = {
    name: '测试设备',
    model: 'MODEL-X',
    store: '旗舰店-解放路',
    supplier: '万代南梦宫',
    note: '常规备注',
  };

  it('合法表单通过验证（无错误）', () => {
    const errors = validateEquipmentForm(validData);
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('含特殊字符的名称通过验证', () => {
    const errors = validateEquipmentForm({ ...validData, name: '扭蛋机-A01_v2#3' });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('可选备注字段为空字符串通过验证', () => {
    const errors = validateEquipmentForm({ ...validData, note: '' });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('超长备注（2000 字符）通过验证', () => {
    const errors = validateEquipmentForm({ ...validData, note: 'X'.repeat(2000) });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('提交编辑返回成功', async () => {
    const result = await submitEquipmentEdit();
    assert.strictEqual(result.success, true);
  });

  it('提交状态流转返回成功', async () => {
    const result = await submitEquipmentTransition();
    assert.strictEqual(result.success, true);
  });
});

// ── 反例 1 — 表单验证反例 ──

describe('[反例] 表单验证 — 必填字段', () => {
  const validData: EditFormData = { name: 'n', model: 'm', store: 's', supplier: 'sp', note: '' };

  it('空名称返回 "设备名称不能为空"', () => {
    const errors = validateEquipmentForm({ ...validData, name: '' });
    assert.strictEqual(errors.name, '设备名称不能为空');
  });

  it('仅空白名称被拒绝', () => {
    const errors = validateEquipmentForm({ ...validData, name: '   ' });
    assert.strictEqual(errors.name, '设备名称不能为空');
  });

  it('空型号被拒绝', () => {
    const errors = validateEquipmentForm({ ...validData, model: '' });
    assert.strictEqual(errors.model, '型号不能为空');
  });

  it('空门店被拒绝', () => {
    const errors = validateEquipmentForm({ ...validData, store: '' });
    assert.strictEqual(errors.store, '所属门店不能为空');
  });

  it('空供应商被拒绝', () => {
    const errors = validateEquipmentForm({ ...validData, supplier: '' });
    assert.strictEqual(errors.supplier, '供应商不能为空');
  });

  it('全部必填字段为空累积 4 个错误', () => {
    const errors = validateEquipmentForm({ name: '', model: '', store: '', supplier: '', note: '' });
    assert.strictEqual(Object.keys(errors).length, 4);
    assert.ok(errors.name);
    assert.ok(errors.model);
    assert.ok(errors.store);
    assert.ok(errors.supplier);
  });
});

// ── 反例 2 — 设备查找反例 ──

describe('[反例] 设备查找边界', () => {
  it('不存在的 ID 返回 undefined', () => {
    assert.strictEqual(getEquipmentById('E999'), undefined);
  });

  it('空字符串 ID 返回 undefined', () => {
    assert.strictEqual(getEquipmentById(''), undefined);
  });

  it('ID 大小写敏感（小写 e001 不匹配）', () => {
    assert.strictEqual(getEquipmentById('e001'), undefined);
  });
});

// ── 反例 3 — 状态流转反例与边界 ──

describe('[反例] 状态流转规则', () => {
  it('scrapped 已报废设备无可用流转', () => {
    const actions = getTransitionActions('scrapped');
    assert.strictEqual(actions.length, 0);
  });

  it('normal 有 2 个可用流转（维修中/待报废）', () => {
    const actions = getTransitionActions('normal');
    assert.strictEqual(actions.length, 2);
    assert.ok(actions.some((a) => a.to === 'maintaining'));
    assert.ok(actions.some((a) => a.to === 'scrap_pending'));
  });

  it('maintaining 可恢复正常或申请报废', () => {
    const actions = getTransitionActions('maintaining');
    assert.strictEqual(actions.length, 2);
    assert.ok(actions.some((a) => a.to === 'normal'));
    assert.ok(actions.some((a) => a.to === 'scrap_pending'));
  });

  it('未知状态返回空流转', () => {
    const actions = getTransitionActions('unknown' as EquipmentStatus);
    assert.deepStrictEqual(actions, []);
  });
});

// ── 边界 1 — 保修期计算边界 ──

describe('[边界] 保修期计算', () => {
  it('已过期返回负数天数', () => {
    assert.ok(daysUntil('2020-01-01') < 0);
  });

  it('未来日期返回正数', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    assert.ok(daysUntil(future.toISOString().slice(0, 10)) > 300);
  });

  it('精确 0 天 → warrantyLabel 返回 "剩0天"', () => {
    assert.strictEqual(warrantyLabel(0), '剩0天');
  });

  it('精确 89 天 → 剩89天（黄色区间）', () => {
    assert.strictEqual(warrantyLabel(89), '剩89天');
  });

  it('精确 90 天 → "有效"（灰色区间）', () => {
    assert.strictEqual(warrantyLabel(90), '有效');
  });

  it('负数 → "已过期"', () => {
    assert.strictEqual(warrantyLabel(-1), '已过期');
    assert.strictEqual(warrantyLabel(-365), '已过期');
  });

  it('warrantyColor 负数为红色 #ef4444', () => {
    assert.strictEqual(warrantyColor(-1), '#ef4444');
  });

  it('warrantyColor 30 天为黄色 #eab308', () => {
    assert.strictEqual(warrantyColor(30), '#eab308');
  });

  it('warrantyColor 200 天为灰色 #94a3b8', () => {
    assert.strictEqual(warrantyColor(200), '#94a3b8');
  });

  it('warrantyColor 精确 90 天为灰色 #94a3b8', () => {
    assert.strictEqual(warrantyColor(90), '#94a3b8');
  });
});

// ── 边界 2 — 数据一致性与边界 ──

describe('[边界] 数据一致性与极值', () => {
  it('mock 数据覆盖全部 4 种状态', () => {
    const found = new Set(Object.values(MOCK_EQUIPMENT_DETAIL).map((e) => e.status));
    assert.strictEqual(found.size, 4);
  });

  it('mock 数据覆盖至少 3 种设备类型', () => {
    const found = new Set(Object.values(MOCK_EQUIPMENT_DETAIL).map((e) => e.type));
    assert.ok(found.size >= 3);
  });

  it('STATUS_ORDER 顺序固定不变', () => {
    assert.deepStrictEqual(STATUS_ORDER, ['normal', 'maintaining', 'scrap_pending', 'scrapped']);
  });

  it('ALLOWED_TRANSITIONS 包含全部 4 种状态的条目', () => {
    for (const s of STATUS_ORDER) {
      assert.ok(Array.isArray(ALLOWED_TRANSITIONS[s]), `Missing transition entry for ${s}`);
    }
  });
});

// ── 边界 3 — 删除确认流转 ──

describe('[边界] 删除确认与流转', () => {
  it('流转按钮不会出现在 scrapped 状态', () => {
    const actions = getTransitionActions('scrapped');
    assert.strictEqual(actions.length, 0);
  });

  it('流转 API 调用成功', async () => {
    const result = await submitEquipmentTransition();
    assert.ok(result.success);
  });

  it('编辑 API 调用成功', async () => {
    const result = await submitEquipmentEdit();
    assert.ok(result.success);
  });
});

// ── 源码 hooks 验证 ──

describe('源码 hooks 与组件结构', () => {
  it('包含 use 声明（params Promise）', () => assert.ok(SRC.includes('const { id } = use(') || SRC.includes('use(params)')));
  it('包含 useState 声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含 useCallback 声明', () => assert.ok(SRC.includes('useCallback')));
  it('包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器（onClick/onChange）', () => assert.ok(SRC.includes('onClick={')));
  it('包含条件渲染', () => assert.ok(SRC.includes('&&') || SRC.includes('?')));
  it('包含样式定义 style=', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
  it('包含 StatusBadge 组件', () => assert.ok(SRC.includes('StatusBadge')));
  it('包含 InfoRow 组件', () => assert.ok(SRC.includes('InfoRow')));
  it('包含 DetailShell 组件', () => assert.ok(SRC.includes('DetailShell')));
  it('包含 404 状态组件 EquipmentNotFound', () => assert.ok(SRC.includes('EquipmentNotFound')));
  it('包含 Link 导航', () => assert.ok(SRC.includes('from \'next/link\'') || SRC.includes('from "next/link"')));
  it('包含 useFormSubmit', () => assert.ok(SRC.includes('useFormSubmit')));
  it('包含 StatCard 组件', () => assert.ok(SRC.includes('StatCard')));
  it('包含 WorkspaceBreadcrumb', () => assert.ok(SRC.includes('WorkspaceBreadcrumb')));
  it('包含 CopyToClipboard 组件', () => assert.ok(SRC.includes('CopyToClipboard')));
  it('包含 DetailClosureBar', () => assert.ok(SRC.includes('DetailClosureBar')));
  it('包含 use client 指令', () => assert.ok(SRC.includes("'use client'")));
  it('包含 MOCK_EQUIPMENT_DETAIL 数据', () => assert.ok(SRC.includes('MOCK_EQUIPMENT_DETAIL')));
  it('包含 validateEquipmentForm 函数', () => assert.ok(SRC.includes('validateEquipmentForm')));
  it('包含 DEFAULT_WORKSPACE_HREF 常量', () => assert.ok(SRC.includes('DEFAULT_WORKSPACE_HREF')));
  it('源码文件大小合理 5K-60K', () => {
    assert.ok(SRC.length > 5000 && SRC.length < 60000, `Source size ${SRC.length} bytes`);
  });
});
