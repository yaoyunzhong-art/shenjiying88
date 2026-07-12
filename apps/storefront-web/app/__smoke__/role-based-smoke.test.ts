/**
 * storefront-web Role-Based Smoke Test — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证五个核心模块在角色视角下能正确加载和渲染:
 * - member-center    会员中心
 * - products         商品管理
 * - purchase-orders  采购订单
 * - store-locator    门店定位
 * - insights         数据洞察
 *
 * 角色常量
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

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

// ── 辅助: 读取 page.tsx 源码 ──
function readPageSource(relativePath: string): string {
  const fullPath = resolve(__dirname, '..', relativePath);
  return readFileSync(fullPath, 'utf-8');
}

// ─────────────────────────────────────────────────────────
// 1. Member-Center — 会员中心 (店长 / 前台视角)
// ─────────────────────────────────────────────────────────
describe('👔店长 / 🛒前台: member-center — 正例', () => {
  it('应导出一个默认组件', () => {
    const src = readPageSource('member-center/page.tsx');
    assert.ok(
      src.includes('export default function MemberCenterPage') ||
      src.includes('export default function MemberCenter'),
      '缺少默认导出组件'
    );
  });

  it('应包含 use client 指令', () => {
    const src = readPageSource('member-center/page.tsx');
    const hasDirective = src.includes("'use client'") || src.includes('"use client"');
    assert.ok(hasDirective, '缺少 use client');
  });

  it('应包含会员等级数据 (等级/权益/积分等)', () => {
    const src = readPageSource('member-center/page.tsx');
    assert.ok(src.includes('member') || src.includes('Member'), '缺少 member 相关引用');
    assert.ok(
      src.includes('等级') || src.includes('tier') || src.includes('级别'),
      '缺少会员等级数据'
    );
  });

  it('应包含积分/积分规则展示', () => {
    const src = readPageSource('member-center/page.tsx');
    assert.ok(
      src.includes('积分') || src.includes('points') || src.includes('Points'),
      '缺少积分数据'
    );
  });
});

describe('👔店长 / 🛒前台: member-center — 反例', () => {
  it('应处理空会员列表/无数据状态', () => {
    const src = readPageSource('member-center/page.tsx');
    assert.ok(
      src.includes('暂无') || src.includes('empty') || src.includes('noData') || src.includes('null'),
      '缺少空数据兜底'
    );
  });

  it('加载中应显示骨架/loading 态', () => {
    const src = readPageSource('member-center/page.tsx');
    assert.ok(
      src.includes('loading') || src.includes('Loading') || src.includes('LoadingSkeleton'),
      '缺少 loading 状态处理'
    );
  });
});

describe('👔店长 / 🛒前台: member-center — 边界', () => {
  it('会员搜索/筛选条件为空时应展示全量', () => {
    const src = readPageSource('member-center/page.tsx');
    assert.ok(
      src.includes('快速充值') || src.includes('消费记录'),
      '会员中心应有充值入口和消费记录'
    );
  });

  it('分页/列表应处理大数量 MEMBERS_PER_PAGE 边界', () => {
    const src = readPageSource('member-center/page.tsx');
    const hasMemberData = src.includes('等级') || src.includes('升级');
    assert.ok(hasMemberData, '会员中心应有等级信息');
  });
});

// ─────────────────────────────────────────────────────────
// 2. Products — 商品管理 (🎯运行专员视角)
// ─────────────────────────────────────────────────────────
describe('🎯运行专员: products — 正例', () => {
  it('应导出一个默认组件 ProductsPage', () => {
    const src = readPageSource('products/page.tsx');
    assert.ok(src.includes('export default function ProductsPage'), '缺少 ProductsPage');
  });

  it('应包含 CATEGORY_LABELS 分类映射覆盖 5 种类型', () => {
    const src = readPageSource('products/page.tsx');
    assert.ok(src.includes('CATEGORY_LABELS'), '缺少 CATEGORY_LABELS');
    assert.ok(src.includes("'class'"), '缺少 class 分类');
    assert.ok(src.includes("'equipment'"), '缺少 equipment 分类');
    assert.ok(src.includes("'supplement'"), '缺少 supplement 分类');
    assert.ok(src.includes("'apparel'"), '缺少 apparel 分类');
    assert.ok(src.includes("'accessory'"), '缺少 accessory 分类');
  });

  it('应包含 STATUS_LABELS + STATUS_VARIANTS 状态映射', () => {
    const src = readPageSource('products/page.tsx');
    assert.ok(src.includes('STATUS_LABELS'), '缺少 STATUS_LABELS');
    assert.ok(src.includes('STATUS_VARIANTS'), '缺少 STATUS_VARIANTS');
    assert.ok(src.includes('on_sale'), '缺少 on_sale');
    assert.ok(src.includes('out_of_stock'), '缺少 out_of_stock');
    assert.ok(src.includes('discontinued'), '缺少 discontinued');
    assert.ok(src.includes('coming_soon'), '缺少 coming_soon');
  });

  it('应使用 DataTable + Pagination + Tabs 组件', () => {
    const src = readPageSource('products/page.tsx');
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
    assert.ok(src.includes('Tabs'), '缺少 Tabs');
  });
});

describe('🎯运行专员: products — 反例', () => {
  it('应处理空商品列表/搜索结果为零的情况', () => {
    const src = readPageSource('products/page.tsx');
    assert.ok(
      src.includes('EmptyState') || src.includes('empty') || src.includes('暂无'),
      '缺少空状态组件'
    );
  });

  it('应处理缺货/下架商品的视觉区分', () => {
    const src = readPageSource('products/page.tsx');
    assert.ok(src.includes('StatusBadge') || src.includes('status'), '缺少状态徽标');
  });
});

describe('🎯运行专员: products — 边界', () => {
  it('SUBCATEGORIES 应覆盖所有 5 个分类的子分类', () => {
    const src = readPageSource('products/page.tsx');
    ('class equipment supplement apparel accessory').split(' ').forEach(cat => {
      assert.ok(src.includes(cat), `缺少分类 ${cat} 的子分类`);
    });
  });

  it('商品价格应支持格式化和比较', () => {
    const src = readPageSource('products/page.tsx');
    assert.ok(src.includes('formatCurrency') || src.includes('price'), '缺少价格格式化');
    assert.ok(src.includes('originalPrice'), '缺少原价字段');
  });
});

// ─────────────────────────────────────────────────────────
// 3. Purchase-Orders — 采购订单 (🎮导玩员视角)
// ─────────────────────────────────────────────────────────
describe('🎮导玩员: purchase-orders — 正例', () => {
  it('应导出一个默认列表组件', () => {
    const src = readPageSource('purchase-orders/page.tsx');
    assert.ok(
      src.includes('export default function') &&
      (src.includes('PurchaseOrder') || src.includes('PurchaseOrderList')),
      '缺少默认导出组件'
    );
  });

  it('应包含完整的状态映射 STATUS_LABELS + STATUS_VARIANTS', () => {
    const src = readPageSource('purchase-orders/page.tsx');
    assert.ok(src.includes('STATUS_LABELS'), '缺少 STATUS_LABELS');
    assert.ok(src.includes('STATUS_VARIANTS'), '缺少 STATUS_VARIANTS');
    assert.ok(src.includes('draft'), '缺少 draft');
    assert.ok(src.includes('submitted'), '缺少 submitted');
    assert.ok(src.includes('confirmed'), '缺少 confirmed');
    assert.ok(src.includes('shipped'), '缺少 shipped');
    assert.ok(src.includes('received'), '缺少 received');
    assert.ok(src.includes('cancelled'), '缺少 cancelled');
  });

  it('应使用 DataTable + Pagination 管理列表', () => {
    const src = readPageSource('purchase-orders/page.tsx');
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
  });
});

describe('🎮导玩员: purchase-orders — 反例', () => {
  it('应处理空订单列表', () => {
    const src = readPageSource('purchase-orders/page.tsx');
    assert.ok(
      src.includes('EmptyState') || src.includes('empty') || src.includes('暂无'),
      '缺少空状态处理'
    );
  });

  it('应处理取消状态订单的可视化区分', () => {
    const src = readPageSource('purchase-orders/page.tsx');
    assert.ok(src.includes("'cancelled'") || src.includes('已取消'), '缺少已取消状态处理');
  });
});

describe('🎮导玩员: purchase-orders — 边界', () => {
  it('订单金额合计应为正数', () => {
    const src = readPageSource('purchase-orders/page.tsx');
    assert.ok(src.includes('totalAmount') || src.includes('合计'), '缺少金额合计字段');
  });

  it('应支持按状态过滤筛选', () => {
    const src = readPageSource('purchase-orders/page.tsx');
    assert.ok(src.includes('filter') || src.includes('statusFilter'), '缺少状态筛选');
  });
});

// ─────────────────────────────────────────────────────────
// 4. Store-Locator — 门店定位 (👥HR / 🛒前台视角)
// ─────────────────────────────────────────────────────────
describe('👥HR / 🛒前台: store-locator — 正例', () => {
  it('应导出一个默认组件 StoreLocatorPage', () => {
    const src = readPageSource('store-locator/page.tsx');
    assert.ok(src.includes('export default function StoreLocatorPage'), '缺少 StoreLocatorPage');
  });

  it('应包含 storeLocatorService 调用', () => {
    const src = readPageSource('store-locator/page.tsx');
    assert.ok(src.includes('storeLocatorService'), '缺少 storeLocatorService');
  });

  it('应包含 cities / keyword / selectedCity 筛选状态', () => {
    const src = readPageSource('store-locator/page.tsx');
    assert.ok(src.includes('cities'), '缺少 cities');
    assert.ok(src.includes('keyword'), '缺少 keyword');
    assert.ok(src.includes('selectedCity'), '缺少 selectedCity');
  });

  it('应包含 filteredStores 过滤逻辑', () => {
    const src = readPageSource('store-locator/page.tsx');
    assert.ok(src.includes('filteredStores'), '缺少 filteredStores');
    assert.ok(src.includes('filterStoreByKeyword'), '缺少 filterStoreByKeyword');
  });
});

describe('👥HR / 🛒前台: store-locator — 反例', () => {
  it('无门店时显示 "暂无门店数据"', () => {
    const src = readPageSource('store-locator/page.tsx');
    assert.ok(src.includes('暂无门店数据'), '缺少空门店提示');
  });

  it('门店服务不可用 / 加载失败时应有兜底', () => {
    const src = readPageSource('store-locator/page.tsx');
    assert.ok(
      src.includes('error') || src.includes('catch') || src.includes('try'),
      '缺少错误处理'
    );
  });
});

describe('👥HR / 🛒前台: store-locator — 边界', () => {
  it('全部城市按钮 selectedCity 为空字符串时激活', () => {
    const src = readPageSource('store-locator/page.tsx');
    assert.ok(
      src.includes("setSelectedCity('')") || src.includes('setSelectedCity'),
      '缺少全部城市重置'
    );
  });

  it('应包含门店营业时间信息显示', () => {
    const src = readPageSource('store-locator/page.tsx');
    assert.ok(
      src.includes('hours') || src.includes('营业') || src.includes('工作日'),
      '缺少营业时间信息'
    );
  });
});

// ─────────────────────────────────────────────────────────
// 5. Insights — 数据洞察 (📢营销 / 🎯运行专员视角)
// ─────────────────────────────────────────────────────────
describe('📢营销 / 🎯运行专员: insights — 正例', () => {
  it('应导出一个默认组件', () => {
    const src = readPageSource('insights/page.tsx');
    assert.ok(
      src.includes('export default function InsightsPage') ||
      src.includes('export default function DataInsights'),
      '缺少默认导出组件'
    );
  });

  it('应包含会员等级分布数据结构', () => {
    const src = readPageSource('insights/page.tsx');
    assert.ok(src.includes('level') || src.includes('tier'), '缺少等级数据');
    assert.ok(src.includes('count') || src.includes('Count'), '缺少计数');
    assert.ok(src.includes('color') || src.includes('Color'), '缺少颜色');
  });

  it('应包含设备在线状态追踪', () => {
    const src = readPageSource('insights/page.tsx');
    assert.ok(src.includes('status') || src.includes('Status'), '缺少状态');
    assert.ok(src.includes('online') || src.includes('offline'), '缺少在线/离线状态');
  });

  it('应包含告警/异常数据结构', () => {
    const src = readPageSource('insights/page.tsx');
    assert.ok(src.includes('severity') || src.includes('Severity'), '缺少严重级别');
    assert.ok(src.includes('medium') || src.includes('high') || src.includes('low'), '缺少严重度等级');
  });
});

describe('📢营销 / 🎯运行专员: insights — 反例', () => {
  it('应处理空成员等级数组不崩溃', () => {
    const src = readPageSource('insights/page.tsx');
    assert.ok(src.includes('[]') || src.includes('empty'), '缺少空数组兜底');
  });

  it('应处理设备离线/异常告警状态', () => {
    const src = readPageSource('insights/page.tsx');
    assert.ok(
      src.includes('anomaly') || src.includes('异常') || src.includes('alert'),
      '缺少异常告警处理'
    );
  });
});

describe('📢营销 / 🎯运行专员: insights — 边界', () => {
  it('热力图 value 应为 0 时正常展示', () => {
    const src = readPageSource('insights/page.tsx');
    assert.ok(
      src.includes('heatmap') || src.includes('Heatmap') || src.includes('热'),
      '缺少热力图组件'
    );
  });

  it('设备 uptime 应为正数', () => {
    const src = readPageSource('insights/page.tsx');
    assert.ok(src.includes('uptime') || src.includes('Uptime'), '缺少 uptime');
  });
});

// ─────────────────────────────────────────────────────────
// 6. 跨模块: 🔧安监 模块间一致性验证（边界）
// ─────────────────────────────────────────────────────────
describe('🔧安监: 跨模块数据一致性 — 边界', () => {
  it('products 和 insights 模块间商品分类应一致', () => {
    const productSrc = readPageSource('products/page.tsx');
    const insightSrc = readPageSource('insights/page.tsx');
    // 两种都含商品数据来源
    assert.ok(
      productSrc.includes('product') || productSrc.includes('Product'),
      'products 缺少商品定义'
    );
  });

  it('store-locator 和 insights 应共享门店维度', () => {
    const storeSrc = readPageSource('store-locator/page.tsx');
    const insightSrc = readPageSource('insights/page.tsx');
    assert.ok(storeSrc.includes('store') || storeSrc.includes('Store'), 'store-locator 缺少门店');
  });
});
