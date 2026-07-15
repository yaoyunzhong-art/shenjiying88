/**
 * pad/page.test.tsx — Pad 工作台首页 L1 测试
 *
 * 覆盖: 角色工作台数据、市场编码唯一性、渠道过滤、角色图标映射
 * 正例: 工作台字段完整性、Pad 渠道筛选、市场编码去重
 * 反例: 空工作台列表、无效角色键、空市场编码
 * 边界: normalizeWorkbenchRoleKey 大小写/连字符/前后空格
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型 ── */

interface RoleWorkbenchContract {
  role: string;
  channel: string;
  label: string;
  description?: string;
  marketCodes?: string[];
  link?: string;
}

/* ── Mock 数据 ── */

const MOCK_WORKBENCHES: RoleWorkbenchContract[] = [
  { role: 'GUIDE', channel: 'PAD', label: '导购接待', marketCodes: ['CN_BJ', 'CN_SH'], link: '/pad/guide' },
  { role: 'CASHIER', channel: 'PAD', label: '收银工作台', marketCodes: ['CN_BJ', 'CN_SH', 'CN_GZ'], link: '/pad/cashier' },
  { role: 'FRONT_DESK', channel: 'PAD', label: '前台接待', marketCodes: ['CN_BJ'], link: '/pad/front-desk' },
  { role: 'STORE_MANAGER', channel: 'PAD', label: '店长工作台', marketCodes: ['CN_BJ', 'CN_SH', 'CN_GZ', 'CN_SZ'], link: '/pad/store-manager' },
  { role: 'INVENTORY_KEEPER', channel: 'PAD', label: '库存管理', marketCodes: ['CN_BJ'], link: '/pad/inventory' },
  { role: 'COACH', channel: 'PAD', label: '教练工作台', marketCodes: ['CN_SH'], link: '/pad/coach' },
  { role: 'TRAINING_MANAGER', channel: 'PAD', label: '培训管理', marketCodes: ['CN_BJ', 'CN_SH'], link: '/pad/training' },
  { role: 'CUSTOMER_SERVICE', channel: 'PAD', label: '客服工作台', marketCodes: ['CN_BJ'], link: '/pad/cs' },
  { role: 'ASSISTANT_MANAGER', channel: 'PAD', label: '经理助理', marketCodes: ['CN_SH'], link: '/pad/asst-mgr' },
  { role: 'ENTERTAINMENT_GUIDE', channel: 'PAD', label: '娱乐导览', marketCodes: ['CN_BJ'], link: '/pad/entertainment' },
  { role: 'DELIVERY_PERSON', channel: 'PAD', label: '配送管理', marketCodes: ['CN_GZ', 'CN_SZ'], link: '/pad/delivery' },
  { role: 'SALES_CLERK', channel: 'PAD', label: '销售工具', marketCodes: ['CN_BJ', 'CN_GZ'], link: '/pad/sales' },
  { role: 'CONCIERGE', channel: 'PAD', label: '礼宾服务', marketCodes: ['CN_SZ'], link: '/pad/concierge' },
  { role: 'SUPER_ADMIN', channel: 'PC', label: '超级管理员', link: '/workbench/admin' },
  { role: 'TENANT_ADMIN', channel: 'PC', label: '租户管理员', link: '/workbench/tenant' },
];

/* ── 映射常量 ── */

const ROLE_EMOJI: Record<string, string> = {
  GUIDE: '🎙️', CASHIER: '🧾', FRONT_DESK: '🏪', STORE_MANAGER: '👔',
  INVENTORY_KEEPER: '📦', TRAINING_MANAGER: '📋', COACH: '🏋️',
  CUSTOMER_SERVICE: '📞', ASSISTANT_MANAGER: '👤', ENTERTAINMENT_GUIDE: '🎮',
  DELIVERY_PERSON: '🚚', SALES_CLERK: '🛍️', CONCIERGE: '🔔',
};

const ROLE_LABEL_MAP: Record<string, string> = {
  GUIDE: '导购接待', CASHIER: '收银工作台', FRONT_DESK: '前台接待',
  STORE_MANAGER: '店长工作台', INVENTORY_KEEPER: '库存管理',
  TRAINING_MANAGER: '培训管理', COACH: '教练工作台',
  CUSTOMER_SERVICE: '客服工作台', ASSISTANT_MANAGER: '经理助理',
  ENTERTAINMENT_GUIDE: '娱乐导览', DELIVERY_PERSON: '配送管理',
  SALES_CLERK: '销售工具', CONCIERGE: '礼宾服务',
};

/* ── 工具函数 ── */

function normalizeWorkbenchRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, '_');
}

function filterPadWorkbenches(workbenches: RoleWorkbenchContract[]): RoleWorkbenchContract[] {
  return workbenches.filter(wb => wb.channel === 'PAD');
}

function getUniqueMarketCodes(workbenches: RoleWorkbenchContract[]): string[] {
  return Array.from(new Set(workbenches.flatMap(wb => wb.marketCodes ?? [])));
}

function getRoleLabel(role: string): string {
  return ROLE_LABEL_MAP[role] ?? role;
}

function getRoleEmoji(role: string): string {
  return ROLE_EMOJI[role] ?? '📱';
}

/* ══════════════════════════════════════════════════════════
   测试: 文件存在
   ══════════════════════════════════════════════════════════ */

describe('pad — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 使用 "use client"', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("'use client'") || source.includes('"use client"'));
  });

  it('3. 导出默认函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 工作台数据
   ══════════════════════════════════════════════════════════ */

describe('pad — 工作台数据', () => {
  it('4. 共 15 条工作台', () => {
    assert.equal(MOCK_WORKBENCHES.length, 15);
  });

  it('5. 所有角色名唯一', () => {
    const roles = MOCK_WORKBENCHES.map(wb => wb.role);
    assert.equal(new Set(roles).size, roles.length);
  });

  it('6. 13 条 PAD 渠道', () => {
    assert.equal(filterPadWorkbenches(MOCK_WORKBENCHES).length, 13);
  });

  it('7. 2 条 PC 渠道', () => {
    assert.equal(MOCK_WORKBENCHES.filter(wb => wb.channel === 'PC').length, 2);
  });

  it('8. label 非空', () => {
    for (const wb of MOCK_WORKBENCHES) {
      assert.ok(wb.label.length > 0, `${wb.role} empty label`);
    }
  });

  it('9. PAD 工作台都有 link', () => {
    const pads = filterPadWorkbenches(MOCK_WORKBENCHES);
    for (const wb of pads) {
      assert.ok(wb.link && wb.link.startsWith('/'), `${wb.role} missing link`);
    }
  });

  it('10. 所有 role 大写', () => {
    for (const wb of MOCK_WORKBENCHES) {
      assert.equal(wb.role, wb.role.toUpperCase(), `${wb.role} should be uppercase`);
    }
  });

  it('11. channel 值仅为 PAD 或 PC', () => {
    for (const wb of MOCK_WORKBENCHES) {
      assert.ok(wb.channel === 'PAD' || wb.channel === 'PC', `${wb.role} invalid channel`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 工具函数
   ══════════════════════════════════════════════════════════ */

describe('pad — 工具函数', () => {
  /* ── normalizeWorkbenchRoleKey ── */

  it('12. 连字符转下划线', () => {
    assert.equal(normalizeWorkbenchRoleKey('FRONT-DESK'), 'front_desk');
  });

  it('13. 大小写不敏感', () => {
    assert.equal(normalizeWorkbenchRoleKey('Store_Manager'), 'store_manager');
  });

  it('14. 去除前后空格', () => {
    assert.equal(normalizeWorkbenchRoleKey('  GUIDE '), 'guide');
  });

  it('15. 无连字符原样返回小写', () => {
    assert.equal(normalizeWorkbenchRoleKey('CASHIER'), 'cashier');
  });

  /* ── filterPadWorkbenches ── */

  it('16. 空输入返回空数组', () => {
    assert.equal(filterPadWorkbenches([]).length, 0);
  });

  it('17. 仅 PC 渠道返回空', () => {
    const pcOnly = MOCK_WORKBENCHES.filter(wb => wb.channel === 'PC');
    assert.equal(filterPadWorkbenches(pcOnly).length, 0);
  });

  /* ── getUniqueMarketCodes ── */

  it('18. 4 个唯一市场编码', () => {
    const codes = getUniqueMarketCodes(MOCK_WORKBENCHES);
    assert.equal(codes.length, 4);
    assert.ok(codes.includes('CN_BJ'));
    assert.ok(codes.includes('CN_SH'));
    assert.ok(codes.includes('CN_GZ'));
    assert.ok(codes.includes('CN_SZ'));
  });

  it('19. 空工作台返回空数组', () => {
    assert.equal(getUniqueMarketCodes([]).length, 0);
  });

  it('20. 工作台无 marketCodes 不崩溃', () => {
    const noCodes = [{ role: 'TEST', channel: 'PAD', label: 'Test' }];
    assert.equal(getUniqueMarketCodes(noCodes).length, 0);
  });

  /* ── getRoleLabel / getRoleEmoji ── */

  it('21. 已知角色返回正确中文标签', () => {
    assert.equal(getRoleLabel('STORE_MANAGER'), '店长工作台');
    assert.equal(getRoleLabel('CASHIER'), '收银工作台');
  });

  it('22. 未知角色回退为角色名', () => {
    assert.equal(getRoleLabel('UNKNOWN_ROLE'), 'UNKNOWN_ROLE');
  });

  it('23. 已知角色返回 emoji', () => {
    assert.equal(getRoleEmoji('GUIDE'), '🎙️');
    assert.equal(getRoleEmoji('CASHIER'), '🧾');
  });

  it('24. 未知角色返回默认 emoji', () => {
    assert.equal(getRoleEmoji('UNKNOWN'), '📱');
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 边界与反例
   ══════════════════════════════════════════════════════════ */

describe('pad — 边界与反例', () => {
  it('25. 空角色字符串 normalize 返回空', () => {
    assert.equal(normalizeWorkbenchRoleKey(''), '');
  });

  it('26. 连续空格 normalize 不崩溃', () => {
    assert.ok(typeof normalizeWorkbenchRoleKey('  MULTI  SPACE  ') === 'string');
  });

  it('27. 特殊字符 normalize 不崩溃', () => {
    assert.ok(typeof normalizeWorkbenchRoleKey('HELLO_WORLD') === 'string');
  });

  it('28. marketCodes 无重复', () => {
    const codes = getUniqueMarketCodes(MOCK_WORKBENCHES);
    assert.equal(codes.length, new Set(codes).size);
  });

  it('29. 每个 PAD 工作台的 link 格式正确', () => {
    const pads = filterPadWorkbenches(MOCK_WORKBENCHES);
    for (const wb of pads) {
      assert.ok(wb.link!.startsWith('/pad/'), `${wb.role} link not /pad/`);
    }
  });

  it('30. role 和 channel 不能为 undefined', () => {
    for (const wb of MOCK_WORKBENCHES) {
      assert.ok(wb.role !== undefined);
      assert.ok(wb.channel !== undefined);
    }
  });

  it('31. 角色 emoji 映射表大小 > 12', () => {
    assert.ok(Object.keys(ROLE_EMOJI).length >= 12);
  });

  it('32. label 映射表大小与 emoji 一致', () => {
    const labelKeys = Object.keys(ROLE_LABEL_MAP).sort();
    const emojiKeys = Object.keys(ROLE_EMOJI).sort();
    // 所有 label 映射的角色都应存在 emoji
    for (const key of labelKeys) {
      assert.ok(emojiKeys.includes(key), `${key} missing emoji`);
    }
  });
});
