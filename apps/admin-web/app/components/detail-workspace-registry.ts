import type { DetailClosureLink } from '@m5/ui';
import { buildAuditTrailHref } from '../audit-trail-view-model';

/**
 * 每个 workspace 详情页的"上下文元数据"，用于批量生成
 * WorkspaceBreadcrumb / DetailClosureBar 等导航组件。
 *
 * - href:        详情页所在 workspace 的工作台 URL
 * - breadcrumbLabel: WorkspaceBreadcrumb 的 workspace 段标签
 * - closureLabel:    DetailClosureBar 中"返回 XXX"链接的中文标签
 * - auditSource:     buildAuditTrailHref 的 source query
 * - hrefPrefix:      audit purpose 的前缀（默认 = href 的去前导 / 形式）
 */
export interface DetailWorkspaceMeta {
  /** href to the workspace overview page (e.g. "/brands"). */
  href: string;
  /** Workspace breadcrumb label (e.g. "品牌管理"). */
  breadcrumbLabel: string;
  /** Closure link label (e.g. "返回品牌管理"). */
  closureLabel: string;
  /** Audit source query, defaults to href without leading slash. */
  auditSource?: string;
}

export const DETAIL_WORKSPACE_REGISTRY: Record<string, DetailWorkspaceMeta> = {
  // ── 简单资源 ──────────────────────────────────────────────
  brands:         { href: '/brands',        breadcrumbLabel: '品牌管理', closureLabel: '返回品牌管理' },
  markets:        { href: '/markets',       breadcrumbLabel: '市场管理', closureLabel: '返回市场管理' },
  staff:          { href: '/staff',         breadcrumbLabel: '员工管理', closureLabel: '返回员工管理' },
  tenants:        { href: '/tenants',       breadcrumbLabel: '租户管理', closureLabel: '返回租户管理' },
  devices:        { href: '/devices',       breadcrumbLabel: '设备管理', closureLabel: '返回设备管理' },
  notifications:  { href: '/notifications', breadcrumbLabel: '通知中心', closureLabel: '返回通知中心' },
  coupons:        { href: '/coupons',       breadcrumbLabel: '优惠券管理', closureLabel: '返回优惠券列表' },
  stores:         { href: '/stores',        breadcrumbLabel: '门店管理', closureLabel: '返回门店管理' },
  members:        { href: '/members',       breadcrumbLabel: '会员管理', closureLabel: '返回会员管理' },
  approvals:      { href: '/approvals',     breadcrumbLabel: '治理审批', closureLabel: '返回审批工作台' },
  alerts:         { href: '/alerts',        breadcrumbLabel: '告警中心', closureLabel: '返回告警中心' },
  operations:     { href: '/operations',    breadcrumbLabel: '运营工作台', closureLabel: '返回运营工作台' },
  workbench:      { href: '/workbench',     breadcrumbLabel: '工作台管理', closureLabel: '返回工作台管理' },
  pad:            { href: '/pad',           breadcrumbLabel: '工作台管理', closureLabel: '返回工作台管理' },
  // ── 复合资源（audit source 不同于 href 第一段）─────────────
  'audit-trail':  { href: '/audit-trail',   breadcrumbLabel: '审计',       closureLabel: '返回审计日志' },
  'configuration':         { href: '/configuration',         breadcrumbLabel: '配置治理',     closureLabel: '返回配置治理' },
  'foundation':            { href: '/foundation',            breadcrumbLabel: 'Foundation', closureLabel: '返回底座中心' },
  'identity-access':       { href: '/identity-access',       breadcrumbLabel: '身份访问',   closureLabel: '返回身份访问中心' },
  'integration-orchestration': { href: '/integration-orchestration', breadcrumbLabel: '集成编排', closureLabel: '返回集成编排中心' },
  'rate-limits':           { href: '/rate-limits',           breadcrumbLabel: '限流与配额', closureLabel: '返回限流中心' },
  'resilience':            { href: '/resilience',            breadcrumbLabel: '强韧性作战', closureLabel: '返回韧性中心' },
  'suppliers':             { href: '/suppliers',             breadcrumbLabel: '供应商管理', closureLabel: '返回供应商管理' },
  'recommendations':       { href: '/recommendations',       breadcrumbLabel: '推荐策略',    closureLabel: '返回推荐策略列表' },
};

export function lookupWorkspaceMeta(workspace: string): DetailWorkspaceMeta | undefined {
  return DETAIL_WORKSPACE_REGISTRY[workspace];
}

export interface BuildStandardClosureLinksOptions {
  /** workspace 标识符，对应 DETAIL_WORKSPACE_REGISTRY 的 key。 */
  workspace: string;
  /** 详情 ID。 */
  detailId: string;
  /** 可选，自定义 closureLabel（默认从 registry 取）。 */
  closureLabel?: string;
  /**
   * 可选，注入额外的 closure link（用于子详情页插入"返回父详情"等）。
   * 插入位置在 workspace 和 audit 之间。
   */
  extraLinks?: DetailClosureLink[];
}

export interface BuildStandardBreadcrumbOptions {
  /** workspace 标识符。 */
  workspace: string;
  /** 详情标签（详情名 / ID）。 */
  detailLabel: string;
  /** 可选，自定义 breadcrumbLabel。 */
  breadcrumbLabel?: string;
}

/**
 * 一键生成单个详情页的标准 2-3 条 closure links：
 * - workspace（返回 workspace）
 * - extraLinks（注入的额外链接，比如"返回会员详情"）
 * - audit（审计日志，参数自动从 workspace / detailId 推出）
 */
export function buildStandardClosureLinks(
  options: BuildStandardClosureLinksOptions
): DetailClosureLink[] {
  const meta = lookupWorkspaceMeta(options.workspace);
  if (!meta) {
    throw new Error(`[buildStandardClosureLinks] Unknown workspace "${options.workspace}". Register it in DETAIL_WORKSPACE_REGISTRY first.`);
  }
  const auditSource = meta.auditSource ?? meta.href.replace(/^\//, '');
  const focus = `${auditSource}:${options.detailId}`;
  const links: DetailClosureLink[] = [
    {
      key: 'workspace',
      title: options.closureLabel ?? meta.closureLabel,
      subtitle: `回到 ${meta.breadcrumbLabel} 总览`,
      href: meta.href
    },
    ...(options.extraLinks ?? []),
    {
      key: 'audit',
      title: '审计日志',
      subtitle: `查看 ${focus} 在审计日志中的留痕`,
      context: focus,
      href: buildAuditTrailHref({ source: auditSource, purpose: focus })
    }
  ];
  return links;
}

/**
 * 一键生成单个详情页的 WorkspaceBreadcrumb props。
 * 调用方直接：
 *
 *   <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'brands', detailLabel: brand.name })} />
 */
export function buildStandardBreadcrumb(
  options: BuildStandardBreadcrumbOptions
): { workspaceLabel: string; workspaceHref: string; detailLabel: string } {
  const meta = lookupWorkspaceMeta(options.workspace);
  if (!meta) {
    throw new Error(`[buildStandardBreadcrumb] Unknown workspace "${options.workspace}". Register it in DETAIL_WORKSPACE_REGISTRY first.`);
  }
  return {
    workspaceLabel: options.breadcrumbLabel ?? meta.breadcrumbLabel,
    workspaceHref: meta.href,
    detailLabel: options.detailLabel
  };
}
