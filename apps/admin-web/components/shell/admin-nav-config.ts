/**
 * 🎨 AdminShell — 全局管理导航配置
 * E55 UX 升级: 84 页面按管理逻辑分组
 */
import type { SideNavItem } from '@m5/ui';

export const ADMIN_NAV_ITEMS: SideNavItem[] = [
  {
    key: 'dashboard',
    label: '指挥台',
    icon: '🏠',
    href: '/',
  },
  {
    key: 'operations',
    label: '门店运营',
    icon: '🏪',
    children: [
      { key: 'workbench', label: '角色工作台', href: '/workbench' },
      { key: 'dashboard-store', label: '门店仪表盘', href: '/dashboard' },
      { key: 'stores', label: '门店管理', href: '/stores' },
      { key: 'staff', label: '员工管理', href: '/staff' },
      { key: 'equipment', label: '设备管理', href: '/equipment' },
      { key: 'devices', label: '设备监控', href: '/devices' },
      { key: 'stock', label: '库存管理', href: '/stock' },
      { key: 'stock-operations', label: '库存操作', href: '/stock-operations' },
      { key: 'stock-transfer', label: '库存调拨', href: '/stock-transfer' },
      { key: 'brand-operations', label: '品牌运营', href: '/brand-operations' },
      { key: 'crm', label: '客户关系', href: '/crm' },
    ],
  },
  {
    key: 'commerce',
    label: '交易管理',
    icon: '💰',
    children: [
      { key: 'orders', label: '订单管理', href: '/orders' },
      { key: 'products', label: '商品管理', href: '/products' },
      { key: 'categories', label: '商品分类', href: '/categories' },
      { key: 'payment-channels', label: '支付通道', href: '/payment-channels' },
      { key: 'refunds', label: '退款管理', href: '/refunds' },
      { key: 'returns', label: '退货管理', href: '/returns' },
      { key: 'coupons', label: '优惠券', href: '/coupons' },
      { key: 'coupon-templates', label: '券模板', href: '/coupon-templates' },
      { key: 'campaigns', label: '活动管理', href: '/campaigns' },
      { key: 'campaign-rules', label: '活动规则', href: '/campaign-rules' },
      { key: 'points-rules', label: '积分规则', href: '/points-rules' },
    ],
  },
  {
    key: 'members',
    label: '会员管理',
    icon: '👥',
    children: [
      { key: 'users', label: '用户管理', href: '/users' },
      { key: 'customers', label: '客户列表', href: '/customers' },
      { key: 'customer-tags', label: '客户标签', href: '/customer-tags' },
      { key: 'tags', label: '标签管理', href: '/tags' },
      { key: 'tenants', label: '租户管理', href: '/tenants' },
      { key: 'membership-tiers', label: '会员等级', href: '/members/tiers' },
    ],
  },
  {
    key: 'content',
    label: '内容营销',
    icon: '📢',
    children: [
      { key: 'announcements', label: '公告管理', href: '/announcements' },
      { key: 'notifications', label: '消息通知', href: '/notifications' },
      { key: 'recommendations', label: '智能推荐', href: '/recommendations' },
      { key: 'feedback', label: '用户反馈', href: '/feedback' },
      { key: 'seo', label: 'SEO 管理', href: '/seo' },
      { key: 'help-center', label: '帮助中心', href: '/help-center' },
    ],
  },
  {
    key: 'fin-supply',
    label: '财务供应链',
    icon: '📊',
    children: [
      { key: 'finance', label: '财务管理', href: '/finance' },
      { key: 'reports', label: '数据报表', href: '/reports' },
      { key: 'analytics', label: '数据分析', href: '/analytics' },
      { key: 'analytics-v2', label: '分析 v2', href: '/analytics-v2' },
      { key: 'suppliers', label: '供应商管理', href: '/suppliers' },
      { key: 'procurement', label: '采购管理', href: '/procurement' },
      { key: 'purchase-orders', label: '采购订单', href: '/purchase-orders' },
      { key: 'contracts', label: '合同管理', href: '/contracts' },
    ],
  },
  {
    key: 'governance',
    label: '平台治理',
    icon: '🛡️',
    children: [
      { key: 'approvals', label: '审批管理', href: '/approvals' },
      { key: 'audit-logs', label: '操作日志', href: '/audit-logs' },
      { key: 'audit-trail', label: '审计追踪', href: '/audit-trail' },
      { key: 'identity-access', label: '身份访问', href: '/identity-access' },
      { key: 'safety', label: '安全管理', href: '/safety' },
      { key: 'rate-limits', label: '限流配置', href: '/rate-limits' },
      { key: 'fire-prevention', label: '防火管理', href: '/fire-prevention' },
      { key: 'foundation', label: '基础设施', href: '/foundation' },
      { key: 'configuration', label: '系统配置', href: '/configuration' },
      { key: 'settings', label: '设置中心', href: '/settings' },
      { key: 'system-monitor', label: '系统监控', href: '/system-monitor' },
      { key: 'resilience', label: '韧性管理', href: '/resilience' },
    ],
  },
  {
    key: 'ai',
    label: 'AI 智能',
    icon: '🤖',
    children: [
      { key: 'agents', label: 'AI 代理', href: '/agents' },
      { key: 'ai-decision', label: 'AI 决策', href: '/ai-decision' },
      { key: 'ai-scenario-simulator', label: '情景模拟', href: '/ai-scenario-simulator' },
      { key: 'ai-cs', label: 'AI 客服', href: '/ai-cs' },
      { key: 'anomaly-frequency', label: '异常检测', href: '/anomaly-frequency' },
      { key: 'competitor-track', label: '竞品追踪', href: '/competitor-track' },
    ],
  },
  {
    key: 'misc',
    label: '更多工具',
    icon: '🔧',
    children: [
      { key: 'team-building', label: '团建管理', href: '/team-building' },
      { key: 'training', label: '培训管理', href: '/training' },
      { key: 'brands', label: '品牌管理', href: '/brands' },
      { key: 'alliances', label: '联盟管理', href: '/alliances' },
      { key: 'pad', label: 'PAD 管理', href: '/pad' },
      { key: 'dev-tools', label: '开发工具', href: '/dev-tools' },
      { key: 'alerts', label: '告警查看', href: '/alerts' },
      { key: 'rules', label: '规则引擎', href: '/rules' },
    ],
  },
];

/** 扁平化所有路由，用于 CommandPalette 搜索 */
export function flattenNavItems(items: SideNavItem[]): Array<{ id: string; label: string; href: string; group: string }> {
  const flat: Array<{ id: string; label: string; href: string; group: string }> = [];
  function walk(list: SideNavItem[], parentGroup?: string) {
    for (const item of list) {
      if (item.href) {
        flat.push({ id: item.key, label: item.label, href: item.href, group: parentGroup ?? item.label });
      }
      if (item.children) {
        walk(item.children, item.label);
      }
    }
  }
  walk(items);
  return flat;
}
