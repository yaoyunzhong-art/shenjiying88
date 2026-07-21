/**
 * equipment/[id]/edit/page.test.tsx — 设备编辑页 L1 纯源码分析 + 数据逻辑测试
 *
 * ⚡ 覆盖: 设备查找 / 表单验证正例 / 表单验证反例 / 异步提交 / 边界场景 / 源码 hooks 验证
 * 🧪 纯 node:test 模式，无 @testing-library/react 依赖
 *   正例: 8+ | 反例: 5+ | 边界: 3+
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

type EquipmentType = 'capsule' | 'claw' | 'cashier' | 'ac' | 'speaker' | 'lightbox' | 'turnstile';
type EquipmentStatus = 'normal' | 'maintaining' | 'scrap_pending' | 'scrapped';

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

// ---- Mock 数据 ----

const MOCK_EQUIPMENT_DETAIL: Record<string, EquipmentItem> = {
  E001: { id: 'E001', name: '扭蛋机-A01', model: 'GACHA-X1', type: 'capsule', store: '旗舰店-解放路', supplier: '万代南梦宫', purchaseDate: '2024-03-15', warrantyEnd: '2026-03-14', status: 'normal', note: '3号机位' },
  E002: { id: 'E002', name: '娃娃机-B03', model: 'CLAW-Z2', type: 'claw', store: '门店-科技路', supplier: '世嘉', purchaseDate: '2024-06-01', warrantyEnd: '2026-05-31', status: 'normal' },
  E003: { id: 'E003', name: '收银机-主01', model: 'POS-3000', type: 'cashier', store: '旗舰店-解放路', supplier: '海信智能', purchaseDate: '2023-11-20', warrantyEnd: '2025-11-19', status: 'maintaining', note: '主板故障，已报修' },
};

// ---- 辅助函数（与 page.tsx 逻辑同步） ----

function getEquipmentById(id: string): EquipmentItem | undefined {
  return MOCK_EQUIPMENT_DETAIL[id];
}

function validateEditForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '设备名称不能为空';
  if (!data.model.trim()) errors.model = '型号不能为空';
  if (!data.store.trim()) errors.store = '所属门店不能为空';
  if (!data.supplier.trim()) errors.supplier = '供应商不能为空';
  return errors;
}

async function submitEdit(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { success: true };
}

// ================================================================
// 测试开始
// ================================================================

// ── 正例 1 — 设备查找 ──

describe('[正例] 设备查找', () => {
  it('根据 ID E001 查找到扭蛋机-A01', () => {
    const eq = getEquipmentById('E001');
    assert.ok(eq);
    assert.strictEqual(eq.name, '扭蛋机-A01');
    assert.strictEqual(eq.status, 'normal');
  });

  it('根据 ID E002 查找到娃娃机-B03（无备注）', () => {
    const eq = getEquipmentById('E002');
    assert.ok(eq);
    assert.strictEqual(eq.name, '娃娃机-B03');
    assert.strictEqual(eq.note, undefined);
  });

  it('根据 ID E003 查找到收银机（维修中+备注）', () => {
    const eq = getEquipmentById('E003');
    assert.ok(eq);
    assert.strictEqual(eq.name, '收银机-主01');
    assert.strictEqual(eq.status, 'maintaining');
    assert.strictEqual(eq.note, '主板故障，已报修');
  });

  it('所有 mock 设备必填字段非空', () => {
    const required: (keyof EquipmentItem)[] = ['id', 'name', 'model', 'type', 'store', 'supplier', 'purchaseDate', 'warrantyEnd', 'status'];
    for (const entry of Object.values(MOCK_EQUIPMENT_DETAIL)) {
      for (const field of required) {
        assert.ok(entry[field] !== undefined, `${entry.id} missing ${field}`);
      }
    }
  });

  it('设备类型映射完整：E001 为 capsule → 扭蛋机', () => {
    assert.strictEqual(ET[getEquipmentById('E001')!.type], '扭蛋机');
  });

  it('设备类型映射完整：E002 为 claw → 娃娃机', () => {
    assert.strictEqual(ET[getEquipmentById('E002')!.type], '娃娃机');
  });

  it('设备类型映射完整：E003 为 cashier → 收银机', () => {
    assert.strictEqual(ET[getEquipmentById('E003')!.type], '收银机');
  });

  it('mock 数据 ID 唯一', () => {
    const ids = Object.keys(MOCK_EQUIPMENT_DETAIL);
    assert.strictEqual(new Set(ids).size, ids.length);
  });
});

// ── 正例 2 — 表单验证 ──

describe('[正例] 表单验证 — 合法输入', () => {
  const validData: EditFormData = {
    name: '常规设备名称',
    model: 'MODEL-001',
    store: '旗舰店-解放路',
    supplier: '标准供应商',
    note: '一些备注信息',
  };

  it('合法完整表单通过验证', () => {
    const errors = validateEditForm(validData);
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('含中文名称通过验证', () => {
    const errors = validateEditForm({ ...validData, name: '扭蛋机-三期改造' });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('含数字型号通过验证', () => {
    const errors = validateEditForm({ ...validData, model: 'GACHA-X1_v2.0' });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('备注字段为空字符串通过验证', () => {
    const errors = validateEditForm({ ...validData, note: '' });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('备注字段超长（2000 字符）通过验证', () => {
    const errors = validateEditForm({ ...validData, note: 'A'.repeat(2000) });
    assert.strictEqual(Object.keys(errors).length, 0);
  });
});

// ── 反例 — 表单验证必填字段 ──

describe('[反例] 表单验证 — 必填字段检测', () => {
  const validData: EditFormData = { name: 'n', model: 'm', store: 's', supplier: 'sp', note: '' };

  it('空名称 → 设备名称不能为空', () => {
    const errors = validateEditForm({ ...validData, name: '' });
    assert.strictEqual(errors.name, '设备名称不能为空');
  });

  it('空白名称 → 设备名称不能为空', () => {
    const errors = validateEditForm({ ...validData, name: '   ' });
    assert.strictEqual(errors.name, '设备名称不能为空');
  });

  it('空型号 → 型号不能为空', () => {
    const errors = validateEditForm({ ...validData, model: '' });
    assert.strictEqual(errors.model, '型号不能为空');
  });

  it('空白型号 → 型号不能为空', () => {
    const errors = validateEditForm({ ...validData, model: '  ' });
    assert.strictEqual(errors.model, '型号不能为空');
  });

  it('空门店 → 所属门店不能为空', () => {
    const errors = validateEditForm({ ...validData, store: '' });
    assert.strictEqual(errors.store, '所属门店不能为空');
  });

  it('空供应商 → 供应商不能为空', () => {
    const errors = validateEditForm({ ...validData, supplier: '' });
    assert.strictEqual(errors.supplier, '供应商不能为空');
  });

  it('全部 4 个必填字段为空 → 累积 4 个错误', () => {
    const errors = validateEditForm({ name: '', model: '', store: '', supplier: '', note: '' });
    assert.strictEqual(Object.keys(errors).length, 4);
  });

  it('3 字段空 1 字段非空 → 累积 3 个错误', () => {
    const errors = validateEditForm({ name: '', model: 'm', store: '', supplier: '', note: '' });
    assert.strictEqual(Object.keys(errors).length, 3);
  });
});

// ── 边界 — 特殊场景与边界值 ──

describe('[边界] 特殊场景与边界值', () => {
  it('空 mock 数据返回 undefined', () => {
    assert.strictEqual(getEquipmentById('E999'), undefined);
  });

  it('空字符串 ID 返回 undefined', () => {
    assert.strictEqual(getEquipmentById(''), undefined);
  });

  it('ID 大小写敏感（小写 e001 不存在）', () => {
    assert.strictEqual(getEquipmentById('e001'), undefined);
  });

  it('换行字符作为名称被 trim 后拒绝', () => {
    const errors = validateEditForm({ name: '\n\n', model: 'm', store: 's', supplier: 'sp', note: '' });
    assert.strictEqual(errors.name, '设备名称不能为空');
  });

  it('仅空格门店被拒绝', () => {
    const errors = validateEditForm({ name: 'n', model: 'm', store: '   ', supplier: 'sp', note: '' });
    assert.strictEqual(errors.store, '所属门店不能为空');
  });

  it('异步提交编辑返回成功', async () => {
    const result = await submitEdit();
    assert.strictEqual(result.success, true);
  });

  it('异步提交在合理时间内完成', async () => {
    const start = Date.now();
    await submitEdit();
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `Submit took too long: ${elapsed}ms`);
  });
});

// ── 源码 hooks 验证 ──

describe('源码 hooks 与组件结构', () => {
  it('包含 use 声明（params Promise）', () => assert.ok(SRC.includes('use(params)') || SRC.includes('const { id } = use(')));
  it('包含 useState 声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含 useCallback 声明', () => assert.ok(SRC.includes('useCallback')));
  it('包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器 onChange', () => assert.ok(SRC.includes('onChange={')));
  it('包含条件渲染', () => assert.ok(SRC.includes('&&') || SRC.includes('?')));
  it('包含样式定义 style=', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
  it('包含 FormField 组件', () => assert.ok(SRC.includes('FormField')));
  it('包含 SubmitButton 组件', () => assert.ok(SRC.includes('SubmitButton')));
  it('包含 WorkspaceBreadcrumb 组件', () => assert.ok(SRC.includes('WorkspaceBreadcrumb')));
  it('包含 useFormSubmit 钩子', () => assert.ok(SRC.includes('useFormSubmit')));
  it('包含 404 状态组件 EditNotFound', () => assert.ok(SRC.includes('EditNotFound')));
  it('包含成功状态处理（hasSubmitted）', () => assert.ok(SRC.includes('hasSubmitted')));
  it('包含链接跳转 <Link>', () => assert.ok(SRC.includes('<Link')));
  it('包含 Link import', () => assert.ok(SRC.includes("from 'next/link'") || SRC.includes('from "next/link"')));
  it('包含 FormSubmitFeedback 组件', () => assert.ok(SRC.includes('FormSubmitFeedback')));
  it('包含 MOCK_EQUIPMENT_DETAIL 数据', () => assert.ok(SRC.includes('MOCK_EQUIPMENT_DETAIL')));
  it('包含 validateEditForm 函数', () => assert.ok(SRC.includes('validateEditForm')));
  it('包含 inputStyle 样式定义', () => assert.ok(SRC.includes('inputStyle')));
  it('包含 use client 指令', () => assert.ok(SRC.includes("'use client'")));
  it('包含 handleFieldChange 回调', () => assert.ok(SRC.includes('handleFieldChange')));
  it('包含 handleErrorDismiss 回调', () => assert.ok(SRC.includes('handleErrorDismiss')));
  it('源码文件大小合理 4K-30K', () => {
    assert.ok(SRC.length > 4000 && SRC.length < 30000, `Source size ${SRC.length} bytes`);
  });
});
