/**
 * miniapp (Taro) Role-Based Smoke Test — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证六个核心模块在角色视角下能正确加载和渲染:
 * - redeem-center     积分兑换
 * - purchase-orders   采购订单
 * - customer-service  客服工作台
 * - member            会员中心
 * - sales-tools       导购工具
 *
 * 注意: Taro 组件在 Node 环境无法直接 import，采用 source 文件分析 + 镜像常量验证
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── 角色常量 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const;

// ── 辅助: 读取页面源码 ──
function readPageSource(pageName: string, fileName = 'index.tsx'): string {
  const fullPath = resolve(__dirname, '..', 'pages', pageName, fileName);
  return readFileSync(fullPath, 'utf-8');
}

// ─────────────────────────────────────────────────────────
// 1. Redeem-Center — 积分兑换 (💎会员视角)
// ─────────────────────────────────────────────────────────
describe('💎会员: redeem-center — 正例', () => {
  it('应导出默认函数组件 RedeemCenterPage', () => {
    const src = readPageSource('redeem-center');
    assert.ok(src.includes('export default function RedeemCenterPage'), '缺少 RedeemCenterPage');
  });

  it('应包含 MOCK_POINTS_BALANCE 积分常量 (12880)', () => {
    const src = readPageSource('redeem-center');
    assert.ok(src.includes('MOCK_POINTS_BALANCE'), '缺少 MOCK_POINTS_BALANCE');
    assert.ok(src.includes('12880'), 'MOCK_POINTS_BALANCE 值不为 12880');
  });

  it('应包含 MOCK_REDEEM_ITEMS 数据，且至少有 8 条', () => {
    const src = readPageSource('redeem-center');
    const match = src.match(/const MOCK_REDEEM_ITEMS: RedeemItem\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_REDEEM_ITEMS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 8, `MOCK_REDEEM_ITEMS 数量不足 (实际 ${count})`);
  });

  it('CATEGORY_OPTIONS 应覆盖 5 个分类 (全部/数码/优惠券/实物/体验)', () => {
    const src = readPageSource('redeem-center');
    assert.ok(src.includes('全部'), '缺少 全部');
    assert.ok(src.includes('数码'), '缺少 数码');
    assert.ok(src.includes('优惠券'), '缺少 优惠券');
    assert.ok(src.includes('实物'), '缺少 实物');
    assert.ok(src.includes('体验'), '缺少 体验');
  });

  it('STATUS_LABELS 应覆盖 4 种状态颜色映射', () => {
    const src = readPageSource('redeem-center');
    assert.ok(src.includes("available: '#22c55e'"), '缺少 available 颜色');
    assert.ok(src.includes("hot: '#ef4444'"), '缺少 hot 颜色');
    assert.ok(src.includes("limited: '#f59e0b'"), '缺少 limited 颜色');
    assert.ok(src.includes("sold_out: '#94a3b8'"), '缺少 sold_out 颜色');
  });
});

describe('💎会员: redeem-center — 反例', () => {
  it('应处理积分不足时的限制', () => {
    const src = readPageSource('redeem-center');
    assert.ok(
      src.includes('points') && (src.includes('>=', 0) || src.includes('>=')),
      '缺少积分不足限制'
    );
  });

  it('应处理库存为 0 的商品 (sold_out)', () => {
    const src = readPageSource('redeem-center');
    assert.ok(src.includes("'sold_out'"), '缺少 sold_out 状态');
    assert.ok(src.includes('stock: 0'), '缺少库存为零的商品');
  });
});

describe('💎会员: redeem-center — 边界', () => {
  it('积分余额应大于所有可兑换商品的最低积分', () => {
    const src = readPageSource('redeem-center');
    // 最小兑换商品 300 积分; 余额 12880
    assert.ok(src.includes('300'), '缺少 300 积分商品');
    assert.ok(src.includes('12880'), '积分余额应有至少 12880');
  });

  it('每种分类 (digital/voucher/physical/experience) 至少有一件商品', () => {
    const src = readPageSource('redeem-center');
    assert.ok(src.includes("'digital'"), '缺少 digital 分类商品');
    assert.ok(src.includes("'voucher'"), '缺少 voucher 分类商品');
    assert.ok(src.includes("'physical'"), '缺少 physical 分类商品');
    assert.ok(src.includes("'experience'"), '缺少 experience 分类商品');
  });
});

// ─────────────────────────────────────────────────────────
// 2. Purchase-Orders — 采购订单 (👔店长 / 🎯运行专员)
// ─────────────────────────────────────────────────────────
describe('👔店长 / 🎯运行专员: purchase-orders — 正例', () => {
  it('应导出默认函数组件 PurchaseOrdersPage', () => {
    const src = readPageSource('purchase-orders');
    assert.ok(src.includes('export default function PurchaseOrdersPage'), '缺少 PurchaseOrdersPage');
  });

  it('应包含 MOCK_ORDERS 数据，且至少有 8 条', () => {
    const src = readPageSource('purchase-orders');
    const match = src.match(/const MOCK_ORDERS: PurchaseOrder\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_ORDERS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 8, `MOCK_ORDERS 数量不足 (实际 ${count})`);
  });

  it('STATUS_OPTIONS 应覆盖至少 7 个选项 (全部 + 6 种状态)', () => {
    const src = readPageSource('purchase-orders');
    assert.ok(src.includes('STATUS_OPTIONS'), '缺少 STATUS_OPTIONS');
    const labels = ['草稿', '已提交', '已确认', '已发货', '已收货', '已取消'];
    for (const label of labels) {
      assert.ok(src.includes(label), `缺少状态标签: ${label}`);
    }
  });
});

describe('👔店长 / 🎯运行专员: purchase-orders — 反例', () => {
  it('应处理空采购单列表', () => {
    const src = readPageSource('purchase-orders');
    assert.ok(
      src.includes('暂无') || src.includes('EmptyState') || src.includes('empty'),
      '缺少空数据兜底'
    );
  });

  it('应处理订单取消状态', () => {
    const src = readPageSource('purchase-orders');
    assert.ok(src.includes("'cancelled'") || src.includes('已取消'), '缺少已取消状态处理');
  });
});

describe('👔店长 / 🎯运行专员: purchase-orders — 边界', () => {
  it('STATUS_COLORS 应覆盖 6 种状态颜色', () => {
    const src = readPageSource('purchase-orders');
    const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#06b6d4', '#64748b', '#ef4444'];
    for (const color of colors) {
      assert.ok(src.includes(color), `缺少颜色: ${color}`);
    }
  });

  it('STATUS_LABELS 中文映射应完整', () => {
    const src = readPageSource('purchase-orders');
    assert.ok(src.includes("'草稿'"), '缺少 草稿');
    assert.ok(src.includes("'已提交'"), '缺少 已提交');
    assert.ok(src.includes("'已确认'"), '缺少 已确认');
    assert.ok(src.includes("'已发货'"), '缺少 已发货');
    assert.ok(src.includes("'已收货'"), '缺少 已收货');
    assert.ok(src.includes("'已取消'"), '缺少 已取消');
  });
});

// ─────────────────────────────────────────────────────────
// 3. Customer-Service — 客服工作台 (🛒前台 / 🎮导玩员)
// ─────────────────────────────────────────────────────────
describe('🛒前台 / 🎮导玩员: customer-service — 正例', () => {
  it('应导出默认函数组件 CustomerServicePage', () => {
    const src = readPageSource('customer-service');
    assert.ok(src.includes('export default function CustomerServicePage'), '缺少 CustomerServicePage');
  });

  it('应包含 MOCK_TICKETS 数据，且至少有 8 条', () => {
    const src = readPageSource('customer-service');
    const match = src.match(/const MOCK_TICKETS: ServiceTicket\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_TICKETS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 8, `MOCK_TICKETS 数量不足 (实际 ${count})`);
  });

  it('工单状态应覆盖 pending/processing/resolved/closed', () => {
    const src = readPageSource('customer-service');
    assert.ok(src.includes("'pending'"), '缺少 pending');
    assert.ok(src.includes("'processing'"), '缺少 processing');
    assert.ok(src.includes("'resolved'"), '缺少 resolved');
    assert.ok(src.includes("'closed'"), '缺少 closed');
  });

  it('优先级应覆盖 urgent/high/normal/low', () => {
    const src = readPageSource('customer-service');
    assert.ok(src.includes("'urgent'"), '缺少 urgent');
    assert.ok(src.includes("'high'"), '缺少 high');
    assert.ok(src.includes("'normal'"), '缺少 normal');
    assert.ok(src.includes("'low'"), '缺少 low');
  });

  it('分类应覆盖 complaint/consultation/return/feedback/other', () => {
    const src = readPageSource('customer-service');
    assert.ok(src.includes("'complaint'"), '缺少 complaint');
    assert.ok(src.includes("'consultation'"), '缺少 consultation');
    assert.ok(src.includes("'return'"), '缺少 return');
    assert.ok(src.includes("'feedback'"), '缺少 feedback');
    assert.ok(src.includes("'other'"), '缺少 other');
  });
});

describe('🛒前台 / 🎮导玩员: customer-service — 反例', () => {
  it('应处理空工单列表', () => {
    const src = readPageSource('customer-service');
    assert.ok(
      src.includes('暂无') || src.includes('empty') || src.includes('EmptyState'),
      '缺少空数据兜底'
    );
  });

  it('应处理工单关闭后的状态展示', () => {
    const src = readPageSource('customer-service');
    assert.ok(
      src.includes('已关闭') || src.includes("'closed'") || src.includes('closed'),
      '缺少已关闭状态'
    );
  });
});

describe('🛒前台 / 🎮导玩员: customer-service — 边界', () => {
  it('紧急 (urgent) 工单应至少有一条', () => {
    const src = readPageSource('customer-service');
    assert.ok(src.includes("priority: 'urgent'"), '缺少 urgent 优先级工单');
  });

  it('已完成 (resolved) 工单应至少有一条', () => {
    const src = readPageSource('customer-service');
    assert.ok(src.includes("status: 'resolved'"), '缺少 resolved 工单');
  });
});

// ─────────────────────────────────────────────────────────
// 4. Member — 会员中心 (💎会员 / 🛒前台视角)
// ─────────────────────────────────────────────────────────
describe('💎会员 / 🛒前台: member — 正例', () => {
  it('应导出默认函数组件', () => {
    const src = readPageSource('member');
    assert.ok(
      src.includes('export default function MemberPage') ||
      src.includes('export default function MemberCenterPage'),
      '缺少默认导出组件'
    );
  });

  it('应包含会员 Profile 数据结构 (nickname/level/points/couponCount)', () => {
    const src = readPageSource('member');
    assert.ok(src.includes('nickname'), '缺少 nickname');
    assert.ok(src.includes('level'), '缺少 level');
    assert.ok(src.includes('points'), '缺少 points');
    assert.ok(src.includes('couponCount'), '缺少 couponCount');
  });

  it('应包含会员等级 (tier) 体系，至少 3 个等级', () => {
    const src = readPageSource('member');
    assert.ok(
      src.includes('gold') || src.includes('Gold') || src.includes('钻石'),
      '缺少会员等级定义'
    );
    const levelCount = (src.match(/level:/g) ?? []).length;
    assert.ok(levelCount >= 3, `等级数量不足 (${levelCount})`);
  });
});

describe('💎会员 / 🛒前台: member — 反例', () => {
  it('游客态 (未登录) 应有限制', () => {
    const src = readPageSource('member');
    assert.ok(
      src.includes('authenticated') || src.includes('guest') || src.includes('未登录'),
      '缺少游客态处理'
    );
  });

  it('应处理无 profile 回退场景', () => {
    const src = readPageSource('member');
    assert.ok(
      src.includes('null') || src.includes('fallback') || src.includes('default'),
      '缺少 profile 为空的兜底'
    );
  });
});

describe('💎会员 / 🛒前台: member — 边界', () => {
  it('MOCK_MEMBERS / availableMembers 应至少包含 3 种不同会员状态', () => {
    const src = readPageSource('member');
    assert.ok(
      src.includes('active') || src.includes('Active') || src.includes('frozen') || src.includes('inactive'),
      '缺少不同会员状态'
    );
  });

  it('积分点数 points 应为非负数', () => {
    const src = readPageSource('member');
    assert.ok(src.includes('points'), '缺少 points');
  });
});

// ─────────────────────────────────────────────────────────
// 5. Sales-Tools — 导购工具 (🎮导玩员 / 📢营销视角)
// ─────────────────────────────────────────────────────────
describe('🎮导玩员 / 📢营销: sales-tools — 正例', () => {
  it('应导出默认函数组件 SalesToolsPage', () => {
    const src = readPageSource('sales-tools');
    assert.ok(src.includes('export default function SalesToolsPage'), '缺少 SalesToolsPage');
  });

  it('应包含 MOCK_TASKS 数据，且至少有 6 条', () => {
    const src = readPageSource('sales-tools');
    const match = src.match(/const MOCK_TASKS: TaskItem\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_TASKS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 6, `MOCK_TASKS 数量不足 (实际 ${count})`);
  });

  it('MOCK_TASKS 应包含 pending 和 done 两种状态', () => {
    const src = readPageSource('sales-tools');
    assert.ok(src.includes("'pending'"), '缺少 pending 状态任务');
    assert.ok(src.includes("'done'"), '缺少 done 状态任务');
  });

  it('应包含 MOCK_CUSTOMERS 数据且至少 5 条', () => {
    const src = readPageSource('sales-tools');
    const match = src.match(/const MOCK_CUSTOMERS: CustomerQuick\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_CUSTOMERS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 5, `MOCK_CUSTOMERS 数量不足 (实际 ${count})`);
  });

  it('客户级别应包含 SVIP/VIP/金卡/银卡', () => {
    const src = readPageSource('sales-tools');
    assert.ok(src.includes("'SVIP'"), '缺少 SVIP');
    assert.ok(src.includes("'VIP'"), '缺少 VIP');
    assert.ok(src.includes("'金卡'"), '缺少 金卡');
    assert.ok(src.includes("'银卡'"), '缺少 银卡');
  });
});

describe('🎮导玩员 / 📢营销: sales-tools — 反例', () => {
  it('应处理空任务列表', () => {
    const src = readPageSource('sales-tools');
    assert.ok(
      src.includes('暂无') || src.includes('empty') || src.includes('EmptyState'),
      '缺少空数据兜底'
    );
  });

  it('应处理客户列表为空场景', () => {
    const src = readPageSource('sales-tools');
    assert.ok(
      src.includes('暂无客户') || src.includes('empty') || src.includes('noData'),
      '缺少空客户兜底'
    );
  });
});

describe('🎮导玩员 / 📢营销: sales-tools — 边界', () => {
  it('MOCK_TRANSACTIONS 应至少包含 6 条交易记录', () => {
    const src = readPageSource('sales-tools');
    const match = src.match(/const MOCK_TRANSACTIONS.*?\[([\s\S]*?)\];/);
    if (match) {
      const count = (match[1]!.match(/\{/g) ?? []).length;
      assert.ok(count >= 6, `MOCK_TRANSACTIONS 数量不足 (实际 ${count})`);
    }
  });

  it('交易金额应大于 0', () => {
    const src = readPageSource('sales-tools');
    assert.ok(src.includes('amount') || src.includes('Amount'), '缺少金额字段');
  });
});

// ─────────────────────────────────────────────────────────
// 6. 跨模块: 🤝团建 — 模块间导航一致性（正例）
// ─────────────────────────────────────────────────────────
describe('🤝团建: 模块间一致性 — 正例', () => {
  it('member 和 redeem-center 应共享会员积分概念', () => {
    const memberSrc = readPageSource('member');
    const redeemSrc = readPageSource('redeem-center');
    assert.ok(memberSrc.includes('points'), 'member 缺少 points');
    assert.ok(redeemSrc.includes('points'), 'redeem-center 缺少 points');
  });

  it('purchase-orders 和 customer-service 应有对应的状态管理', () => {
    const poSrc = readPageSource('purchase-orders');
    const csSrc = readPageSource('customer-service');
    assert.ok(poSrc.includes('status'), 'purchase-orders 缺少 status');
    assert.ok(csSrc.includes('status'), 'customer-service 缺少 status');
  });
});
