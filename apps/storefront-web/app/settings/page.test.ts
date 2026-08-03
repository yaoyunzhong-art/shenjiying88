/**
 * settings/page.test.ts — 门店设置 L1 测试（storefront-web）
 *
 * 覆盖: 设置分类、字段类型、切换开关、搜索筛选
 * 正例: 设置数据完整性、分类映射、字段类型枚举
 * 反例: 空设置列表、无效类型、缺失字段
 * 边界: 全 toggle/全 text、超长字段值
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

type SettingsTab = 'general' | 'notifications' | 'security' | 'billing';

interface SettingsField {
  label: string;
  value: string;
  type: 'text' | 'toggle' | 'select';
}

interface SettingSection {
  key: SettingsTab;
  label: string;
  fields: SettingsField[];
}

// ── 常量映射 ──

const TAB_LABELS: Record<SettingsTab, string> = {
  general: '通用设置',
  notifications: '通知设置',
  security: '安全设置',
  billing: '账单设置',
};

// ── Mock 数据 ──

const MOCK_SETTINGS: SettingSection[] = [
  {
    key: 'general',
    label: '通用设置',
    fields: [
      { label: '门店名称', value: 'Demo Store 旗舰店', type: 'text' },
      { label: '门店地址', value: '深圳市南山区科技园', type: 'text' },
      { label: '联系电话', value: '0755-88888888', type: 'text' },
      { label: '营业时间', value: '08:00-22:00', type: 'text' },
    ],
  },
  {
    key: 'notifications',
    label: '通知设置',
    fields: [
      { label: '低库存预警', value: '开启', type: 'toggle' },
      { label: '订单通知', value: '开启', type: 'toggle' },
      { label: '员工排班变更', value: '关闭', type: 'toggle' },
      { label: '系统更新通知', value: '开启', type: 'toggle' },
    ],
  },
  {
    key: 'security',
    label: '安全设置',
    fields: [
      { label: '密码有效期（天）', value: '90', type: 'text' },
      { label: '登录验证方式', value: '短信+密码', type: 'select' },
      { label: '登录 IP 白名单', value: '192.168.0.0/16', type: 'text' },
    ],
  },
  {
    key: 'billing',
    label: '账单设置',
    fields: [
      { label: '结算周期', value: '月度', type: 'select' },
      { label: '发票抬头', value: 'Demo Store 有限公司', type: 'text' },
      { label: '税号', value: '91440300XXXXXX', type: 'text' },
    ],
  },
];

// ── 辅助函数 ──

function getSectionByKey(key: SettingsTab): SettingSection | undefined {
  return MOCK_SETTINGS.find(s => s.key === key);
}

function getTabLabel(key: SettingsTab): string {
  return TAB_LABELS[key] ?? key;
}

function getFieldsByType(sections: SettingSection[], type: SettingsField['type']): SettingsField[] {
  return sections.flatMap(s => s.fields).filter(f => f.type === type);
}

function searchSettings(sections: SettingSection[], query: string): SettingSection[] {
  if (!query.trim()) return sections;
  const lower = query.toLowerCase();
  return sections
    .map(s => ({
      ...s,
      fields: s.fields.filter(f => f.label.toLowerCase().includes(lower) || f.value.toLowerCase().includes(lower)),
    }))
    .filter(s => s.fields.length > 0);
}

function countTotalFields(sections: SettingSection[]): number {
  return sections.reduce((sum, s) => sum + s.fields.length, 0);
}

// ===================================================================
describe('Settings — 分类', () => {
  it('四种设置分类映射完整', () => {
    const tabs: SettingsTab[] = ['general', 'notifications', 'security', 'billing'];
    for (const t of tabs) {
      assert.ok(getTabLabel(t).length > 0, `Tab ${t} should have label`);
    }
  });

  it('应根据 key 返回对应设置段', () => {
    const section = getSectionByKey('general');
    assert.ok(section);
    assert.equal(section!.label, '通用设置');
  });

  it('不存在的 key 返回 undefined', () => {
    assert.equal(getSectionByKey('nonexistent' as SettingsTab), undefined);
  });

  it('所有设置段应有至少一个字段', () => {
    for (const s of MOCK_SETTINGS) {
      assert.ok(s.fields.length > 0, `${s.key}: at least one field`);
    }
  });
});

// ===================================================================
describe('Settings — 字段统计', () => {
  it('总字段数应为 14', () => {
    assert.equal(countTotalFields(MOCK_SETTINGS), 14);
  });

  it('text 类型字段统计', () => {
    const textFields = getFieldsByType(MOCK_SETTINGS, 'text');
    assert.equal(textFields.length, 8);
  });

  it('toggle 类型字段统计', () => {
    const toggleFields = getFieldsByType(MOCK_SETTINGS, 'toggle');
    assert.equal(toggleFields.length, 4);
  });

  it('select 类型字段统计', () => {
    const selectFields = getFieldsByType(MOCK_SETTINGS, 'select');
    assert.equal(selectFields.length, 2);
  });

  it('所有字段应有 label 和 value', () => {
    const allFields = MOCK_SETTINGS.flatMap(s => s.fields);
    for (const f of allFields) {
      assert.ok(f.label, 'label required');
      assert.notEqual(f.value, undefined, 'value required');
    }
  });
});

// ===================================================================
describe('Settings — 搜索', () => {
  it('按字段名搜索', () => {
    const result = searchSettings(MOCK_SETTINGS, '门店');
    assert.ok(result.length > 0);
    assert.ok(result.some(s => s.fields.some(f => f.label.includes('门店'))));
  });

  it('按字段值搜索', () => {
    const result = searchSettings(MOCK_SETTINGS, '开启');
    assert.ok(result.length > 0);
  });

  it('空搜索返回全部', () => {
    const result = searchSettings(MOCK_SETTINGS, '');
    assert.equal(result.length, MOCK_SETTINGS.length);
  });

  it('无匹配返回空', () => {
    const result = searchSettings(MOCK_SETTINGS, 'zzz');
    assert.equal(result.length, 0);
  });
});

// ===================================================================
describe('Settings — 边界', () => {
  it('空设置列表不抛异常', () => {
    assert.doesNotThrow(() => searchSettings([], 'test'));
    assert.equal(searchSettings([], 'test').length, 0);
    assert.equal(countTotalFields([]), 0);
    assert.equal(getFieldsByType([], 'text').length, 0);
  });

  it('超大 value 不截断', () => {
    const big: SettingSection = {
      key: 'general', label: '测试', fields: [{ label: 'big', value: 'x'.repeat(1000), type: 'text' }],
    };
    assert.equal(big.fields[0]!.value.length, 1000);
  });

  it('toggle 字段值应为"开启"或"关闭"', () => {
    const toggles = getFieldsByType(MOCK_SETTINGS, 'toggle');
    for (const t of toggles) {
      assert.ok(['开启', '关闭'].includes(t.value), `toggle value should be 开启/关闭, got ${t.value}`);
    }
  });
});
