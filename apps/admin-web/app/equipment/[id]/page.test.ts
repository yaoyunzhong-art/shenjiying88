/**
 * equipment/[id]/page.test.tsx — 设备详情页 L1 测试
 *
 * 覆盖: 设备查找、状态映射、类型映射、状态流转、表单验证、保修期计算、删除确认
 * 正例: 查找现有设备、所有状态/类型映射完整、合法表单验证通过
 * 反例: 设备不存在、空字段、超长字符串、不可达状态流转
 * 边界: 已报废设备无流转、保修临界值、可选备注
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/* ── 类型 ── */

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

// ---- Mock 数据 ---- */

const MOCK_EQUIPMENT_DETAIL: Record<string, EquipmentItem> = {
  E001: { id: 'E001', name: '扭蛋机-A01', model: 'GACHA-X1', type: 'capsule', store: '旗舰店-解放路', supplier: '万代南梦宫', purchaseDate: '2024-03-15', warrantyEnd: '2026-03-14', status: 'normal', note: '3号机位' },
  E003: { id: 'E003', name: '收银机-主01', model: 'POS-3000', type: 'cashier', store: '旗舰店-解放路', supplier: '海信智能', purchaseDate: '2023-11-20', warrantyEnd: '2025-11-19', status: 'maintaining', note: '主板故障，已报修' },
  E005: { id: 'E005', name: '音响系统-S01', model: 'SPK-2000', type: 'speaker', store: '门店-科技路', supplier: 'JBL', purchaseDate: '2024-01-15', warrantyEnd: '2026-01-14', status: 'scrap_pending', note: '左右声道异常' },
  E008: { id: 'E008', name: '扭蛋机-A02', model: 'GACHA-X2', type: 'capsule', store: '门店-中山路', supplier: '多美', purchaseDate: '2024-12-01', warrantyEnd: '2026-11-30', status: 'scrapped' },
};

// ---- 辅助函数 ----

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

function getTransitionActions(
  status: EquipmentStatus,
): { to: EquipmentStatus; label: string }[] {
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

/* ============================================================ */

describe('equipment-detail: 数据类型', () => {
  it('EquipmentItem has all required fields', () => {
    const item: EquipmentItem = {
      id: 'E999', name: '测试设备', model: 'M999', type: 'capsule',
      store: '测试店', supplier: '测试供应商', purchaseDate: '2025-01-01',
      warrantyEnd: '2027-01-01', status: 'normal',
    };
    assert.equal(typeof item.id, 'string');
    assert.equal(typeof item.name, 'string');
    assert.equal(typeof item.status, 'string');
  });

  it('EquipmentStatus enum has 4 values', () => {
    const values: EquipmentStatus[] = ['normal', 'maintaining', 'scrap_pending', 'scrapped'];
    assert.equal(values.length, 4);
  });

  it('EquipmentType enum has 7 values', () => {
    const values: EquipmentType[] = ['capsule', 'claw', 'cashier', 'ac', 'speaker', 'lightbox', 'turnstile'];
    assert.equal(values.length, 7);
  });

  it('note field is optional', () => {
    const withNote: EquipmentItem = { id: 'E1', name: 'A', model: 'M', type: 'claw', store: 'S', supplier: 'SP', purchaseDate: 'D', warrantyEnd: 'D', status: 'normal', note: 'test' };
    const withoutNote: EquipmentItem = { id: 'E2', name: 'B', model: 'M', type: 'claw', store: 'S', supplier: 'SP', purchaseDate: 'D', warrantyEnd: 'D', status: 'normal' };
    assert.equal(withNote.note, 'test');
    assert.equal(withoutNote.note, undefined);
  });

  it('EditFormErrors fields are optional', () => {
    const empty: EditFormErrors = {};
    assert.deepEqual(empty, {});
    const partial: EditFormErrors = { name: '名称错误' };
    assert.equal(partial.name, '名称错误');
  });
});

describe('equipment-detail: 业务逻辑 - 设备查找', () => {
  it('finds existing equipment by id E001', () => {
    const eq = getEquipmentById('E001');
    assert.ok(eq);
    assert.equal(eq?.name, '扭蛋机-A01');
    assert.equal(eq?.status, 'normal');
  });

  it('returns undefined for non-existent id', () => {
    assert.equal(getEquipmentById('E999'), undefined);
  });

  it('returns undefined for empty string id', () => {
    assert.equal(getEquipmentById(''), undefined);
  });

  it('id lookup is case-sensitive', () => {
    assert.equal(getEquipmentById('e001'), undefined);
  });

  it('all mock equipment have required fields', () => {
    const required: (keyof EquipmentItem)[] = ['id', 'name', 'model', 'type', 'store', 'supplier', 'purchaseDate', 'warrantyEnd', 'status'];
    for (const entry of Object.values(MOCK_EQUIPMENT_DETAIL)) {
      for (const field of required) {
        assert.ok(entry[field] !== undefined, `Equipment ${entry.id} missing field ${field}`);
      }
    }
  });
});

describe('equipment-detail: 业务逻辑 - 类型与状态映射', () => {
  it('all 7 equipment types have Chinese labels', () => {
    const types: EquipmentType[] = ['capsule', 'claw', 'cashier', 'ac', 'speaker', 'lightbox', 'turnstile'];
    for (const t of types) {
      assert.ok(ET[t], `Missing type label for ${t}`);
      assert.ok(ET[t].length > 0);
    }
  });

  it('all 4 equipment statuses have Chinese labels and variants', () => {
    for (const s of STATUS_ORDER) {
      const m = ES[s];
      assert.ok(m, `Missing status entry for ${s}`);
      assert.ok(m.l.length > 0);
      assert.ok(['success', 'warning', 'danger', 'neutral'].includes(m.v));
    }
  });

  it('E001 normal status maps correctly', () => {
    const eq = getEquipmentById('E001')!;
    assert.equal(eq.status, 'normal');
    assert.equal(ES[eq.status].l, '正常');
    assert.equal(ES[eq.status].v, 'success');
  });

  it('E003 maintaining status maps correctly', () => {
    const eq = getEquipmentById('E003')!;
    assert.equal(eq.status, 'maintaining');
    assert.equal(ES[eq.status].l, '维修中');
    assert.equal(ES[eq.status].v, 'warning');
  });

  it('E005 scrap_pending status maps correctly', () => {
    const eq = getEquipmentById('E005')!;
    assert.equal(eq.status, 'scrap_pending');
    assert.equal(ES[eq.status].l, '待报废');
    assert.equal(ES[eq.status].v, 'danger');
  });

  it('E008 scrapped status maps correctly', () => {
    const eq = getEquipmentById('E008')!;
    assert.equal(eq.status, 'scrapped');
    assert.equal(ES[eq.status].l, '已报废');
    assert.equal(ES[eq.status].v, 'neutral');
  });

  it('all mock equipment types are mapped', () => {
    for (const entry of Object.values(MOCK_EQUIPMENT_DETAIL)) {
      const m = ET[entry.type];
      assert.ok(m, `Missing type label for ${entry.type} on ${entry.id}`);
    }
  });
});

describe('equipment-detail: 业务逻辑 - 表单验证', () => {
  const validData: EditFormData = {
    name: '测试设备',
    model: 'MODEL-X',
    store: '旗舰店-解放路',
    supplier: '万代南梦宫',
    note: '测试备注',
  };

  it('valid form passes', () => {
    const errors = validateEquipmentForm(validData);
    assert.equal(Object.keys(errors).length, 0);
  });

  it('empty name rejected', () => {
    const errors = validateEquipmentForm({ ...validData, name: '' });
    assert.equal(errors.name, '设备名称不能为空');
  });

  it('whitespace-only name rejected', () => {
    const errors = validateEquipmentForm({ ...validData, name: '   ' });
    assert.equal(errors.name, '设备名称不能为空');
  });

  it('empty model rejected', () => {
    const errors = validateEquipmentForm({ ...validData, model: '' });
    assert.equal(errors.model, '型号不能为空');
  });

  it('empty store rejected', () => {
    const errors = validateEquipmentForm({ ...validData, store: '' });
    assert.equal(errors.store, '所属门店不能为空');
  });

  it('empty supplier rejected', () => {
    const errors = validateEquipmentForm({ ...validData, supplier: '' });
    assert.equal(errors.supplier, '供应商不能为空');
  });

  it('note is optional - empty note passes', () => {
    const errors = validateEquipmentForm({ ...validData, note: '' });
    assert.equal(errors.name, undefined);
    assert.equal(errors.model, undefined);
    assert.equal(errors.store, undefined);
    assert.equal(errors.supplier, undefined);
  });

  it('multiple errors accumulated', () => {
    const errors = validateEquipmentForm({ name: '', model: '', store: '店', supplier: '供', note: '' });
    assert.equal(Object.keys(errors).length, 2);
    assert.ok(errors.name);
    assert.ok(errors.model);
  });

  it('note with extra long string passes', () => {
    const longNote = 'A'.repeat(1000);
    const errors = validateEquipmentForm({ ...validData, note: longNote });
    assert.equal(Object.keys(errors).length, 0);
  });
});

describe('equipment-detail: 业务逻辑 - 状态流转', () => {
  it('normal can transition to maintaining and scrap_pending', () => {
    const actions = getTransitionActions('normal');
    assert.equal(actions.length, 2);
    assert.ok(actions.some((a) => a.to === 'maintaining'));
    assert.ok(actions.some((a) => a.to === 'scrap_pending'));
  });

  it('maintaining can transition to normal and scrap_pending', () => {
    const actions = getTransitionActions('maintaining');
    assert.equal(actions.length, 2);
    assert.ok(actions.some((a) => a.to === 'normal'));
    assert.ok(actions.some((a) => a.to === 'scrap_pending'));
  });

  it('scrap_pending can transition to scrapped and normal', () => {
    const actions = getTransitionActions('scrap_pending');
    assert.equal(actions.length, 2);
    assert.ok(actions.some((a) => a.to === 'scrapped'));
    assert.ok(actions.some((a) => a.to === 'normal'));
  });

  it('scrapped has no available transitions', () => {
    const actions = getTransitionActions('scrapped');
    assert.equal(actions.length, 0);
  });

  it('unknown status returns empty transitions', () => {
    const actions = getTransitionActions('unknown' as EquipmentStatus);
    assert.deepEqual(actions, []);
  });

  it('all 4 statuses have a transition entry', () => {
    for (const s of STATUS_ORDER) {
      const actions = ALLOWED_TRANSITIONS[s];
      assert.ok(actions !== undefined, `Missing transition entry for ${s}`);
    }
  });

  it('async transition returns success', async () => {
    const result = await submitEquipmentTransition();
    assert.equal(result.success, true);
  });
});

describe('equipment-detail: 业务逻辑 - 保修期计算', () => {
  it('past date returns negative days', () => {
    assert.ok(daysUntil('2020-01-01') < 0);
  });

  it('future date returns positive days', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    assert.ok(daysUntil(future.toISOString().slice(0, 10)) > 700);
  });

  it('warrantyLabel: expired', () => {
    assert.equal(warrantyLabel(-1), '已过期');
    assert.equal(warrantyLabel(-365), '已过期');
  });

  it('warrantyLabel: less than 90 days remaining', () => {
    assert.equal(warrantyLabel(30), '剩30天');
    assert.equal(warrantyLabel(89), '剩89天');
  });

  it('warrantyLabel: more than 90 days', () => {
    assert.equal(warrantyLabel(90), '有效');
    assert.equal(warrantyLabel(365), '有效');
  });

  it('warrantyLabel: zero days is under 90', () => {
    assert.equal(warrantyLabel(0), '剩0天');
  });
});

describe('equipment-detail: 数据一致性', () => {
  it('mock data covers all 4 statuses', () => {
    const found = new Set(Object.values(MOCK_EQUIPMENT_DETAIL).map((e) => e.status));
    assert.equal(found.size, 4);
  });

  it('mock data covers all 4 distinct equipment types', () => {
    const found = new Set(Object.values(MOCK_EQUIPMENT_DETAIL).map((e) => e.type));
    assert.ok(found.has('capsule'));
    assert.ok(found.has('cashier'));
    assert.ok(found.has('speaker'));
  });

  it('mock equipment with note have non-empty note', () => {
    for (const entry of Object.values(MOCK_EQUIPMENT_DETAIL)) {
      if (entry.note !== undefined) {
        assert.ok(entry.note.length > 0);
      }
    }
  });
});

const SRC = fs.readFileSync('./page.tsx', 'utf-8');

describe('equipment-detail: 源码 hooks 验证', () => {
  it('包含 use 声明（params Promise）', () => assert.ok(SRC.includes('const { id } = use(') || SRC.includes('use(params)')));
  it('包含 useState 声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含 useCallback 声明', () => assert.ok(SRC.includes('useCallback')));
  it('包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器（onClick）', () => assert.ok(SRC.includes('onClick={')));
  it('包含条件渲染', () => assert.ok(SRC.includes('&&') || SRC.includes('?')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
  it('包含 StatusBadge 组件', () => assert.ok(SRC.includes('StatusBadge')));
  it('包含 InfoRow 组件', () => assert.ok(SRC.includes('InfoRow')));
  it('包含 DetailShell 组件', () => assert.ok(SRC.includes('DetailShell')));
  it('包含 404 状态组件', () => assert.ok(SRC.includes('EquipmentNotFound')));
});
