import * as React from 'react';
import React__default, { InputHTMLAttributes } from 'react';
import { FoundationAlertTimelineFilterState, FoundationAlertCode, FoundationAlertTimelineEntry, FoundationAlertDrilldownResponse, FoundationAlertCatalogItem, FoundationOperationsAlert, FoundationAlertMutationKind, FoundationAlertRuntimeCallbackStalledDetail, FoundationAlertTimelineMetrics as FoundationAlertTimelineMetrics$1, FoundationAlertTimelineDigest } from '@m5/types';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'danger' | 'info' | 'neutral' | 'purple';
type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
type BadgeSize = 'sm' | 'md' | 'lg';
interface BadgeProps {
    /** The content to display inside the badge (number, text, dot indicator) */
    children?: React__default.ReactNode;
    /** Color variant */
    variant?: BadgeVariant;
    /** Size */
    size?: BadgeSize;
    /** Placement relative to the wrapping element */
    placement?: BadgePlacement;
    /** Whether to show as a dot (no children displayed) */
    dot?: boolean;
    /** Max count to display (e.g. 99+), only for numeric children */
    overflowCount?: number;
    /** Whether the badge is visible */
    visible?: boolean;
    /** Offset adjustment from default position, e.g. { x: 2, y: -2 } */
    offset?: {
        x?: number;
        y?: number;
    };
    /** Show badge as standalone (not overlapping) */
    standalone?: boolean;
    /** Optional className for the wrapper */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * Badge — a numeric indicator, status dot, or content badge typically
 * overlaid on another UI element.
 *
 * - `dot`: renders a small colored circle without content
 * - `overflowCount`: clamps displayed number, e.g. overflowCount=99 renders "99+"
 * - `standalone`: renders as a normal inline element without absolute positioning
 */
declare function Badge({ children, variant, size, placement, dot, overflowCount, visible, offset, standalone, className, 'data-testid': dataTestId, }: BadgeProps): React__default.JSX.Element | null;

interface DescriptionItem {
    label: string;
    value?: React__default.ReactNode;
    /** render prop when value needs special formatting */
    render?: () => React__default.ReactNode;
    /** span across multiple columns (1-4) */
    span?: number;
}
interface DescriptionListProps {
    items: DescriptionItem[];
    /** columns count: 1 | 2 | 3 | 4 (default: 2) */
    columns?: 1 | 2 | 3 | 4;
    /** layout direction */
    layout?: 'horizontal' | 'vertical';
    /** size preset */
    size?: 'default' | 'compact';
    /** title above the list */
    title?: string;
    /** optional className for the wrapper */
    className?: string;
}
declare function DescriptionList({ items, columns, layout, size, title, className, }: DescriptionListProps): React__default.JSX.Element;

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarStatus = 'online' | 'offline' | 'busy' | 'away' | 'none';
interface AvatarProps {
    /** Image source URL. If provided and loads, it takes precedence over initials. */
    src?: string;
    /** Fallback initials when no image or image fails to load (max 2 chars shown). */
    initials?: string;
    /** Alt text for the image. */
    alt?: string;
    /** Size variant. */
    size?: AvatarSize;
    /** Status indicator dot. */
    status?: AvatarStatus;
    /** Custom background color for initials fallback. */
    bgColor?: string;
    /** Custom text color for initials fallback. */
    textColor?: string;
    /** Click handler. */
    onClick?: () => void;
    /** Optional className for external styling. */
    className?: string;
    /** Optional style overrides. */
    style?: React__default.CSSProperties;
}
declare function Avatar({ src, initials, alt, size, status, bgColor, textColor, onClick, className, style, }: AvatarProps): React__default.JSX.Element;
interface AvatarGroupProps {
    children: React__default.ReactNode;
    /** Max visible avatars before showing +N overflow badge. */
    max?: number;
    /** Spacing between stacked avatars (negative margin). */
    spacing?: number;
}
declare function AvatarGroup({ children, max, spacing }: AvatarGroupProps): React__default.JSX.Element;

interface BatchAction<T = string> {
    /** Unique action key */
    key: T;
    /** Display label */
    label: string;
    /** Optional icon (render before label) */
    icon?: React__default.ReactNode;
    /** Visual variant */
    variant?: 'primary' | 'danger' | 'default' | 'outline';
    /** Whether this action requires confirmation before execution */
    requireConfirm?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Tooltip / aria description */
    description?: string;
}
interface BatchSelectionBarProps<T = string> {
    /** Number of selected items */
    selectedCount: number;
    /** Total items (used to show "All N selected") */
    totalCount?: number;
    /** Human-readable item label, e.g. "orders", "users" */
    itemLabel?: string;
    /** Available batch actions */
    actions: BatchAction<T>[];
    /** Called when an action is invoked */
    onAction: (actionKey: T) => void;
    /** Called when user clicks "Clear selection" */
    onClearSelection: () => void;
    /** Custom test id */
    'data-testid'?: string;
}
declare function BatchSelectionBar<T extends string = string>({ selectedCount, totalCount, itemLabel, actions, onAction, onClearSelection, 'data-testid': testId, }: BatchSelectionBarProps<T>): React__default.JSX.Element | null;

interface AccordionItem {
    key: string;
    title: string;
    content: React__default.ReactNode;
    disabled?: boolean;
    subtitle?: string;
}
interface AccordionProps {
    items: AccordionItem[];
    /** Allow multiple items to be open simultaneously */
    multiple?: boolean;
    /** Default expanded item keys */
    defaultExpanded?: string[];
    /** Controlled expanded keys */
    expanded?: string[];
    /** Change handler for controlled mode */
    onExpandedChange?: (keys: string[]) => void;
    /** Visual variant */
    variant?: 'default' | 'bordered' | 'minimal';
    /** Size */
    size?: 'sm' | 'md';
}
declare function Accordion({ items, multiple, defaultExpanded, expanded: controlledExpanded, onExpandedChange, variant, size, }: AccordionProps): React__default.JSX.Element | null;

interface BreadcrumbItem {
    /** Display label */
    label: string;
    /** Optional href — turns item into a link */
    href?: string;
    /** Optional click handler */
    onClick?: () => void;
}
interface BreadcrumbProps {
    /** Ordered list of breadcrumb segments */
    items: BreadcrumbItem[];
    /** Custom separator (default '/') */
    separator?: React__default.ReactNode;
    /** Maximum items before collapsing to ellipsis */
    maxItems?: number;
    /** Test id for the nav wrapper */
    'data-testid'?: string;
}
declare function Breadcrumb({ items, separator, maxItems, 'data-testid': testId, }: BreadcrumbProps): React__default.JSX.Element | null;

/** 日历日期标记 */
interface CalendarMarker {
    /** 日期 (ISO 日期字符串 YYYY-MM-DD) */
    date: string;
    /** 标记类型 */
    type?: 'dot' | 'badge' | 'highlight';
    /** 标记文案 (badge 类型时显示) */
    label?: string;
    /** 颜色 */
    color?: string;
}
/** 日历组件 Props */
interface CalendarProps {
    /** 当前选中日期 (受控) */
    value?: Date | null;
    /** 默认选中日期 */
    defaultValue?: Date | null;
    /** 日期改变回调 */
    onChange?: (date: Date) => void;
    /** 月份改变回调 */
    onMonthChange?: (year: number, month: number) => void;
    /** 日期标记（如排班、告警、事件） */
    markers?: CalendarMarker[];
    /** 最小可选日期 */
    minDate?: Date;
    /** 最大可选日期 */
    maxDate?: Date;
    /** 自定义类名 */
    className?: string;
    /** 星期标题（支持国际化） */
    weekDayLabels?: string[];
    /** 月份名称（支持国际化） */
    monthLabels?: string[];
    /** 禁用周末选择 */
    disableWeekends?: boolean;
    /** 自定义日期禁用判断 */
    isDateDisabled?: (date: Date) => boolean;
    /** 自定义日期渲染 */
    renderDate?: (date: Date, isSelected: boolean, isToday: boolean) => React__default.ReactNode;
}
/**
 * Calendar — 日历日期选择组件。
 *
 * 以月视图展示日期网格，支持：
 * - 日期选择（受控/非受控）
 * - 月份导航
 * - 日期标记（dot / badge / highlight）
 * - 最小/最大日期限制
 * - 周末禁用
 * - 自定义日期禁用
 * - 国际化（星期标题、月份名称）
 *
 * 使用纯 CSS + React 实现，零外部依赖。
 *
 * @example
 * // 基础日历
 * <Calendar
 *   defaultValue={new Date()}
 *   onChange={(d) => console.log(d)}
 * />
 *
 * @example
 * // 带标记的日历（排班/告警事件）
 * <Calendar
 *   markers={[
 *     { date: '2026-06-15', type: 'dot', color: '#ef4444' },
 *     { date: '2026-06-20', type: 'badge', label: '巡检', color: '#f59e0b' },
 *   ]}
 *   onChange={(d) => setSelected(d)}
 * />
 */
declare function Calendar({ value, defaultValue, onChange, onMonthChange, markers, minDate, maxDate, className, weekDayLabels, monthLabels, disableWeekends, isDateDisabled, renderDate, }: CalendarProps): React__default.JSX.Element;

interface CarouselSlide {
    key: string;
    content: React__default.ReactNode;
    /** Optional aria label for the slide */
    label?: string;
}
interface CarouselProps {
    slides: CarouselSlide[];
    /** Auto-play interval in ms. 0 disables auto-play. */
    autoPlay?: number;
    /** Show navigation arrows */
    showArrows?: boolean;
    /** Show dot indicators */
    showDots?: boolean;
    /** Infinite loop */
    loop?: boolean;
    /** Number of slides visible at once */
    slidesPerView?: number;
    /** Gap between slides in px */
    gap?: number;
    /** Aspect ratio, e.g. '16/9', '4/3', '1/1' */
    aspectRatio?: string;
    /** Visual variant */
    variant?: 'default' | 'fade' | 'card';
    /** Height in px (overrides aspectRatio) */
    height?: number;
    /** Aria label for the carousel */
    ariaLabel?: string;
}
declare function Carousel({ slides, autoPlay, showArrows, showDots, loop, slidesPerView, gap, aspectRatio, variant, height, ariaLabel, }: CarouselProps): React__default.JSX.Element | null;

interface WorkspaceBreadcrumbSegment {
    label: string;
    href?: string;
}
interface WorkspaceBreadcrumbProps {
    /** Root label, defaults to '总览'. */
    homeLabel?: string;
    /** Optional href for the home / root segment. */
    homeHref?: string;
    /** The current workspace label (e.g. 'configuration'). */
    workspaceLabel: string;
    /** The href to navigate back to the workspace. */
    workspaceHref: string;
    /** Optional intermediate segment for context (e.g. '详情'). */
    intermediateLabel?: string;
    /** The label for the current detail page (the final breadcrumb). */
    detailLabel: string;
    /** Optional extra segments inserted between workspace and detail. */
    extraSegments?: WorkspaceBreadcrumbSegment[];
}
/**
 * WorkspaceBreadcrumb renders the canonical three-tier closure breadcrumb:
 *   Home > Workspace > Detail
 *
 * It is a thin wrapper over the shared Breadcrumb component so every detail
 * page in the admin workbench can adopt the same navigation pattern without
 * each page hand-rolling its own <Breadcrumb items=...> setup.
 */
declare function WorkspaceBreadcrumb({ homeLabel, homeHref, workspaceLabel, workspaceHref, intermediateLabel, detailLabel, extraSegments }: WorkspaceBreadcrumbProps): React__default.JSX.Element;

interface DetailClosureLink {
    /** Stable key used for React keys and test selectors. */
    key: string;
    /** Card title. */
    title: string;
    /** Short caption under the title, e.g. an audit purpose or href purpose. */
    subtitle: string;
    /** Optional second-line caption for context (e.g. moduleKey). */
    context?: string;
    /** Href for the link card. */
    href: string;
    /** Visual variant — defaults to 'default'. */
    variant?: 'default' | 'warning' | 'danger';
    /** Optional aria-label override for screen readers. */
    ariaLabel?: string;
}
interface DetailClosureBarProps {
    /** Links to render in the closure grid. */
    links: DetailClosureLink[];
    /** Optional section heading rendered above the cards. */
    heading?: string;
    /** Optional caption describing what this grid represents. */
    caption?: string;
    /** Test id for the wrapper. */
    'data-testid'?: string;
}
/**
 * DetailClosureBar renders the standard three-tier closure footer used by
 * every detail page in the admin workbench.
 *
 *   workspace → detail → action
 *
 * Each card represents a deep link (audit / foundation / workspace /
 * approvals / custom). The grid is responsive and adapts to the existing
 * deep-link card style used by the 7 detail-page batches.
 */
declare function DetailClosureBar({ links, heading, caption, 'data-testid': testId }: DetailClosureBarProps): React__default.JSX.Element | null;

type ToastVariant = 'success' | 'error' | 'warning' | 'info';
interface ToastEntry {
    id: string;
    message: string;
    variant: ToastVariant;
    durationMs: number;
    createdAt: number;
}
interface ToastOptions {
    /** 通知类型 */
    variant?: ToastVariant;
    /** 自动消失时长 ms（0 表示不自动消失） */
    durationMs?: number;
}
interface ToastContainerProps {
    toasts: ToastEntry[];
    onDismiss: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    maxVisible?: number;
}
declare function ToastContainer({ toasts, onDismiss, position, maxVisible, }: ToastContainerProps): React__default.JSX.Element;
interface UseToastReturn {
    /** 当前活跃的通知列表 */
    toasts: ToastEntry[];
    /** 显示成功通知 */
    success: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    /** 显示错误通知 */
    error: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    /** 显示警告通知 */
    warning: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    /** 显示信息通知 */
    info: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    /** 显示自定义变体通知 */
    toast: (message: string, options?: ToastOptions) => void;
    /** 手动关闭指定通知 */
    dismiss: (id: string) => void;
    /** 手动关闭所有通知 */
    dismissAll: () => void;
}
declare function useToast(): UseToastReturn;

type DetailActionBarIcon = 'copy' | 'export' | 'share' | 'print' | 'download' | 'link';
interface DetailActionBarAction {
    /** Stable key used for React keys and test selectors. */
    key: string;
    /** Button label. */
    label: string;
    /** Click handler — may be async. */
    onClick: () => void | Promise<void>;
    /** Optional icon name; 'custom' is allowed for callers that inject their own. */
    icon?: DetailActionBarIcon;
    /** Visual variant — defaults to 'default'. */
    variant?: 'default' | 'primary' | 'danger';
    /** Optional description (used as aria-label and tooltip). */
    description?: string;
    /** Disabled state. */
    disabled?: boolean;
    /**
     * Optional toast feedback. When the click resolves successfully, the
     * success message (or default `已复制`/`已导出`/etc.) is shown; when it
     * rejects, the error message is shown.
     */
    successToast?: ToastOptions & {
        message?: string;
    };
    errorToast?: ToastOptions & {
        message?: string;
    };
}
interface DetailActionBarProps {
    /** List of actions rendered as buttons in order. */
    actions: DetailActionBarAction[];
    /** Optional section heading. */
    heading?: string;
    /** Optional caption describing the bar. */
    caption?: string;
    /** Test id for the wrapper. */
    'data-testid'?: string;
    /**
     * When false, the bar does not render a toast container or surface
     * success/error feedback. Default is true. SSR callers can opt out so
     * the bar renders in static HTML without needing the ToastContainer.
     */
    showToast?: boolean;
}
/**
 * DetailActionBar renders the standard "收口动作" footer for every detail
 * page in the admin workbench.
 *
 * Unlike DetailClosureBar (which renders deep-link cards), this bar renders
 * actionable buttons (copy link, export JSON, share, print, etc.). Each
 * caller provides its own `onClick` handlers, so the bar stays a thin
 * presentation component.
 *
 * The bar is SSR-friendly: it renders buttons with attached onClick
 * handlers without executing any side effects during render. Each button
 * tracks its own busy state and is disabled while a handler is in flight.
 *
 * When `showToast` is true (default), successful actions show a success
 * toast and failed actions show an error toast using the shared
 * useToast hook.
 */
declare function DetailActionBar({ actions, heading, caption, 'data-testid': testId, showToast }: DetailActionBarProps): React__default.JSX.Element | null;

interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}
type ChartType = 'bar' | 'line' | 'donut';
interface ChartProps {
    /** 图表类型 */
    type: ChartType;
    /** 数据点 */
    data: ChartDataPoint[];
    /** 图表宽度 */
    width?: number;
    /** 图表高度 */
    height?: number;
    /** 标题 */
    title?: string;
    /** 是否显示数值标签 */
    showValues?: boolean;
    /** 自定义颜色调色板 */
    palette?: string[];
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
}
/**
 * Chart — 通用数据可视化组件。
 *
 * 支持三种图表类型：
 * - `bar`: 柱状图，适合对比分类数据
 * - `line`: 折线图，适合展示趋势变化
 * - `donut`: 环形图，适合展示占比分布
 *
 * 使用纯 SVG 实现，零外部依赖，支持动画。
 *
 * @example
 * // 柱状图
 * <Chart
 *   type="bar"
 *   data={[
 *     { label: 'Q1', value: 120 },
 *     { label: 'Q2', value: 200 },
 *   ]}
 *   title="季度营收"
 *   showValues
 * />
 *
 * @example
 * // 环形图
 * <Chart
 *   type="donut"
 *   data={[
 *     { label: '黄金', value: 450 },
 *     { label: '白银', value: 320 },
 *     { label: '青铜', value: 180 },
 *   ]}
 *   title="会员等级分布"
 * />
 */
declare function Chart({ type, data, width, height, title, showValues, palette, className, emptyText, }: ChartProps): React__default.JSX.Element;

/** 仪表盘颜色段定义 */
interface GaugeSegment {
    /** 段起始值 (0-100) */
    from: number;
    /** 段结束值 (0-100) */
    to: number;
    /** 段颜色 */
    color: string;
    /** 段标签 */
    label?: string;
}
interface GaugeChartProps {
    /** 当前值 (0-100) */
    value: number;
    /** 最小值，默认 0 */
    min?: number;
    /** 最大值，默认 100 */
    max?: number;
    /** 仪表盘标签 */
    label?: string;
    /** 底部显示的值后缀，如 % */
    suffix?: string;
    /** 颜色段定义 */
    segments?: GaugeSegment[];
    /** 仪表盘直径 (px)，默认 160 */
    size?: number;
    /** (兼容别名) 宽度，映射到 size */
    width?: number;
    /** (兼容别名) 高度，不影响渲染 */
    height?: number;
    /** 弧线宽度 (px)，默认 18 */
    arcWidth?: number;
    /** 是否显示刻度标签 */
    showTicks?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
}
declare function GaugeChart({ value, min, max, label, suffix, segments, size: _size, width: _width, height: _height, arcWidth, showTicks, className, style, }: GaugeChartProps): React__default.JSX.Element;

/** 规则执行结果状态 */
type RuleExecutionStatus = 'passed' | 'failed' | 'warning' | 'pending';
/** 单条规则执行结果 */
interface RuleExecutionResult {
    /** 规则 ID */
    id: string;
    /** 规则名称 */
    name: string;
    /** 规则描述 */
    description?: string;
    /** 执行状态 */
    status: RuleExecutionStatus;
    /** 匹配数据条数 */
    matchedCount?: number;
    /** 执行耗时(ms) */
    durationMs?: number;
    /** 详情/建议 */
    suggestion?: string;
    /** 执行时间戳 */
    executedAt?: string;
}
/** 规则执行汇总统计 */
interface RuleExecutionSummary {
    total: number;
    passed: number;
    failed: number;
    warning: number;
    pending: number;
    /** 数据覆盖率 */
    coveragePercent?: number;
    /** 上一轮对比变化 */
    delta?: number;
}
/** AI 决策面板 Props */
interface AIDecisionPanelProps {
    /** 规则执行结果列表 */
    rules: RuleExecutionResult[];
    /** 汇总统计 */
    summary?: RuleExecutionSummary;
    /** 面板标题 */
    title?: string;
    /** 面板副标题 */
    subtitle?: string;
    /** 是否显示详情展开 */
    expandable?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 规则点击回调 */
    onRuleClick?: (rule: RuleExecutionResult) => void;
    /** 是否紧凑模式 */
    compact?: boolean;
}
/**
 * AIDecisionPanel — AI 规则决策面板。
 *
 * 展示 AI 规则引擎的执行结果，包括：
 * - 汇总统计（通过率/覆盖率/趋势变化）
 * - 逐条规则结果（状态/匹配数/耗时/建议）
 * - 视觉化进度条
 *
 * 适用于治理告警、质量检测、风控规则等场景。
 *
 * @example
 * // 基础用法
 * <AIDecisionPanel
 *   title="质量检测规则执行结果"
 *   rules={[
 *     { id: '1', name: '价格合规检查', status: 'passed', matchedCount: 1280 },
 *     { id: '2', name: '库存异常检测', status: 'failed', matchedCount: 3, suggestion: '3个SKU库存为负' },
 *   ]}
 *   summary={{ total: 10, passed: 7, failed: 2, warning: 1, pending: 0 }}
 * />
 *
 * @example
 * // 紧凑模式 + 点击交互
 * <AIDecisionPanel
 *   title="实时风控"
 *   rules={rules}
 *   compact
 *   onRuleClick={(rule) => navigate(`/rule/${rule.id}`)}
 * />
 */
declare function AIDecisionPanel({ rules, summary, title, subtitle, expandable, className, emptyText, onRuleClick, compact, }: AIDecisionPanelProps): React__default.JSX.Element;

/** 热力图单元格 */
interface HeatmapCell {
    /** 行标签（如设备ID / 会员等级） */
    rowLabel: string;
    /** 列标签（如时间段 / 指标名称） */
    colLabel: string;
    /** 数值 */
    value: number;
    /** 自定义颜色覆盖 */
    color?: string;
}
/** 热力图颜色方案 */
type HeatmapColorScheme = 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cool';
/** 热力图组件 Props */
interface HeatmapChartProps {
    /** 数据矩阵 */
    data: HeatmapCell[];
    /** 行标签列表 */
    rowLabels?: string[];
    /** 列标签列表 */
    colLabels?: string[];
    /** 图表宽度 */
    width?: number;
    /** 图表高度 */
    height?: number;
    /** 标题 */
    title?: string;
    /** 颜色方案 */
    colorScheme?: HeatmapColorScheme;
    /** 是否显示数值标签 */
    showValues?: boolean;
    /** 是否显示图例 */
    showLegend?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 单元格点击回调 */
    onCellClick?: (cell: HeatmapCell) => void;
}
/**
 * HeatmapChart — 热力图数据可视化组件。
 *
 * 以矩阵色块方式展示二维数据分布密度，适用于：
 * - 设备状态热力图（设备 x 时间段）
 * - 会员等级分布（等级 x 地区/门店）
 * - 告警热度分布（告警类型 x 时间窗）
 * - 销售热力分布（商品 x 时段）
 *
 * 使用纯 SVG 实现，零外部依赖，支持动画。
 *
 * @example
 * // 设备状态热力图
 * <HeatmapChart
 *   title="设备状态热力图"
 *   data={[
 *     { rowLabel: '设备A', colLabel: '00-04', value: 85 },
 *     { rowLabel: '设备A', colLabel: '04-08', value: 72 },
 *     { rowLabel: '设备B', colLabel: '00-04', value: 45 },
 *   ]}
 *   rowLabels={['设备A', '设备B', '设备C']}
 *   colLabels={['00-04', '04-08', '08-12', '12-16', '16-20', '20-24']}
 *   colorScheme="red"
 *   showValues
 * />
 *
 * @example
 * // 会员等级分布
 * <HeatmapChart
 *   title="会员等级门店分布"
 *   data={[{ rowLabel: '黄金', colLabel: '门店A', value: 230 }]}
 *   rowLabels={['黄金', '白银', '青铜']}
 *   colLabels={['门店A', '门店B', '门店C']}
 *   colorScheme="amber"
 * />
 */
declare function HeatmapChart({ data, rowLabels, colLabels, width, height, title, colorScheme, showValues, showLegend, className, emptyText, onCellClick, }: HeatmapChartProps): React__default.JSX.Element;

/** 异常严重程度 */
type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';
/** 异常来源 */
type AnomalySource = 'device' | 'member' | 'transaction' | 'system' | 'network';
/** 单条异常告警 */
interface AnomalyAlert {
    /** 告警 ID */
    id: string;
    /** 告警标题 */
    title: string;
    /** 告警描述 */
    description: string;
    /** 严重程度 */
    severity: AnomalySeverity;
    /** 来源类型 */
    source: AnomalySource;
    /** 发生时间 */
    timestamp: string;
    /** 影响范围描述 */
    impact?: string;
    /** 是否已确认 */
    acknowledged: boolean;
    /** 相关指标值 */
    metricValue?: number;
    /** 指标阈值 */
    metricThreshold?: number;
    /** 指标单位 */
    metricUnit?: string;
}
/** 告警汇总统计 */
interface AnomalySummary {
    /** 总告警数 */
    total: number;
    /** 未确认数 */
    unacknowledged: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
}
/** 异常告警面板 Props */
interface AnomalyAlertPanelProps {
    /** 告警数据列表 */
    alerts: AnomalyAlert[];
    /** 面板标题 */
    title?: string;
    /** 最大显示条数 */
    maxDisplay?: number;
    /** 是否显示汇总统计 */
    showSummary?: boolean;
    /** 是否显示筛选栏 */
    showFilters?: boolean;
    /** 刷新间隔(ms)，默认不自动刷新 */
    refreshIntervalMs?: number;
    /** 确认告警回调 */
    onAcknowledge?: (alertId: string) => void;
    /** 确认全部回调 */
    onAcknowledgeAll?: () => void;
    /** 查看详情回调 */
    onViewDetail?: (alert: AnomalyAlert) => void;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
}
/**
 * AnomalyAlertPanel — 异常告警面板组件。
 *
 * 用于集中展示系统中的各类异常告警，支持：
 * - 告警列表（按严重程度排序）
 * - 汇总统计（总数/未确认/各级别数量）
 * - 严重程度筛选
 * - 来源类型筛选
 * - 确认/确认全部操作
 * - 展开查看详情
 * - 空状态处理
 *
 * @example
 * // 基础用法
 * <AnomalyAlertPanel
 *   title="实时告警监控"
 *   alerts={[
 *     {
 *       id: '1',
 *       title: '设备温度过高',
 *       description: '设备 #A103 温度达到 85°C，超过安全阈值 75°C',
 *       severity: 'critical',
 *       source: 'device',
 *       timestamp: new Date().toISOString(),
 *       acknowledged: false,
 *       impact: '可能影响 3 条产线',
 *       metricValue: 85,
 *       metricThreshold: 75,
 *       metricUnit: '°C',
 *     },
 *   ]}
 *   onAcknowledge={(id) => console.log('ack', id)}
 *   onViewDetail={(a) => console.log('detail', a)}
 * />
 *
 * @example
 * // 空状态
 * <AnomalyAlertPanel
 *   alerts={[]}
 *   emptyText="✅ 当前无异常告警，系统运行正常"
 * />
 */
declare function AnomalyAlertPanel({ alerts, title, maxDisplay, showSummary, showFilters, onAcknowledge, onAcknowledgeAll, onViewDetail, className, emptyText, }: AnomalyAlertPanelProps): React__default.JSX.Element;

/** 今日运营指标 */
interface StoreDailyMetrics {
    revenue: number;
    orderCount: number;
    avgOrderValue: number;
    newMembers: number;
    /** 同比变化 (百分比点数, 正 = 上升) */
    revenueTrend: number;
    orderTrend: number;
    avgValueTrend: number;
    memberTrend: number;
}
/** 待办任务 */
interface PendingTask {
    id: string;
    title: string;
    type: 'inventory' | 'member' | 'order' | 'device' | 'alert';
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
    description?: string;
}
/** 设备状态摘要 */
interface DeviceStatusSummary {
    total: number;
    online: number;
    offline: number;
    warning: number;
    lastCheckAt?: string;
}
/** 快速操作 */
interface QuickAction {
    key: string;
    label: string;
    icon?: string;
    /** 是否为主要操作 (高亮) */
    primary?: boolean;
    onClick?: () => void;
}
/** 店长工作台 Props */
interface StoreManagerDashboardProps {
    /** 今日运营指标 */
    dailyMetrics?: StoreDailyMetrics;
    /** 待办任务列表 */
    pendingTasks?: PendingTask[];
    /** 设备状态 */
    deviceStatus?: DeviceStatusSummary;
    /** 快速操作按钮 */
    quickActions?: QuickAction[];
    /** 门店名称 */
    storeName?: string;
    /** 最后同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 (移动端适配) */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
}
/**
 * StoreManagerDashboard — 店长工作台
 *
 * 聚合店长日常运营所需的核心数据、待办任务、设备状态与快速操作入口。
 * 适用于 SaaS / 零售 / 餐饮门店管理场景。
 *
 * @example
 * <StoreManagerDashboard
 *   storeName="朝阳旗舰店"
 *   dailyMetrics={{ revenue: 52800, orderCount: 342, avgOrderValue: 154.4, newMembers: 12, revenueTrend: 5.2, orderTrend: -1.3, avgValueTrend: 3.1, memberTrend: 8.0 }}
 *   pendingTasks={[{ id: '1', title: 'SKU-089 库存不足', type: 'inventory', priority: 'high', createdAt: '10:45' }]}
 *   deviceStatus={{ total: 48, online: 42, offline: 3, warning: 3 }}
 *   quickActions={[{ key: 'scan', label: '扫码入库', primary: true }]}
 * />
 */
declare function StoreManagerDashboard({ dailyMetrics, pendingTasks, deviceStatus, quickActions, storeName, lastSyncAt, loading, compact, className, }: StoreManagerDashboardProps): React__default.JSX.Element;

/** 结账状态 */
type CheckoutStatus = 'idle' | 'processing' | 'success' | 'failed';
/** 购物篮商品项 */
interface BasketItem {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    image?: string;
}
/** 支付方式 */
type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card' | 'member_card';
/** 排队叫号项 */
interface QueueItem {
    id: string;
    number: string;
    customerName?: string;
    type: 'service' | 'pickup' | 'return' | 'consult';
    waitingMinutes: number;
    status: 'waiting' | 'calling' | 'serving';
}
/** 快捷功能按钮 */
interface QuickFnButton {
    key: string;
    label: string;
    icon?: string;
    highlight?: boolean;
    badge?: number;
    onClick?: () => void;
}
/** 前台操作面板 Props */
interface FrontDeskPanelProps {
    /** 面板标题 */
    title?: string;
    /** 当前收银员 */
    cashierName?: string;
    /** 班次信息 */
    shiftInfo?: string;
    /** 购物篮商品 */
    basketItems?: BasketItem[];
    /** 结账状态 */
    checkoutStatus?: CheckoutStatus;
    /** 结账错误信息 */
    checkoutError?: string;
    /** 可用支付方式 */
    paymentMethods?: PaymentMethod[];
    /** 已选支付方式 */
    selectedPayment?: PaymentMethod;
    /** 当前排队列表 */
    queue?: QueueItem[];
    /** 快捷功能按钮 */
    quickActions?: QuickFnButton[];
    /** 今日统计 */
    todayStats?: {
        totalOrders: number;
        totalRevenue: number;
        avgCheckoutSec: number;
        pendingPickups: number;
    };
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
    /** 结账回调 */
    onCheckout?: (method: PaymentMethod) => void;
    /** 支付方式切换回调 */
    onPaymentChange?: (method: PaymentMethod) => void;
    /** 移除商品回调 */
    onRemoveItem?: (itemId: string) => void;
    /** 清空购物篮回调 */
    onClearBasket?: () => void;
    /** 自定义类名 */
    className?: string;
}
/**
 * FrontDeskPanel — 前台操作面板
 *
 * 一站式前台收银、排队叫号、快捷操作面板。
 * 适用于零售门店前台 / 收银终端 / POS 场景。
 *
 * @example
 * <FrontDeskPanel
 *   title="前台收银台"
 *   cashierName="张丽"
 *   basketItems={[{ id: '1', name: '春季新款连衣裙', sku: 'SKU-001', quantity: 2, unitPrice: 299, subtotal: 598 }]}
 *   checkoutStatus="idle"
 *   paymentMethods={['wechat', 'alipay', 'cash', 'member_card']}
 *   selectedPayment="wechat"
 *   todayStats={{ totalOrders: 42, totalRevenue: 38650, avgCheckoutSec: 38, pendingPickups: 3 }}
 *   onCheckout={(m) => console.log('结账:', m)}
 * />
 */
declare function FrontDeskPanel({ title, cashierName, shiftInfo, basketItems, checkoutStatus, checkoutError, paymentMethods, selectedPayment, queue, quickActions, todayStats, loading, compact, onCheckout, onPaymentChange, onRemoveItem, onClearBasket, className, }: FrontDeskPanelProps): React__default.JSX.Element;

/** 当日接待统计 */
interface DailyReceptionStats {
    /** 接待总数 */
    totalReceptions: number;
    /** 新增线索 */
    newLeads: number;
    /** 转化数 */
    conversions: number;
    /** 转化率 (0-100) */
    conversionRate: number;
    /** 平均响应时间 (分钟) */
    avgResponseMin: number;
}
/** 待跟进客户 */
interface FollowUpClient {
    id: string;
    name: string;
    phone: string;
    /** 会员等级 */
    tier: 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR';
    /** 最近到店时间 */
    lastVisit: string;
    /** 待跟进原因 */
    reason: string;
    /** 紧急程度 */
    priority: 'high' | 'medium' | 'low';
}
/** 推荐话术 */
interface SalesScript {
    id: string;
    scenario: string;
    text: string;
    tags: string[];
}
/** 会员快速查询结果 */
interface MemberQuickLookup {
    id: string;
    name: string;
    phone: string;
    tier: 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR';
    points: number;
    totalSpent: number;
    visitCount: number;
    tags: string[];
}
interface SalesClerkToolProps {
    /** 当日接待统计 */
    stats: DailyReceptionStats;
    /** 待跟进客户列表 */
    followUpClients: FollowUpClient[];
    /** 推荐话术列表 */
    scripts: SalesScript[];
    /** 导购员姓名 */
    clerkName?: string;
    /** 门店名称 */
    storeName?: string;
    /** 会员查询回调 */
    onMemberSearch?: (query: string) => Promise<MemberQuickLookup[]>;
    /** 客户跟进回调 */
    onFollowUp?: (clientId: string) => void;
    /** 话术复制回调 */
    onScriptCopy?: (scriptId: string) => void;
}
declare function SalesClerkTool({ stats, followUpClients, scripts, clerkName, storeName, onMemberSearch, onFollowUp, onScriptCopy, }: SalesClerkToolProps): React__default.JSX.Element;

/** 辖区门店概览 */
interface DistrictStoreSnapshot {
    id: string;
    name: string;
    /** 区域 */
    region: string;
    /** 门店状态 */
    status: 'operating' | 'closed_today' | 'paused' | 'offline';
    /** 今日营收 */
    todayRevenue: number;
    /** 营收达标率 (0-100) */
    revenueRate: number;
    /** 客流量 */
    visitorCount: number;
    /** 本月KPI完成率 */
    monthlyKpiRate: number;
    /** 活跃告警数 */
    alertCount: number;
    /** 在岗人数 */
    staffOnDuty: number;
    /** 上次巡检时间 */
    lastInspectionAt?: string;
}
/** 辖区汇总指标 */
interface DistrictSummary {
    /** 管辖门店数 */
    totalStores: number;
    /** 营业中 */
    operatingStores: number;
    /** 今日总营收 */
    totalRevenue: number;
    /** 营收环比 (百分比点数) */
    revenueQoQ: number;
    /** 总客流量 */
    totalVisitors: number;
    /** 客流环比 */
    visitorsQoQ: number;
    /** 平均KPI达成率 */
    avgKpiRate: number;
    /** KPI环比 */
    kpiRateQoQ: number;
    /** 待处理告警总数 */
    pendingAlerts: number;
    /** 告警环比 */
    alertsQoQ: number;
}
/** 巡店任务 */
interface InspectionTask {
    id: string;
    storeId: string;
    storeName: string;
    /** 巡检类型 */
    type: 'routine' | 'spot_check' | 'compliance' | 'hygiene' | 'device';
    /** 优先级 */
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** 状态 */
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'overdue';
    /** 截止时间 */
    deadline: string;
    /** 指派人 */
    assignee?: string;
    /** 结果备注 */
    result?: string;
}
/** 快速动作 */
interface OpsQuickAction {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick?: () => void;
}
/** 运营主管工作台 Props */
interface OperationsManagerDashboardProps {
    /** 辖区汇总指标 */
    districtSummary?: DistrictSummary;
    /** 辖区门店概览列表 */
    stores?: DistrictStoreSnapshot[];
    /** 巡店任务列表 */
    inspectionTasks?: InspectionTask[];
    /** 快速操作 */
    quickActions?: OpsQuickAction[];
    /** 运营主管名称 */
    managerName?: string;
    /** 管辖区域名称 */
    districtName?: string;
    /** 最后同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
}
/**
 * OperationsManagerDashboard — 运营主管工作台
 *
 * 面向多门店运营主管角色，聚合辖区运营概览、门店KPI对比、巡店任务管理和快速操作入口。
 * 适用于连锁零售/SaaS多门店管理场景。
 *
 * @example
 * <OperationsManagerDashboard
 *   managerName="李明"
 *   districtName="华东区"
 *   districtSummary={{ totalStores: 12, operatingStores: 11, totalRevenue: 526800, revenueQoQ: 3.2, totalVisitors: 8420, visitorsQoQ: 5.1, avgKpiRate: 87.3, kpiRateQoQ: 2.8, pendingAlerts: 7, alertsQoQ: -12.5 }}
 *   stores={[{ id: 's1', name: '朝阳旗舰店', region: '北京', status: 'operating', todayRevenue: 52800, revenueRate: 92, visitorCount: 1280, monthlyKpiRate: 88.5, alertCount: 2, staffOnDuty: 8 }]}
 *   inspectionTasks={[{ id: 't1', storeId: 's1', storeName: '朝阳旗舰店', type: 'routine', priority: 'high', status: 'pending', deadline: '2026-06-23' }]}
 *   quickActions={[{ key: 'patrol', label: '发起巡店', primary: true }]}
 * />
 */
declare function OperationsManagerDashboard({ districtSummary, stores, inspectionTasks, quickActions, managerName, districtName, lastSyncAt, loading, compact, className, }: OperationsManagerDashboardProps): React__default.JSX.Element;

/** 会员服务概览 */
interface MemberServiceOverview {
    /** 总服务次数 */
    totalServices: number;
    /** 本月新增VIP */
    newVipCount: number;
    /** 待处理咨询 */
    pendingInquiries: number;
    /** 客户满意度 (0-100) */
    satisfactionScore: number;
    /** 满意度环比变化 */
    satisfactionTrend: number;
}
/** 积分操作记录 */
interface PointsTransaction {
    id: string;
    memberName: string;
    memberId: string;
    memberLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    type: 'earn' | 'redeem' | 'adjust' | 'expire';
    points: number;
    reason: string;
    operatedBy: string;
    operatedAt: string;
}
/** 会员来访记录 */
interface MemberVisitRecord {
    id: string;
    memberName: string;
    memberId: string;
    memberLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    visitTime: string;
    purpose: string;
    durationMin: number;
    staffName: string;
    notes?: string;
}
/** 个性化推荐项 */
interface PersonalizedRecommendation {
    id: string;
    memberId: string;
    memberName: string;
    productName: string;
    productCategory: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
    price?: number;
}
/** 快速服务操作 */
interface ConciergeAction {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick?: () => void;
}
/** 礼宾管家面板 Props */
interface ConciergePanelProps {
    /** 会员服务概览统计 */
    overview?: MemberServiceOverview;
    /** 积分流水 */
    pointsTransactions?: PointsTransaction[];
    /** 来访记录 */
    visitRecords?: MemberVisitRecord[];
    /** 个性化推荐 */
    recommendations?: PersonalizedRecommendation[];
    /** 快速操作 */
    actions?: ConciergeAction[];
    /** 管家名称 */
    conciergeName?: string;
    /** 上次同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
}
declare const ConciergePanel: React__default.FC<ConciergePanelProps>;

type Severity = 'info' | 'warning' | 'error' | 'success';
interface StatusBadgeProps {
    label: string;
    variant?: Severity | 'neutral' | 'default' | 'pending' | 'danger';
    size?: 'sm' | 'md';
    dot?: boolean;
}
declare function StatusBadge({ label, variant, size, dot }: StatusBadgeProps): React__default.JSX.Element;
interface StatusBadgeGroupProps {
    items?: {
        label: string;
        variant?: Severity | 'neutral' | 'default' | 'pending' | 'danger';
    }[];
    children?: React__default.ReactNode;
    size?: 'sm' | 'md';
}
declare function StatusBadgeGroup({ items, children, size }: StatusBadgeGroupProps): React__default.JSX.Element | null;

type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple';
interface TagProps {
    /** Display text */
    children: React__default.ReactNode;
    /** Color variant */
    variant?: TagVariant;
    /** Size */
    size?: 'sm' | 'md';
    /** Whether the tag can be closed */
    closable?: boolean;
    /** Callback when close icon is clicked */
    onClose?: () => void;
    /** Whether the tag has a border */
    bordered?: boolean;
    /** Optional className for the wrapper */
    className?: string;
}
declare function Tag({ children, variant, size, closable, onClose, bordered, className, }: TagProps): React__default.JSX.Element;
/** Horizontal wrapper with gaps for a group of tags */
declare function TagGroup({ children, gap, }: {
    children: React__default.ReactNode;
    gap?: number;
}): React__default.JSX.Element;

type DateTimePickerMode = 'date' | 'datetime' | 'time' | 'month';
interface DateTimePickerProps {
    /** 当前值 (ISO 8601 字符串) */
    value?: string;
    /** 值变化回调 */
    onChange?: (value: string) => void;
    /** 选择模式 */
    mode?: DateTimePickerMode;
    /** 占位文本 */
    placeholder?: string;
    /** 最小值 (ISO 8601) */
    min?: string;
    /** 最大值 (ISO 8601) */
    max?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否必填 */
    required?: boolean;
    /** 标签 */
    label?: string;
    /** 错误信息 */
    error?: string;
    /** 帮助文本 */
    helpText?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 自定义类名 */
    className?: string;
}
declare const DateTimePicker: React__default.NamedExoticComponent<DateTimePickerProps>;

interface TimePickerProps {
    /** 当前值 (HH:mm 或 HH:mm:ss) */
    value?: string;
    /** 值变化回调 */
    onChange?: (value: string) => void;
    /** 占位文本 */
    placeholder?: string;
    /** 是否包含秒 */
    showSeconds?: boolean;
    /** 小时最小值 (0-23) */
    minHour?: number;
    /** 小时最大值 (0-23) */
    maxHour?: number;
    /** 分钟步长 */
    minuteStep?: number;
    /** 是否12小时制 */
    use12Hour?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否必填 */
    required?: boolean;
    /** 标签 */
    label?: string;
    /** 错误信息 */
    error?: string;
    /** 帮助文本 */
    helpText?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 自定义类名 */
    className?: string;
    /** 唯一 id (用于 label 关联) */
    id?: string;
    /** 是否只读 */
    readOnly?: boolean;
}
declare const TimePicker: React__default.FC<TimePickerProps>;

interface CardProps {
    /** Card title (optional header) */
    title?: string;
    /** Subtitle shown below the title */
    subtitle?: string;
    /** Additional header actions rendered to the right of the title */
    headerActions?: React__default.ReactNode;
    /** Card body content */
    children?: React__default.ReactNode;
    /** Visual variant */
    variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
    /** Extra padding override */
    padding?: number | string;
    /** Custom style overrides */
    style?: React__default.CSSProperties;
    /** Footer content */
    footer?: React__default.ReactNode;
    /** Test id */
    'data-testid'?: string;
}
/**
 * Card — a reusable glassmorphism card container used across all M5 apps.
 *
 * Encapsulates the common `rgba(15,23,42,…)` + border pattern repeated in 20+ files.
 * Supports optional title header, variant selection, and footer slot.
 */
declare function Card({ title, subtitle, headerActions, children, variant, padding, style, footer, 'data-testid': dataTestId, }: CardProps): React__default.JSX.Element;

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: {
        value: string;
        positive: boolean;
    };
    icon?: React__default.ReactNode;
    variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
    helper?: React__default.ReactNode;
}
declare function StatCard({ label, value, trend, icon, variant, helper }: StatCardProps): React__default.JSX.Element;

interface QuickStatItem {
    /** 展示标签 */
    label: string;
    /** 主数值/文字 */
    value: string | number;
    /** 辅助说明文字 */
    helper?: string;
    /** 主值颜色覆盖 */
    valueColor?: string;
}
interface QuickStatsProps {
    /** 统计数据项 */
    items: QuickStatItem[];
    /** 列数 (默认 4) */
    columns?: number;
    /** 间距 (默认 14) */
    gap?: number;
    /** 卡片内边距 (默认 18) */
    padding?: number;
}
/**
 * QuickStats — 快速统计概览行
 *
 * 用于列表页顶部，展示关键指标卡片。
 * 替代重复的手写 stat 卡片模板代码。
 *
 * @example
 * <QuickStats
 *   items={[
 *     { label: '总数', value: 15, helper: '5 个区域' },
 *     { label: '运营中', value: 8, valueColor: '#4ade80', helper: '53% 激活率' },
 *   ]}
 *   columns={4}
 * />
 */
declare function QuickStats({ items, columns, gap, padding, }: QuickStatsProps): React__default.JSX.Element | null;

declare function useSearchFilter<T>(items: T[], searchFields: Array<keyof T | string>): {
    searchTerm: string;
    setSearchTerm: React__default.Dispatch<React__default.SetStateAction<string>>;
    filteredItems: T[];
    matchedCount: number;
    totalCount: number;
};
declare function useSearchFilter(initialValue?: string, debounceMs?: number): {
    value: string;
    debouncedValue: string;
    setValue: (value: string) => void;
};
declare function FoundationAlertLinkedAlertGridReadout(props: any): React__default.DetailedReactHTMLElement<{
    style: {
        marginTop: number;
    };
}, HTMLElement>;
declare function FoundationAlertLinkedFocusBarReadout(props: any): React__default.DetailedReactHTMLElement<{
    style: {
        borderRadius: number;
        padding: number;
        background: any;
        border: string;
    };
}, HTMLElement>;
declare function FoundationAlertLinkedOverviewStatsReadout(props: any): React__default.DetailedReactHTMLElement<{
    style: {
        marginTop: number;
        display: "grid";
        gap: number;
        gridTemplateColumns: string;
    };
}, HTMLElement>;
declare function createFoundationAlertNextNavigationBindings(opts: any): {
    router: any;
    pathname: any;
    searchParams: URLSearchParams;
    push: (...args: unknown[]) => any;
    replace: (...args: unknown[]) => any;
};
declare function useFoundationAlertLinkedFocusQuery(opts: any): {
    activateFocus: (code: string, ctx: string, filters?: FoundationAlertTimelineFilterState) => void;
    clearLinkedTriage: () => void;
    copyFocusLink: () => Promise<void>;
    focusAlertCode: any;
    focusContext: any;
    handlePanelFocusChange: (code: string, ctx: string) => void;
    hasLinkedFilters: boolean;
    linkedFilterQueryPreview: string;
    linkedFilterSummary: string;
    shareStatus: string | undefined;
};
declare function canReplayRuntimePanelAction(_receipt: any, _extraCheck?: (receipt: any) => boolean): boolean;
declare function createRuntimeReceiptStatusCardProps(_opts: any): {
    receipt: any;
    summary: any;
    scopeLabel: any;
    metaLabel: any;
    eventCount: any;
};
declare function createRuntimeOperationToolbarProps(_opts: any): {
    onSubmit: any;
    onQuery: any;
    onReplay: any;
    disableSubmit: any;
    disableQuery: any;
    disableReplay: any;
    canReplay: any;
    pendingOperation: any;
    receipt: any;
};
declare function hasRuntimePanelReceiptCode(_receipt: any): boolean;
declare function RuntimeOperationToolbar(props: any): React__default.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        marginTop: number;
        display: "flex";
        gap: number;
        flexWrap: "wrap";
        alignItems: "center";
    };
}, HTMLElement>;
declare function RuntimePanelFeedback(props: any): React__default.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        marginTop: number;
        borderRadius: number;
        padding: number;
        background: string;
        border: string;
    };
}, HTMLElement>;
declare function RuntimePanelFrame(props: any): React__default.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        borderRadius: number;
        padding: number;
        background: string;
        border: string;
        color: "#f8fafc";
    };
}, HTMLElement>;
declare function RuntimePanelGrid(_props: any): React__default.DetailedReactHTMLElement<{
    style: {
        display: "grid";
        gap: number;
        gridTemplateColumns: string;
        marginTop: number;
    };
}, HTMLElement>;
declare function joinRuntimeScopeSummary(parts: string[], _opts?: any): string;
declare function useRuntimePresetSelection<T>(presets?: readonly T[] | T[], defaultKey?: string): {
    selectedAction: string;
    setSelectedAction: React__default.Dispatch<React__default.SetStateAction<string>>;
    activePreset: any;
};
declare function useRuntimePanelState<T = any>(defaultMessage?: string): {
    receipt: T | null;
    setReceipt: React__default.Dispatch<React__default.SetStateAction<T | null>>;
    pendingOperation: string | null;
    setPendingOperation: React__default.Dispatch<React__default.SetStateAction<string | null>>;
    actionError: string | null;
    setActionError: React__default.Dispatch<React__default.SetStateAction<string | null>>;
    message: string | null;
    setMessage: React__default.Dispatch<React__default.SetStateAction<string | null>>;
    runOperation: (operation: string, fn: () => Promise<any>) => Promise<void>;
};
declare function RuntimePresetCard(props: any): React__default.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        borderRadius: number;
        padding: number;
        background: string;
        border: string;
    };
}, HTMLElement>;
declare function RuntimePresetSelector(props: any): React__default.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        marginTop: number;
        display: "flex";
        gap: number;
        flexWrap: "wrap";
    };
}, HTMLElement>;
declare function RuntimeReceiptStatusCard(props: any): React__default.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        borderRadius: number;
        padding: number;
        background: string;
        border: string;
    };
}, HTMLElement>;
declare function executeRuntimePanelOperation(_opts: any): Promise<any>;
interface DataTableSortConfig {
    key: string;
    direction: 'asc' | 'desc';
}
declare function useSortedItems<T>(items: T[] | undefined | null, _columns: any[], sortConfig: DataTableSortConfig | null): T[];
interface PortalListItemView {
    id: string;
    label: string;
    subtitle?: string;
    status?: string;
    meta?: string;
}
interface PortalListProps {
    portals: PortalListItemView[];
    searchPlaceholder?: string;
    emptyTitle?: string;
    emptyDescription?: string;
}
declare function PortalList({ portals, searchPlaceholder, emptyTitle, emptyDescription, }: PortalListProps): React__default.JSX.Element;
declare function formatRuntimeCallbackStalledDuration(ms: number): string;
declare function describeRuntimeCallbackStalledEscalation(action: string): string;
declare function FoundationAlertRuntimeCallbackStalledReadout(_props: any): React__default.DetailedReactHTMLElement<React__default.HTMLAttributes<HTMLElement>, HTMLElement>;
declare function summarizeRuntimePanelReceipt(receipt: any): string;
declare function canReplayRuntimePanelReceipt(receipt: any): boolean;
declare function getRuntimePanelTenantId(receipt: any): string;
declare function createRuntimeReceiptStatusCard(_opts: any): React__default.FunctionComponentElement<any>;
declare function RuntimeReceiptEvents(_props: any): React__default.DetailedReactHTMLElement<{
    style: {
        marginTop: number;
        display: "grid";
        gap: number;
    };
}, HTMLElement>;
declare function refreshFoundationAlertSelection(_opts: any): string;

interface DataTableColumn<T> {
    key: string;
    header?: string;
    title?: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    dataKey?: keyof T;
    sortable?: boolean;
    sortValue?: (row: T) => React__default.ReactNode;
    render?: (row: T, index: number) => React__default.ReactNode;
}
interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    rows?: T[];
    items?: T[];
    rowKey: (row: T) => string;
    loading?: boolean;
    emptyText?: string;
    onRowClick?: (row: T) => void;
    title?: React__default.ReactNode;
    sort?: DataTableSortConfig | null;
    onSortChange?: React__default.Dispatch<React__default.SetStateAction<DataTableSortConfig | null>>;
    striped?: boolean;
    compact?: boolean;
}
declare function DataTable<T>({ columns, rows, items, rowKey, loading, emptyText, onRowClick, title, striped, compact, }: DataTableProps<T>): React__default.JSX.Element;

interface TableColumn<T = Record<string, unknown>> {
    /** Unique key for the column. */
    key: string;
    /** Header text; falls back to `title` then to `key`. */
    header?: string;
    /** Legacy alias for header. */
    title?: string;
    /** CSS width e.g. "120px" or "20%". */
    width?: string;
    /** Text alignment. */
    align?: 'left' | 'center' | 'right';
    /** If true the column is sortable. */
    sortable?: boolean;
    /** Custom render function receiving the full row. */
    render?: (row: T, rowIndex: number) => React__default.ReactNode;
}
interface TableSortState {
    key: string;
    direction: 'asc' | 'desc';
}
interface TablePaginationState {
    page: number;
    pageSize: number;
    total: number;
}
interface TableProps<T = Record<string, unknown>> {
    /** Column definitions. */
    columns: TableColumn<T>[];
    /** Data rows. */
    rows: T[];
    /** Function returning a stable, unique key for each row. */
    rowKey: (row: T) => string;
    /** Enable row selection via checkboxes. */
    selectable?: boolean;
    /** Controlled selected row keys. */
    selectedKeys?: string[];
    /** Called when selection changes. */
    onSelectionChange?: (keys: string[]) => void;
    /** Controlled sort state. */
    sort?: TableSortState | null;
    /** Called when sort column or direction changes. */
    onSortChange?: (sort: TableSortState | null) => void;
    pagination?: TablePaginationState;
    onPaginationChange?: (page: number) => void;
    striped?: boolean;
    compact?: boolean;
    bordered?: boolean;
    hoverable?: boolean;
    loading?: boolean;
    emptyText?: string;
    onRowClick?: (row: T) => void;
    title?: React__default.ReactNode;
    toolbar?: React__default.ReactNode;
}
declare function Table<T extends Record<string, unknown>>({ columns, rows, rowKey, selectable, selectedKeys, onSelectionChange, sort, onSortChange, pagination, onPaginationChange, striped, compact, bordered, hoverable, loading, emptyText, onRowClick, title, toolbar, }: TableProps<T>): React__default.JSX.Element;

interface PaginatedDataTableCardProps<T> {
    title?: React__default.ReactNode;
    columns: DataTableColumn<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    loading?: boolean;
    sort?: DataTableSortConfig | null;
    onSortChange?: React__default.Dispatch<React__default.SetStateAction<DataTableSortConfig | null>>;
    striped?: boolean;
    compact?: boolean;
    emptyTitle: string;
    emptyDescription: string;
    pagination?: {
        page: number;
        totalPages: number;
        total: number;
        onPageChange: (page: number) => void;
    };
}
declare function PaginatedDataTableCard<T>({ title, columns, rows, rowKey, loading, sort, onSortChange, striped, compact, emptyTitle, emptyDescription, pagination, }: PaginatedDataTableCardProps<T>): React__default.JSX.Element;

interface PaginationProps {
    page: number;
    total: number;
    onPageChange: (page: number) => void;
    totalPages?: number;
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
    size?: 'sm' | 'md';
}
interface LegacyPaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    pageSizeOptions?: number[];
}
declare function usePagination(total: number, pageSize: number, initialPage?: number): {
    page: number;
    pageSize: number;
    totalPages: number;
    setPage: React__default.Dispatch<React__default.SetStateAction<number>>;
    setPageSize: React__default.Dispatch<React__default.SetStateAction<number>>;
    total: number;
    resetPage: () => void;
    paginate: <T>(items: T[]) => T[];
};
declare function usePagination(options: LegacyPaginationOptions): {
    page: number;
    pageSize: number;
    totalPages: number;
    setPage: React__default.Dispatch<React__default.SetStateAction<number>>;
    setPageSize: React__default.Dispatch<React__default.SetStateAction<number>>;
    total: number;
    resetPage: () => void;
    paginate: <T>(items: T[]) => T[];
};
declare function Pagination({ page, total, totalPages, onPageChange, pageSize, onPageSizeChange, pageSizeOptions, size, }: PaginationProps): React__default.JSX.Element;

interface ProgressProps {
    /** Current value (0-100) */
    value: number;
    /** Maximum value, default 100 */
    max?: number;
    /** Visual variant */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    /** Show percentage label */
    showLabel?: boolean;
    /** Label format; receives computed percentage number */
    formatLabel?: (pct: number) => string;
    /** Height in px, default 8 */
    height?: number;
    /** Whether to animate the bar width transition */
    animated?: boolean;
    /** Whether to show an indeterminate loading animation (ignores value) */
    indeterminate?: boolean;
    /** ARIA label */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style override */
    style?: React__default.CSSProperties;
}
/**
 * Progress — a reusable progress bar with variants, labels, and indeterminate state.
 *
 * Used across M5 apps for loading indicators, step completion, and resource usage.
 */
declare function Progress({ value, max, variant, showLabel, formatLabel, height, animated, indeterminate, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, }: ProgressProps): React__default.JSX.Element;

interface ScrollAreaProps {
    /** Content to render inside the scrollable area */
    children: React__default.ReactNode;
    /** Maximum height. If not set, grows with content. */
    maxHeight?: number | string;
    /** Fixed height. Overrides maxHeight. */
    height?: number | string;
    /** Max width. If not set, fills container. */
    maxWidth?: number | string;
    /** Scrollbar thumb color (CSS color), default #94a3b8 */
    thumbColor?: string;
    /** Scrollbar track color, default transparent */
    trackColor?: string;
    /** Scrollbar width in px, default 8 */
    scrollbarWidth?: number;
    /** Always show scrollbar (not only on hover/focus), default false */
    alwaysVisible?: boolean;
    /** Whether to show scroll shadow indicators at top/bottom edges */
    showShadowEdges?: boolean;
    /** ARIA label for the scrollable region */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class for the outer wrapper */
    className?: string;
    /** Inline style override for the outer wrapper */
    style?: React__default.CSSProperties;
    /** Callback when scroll position changes */
    onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
    /** Scroll to bottom when content changes (e.g. chat) */
    autoScrollToBottom?: boolean;
}
/**
 * ScrollArea — a custom-scrollbar container for consistent cross-platform scrolling.
 *
 * Used in dashboards, modals, dropdowns, and any constrained-height containers
 * where native scrollbars are visually inconsistent.
 */
declare function ScrollArea({ children, maxHeight, height, maxWidth, thumbColor, trackColor, scrollbarWidth, alwaysVisible, showShadowEdges, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, onScroll, autoScrollToBottom, }: ScrollAreaProps): React__default.JSX.Element;

interface PageShellProps {
    title: string;
    description?: string;
    subtitle?: string;
    actions?: React__default.ReactNode;
    children: React__default.ReactNode;
}
declare function PageShell({ title, description, subtitle, actions, children }: PageShellProps): React__default.JSX.Element;

interface DetailSection {
    title: string;
    content: React__default.ReactNode;
}
interface DetailShellAction {
    key: string;
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void | Promise<void>;
    href?: string;
}
interface DetailShellProps {
    title: string;
    backHref?: string;
    backLabel?: string;
    subtitle?: string;
    sections?: DetailSection[];
    children?: React__default.ReactNode;
    breadcrumbs?: Array<{
        label: string;
        href?: string;
    }>;
    backLink?: {
        label: string;
        href: string;
    };
    actions?: DetailShellAction[];
    loading?: boolean;
    error?: string;
    onBack?: () => void;
}
declare function DetailShell({ title, backHref, backLabel, sections, subtitle, children, breadcrumbs, backLink, actions, loading, error, onBack, }: DetailShellProps): React__default.JSX.Element;

interface EmptyStateProps {
    title?: string;
    description?: string;
    action?: React__default.ReactNode;
    icon?: React__default.ReactNode;
    variant?: 'default' | 'compact';
}
declare function EmptyState({ title, description, action, icon, variant }: EmptyStateProps): React__default.JSX.Element;

interface LoadingSkeletonProps {
    lines?: number;
    rows?: number;
    label?: string;
    variant?: 'default' | 'card' | 'table';
}
declare function LoadingSkeleton({ lines, rows, label, variant, }: LoadingSkeletonProps): React__default.JSX.Element;

interface TabItem<T extends string = string> {
    key: T;
    label: string;
    count?: number;
}
interface TabsProps<T extends string = string> {
    items: TabItem<T>[];
    activeKey: T;
    onChange: (key: T) => void;
    variant?: 'underline' | 'segment' | 'pills';
    size?: 'sm' | 'md';
    fill?: boolean;
}
declare function Tabs<T extends string = string>({ items, activeKey, onChange, variant, size, fill, }: TabsProps<T>): React__default.JSX.Element | null;

interface FilterChip$1 {
    key: string;
    label: string;
    active: boolean;
    onClick: () => void;
}
interface FilterBarProps {
    chips: FilterChip$1[];
    onClearAll?: () => void;
    activeCount?: number;
}
declare function FilterBar({ chips, onClearAll, activeCount }: FilterBarProps): React__default.JSX.Element;

interface ListToolbarSortOption {
    key: string;
    label: string;
}
interface ListToolbarFilterOption {
    key: string;
    label: string;
    active: boolean;
}
interface ListToolbarViewMode {
    key: 'table' | 'grid' | 'card';
    label: string;
    icon?: string;
}
interface ListToolbarBatchAction {
    key: string;
    label: string;
    disabled?: boolean;
    variant?: 'default' | 'danger' | 'primary';
}
interface ListToolbarProps {
    /** Search input placeholder */
    searchPlaceholder?: string;
    /** Current search value (controlled) */
    searchValue?: string;
    /** Search change handler */
    onSearchChange?: (value: string) => void;
    /** Search submit handler (Enter press or button click) */
    onSearch?: (value: string) => void;
    /** Debounce delay in ms for search */
    searchDebounceMs?: number;
    /** Sort options */
    sortOptions?: ListToolbarSortOption[];
    /** Currently active sort key */
    activeSortKey?: string;
    /** Sort change handler */
    onSortChange?: (key: string) => void;
    /** Sort direction */
    sortDirection?: 'asc' | 'desc';
    /** Sort direction toggle handler */
    onSortDirectionChange?: (direction: 'asc' | 'desc') => void;
    /** Filter chips */
    filterOptions?: ListToolbarFilterOption[];
    /** Filter toggle handler */
    onFilterToggle?: (key: string) => void;
    /** Clear all filters */
    onClearFilters?: () => void;
    /** View modes available */
    viewModes?: ListToolbarViewMode[];
    /** Current view mode */
    activeViewMode?: 'table' | 'grid' | 'card';
    /** View mode change handler */
    onViewModeChange?: (mode: 'table' | 'grid' | 'card') => void;
    /** Batch actions (shows when selectedCount > 0) */
    batchActions?: ListToolbarBatchAction[];
    /** Number of selected items */
    selectedCount?: number;
    /** Batch action handler */
    onBatchAction?: (actionKey: string) => void;
    /** Create / add button */
    createLabel?: string;
    /** Create button handler */
    onCreate?: () => void;
    /** Total count display */
    totalCount?: number;
    /** Total count label */
    totalLabel?: string;
    /** Additional custom content slot */
    children?: React__default.ReactNode;
    /** Disabled state */
    disabled?: boolean;
    /** Test id */
    'data-testid'?: string;
}
declare function ListToolbar({ searchPlaceholder, searchValue: controlledSearchValue, onSearchChange, onSearch, searchDebounceMs, sortOptions, activeSortKey, onSortChange, sortDirection, onSortDirectionChange, filterOptions, onFilterToggle, onClearFilters, viewModes, activeViewMode, onViewModeChange, batchActions, selectedCount, onBatchAction, createLabel, onCreate, totalCount, totalLabel, children, disabled, 'data-testid': testId, }: ListToolbarProps): React__default.JSX.Element;

interface FilterChip {
    key: string;
    label: string;
    /** 可选的计数值展示在 chip 内 */
    count?: number;
    /** 视觉色调，默认 neutral */
    tone?: 'neutral' | 'warning' | 'danger' | 'success';
}
interface FilterChipsProps {
    /** 提示文案 */
    hint?: string;
    /** 活跃的过滤条件列表 */
    chips: FilterChip[];
    /** 清除单个过滤条件的回调 */
    onRemove: (key: string) => void;
    /** 清除全部过滤条件的回调 */
    onClearAll?: () => void;
    /** 组件尺寸 */
    size?: 'sm' | 'md';
    style?: React__default.CSSProperties;
}
/**
 * FilterChips — 活跃过滤条件展示组件
 *
 * 以标签形式展示当前已应用的过滤条件，支持单独移除或一键清除。
 * 适用于列表页中搭配 Tabs / SearchFilterInput 的视觉反馈层。
 *
 * @example
 * <FilterChips
 *   chips={[
 *     { key: 'status', label: '运营中', tone: 'success', count: 8 },
 *     { key: 'region', label: '亚太' },
 *   ]}
 *   onRemove={(key) => removeFilter(key)}
 *   onClearAll={clearAllFilters}
 * />
 */
declare function FilterChips({ hint, chips, onRemove, onClearAll, size, style, }: FilterChipsProps): React__default.JSX.Element | null;

declare const listPageStatCardStyle: React__default.CSSProperties;
interface ListPageFacetConfig<T> {
    key: string;
    order?: readonly string[];
    enabled?: boolean;
    getValue: (item: T) => string;
}
interface ListPageFacetState<T> {
    key: string;
    order: readonly string[];
    enabled: boolean;
    value: string;
    baseItems: T[];
    filteredItems: T[];
}
interface UseListPageSectionStateOptions<T> {
    items: T[];
    searchFields: Array<keyof T | string>;
    facets: ListPageFacetConfig<T>[];
    defaultPageSize?: number;
    pageSizeOptions?: number[];
}
declare function useListPageSectionState<T>({ items, searchFields, facets, defaultPageSize, pageSizeOptions, }: UseListPageSectionStateOptions<T>): {
    searchTerm: string;
    setSearchTerm: React__default.Dispatch<React__default.SetStateAction<string>>;
    searchFilteredItems: T[];
    facets: ListPageFacetState<T>[];
    filteredItems: T[];
    sortConfig: DataTableSortConfig | null;
    setSortConfig: React__default.Dispatch<React__default.SetStateAction<DataTableSortConfig | null>>;
    sortedItems: T[];
    pagedItems: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        setPage: React__default.Dispatch<React__default.SetStateAction<number>>;
        setPageSize: React__default.Dispatch<React__default.SetStateAction<number>>;
        total: number;
        resetPage: () => void;
        paginate: <T_1>(items: T_1[]) => T_1[];
    };
    totalPages: number;
    setFacetValue: (key: string, value: string) => void;
};

interface ModalProps {
    /** 是否显示 */
    open: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 标题 */
    title?: string;
    /** 是否显示关闭按钮 */
    showClose?: boolean;
    /** 自定义宽度 */
    width?: number;
    /** 点击遮罩是否关闭 */
    maskClosable?: boolean;
    /** 按下 Escape 是否关闭 */
    keyboardClosable?: boolean;
    /** 子内容 */
    children: React__default.ReactNode;
    /** 底部区域（如按钮组） */
    footer?: React__default.ReactNode;
}
/**
 * Modal — 通用弹窗组件。
 *
 * 支持标题、自定义内容、底部操作区、遮罩关闭、键盘 Escape 关闭。
 * 使用 Portal 渲染到 document.body。
 *
 * @example
 * <Modal open={visible} onClose={() => setVisible(false)} title="编辑信息">
 *   <FormField label="名称">
 *     <input type="text" />
 *   </FormField>
 * </Modal>
 */
declare function Modal({ open, onClose, title, showClose, width, maskClosable, keyboardClosable, children, footer, }: ModalProps): React__default.JSX.Element | null;

type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
interface DrawerProps {
    /** 是否显示 */
    open: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 标题 */
    title?: string;
    /** 侧边栏位置 */
    placement?: DrawerPlacement;
    /** 自定义宽度 (left/right) 或高度 (top/bottom) */
    size?: number;
    /** 是否显示关闭按钮 */
    showClose?: boolean;
    /** 点击遮罩是否关闭 */
    maskClosable?: boolean;
    /** 按下 Escape 是否关闭 */
    keyboardClosable?: boolean;
    /** 子内容 */
    children: React__default.ReactNode;
    /** 底部区域（如操作按钮） */
    footer?: React__default.ReactNode;
    /** CSS z-index */
    zIndex?: number;
}
/**
 * Drawer — 侧边抽屉组件。
 *
 * 从屏幕边缘滑入的面板，常用于详情展示、表单编辑、过滤面板等场景。
 * 支持上下左右四个方向的滑入，与 Modal 互补。
 *
 * @example
 * <Drawer open={visible} onClose={() => setVisible(false)} title="用户详情" placement="right">
 *   <p>用户信息...</p>
 * </Drawer>
 */
declare function Drawer({ open, onClose, title, placement, size, showClose, maskClosable, keyboardClosable, children, footer, zIndex, }: DrawerProps): React__default.JSX.Element | null;

interface DropdownItem {
    key: string;
    label: string;
    icon?: React__default.ReactNode;
    danger?: boolean;
    disabled?: boolean;
    divider?: boolean;
    onClick?: () => void;
}
interface DropdownProps {
    /** 触发器内容 */
    trigger: React__default.ReactNode;
    /** 下拉菜单项 */
    items: DropdownItem[];
    /** 菜单对齐方向 */
    align?: 'left' | 'right';
    /** 触发方式 */
    triggerMode?: 'click' | 'hover';
    /** 最小宽度 */
    minWidth?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义样式 */
    className?: string;
    style?: React__default.CSSProperties;
}
/**
 * Dropdown — 下拉菜单组件。
 *
 * 提供操作菜单能力，支持分隔线、危险操作样式和禁用状态。
 * 自动处理点击外部关闭和键盘 Escape 关闭。
 *
 * @example
 * <Dropdown
 *   trigger={<button>操作</button>}
 *   items={[
 *     { key: 'edit', label: '编辑', onClick: () => {} },
 *     { key: 'delete', label: '删除', danger: true, onClick: () => {} },
 *   ]}
 * />
 */
declare function Dropdown({ trigger, items, align, triggerMode, minWidth, disabled, className, style, }: DropdownProps): React__default.JSX.Element;

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
interface SelectProps {
    /** 当前选中值（受控） */
    value?: string;
    /** 值变化回调 */
    onChange?: (value: string) => void;
    /** 选项列表 */
    options: SelectOption[];
    /** 占位文本 */
    placeholder?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否允许清除 */
    allowClear?: boolean;
    /** 是否可搜索 */
    showSearch?: boolean;
    /** 搜索占位文本 */
    searchPlaceholder?: string;
    /** 空数据提示 */
    notFoundContent?: React__default.ReactNode;
    /** 最小宽度 */
    minWidth?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 下拉框类名 */
    dropdownClassName?: string;
    /** 表单 name */
    name?: string;
    /** aria-label */
    'aria-label'?: string;
    /** aria-labelledby */
    'aria-labelledby'?: string;
}
/**
 * Select — 下拉选择器组件。
 *
 * 提供单选下拉选择能力，支持搜索过滤、清除选择、禁用状态。
 * 自动处理点击外部关闭和键盘导航（Escape 关闭，Enter 确认）。
 *
 * @example
 * <Select
 *   value={selected}
 *   onChange={setSelected}
 *   options={[
 *     { value: 'apple', label: '苹果' },
 *     { value: 'banana', label: '香蕉' },
 *   ]}
 *   placeholder="请选择水果"
 * />
 */
declare function Select({ value, onChange, options, placeholder, disabled, allowClear, showSearch, searchPlaceholder, notFoundContent, minWidth, className, style, dropdownClassName, name, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, }: SelectProps): React__default.JSX.Element;

interface MultiSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
interface MultiSelectProps {
    /** 当前选中的值数组（受控） */
    value?: string[];
    /** 值变化回调 */
    onChange?: (values: string[]) => void;
    /** 选项列表 */
    options: MultiSelectOption[];
    /** 占位文本 */
    placeholder?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否可搜索 */
    showSearch?: boolean;
    /** 搜索占位文本 */
    searchPlaceholder?: string;
    /** 空数据提示 */
    notFoundContent?: React__default.ReactNode;
    /** 全选文本 */
    selectAllText?: string;
    /** 清除全部文本 */
    clearAllText?: string;
    /** 已选显示最大数量（超出显示 +N） */
    maxTagCount?: number;
    /** 最小宽度 */
    minWidth?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 下拉框类名 */
    dropdownClassName?: string;
    /** 表单 name */
    name?: string;
    /** aria-label */
    'aria-label'?: string;
}
/**
 * MultiSelect — 多选下拉选择器组件。
 *
 * 提供多选下拉选择能力，支持搜索过滤、全选、已选标签展示、超出折叠。
 * 自动处理点击外部关闭和键盘导航（Escape 关闭，Enter 确认）。
 *
 * @example
 * <MultiSelect
 *   value={selectedValues}
 *   onChange={setSelectedValues}
 *   options={[
 *     { value: 'apple', label: '苹果' },
 *     { value: 'banana', label: '香蕉' },
 *     { value: 'cherry', label: '樱桃' },
 *   ]}
 *   placeholder="请选择水果"
 * />
 */
declare function MultiSelect({ value, onChange, options, placeholder, disabled, showSearch, searchPlaceholder, notFoundContent, selectAllText, clearAllText, maxTagCount, minWidth, className, style, dropdownClassName, name, 'aria-label': ariaLabel, }: MultiSelectProps): React__default.JSX.Element;

interface RuntimeGovernancePanelPreset<Action extends string = string> {
    action: Action;
    label: string;
    scenario: string;
    nextStep: string;
    riskLevel: 'low' | 'medium' | 'high';
    recommendedAction: string;
    requestEndpoint?: string;
    handlerName?: string;
    payload?: Record<string, unknown>;
}
interface RuntimeGovernancePanelTemplateProps<TReceipt, TPreset extends RuntimeGovernancePanelPreset> {
    presets: readonly TPreset[];
    defaultAction: TPreset['action'];
    initialMessage: string;
    scopeSummary: string;
    summarizeReceipt: (receipt: TReceipt) => string;
    canReplayReceipt: (receipt: TReceipt) => boolean;
    submitPreset: (preset: TPreset, nonce: string) => Promise<TReceipt>;
    queryReceipt: (receipt: TReceipt) => Promise<TReceipt>;
    replayReceipt: (receipt: TReceipt, nonce: string) => Promise<TReceipt>;
    getReceiptScopeLabel?: (receipt: TReceipt | null) => string;
    submitSuccessLabel?: string;
    querySuccessLabel?: string;
    replaySuccessLabel?: string;
    submitErrorMessage: string;
    queryErrorMessage: string;
    replayErrorMessage: string;
}
declare function RuntimeGovernancePanelTemplate<TReceipt, TPreset extends RuntimeGovernancePanelPreset>({ presets, defaultAction, initialMessage, scopeSummary, summarizeReceipt, canReplayReceipt, submitPreset, queryReceipt, replayReceipt, getReceiptScopeLabel, submitSuccessLabel, querySuccessLabel, replaySuccessLabel, submitErrorMessage, queryErrorMessage, replayErrorMessage, }: RuntimeGovernancePanelTemplateProps<TReceipt, TPreset>): React__default.JSX.Element;

interface GovernanceQuickViewSectionProps {
    title?: string;
    titleColor?: string;
    primaryTextColor?: string;
    secondaryTextColor?: string;
    panelStyle?: React__default.CSSProperties;
    summaryLine: string;
    triageLine?: string;
    children?: React__default.ReactNode;
}
interface FoundationConsumerWiringSectionProps {
    title?: string;
    titleColor?: string;
    primaryTextColor?: string;
    secondaryTextColor?: string;
    panelStyle?: React__default.CSSProperties;
    responsibility: string;
    sequenceLine?: string;
    highRiskLine?: string;
    touchpointsLine?: string;
}
declare function GovernanceQuickViewSection({ title, titleColor, primaryTextColor, secondaryTextColor, panelStyle, summaryLine, triageLine, children, }: GovernanceQuickViewSectionProps): React__default.JSX.Element;
declare function FoundationConsumerWiringSection({ title, titleColor, primaryTextColor, secondaryTextColor, panelStyle, responsibility, sequenceLine, highRiskLine, touchpointsLine, }: FoundationConsumerWiringSectionProps): React__default.JSX.Element;

interface PortalConsumerGovernanceSectionProps {
    title?: string;
    titleColor?: string;
    primaryTextColor?: string;
    secondaryTextColor?: string;
    summaryTextColor?: string;
    panelStyle?: React__default.CSSProperties;
    deliverySummary: string;
    responsibility: string;
    detailLines?: string[];
    governanceCodes: string[];
    governanceSummary: string;
    linkedOverview: React__default.ReactNode;
    runtimePanel?: React__default.ReactNode;
}
declare function PortalConsumerGovernanceSection({ title, titleColor, primaryTextColor, secondaryTextColor, summaryTextColor, panelStyle, deliverySummary, responsibility, detailLines, governanceCodes, governanceSummary, linkedOverview, runtimePanel, }: PortalConsumerGovernanceSectionProps): React__default.JSX.Element;

interface FoundationAlertAcknowledgementLike {
    actorId?: string | null;
}
interface FoundationAlertItemLike {
    code: FoundationAlertCode;
    triageSummary?: string;
    triageState?: string;
    recentOperation?: FoundationAlertTimelineEntry | null;
    defaultSummary?: string;
}
interface FoundationAlertTopRiskItemLike extends FoundationAlertItemLike {
    summary: string;
    count: number;
    acknowledgement?: FoundationAlertAcknowledgementLike | null;
}
interface FoundationAlertGovernanceReadModelLike {
    topRisks: FoundationAlertTopRiskItemLike[];
    overviewAlerts: FoundationAlertItemLike[];
    alerts: FoundationAlertItemLike[];
}
interface NavigationBindingsLike {
    searchParams: unknown;
    pathname: string;
    replace: (...args: unknown[]) => void;
}
interface FoundationAlertLinkedOverviewCardDefinition {
    label: string;
    value: string;
    helper: string;
    preferredCodes: FoundationAlertCode[];
}
interface FoundationAlertLinkedOverviewSummaryLike {
    approvalsPending: number;
    approvalsWithFailures: number;
    highRiskAudits: number;
    blockedLedgers: number;
    rotationDueSecrets: number;
    expiredSecrets: number;
    expiringCertificates: number;
    expiredCertificates: number;
    degradedSignals: number;
    attentionRecoveryPlans: number;
    staleDrills: number;
}
type FoundationAlertLinkedOverviewStatsPreset = 'admin' | 'tob' | 'storefront';
interface FoundationAlertLinkedOverviewPalette {
    accentText: string;
    focusBannerBackground: string;
    focusBannerBorder: string;
    actionButtonBorder: string;
    actionButtonBackground: string;
    actionButtonText: string;
    overviewActiveBorder: string;
    overviewActiveBackground: string;
    riskCardBorder: string;
    riskCardBackground: string;
    riskActiveBorder: string;
    riskActiveBackground: string;
    catalogActiveBorder: string;
    catalogActiveBackground: string;
}
interface SearchConfig {
    enabled?: boolean;
    placeholder?: string;
    statusColor?: string;
}
interface FoundationAlertLinkedOverviewPanelRenderArgs {
    focusAlertCode: string;
    focusContext: string;
    timelineQueryKey: string;
    ownerQueryKey: string;
    onFocusChange: (code: string, context: string) => void;
}
interface FoundationAlertLinkedOverviewSectionProps {
    governance: FoundationAlertGovernanceReadModelLike;
    navigationBindings: NavigationBindingsLike;
    palette: FoundationAlertLinkedOverviewPalette;
    overviewStats: FoundationAlertLinkedOverviewCardDefinition[];
    focusQueryKey?: string;
    title?: string;
    description?: string;
    sectionStyle?: React__default.CSSProperties;
    titleStyle?: React__default.CSSProperties;
    descriptionStyle?: React__default.CSSProperties;
    defaultFocusContextPrefix?: string;
    search?: SearchConfig;
    topRisksTitle?: string;
    catalogTitle?: string;
    topRisksEmptyText?: string;
    catalogEmptyText?: string;
    emptyShareStatus?: string;
    buildTopRiskMetaLines?: (item: FoundationAlertTopRiskItemLike) => string[];
    buildCatalogMetaLines?: (item: FoundationAlertItemLike) => string[];
    renderPanel: (args: FoundationAlertLinkedOverviewPanelRenderArgs) => React__default.ReactNode;
}
interface FoundationAlertLinkedOverviewSurfaceProps extends Omit<FoundationAlertLinkedOverviewSectionProps, 'navigationBindings'> {
    router?: unknown;
    pathname?: string;
    searchParams?: unknown;
}
declare function FoundationAlertLinkedOverviewSection({ governance, navigationBindings, palette, overviewStats, focusQueryKey, title, description, sectionStyle, titleStyle, descriptionStyle, defaultFocusContextPrefix, search, topRisksTitle, catalogTitle, topRisksEmptyText, catalogEmptyText, emptyShareStatus, buildTopRiskMetaLines, buildCatalogMetaLines, renderPanel, }: FoundationAlertLinkedOverviewSectionProps): React__default.JSX.Element;
declare function FoundationAlertLinkedOverviewSurface({ router, pathname, searchParams, ...props }: FoundationAlertLinkedOverviewSurfaceProps): React__default.JSX.Element;
declare function createFoundationAlertLinkedOverviewStats(preset: FoundationAlertLinkedOverviewStatsPreset, summary: FoundationAlertLinkedOverviewSummaryLike, topRiskCount?: number): FoundationAlertLinkedOverviewCardDefinition[];

interface FoundationAlertRecord {
    id: string;
    title: string;
    severity: string;
    source: string;
    status: string;
    createdAt: string;
    description?: string;
    owner?: string;
    updatedAt?: string;
}
interface FoundationAlertDetailSection {
    title: string;
    content: React__default.ReactNode;
}
interface FoundationAlertDetailLabels {
    overviewTitle?: string;
    detailsTitle?: string;
    severity?: string;
    status?: string;
    source?: string;
    owner?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    unassignedOwner?: string;
    noDescription?: string;
}
type SeverityVariant = 'info' | 'warning' | 'error' | 'success';
type StatusVariant = 'default' | 'warning' | 'success';
interface FoundationAlertSeverityMeta {
    label: string;
    variant: SeverityVariant;
}
interface FoundationAlertStatusMeta {
    label: string;
    variant: StatusVariant;
}
declare const foundationAlertSeverityLabels: Record<string, FoundationAlertSeverityMeta>;
declare const foundationAlertStatusLabels: Record<string, FoundationAlertStatusMeta>;
interface CreateFoundationAlertMockRecordsOptions {
    count?: number;
    idPrefix?: string;
    titles: readonly string[];
    severityOrder: readonly string[];
    statusOrder: readonly string[];
    sourceOrder: readonly string[];
    createdAtStepMs?: number;
    acknowledgedAtStepMs?: number;
    resolvedAtStepMs?: number;
}
interface FoundationAlertDemoListPageProps {
    title: string;
    description?: string;
    preset: FoundationAlertListPreset;
    count?: number;
    detailHrefBase?: string;
    recordOptions?: Partial<Omit<CreateFoundationAlertMockRecordsOptions, 'count' | 'titles' | 'severityOrder' | 'statusOrder' | 'sourceOrder'>>;
    mapRecords?: (records: FoundationAlertRecord[]) => FoundationAlertRecord[];
    acknowledgeOptions?: UseFoundationAlertDemoAcknowledgeOptions;
}
declare function createFoundationAlertMockRecords({ count, idPrefix, titles, severityOrder, statusOrder, sourceOrder, createdAtStepMs, acknowledgedAtStepMs, resolvedAtStepMs, }: CreateFoundationAlertMockRecordsOptions): FoundationAlertRecord[];
declare function FoundationAlertDemoListPage({ title, description, preset, count, detailHrefBase, recordOptions, mapRecords, acknowledgeOptions, }: FoundationAlertDemoListPageProps): React__default.JSX.Element;
declare function createFoundationAlertDetailMockMap(alerts: FoundationAlertRecord[]): Record<string, FoundationAlertRecord>;
declare const foundationAlertDetailDemoPresets: {
    admin: Record<string, FoundationAlertRecord>;
    storefront: Record<string, FoundationAlertRecord>;
    tob: Record<string, FoundationAlertRecord>;
};
interface FoundationAlertListPreset {
    titles: readonly string[];
    severityOrder: readonly string[];
    statusOrder: readonly string[];
    sourceOrder: readonly string[];
    searchFields?: Array<keyof FoundationAlertRecord | string>;
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    labels?: FoundationAlertListLabels;
    statsCopy?: FoundationAlertListStatsCopy;
    emptyTitle?: string;
    emptyDescription?: string;
    columnLabels?: FoundationAlertTableColumnLabels;
    showSourceFilter?: boolean;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    includeColumns?: FoundationAlertTableColumnKey[];
    omitColumns?: FoundationAlertTableColumnKey[];
    detailLabels?: FoundationAlertDetailLabels;
}
interface FoundationGovernanceAlertReadModelLike {
    generatedAt: string;
    alerts: FoundationAlertCatalogItem[];
    overviewAlerts: Array<Pick<FoundationOperationsAlert, 'code' | 'severity'>>;
}
interface MapFoundationGovernanceAlertsToRecordsOptions {
    sourceMap?: Record<string, string>;
    sourceFallback?: string;
    defaultSeverity?: string;
    mutedStatus?: string;
}
declare const foundationAdminGovernanceSourceLabels: {
    approval: string;
    audit: string;
    security: string;
    runtime: string;
    recovery: string;
    observability: string;
    resilience: string;
    identity: string;
    integration: string;
    trust: string;
    configuration: string;
};
declare function mapFoundationGovernanceAlertsToRecords(governance: FoundationGovernanceAlertReadModelLike, options?: MapFoundationGovernanceAlertsToRecordsOptions): FoundationAlertRecord[];
declare const foundationAlertListDemoPresets: {
    admin: {
        titles: string[];
        severityOrder: string[];
        statusOrder: string[];
        sourceOrder: string[];
        searchFields: string[];
        severityMetaByCode: {
            critical: {
                label: string;
                variant: "error";
            };
            error: {
                label: string;
                variant: "error";
            };
            warning: {
                label: string;
                variant: "warning";
            };
            info: {
                label: string;
                variant: "info";
            };
        };
        statusMetaByCode: {
            open: {
                label: string;
                variant: "default";
            };
            acknowledged: {
                label: string;
                variant: "warning";
            };
            resolved: {
                label: string;
                variant: "success";
            };
        };
        sourceLabels: {
            approval: string;
            audit: string;
            security: string;
            runtime: string;
            recovery: string;
            observability: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            sourceSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            openLabel: string;
            openHint: string;
            criticalLabel: string;
            criticalHint: string;
            sourceLabel: string;
            sourceHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            severity: string;
            title: string;
            source: string;
            status: string;
            createdAt: string;
            actions: string;
        };
        showSourceFilter: true;
        defaultPageSize: number;
        pageSizeOptions: number[];
        detailLabels: {
            overviewTitle: string;
            detailsTitle: string;
            severity: string;
            status: string;
            source: string;
            owner: string;
            description: string;
            createdAt: string;
            updatedAt: string;
            unassignedOwner: string;
            noDescription: string;
        };
    };
    storefront: {
        titles: string[];
        severityOrder: string[];
        statusOrder: string[];
        sourceOrder: string[];
        searchFields: string[];
        severityMetaByCode: {
            error: {
                label: string;
                variant: "error";
            };
            warning: {
                label: string;
                variant: "warning";
            };
            info: {
                label: string;
                variant: "info";
            };
        };
        statusMetaByCode: {
            open: {
                label: string;
                variant: "default";
            };
            acknowledged: {
                label: string;
                variant: "warning";
            };
            resolved: {
                label: string;
                variant: "success";
            };
        };
        sourceLabels: {
            monitoring: string;
            logging: string;
            tracing: string;
            security: string;
            infrastructure: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            openLabel: string;
            openHint: string;
            criticalLabel: string;
            criticalHint: string;
            sourceLabel: string;
            sourceHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            severity: string;
            title: string;
            source: string;
            status: string;
            createdAt: string;
            actions: string;
        };
        showSourceFilter: false;
        defaultPageSize: number;
        pageSizeOptions: number[];
        includeColumns: ("title" | "status" | "severity" | "createdAt")[];
        detailLabels: {
            overviewTitle: string;
            detailsTitle: string;
            severity: string;
            status: string;
            source: string;
            owner: string;
            description: string;
            createdAt: string;
            updatedAt: string;
            unassignedOwner: string;
            noDescription: string;
        };
    };
    tob: {
        titles: string[];
        severityOrder: string[];
        statusOrder: string[];
        sourceOrder: string[];
        searchFields: string[];
        severityMetaByCode: {
            critical: {
                label: string;
                variant: "error";
            };
            error: {
                label: string;
                variant: "error";
            };
            warning: {
                label: string;
                variant: "warning";
            };
            info: {
                label: string;
                variant: "info";
            };
        };
        statusMetaByCode: {
            open: {
                label: string;
                variant: "default";
            };
            acknowledged: {
                label: string;
                variant: "warning";
            };
            resolved: {
                label: string;
                variant: "success";
            };
        };
        sourceLabels: {
            monitoring: string;
            logging: string;
            tracing: string;
            security: string;
            infrastructure: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            sourceSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            openLabel: string;
            openHint: string;
            criticalLabel: string;
            criticalHint: string;
            sourceLabel: string;
            sourceHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            severity: string;
            title: string;
            source: string;
            status: string;
            createdAt: string;
        };
        showSourceFilter: true;
        defaultPageSize: number;
        pageSizeOptions: number[];
        detailLabels: {
            overviewTitle: string;
            detailsTitle: string;
            severity: string;
            status: string;
            source: string;
            owner: string;
            description: string;
            createdAt: string;
            updatedAt: string;
            unassignedOwner: string;
            noDescription: string;
        };
    };
};
declare function createFoundationAdminGovernanceStatsCopy(deliveryMode: 'api' | 'fallback'): FoundationAlertListStatsCopy;
declare const foundationAdminGovernanceListPreset: FoundationAlertListPreset;
interface FoundationAlertTableColumnLabels {
    severity?: string;
    title?: string;
    source?: string;
    status?: string;
    createdAt?: string;
    actions?: string;
}
type FoundationAlertTableColumnKey = 'severity' | 'title' | 'source' | 'status' | 'createdAt' | 'actions';
interface CreateFoundationAlertTableColumnsOptions {
    detailHrefBase?: string;
    renderAction?: (alert: FoundationAlertRecord) => React__default.ReactNode;
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    columnLabels?: FoundationAlertTableColumnLabels;
    includeColumns?: FoundationAlertTableColumnKey[];
    omitColumns?: FoundationAlertTableColumnKey[];
}
interface FoundationAlertTableCardProps {
    alerts: FoundationAlertRecord[];
    detailHrefBase?: string;
    loading?: boolean;
    title?: React__default.ReactNode;
    sort?: DataTableSortConfig | null;
    onSortChange?: React__default.Dispatch<React__default.SetStateAction<DataTableSortConfig | null>>;
    striped?: boolean;
    compact?: boolean;
    renderAction?: (alert: FoundationAlertRecord) => React__default.ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    columnLabels?: FoundationAlertTableColumnLabels;
    includeColumns?: FoundationAlertTableColumnKey[];
    omitColumns?: FoundationAlertTableColumnKey[];
    pagination?: {
        page: number;
        totalPages: number;
        total: number;
        onPageChange: (page: number) => void;
    };
}
declare function FoundationAlertTableCard({ alerts, detailHrefBase, loading, title, sort, onSortChange, striped, compact, renderAction, emptyTitle, emptyDescription, severityMetaByCode, statusMetaByCode, sourceLabels, columnLabels, includeColumns, omitColumns, pagination, }: FoundationAlertTableCardProps): React__default.JSX.Element;
declare function createFoundationAlertTableColumns({ detailHrefBase, renderAction, severityMetaByCode, statusMetaByCode, sourceLabels, columnLabels, includeColumns, omitColumns, }?: CreateFoundationAlertTableColumnsOptions): DataTableColumn<FoundationAlertRecord>[];
interface FoundationAlertDetailViewProps {
    alert?: FoundationAlertRecord | null;
    preset?: FoundationAlertListPreset;
    backHref?: string;
    backLabel?: string;
    notFoundTitle?: string;
    notFoundMessage?: string;
    subtitle?: string;
    extraSections?: FoundationAlertDetailSection[];
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    detailLabels?: FoundationAlertDetailLabels;
    formatDateTime?: (value: string) => string;
}
interface FoundationAlertPresetDetailRouteProps {
    alertId: string;
    alerts: Record<string, FoundationAlertRecord>;
    preset?: FoundationAlertListPreset;
    backHref?: string;
    backLabel?: string;
    notFoundTitle?: string;
    notFoundMessage?: string | ((alertId: string) => string);
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    detailLabels?: FoundationAlertDetailLabels;
    formatDateTime?: (value: string) => string;
}
interface FoundationAlertOverviewReadoutProps {
    alert: FoundationAlertRecord;
    detailLabels?: FoundationAlertDetailLabels;
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
}
interface FoundationAlertDetailsReadoutProps {
    alert: FoundationAlertRecord;
    detailLabels?: FoundationAlertDetailLabels;
    formatDateTime?: (value: string) => string;
}
interface FoundationAlertDrilldownSectionLabels {
    governanceTitle?: string;
    timelineTitle?: string;
    overviewVisibility?: string;
    overviewVisible?: string;
    overviewHidden?: string;
    acknowledgementStatus?: string;
    acknowledgementPending?: string;
    acknowledgementAcked?: string;
    acknowledgementMuted?: string;
    recentActor?: string;
    recentUpdatedAt?: string;
    availableActions?: string;
    noAvailableActions?: string;
    actionDrilldown?: string;
    actionAcknowledge?: string;
    actionMute?: string;
    actionUnmute?: string;
    systemActor?: string;
    timelineNoHistory?: string;
    actor?: string;
    source?: string;
    mutedUntil?: string;
    note?: string;
    noNote?: string;
    noTimestamp?: string;
}
interface BuildFoundationAlertDrilldownSectionsOptions {
    labels?: FoundationAlertDrilldownSectionLabels;
    formatDateTime?: (value?: string | null) => string;
}
declare function formatFoundationAlertDrilldownDateTime(value?: string | null): string;
declare function formatFoundationAlertActionLabel(action: string, labels?: FoundationAlertDrilldownSectionLabels): string;
declare function buildFoundationAlertRecordFromDrilldown(drilldown: FoundationAlertDrilldownResponse): FoundationAlertRecord;
declare function buildFoundationAlertDrilldownSections(drilldown: FoundationAlertDrilldownResponse, options?: BuildFoundationAlertDrilldownSectionsOptions): FoundationAlertDetailSection[];
declare function buildFoundationAlertLytConnectionGovernanceSections(drilldown: FoundationAlertDrilldownResponse): FoundationAlertDetailSection[];
declare function FoundationAlertOverviewReadout({ alert, detailLabels, severityMetaByCode, statusMetaByCode, sourceLabels, }: FoundationAlertOverviewReadoutProps): React__default.JSX.Element;
declare function FoundationAlertDetailsReadout({ alert, detailLabels, formatDateTime, }: FoundationAlertDetailsReadoutProps): React__default.JSX.Element;
declare function FoundationAlertDetailView({ alert, preset, backHref, backLabel, notFoundTitle, notFoundMessage, subtitle, extraSections, severityMetaByCode, statusMetaByCode, sourceLabels, detailLabels, formatDateTime, }: FoundationAlertDetailViewProps): React__default.JSX.Element;
declare function FoundationAlertPresetDetailRoute({ alertId, alerts, preset, backHref, backLabel, notFoundTitle, notFoundMessage, severityMetaByCode, statusMetaByCode, sourceLabels, detailLabels, formatDateTime, }: FoundationAlertPresetDetailRouteProps): React__default.JSX.Element;
interface FoundationAlertListFeedback {
    type: 'error' | 'success';
    message: string;
}
interface FoundationAlertDemoAcknowledgeCopy {
    actionLabel?: string;
    successMessage?: (alertId: string) => string;
    errorMessage?: (alertId: string) => string;
}
interface UseFoundationAlertDemoAcknowledgeOptions {
    delayMs?: number;
    copy?: FoundationAlertDemoAcknowledgeCopy;
}
interface FoundationAlertAcknowledgeActionButtonProps {
    alert: FoundationAlertRecord;
    loading?: boolean;
    onAcknowledge: (alertId: string) => Promise<void> | void;
    label?: string;
}
declare function useFoundationAlertDemoAcknowledge({ delayMs, copy, }?: UseFoundationAlertDemoAcknowledgeOptions): {
    loading: boolean;
    feedback: FoundationAlertListFeedback | null;
    acknowledge: (alertId: string) => Promise<void>;
    dismissFeedback: () => void;
    actionLabel: string;
};
declare function FoundationAlertAcknowledgeActionButton({ alert, loading, onAcknowledge, label, }: FoundationAlertAcknowledgeActionButtonProps): React__default.JSX.Element | null;
interface FoundationAlertListStatsCopy {
    totalLabel?: string;
    totalHint?: (matched: number) => string;
    openLabel?: string;
    openHint?: string;
    criticalLabel?: string;
    criticalHint?: string;
    sourceLabel?: string;
    sourceHint?: string;
}
interface FoundationAlertListLabels {
    all?: string;
    searchPlaceholder?: string;
    statusSectionTitle?: string;
    sourceSectionTitle?: string;
    tableTitle?: (matched: number) => React__default.ReactNode;
}
interface FoundationAlertListPageSectionProps {
    title: string;
    description?: string;
    alerts: FoundationAlertRecord[];
    preset?: FoundationAlertListPreset;
    detailHrefBase?: string;
    searchFields?: Array<keyof FoundationAlertRecord | string>;
    severityOrder?: string[];
    statusOrder?: string[];
    sourceOrder?: string[];
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    labels?: FoundationAlertListLabels;
    statsCopy?: FoundationAlertListStatsCopy;
    showSourceFilter?: boolean;
    renderAction?: (alert: FoundationAlertRecord) => React__default.ReactNode;
    feedback?: FoundationAlertListFeedback | null;
    onDismissFeedback?: () => void;
    emptyTitle?: string;
    emptyDescription?: string;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    columnLabels?: FoundationAlertTableColumnLabels;
    includeColumns?: FoundationAlertTableColumnKey[];
    omitColumns?: FoundationAlertTableColumnKey[];
}
declare function FoundationAlertListPageSection({ title, description, alerts, preset, detailHrefBase, searchFields, severityOrder, statusOrder, sourceOrder, severityMetaByCode, statusMetaByCode, sourceLabels, labels, statsCopy, showSourceFilter, renderAction, feedback, onDismissFeedback, emptyTitle, emptyDescription, defaultPageSize, pageSizeOptions, columnLabels, includeColumns, omitColumns, }: FoundationAlertListPageSectionProps): React__default.JSX.Element;

interface RuntimeOperationRecord {
    id: string;
    type: string;
    targetId: string;
    status: string;
    createdAt: string;
    finishedAt?: string;
}
interface RuntimeOperationReceiptRecord {
    code: string;
    message: string;
    status: string;
    timestamp: string;
}
declare const runtimeOperationStatusVariants: Record<string, 'default' | 'warning' | 'success' | 'error'>;
declare const runtimeOperationStatusLabels: Record<string, string>;
interface CreateRuntimeOperationMockRecordsOptions {
    count?: number;
    idPrefix?: string;
    typeOrder: readonly string[];
    statusOrder: readonly string[];
    targetPrefix?: string;
    targetModulo?: number;
    createdAtStepMs?: number;
    finishedAtStepMs?: number;
}
declare function createRuntimeOperationMockRecords({ count, idPrefix, typeOrder, statusOrder, targetPrefix, targetModulo, createdAtStepMs, finishedAtStepMs, }: CreateRuntimeOperationMockRecordsOptions): RuntimeOperationRecord[];
interface RuntimeOperationDetailMockEntry {
    operation: RuntimeOperationRecord;
    receipts?: RuntimeOperationReceiptRecord[];
}
declare function createRuntimeOperationDetailMockMap(entries: RuntimeOperationDetailMockEntry[]): Record<string, {
    op: RuntimeOperationRecord;
    receipts: RuntimeOperationReceiptRecord[];
}>;
declare const runtimeOperationDetailDemoPresets: {
    storefront: Record<string, {
        op: RuntimeOperationRecord;
        receipts: RuntimeOperationReceiptRecord[];
    }>;
    tob: Record<string, {
        op: RuntimeOperationRecord;
        receipts: RuntimeOperationReceiptRecord[];
    }>;
    admin: Record<string, {
        op: RuntimeOperationRecord;
        receipts: RuntimeOperationReceiptRecord[];
    }>;
};
interface RuntimeOperationListPreset {
    typeOrder: readonly string[];
    statusOrder: readonly string[];
    searchFields?: Array<keyof RuntimeOperationRecord | string>;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    labels?: RuntimeOperationListLabels;
    statsCopy?: RuntimeOperationListStatsCopy;
    emptyTitle?: string;
    emptyDescription?: string;
    columnLabels?: RuntimeOperationTableColumnLabels;
    includeColumns?: RuntimeOperationTableColumnKey[];
    omitColumns?: RuntimeOperationTableColumnKey[];
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    detailLabels?: RuntimeOperationDetailLabels;
}
interface RuntimeOperationDemoListPageProps {
    title: string;
    description?: string;
    preset: RuntimeOperationListPreset;
    count?: number;
    detailHrefBase?: string;
    recordOptions?: Omit<CreateRuntimeOperationMockRecordsOptions, 'typeOrder' | 'statusOrder' | 'count'>;
    mapRecords?: (records: RuntimeOperationRecord[]) => RuntimeOperationRecord[];
}
declare const runtimeOperationListDemoPresets: {
    storefront: {
        typeOrder: string[];
        statusOrder: string[];
        searchFields: string[];
        typeLabels: {
            deploy: string;
            rollback: string;
            scale: string;
            restart: string;
            'config-update': string;
        };
        statusLabels: {
            pending: string;
            running: string;
            completed: string;
            failed: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            typeSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            runningLabel: string;
            runningHint: string;
            failedLabel: string;
            failedHint: string;
            typeLabel: string;
            typeHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            id: string;
            type: string;
            targetId: string;
            status: string;
            createdAt: string;
            finishedAt: string;
        };
        includeColumns: ("status" | "type" | "createdAt" | "id")[];
        defaultPageSize: number;
        pageSizeOptions: number[];
        detailLabels: {
            titlePrefix: string;
            overviewTitle: string;
            timelineTitle: string;
            receiptsTitle: string;
            id: string;
            type: string;
            status: string;
            target: string;
            createdAt: string;
            finishedAt: string;
            inProgress: string;
            noReceipts: string;
            receiptOk: string;
            receiptError: string;
        };
    };
    tob: {
        typeOrder: string[];
        statusOrder: string[];
        searchFields: string[];
        typeLabels: {
            deploy: string;
            rollback: string;
            scale: string;
            restart: string;
            'config-update': string;
        };
        statusLabels: {
            pending: string;
            running: string;
            completed: string;
            failed: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            typeSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            runningLabel: string;
            runningHint: string;
            failedLabel: string;
            failedHint: string;
            typeLabel: string;
            typeHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            id: string;
            type: string;
            targetId: string;
            status: string;
            createdAt: string;
            finishedAt: string;
        };
        detailLabels: {
            titlePrefix: string;
            overviewTitle: string;
            timelineTitle: string;
            receiptsTitle: string;
            id: string;
            type: string;
            status: string;
            target: string;
            createdAt: string;
            finishedAt: string;
            inProgress: string;
            noReceipts: string;
            receiptOk: string;
            receiptError: string;
        };
    };
    admin: {
        typeOrder: string[];
        statusOrder: string[];
        searchFields: string[];
        typeLabels: {
            'runtime-replay': string;
            'secret-rotation': string;
            'approval-execution': string;
            deploy: string;
            rollback: string;
        };
        statusLabels: {
            pending: string;
            running: string;
            completed: string;
            failed: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            typeSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            runningLabel: string;
            runningHint: string;
            failedLabel: string;
            failedHint: string;
            typeLabel: string;
            typeHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            id: string;
            type: string;
            targetId: string;
            status: string;
            createdAt: string;
            finishedAt: string;
        };
        includeColumns: ("status" | "type" | "createdAt" | "id" | "targetId")[];
        defaultPageSize: number;
        pageSizeOptions: number[];
        detailLabels: {
            titlePrefix: string;
            overviewTitle: string;
            timelineTitle: string;
            receiptsTitle: string;
            id: string;
            type: string;
            status: string;
            target: string;
            createdAt: string;
            finishedAt: string;
            inProgress: string;
            noReceipts: string;
            receiptOk: string;
            receiptError: string;
        };
    };
};
declare function RuntimeOperationDemoListPage({ title, description, preset, count, detailHrefBase, recordOptions, mapRecords, }: RuntimeOperationDemoListPageProps): React__default.JSX.Element;
interface RuntimeOperationTableColumnLabels {
    id?: string;
    type?: string;
    targetId?: string;
    status?: string;
    createdAt?: string;
    finishedAt?: string;
}
type RuntimeOperationTableColumnKey = 'id' | 'type' | 'targetId' | 'status' | 'createdAt' | 'finishedAt';
interface CreateRuntimeOperationTableColumnsOptions {
    detailHrefBase?: string;
    detailHrefBuilder?: (operation: RuntimeOperationRecord) => string | undefined;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
    columnLabels?: RuntimeOperationTableColumnLabels;
    includeColumns?: RuntimeOperationTableColumnKey[];
    omitColumns?: RuntimeOperationTableColumnKey[];
}
interface RuntimeOperationsTableCardProps {
    operations: RuntimeOperationRecord[];
    detailHrefBase?: string;
    detailHrefBuilder?: (operation: RuntimeOperationRecord) => string | undefined;
    title?: React__default.ReactNode;
    sort?: DataTableSortConfig | null;
    onSortChange?: React__default.Dispatch<React__default.SetStateAction<DataTableSortConfig | null>>;
    striped?: boolean;
    compact?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
    columnLabels?: RuntimeOperationTableColumnLabels;
    includeColumns?: RuntimeOperationTableColumnKey[];
    omitColumns?: RuntimeOperationTableColumnKey[];
    pagination?: {
        page: number;
        totalPages: number;
        total: number;
        onPageChange: (page: number) => void;
    };
}
declare function RuntimeOperationsTableCard({ operations, detailHrefBase, detailHrefBuilder, title, sort, onSortChange, striped, compact, emptyTitle, emptyDescription, typeLabels, statusLabels, statusVariants, columnLabels, includeColumns, omitColumns, pagination, }: RuntimeOperationsTableCardProps): React__default.JSX.Element;
interface RuntimeOperationDetailViewProps {
    operation?: RuntimeOperationRecord | null;
    receipts?: RuntimeOperationReceiptRecord[];
    preset?: RuntimeOperationListPreset;
    backHref?: string;
    backLabel?: string;
    notFoundTitle?: string;
    notFoundMessage?: string;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    formatDateTime?: (value: string) => string;
}
interface RuntimeOperationPresetDetailRouteProps {
    operationId: string;
    operations: Record<string, {
        op: RuntimeOperationRecord;
        receipts: RuntimeOperationReceiptRecord[];
    }>;
    preset?: RuntimeOperationListPreset;
    backHref?: string;
    backLabel?: string;
    notFoundTitle?: string;
    notFoundMessage?: string | ((operationId: string) => string);
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    formatDateTime?: (value: string) => string;
}
interface RuntimeOperationDetailLabels {
    titlePrefix?: string;
    overviewTitle?: string;
    timelineTitle?: string;
    receiptsTitle?: string;
    id?: string;
    type?: string;
    status?: string;
    target?: string;
    createdAt?: string;
    finishedAt?: string;
    inProgress?: string;
    noReceipts?: string;
    receiptOk?: string;
    receiptError?: string;
}
interface RuntimeOperationReceiptListReadoutProps {
    receipts?: RuntimeOperationReceiptRecord[];
    detailLabels?: RuntimeOperationDetailLabels;
    formatDateTime?: (value: string) => string;
}
interface RuntimeOperationOverviewReadoutProps {
    operation: RuntimeOperationRecord;
    detailLabels?: RuntimeOperationDetailLabels;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
}
interface RuntimeOperationTimelineReadoutProps {
    operation: RuntimeOperationRecord;
    detailLabels?: RuntimeOperationDetailLabels;
    formatDateTime?: (value: string) => string;
}
interface RuntimeOperationTypeReadoutProps {
    type: string;
    typeLabels?: Record<string, string>;
}
interface RuntimeOperationIdReadoutProps {
    id: string;
    href?: string;
}
interface RuntimeOperationTargetReadoutProps {
    targetId: string;
}
interface RuntimeOperationStatusReadoutProps {
    status: string;
    statusLabels?: Record<string, string>;
    statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
    size?: 'sm' | 'md';
}
interface RuntimeOperationDateTimeReadoutProps {
    value?: string;
    fallback?: React__default.ReactNode;
    color?: string;
    fontSize?: number;
    formatDateTime?: (value: string) => string;
}
declare function RuntimeOperationTypeReadout({ type, typeLabels }: RuntimeOperationTypeReadoutProps): React__default.JSX.Element;
declare function RuntimeOperationIdReadout({ id, href }: RuntimeOperationIdReadoutProps): React__default.JSX.Element;
declare function RuntimeOperationTargetReadout({ targetId }: RuntimeOperationTargetReadoutProps): React__default.JSX.Element;
declare function RuntimeOperationStatusReadout({ status, statusLabels, statusVariants, size, }: RuntimeOperationStatusReadoutProps): React__default.JSX.Element;
declare function RuntimeOperationDateTimeReadout({ value, fallback, color, fontSize, formatDateTime, }: RuntimeOperationDateTimeReadoutProps): React__default.JSX.Element;
declare function createRuntimeOperationTableColumns({ detailHrefBase, detailHrefBuilder, typeLabels, statusLabels, statusVariants, columnLabels, includeColumns, omitColumns, }?: CreateRuntimeOperationTableColumnsOptions): DataTableColumn<RuntimeOperationRecord>[];
declare function RuntimeOperationReceiptListReadout({ receipts, detailLabels, formatDateTime, }: RuntimeOperationReceiptListReadoutProps): React__default.JSX.Element;
declare function RuntimeOperationOverviewReadout({ operation, detailLabels, typeLabels, statusLabels, }: RuntimeOperationOverviewReadoutProps): React__default.JSX.Element;
declare function RuntimeOperationTimelineReadout({ operation, detailLabels, formatDateTime, }: RuntimeOperationTimelineReadoutProps): React__default.JSX.Element;
declare function RuntimeOperationDetailView({ operation, receipts, preset, backHref, backLabel, notFoundTitle, notFoundMessage, typeLabels, statusLabels, formatDateTime, }: RuntimeOperationDetailViewProps): React__default.JSX.Element;
declare function RuntimeOperationPresetDetailRoute({ operationId, operations, preset, backHref, backLabel, notFoundTitle, notFoundMessage, typeLabels, statusLabels, formatDateTime, }: RuntimeOperationPresetDetailRouteProps): React__default.JSX.Element;
interface RuntimeOperationListStatsCopy {
    totalLabel?: string;
    totalHint?: (matched: number) => string;
    runningLabel?: string;
    runningHint?: string;
    failedLabel?: string;
    failedHint?: string;
    typeLabel?: string;
    typeHint?: string;
}
interface RuntimeOperationListLabels {
    all?: string;
    searchPlaceholder?: string;
    statusSectionTitle?: string;
    typeSectionTitle?: string;
    tableTitle?: (matched: number) => React__default.ReactNode;
}
interface RuntimeOperationsListPageSectionProps {
    title: string;
    description?: string;
    operations: RuntimeOperationRecord[];
    preset?: RuntimeOperationListPreset;
    detailHrefBase?: string;
    detailHrefBuilder?: (operation: RuntimeOperationRecord) => string | undefined;
    searchFields?: Array<keyof RuntimeOperationRecord | string>;
    statusOrder?: string[];
    typeOrder?: string[];
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
    labels?: RuntimeOperationListLabels;
    statsCopy?: RuntimeOperationListStatsCopy;
    emptyTitle?: string;
    emptyDescription?: string;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    columnLabels?: RuntimeOperationTableColumnLabels;
    includeColumns?: RuntimeOperationTableColumnKey[];
    omitColumns?: RuntimeOperationTableColumnKey[];
}
declare function RuntimeOperationsListPageSection({ title, description, operations, preset, detailHrefBase, detailHrefBuilder, searchFields, statusOrder, typeOrder, typeLabels, statusLabels, statusVariants, labels, statsCopy, emptyTitle, emptyDescription, defaultPageSize, pageSizeOptions, columnLabels, includeColumns, omitColumns, }: RuntimeOperationsListPageSectionProps): React__default.JSX.Element;

interface SearchFilterInputProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (event: React__default.KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
    debounceMs?: number;
    /** 显示清空按钮（默认 true） */
    clearable?: boolean;
    /** 宽度覆盖 */
    width?: number | string;
    /** 禁用状态 */
    disabled?: boolean;
}
declare function SearchFilterInput({ value, onChange, onKeyDown, placeholder, debounceMs, clearable, width, disabled, }: SearchFilterInputProps): React__default.JSX.Element;

interface FormFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    required?: boolean;
    hint?: string;
    helper?: string;
    disabled?: boolean;
    compact?: boolean;
    children: React__default.ReactNode;
}
declare function FormField({ label, htmlFor, error, required, hint, helper, disabled, compact, children, }: FormFieldProps): React__default.JSX.Element;

interface LegacyFormSubmitState<T = unknown> {
    isSubmitting: boolean;
    errorMessage?: string;
    successMessage?: string;
    hasSubmitted?: boolean;
    result?: T;
}
interface FormSubmitFeedbackProps<T = unknown> {
    state?: LegacyFormSubmitState<T>;
    submitting?: boolean;
    error?: string;
    success?: string;
    onRetry?: () => void | Promise<void | T | undefined>;
    onDismissError?: () => void;
    onDismissSuccess?: () => void;
    renderSuccess?: (message: string) => React__default.ReactNode;
    renderError?: (message: string) => React__default.ReactNode;
}
declare function FormSubmitFeedback<T = unknown>({ state, submitting, error, success, onRetry, onDismissError, onDismissSuccess, renderSuccess, renderError, }: FormSubmitFeedbackProps<T>): React__default.JSX.Element | null;
interface UseFormSubmitOptions<T> {
    onSubmit: () => Promise<T>;
    successMessage?: string | ((result: T) => string);
    defaultErrorMessage?: string;
}
declare function useFormSubmit<T = void>({ onSubmit, successMessage, defaultErrorMessage, }: UseFormSubmitOptions<T>): {
    state: LegacyFormSubmitState<T>;
    submit: () => Promise<T | undefined>;
    reset: () => void;
    clearError: () => void;
    clearSuccess: () => void;
    submitting: boolean;
    error: string | undefined;
    success: string | undefined;
};

type SubmitButtonVariant = 'primary' | 'secondary' | 'danger' | 'brand';
interface SubmitButtonProps {
    /** Whether the button is in a submitting/loading state */
    loading?: boolean;
    /** Label shown when not loading */
    label?: string;
    /** Label shown when loading (default: "提交中...") */
    loadingLabel?: string;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Visual variant */
    variant?: SubmitButtonVariant;
    /** Click handler (ignored when loading) */
    onClick?: (e: React__default.MouseEvent<HTMLButtonElement>) => void;
    /** HTML button type */
    type?: 'submit' | 'button' | 'reset';
    /** Additional inline styles */
    style?: React__default.CSSProperties;
    /** Additional className */
    className?: string;
    /** Children content (overrides label/loading when provided) */
    children?: React__default.ReactNode;
}
declare const SubmitButton: React__default.ForwardRefExoticComponent<SubmitButtonProps & React__default.RefAttributes<HTMLButtonElement>>;

interface InfoRowProps {
    label: string;
    value: React__default.ReactNode;
    labelColor?: string;
    valueColor?: string;
    labelFontSize?: number;
    valueFontSize?: number;
    gap?: number;
}
declare function InfoRow({ label, value, labelColor, valueColor, labelFontSize, valueFontSize, gap, }: InfoRowProps): React__default.JSX.Element;
interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}
declare function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel, loading, }: ConfirmDialogProps): React__default.JSX.Element | null;

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React__default.ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
    icon?: boolean;
    className?: string;
    style?: React__default.CSSProperties;
}
declare function Alert({ variant, title, children, dismissible, onDismiss, icon, className, style, }: AlertProps): React__default.JSX.Element | null;
interface UseAlertOptions {
    variant?: AlertVariant;
    dismissAfterMs?: number;
}
interface AlertState {
    visible: boolean;
    variant: AlertVariant;
    title: string;
    message: string;
}
declare function useAlert(defaultOptions?: UseAlertOptions): {
    alert: AlertState | null;
    show: (title: string, message: string, variant?: AlertVariant) => void;
    info: (title: string, message: string) => void;
    success: (title: string, message: string) => void;
    warning: (title: string, message: string) => void;
    danger: (title: string, message: string) => void;
    dismiss: () => void;
};

interface CopyToClipboardProps {
    /** 要复制的文本 */
    text: string;
    /** 复制按钮的标签，不传则只显示图标 */
    label?: string;
    /** 复制成功后的提示文本 */
    successLabel?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 大小变体 */
    size?: 'sm' | 'md';
    /** 是否以图标按钮形式（紧凑模式） */
    iconOnly?: boolean;
    /** 自定义 className（预留） */
    className?: string;
}
/**
 * CopyToClipboard — 一键复制组件。
 *
 * 点击后将 text 写入系统剪贴板，并短暂显示复制成功反馈。
 * 支持紧凑图标模式（详情页 ID 旁）和完整标签模式（代码块复制）。
 *
 * @example
 * // 紧凑图标模式 — 复制 ID
 * <CopyToClipboard text={record.id} size="sm" iconOnly />
 *
 * @example
 * // 完整标签模式 — 复制代码
 * <CopyToClipboard text={codeSnippet} label="复制代码" successLabel="已复制！" />
 */
declare function CopyToClipboard({ text, label, successLabel, style, size, iconOnly, }: CopyToClipboardProps): React__default.JSX.Element;

interface VirtualizedListRow<T> {
    key: string;
    data: T;
}
interface VirtualizedListProps<T> {
    /** 数据行列表 */
    rows: VirtualizedListRow<T>[];
    /** 每行渲染函数 */
    renderRow: (row: VirtualizedListRow<T>, index: number) => React__default.ReactNode;
    /** 每行高度 (px)，固定高度模式使用 */
    rowHeight?: number;
    /** 可变行高：根据行数据返回高度 */
    rowHeightFn?: (row: VirtualizedListRow<T>, index: number) => number;
    /** 容器高度，不传则自适应父容器 */
    height?: number;
    /** 容器宽度 */
    width?: string | number;
    /** 缓冲区行数（超出可视区域的预渲染行数），默认 3 */
    overscan?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 空数据展示 */
    emptyText?: React__default.ReactNode;
    /** 行点击 */
    onRowClick?: (row: VirtualizedListRow<T>, index: number) => void;
    /** 滚动回调 */
    onScroll?: (scrollTop: number) => void;
    /** 是否禁用 */
    disabled?: boolean;
}
/**
 * VirtualizedList — 虚拟滚动列表组件。
 *
 * 只渲染可视区域内的行，通过占位元素撑开总高度实现滚动。
 * 支持固定行高和动态行高两种模式。
 *
 * @example
 * // 固定行高
 * <VirtualizedList
 *   rows={items.map((item, i) => ({ key: String(i), data: item }))}
 *   rowHeight={48}
 *   height={600}
 *   renderRow={(row, index) => <div>{row.data.name}</div>}
 * />
 *
 * @example
 * // 动态行高
 * <VirtualizedList
 *   rows={items.map((item, i) => ({ key: String(i), data: item }))}
 *   rowHeightFn={(row) => row.data.expanded ? 120 : 48}
 *   height={600}
 *   renderRow={(row, index) => <ExpandableRow data={row.data} />}
 * />
 */
declare function VirtualizedList<T>({ rows, renderRow, rowHeight, rowHeightFn, height: heightProp, width, overscan, className, style, emptyText, onRowClick, onScroll, disabled, }: VirtualizedListProps<T>): React__default.JSX.Element;

interface UploadedFile {
    /** Unique id assigned on upload */
    id: string;
    /** Original file name */
    name: string;
    /** Size in bytes */
    size: number;
    /** MIME type */
    type: string;
    /** Upload progress 0–100; -1 means failed */
    progress: number;
    /** Error message when progress === -1 */
    error?: string;
    /** Preview URL for images */
    preview?: string;
}
interface FileUploadProps {
    /** Accepted MIME types (e.g. "image/*,.pdf") */
    accept?: string;
    /** Maximum number of files allowed (default 1) */
    maxFiles?: number;
    /** Maximum individual file size in bytes (default 10 MB) */
    maxSize?: number;
    /** Whether to allow multiple file selection (default false) */
    multiple?: boolean;
    /** Show image previews for image/* types (default true) */
    showPreview?: boolean;
    /** Callback when files are added; return false to reject */
    onFilesAdded?: (files: File[]) => boolean | void;
    /** Callback when a file is removed by user */
    onFileRemoved?: (file: UploadedFile) => void;
    /** Controlled file list (if you want external control) */
    files?: UploadedFile[];
    /** Disabled state */
    disabled?: boolean;
    /** Custom placeholder text */
    placeholder?: string;
    /** Test id */
    'data-testid'?: string;
    /** Visual variant */
    variant?: 'default' | 'compact';
}
/**
 * FileUpload — drag-and-drop / click-to-browse file upload component.
 *
 * Supports single or multiple file selection, drag-and-drop, image previews,
 * progress simulation, file removal, and size/type validation.
 */
declare function FileUpload({ accept, maxFiles, maxSize, multiple, showPreview, onFilesAdded, onFileRemoved, files: controlledFiles, disabled, placeholder, 'data-testid': dataTestId, variant, }: FileUploadProps): React__default.JSX.Element;

type SwitchSize = 'sm' | 'md' | 'lg';
interface SwitchProps {
    /** Controlled checked state */
    checked?: boolean;
    /** Default unchecked (uncontrolled) */
    defaultChecked?: boolean;
    /** Called on toggle with new checked value */
    onChange?: (checked: boolean) => void;
    /** Disabled state */
    disabled?: boolean;
    /** Visual size */
    size?: SwitchSize;
    /** Accessible label rendered next to the switch */
    label?: string;
    /** Label position relative to the switch */
    labelPosition?: 'left' | 'right';
    /** Color when checked */
    checkedColor?: string;
    /** Color when unchecked */
    uncheckedColor?: string;
    /** Thumb color */
    thumbColor?: string;
    /** ARIA label for the switch input (falls back to `label` when set) */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style override */
    style?: React__default.CSSProperties;
}
/**
 * Switch — toggle control for binary settings.
 *
 * Supports controlled / uncontrolled usage, three sizes, custom colors,
 * labels on either side, disabled state, and full ARIA support.
 */
declare function Switch({ checked, defaultChecked, onChange, disabled, size, label, labelPosition, checkedColor, uncheckedColor, thumbColor, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, }: SwitchProps): React__default.JSX.Element;

type RadioSize = 'sm' | 'md' | 'lg';
type RadioDirection = 'horizontal' | 'vertical';
interface RadioOption<T extends string = string> {
    /** 选项值 */
    value: T;
    /** 选项标签 */
    label: string;
    /** 禁用该选项 */
    disabled?: boolean;
    /** 辅助说明文字 */
    description?: string;
}
interface RadioGroupProps<T extends string = string> {
    /** 选项列表 */
    options: RadioOption<T>[];
    /** 受控：当前选中值 */
    value?: T;
    /** 非受控：默认选中值 */
    defaultValue?: T;
    /** 值变化回调 */
    onChange?: (value: T) => void;
    /** 字段名（用于表单提交） */
    name?: string;
    /** 排列方向 */
    direction?: RadioDirection;
    /** 尺寸 */
    size?: RadioSize;
    /** 是否禁用整个组 */
    disabled?: boolean;
    /** 是否必选标记 */
    required?: boolean;
    /** 组标签 */
    label?: string;
    /** 错误信息 */
    error?: string;
    /** 辅助提示 */
    hint?: string;
    /** data-testid 前缀 */
    'data-testid'?: string;
    /** 额外 className */
    className?: string;
    /** 内联样式覆盖 */
    style?: React__default.CSSProperties;
    /** 单个选项样式覆盖 */
    optionStyle?: React__default.CSSProperties;
}
/**
 * RadioGroup — 单选组组件。
 *
 * 支持受控/非受控、水平/垂直排列、三种尺寸、禁用、错误态、
 * 单选项附带描述，以及完整键盘 & ARIA 可访问性。
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   options={[
 *     { value: 'active', label: '启用' },
 *     { value: 'inactive', label: '停用', description: '停用后不可恢复' },
 *   ]}
 *   value={status}
 *   onChange={setStatus}
 *   direction="horizontal"
 * />
 * ```
 */
declare function RadioGroup<T extends string = string>({ options, value: controlledValue, defaultValue, onChange, name, direction, size, disabled, required, label: groupLabel, error, hint, 'data-testid': dataTestId, className, style, optionStyle, }: RadioGroupProps<T>): React__default.JSX.Element;

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
interface TooltipProps {
    /** 提示文字 */
    content: React__default.ReactNode;
    /** 触发元素 */
    children: React__default.ReactNode;
    /** 弹出方向 */
    placement?: TooltipPlacement;
    /** 延迟显示毫秒 */
    delayMs?: number;
    /** 最大宽度 */
    maxWidth?: number;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 自定义类名 */
    className?: string;
}
declare const Tooltip: React__default.NamedExoticComponent<TooltipProps>;

type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
interface PopoverProps {
    /** 触发器元素 */
    trigger: React__default.ReactNode;
    /** popover 弹层内容 */
    children: React__default.ReactNode;
    /** 可选标题 */
    title?: string;
    /** 弹出方向，默认 bottom */
    placement?: PopoverPlacement;
    /** 触发方式，默认 click */
    triggerMode?: 'click' | 'hover';
    /** 弹出后是否显示关闭按钮 */
    showClose?: boolean;
    /** 最大宽度 */
    maxWidth?: number;
    /** 最小宽度 */
    minWidth?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 打开/关闭回调 */
    onOpenChange?: (open: boolean) => void;
}
declare const Popover: React__default.NamedExoticComponent<PopoverProps>;

type TimelineItemVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
interface TimelineItem {
    /** Unique key for the item */
    key: string;
    /** Timestamp or heading text */
    heading: string;
    /** Optional subtitle / secondary text */
    subtitle?: string;
    /** Body content */
    content?: React__default.ReactNode;
    /** Visual variant for the dot + connecting line */
    variant?: TimelineItemVariant;
    /** Custom icon instead of the default dot */
    icon?: React__default.ReactNode;
    /** Whether this item represents a pending / future state */
    pending?: boolean;
}
interface TimelineProps {
    /** Ordered list of timeline items (top to bottom) */
    items: TimelineItem[];
    /** Test id */
    'data-testid'?: string;
}
declare const Timeline: React__default.FC<TimelineProps>;

interface FoundationAlertPanelPalette {
    background?: string;
    border?: string;
    text?: string;
    accentText?: string;
    mutedText?: string;
    cardBackground?: string;
    cardBorder?: string;
    toolbarBackground?: string;
    toolbarBorder?: string;
    badgeBackground?: string;
    badgeText?: string;
    badgeBorder?: string;
}
interface FoundationAlertPanelToolbarPalette {
    ackBackground?: string;
    ackText?: string;
    muteBackground?: string;
    muteText?: string;
    unmuteBackground?: string;
    unmuteText?: string;
    dropdownBackground?: string;
    dropdownBorder?: string;
    dropdownText?: string;
}
interface FoundationAlertPanelThemePreset {
    palette: FoundationAlertPanelPalette;
    toolbarPalette: FoundationAlertPanelToolbarPalette;
    runtimeCallbackAccentColor?: string;
    runtimeCallbackBorderColor?: string;
}
declare const foundationAlertPanelThemePresets: {
    admin: FoundationAlertPanelThemePreset;
    tob: FoundationAlertPanelThemePreset;
    storefront: FoundationAlertPanelThemePreset;
};
declare function useFoundationAsyncLoader<T>(loader: () => Promise<T>): () => Promise<T>;
interface GovernanceAlert {
    code: string;
    message?: string;
    severity?: string;
    acknowledged?: boolean;
    muted?: boolean;
    source?: string;
    owner?: string;
}
interface GovernanceReadModel {
    alerts: any[];
    summary: {
        total: number;
        critical: number;
        warning: number;
        info: number;
        acknowledged: number;
        muted: number;
    };
}
interface FoundationAlertPanelClientAccess {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
    client?: any;
    ackAlert?: (alertCode: string) => Promise<void>;
    muteAlert?: (alertCode: string) => Promise<void>;
    unmuteAlert?: (alertCode: string) => Promise<void>;
    loadDrilldown?: (code: string) => Promise<any>;
    executeMutation?: (action: FoundationAlertMutationKind, code: string) => Promise<any>;
}
interface FoundationAlertPanelFrameProps {
    router?: {
        push: (url: string) => void;
        replace: (url: string) => void;
    };
    pathname?: string;
    searchParams?: any;
    panelAccess: FoundationAlertPanelClientAccess;
    palette: FoundationAlertPanelPalette;
    focusContext?: string;
    initialGovernance: any;
    focusAlertCode?: string;
    onFocusChange?: (code: string, context: string) => void;
    loadGovernance: () => Promise<any>;
    timelineQueryKey?: string;
    ownerQueryKey?: string;
    sourceQueryKey?: string;
    toolbarPalette: FoundationAlertPanelToolbarPalette;
    runtimeCallbackAccentColor?: string;
    runtimeCallbackBorderColor?: string;
}
interface FoundationAlertPanelSurfaceProps<TGovernance = GovernanceReadModel> {
    router?: FoundationAlertPanelFrameProps['router'];
    pathname?: string;
    searchParams?: FoundationAlertPanelFrameProps['searchParams'];
    panelAccess: FoundationAlertPanelClientAccess;
    themePreset: keyof typeof foundationAlertPanelThemePresets;
    initialGovernance: TGovernance;
    loadGovernance: () => Promise<TGovernance>;
    focusAlertCode?: string;
    focusContext?: string;
    timelineQueryKey?: string;
    ownerQueryKey?: string;
    sourceQueryKey?: string;
    onFocusChange?: (code: string, context: string) => void;
}
declare function FoundationAlertPanelFrame({ panelAccess, palette, focusContext, initialGovernance, focusAlertCode, onFocusChange, loadGovernance, timelineQueryKey, ownerQueryKey, sourceQueryKey, toolbarPalette, runtimeCallbackAccentColor, runtimeCallbackBorderColor, }: FoundationAlertPanelFrameProps): React__default.JSX.Element;
declare function FoundationAlertPanelSurface<TGovernance = GovernanceReadModel>({ router, pathname, searchParams, panelAccess, themePreset, initialGovernance, loadGovernance, focusAlertCode, focusContext, timelineQueryKey, ownerQueryKey, sourceQueryKey, onFocusChange }: FoundationAlertPanelSurfaceProps<TGovernance>): React__default.JSX.Element;

interface FoundationAlertPanelReadoutPalette {
    surface?: string;
    border?: string;
    text?: string;
    muted?: string;
    accent?: string;
    row?: string;
    rowAlt?: string;
    sectionBackground?: string;
    sectionBorder?: string;
    accentText?: string;
    feedbackBackground?: string;
    feedbackText?: string;
    chipBorder?: string;
    chipBackground?: string;
    chipText?: string;
    selectedButtonBorder?: string;
    selectedButtonBackground?: string;
    filterActiveBorder?: string;
    filterActiveBackground?: string;
    shortcutActiveBorder?: string;
    shortcutActiveBackground?: string;
}
declare function createFoundationAlertPanelSectionStyle(palette?: FoundationAlertPanelReadoutPalette): React__default.CSSProperties;
declare function createFoundationAlertPanelSelectionButtonStyle(palette?: FoundationAlertPanelReadoutPalette, selected?: boolean, _variant?: 'quick' | 'default'): React__default.CSSProperties;
declare function createFoundationAlertPanelActionButtonStyle(bg: string): React__default.CSSProperties;
declare function createFoundationAlertPanelFeedbackStyle(palette?: FoundationAlertPanelReadoutPalette): React__default.CSSProperties;
declare function createFoundationAlertPanelFilterButtonStyle(palette?: FoundationAlertPanelReadoutPalette, selected?: boolean): React__default.CSSProperties;
declare function createFoundationAlertPanelFilterChipStyle(palette?: FoundationAlertPanelReadoutPalette): React__default.CSSProperties;
declare function createFoundationAlertPanelSummaryCardStyle(palette?: FoundationAlertPanelReadoutPalette): React__default.CSSProperties;
declare function createFoundationAlertPanelShortcutCardStyle(palette: FoundationAlertPanelReadoutPalette | undefined, baseStyle: React__default.CSSProperties, active?: boolean): React__default.CSSProperties;
interface FoundationAlertGovernanceAlert {
    code: string;
    title?: string;
    defaultSummary?: string;
    severity?: string;
    severityPolicy?: string;
    source?: string;
    sourceModules?: string[];
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    visibleInOverview?: boolean;
    availableActions?: string[];
}
interface FoundationAlertTimelineItem {
    id?: string;
    source?: string | null;
    status?: string;
    severity?: string;
    timestamp?: string;
    createdAt?: string;
    message?: string;
    note?: string | null;
    actorId?: string | null;
    action?: string;
    visibleInOverview?: boolean;
}
interface FoundationAlertSourceSummaryItem {
    source: string;
    count: number;
    latestTimestamp?: string | null;
}
interface FoundationAlertOwnerSummaryItem {
    actorId: string;
    count: number;
    latestTimestamp?: string | null;
}
interface FoundationAlertFilterSummaryItem {
    label: string;
    value: string;
    count: number;
}
interface FoundationAlertTimelineMetrics {
    total: number;
    filtered?: number;
    visibleInOverview?: number;
    hiddenFromOverview?: number;
    latestTimestamp?: string | null;
    latestMatchedAt?: string | null;
}
interface FoundationAlertFilterState {
    action?: string;
    severity?: string;
    status?: string;
    source?: string;
    owner?: string;
}
interface FoundationAlertPanelSelectedAlertReadoutProps {
    palette?: FoundationAlertPanelReadoutPalette;
    selectedAlert: FoundationAlertGovernanceAlert;
    currentOwner?: string;
    optimisticOverviewVisibility?: boolean | string;
    drilldown?: unknown;
    currentNote?: string | null;
    recentTimeline?: Array<FoundationAlertTimelineItem | FoundationAlertTimelineEntry>;
    runtimeCallbackDrilldown?: FoundationAlertRuntimeCallbackStalledDetail | unknown | null;
}
declare function FoundationAlertPanelSelectedAlertReadout({ palette, selectedAlert, currentOwner, optimisticOverviewVisibility, currentNote, recentTimeline, runtimeCallbackDrilldown, }: FoundationAlertPanelSelectedAlertReadoutProps): React__default.JSX.Element;
interface FoundationAlertPanelSourceSummaryReadoutProps {
    palette?: FoundationAlertPanelReadoutPalette;
    items?: FoundationAlertSourceSummaryItem[];
}
declare function FoundationAlertPanelSourceSummaryReadout({ palette, items, }: FoundationAlertPanelSourceSummaryReadoutProps): React__default.JSX.Element;
interface FoundationAlertPanelOwnerSummaryReadoutProps {
    palette?: FoundationAlertPanelReadoutPalette;
    items?: FoundationAlertOwnerSummaryItem[];
}
declare function FoundationAlertPanelOwnerSummaryReadout({ palette, items, }: FoundationAlertPanelOwnerSummaryReadoutProps): React__default.JSX.Element;
interface FoundationAlertPanelSummaryDigestReadoutProps {
    palette?: FoundationAlertPanelReadoutPalette;
    filterSummary?: FoundationAlertFilterSummaryItem[] | string;
    filterDeepLinkPreview?: string | null;
    activeFilterCount?: number;
    filterState?: FoundationAlertFilterState;
    timelineMetrics?: FoundationAlertTimelineMetrics | FoundationAlertTimelineMetrics$1;
    latestMatchedTimeline?: FoundationAlertTimelineItem | FoundationAlertTimelineEntry | null;
    defaultLatestSource?: string | null;
    timelineDigest?: string | FoundationAlertTimelineDigest | null;
    sourceSummary?: FoundationAlertSourceSummaryItem[];
}
declare function FoundationAlertPanelSummaryDigestReadout({ palette, filterSummary, filterDeepLinkPreview, activeFilterCount, timelineMetrics, latestMatchedTimeline, defaultLatestSource, timelineDigest, }: FoundationAlertPanelSummaryDigestReadoutProps): React__default.JSX.Element;
interface FoundationAlertPanelTimelineReadoutProps {
    palette?: FoundationAlertPanelReadoutPalette;
    recentTimeline?: Array<FoundationAlertTimelineItem | FoundationAlertTimelineEntry>;
    filteredTimeline?: Array<FoundationAlertTimelineItem | FoundationAlertTimelineEntry>;
    filterEmptyState?: boolean | string;
}
declare function FoundationAlertPanelTimelineReadout({ palette, recentTimeline, filteredTimeline, filterEmptyState, }: FoundationAlertPanelTimelineReadoutProps): React__default.JSX.Element;
interface FoundationAlertGovernance<TAlert extends {
    code: string;
} = FoundationAlertGovernanceAlert, TTopRisk extends {
    code: string;
} = TAlert> {
    alerts: TAlert[];
    topRisks?: TTopRisk[];
    generatedAt?: string;
    deliveryMode?: string;
}
interface UseFoundationAlertGovernanceStateOptions<TGovernance extends FoundationAlertGovernance<{
    code: string;
}, {
    code: string;
}>> {
    initialGovernance?: TGovernance;
    focusAlertCode?: string;
    loadGovernance?: () => Promise<TGovernance>;
}
interface UseFoundationAlertGovernanceStateReturn<TGovernance extends FoundationAlertGovernance<{
    code: string;
}, {
    code: string;
}>> {
    governance: TGovernance;
    refreshGovernance: () => Promise<void>;
    selectedAlertCode: string | undefined;
    setSelectedAlertCode: React__default.Dispatch<React__default.SetStateAction<string | undefined>>;
}
declare function useFoundationAlertGovernanceState<TGovernance extends FoundationAlertGovernance<{
    code: string;
}, {
    code: string;
}>>({ initialGovernance, focusAlertCode, loadGovernance, }: UseFoundationAlertGovernanceStateOptions<TGovernance>): UseFoundationAlertGovernanceStateReturn<TGovernance>;
interface UseFoundationAlertDrilldownQueryOptions<TData> {
    selectedAlertCode?: string;
    loadDrilldown?: (code: string) => Promise<TData>;
    setActionError?: (error: string | null) => void;
}
declare function useFoundationAlertDrilldownQuery<TData = unknown>({ selectedAlertCode, loadDrilldown, setActionError, }: UseFoundationAlertDrilldownQueryOptions<TData>): TData | null;
type FoundationAlertMutationAction = 'ACK' | 'MUTE' | 'UNMUTE';
interface FoundationAlertMutation {
    acknowledgement?: {
        status?: string;
    };
    history?: Array<{
        action: string;
        timestamp: string;
    }>;
}
interface UseFoundationAlertMutationControllerOptions {
    selectedAlertCode?: string;
    setActionError?: (error: string | null) => void;
    applyMutation: (mutation: unknown | null) => void;
    refreshGovernance?: () => Promise<void>;
    refreshView?: () => void;
    executeMutation?: (action: FoundationAlertMutationAction, code: string) => Promise<unknown>;
}
interface UseFoundationAlertMutationControllerReturn {
    pendingMutationAction: FoundationAlertMutationAction | null;
    runMutation: (action: FoundationAlertMutationAction, code?: string) => Promise<void>;
}
declare function useFoundationAlertMutationController({ selectedAlertCode, setActionError, applyMutation, refreshGovernance, refreshView, executeMutation, }: UseFoundationAlertMutationControllerOptions): UseFoundationAlertMutationControllerReturn;
interface UseFoundationAlertTimelineQueryStateOptions<TFilterState extends FoundationAlertFilterState> {
    searchParams?: URLSearchParams;
    pathname?: string;
    replace?: (href: string) => void;
    timelineQueryKey?: string;
    ownerQueryKey?: string;
    sourceQueryKey?: string;
    filterState: TFilterState;
    setFilterState: React__default.Dispatch<React__default.SetStateAction<TFilterState>>;
    availableOwners?: string[];
    availableSources?: string[];
}
interface FilterShortcut {
    key: string;
    label: string;
    helper: string;
    filters: FoundationAlertFilterState;
}
interface UseFoundationAlertTimelineQueryStateReturn {
    applyShortcut: (filters: FoundationAlertFilterState) => void;
    clearAllFilters: () => void;
    clearFilter: (key: keyof FoundationAlertFilterState) => void;
    filterDeepLinkPreview: string | null;
    handleOwnerFilterChange: (owner: string) => void;
    handleSourceFilterChange: (source: string) => void;
    handleTimelineFilterChange: (filter: string) => void;
    activeFilterChips: Array<{
        kind: keyof FoundationAlertFilterState;
        label: string;
        value: string;
    }>;
    filterEmptyState: boolean;
    filterSummary: FoundationAlertFilterSummaryItem[];
    hasActiveFilters: boolean;
    shortcutPresets: FilterShortcut[];
}
declare function useFoundationAlertTimelineQueryState<TFilterState extends FoundationAlertFilterState>({ pathname, timelineQueryKey, ownerQueryKey, sourceQueryKey, filterState, setFilterState, }: UseFoundationAlertTimelineQueryStateOptions<TFilterState>): UseFoundationAlertTimelineQueryStateReturn;
interface UseFoundationAlertViewLinkControllerReturn {
    copiedViewMessage: string | null;
    copyCurrentViewLink: () => Promise<void>;
}
declare function useFoundationAlertViewLinkController(): UseFoundationAlertViewLinkControllerReturn;
interface UseFoundationAlertFocusSyncOptions {
    selectedAlertCode?: string;
    focusAlertCode?: string;
    focusContext?: string;
    onFocusChange?: (code: string, context: string) => void;
}
declare function useFoundationAlertFocusSync({ selectedAlertCode, focusAlertCode, focusContext, onFocusChange, }: UseFoundationAlertFocusSyncOptions): void;

/** 字段验证规则 */
interface FormPageFieldRule {
    /** 验证函数，返回错误信息或 null */
    validate: (value: unknown) => string | null;
}
/** 表单字段定义 */
interface FormPageField<T = Record<string, unknown>> {
    /** 字段 key */
    key: keyof T & string;
    /** 标签 */
    label: string;
    /** 是否必填 */
    required?: boolean;
    /** 占位符 */
    placeholder?: string;
    /** 帮助文本 */
    helper?: string;
    /** 初始值 */
    initialValue?: T[keyof T & string];
    /** 输入类型 */
    type?: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'date';
    /** Select 选项 */
    options?: {
        label: string;
        value: string;
    }[];
    /** 验证规则 */
    rules?: FormPageFieldRule[];
}
/** 表单页标题 & 描述区域 */
interface FormPageScaffoldMeta {
    title: string;
    description?: string;
    /** 删除按钮配置 */
    deleteAction?: {
        label: string;
        onDelete: () => void | Promise<void>;
        confirmText?: string;
    };
}
/** 向服务端提交的数据转换 */
interface FormPageSubmitResult<T = Record<string, unknown>> {
    data: T;
    message?: string;
}
interface FormPageScaffoldProps<T extends Record<string, unknown> = Record<string, unknown>> {
    /** 页面元信息 */
    meta: FormPageScaffoldMeta;
    /** 字段定义 */
    fields: FormPageField<T>[];
    /** 提交处理（返回 null 表示失败） */
    onSubmit: (data: T) => Promise<FormPageSubmitResult<T> | null>;
    /** 表单变化回调 */
    onChange?: (key: keyof T & string, value: unknown) => void;
    /** 自定义顶层操作按钮 */
    topActions?: React__default.ReactNode;
    /** 提交按钮文案 */
    submitLabel?: string;
    /** 提交按钮变体 */
    submitVariant?: SubmitButtonVariant;
    /** 返回路径 */
    backUrl?: string;
    /** 页面最大宽度 */
    maxWidth?: number;
    /** 自定义样式 */
    className?: string;
    /** 自定义底部 */
    footer?: React__default.ReactNode;
    /** 自定义成功回调 */
    onSuccess?: (result: FormPageSubmitResult<T>) => void;
    /** 是否禁用所有字段 */
    disabled?: boolean;
}
/** 运行字段级验证，返回错误映射 */
declare function validateFormFields<T extends Record<string, unknown>>(fields: FormPageField<T>[], values: Record<string, unknown>): Record<string, string>;
/**
 * FormPageScaffold — 表单页面骨架组件。
 *
 * 整合表单字段渲染、客户端验证、提交反馈、错误处理，
 * 提供标准化的表单页布局。与 FormField、SubmitButton、
 * FormSubmitFeedback 协同工作。
 *
 * @example
 * // 创建资源表单
 * <FormPageScaffold
 *   meta={{ title: '新建商品', description: '添加一个新的商品条目' }}
 *   fields={[
 *     { key: 'name', label: '商品名称', required: true },
 *     { key: 'price', label: '价格', type: 'number', required: true,
 *       rules: [{ validate: (v) => Number(v) > 0 ? null : '价格必须大于0' }] },
 *     { key: 'category', label: '分类', type: 'select',
 *       options: [{ label: '电子', value: 'electronics' }, { label: '服装', value: 'clothing' }] },
 *   ]}
 *   onSubmit={async (data) => {
 *     await api.createProduct(data);
 *     return { data, message: '商品创建成功' };
 *   }}
 *   backUrl="/products"
 * />
 *
 * @example
 * // 编辑模式（含删除按钮）
 * <FormPageScaffold
 *   meta={{
 *     title: '编辑商品',
 *     deleteAction: {
 *       label: '删除商品',
 *       onDelete: () => api.deleteProduct(id),
 *       confirmText: '确定要删除吗？',
 *     },
 *   }}
 *   fields={[...]}
 *   onSubmit={async (data) => {
 *     await api.updateProduct(id, data);
 *     return { data, message: '保存成功' };
 *   }}
 * />
 */
declare function FormPageScaffold<T extends Record<string, unknown> = Record<string, unknown>>({ meta, fields, onSubmit, onChange, topActions, submitLabel, submitVariant, backUrl, maxWidth, className, footer, onSuccess, disabled, }: FormPageScaffoldProps<T>): React__default.JSX.Element;

interface DetailInfoRow {
    key: string;
    label: string;
    value: React__default.ReactNode;
    /** Optional inline status badge next to value. */
    statusBadge?: {
        label: string;
        variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    };
}
interface DetailTab {
    key: string;
    label: string;
    content: React__default.ReactNode;
}
interface TransitionAction {
    key: string;
    label: string;
    /** Target status after transition. */
    targetStatus: string;
    variant?: 'primary' | 'secondary' | 'danger';
    /** Optional confirmation dialog before executing transition. */
    confirm?: {
        title: string;
        message: string;
    };
    onTransition: () => void | Promise<void>;
}
interface CombinedDetailPageProps {
    /** Main title for the detail page. */
    title: string;
    /** Subtitle — often the entity id or a short descriptor. */
    subtitle?: string;
    /** Back navigation. */
    backHref?: string;
    backLabel?: string;
    onBack?: () => void;
    /** Current status to render as a status badge. */
    status?: {
        label: string;
        variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    };
    /** Info rows shown above tabs. */
    infoRows?: DetailInfoRow[];
    /** Tabs for organizing detail content. */
    tabs?: DetailTab[];
    /** Default active tab key. */
    defaultTab?: string;
    /** Edit action — shown as a primary button in the shell actions. */
    onEdit?: () => void;
    editLabel?: string;
    /** Delete action with built-in confirmation dialog. */
    onDelete?: () => void | Promise<void>;
    deleteLabel?: string;
    deleteConfirm?: {
        title: string;
        message: string;
    };
    /** Status transition actions rendered below info rows. */
    transitions?: TransitionAction[];
    /** Closure bar links. */
    closureLinks?: DetailClosureLink[];
    /** Detail action bar actions (copy, export etc.). */
    actionBarActions?: DetailActionBarAction[];
    /** Loading state. */
    loading?: boolean;
    /** Error message. */
    error?: string;
    /** Test id. */
    'data-testid'?: string;
}
declare function CombinedDetailPage({ title, subtitle, backHref, backLabel, onBack, status, infoRows, tabs, defaultTab, onEdit, editLabel, onDelete, deleteLabel, deleteConfirm, transitions, closureLinks, actionBarActions, loading, error, 'data-testid': testId, }: CombinedDetailPageProps): React__default.JSX.Element;

interface StepperStep {
    /** Step label (required) */
    label: string;
    /** Optional description shown below the label */
    description?: string;
    /** Step icon or index badge override */
    icon?: React__default.ReactNode;
    /** Mark step as completed; skips click-keyboard interaction when false */
    completed?: boolean;
    /** Mark step as having an error */
    error?: boolean;
    /** Disable interaction for this step */
    disabled?: boolean;
}
interface StepperProps {
    /** Ordered steps */
    steps: StepperStep[];
    /** Current active step (0-indexed) */
    activeStep: number;
    /** Called when a step label is clicked (unless disabled or future-only) */
    onStepClick?: (stepIndex: number) => void;
    /** Orientation */
    orientation?: 'horizontal' | 'vertical';
    /** Visual variant */
    variant?: 'default' | 'dots' | 'progress';
    /** Size preset */
    size?: 'sm' | 'md' | 'lg';
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline styles */
    style?: React__default.CSSProperties;
}
/**
 * Stepper — multi-step progress indicator with horizontal/vertical layout,
 * dot / progress variants, and clickable step navigation.
 *
 * Common use-cases: onboarding wizards, checkout flows, multi-page forms.
 */
declare function Stepper({ steps, activeStep, onStepClick, orientation, variant, size, 'data-testid': dataTestId, className, style, }: StepperProps): React__default.JSX.Element;

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'outline' | 'filled' | 'underline';
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
    /** Visual size */
    size?: InputSize;
    /** Visual variant */
    variant?: InputVariant;
    /** Label text rendered above the input */
    label?: string;
    /** Helper / hint text below the input */
    helperText?: string;
    /** Error message — when set, displays error styling */
    error?: string;
    /** Whether the input is in a loading state */
    loading?: boolean;
    /** Icon / content before the input value */
    prefix?: React__default.ReactNode;
    /** Icon / content after the input value */
    suffix?: React__default.ReactNode;
    /** Show a clear button when value is non-empty */
    allowClear?: boolean;
    /** Called when the clear button is clicked */
    onClear?: () => void;
    /** Show character count (when maxLength is set) */
    showCount?: boolean;
    /** Make the input fill its container width */
    block?: boolean;
    /** Test id */
    'data-testid'?: string;
    /** aria-label fallback when no label */
    'aria-label'?: string;
}
/**
 * Input — accessible, controlled/uncontrolled text input.
 *
 * Supports labels, helper text, error state, prefix/suffix,
 * clear button, character count, loading state, three sizes
 * and three visual variants.
 */
declare const Input: React__default.NamedExoticComponent<InputProps>;

type CheckboxSize = 'sm' | 'md' | 'lg';
interface CheckboxProps {
    /** Controlled checked state */
    checked?: boolean;
    /** Default unchecked (uncontrolled) */
    defaultChecked?: boolean;
    /** Called when checked state changes */
    onChange?: (checked: boolean) => void;
    /** Disabled state */
    disabled?: boolean;
    /** Indeterminate state (dash instead of check) */
    indeterminate?: boolean;
    /** Visual size */
    size?: CheckboxSize;
    /** Label text */
    label?: string;
    /** Label position */
    labelPosition?: 'left' | 'right';
    /** Error state */
    error?: string;
    /** Value sent with form */
    value?: string;
    /** Form name */
    name?: string;
    /** Whether the checkbox is required */
    required?: boolean;
    /** ARIA label fallback */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style */
    style?: React__default.CSSProperties;
}
/**
 * Checkbox — binary / indeterminate selection control.
 *
 * Supports controlled/uncontrolled usage, indeterminate state,
 * three sizes, labels, error state, and full keyboard/ARIA support.
 */
declare function Checkbox({ checked, defaultChecked, onChange, disabled, indeterminate, size, label, labelPosition, error, value, name, required, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, }: CheckboxProps): React__default.JSX.Element;

interface ComboboxOption {
    value: string;
    label: string;
    /** Optional description shown beneath the label */
    description?: string;
    /** Optional avatar/icon */
    icon?: React__default.ReactNode;
    /** Optional disabled state */
    disabled?: boolean;
    /** Optional group label */
    group?: string;
}
interface ComboboxProps {
    /** Current value */
    value?: string;
    /** Options */
    options: ComboboxOption[];
    /** Value change callback */
    onChange?: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Label above the input */
    label?: string;
    /** Whether to allow custom (non-option) values */
    allowCustom?: boolean;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
    /** Whether disabled */
    disabled?: boolean;
    /** Whether required */
    required?: boolean;
    /** Empty state message when no results */
    emptyMessage?: string;
    /** Loading state */
    loading?: boolean;
    /** Maximum visible options before scroll (default 8) */
    maxVisible?: number;
    /** Custom styles */
    style?: React__default.CSSProperties;
    /** Custom class name */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
declare const Combobox: React__default.NamedExoticComponent<ComboboxProps>;

interface ContentSwitcherSegment {
    /** Unique segment key */
    key: string;
    /** Display label */
    label: string;
    /** Optional icon */
    icon?: React__default.ReactNode;
    /** Optional badge count */
    badge?: number;
    /** Disabled state */
    disabled?: boolean;
}
interface ContentSwitcherProps {
    /** Segments to display */
    segments: ContentSwitcherSegment[];
    /** Currently selected segment key — controlled mode */
    selected?: string;
    /** Default selected segment key — uncontrolled mode */
    defaultSelected?: string;
    /** Called when selected segment changes */
    onSelect?: (key: string) => void;
    /** Visual variant */
    variant?: 'bar' | 'pills';
    /** Size */
    size?: 'sm' | 'md';
    /** Full width fills container */
    fullWidth?: boolean;
    /** Test id */
    'data-testid'?: string;
}
/**
 * ContentSwitcher — a segment control for toggling between content views.
 *
 * Used for filter toggles, view switching, and tab-like navigation inside cards/panels.
 * Supports bar (underline) and pills (filled) visual variants.
 */
declare function ContentSwitcher({ segments, selected: controlledSelected, defaultSelected, onSelect, variant, size, fullWidth, 'data-testid': dataTestId, }: ContentSwitcherProps): React__default.JSX.Element;

/** 菜单项分隔线 */
interface ContextMenuSeparator {
    kind: 'separator';
}
/** 菜单项操作 */
interface ContextMenuItem {
    kind?: 'item';
    /** 唯一标识 */
    key: string;
    /** 显示标签 */
    label: string;
    /** 快捷键提示 */
    shortcut?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 危险操作（红色高亮） */
    danger?: boolean;
    /** 图标（可选 ReactNode） */
    icon?: React__default.ReactNode;
    /** 点击回调 */
    onSelect: () => void;
}
/** 菜单项类型 */
type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;
/** ContextMenu 组件属性 */
interface ContextMenuProps {
    /** 菜单项列表 */
    items: ContextMenuEntry[];
    /** 是否显示 */
    open: boolean;
    /** 菜单位置 x */
    x: number;
    /** 菜单位置 y */
    y: number;
    /** 关闭回调 */
    onClose: () => void;
    /** 自定义宽度 */
    width?: number;
}
/**
 * ContextMenu — 右键上下文菜单组件。
 *
 * 支持菜单项、分隔线、禁用状态、危险操作样式、快捷键提示。
 * 点击外部或按下 Escape 自动关闭。
 *
 * @example
 * <div onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, open: true }); }}>
 *   <ContextMenu
 *     open={menu.open}
 *     x={menu.x}
 *     y={menu.y}
 *     items={[
 *       { key: 'edit', label: '编辑', onSelect: () => edit() },
 *       { kind: 'separator' },
 *       { key: 'delete', label: '删除', danger: true, onSelect: () => remove() },
 *     ]}
 *     onClose={() => setMenu({ ...menu, open: false })}
 *   />
 * </div>
 */
declare function ContextMenu({ items, open, x, y, onClose, width, }: ContextMenuProps): React__default.JSX.Element | null;

interface DateRangeValue {
    /** 开始日期 (ISO 8601 日期字符串 YYYY-MM-DD) */
    start: string;
    /** 结束日期 (ISO 8601 日期字符串 YYYY-MM-DD) */
    end: string;
}
interface DateRangePickerProps {
    /** 当前值 */
    value?: DateRangeValue;
    /** 值变化回调 */
    onChange?: (value: DateRangeValue) => void;
    /** 最小值 */
    min?: string;
    /** 最大值 */
    max?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否必填 */
    required?: boolean;
    /** 标签 */
    label?: string;
    /** 错误信息 */
    error?: string;
    /** 帮助文本 */
    helpText?: string;
    /** 占位文本 */
    placeholder?: [string, string];
    /** 快捷选项 */
    presets?: DateRangePreset[];
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 自定义类名 */
    className?: string;
}
interface DateRangePreset {
    label: string;
    getValue: () => DateRangeValue;
}
declare const DateRangePicker: React__default.FC<DateRangePickerProps>;

/** 会员等级信息 */
interface MemberTier {
    /** 等级名称 */
    tier: string;
    /** 等级标识（如 Gold/Silver） */
    key: string;
    /** 人数 */
    count: number;
    /** 环比增长率 (0.1 = +10%) */
    growth?: number;
    /** 等级颜色 */
    color?: string;
    /** 等级图标 */
    icon?: string;
}
/** 会员等级分布组件 Props */
interface MemberTierDistributionProps {
    /** 等级数据 */
    tiers: MemberTier[];
    /** 图表宽度 */
    width?: number;
    /** 图表高度 */
    height?: number;
    /** 标题 */
    title?: string;
    /** 是否显示总数 */
    showTotal?: boolean;
    /** 是否显示趋势箭头 */
    showTrends?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 点击等级回调 */
    onTierClick?: (tier: MemberTier) => void;
}
/**
 * MemberTierDistribution — 会员等级分布可视化组件。
 *
 * 使用环形图展示各等级占比，配合列表展示详细信息
 * （等级名称、人数、占比、环比增长趋势）。
 *
 * 适用于会员管理后台、运营看板等场景。
 *
 * @example
 * // 基本用法
 * <MemberTierDistribution
 *   title="会员等级分布"
 *   tiers={[
 *     { tier: '钻石会员', key: 'diamond', count: 128, growth: 0.12 },
 *     { tier: '黄金会员', key: 'gold', count: 450, growth: 0.05 },
 *     { tier: '白银会员', key: 'silver', count: 620, growth: -0.03 },
 *     { tier: '青铜会员', key: 'bronze', count: 890, growth: 0.01 },
 *   ]}
 *   showTrends
 *   onTierClick={(tier) => console.log('Clicked', tier)}
 * />
 *
 * @example
 * // 紧凑模式（不显示趋势）
 * <MemberTierDistribution
 *   tiers={[...]}
 *   showTotal={false}
 *   showTrends={false}
 * />
 */
declare function MemberTierDistribution({ tiers, width, height, title, showTotal, showTrends, className, emptyText, onTierClick, }: MemberTierDistributionProps): React__default.JSX.Element;

type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';
type NotificationCategory = 'system' | 'member' | 'device' | 'order' | 'alert';
interface NotificationItem {
    id: string;
    title: string;
    description: string;
    severity: NotificationSeverity;
    category: NotificationCategory;
    timestamp: number;
    read: boolean;
    /** 可选链接，点击跳转 */
    link?: string;
    /** 可选操作按钮 */
    actions?: NotificationAction[];
}
interface NotificationAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
}
interface NotificationSummary {
    total: number;
    unread: number;
    byCategory: Partial<Record<NotificationCategory, number>>;
}
interface NotificationCenterProps {
    notifications: NotificationItem[];
    /** 点击通知 */
    onNotificationClick?: (item: NotificationItem) => void;
    /** 标记为已读 */
    onMarkAsRead?: (id: string) => void;
    /** 标记全部已读 */
    onMarkAllAsRead?: () => void;
    /** 删除通知 */
    onDelete?: (id: string) => void;
    /** 清空已读 */
    onClearRead?: () => void;
    /** 自定义空状态 */
    emptyText?: string;
    /** 最大高度 */
    maxHeight?: number;
}
declare function NotificationCenter({ notifications, onNotificationClick, onMarkAsRead, onMarkAllAsRead, onDelete, onClearRead, emptyText, maxHeight, }: NotificationCenterProps): React__default.JSX.Element;
declare function useNotificationSummary(notifications: NotificationItem[]): NotificationSummary;

/** 密钥态势 */
interface SecretPosture {
    total: number;
    rotationDue: number;
    expired: number;
}
/** 证书态势 */
interface CertificatePosture {
    total: number;
    expiringSoon: number;
    expired: number;
}
/** 配置态势面板属性 */
interface ConfigurationPosturePanelProps {
    /** 密钥态势 */
    secrets: SecretPosture;
    /** 证书态势 */
    certificates: CertificatePosture;
    /** 面板标题 */
    title?: string;
}
/**
 * ConfigurationPosturePanel — 配置态势面板
 *
 * 聚合展示密钥与证书的健康风险指标，用于 configuration workspace overview 区域。
 * 同时渲染风险占比进度条和标签。
 *
 * @example
 * <ConfigurationPosturePanel
 *   secrets={{ total: 24, rotationDue: 3, expired: 1 }}
 *   certificates={{ total: 12, expiringSoon: 2, expired: 0 }}
 *   title="配置治理态势"
 * />
 */
declare function ConfigurationPosturePanel({ secrets, certificates, title, }: ConfigurationPosturePanelProps): React__default.JSX.Element;

/** 审计条目操作类型 */
type AuditAction = 'rule_evaluated' | 'decision_applied' | 'decision_overridden' | 'decision_reverted' | 'alert_triggered' | 'notification_sent' | 'manual_review' | 'auto_resolved';
/** 审计条目严重程度 */
type AuditSeverity = 'info' | 'warning' | 'critical' | 'success';
/** 单条审计记录 */
interface AuditEntry {
    /** 唯一标识 */
    id: string;
    /** 操作类型 */
    action: AuditAction;
    /** 操作描述 */
    message: string;
    /** 关联的规则 ID（可选） */
    ruleId?: string;
    /** 关联的规则名称（可选） */
    ruleName?: string;
    /** 规则执行状态（可选） */
    ruleStatus?: RuleExecutionStatus;
    /** 严重程度 */
    severity: AuditSeverity;
    /** 操作人/系统 */
    actor: string;
    /** 操作时间 */
    timestamp: string;
    /** 变更详情（可选 JSON 字符串或结构化数据） */
    changes?: string;
    /** 是否可回滚 */
    revertible?: boolean;
    /** 关联实体 ID */
    entityId?: string;
    /** 关联实体类型 */
    entityType?: string;
}
/** 审计摘要统计 */
interface AuditSummary {
    total: number;
    info: number;
    warning: number;
    critical: number;
    success: number;
    /** 最近 24h 新增 */
    last24h: number;
}
/** 审计过滤器 */
interface AuditFilter {
    action?: AuditAction;
    severity?: AuditSeverity;
    ruleId?: string;
    actor?: string;
    dateFrom?: string;
    dateTo?: string;
}
interface DecisionAuditTrailProps {
    /** 审计记录列表 */
    entries: AuditEntry[];
    /** 审计摘要（可选） */
    summary?: AuditSummary;
    /** 当前过滤器 */
    filter?: AuditFilter;
    /** 过滤器变更回调 */
    onFilterChange?: (filter: AuditFilter) => void;
    /** 点击条目回调 */
    onEntryClick?: (entry: AuditEntry) => void;
    /** 回滚操作回调 */
    onRevert?: (entry: AuditEntry) => void;
    /** 是否加载中 */
    loading?: boolean;
    /** 每页条数 */
    pageSize?: number;
    /** 自定义类名 */
    className?: string;
    /** 是否紧凑模式 */
    compact?: boolean;
    /** 空数据文案 */
    emptyText?: string;
}
/**
 * DecisionAuditTrail — AI 决策审计追踪组件。
 *
 * 展示 AI 规则决策的完整审计链路，包含：
 * - 操作时间线视图
 * - 多维度过滤（操作类型、严重程度、规则、操作人、日期）
 * - 分页浏览
 * - 回滚操作入口
 * - 统计摘要
 *
 * @example
 * ```tsx
 * <DecisionAuditTrail
 *   entries={auditLogs}
 *   summary={{ total: 1280, info: 800, warning: 300, critical: 120, success: 60, last24h: 45 }}
 *   filter={currentFilter}
 *   onFilterChange={setFilter}
 *   onRevert={handleRevert}
 *   pageSize={20}
 * />
 * ```
 */
declare function DecisionAuditTrail({ entries, summary, filter, onFilterChange, onEntryClick, onRevert, loading, pageSize, className, compact, emptyText, }: DecisionAuditTrailProps): React__default.JSX.Element;

interface ImageItem {
    /** Image source URL */
    src: string;
    /** Alt text */
    alt?: string;
    /** Thumbnail URL (defaults to src) */
    thumb?: string;
    /** Optional caption */
    caption?: string;
}
interface ImagePreviewProps {
    /** Array of images to display */
    images: ImageItem[];
    /** Initial image index to show */
    initialIndex?: number;
    /** Thumbnail size in pixels */
    thumbSize?: number;
    /** Gap between thumbnails in px */
    thumbGap?: number;
    /** Width of the preview lightbox */
    previewWidth?: number;
    /** Max height of preview lightbox */
    previewMaxHeight?: number;
    /** Whether to show navigation arrows */
    showArrows?: boolean;
    /** Whether to show thumbnail strip */
    showThumbnails?: boolean;
    /** Whether to show image counter "1 / 5" */
    showCounter?: boolean;
    /** Whether to close lightbox on backdrop click */
    closeOnBackdrop?: boolean;
    /** Whether to close lightbox on Escape key */
    closeOnEscape?: boolean;
    /** Called when lightbox opens */
    onOpen?: (index: number) => void;
    /** Called when lightbox closes */
    onClose?: () => void;
    /** Called when image changes */
    onChange?: (index: number) => void;
    /** Custom class name */
    className?: string;
    /** Custom styles */
    style?: React__default.CSSProperties;
    /** Render mode: 'grid' shows a thumbnail grid, 'strip' shows horizontal scroll strip, 'single' shows one thumbnail */
    mode?: 'grid' | 'strip' | 'single';
    /** Columns in grid mode */
    gridCols?: number;
    /** Image fit mode in lightbox */
    fit?: 'contain' | 'cover';
    /** Image border radius in px */
    borderRadius?: number;
    /** Placeholder shown while image loads */
    placeholder?: React__default.ReactNode;
    /** Error fallback when image fails to load */
    errorFallback?: React__default.ReactNode;
}
declare function ImagePreview({ images, initialIndex, thumbSize, thumbGap, previewWidth, previewMaxHeight, showArrows, showThumbnails, showCounter, closeOnBackdrop, closeOnEscape, onOpen, onClose, onChange, className, style, mode, gridCols, fit, borderRadius, placeholder, errorFallback, }: ImagePreviewProps): React__default.JSX.Element;

interface SliderProps {
    /** Current value (single) or [min, max] range */
    value?: number | [number, number];
    /** Default value for uncontrolled single mode */
    defaultValue?: number;
    /** Default value for uncontrolled range mode */
    defaultRangeValue?: [number, number];
    /** Minimum value, default 0 */
    min?: number;
    /** Maximum value, default 100 */
    max?: number;
    /** Step increment, default 1 */
    step?: number;
    /** Whether slider represents a range [min, max] */
    range?: boolean;
    /** Show current value tooltip above thumb */
    showValue?: boolean;
    /** Format value display, receives value or [value1, value2] */
    formatValue?: (value: number | [number, number]) => string;
    /** Show tick marks at step intervals */
    showTicks?: boolean;
    /** Array of specific tick positions (overrides step-based ticks) */
    ticks?: number[];
    /** Tick label formatter, receives tick value */
    formatTick?: (value: number) => string;
    /** Whether the slider is disabled */
    disabled?: boolean;
    /** Visual variant */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    /** Track height in px, default 4 */
    trackHeight?: number;
    /** Thumb size in px, default 16 */
    thumbSize?: number;
    /** Called on value change (single) */
    onChange?: (value: number) => void;
    /** Called on range value change */
    onRangeChange?: (value: [number, number]) => void;
    /** Called when change is committed (mouse up / key up) */
    onChangeCommitted?: (value: number | [number, number]) => void;
    /** ARIA label for single slider */
    'aria-label'?: string;
    /** ARIA labels for range slider [lower, upper] */
    'aria-labels'?: [string, string];
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style override */
    style?: React__default.CSSProperties;
    /** Show the track as an input field next to slider */
    showInput?: boolean;
    /** Orientation */
    orientation?: 'horizontal' | 'vertical';
    /** Vertical height in px (only applies when vertical) */
    verticalHeight?: number;
}
/**
 * Slider — reusable range input for selecting a single value or range.
 *
 * Supports controlled/uncontrolled, range mode, ticks, value display tooltips,
 * input field integration, and vertical orientation.
 */
declare function Slider({ value: valueProp, defaultValue, defaultRangeValue, min, max, step, range, showValue, formatValue, showTicks, ticks: ticksProp, formatTick, disabled, variant, trackHeight, thumbSize, onChange, onRangeChange, onChangeCommitted, 'aria-label': ariaLabel, 'aria-labels': ariaLabels, 'data-testid': dataTestId, className, style, showInput, orientation, verticalHeight, }: SliderProps): React__default.JSX.Element;

type InputNumberSize = 'sm' | 'md' | 'lg';
interface InputNumberProps {
    /** Current value (controlled) */
    value?: number;
    /** Default value (uncontrolled) */
    defaultValue?: number;
    /** Called when value changes */
    onChange?: (value: number) => void;
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Step increment / decrement */
    step?: number;
    /** Decimal precision (0 = integer) */
    precision?: number;
    /** Visual size */
    size?: InputNumberSize;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** Whether the input is read-only */
    readOnly?: boolean;
    /** Label text */
    label?: string;
    /** Helper text below the input */
    helperText?: string;
    /** Error message */
    error?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Unit displayed after the number */
    unit?: string;
    /** Prefix text before the number */
    prefix?: string;
    /** Show stepper buttons */
    showStepper?: boolean;
    /** Allow empty value (displays placeholder) */
    allowEmpty?: boolean;
    /** Width in px (default: 160) */
    width?: number;
    /** Test id */
    'data-testid'?: string;
    /** Input name attribute */
    name?: string;
    /** Auto focus */
    autoFocus?: boolean;
    /** Required indicator */
    required?: boolean;
    /** aria-label */
    'aria-label'?: string;
}
/**
 * InputNumber — numeric input with optional stepper buttons.
 *
 * Supports min/max clamping, precision, unit/prefix display,
 * three sizes, and controlled / uncontrolled modes.
 */
declare function InputNumber({ value: valueProp, defaultValue, onChange, min, max, step, precision, size, disabled, readOnly, label, helperText, error, placeholder, unit, prefix: prefixText, showStepper, allowEmpty, width, 'data-testid': dataTestId, name, autoFocus, required, 'aria-label': ariaLabel, }: InputNumberProps): React__default.JSX.Element;

/** PasswordInput 组件属性 */
interface PasswordInputProps extends Omit<InputProps, 'type'> {
    /** 初始是否显示密码 */
    defaultVisible?: boolean;
    /** 显示/隐藏切换按钮的 aria-label */
    toggleLabel?: string;
}
/**
 * PasswordInput — 密码输入框组件。
 *
 * 基于 Input 组件，增加密码显示/隐藏切换功能。
 * 支持所有 Input 的 props（placeholder、disabled、error 等）。
 *
 * @example
 * <PasswordInput
 *   label="密码"
 *   placeholder="请输入密码"
 *   onChange={(e) => setPassword(e.target.value)}
 * />
 */
declare function PasswordInput({ defaultVisible, toggleLabel, ...inputProps }: PasswordInputProps): React__default.JSX.Element;

type ErrorBoundarySeverity = 'block' | 'inline' | 'toast';
interface ErrorBoundaryFallbackArgs {
    error: Error;
    resetError: () => void;
}
interface ErrorBoundaryProps {
    /** Accessible name for the error region */
    name?: string;
    /** Visual severity */
    severity?: ErrorBoundarySeverity;
    /** Custom fallback renderer; receives error + reset callback */
    fallback?: (args: ErrorBoundaryFallbackArgs) => React__default.ReactNode;
    /** Text for the reset/retry button (block / inline modes) */
    retryLabel?: string;
    /** Extra text shown below the error message (block mode) */
    description?: string;
    /** Called when the boundary catches an error */
    onError?: (error: Error, errorInfo: React__default.ErrorInfo) => void;
    /** Called just before resetError is invoked */
    onReset?: () => void;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style override */
    style?: React__default.CSSProperties;
    children?: React__default.ReactNode;
}
interface ErrorBoundaryState {
    error: Error | null;
}
/**
 * ErrorBoundary — catch rendering errors in children with configurable fallback.
 *
 * Supports three visual severities:
 *  - `block`: full-width card with message + optional description + retry button.
 *  - `inline`: compact one-liner with retry button, suitable for rows / cells.
 *  - `toast`: renders nothing (log-only); consumer listens via `onError` to show a toast elsewhere.
 *
 * When a `fallback` renderer is provided it takes precedence over the built-in views.
 * The `resetError` callback resets internal state and calls `onReset`.
 */
declare class ErrorBoundary extends React__default.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React__default.ErrorInfo): void;
    resetError: () => void;
    render(): string | number | boolean | Iterable<React__default.ReactNode> | React__default.JSX.Element | null | undefined;
}

interface TreeNode {
    key: string;
    label: string;
    children?: TreeNode[];
    disabled?: boolean;
    /** Custom icon shown left of the label */
    icon?: React__default.ReactNode;
    /** Whether the node is a leaf (has no children) */
    isLeaf?: boolean;
    /** Any extra data */
    data?: Record<string, unknown>;
}
interface TreeProps {
    /** Tree data */
    treeData: TreeNode[];
    /** Tree variant */
    variant?: 'default' | 'directory' | 'minimal';
    /** Selection mode */
    selectable?: boolean;
    /** Whether to show checkboxes */
    checkable?: boolean;
    /** Default expanded keys */
    defaultExpandedKeys?: string[];
    /** Controlled expanded keys */
    expandedKeys?: string[];
    /** On expand change (controlled) */
    onExpand?: (keys: string[]) => void;
    /** Default selected keys */
    defaultSelectedKeys?: string[];
    /** Controlled selected keys */
    selectedKeys?: string[];
    /** On selection change (controlled, selectable mode) */
    onSelect?: (keys: string[]) => void;
    /** Default checked keys (checkable mode) */
    defaultCheckedKeys?: string[];
    /** Controlled checked keys */
    checkedKeys?: string[];
    /** On check change (checkable mode) */
    onCheck?: (keys: string[]) => void;
    /** Called when a node is clicked */
    onNodeClick?: (node: TreeNode, event: React__default.MouseEvent) => void;
    /** Render custom node content */
    renderNode?: (node: TreeNode, expanded: boolean, selected: boolean) => React__default.ReactNode;
    /** Allow multiple selection (selectable mode, no checkboxes) */
    multiple?: boolean;
    /** Auto expand parent of selected node */
    autoExpandParent?: boolean;
    /** Size */
    size?: 'sm' | 'md';
    /** Height constraint with scroll */
    maxHeight?: number | string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style */
    style?: React__default.CSSProperties;
}
/**
 * Tree — hierarchical data display with expand/collapse, selection, and checkboxes.
 *
 * Supports directory variant (folder/file icons), controlled/uncontrolled expansion,
 * single or multiple selection, and fully controlled checkbox mode with parent-child
 * cascade logic.
 */
declare function Tree({ treeData, variant, selectable, checkable, defaultExpandedKeys, expandedKeys: controlledExpandedKeys, onExpand, defaultSelectedKeys, selectedKeys: controlledSelectedKeys, onSelect, defaultCheckedKeys, checkedKeys: controlledCheckedKeys, onCheck, onNodeClick, renderNode, multiple, autoExpandParent, size, maxHeight, 'data-testid': testId, className, style, }: TreeProps): React__default.JSX.Element;

interface CommandItem {
    /** Unique identifier */
    id: string;
    /** Display label */
    label: string;
    /** Optional description */
    description?: string;
    /** Optional icon element */
    icon?: React__default.ReactNode;
    /** Keyboard shortcut hint (e.g. "⌘K") */
    shortcut?: string;
    /** Group category */
    group?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Arbitrary payload passed back on select */
    payload?: unknown;
}
interface CommandPaletteProps {
    /** All available commands */
    commands: CommandItem[];
    /** Whether the palette is open */
    open: boolean;
    /** Called when the palette requests close */
    onClose: () => void;
    /** Called when a command is selected */
    onSelect: (command: CommandItem) => void;
    /** Placeholder text in the search input */
    placeholder?: string;
    /** Empty state message when no commands match */
    emptyMessage?: string;
    /** Maximum visible items before scrolling */
    maxHeight?: number;
    /** Whether to auto-focus the search input on open */
    autoFocus?: boolean;
    /** Custom className for the overlay */
    className?: string;
}
declare function CommandPalette({ commands, open, onClose, onSelect, placeholder, emptyMessage, maxHeight, autoFocus, className, }: CommandPaletteProps): React__default.JSX.Element | null;

/** 设备状态枚举 */
type DeviceStatus = 'online' | 'offline' | 'warning' | 'maintenance' | 'error';
/** 设备类型 */
type DeviceType = 'pos' | 'printer' | 'scanner' | 'display' | 'network' | 'camera' | 'sensor' | 'other';
/** 单个设备条目 */
interface DeviceEntry {
    /** 设备 ID */
    id: string;
    /** 设备名称 */
    name: string;
    /** 设备类型 */
    type: DeviceType;
    /** 设备状态 */
    status: DeviceStatus;
    /** 最后在线时间 ISO-8601 */
    lastSeen: string;
    /** 运行时长 小时 */
    uptimeHours?: number;
    /** CPU 使用率 % */
    cpuUsage?: number;
    /** 内存使用率 % */
    memoryUsage?: number;
    /** 温度 °C */
    temperature?: number;
    /** 固件版本 */
    firmwareVersion?: string;
    /** 位置 */
    location?: string;
    /** IP 地址 */
    ipAddress?: string;
    /** 告警消息 */
    alertMessage?: string;
}
/** 设备汇总统计 */
interface DevicePanelSummary {
    /** 设备总数 */
    total: number;
    online: number;
    offline: number;
    warning: number;
    maintenance: number;
    error: number;
}
/** 设备状态面板 Props */
interface DeviceStatusPanelProps {
    /** 设备数据列表 */
    devices: DeviceEntry[];
    /** 面板标题 */
    title?: string;
    /** 是否显示汇总统计卡 */
    showSummary?: boolean;
    /** 是否显示设备详情行 */
    showDetails?: boolean;
    /** 最大显示条数 */
    maxDisplay?: number;
    /** 是否支持筛选 */
    showFilters?: boolean;
    /** 是否支持排序 */
    showSort?: boolean;
    /** 刷新回调 */
    onRefresh?: () => void;
    /** 设备点击回调 */
    onDeviceClick?: (device: DeviceEntry) => void;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 是否显示搜索框 */
    showSearch?: boolean;
}
/** 计算汇总统计 */
declare function computeDeviceSummary(devices: DeviceEntry[]): DevicePanelSummary;
/**
 * DeviceStatusPanel — 设备状态实时监控面板。
 *
 * 展示门店内各类 POS 机、打印机、扫描枪、显示屏、
 * 网络设备、摄像头、传感器等物联网设备的实时运行状态。
 *
 * 特性：
 * - 状态汇总统计卡（在线/离线/告警/故障/维护）
 * - 设备行支持展开详情（CPU/内存/温度/运行时长）
 * - 按状态筛选 + 按关键词搜索
 * - 实时状态指示灯（带动画）
 * - 资源使用进度条
 *
 * @example
 * <DeviceStatusPanel
 *   title="门店A — 设备状态"
 *   devices={[
 *     {
 *       id: 'pos-01',
 *       name: '收银台POS-01',
 *       type: 'pos',
 *       status: 'online',
 *       lastSeen: new Date().toISOString(),
 *       uptimeHours: 72.5,
 *       cpuUsage: 45,
 *       memoryUsage: 62,
 *       temperature: 52,
 *       firmwareVersion: '3.2.1',
 *       location: '收银区',
 *       ipAddress: '192.168.1.101',
 *     },
 *   ]}
 *   showSummary
 *   showDetails
 *   showFilters
 *   showSearch
 * />
 *
 * @example
 * <DeviceStatusPanel
 *   title="门店B — 设备状态"
 *   devices={[
 *     { id: 'sc-01', name: '扫描枪01', type: 'scanner', status: 'warning', lastSeen: '2026-06-23T10:00:00Z', alertMessage: '连接不稳定' },
 *   ]}
 *   showSummary
 * />
 */
declare const DeviceStatusPanel: React__default.FC<DeviceStatusPanelProps>;

interface InspectionItem {
    id: string;
    deviceName: string;
    deviceType: string;
    location: string;
    status: 'healthy' | 'warning' | 'critical' | 'offline';
    lastInspectedAt: string;
    inspector: string;
    metrics: InspectionMetrics;
    alerts: InspectionAlert[];
}
interface InspectionMetrics {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    temperature: number;
    uptimeHours: number;
    batteryPercent?: number;
}
interface InspectionAlert {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    triggeredAt: string;
    acknowledged: boolean;
}
interface InspectionSummary {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    offline: number;
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgTemperature: number;
}
interface DeviceInspectionPanelProps {
    /** List of devices under inspection */
    devices: InspectionItem[];
    /** Summary statistics */
    summary: InspectionSummary;
    /** Callback when a device row is clicked */
    onDeviceClick?: (device: InspectionItem) => void;
    /** Callback to acknowledge an alert */
    onAcknowledgeAlert?: (deviceId: string, alertId: string) => void;
    /** Callback to start a new inspection */
    onStartInspection?: () => void;
    /** Callback to export report */
    onExportReport?: () => void;
    /** Loading state */
    loading?: boolean;
    /** Error state */
    error?: string | null;
    /** Additional CSS class */
    className?: string;
}
declare const DeviceInspectionPanel: React__default.FC<DeviceInspectionPanelProps>;

interface MemberLevel {
    /** 等级名称 */
    name: string;
    /** 会员数量 */
    count: number;
    /** 等级颜色 */
    color?: string;
}
interface MemberLevelDistributionProps {
    /** 会员等级数据 */
    data: MemberLevel[];
    /** 组件宽度 */
    width?: number;
    /** 组件高度 */
    height?: number;
    /** 标题 */
    title?: string;
    /** 是否显示数值 */
    showValues?: boolean;
    /** 是否显示百分比 */
    showPercentage?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
}
declare const MemberLevelDistribution: React__default.FC<MemberLevelDistributionProps>;

/** 指标变化趋势 */
type TrendDirection = 'up' | 'down' | 'flat';
/** 高亮指标项 */
interface HighlightMetric {
    /** 指标名称 */
    label: string;
    /** 当前值 */
    value: string | number;
    /** 变化趋势 */
    trend?: TrendDirection;
    /** 变化百分比 */
    changePercent?: number;
    /** 指标单位 */
    unit?: string;
    /** 是否为正（绿）/负（红） */
    isPositive?: boolean;
}
/** 关键洞察 */
interface InsightItem {
    /** 洞察类型: positive / negative / info */
    type: 'positive' | 'negative' | 'info';
    /** 洞察文本 */
    text: string;
}
/** AI 摘要卡片 Props */
interface AISummaryCardProps {
    /** 摘要标题 */
    title?: string;
    /** AI 生成的摘要描述文本 */
    summary: string;
    /** 高亮指标列表（1-3 个最佳） */
    metrics?: HighlightMetric[];
    /** 关键洞察列表 */
    insights?: InsightItem[];
    /** 是否显示加载状态 */
    loading?: boolean;
    /** 加载失败时的错误文本 */
    error?: string;
    /** 数据刷新时间（ISO 字符串） */
    updatedAt?: string;
    /** 自定义类名 */
    className?: string;
    /** 点击 AI 分析区域回调 */
    onAIAnalyze?: () => void;
    /** 是否正在 AI 分析中 */
    analyzing?: boolean;
}
/**
 * AISummaryCard — AI 智能摘要卡片。
 *
 * 在详情页 / 仪表盘顶部展示 AI 自动生成的业务摘要，
 * 包含关键指标高亮显示和智能洞察，帮助运营人员快速掌握核心信息。
 *
 * 特性：
 * - AI 生成的摘要文本
 * - 1-3 个高亮指标（含趋势变化）
 * - 关键洞察列表（正面/负面/提示）
 * - 加载态 / 错误态 / 空状态
 * - AI 重新分析按钮
 * - 更新时间提示
 *
 * @example
 * // 基础用法
 * <AISummaryCard
 *   title="门店运营摘要"
 *   summary="今日门店订单量环比增长 12%，关键指标全部达标。其中线上订单增长显著，但退单率略有上升。"
 *   metrics={[
 *     { label: '订单量', value: 1280, trend: 'up', changePercent: 12, isPositive: true, unit: '单' },
 *     { label: '退单率', value: 3.2, trend: 'down', changePercent: -0.5, isPositive: false, unit: '%' },
 *   ]}
 *   insights={[
 *     { type: 'positive', text: '线上订单增长 25%，建议扩充晚班运力' },
 *     { type: 'negative', text: '商品 A 库存不足，建议及时补货' },
 *   ]}
 *   updatedAt={new Date().toISOString()}
 * />
 *
 * @example
 * // 加载状态
 * <AISummaryCard loading summary="" title="加载中..." />
 *
 * @example
 * // 错误状态
 * <AISummaryCard
 *   error="AI 分析服务暂时不可用，请稍后重试"
 *   summary=""
 * />
 */
declare function AISummaryCard({ title, summary, metrics, insights, loading, error, updatedAt, className, onAIAnalyze, analyzing, }: AISummaryCardProps): React__default.JSX.Element;

interface RatingProps {
    /** Current rating value (0 to max). */
    value?: number;
    /** Maximum rating value (number of stars). */
    max?: number;
    /** Star size in pixels. */
    size?: number;
    /** Active star color. */
    activeColor?: string;
    /** Inactive star color. */
    inactiveColor?: string;
    /** Allow user to change the rating. When false, stars are read-only. */
    interactive?: boolean;
    /** Called when the user selects a rating. */
    onChange?: (value: number) => void;
    /** Show numeric label next to stars (e.g. "4.2"). */
    showValue?: boolean;
    /** Custom label format; receives current value. */
    formatLabel?: (value: number, max: number) => string;
    /** Tooltip / title per star index (1-based). */
    starLabels?: string[];
    /** Allow half-star precision. */
    half?: boolean;
    /** Accessible name for the rating group. */
    'aria-label'?: string;
    /** Test id. */
    'data-testid'?: string;
    /** Extra class name. */
    className?: string;
    /** Inline style overrides. */
    style?: React__default.CSSProperties;
}
/**
 * Rating — a reusable star-rating component supporting half-star precision,
 * interactive selection, and read-only display modes.
 *
 * Used across M5 apps for product reviews, member satisfaction scoring, and
 * service quality evaluation.
 */
declare function Rating({ value, max, size, activeColor, inactiveColor, interactive, onChange, showValue, formatLabel, starLabels, half, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, }: RatingProps): React__default.JSX.Element;

interface BranchSelectorNode {
    id: string;
    label: string;
    type: 'brand' | 'store' | 'region';
    children?: BranchSelectorNode[];
    disabled?: boolean;
}
interface BranchSelectorProps {
    /** 树形组织/门店结构 */
    nodes: BranchSelectorNode[];
    /** 当前选中节点 */
    value?: string | null;
    /** 选中回调 */
    onChange?: (nodeId: string) => void;
    /** 展开深度（0=全部折叠，-1=全部展开） */
    defaultExpandDepth?: number;
    /** 空状态文案 */
    emptyLabel?: string;
    /** 禁用 */
    disabled?: boolean;
    /** 附加 className */
    className?: string;
}
declare function findNodeById(nodes: BranchSelectorNode[], id: string): BranchSelectorNode | null;
declare function collectLeafIds(nodes: BranchSelectorNode[]): string[];
declare function BranchSelector({ nodes, value, onChange, defaultExpandDepth, emptyLabel, disabled, className, }: BranchSelectorProps): React.JSX.Element;
declare namespace BranchSelector {
    var displayName: string;
}

/** 单个时段的预测数据点 */
interface ForecastDataPoint {
    /** 时段标签, 如 "6月24日" 或 "Week 26" */
    label: string;
    /** 预测值 */
    predicted: number;
    /** 乐观预测值 (置信上限) */
    optimistic: number;
    /** 悲观预测值 (置信下限) */
    pessimistic: number;
    /** 实际值 (如果有历史数据) */
    actual?: number;
}
/** 预测趋势 */
type ForecastTrend = 'up' | 'down' | 'stable';
/** 预测准确性评级 */
type ForecastAccuracy = 'high' | 'medium' | 'low';
/** 销售预测面板 Props */
interface SalesForecastPanelProps {
    /** 预测数据点列表 (建议 5-12 个) */
    dataPoints: ForecastDataPoint[];
    /** 当前预测整体趋势 */
    trend: ForecastTrend;
    /** 预测准确度 */
    accuracy: ForecastAccuracy;
    /** 预测置信度百分比 (0-100) */
    confidence: number;
    /** 面板标题 */
    title?: string;
    /** 摘要描述 */
    description?: string;
    /** 额外统计数据 */
    stats?: {
        label: string;
        value: string;
        trend?: 'up' | 'down' | 'neutral';
    }[];
    /** 是否显示预测图表 */
    showChart?: boolean;
    /** 自定义底部操作 */
    footerActions?: React__default.ReactNode;
    /** 自定义类名 */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
declare function SalesForecastPanel({ dataPoints, trend, accuracy, confidence, title, description, stats, showChart, footerActions, 'data-testid': testId, }: SalesForecastPanelProps): React__default.JSX.Element;

interface WorkbenchNavItem {
    key: string;
    label: string;
    href: string;
    description?: string;
    icon?: React__default.ReactNode;
    badge?: number;
}
interface WorkbenchBreadcrumb {
    label: string;
    href?: string;
}
interface WorkbenchHeaderProps {
    /** 角色/来源标识，如 "Platform" */
    channel: string;
    /** 工作台标题 */
    title: string;
    /** 工作台描述 */
    description?: string;
    /** 面包屑导航 */
    breadcrumbs?: WorkbenchBreadcrumb[];
    /** 操作按钮组 */
    actions?: React__default.ReactNode;
    /** 导航条目 */
    navItems?: WorkbenchNavItem[];
    /** 加载状态 */
    loading?: boolean;
    /** 数据测试属性 */
    'data-testid'?: string;
}
/**
 * WorkbenchHeader — 工作台顶栏组件
 *
 * 展示工作台页面顶部的品牌信息、面包屑导航、
 * 标题描述和操作入口。适用于 pad/[role] 和
 * workbench/[role] 类型的 role-scoped 页面。
 *
 * @example
 * ```tsx
 * <WorkbenchHeader
 *   channel="Platform"
 *   title="运营管理工作台"
 *   description="管理门店运营、设备状态和告警处理"
 *   breadcrumbs={[
 *     { label: '首页', href: '/' },
 *     { label: '工作台' },
 *   ]}
 *   navItems={[
 *     { key: 'ops', label: '运营管理', href: '/operations', description: '门店运营概览' },
 *     { key: 'alerts', label: '告警中心', href: '/alerts', badge: 3 },
 *   ]}
 * />
 * ```
 */
declare function WorkbenchHeader({ channel, title, description, breadcrumbs, actions, navItems, loading, 'data-testid': testId, }: WorkbenchHeaderProps): React__default.JSX.Element;

interface SideNavItem {
    key: string;
    label: string;
    icon?: React__default.ReactNode;
    href?: string;
    badge?: number;
    children?: SideNavItem[];
    disabled?: boolean;
}
interface SideNavigationProps {
    items: SideNavItem[];
    activeKey: string;
    onNavigate: (key: string, item: SideNavItem) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    header?: React__default.ReactNode;
    footer?: React__default.ReactNode;
    className?: string;
}
declare function SideNavigation({ items, activeKey, onNavigate, collapsed, onToggleCollapse, header, footer, className, }: SideNavigationProps): React__default.JSX.Element | null;

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps {
    /** Button label / children */
    children?: React__default.ReactNode;
    /** Visual variant */
    variant?: ButtonVariant;
    /** Size */
    size?: ButtonSize;
    /** Whether the button is in a loading state */
    loading?: boolean;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Click handler (ignored when loading) */
    onClick?: (e: React__default.MouseEvent<HTMLButtonElement>) => void;
    /** HTML button type */
    type?: 'button' | 'submit' | 'reset';
    /** Full width */
    block?: boolean;
    /** Additional inline styles */
    style?: React__default.CSSProperties;
    /** Additional className */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
declare const Button: React__default.ForwardRefExoticComponent<ButtonProps & React__default.RefAttributes<HTMLButtonElement>>;

interface TrendDataPoint {
    label: string;
    value: number;
    /** Optional baseline / target */
    target?: number;
    /** Highlight color override */
    color?: string;
}
interface SmartTrendChartProps {
    /** Time-series data points */
    data: TrendDataPoint[];
    /** Chart title */
    title?: string;
    /** Y-axis label */
    yAxisLabel?: string;
    /** Bar color (default theme) */
    barColor?: string;
    /** Target line color */
    targetColor?: string;
    /** Height in px */
    height?: number;
    /** Show data values on bars */
    showValues?: boolean;
    /** Show target line overlay */
    showTarget?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Empty state text */
    emptyText?: string;
    /** Optional className */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * SmartTrendChart — a simple bar/trend visualization for AI decision
 * dashboards, showing KPI values over time with optional target overlay.
 */
declare function SmartTrendChart({ data, title, yAxisLabel, barColor, targetColor, height, showValues, showTarget, loading, emptyText, className, 'data-testid': dataTestId, }: SmartTrendChartProps): React__default.JSX.Element;

interface TierData {
    key: string;
    label: string;
    count: number;
    color: string;
}
interface TierDistributionChartProps {
    /** Tier segments */
    tiers: TierData[];
    /** Total count for percentage calculation */
    total: number;
    /** Chart title */
    title?: string;
    /** Canvas size in px (default 240) */
    size?: number;
    /** Show total count in center of donut */
    showTotalInCenter?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Empty state text */
    emptyText?: string;
    /** Optional className */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * TierDistributionChart — a donut/radial chart for visualizing member tier
 * distribution. Uses pure SVG arcs with a doughnut hole. Suitable for
 * AI dashboards, role workbenches, and membership analytics.
 */
declare function TierDistributionChart({ tiers, total, title, size, showTotalInCenter, loading, emptyText, className, 'data-testid': dataTestId, }: TierDistributionChartProps): React__default.JSX.Element;

export { AIDecisionPanel, type AIDecisionPanelProps, AISummaryCard, type AISummaryCardProps, Accordion, type AccordionItem, type AccordionProps, Alert, type AlertProps, type AlertState, type AlertVariant, type AnomalyAlert, AnomalyAlertPanel, type AnomalyAlertPanelProps, type AnomalySeverity, type AnomalySource, type AnomalySummary, type AuditAction, type AuditEntry, type AuditFilter, type AuditSeverity, type AuditSummary, Avatar, AvatarGroup, type AvatarGroupProps, type AvatarProps, type AvatarSize, type AvatarStatus, Badge, type BadgePlacement, type BadgeProps, type BadgeSize, type BadgeVariant, type BasketItem, type BatchAction, BatchSelectionBar, type BatchSelectionBarProps, BranchSelector, type BranchSelectorNode, type BranchSelectorProps, Breadcrumb, type BreadcrumbItem, type BreadcrumbProps, Button, type ButtonProps, type ButtonSize, type ButtonVariant, Calendar, type CalendarMarker, type CalendarProps, Card, Carousel, type CarouselProps, type CarouselSlide, type CertificatePosture, Chart, type ChartDataPoint, type ChartProps, type ChartType, Checkbox, type CheckboxProps, type CheckboxSize, type CheckoutStatus, CombinedDetailPage, type CombinedDetailPageProps, Combobox, type ComboboxOption, type ComboboxProps, type CommandItem, CommandPalette, type CommandPaletteProps, type ConciergeAction, ConciergePanel, type ConciergePanelProps, ConfigurationPosturePanel, type ConfigurationPosturePanelProps, ConfirmDialog, ContentSwitcher, type ContentSwitcherProps, type ContentSwitcherSegment, ContextMenu, type ContextMenuEntry, type ContextMenuItem, type ContextMenuProps, type ContextMenuSeparator, CopyToClipboard, type DailyReceptionStats, DataTable, type DataTableColumn, type DataTableSortConfig, DateRangePicker, type DateRangePickerProps, type DateRangePreset, type DateRangeValue, DateTimePicker, type DateTimePickerMode, type DateTimePickerProps, DecisionAuditTrail, type DecisionAuditTrailProps, type DescriptionItem, DescriptionList, type DescriptionListProps, DetailActionBar, type DetailActionBarAction, type DetailActionBarIcon, type DetailActionBarProps, DetailClosureBar, type DetailClosureBarProps, type DetailClosureLink, type DetailInfoRow, DetailShell, type DetailShellAction, type DetailTab, type DeviceEntry, DeviceInspectionPanel, type DeviceInspectionPanelProps, type DevicePanelSummary, type DeviceStatus, DeviceStatusPanel, type DeviceStatusPanelProps, type DeviceStatusSummary, type DeviceType, type DistrictStoreSnapshot, type DistrictSummary, Drawer, type DrawerPlacement, type DrawerProps, Dropdown, type DropdownItem, type DropdownProps, EmptyState, ErrorBoundary, type ErrorBoundaryFallbackArgs, type ErrorBoundaryProps, type ErrorBoundarySeverity, FileUpload, type FileUploadProps, FilterBar, type FilterChip, FilterChips, type FilterChipsProps, type FilterShortcut, type FollowUpClient, type ForecastAccuracy, type ForecastDataPoint, type ForecastTrend, FormField, type FormPageField, type FormPageFieldRule, FormPageScaffold, type FormPageScaffoldMeta, type FormPageScaffoldProps, type FormPageSubmitResult, FormSubmitFeedback, FoundationAlertAcknowledgeActionButton, FoundationAlertDemoListPage, FoundationAlertDetailView, FoundationAlertDetailsReadout, type FoundationAlertFilterState, type FoundationAlertFilterSummaryItem, type FoundationAlertGovernance, type FoundationAlertGovernanceAlert, FoundationAlertLinkedAlertGridReadout, FoundationAlertLinkedFocusBarReadout, type FoundationAlertLinkedOverviewCardDefinition, type FoundationAlertLinkedOverviewPalette, type FoundationAlertLinkedOverviewPanelRenderArgs, FoundationAlertLinkedOverviewSection, type FoundationAlertLinkedOverviewStatsPreset, FoundationAlertLinkedOverviewStatsReadout, type FoundationAlertLinkedOverviewSummaryLike, FoundationAlertLinkedOverviewSurface, type FoundationAlertLinkedOverviewSurfaceProps, FoundationAlertListPageSection, type FoundationAlertMutation, type FoundationAlertMutationAction, FoundationAlertOverviewReadout, type FoundationAlertOwnerSummaryItem, type FoundationAlertPanelClientAccess, FoundationAlertPanelFrame, FoundationAlertPanelOwnerSummaryReadout, type FoundationAlertPanelPalette, type FoundationAlertPanelReadoutPalette, FoundationAlertPanelSelectedAlertReadout, FoundationAlertPanelSourceSummaryReadout, FoundationAlertPanelSummaryDigestReadout, FoundationAlertPanelSurface, type FoundationAlertPanelSurfaceProps, type FoundationAlertPanelThemePreset, FoundationAlertPanelTimelineReadout, type FoundationAlertPanelToolbarPalette, FoundationAlertPresetDetailRoute, type FoundationAlertRecord, FoundationAlertRuntimeCallbackStalledReadout, type FoundationAlertSourceSummaryItem, FoundationAlertTableCard, type FoundationAlertTimelineItem, type FoundationAlertTimelineMetrics, FoundationConsumerWiringSection, type FoundationConsumerWiringSectionProps, FrontDeskPanel, type FrontDeskPanelProps, GaugeChart, type GaugeChartProps, type GaugeSegment, type GovernanceAlert, GovernanceQuickViewSection, type GovernanceQuickViewSectionProps, type GovernanceReadModel, type HeatmapCell, HeatmapChart, type HeatmapChartProps, type HeatmapColorScheme, type HighlightMetric, type ImageItem, ImagePreview, type ImagePreviewProps, InfoRow, Input, InputNumber, type InputNumberProps, type InputNumberSize, type InputProps, type InputSize, type InputVariant, type InsightItem, type InspectionAlert, type InspectionItem, type InspectionMetrics, type InspectionSummary, type InspectionTask, type ListPageFacetConfig, type ListPageFacetState, ListToolbar, type ListToolbarBatchAction, type ListToolbarFilterOption, type ListToolbarProps, type ListToolbarSortOption, type ListToolbarViewMode, LoadingSkeleton, type MemberLevel, MemberLevelDistribution, type MemberLevelDistributionProps, type MemberQuickLookup, type MemberServiceOverview, type MemberTier, MemberTierDistribution, type MemberTierDistributionProps, type MemberVisitRecord, Modal, type ModalProps, MultiSelect, type MultiSelectOption, type MultiSelectProps, type NotificationAction, type NotificationCategory, NotificationCenter, type NotificationCenterProps, type NotificationItem, type NotificationSeverity, type NotificationSummary, OperationsManagerDashboard, type OperationsManagerDashboardProps, type OpsQuickAction, PageShell, PaginatedDataTableCard, Pagination, PasswordInput, type PasswordInputProps, type PaymentMethod, type PendingTask, type PersonalizedRecommendation, type PointsTransaction, Popover, type PopoverPlacement, type PopoverProps, PortalConsumerGovernanceSection, type PortalConsumerGovernanceSectionProps, PortalList, type PortalListItemView, Progress, type ProgressProps, type QueueItem, type QuickAction, type QuickFnButton, type QuickStatItem, QuickStats, type QuickStatsProps, type RadioDirection, RadioGroup, type RadioGroupProps, type RadioOption, type RadioSize, Rating, type RatingProps, type RuleExecutionResult, type RuleExecutionStatus, type RuleExecutionSummary, type RuntimeGovernancePanelPreset, RuntimeGovernancePanelTemplate, RuntimeOperationDateTimeReadout, RuntimeOperationDemoListPage, RuntimeOperationDetailView, RuntimeOperationIdReadout, RuntimeOperationOverviewReadout, RuntimeOperationPresetDetailRoute, RuntimeOperationReceiptListReadout, type RuntimeOperationReceiptRecord, type RuntimeOperationRecord, RuntimeOperationStatusReadout, RuntimeOperationTargetReadout, RuntimeOperationTimelineReadout, RuntimeOperationToolbar, RuntimeOperationTypeReadout, RuntimeOperationsListPageSection, RuntimeOperationsTableCard, RuntimePanelFeedback, RuntimePanelFrame, RuntimePanelGrid, RuntimePresetCard, RuntimePresetSelector, RuntimeReceiptEvents, RuntimeReceiptStatusCard, SalesClerkTool, type SalesClerkToolProps, SalesForecastPanel, type SalesForecastPanelProps, type SalesScript, ScrollArea, type ScrollAreaProps, SearchFilterInput, type SecretPosture, Select, type SelectOption, type SelectProps, type SideNavItem, SideNavigation, type SideNavigationProps, Slider, type SliderProps, SmartTrendChart, type SmartTrendChartProps, StatCard, StatusBadge, StatusBadgeGroup, Stepper, type StepperProps, type StepperStep, type StoreDailyMetrics, StoreManagerDashboard, type StoreManagerDashboardProps, SubmitButton, type SubmitButtonProps, type SubmitButtonVariant, Switch, type SwitchProps, type SwitchSize, Table, type TableColumn, type TablePaginationState, type TableProps, type TableSortState, Tabs, Tag, TagGroup, type TagProps, type TagVariant, type TierData, TierDistributionChart, type TierDistributionChartProps, TimePicker, type TimePickerProps, Timeline, type TimelineItem, type TimelineItemVariant, type TimelineProps, ToastContainer, type ToastEntry, type ToastOptions, type ToastVariant, Tooltip, type TooltipPlacement, type TooltipProps, type TransitionAction, Tree, type TreeNode, type TreeProps, type TrendDataPoint, type TrendDirection, type UploadedFile, type UseAlertOptions, type UseToastReturn, VirtualizedList, type VirtualizedListProps, type VirtualizedListRow, type WorkbenchBreadcrumb, WorkbenchHeader, type WorkbenchHeaderProps, type WorkbenchNavItem, WorkspaceBreadcrumb, type WorkspaceBreadcrumbProps, type WorkspaceBreadcrumbSegment, buildFoundationAlertDrilldownSections, buildFoundationAlertLytConnectionGovernanceSections, buildFoundationAlertRecordFromDrilldown, canReplayRuntimePanelAction, canReplayRuntimePanelReceipt, collectLeafIds, computeDeviceSummary, createFoundationAdminGovernanceStatsCopy, createFoundationAlertDetailMockMap, createFoundationAlertLinkedOverviewStats, createFoundationAlertMockRecords, createFoundationAlertNextNavigationBindings, createFoundationAlertPanelActionButtonStyle, createFoundationAlertPanelFeedbackStyle, createFoundationAlertPanelFilterButtonStyle, createFoundationAlertPanelFilterChipStyle, createFoundationAlertPanelSectionStyle, createFoundationAlertPanelSelectionButtonStyle, createFoundationAlertPanelShortcutCardStyle, createFoundationAlertPanelSummaryCardStyle, createFoundationAlertTableColumns, createRuntimeOperationDetailMockMap, createRuntimeOperationMockRecords, createRuntimeOperationTableColumns, createRuntimeOperationToolbarProps, createRuntimeReceiptStatusCard, createRuntimeReceiptStatusCardProps, describeRuntimeCallbackStalledEscalation, executeRuntimePanelOperation, findNodeById, formatFoundationAlertActionLabel, formatFoundationAlertDrilldownDateTime, formatRuntimeCallbackStalledDuration, foundationAdminGovernanceListPreset, foundationAdminGovernanceSourceLabels, foundationAlertDetailDemoPresets, foundationAlertListDemoPresets, foundationAlertPanelThemePresets, foundationAlertSeverityLabels, foundationAlertStatusLabels, getRuntimePanelTenantId, hasRuntimePanelReceiptCode, joinRuntimeScopeSummary, listPageStatCardStyle, mapFoundationGovernanceAlertsToRecords, refreshFoundationAlertSelection, runtimeOperationDetailDemoPresets, runtimeOperationListDemoPresets, runtimeOperationStatusLabels, runtimeOperationStatusVariants, summarizeRuntimePanelReceipt, useAlert, useFormSubmit, useFoundationAlertDemoAcknowledge, useFoundationAlertDrilldownQuery, useFoundationAlertFocusSync, useFoundationAlertGovernanceState, useFoundationAlertLinkedFocusQuery, useFoundationAlertMutationController, useFoundationAlertTimelineQueryState, useFoundationAlertViewLinkController, useFoundationAsyncLoader, useListPageSectionState, useNotificationSummary, usePagination, useRuntimePanelState, useRuntimePresetSelection, useSearchFilter, useSortedItems, useToast, validateFormFields };
