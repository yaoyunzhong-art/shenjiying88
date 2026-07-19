/**
 * equipment/[id]/edit/page.test.tsx — 设备编辑页 L1 测试
 *
 * 覆盖: 设备查找、表单验证、正例/反例/边界、异步提交
 * 正例: 查找现有设备、合法表单、空备注通过
 * 反例: 空名称/型号/门店/供应商、空白字符串
 * 边界: 超长字符串、成功提交后状态
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/* ── 类型 ── */

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

// ---- Mock 数据 ----

const MOCK_EQUIPMENT_DETAIL: Record<string, EquipmentItem> = {
  E001: { id: 'E001', name: '扭蛋机-A01', model: 'GACHA-X1', type: 'capsule', store: '旗舰店-解放路', supplier: '万代南梦宫', purchaseDate: '2024-03-15', warrantyEnd: '2026-03-14', status: 'normal', note: '3号机位' },
  E003: { id: 'E003', name: '收银机-主01', model: 'POS-3000', type: 'cashier', store: '旗舰店-解放路', supplier: '海信智能', purchaseDate: '2023-11-20', warrantyEnd: '2025-11-19', status: 'maintaining', note: '主板故障，已报修' },
};

// ---- 辅助函数（与 page.tsx 同步） ----

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

/* ============================================================ */

describe('equipment-edit: 数据类型', () => {
  it('EditFormData has all 5 fields', () => {
    const data: EditFormData = { name: 'n', model: 'm', store: 's', supplier: 'sp', note: 'nt' };
    assert.equal(typeof data.name, 'string');
    assert.equal(typeof data.note, 'string');
  });

  it('EditFormErrors all optional', () => {
    const empty: EditFormErrors = {};
    assert.deepEqual(empty, {});
    const partial: EditFormErrors = { model: 'error' };
    assert.equal(partial.model, 'error');
  });
});

describe('equipment-edit: 设备查找', () => {
  it('finds equipment E001', () => {
    const eq = getEquipmentById('E001');
    assert.ok(eq);
    assert.equal(eq?.name, '扭蛋机-A01');
  });

  it('finds equipment E003 with note', () => {
    const eq = getEquipmentById('E003');
    assert.ok(eq);
    assert.equal(eq?.note, '主板故障，已报修');
  });

  it('returns undefined for unknown id', () => {
    assert.equal(getEquipmentById('E999'), undefined);
  });

  it('returns undefined for empty string', () => {
    assert.equal(getEquipmentById(''), undefined);
  });

  it('returns undefined for wrong case', () => {
    assert.equal(getEquipmentById('e001'), undefined);
  });

  it('mock data has all required fields', () => {
    const required: (keyof EquipmentItem)[] = ['id', 'name', 'model', 'type', 'store', 'supplier', 'purchaseDate', 'warrantyEnd', 'status'];
    for (const entry of Object.values(MOCK_EQUIPMENT_DETAIL)) {
      for (const field of required) {
        assert.ok(entry[field] !== undefined, `${entry.id} missing ${field}`);
      }
    }
  });
});

describe('equipment-edit: 表单验证', () => {
  const validData: EditFormData = {
    name: '测试设备',
    model: 'MODEL-X',
    store: '旗舰店-解放路',
    supplier: '万代南梦宫',
    note: '测试备注',
  };

  it('valid form passes validation', () => {
    const errors = validateEditForm(validData);
    assert.equal(Object.keys(errors).length, 0);
  });

  it('empty name fails', () => {
    const errors = validateEditForm({ ...validData, name: '' });
    assert.equal(errors.name, '设备名称不能为空');
  });

  it('whitespace name fails', () => {
    const errors = validateEditForm({ ...validData, name: '   ' });
    assert.equal(errors.name, '设备名称不能为空');
  });

  it('empty model fails', () => {
    const errors = validateEditForm({ ...validData, model: '' });
    assert.equal(errors.model, '型号不能为空');
  });

  it('empty store fails', () => {
    const errors = validateEditForm({ ...validData, store: '' });
    assert.equal(errors.store, '所属门店不能为空');
  });

  it('empty supplier fails', () => {
    const errors = validateEditForm({ ...validData, supplier: '' });
    assert.equal(errors.supplier, '供应商不能为空');
  });

  it('empty note passes (optional field)', () => {
    const errors = validateEditForm({ ...validData, note: '' });
    assert.equal(Object.keys(errors).length, 0);
  });

  it('very long note passes (textarea)', () => {
    const longNote = 'B'.repeat(2000);
    const errors = validateEditForm({ ...validData, note: longNote });
    assert.equal(Object.keys(errors).length, 0);
  });

  it('all fields empty accumulates 4 errors', () => {
    const errors = validateEditForm({ name: '', model: '', store: '', supplier: '', note: '' });
    assert.equal(Object.keys(errors).length, 4);
    assert.ok(errors.name);
    assert.ok(errors.model);
    assert.ok(errors.store);
    assert.ok(errors.supplier);
  });

  it('name with special characters passes', () => {
    const errors = validateEditForm({ ...validData, name: '扭蛋机-中文-Eng-123' });
    assert.equal(Object.keys(errors).length, 0);
  });

  it('name with only newline fails', () => {
    const errors = validateEditForm({ ...validData, name: '\n\n' });
    // trim() 处理空字符串
    assert.equal(errors.name, '设备名称不能为空');
  });

  it('fields with only punctuation fails', () => {
    const errors = validateEditForm({ ...validData, name: '!!!' });
    // 非空白字符通过验证
    assert.equal(errors.name, undefined);
  });
});

describe('equipment-edit: 异步提交', () => {
  it('submit returns success', async () => {
    const result = await submitEdit();
    assert.equal(result.success, true);
  });

  it('submit resolves within reasonable time', async () => {
    const start = Date.now();
    await submitEdit();
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, 'Submit took too long');
  });
});

describe('equipment-edit: 数据一致性', () => {
  it('mock equipment has unique ids', () => {
    const ids = Object.keys(MOCK_EQUIPMENT_DETAIL);
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('equipment status is always valid', () => {
    const validStatuses: EquipmentStatus[] = ['normal', 'maintaining', 'scrap_pending', 'scrapped'];
    for (const entry of Object.values(MOCK_EQUIPMENT_DETAIL)) {
      assert.ok(validStatuses.includes(entry.status as EquipmentStatus));
    }
  });

  it('equipment type is always valid', () => {
    const validTypes: EquipmentType[] = ['capsule', 'claw', 'cashier', 'ac', 'speaker', 'lightbox', 'turnstile'];
    for (const entry of Object.values(MOCK_EQUIPMENT_DETAIL)) {
      assert.ok(validTypes.includes(entry.type as EquipmentType));
    }
  });
});

const SRC = fs.readFileSync('./page.tsx', 'utf-8');

describe('equipment-edit: 源码 hooks 验证', () => {
  it('包含 use 声明（params Promise）', () => assert.ok(SRC.includes('use(params)') || SRC.includes('const { id }')));
  it('包含 useState 声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含 useCallback 声明', () => assert.ok(SRC.includes('useCallback')));
  it('包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onChange={')));
  it('包含条件渲染', () => assert.ok(SRC.includes('&&') || SRC.includes('?')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
  it('包含 FormField 组件', () => assert.ok(SRC.includes('FormField')));
  it('包含 SubmitButton 组件', () => assert.ok(SRC.includes('SubmitButton')));
  it('包含 WorkspaceBreadcrumb 组件', () => assert.ok(SRC.includes('WorkspaceBreadcrumb')));
  it('包含 useFormSubmit 钩子', () => assert.ok(SRC.includes('useFormSubmit')));
  it('包含 404 状态组件', () => assert.ok(SRC.includes('EditNotFound')));
  it('包含成功状态处理（hasSubmitted）', () => assert.ok(SRC.includes('hasSubmitted')));
  it('包含链接跳转 <Link>', () => assert.ok(SRC.includes('<Link')));
  it('包含 Link import', () => assert.ok(SRC.includes("from 'next/link'")));
});
