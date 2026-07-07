import * as React from 'react';
import React__default, { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { FoundationAlertTimelineFilterState, FoundationAlertCode, FoundationAlertTimelineEntry, FoundationAlertDrilldownResponse, FoundationAlertCatalogItem, FoundationOperationsAlert, FoundationAlertMutationKind, FoundationAlertRuntimeCallbackStalledDetail, FoundationAlertTimelineMetrics as FoundationAlertTimelineMetrics$1, FoundationAlertTimelineDigest } from '@m5/types';

interface DiffEntry {
    /** Configuration key path (e.g. "features.newCheckout.enabled"). */
    key: string;
    /** Human-readable label. */
    label: string;
    /** Previous version value (stringified). */
    oldValue: string;
    /** Current version value (stringified). */
    newValue: string;
    /** Optional description of the field. */
    description?: string;
}
type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';
interface ConfigurationVersionDiffProps {
    /** Array of entries to compare. */
    entries: DiffEntry[];
    /** Left-column label (previous version). */
    oldLabel?: string;
    /** Right-column label (current version). */
    newLabel?: string;
    /** CSS class name. */
    className?: string;
    /** Inline styles. */
    style?: React__default.CSSProperties;
}
declare function ConfigurationVersionDiff({ entries, oldLabel, newLabel, className, style, }: ConfigurationVersionDiffProps): React__default.JSX.Element;

type DividerOrientation = 'horizontal' | 'vertical';
type DividerVariant = 'solid' | 'dashed' | 'dotted';
interface DividerProps {
    /** Orientation: horizontal (default) or vertical */
    orientation?: DividerOrientation;
    /** Visual style: solid (default), dashed, dotted */
    variant?: DividerVariant;
    /** Color override (default: #d1d5db / gray-300) */
    color?: string;
    /** Thickness in px, default 1 */
    thickness?: number;
    /** Spacing around the divider (CSS margin) */
    spacing?: number | string;
    /** For vertical dividers: height in px or CSS value. Default '1em' */
    height?: number | string;
    /** For horizontal dividers: width in px or CSS value. Default '100%' */
    width?: number | string;
    /** For dashed/dotted: dash length in px, default 4 */
    dashLength?: number;
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
 * Divider — a horizontal or vertical separator line.
 *
 * Used to visually separate content sections, toolbar groups, or list items.
 */
declare function Divider({ orientation, variant, color, thickness, spacing, height, width, dashLength, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, }: DividerProps): React__default.JSX.Element;

type DotVariant = 'filled' | 'outlined' | 'minimal';
type DotSize = 'sm' | 'md' | 'lg';
interface DotNavigationProps {
    /** Total number of dots (pages/steps/items). */
    total: number;
    /** 0-based index of the active dot. */
    activeIndex: number;
    /** Callback fired when a dot is clicked. */
    onChange?: (index: number) => void;
    /** Visual variant of the dot. */
    variant?: DotVariant;
    /** Size of each dot. */
    size?: DotSize;
    /** Color for the active dot (CSS color). Defaults to #6366f1 (indigo). */
    activeColor?: string;
    /** Color for inactive dots. Defaults to #d1d5db (gray-300). */
    inactiveColor?: string;
    /** Whether to animate dot transitions. */
    animated?: boolean;
    /** Direction of the dot layout. */
    direction?: 'row' | 'column';
    /** Gap between dots in px. */
    gap?: number;
    /** Whether to show the current position as text (e.g. "2 / 5") below the dots. */
    showCounter?: boolean;
    /** Optional className for external styling. */
    className?: string;
    /** Optional style overrides. */
    style?: React__default.CSSProperties;
    /** Test id for targeting in tests. */
    'data-testid'?: string;
    /** ARIA label for the navigation region. */
    ariaLabel?: string;
}
declare function DotNavigation({ total, activeIndex, onChange, variant, size, activeColor, inactiveColor, animated, direction, gap, showCounter, className, style, 'data-testid': dataTestId, ariaLabel, }: DotNavigationProps): React__default.JSX.Element;

/** 单行小票条目 */
interface ReceiptLineItem {
    name: string;
    quantity: number;
    unitPrice: number;
    /** 折扣金额（正数 = 减免），默认 0 */
    discount?: number;
}
/** 支付方式 */
type PaymentMethod$1 = 'cash' | 'wechat' | 'alipay' | 'card' | 'membership_balance' | 'other';
/** 支付记录 */
interface ReceiptPayment {
    method: PaymentMethod$1;
    amount: number;
    /** 交易号（微信/支付宝/刷卡） */
    transactionId?: string;
}
/** 小票抬头信息 */
interface ReceiptHeader {
    /** 门店名称 */
    storeName: string;
    /** 门店地址 */
    storeAddress?: string;
    /** 门店电话 */
    storePhone?: string;
    /** 自定义抬头行（如宣传语） */
    tagline?: string;
}
/** 小票完整数据 */
interface ReceiptData {
    header: ReceiptHeader;
    /** 小票编号 */
    receiptNo: string;
    /** 收银员 */
    cashier: string;
    /** 下单时间 ISO 字符串 */
    createdAt: string;
    /** 商品明细 */
    items: ReceiptLineItem[];
    /** 支付记录 */
    payments: ReceiptPayment[];
    /** 找零金额 */
    change?: number;
    /** 备注 */
    note?: string;
    /** 会员信息（可选） */
    memberName?: string;
    memberPhone?: string;
}
interface ReceiptPreviewProps {
    /** 小票数据 */
    data: ReceiptData;
    /** 小票宽度 px，默认 320 */
    width?: number;
    /** 额外 CSS class */
    className?: string;
    /** 测试 id */
    'data-testid'?: string;
    /** 打印回调 */
    onPrint?: () => void;
}
declare function ReceiptPreview({ data, width, className, 'data-testid': testId, onPrint, }: ReceiptPreviewProps): React__default.JSX.Element;

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
    /** Inline styles for the badge element */
    style?: React__default.CSSProperties;
}
/**
 * Badge — a numeric indicator, status dot, or content badge typically
 * overlaid on another UI element.
 *
 * - `dot`: renders a small colored circle without content
 * - `overflowCount`: clamps displayed number, e.g. overflowCount=99 renders "99+"
 * - `standalone`: renders as a normal inline element without absolute positioning
 */
declare function Badge({ children, variant, size, placement, dot, overflowCount, visible, offset, standalone, className, style: externalStyle, 'data-testid': dataTestId, }: BadgeProps): React__default.JSX.Element | null;

type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';
type ChipSize = 'sm' | 'md' | 'lg';
interface ChipProps {
    /** Label text or content */
    children?: React__default.ReactNode;
    /** Color variant */
    variant?: ChipVariant;
    /** Size */
    size?: ChipSize;
    /** Whether the chip is outlined (ghost) style */
    outlined?: boolean;
    /** Whether the chip is disabled */
    disabled?: boolean;
    /** Makes the chip removable, calls onClose when X clicked */
    removable?: boolean;
    /** Callback when remove button clicked */
    onRemove?: () => void;
    /** Callback when the chip itself is clicked */
    onClick?: () => void;
    /** Left icon / avatar element */
    icon?: React__default.ReactNode;
    /** Optional className */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * Chip — a compact element representing an input, attribute, or action.
 *
 * - `removable`: shows an × button that fires onRemove
 * - `outlined`: ghost / bordered variant with transparent background
 * - `icon`: optional leading icon or avatar
 * - `onClick`: makes the chip interactive
 */
declare function Chip({ children, variant, size, outlined, disabled, removable, onRemove, onClick, icon, className, 'data-testid': dataTestId, }: ChipProps): React__default.JSX.Element;

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

interface BreadcrumbPageHeaderAction {
    /** Button label */
    label: string;
    /** Click handler */
    onClick?: () => void;
    /** Visual variant */
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    /** Disabled state */
    disabled?: boolean;
    /** Leading icon (emoji or short text) */
    icon?: string;
    /** HTML type attribute */
    type?: 'button' | 'submit' | 'reset';
}
interface BreadcrumbPageHeaderProps {
    /** Ordered breadcrumb trail */
    breadcrumbs: Array<{
        label: string;
        href?: string;
    }>;
    /** Page title */
    title: string;
    /** Optional description below the title */
    description?: string;
    /** Action buttons displayed in the header */
    actions?: BreadcrumbPageHeaderAction[];
    /** Test id */
    'data-testid'?: string;
    /** Extra CSS class */
    className?: string;
}
declare function BreadcrumbPageHeader({ breadcrumbs, title, description, actions, 'data-testid': testId, className, }: BreadcrumbPageHeaderProps): React__default.JSX.Element;

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

interface CascaderOption {
    value: string;
    label: string;
    children?: CascaderOption[];
    disabled?: boolean;
    /** 图标/装饰 */
    icon?: React__default.ReactNode;
}
interface CascaderProps {
    /** 选项树 */
    options: CascaderOption[];
    /** 当前选中值路径 */
    value?: string[];
    /** 默认选中值路径 (非受控) */
    defaultValue?: string[];
    /** 选中回调，返回选中项的完整值路径 */
    onChange?: (value: string[], selectedLabels: string[]) => void;
    /** 占位文字 */
    placeholder?: string;
    /** 禁用 */
    disabled?: boolean;
    /** 尺寸 */
    size?: 'sm' | 'md' | 'lg';
    /** 是否允许只选父级 */
    allowParentSelect?: boolean;
    /** 最大显示层级 */
    maxLevel?: number;
    /** 自定义类名 */
    className?: string;
    style?: React__default.CSSProperties;
    'aria-label'?: string;
    'data-testid'?: string;
}
/**
 * Cascader — 级联选择器。
 *
 * 用于多层级数据（如地区/分类）的逐级选择，支持受控/非受控、多尺寸、禁用。
 *
 * @example
 * ```tsx
 * <Cascader
 *   options={[
 *     {
 *       value: 'zhejiang', label: '浙江',
 *       children: [
 *         { value: 'hangzhou', label: '杭州' },
 *         { value: 'ningbo', label: '宁波' },
 *       ],
 *     },
 *   ]}
 *   onChange={(values, labels) => console.log(values, labels)}
 * />
 * ```
 */
declare function Cascader({ options, value: controlledValue, defaultValue, onChange, placeholder, disabled, size, allowParentSelect, maxLevel, className, style, 'aria-label': ariaLabel, 'data-testid': dataTestId, }: CascaderProps): React__default.JSX.Element;

interface HSBColor {
    h: number;
    s: number;
    b: number;
}
interface RGBColor {
    r: number;
    g: number;
    b: number;
}
type ColorValue = string;
interface PresetColor {
    label: string;
    color: ColorValue;
}
interface ColorPickerProps {
    /** 当前颜色值 (受控) */
    value?: ColorValue;
    /** 颜色变化回调 */
    onChange?: (color: ColorValue) => void;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否允许清除 */
    allowClear?: boolean;
    /** 是否显示透明度调整 */
    showAlpha?: boolean;
    /** 预设颜色 */
    presets?: PresetColor[];
    /** 尺寸 */
    size?: 'small' | 'medium' | 'large';
    /** 显示格式 */
    format?: 'hex' | 'rgb' | 'hsb';
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 表单 name */
    name?: string;
    /** aria-label */
    'aria-label'?: string;
}
/**
 * ColorPicker — 颜色选择器组件。
 *
 * 提供颜色选择交互，支持 Hex/RGB/HSB 颜色格式，
 * 包含色相条、饱和度/亮度面板、预设颜色和清除功能。
 */
declare function ColorPicker({ value, onChange, disabled, allowClear, showAlpha, presets, size, format, className, style, name, 'aria-label': ariaLabel, }: ColorPickerProps): React__default.JSX.Element;
declare namespace ColorPicker {
    var displayName: string;
}

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

/** 漏斗步骤数据 */
interface FunnelStep {
    /** 步骤名称 */
    label: string;
    /** 步骤值/人数/数量 */
    value: number;
    /** 步骤颜色 (可选，默认从调色板取) */
    color?: string;
    /** 步骤描述 (可选，显示在详情区域) */
    description?: string;
}
interface FunnelChartProps {
    /** 漏斗步骤数据（从上到下） */
    steps: FunnelStep[];
    /** 标题 */
    title?: string;
    /** 图表宽度 (px)，默认 400 */
    width?: number;
    /** 图表高度（自动计算，最小 200） */
    height?: number;
    /** 百分比显示小数点位数，默认 1 */
    decimalPlaces?: number;
    /** 是否显示转化率箭头 */
    showArrows?: boolean;
    /** 是否显示累计转化率 */
    showConversionRate?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
}
declare function FunnelChart({ steps, title, width: _width, height: _height, decimalPlaces, showArrows, showConversionRate, className, emptyText, }: FunnelChartProps): React__default.JSX.Element;

type RankingItem = {
    /** 排名 */
    rank: number;
    /** 用户/门店/导购 ID */
    id: string;
    /** 名称 */
    name: string;
    /** 头像 URL */
    avatar?: string;
    /** 业绩数值 */
    value: number;
    /** 业绩单位 */
    unit?: string;
    /** 环比变化百分比，正数上升，负数下降 */
    changePercent?: number;
    /** 额外标签 */
    tag?: string;
    /** 标签颜色 */
    tagColor?: string;
};
interface PerformanceRankingProps {
    /** 排行数据 */
    data: RankingItem[];
    /** 排行榜标题 */
    title?: string;
    /** 是否显示冠亚季军特殊样式，默认 true */
    showMedal?: boolean;
    /** 数量上限，默认 10 */
    limit?: number;
    /** 值的标签（如"销售额"、"积分"） */
    valueLabel?: string;
    /** 空状态描述 */
    emptyText?: string;
    /** 样式类 */
    className?: string;
}
declare function PerformanceRanking({ data, title, showMedal, limit, valueLabel, emptyText, className, }: PerformanceRankingProps): React__default.JSX.Element;

/**
 * AI决策面板 - 类型定义
 */
/** 规则执行结果 */
interface DecisionRuleResult {
    ruleId: string;
    ruleName: string;
    /** 是否命中/触发 */
    triggered: boolean;
    /** 决策置信度 0-1 */
    confidence: number;
    /** 规则详情 */
    detail: string;
    /** 建议操作 */
    suggestion?: string;
    /** 关联数据快照 */
    dataSnapshot?: Record<string, unknown>;
    /** 执行时间 */
    executedAt: string;
}
/** 决策事件类型 */
type DecisionEventType = 'member_level' | 'device_risk' | 'points_risk' | 'behavior_alarm' | 'abnormal_transaction' | 'ai_recommendation';
/** 决策事件 */
interface DecisionEvent$1 {
    id: string;
    type: DecisionEventType;
    /** 事件标签 */
    label: string;
    /** 关联会员/设备 ID */
    targetId: string;
    /** 事件级别 */
    severity: 'info' | 'warning' | 'critical';
    /** 规则链执行结果 */
    ruleResults: DecisionRuleResult[];
    /** 总体决策结论 */
    conclusion: string;
    /** 是否已处理 */
    handled: boolean;
    /** 处理人 */
    handledBy?: string;
    /** 处理时间 */
    handledAt?: string;
    /** 事件时间 */
    createdAt: string;
}
/** 决策面板展示配置 */
interface DecisionPanelConfig {
    /** 自动刷新间隔 (ms), 0 表示不自动刷新 */
    autoRefreshMs?: number;
    /** 最多展示条数 */
    maxEvents?: number;
    /** 按类型过滤 */
    typeFilter?: DecisionEventType[];
    /** 按严重度过滤 */
    severityFilter?: DecisionEvent$1['severity'][];
}
/** @deprecated 规则执行状态枚举 */
type RuleExecutionStatus = 'pending' | 'running' | 'success' | 'failure' | 'skipped';

/**
 * AI决策面板 - 规则执行结果展示 (Component)
 *
 * 在会员等级自动评估 / 设备异常检测 / 积分风控等场景下,
 * 展示 AI 规则链执行的详细结果, 包含命中规则/置信度/数据快照/建议操作
 */

interface AiDecisionPanelProps {
    variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram';
    config?: DecisionPanelConfig;
}
/**
 * AI决策面板 - 主组件
 */
declare function AiDecisionPanel({ variant, config }: AiDecisionPanelProps): React__default.JSX.Element;

/** @deprecated 请使用 AiDecisionPanel */
declare const AIDecisionPanel: typeof AiDecisionPanel;

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

/** 雷达图单个维度数据点 */
interface RadarDimension {
    /** 维度标签 */
    label: string;
    /** 当前值 (0-100) */
    value: number;
    /** 基准值（可选，用于对比） */
    baseline?: number;
}
/** 雷达图数据集 */
interface RadarSeries {
    /** 系列名称 */
    name: string;
    /** 颜色 */
    color: string;
    /** 数据点（须与 dimensions 数量一致） */
    data: number[];
}
/** 雷达图组件 Props */
interface RadarChartProps {
    /** 维度列表（定义标签与基线） */
    dimensions: RadarDimension[];
    /** 数据系列（支持多系列对比） */
    series: RadarSeries[];
    /** 图表宽度 */
    width?: number;
    /** 图表高度 */
    height?: number;
    /** 标题 */
    title?: string;
    /** 网格层级数（默认 5 层） */
    gridLevels?: number;
    /** 是否显示数值标签 */
    showValues?: boolean;
    /** 是否显示图例 */
    showLegend?: boolean;
    /** 是否填充区域 */
    fillArea?: boolean;
    /** 填充透明度（默认 0.15） */
    fillOpacity?: number;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** SVG 自定义样式 */
    style?: React__default.CSSProperties;
}
declare function RadarChart({ dimensions, series, width, height, title, gridLevels, showValues, showLegend, fillArea, fillOpacity, className, emptyText, style, }: RadarChartProps): React__default.JSX.Element;

/** 推理步骤状态 */
type ReasoningStepStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'error';
/** 单个推理步骤 */
interface ReasoningStep {
    /** 步骤 ID */
    id: string;
    /** 步骤序号 */
    index: number;
    /** 步骤标题 */
    title: string;
    /** 步骤描述 */
    description?: string;
    /** 当前状态 */
    status: ReasoningStepStatus;
    /** 耗时(ms) */
    durationMs?: number;
    /** 中间结论 */
    conclusion?: string;
    /** 置信度 (0-100) */
    confidence?: number;
    /** 替代方案列表 */
    alternatives?: string[];
}
/** 最终决策结论 */
interface AgentConclusion {
    /** 建议措施 */
    action: string;
    /** 总体置信度 (0-100) */
    confidence: number;
    /** 关键依据 */
    rationale: string;
    /** 风险提示 */
    risks?: string[];
    /** 建议优先级 */
    priority: 'urgent' | 'high' | 'medium' | 'low';
}
/** AI 代理思考面板 Props */
interface AIAgentThinkingPanelProps {
    /** 代理名称 */
    agentName: string;
    /** 推理步骤列表 */
    steps: ReasoningStep[];
    /** 最终结论 */
    conclusion?: AgentConclusion;
    /** 面板标题 */
    title?: string;
    /** 思考总耗时(ms) */
    totalDurationMs?: number;
    /** 加载中（模拟思考动画） */
    thinking?: boolean;
    /** 是否默认展开步骤 */
    defaultExpanded?: boolean;
    /** 空状态文本 */
    emptyText?: string;
    /** 测试 id */
    'data-testid'?: string;
    /** 类名 */
    className?: string;
}
declare function AIAgentThinkingPanel({ agentName, steps, conclusion, title, totalDurationMs, thinking, defaultExpanded, emptyText, 'data-testid': dataTestId, className, }: AIAgentThinkingPanelProps): React__default.JSX.Element;

/** 洞察类型 */
type InsightCategory = 'sales' | 'customer' | 'inventory' | 'anomaly' | 'recommendation' | 'trend';
/** 洞察严重程度 */
type InsightSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
/** 单条分析洞察 */
interface AnalysisInsight {
    /** 洞察唯一标识 */
    id: string;
    /** 洞察类别 */
    category: InsightCategory;
    /** 洞察标题 */
    title: string;
    /** 洞察描述/建议 */
    description: string;
    /** 严重程度 */
    severity: InsightSeverity;
    /** 影响数值（如金额、百分比） */
    impactValue?: string;
    /** 影响标签（如"预计增收 ¥12,000"） */
    impactLabel?: string;
    /** 相关链接或引用标识 */
    relatedId?: string;
    /** 可信度 0-100 */
    confidence: number;
    /** 生成时间 */
    generatedAt: string;
    /** 是否已读 */
    isRead?: boolean;
}
/** 分析洞察面板属性 */
interface AIAnalysisInsightsPanelProps {
    /** 洞察列表 */
    insights: AnalysisInsight[];
    /** 加载状态 */
    loading?: boolean;
    /** 错误信息 */
    error?: string;
    /** 面板标题 */
    title?: string;
    /** 面板描述 */
    description?: string;
    /** 已读/未读切换回调 */
    onMarkRead?: (id: string) => void;
    /** 全部标记已读回调 */
    onMarkAllRead?: () => void;
    /** 刷新回调 */
    onRefresh?: () => void;
    /** 洞察点击回调 */
    onInsightClick?: (insight: AnalysisInsight) => void;
}
/**
 * AIAnalysisInsightsPanel - 智能分析洞察面板
 *
 * 聚合展示 AI 分析生成的多种类型洞察（销售、客户、库存、异常检测等），
 * 支持未读标记、可信度展示、严重程度分类。
 */
declare function AIAnalysisInsightsPanel({ insights, loading, error, title, description, onMarkRead, onMarkAllRead, onRefresh, onInsightClick, }: AIAnalysisInsightsPanelProps): React__default.JSX.Element;

/** 消息角色 */
type ChatMessageRole = 'user' | 'agent' | 'system';
/** 消息状态 */
type ChatMessageStatus = 'sending' | 'sent' | 'error';
/** 单条聊天消息 */
interface ChatMessage {
    /** 消息 ID */
    id: string;
    /** 角色 */
    role: ChatMessageRole;
    /** 消息内容 */
    content: string;
    /** 时间戳 ISO */
    timestamp: string;
    /** 状态（仅 agent 消息） */
    status?: ChatMessageStatus;
    /** token 消耗 */
    tokenUsage?: number;
    /** 耗时(ms) */
    durationMs?: number;
}
/** AI Agent 聊天面板 Props */
interface AIAgentChatPanelProps {
    /** 代理名称 */
    agentName: string;
    /** 代理头像 emoji */
    agentAvatar?: string;
    /** 初始消息列表 */
    initialMessages?: ChatMessage[];
    /** 发送消息回调 */
    onSend: (message: string) => Promise<string | void>;
    /** 面板标题 */
    title?: string;
    /** 欢迎消息 */
    welcomeMessage?: string;
    /** 输入占位符 */
    placeholder?: string;
    /** 是否加载中 */
    loading?: boolean;
    /** 最大消息数 */
    maxMessages?: number;
    /** 快捷建议列表 */
    suggestions?: string[];
    /** 空状态文本 */
    emptyText?: string;
    /** 是否禁用输入 */
    disabled?: boolean;
    /** 测试 id */
    'data-testid'?: string;
    /** 类名 */
    className?: string;
}
declare function AIAgentChatPanel({ agentName, agentAvatar, initialMessages, onSend, title, welcomeMessage, placeholder, loading, maxMessages, suggestions, emptyText, disabled, 'data-testid': dataTestId, className, }: AIAgentChatPanelProps): React__default.JSX.Element;

/** 单个坐席工作量概览 */
interface AgentWorkload {
    /** 坐席 ID */
    id: string;
    /** 坐席名称 */
    name: string;
    /** 坐席头像 emoji */
    avatar?: string;
    /** 当前状态: online / away / busy / offline */
    status: 'online' | 'away' | 'busy' | 'offline';
    /** 进行中任务数 */
    activeTasks: number;
    /** 待处理任务数 */
    pendingTasks: number;
    /** 今日已完成任务数 */
    completedToday: number;
    /** 今日平均响应时间(秒) */
    avgResponseSec: number;
    /** 今日好评率 (0-100) */
    satisfactionRate: number;
    /** 专业技能标签 */
    skills?: string[];
}
/** 面板 Props */
interface AIAgentWorkloadDistributionPanelProps {
    /** 坐席工作量列表 */
    agents: AgentWorkload[];
    /** 面板标题 */
    title?: string;
    /** 是否紧凑模式 */
    compact?: boolean;
    /** 空状态提示 */
    emptyText?: string;
    /** 点击坐席回调 */
    onAgentClick?: (agent: AgentWorkload) => void;
    /** 测试 id */
    'data-testid'?: string;
}
declare function AIAgentWorkloadDistributionPanel(props: AIAgentWorkloadDistributionPanelProps): React__default.JSX.Element;

/** 工具调用状态 */
type ToolCallStatus = 'pending' | 'running' | 'success' | 'error' | 'timeout';
/** 工具调用参数 */
interface ToolCallParameter {
    /** 参数名 */
    name: string;
    /** 参数值 */
    value: string;
}
/** 单次工具调用记录 */
interface ToolCallRecord {
    /** 工具调用 ID */
    id: string;
    /** 工具名称 */
    toolName: string;
    /** 工具显示标签 */
    toolLabel: string;
    /** 工具 emoji 图标 */
    toolIcon?: string;
    /** 调用状态 */
    status: ToolCallStatus;
    /** 调用参数 */
    parameters: ToolCallParameter[];
    /** 调用结果摘要 */
    resultSummary?: string;
    /** 错误信息 */
    errorMessage?: string;
    /** 开始时间 ISO */
    startedAt: string;
    /** 耗时(ms) */
    durationMs: number;
    /** 调用链层级（0 为根） */
    depth?: number;
    /** 子调用 */
    subCalls?: ToolCallRecord[];
}
/** AI Agent 工具调用面板 Props */
interface AIAgentToolCallPanelProps {
    /** 工具调用记录 */
    calls: ToolCallRecord[];
    /** 面板标题 */
    title?: string;
    /** 是否默认展开所有 */
    defaultExpanded?: boolean;
    /** 是否紧凑模式 */
    compact?: boolean;
    /** 空状态文案 */
    emptyText?: string;
    /** 加载中 */
    loading?: boolean;
    /** 测试 id */
    'data-testid'?: string;
}
/**
 * AIAgentToolCallPanel — AI 智能体工具调用面板。
 *
 * 展示 AI Agent 调用的工具链、参数、结果和耗时，
 * 适用于监控/调试场景，帮助开发者和运维人员追踪
 * AI Agent 的行为和执行路径。
 *
 * 特性：
 * - 工具调用链可视化（含层级缩进）
 * - 状态标签（等待中/执行中/成功/失败/超时）
 * - 耗时展示
 * - 参数/结果/错误详情展开
 * - 子调用展开折叠
 * - 加载态 / 空状态
 *
 * @example
 * // 基础用法
 * <AIAgentToolCallPanel
 *   title="工具调用链"
 *   calls={[
 *     {
 *       id: '1',
 *       toolName: 'search_products',
 *       toolLabel: '商品搜索',
 *       toolIcon: '🔍',
 *       status: 'success',
 *       parameters: [{ name: 'keyword', value: '夏季连衣裙' }],
 *       resultSummary: '找到 15 件商品',
 *       startedAt: '2026-07-07T04:00:00Z',
 *       durationMs: 320,
 *     },
 *   ]}
 * />
 */
declare function AIAgentToolCallPanel({ calls, title, defaultExpanded, compact, emptyText, loading, 'data-testid': testId, }: AIAgentToolCallPanelProps): React__default.JSX.Element;

/** 建议优先级 */
type SmartInsightPriority = 'critical' | 'high' | 'medium' | 'low';
/** 建议类别 */
type SmartInsightCategory = 'sales' | 'inventory' | 'member' | 'operation' | 'marketing';
/** 单条智能建议 */
interface SmartInsight {
    /** 建议 ID */
    id: string;
    /** 建议标题 */
    title: string;
    /** 建议详细描述 */
    description: string;
    /** 优先级 */
    priority: SmartInsightPriority;
    /** 类别 */
    category: SmartInsightCategory;
    /** 预期提升指标 */
    expectedImpact?: string;
    /** 置信度 (0-100) */
    confidence: number;
    /** 建议生成时间 */
    generatedAt?: string;
    /** 是否已读 */
    read?: boolean;
    /** 关联数据链接 */
    relatedLink?: string;
}
/** 智能建议面板 Props */
interface AISmartInsightPanelProps {
    /** 建议列表 */
    insights: SmartInsight[];
    /** 面板标题 */
    title?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 建议点击回调 */
    onInsightClick?: (insight: SmartInsight) => void;
    /** 建议忽略回调 */
    onInsightDismiss?: (insightId: string) => void;
    /** 全部标记已读回调 */
    onMarkAllRead?: () => void;
    /** 自定义类名 */
    className?: string;
    /** 是否显示类别筛选 */
    showCategoryFilter?: boolean;
    /** 是否紧凑模式 */
    compact?: boolean;
}
declare function AISmartInsightPanel({ insights, title, emptyText, onInsightClick, onInsightDismiss, onMarkAllRead, className, showCategoryFilter, compact, }: AISmartInsightPanelProps): React__default.JSX.Element;

interface ScenarioVariable {
    id: string;
    label: string;
    type: 'number' | 'select';
    defaultValue: number | string;
    min?: number;
    max?: number;
    step?: number;
    options?: {
        value: string;
        label: string;
    }[];
}
interface SimulationResult {
    variable: string;
    before: number;
    after: number;
    unit: string;
    direction: 'up' | 'down' | 'flat';
    changePercent: number;
}
interface AIScenarioSimulatorProps {
    /** 场景名称 */
    scenarioName: string;
    /** 可调变量列表 */
    variables: ScenarioVariable[];
    /** 模拟回调（返回预测结果） */
    onSimulate: (values: Record<string, number | string>) => Promise<SimulationResult[]>;
    /** 初始基线说明 */
    baselineDescription?: string;
    /** 加载中文本 */
    loadingText?: string;
    /** 错误时文本 */
    errorText?: string;
    style?: React__default.CSSProperties;
}
declare const AIScenarioSimulator: React__default.FC<AIScenarioSimulatorProps>;

/** 预测维度 */
type DemandForecastDimension = 'product' | 'category' | 'store' | 'region';
/** 单个预测条目 */
interface DemandForecastEntry {
    /** 标识 */
    id: string;
    /** 名称 */
    name: string;
    /** 当前预测值 */
    forecastValue: number;
    /** 置信度 (0-100) */
    confidence: number;
    /** 同比变化百分比 */
    changePercent: number;
    /** 历史平均值 */
    historicalAvg?: number;
    /** 季节影响: positive / negative / neutral */
    seasonEffect?: 'positive' | 'negative' | 'neutral';
    /** 异常提醒 */
    anomaly?: string;
}
/** 模型元信息 */
interface ForecastModelMeta {
    /** 模型名称 */
    modelName: string;
    /** 模型版本 */
    modelVersion: string;
    /** 总体准确率 (0-100) */
    accuracy: number;
    /** 训练数据时间范围 */
    trainingRange: string;
    /** 更新时间 */
    updatedAt: string;
}
/** AI 需求预测面板 Props */
interface AIDemandForecastPanelProps {
    /** 预测数据 */
    entries: DemandForecastEntry[];
    /** 汇总: 总预测值 */
    totalForecast?: number;
    /** 对比周期变化率 */
    totalChangePercent?: number;
    /** 模型元信息 */
    modelMeta?: ForecastModelMeta;
    /** 面板标题 */
    title?: string;
    /** 预测维度 */
    dimension?: DemandForecastDimension;
    /** 是否紧凑 */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 条目点击回调 */
    onEntryClick?: (entry: DemandForecastEntry) => void;
    /** 是否加载中 */
    loading?: boolean;
    /** 测试 id */
    'data-testid'?: string;
}
/**
 * AIDemandForecastPanel — AI 需求预测面板。
 *
 * 展示 AI 模型对产品/品类/门店/区域的需求预测结果，包括：
 * - 模型元信息展示 (模型名称、版本、准确率、训练范围)
 * - 总体预测汇总 (总预测值、变化率)
 * - 逐条预测条目 (名称、预测量、置信度、变化趋势、季节效应、异常提醒)
 *
 * @example
 * ```tsx
 * <AIDemandForecastPanel
 *   title="6月各品类需求预测"
 *   dimension="category"
 *   entries={[
 *     {
 *       id: 'cat-1',
 *       name: '饮品',
 *       forecastValue: 12500,
 *       confidence: 92,
 *       changePercent: 8.5,
 *       seasonEffect: 'positive',
 *     },
 *     {
 *       id: 'cat-2',
 *       name: '零食',
 *       forecastValue: 8200,
 *       confidence: 76,
 *       changePercent: -3.2,
 *       seasonEffect: 'neutral',
 *       anomaly: '近期库存周转异常',
 *     },
 *   ]}
 *   totalForecast={35000}
 *   totalChangePercent={5.2}
 *   modelMeta={{
 *     modelName: 'Prophet+XGBoost',
 *     modelVersion: '2.3.1',
 *     accuracy: 91,
 *     trainingRange: '2025-01 ~ 2026-05',
 *     updatedAt: '2026-06-27',
 *   }}
 * />
 * ```
 */
declare const AIDemandForecastPanel: React__default.FC<AIDemandForecastPanelProps>;

/** 实验状态 */
type ExperimentStatus = 'running' | 'completed' | 'draft' | 'paused' | 'failed';
/** A/B 实验方案 */
interface ExperimentVariant {
    /** 方案标识 */
    id: string;
    /** 方案名称 */
    name: string;
    /** 流量占比 (%) */
    trafficPercent: number;
    /** 转化率 */
    conversionRate: number;
    /** 样本量 */
    sampleSize: number;
    /** 是否优胜方案 */
    isWinner: boolean;
    /** 提升百分比 (相对对照组) */
    liftPercent: number;
}
/** 单个实验条目 */
interface ExperimentEntry {
    /** 实验ID */
    id: string;
    /** 实验名称 */
    name: string;
    /** 实验状态 */
    status: ExperimentStatus;
    /** 目标指标 */
    targetMetric: string;
    /** 开始时间 */
    startDate: string;
    /** 结束时间 (预期/实际) */
    endDate?: string;
    /** 实验方案列表 */
    variants: ExperimentVariant[];
    /** 置信度 (0-100) */
    confidenceLevel: number;
    /** AI推荐建议 */
    aiRecommendation?: string;
}
/** 优化建议条目 */
interface OptimizationSuggestion {
    /** 建议ID */
    id: string;
    /** 建议标题 */
    title: string;
    /** 预期提升百分比 */
    expectedLift: number;
    /** 建议类别 */
    category: 'pricing' | 'promotion' | 'content' | 'placement' | 'other';
    /** 关联实验ID */
    relatedExperimentId?: string;
    /** 建议详细描述 */
    description: string;
}
/** AI 实验优化面板 Props */
interface AIExperimentOptimizationPanelProps {
    /** 实验列表 */
    experiments: ExperimentEntry[];
    /** AI优化建议列表 */
    suggestions: OptimizationSuggestion[];
    /** 总体测试中实验数 */
    activeExperimentCount: number;
    /** 已识别优化机会数 */
    opportunityCount: number;
    /** 预计总提升 */
    estimatedTotalLift: number;
    /** 面板标题 */
    title?: string;
    /** 是否 loading */
    loading?: boolean;
    /** 空状态提示 */
    emptyMessage?: string;
}
declare function AIExperimentOptimizationPanel({ experiments, suggestions, activeExperimentCount, opportunityCount, estimatedTotalLift, title, loading, emptyMessage, }: AIExperimentOptimizationPanelProps): React__default.JSX.Element;

/** 严重程度 */
type FaultSeverity = 'critical' | 'high' | 'medium' | 'low';
/** 预测状态 */
type PredictionStatus = 'predicted' | 'monitoring' | 'resolved' | 'scheduled';
/** 设备类别 */
type DeviceCategory = 'arcade' | 'prize' | 'audio' | 'lighting' | 'ac' | 'network' | 'other';
/** 单个设备故障预测 */
interface DeviceFaultPrediction {
    /** 设备 ID */
    deviceId: string;
    /** 设备名称 */
    deviceName: string;
    /** 设备类别 */
    category: DeviceCategory;
    /** 故障预测描述 */
    predictedFault: string;
    /** 严重程度 */
    severity: FaultSeverity;
    /** 当前状态 */
    status: PredictionStatus;
    /** 预测概率 (0-100) */
    probability: number;
    /** 预计发生时间 (ISO 日期) */
    estimatedDate: string;
    /** 建议维护操作 */
    suggestedAction: string;
    /** 上次维护日期 */
    lastMaintenanceDate?: string;
    /** 运行时长 (小时) */
    runtimeHours?: number;
    /** 当前评分 (0-100) */
    healthScore?: number;
}
/** 汇总统计数据 */
interface FaultPredictionSummary {
    /** 总设备数 */
    totalDevices: number;
    /** 高危设备数 */
    criticalCount: number;
    /** 待维护数 */
    pendingCount: number;
    /** 本月预计故障数 */
    predictedThisMonth: number;
    /** 平均健康分 */
    avgHealthScore: number;
}
/** AI 设备故障预测面板 Props */
interface AIDeviceFaultPredictionPanelProps {
    /** 预测列表 */
    predictions: DeviceFaultPrediction[];
    /** 汇总数据 */
    summary?: FaultPredictionSummary;
    /** 面板标题 */
    title?: string;
    /** 是否紧凑 */
    compact?: boolean;
    /** 类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 条目点击回掉 */
    onPredictionClick?: (prediction: DeviceFaultPrediction) => void;
    /** 一键安排维护 */
    onScheduleMaintenance?: (deviceIds: string[]) => void;
    /** 标记已处理 */
    onResolve?: (deviceId: string) => void;
    /** 加载中 */
    loading?: boolean;
    /** 测试 id */
    'data-testid'?: string;
}
declare function AIDeviceFaultPredictionPanel({ predictions, summary, title, compact, className, emptyText, onPredictionClick, onScheduleMaintenance, onResolve, loading, 'data-testid': testId, }: AIDeviceFaultPredictionPanelProps): React__default.JSX.Element;

/** 竞争对手指标维度 */
type CompetitorMetric = 'price' | 'membership' | 'service' | 'promotion' | 'footfall';
/** 竞争对手数据条目 */
interface CompetitorEntry {
    /** 对手名称 */
    name: string;
    /** 指标值 (相对分 0-100) */
    score: number;
    /** 指标维度 */
    metric: CompetitorMetric;
    /** 同比变化 */
    changePercent: number;
    /** 最近活动摘要 */
    recentActivity?: string;
    /** 是否本店 */
    isSelf?: boolean;
}
/** 竞争分析维度设置 */
interface CompetitorDimension {
    /** 维度标识 */
    key: CompetitorMetric;
    /** 维度标签 */
    label: string;
    /** 本店得分 */
    selfScore: number;
    /** 行业均值 */
    industryAvg: number;
    /** 排名 (1-based) */
    rank: number;
    /** 总统计数 */
    totalCompetitors: number;
    /** 较上月排名变化 */
    rankDelta?: number;
}
/** AI 建议 */
interface AICompetitiveSuggestion {
    /** 建议 ID */
    id: string;
    /** 建议标题 */
    title: string;
    /** 建议描述 */
    description: string;
    /** 影响等级 */
    impact: 'high' | 'medium' | 'low';
    /** 建议行动 */
    action: string;
}
/** 竞争分析面板 Props */
interface AICompetitiveAnalysisPanelProps {
    /** 竞争对手排名数据 */
    dimensions: CompetitorDimension[];
    /** 最近对手动态 */
    entries: CompetitorEntry[];
    /** AI 建议列表 */
    suggestions?: AICompetitiveSuggestion[];
    /** 面板标题 */
    title?: string;
    /** 覆盖市场名称 */
    marketName?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 维度点击回调 */
    onDimensionClick?: (dimension: CompetitorDimension) => void;
    /** 建议点击回调 */
    onSuggestionClick?: (suggestion: AICompetitiveSuggestion) => void;
    /** 自定义类名 */
    className?: string;
}
declare function AICompetitiveAnalysisPanel({ dimensions, entries, suggestions, title, marketName, emptyText, onDimensionClick, onSuggestionClick, className, }: AICompetitiveAnalysisPanelProps): React__default.JSX.Element;

type ExecutionStatus = 'success' | 'failure' | 'partial' | 'skipped';
interface AIExecutionRecord {
    /** 执行记录 ID */
    id: string;
    /** 规则/策略名称 */
    ruleName: string;
    /** 执行状态 */
    status: ExecutionStatus;
    /** 触发来源 (手动/自动/定时) */
    triggerSource: 'manual' | 'auto' | 'scheduled';
    /** 执行耗时 (ms) */
    durationMs: number;
    /** 受影响记录数 */
    affectedCount: number;
    /** 成功条数 */
    successCount: number;
    /** 失败条数 */
    failureCount: number;
    /** 执行时间 */
    executedAt: string;
    /** 执行人 (手动时) */
    operator?: string;
    /** 备注/错误信息 */
    message?: string;
    /** 详情链接 */
    detailUrl?: string;
}
interface AIExecutionAuditPanelProps {
    /** 执行记录列表 */
    records: AIExecutionRecord[];
    /** 标题 */
    title?: string;
    /** 是否显示行详情展开 */
    expandable?: boolean;
    /** 空状态文案 */
    emptyText?: string;
    /** 最多显示条数 */
    maxItems?: number;
    /** 查看详情回调 */
    onViewDetail?: (record: AIExecutionRecord) => void;
    /** 重新执行回调 */
    onRetry?: (record: AIExecutionRecord) => void;
    className?: string;
    style?: React__default.CSSProperties;
}
declare function AIExecutionAuditPanel({ records, title, expandable, emptyText, maxItems, onViewDetail, onRetry, className, style, }: AIExecutionAuditPanelProps): React__default.JSX.Element;

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
interface QuickAction$2 {
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
    quickActions?: QuickAction$2[];
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

/** 培训运营指标 */
interface TrainingDailyMetrics {
    totalSessions: number;
    totalAttendees: number;
    avgCompletionRate: number;
    avgRating: number;
    sessionsTrend: number;
    attendeesTrend: number;
    completionTrend: number;
    ratingTrend: number;
}
/** 培训课程 */
interface TrainingSession {
    id: string;
    title: string;
    coach: string;
    type: 'skill' | 'safety' | 'sales' | 'service' | 'leadership';
    date: string;
    time: string;
    enrolled: number;
    capacity: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
/** 待认证学员 */
interface PendingCertification {
    id: string;
    memberName: string;
    skillName: string;
    progress: number;
    assignedCoach: string;
    deadline: string;
}
/** 设备培训需求 */
interface TrainingNeed {
    deviceModel: string;
    count: number;
    priority: 'high' | 'medium' | 'low';
}
/** 培训经理工作台 Props */
interface TrainingManagerDashboardProps {
    /** 培训运营指标 */
    dailyMetrics?: TrainingDailyMetrics;
    /** 今日培训课程 */
    todaySessions?: TrainingSession[];
    /** 待认证学员 */
    pendingCertifications?: PendingCertification[];
    /** 培训需求 */
    trainingNeeds?: TrainingNeed[];
    /** 门店/品牌名称 */
    brandName?: string;
    /** 最后同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
}
declare function TrainingManagerDashboard({ dailyMetrics, todaySessions, pendingCertifications, trainingNeeds, brandName, lastSyncAt, loading, compact, className, }: TrainingManagerDashboardProps): React__default.JSX.Element;

/** 区域门店概况 */
interface RegionStoreSnapshot {
    id: string;
    name: string;
    /** 所在城市 */
    city: string;
    /** 经营状态 */
    status: 'operating' | 'closed_today' | 'paused' | 'offline';
    /** 今日营收 */
    todayRevenue: number;
    /** 营收达标率 (0-100) */
    revenueRate: number;
    /** 会员增长 */
    memberGrowth: number;
    /** 本月KPI完成率 */
    monthlyKpiRate: number;
    /** 活跃告警 */
    alertCount: number;
    /** 在岗人数 */
    staffOnDuty: number;
}
/** 区域汇总指标 */
interface RegionalSummary {
    /** 管辖区域数 */
    totalRegions: number;
    /** 管辖门店总数 */
    totalStores: number;
    /** 营业中门店 */
    operatingStores: number;
    /** 今日总营收 */
    totalRevenue: number;
    /** 营收周环比 */
    revenueWoW: number;
    /** 总会员增长 */
    totalMemberGrowth: number;
    /** 会员增长周环比 */
    memberWoW: number;
    /** 平均KPI达成率 */
    avgKpiRate: number;
    /** 待处理告警 */
    pendingAlerts: number;
    /** 告警趋势 (- 表示好转) */
    alertTrend: number;
}
/** 区域经理快速动作 */
interface RegionalQuickAction {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick?: () => void;
}
/** 月度目标进度 */
interface MonthlyTarget {
    label: string;
    current: number;
    target: number;
    unit?: string;
}
/** 区域经理工作台 Props */
interface RegionalManagerDashboardProps {
    /** 区域汇总指标 */
    regionalSummary?: RegionalSummary;
    /** 门店概览列表 */
    stores?: RegionStoreSnapshot[];
    /** 月度目标进度 */
    monthlyTargets?: MonthlyTarget[];
    /** 快速操作 */
    quickActions?: RegionalQuickAction[];
    /** 经理名称 */
    managerName?: string;
    /** 管辖大区名称 */
    regionName?: string;
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
 * RegionalManagerDashboard — 区域经理工作台
 *
 * 面向大区/区域经理角色，聚合跨区域汇总指标、各门店业绩对比、月度目标进度追踪。
 * 适用于连锁管理、区域督导、多店运营场景。
 *
 * @example
 * <RegionalManagerDashboard
 *   managerName="王强"
 *   regionName="华北区"
 *   regionalSummary={...}
 *   stores={[...]}
 *   monthlyTargets={[...]}
 * />
 */
declare function RegionalManagerDashboard({ regionalSummary, stores, monthlyTargets, quickActions, managerName, regionName, lastSyncAt, loading, compact, className, }: RegionalManagerDashboardProps): React__default.JSX.Element;

/** 巡检检查项状态 */
type InspectionItemStatus = 'pass' | 'fail' | 'pending';
/** 巡检检查项 */
interface InspectionItem$1 {
    id: string;
    label: string;
    /** 检查类别: 环境/设备/人员/安全/卫生 */
    category: 'environment' | 'device' | 'staff' | 'safety' | 'hygiene';
    /** 初始状态 (默认 pending) */
    defaultStatus?: InspectionItemStatus;
    /** 备注 */
    note?: string;
    /** 是否必检 */
    required?: boolean;
}
/** 巡检检查面板 Props */
interface InspectionChecklistProps {
    /** 检查项列表 */
    items: InspectionItem$1[];
    /** 检查人 */
    inspector?: string;
    /** 门店名称 */
    storeName?: string;
    /** 检查日期 */
    date?: string;
    /** 是否加载中 */
    loading?: boolean;
    /** 状态变更回调 */
    onStatusChange?: (itemId: string, status: InspectionItemStatus) => void;
    /** 备注变更回调 */
    onNoteChange?: (itemId: string, note: string) => void;
    /** 提交回调 */
    onSubmit?: (results: InspectionResult[]) => void;
    /** 提交中 */
    submitting?: boolean;
    /** 自定义类名 */
    className?: string;
}
/** 提交结果 */
interface InspectionResult {
    itemId: string;
    status: InspectionItemStatus;
    note?: string;
}
/**
 * InspectionChecklist — 巡检检查面板
 *
 * 店长巡店时逐项检查门店环境、设备、人员、安全、卫生等状况，
 * 支持状态切换与备注提交。
 *
 * @example
 * <InspectionChecklist
 *   storeName="朝阳旗舰店"
 *   inspector="张三"
 *   items={[
 *     { id: '1', label: '收银台整洁', category: 'environment', required: true },
 *     { id: '2', label: 'POS机运行正常', category: 'device', defaultStatus: 'pass' },
 *   ]}
 * />
 */
declare function InspectionChecklist({ items, inspector, storeName, date, loading, onStatusChange, onNoteChange, onSubmit, submitting, className, }: InspectionChecklistProps): React__default.JSX.Element;

interface ShiftAssignment {
    staffId: string;
    staffName: string;
    role: string;
    shiftLabel: string;
    /** HH:mm format */
    startTime: string;
    endTime: string;
    avatar?: string;
}
interface ShiftSlot {
    date: string;
    dayLabel: string;
    assignments: ShiftAssignment[];
}
interface StaffShiftSchedulePanelProps {
    /** Shifts for the visible period */
    shifts: ShiftSlot[];
    /** Staff available for assignment */
    availableStaff: {
        id: string;
        name: string;
        role: string;
    }[];
    /** On add shift assignment */
    onAddShift?: (date: string, staffId: string, shiftLabel: string) => Promise<void>;
    /** On remove shift assignment */
    onRemoveShift?: (date: string, staffId: string) => Promise<void>;
    /** Loading state */
    loading?: boolean;
    /** Error message */
    error?: string;
    /** Test id */
    'data-testid'?: string;
    className?: string;
}
declare function StaffShiftSchedulePanel({ shifts, availableStaff, onAddShift, onRemoveShift, loading, error, 'data-testid': testId, className, }: StaffShiftSchedulePanelProps): React__default.JSX.Element;

/** 营销活动摘要 */
interface CampaignSnapshot$1 {
    /** 活动 ID */
    id: string;
    /** 活动名称 */
    name: string;
    /** 活动渠道 */
    channel: 'sms' | 'email' | 'wechat' | 'app_push' | 'in_store';
    /** 活动状态 */
    status: 'draft' | 'scheduled' | 'running' | 'paused' | 'ended' | 'archived';
    /** 目标受众 */
    targetSegment: string;
    /** 发送量/触达量 */
    reachCount: number;
    /** 转化率 (0-100) */
    conversionRate: number;
    /** 花费 (元) */
    cost: number;
    /** ROI */
    roi: number;
    /** 开始时间 */
    startAt: string;
    /** 结束时间(可选) */
    endAt?: string;
}
/** 会员增长指标 */
interface MemberGrowthMetrics {
    /** 总会员数 */
    totalMembers: number;
    /** 今日新增 */
    newToday: number;
    /** 本周新增 */
    newThisWeek: number;
    /** 本月新增 */
    newThisMonth: number;
    /** 月同比增长率 (%) */
    monthYoY: number;
    /** 活跃会员数 (30天有互动) */
    activeMembers: number;
    /** 活跃率 */
    activeRate: number;
    /** 流失会员数 (近90天无互动) */
    churnedMembers: number;
    /** 流失率 */
    churnRate: number;
}
/** 营销指标 */
interface MarketingKpi {
    /** 营销总花费 */
    totalSpend: number;
    /** 平均获客成本 */
    cac: number;
    /** 客户生命周期价值 */
    ltv: number;
    /** LTV/CAC 比值 */
    ltvCacRatio: number;
    /** 平均复购率 */
    repurchaseRate: number;
    /** 本月目标完成率 */
    monthlyTargetRate: number;
}
/** 快速操作项 */
interface MarketerQuickAction {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick?: () => void;
}
/** 渠道分布统计 */
interface ChannelDistribution {
    /** 渠道代码 */
    channel: CampaignSnapshot$1['channel'];
    /** 活动数量 */
    count: number;
    /** 总花费 (元) */
    totalCost: number;
}
/** 月度趋势点 */
interface MonthlyTrendPoint {
    /** 月份, 如 '2026-01' */
    month: string;
    /** 新增会员数 */
    newMembers: number;
    /** 活动花费 (元) */
    campaignCost: number;
    /** 活动触达数 */
    reachCount: number;
}
/** 营销经理工作台 Props */
interface MemberMarketerDashboardProps {
    /** 会员增长指标 */
    growthMetrics?: MemberGrowthMetrics;
    /** 营销指标概览 */
    marketingKpi?: MarketingKpi;
    /** 近期活动列表 */
    recentCampaigns?: CampaignSnapshot$1[];
    /** 快速操作 */
    quickActions?: MarketerQuickAction[];
    /** 经理姓名 */
    managerName?: string;
    /** 渠道分布 (不传则从 recentCampaigns 自动统计) */
    channelDistribution?: ChannelDistribution[];
    /** 月度趋势数据 */
    monthlyTrend?: MonthlyTrendPoint[];
}
declare function MemberMarketerDashboard({ growthMetrics, marketingKpi, recentCampaigns, quickActions, managerName, channelDistribution, monthlyTrend, }: MemberMarketerDashboardProps): React__default.JSX.Element;

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

/** 前台班次信息 */
interface StaffShiftInfo {
    date: string;
    shiftName: string;
    staffCount: number;
    onDuty: number;
    onBreak: number;
    shiftLeadName: string;
}
/** 排队队列概览 */
interface QueueOverview {
    queueType: 'service' | 'pickup' | 'return' | 'consult';
    queueTypeLabel: string;
    waitingCount: number;
    avgWaitMinutes: number;
    maxWaitMinutes: number;
    trend: number;
}
/** 前台服务指标 */
interface FrontDeskMetrics {
    totalVisitors: number;
    servedCount: number;
    avgServiceMinutes: number;
    satisfactionScore: number;
    peakHourRevenue: number;
}
/** 实时接待记录 */
interface ServiceRecord {
    id: string;
    visitorName: string;
    serviceType: string;
    staffName: string;
    startTime: string;
    durationMinutes: number;
    status: 'in_progress' | 'completed' | 'awaiting' | 'transferred';
    notes?: string;
}
/** 前台主管工作台 props */
interface FrontDeskSupervisorDashboardProps {
    shiftInfo: StaffShiftInfo;
    queueOverview: QueueOverview[];
    metrics: FrontDeskMetrics;
    serviceRecords: ServiceRecord[];
    onViewQueue?: () => void;
    onAssignShift?: () => void;
    onCallNext?: () => void;
    onOpenQuickCheck?: () => void;
    onViewServiceRecord?: (id: string) => void;
}
declare function FrontDeskSupervisorDashboard({ shiftInfo, queueOverview, metrics, serviceRecords, onViewQueue, onAssignShift, onCallNext, onOpenQuickCheck, onViewServiceRecord, }: FrontDeskSupervisorDashboardProps): React__default.JSX.Element;

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

/** 预约状态 */
type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
/** 服务项目 */
interface ServiceItem$1 {
    /** 服务ID */
    id: string;
    /** 服务名称 */
    name: string;
    /** 服务时长(分钟) */
    duration: number;
    /** 服务价格 */
    price: number;
    /** 是否可用 */
    available: boolean;
    /** 服务分类 */
    category?: string;
    /** 服务描述 */
    description?: string;
}
/** 可预约时段 */
interface TimeSlot {
    /** 开始时间 ISO */
    startTime: string;
    /** 结束时间 ISO */
    endTime: string;
    /** 是否可预约 */
    available: boolean;
    /** 时段标签 */
    label?: string;
}
/** 预约记录 */
interface Appointment {
    /** 预约ID */
    id: string;
    /** 会员ID */
    memberId: string;
    /** 会员姓名 */
    memberName: string;
    /** 会员联系方式 */
    memberPhone?: string;
    /** 预约服务 */
    service: ServiceItem$1;
    /** 预约日期 YYYY-MM-DD */
    date: string;
    /** 开始时间 HH:mm */
    startTime: string;
    /** 结束时间 HH:mm */
    endTime: string;
    /** 预约状态 */
    status: AppointmentStatus;
    /** 备注 */
    notes?: string;
    /** 创建时间 */
    createdAt: string;
    /** 最后更新时间 */
    updatedAt?: string;
}
/** 预约面板Props */
interface AppointmentBookingPanelProps {
    /** 服务列表 */
    services: ServiceItem$1[];
    /** 当前日期 YYYY-MM-DD */
    currentDate: string;
    /** 可用时段 */
    availableSlots?: TimeSlot[];
    /** 今日预约列表 */
    todayAppointments?: Appointment[];
    /** 预约回调 */
    onBook?: (params: BookingParams) => Promise<boolean>;
    /** 取消预约回调 */
    onCancel?: (appointmentId: string) => Promise<boolean>;
    /** 确认到场回调 */
    onConfirmArrival?: (appointmentId: string) => void;
    /** 加载状态 */
    loading?: boolean;
    /** 错误信息 */
    error?: string;
    /** 标题 */
    title?: string;
    /** 自定义空状态 */
    emptyState?: ReactNode;
    /** 自定义类名 */
    className?: string;
}
/** 预约参数 */
interface BookingParams {
    /** 会员ID */
    memberId: string;
    /** 会员姓名 */
    memberName: string;
    /** 会员电话 */
    memberPhone?: string;
    /** 服务ID */
    serviceId: string;
    /** 预约日期 YYYY-MM-DD */
    date: string;
    /** 开始时间 HH:mm */
    startTime: string;
    /** 结束时间 HH:mm */
    endTime: string;
    /** 备注 */
    notes?: string;
}
declare function AppointmentBookingPanel({ services, currentDate, availableSlots, todayAppointments, onBook, onCancel, onConfirmArrival, loading, error, title, emptyState, className, }: AppointmentBookingPanelProps): React__default.JSX.Element;

/** 漏斗层级 */
interface FunnelStage {
    /** 层级名称 */
    label: string;
    /** 该层级数量 */
    value: number;
    /** 可选的层级颜色 */
    color?: string;
    /** 可选的描述文本 */
    description?: string;
}
/** SalesConversionFunnel Props */
interface SalesConversionFunnelProps {
    /** 漏斗各层级数据（从顶部开始：接待→意向→试穿→成交） */
    stages: FunnelStage[];
    /** 标题 */
    title?: string;
    /** 高度 px（默认 280） */
    height?: number;
    /** 是否显示转化率（默认 true） */
    showConversionRate?: boolean;
    /** 是否显示数值（默认 true） */
    showValues?: boolean;
    /** 是否显示占比百分比（默认 true） */
    showPercent?: boolean;
    /** 加载态 */
    loading?: boolean;
    /** 空态文案 */
    emptyText?: string;
    /** 主题色（默认 #6366f1） */
    themeColor?: string;
    /** 自定义类名 */
    className?: string;
    'data-testid'?: string;
}
/**
 * SalesConversionFunnel — 销售转化漏斗图
 *
 * 用于展示从接待→意向→试穿→成交的转化路径，
 * 适用角色：店长工作台、导购员工具、运营面板。
 */
declare function SalesConversionFunnel({ stages, title, height, showConversionRate, showValues, showPercent, loading, emptyText, themeColor, className, 'data-testid': dataTestId, }: SalesConversionFunnelProps): React__default.JSX.Element;

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
interface InspectionTask$1 {
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
    inspectionTasks?: InspectionTask$1[];
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

/** 财务报表摘要 */
interface FinanceSummary {
    /** 今日营收 */
    dailyRevenue: number;
    /** 营收环比 */
    revenueQoQ: number;
    /** 月度支出 */
    monthlyExpense: number;
    /** 支出环比 */
    expenseQoQ: number;
    /** 净利润率 */
    profitMargin: number;
    /** 利润率环比 */
    profitMarginQoQ: number;
    /** 应收账款 */
    accountsReceivable: number;
    /** 应收环比 */
    receivableQoQ: number;
    /** 待处理发票数 */
    pendingInvoices: number;
}
/** 财务流水条目 */
interface FinanceTransaction {
    id: string;
    /** 门店/部门 */
    department: string;
    /** 交易类型 */
    type: 'revenue' | 'expense' | 'transfer' | 'refund';
    /** 金额 */
    amount: number;
    /** 分类 */
    category: string;
    /** 描述 */
    description: string;
    /** 交易时间 */
    time: string;
    /** 状态 */
    status: 'pending' | 'cleared' | 'flagged' | 'reconciled';
    /** 经办人 */
    handler?: string;
}
/** 预算概览项 */
interface BudgetOverviewItem {
    /** 预算类别 */
    category: string;
    /** 预算总额 */
    budget: number;
    /** 已使用 */
    used: number;
    /** 剩余 */
    remaining: number;
    /** 使用率 (0-100) */
    usageRate: number;
    /** 预警阈值 */
    warningThreshold: number;
}
/** 预算概览 */
interface BudgetOverview {
    items: BudgetOverviewItem[];
    totalBudget: number;
    totalUsed: number;
}
interface FinanceManagerDashboardProps {
    /** 财务摘要 */
    summary: FinanceSummary;
    /** 近期流水 */
    recentTransactions: FinanceTransaction[];
    /** 预算概览 */
    budgetOverview: BudgetOverview;
    /** 加载状态 */
    isLoading?: boolean;
}
declare function FinanceManagerDashboard({ summary, recentTransactions, budgetOverview, isLoading, }: FinanceManagerDashboardProps): React__default.JSX.Element;

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
    /** Optional inline styles */
    style?: React__default.CSSProperties;
}
declare function Tag({ children, variant, size, closable, onClose, bordered, className, style, }: TagProps): React__default.JSX.Element;
/** Horizontal wrapper with gaps for a group of tags */
declare function TagGroup({ children, gap, }: {
    children: React__default.ReactNode;
    gap?: number;
}): React__default.JSX.Element;

interface TagInputProps {
    /** Current list of tags */
    value: string[];
    /** Called when tags change (add/remove) */
    onChange: (tags: string[]) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Maximum number of tags allowed (0 = unlimited) */
    maxTags?: number;
    /** Maximum characters per tag */
    maxTagLength?: number;
    /** Disabled state */
    disabled?: boolean;
    /** Label text above the input */
    label?: string;
    /** Error message */
    error?: string;
    /** Helper text below the input */
    helperText?: string;
    /** Unique tags only (default true) */
    unique?: boolean;
    /** Tag variant */
    tagVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple';
    /** Input width */
    width?: number | string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * TagInput — multi-tag input component.
 *
 * Press Enter or type comma to add a tag. Press Backspace on empty input
 * to remove the last tag. Tags are displayed as closable chips.
 */
declare function TagInput({ value, onChange, placeholder, maxTags, maxTagLength, disabled, label, error, helperText, unique, tagVariant, width, 'data-testid': dataTestId, }: TagInputProps): React__default.JSX.Element;

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

interface MonthPickerProps {
    /** Current value (ISO 8601 month string YYYY-MM) */
    value?: string;
    /** Value change callback */
    onChange?: (value: string) => void;
    /** Minimum month (YYYY-MM) */
    min?: string;
    /** Maximum month (YYYY-MM) */
    max?: string;
    /** Whether disabled */
    disabled?: boolean;
    /** Required */
    required?: boolean;
    /** Label */
    label?: string;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
    /** Placeholder */
    placeholder?: string;
    /** Custom style */
    style?: React__default.CSSProperties;
    /** Custom class name */
    className?: string;
    /** Month name labels (default: 1月…12月) */
    monthLabels?: string[];
    /** Start year for year dropdown (default: current year - 10) */
    startYear?: number;
    /** End year for year dropdown (default: current year + 10) */
    endYear?: number;
}
declare function MonthPicker({ value, onChange, min, max, disabled, required, label, error, helpText, placeholder, style, className, monthLabels, startYear, endYear, }: MonthPickerProps): React__default.JSX.Element;

interface WeekPickerProps {
    /** Current value (ISO 8601 week string YYYY-Www, e.g. "2026-W28") */
    value?: string;
    /** Value change callback */
    onChange?: (value: string) => void;
    /** Minimum week (YYYY-Www) */
    min?: string;
    /** Maximum week (YYYY-Www) */
    max?: string;
    /** Whether disabled */
    disabled?: boolean;
    /** Required */
    required?: boolean;
    /** Label */
    label?: string;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
    /** Placeholder */
    placeholder?: string;
    /** Custom style */
    style?: React__default.CSSProperties;
    /** Custom class name */
    className?: string;
    /** Start year for year dropdown (default: current year - 2) */
    startYear?: number;
    /** End year for year dropdown (default: current year + 2) */
    endYear?: number;
    /** Week label prefix, default "第" */
    weekPrefix?: string;
    /** Week label suffix, default "周" */
    weekSuffix?: string;
}
declare function WeekPicker({ value, onChange, min, max, disabled, required, label, error, helpText, placeholder, style, className, startYear, endYear, weekPrefix, weekSuffix, }: WeekPickerProps): React__default.JSX.Element;

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
    /** Additional CSS class name */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * Card — a reusable glassmorphism card container used across all M5 apps.
 *
 * Encapsulates the common `rgba(15,23,42,…)` + border pattern repeated in 20+ files.
 * Supports optional title header, variant selection, and footer slot.
 */
declare function Card({ title, subtitle, headerActions, children, variant, padding, style, footer, className, 'data-testid': dataTestId, }: CardProps): React__default.JSX.Element;

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: {
        value: string;
        positive: boolean;
    };
    icon?: React__default.ReactNode;
    variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
    /** @deprecated Use `variant` instead. Mapped as: neutral→default, danger→error, warning→warning, success→success */
    tone?: 'neutral' | 'danger' | 'warning' | 'success' | string;
    /** Optional accent color override */
    accent?: string;
    helper?: React__default.ReactNode;
}
declare function StatCard({ label, value, trend, icon, variant, tone, accent: accentProp, helper }: StatCardProps): React__default.JSX.Element;

interface KpiCardItem {
    /** 指标标签 */
    label: string;
    /** 指标值 */
    value: string | number;
    /** 趋势 (可选, StatCard 的 trend 格式) */
    trend?: {
        value: string;
        positive: boolean;
    };
    /** 辅助描述 (可选) */
    helper?: string;
    /** 卡片变体 (可选) */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}
interface KpiSummaryCardProps {
    /** 卡片标题 */
    title: string;
    /** KPI 指标数组 */
    items: KpiCardItem[];
    /** 列数 (1-4, 默认 3) */
    columns?: 1 | 2 | 3 | 4;
    /** 是否紧凑模式 */
    compact?: boolean;
    /** 自定义容器样式 */
    style?: React__default.CSSProperties;
    /** 自定义容器类名 */
    className?: string;
}
/**
 * KpiSummaryCard — 关键指标摘要卡片
 */
declare function KpiSummaryCard({ title, items, columns, compact, style, className, }: KpiSummaryCardProps): React__default.JSX.Element;

type StatisticVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type StatisticSize = 'sm' | 'md' | 'lg';
type StatisticLayout = 'horizontal' | 'vertical';
interface StatisticProps {
    /** 统计数值 */
    value: string | number;
    /** 数值前缀（货币符号等） */
    prefix?: React__default.ReactNode;
    /** 数值后缀（单位等） */
    suffix?: React__default.ReactNode;
    /** 标签文本 */
    label?: string;
    /** 数值精度（小数位数），不传则用原始值 */
    precision?: number;
    /** 是否显示千分位分隔符 */
    groupSeparator?: boolean;
    /** 数值颜色变体 */
    variant?: StatisticVariant;
    /** 尺寸 */
    size?: StatisticSize;
    /** 排列方向 */
    layout?: StatisticLayout;
    /** 额外 css class */
    className?: string;
    /** 内联样式 */
    style?: React__default.CSSProperties;
    /** 测试 id */
    'data-testid'?: string;
    /** 加载中状态 */
    loading?: boolean;
    /** loading 占位符宽度 */
    loadingWidth?: number;
}
/**
 * Statistic — 用于展示统计数据（标签 + 数值）。
 *
 * 可作为统计卡片的内容，或独立使用。支持前缀/后缀、精度、千分位、颜色变体、尺寸和加载占位。
 *
 * 不同于 StatCard（带边框/背景的卡片），Statistic 是纯文字排版原子组件。
 */
declare function Statistic({ value, prefix, suffix, label, precision, groupSeparator, variant, size, layout, className, style, 'data-testid': dataTestId, loading, loadingWidth, }: StatisticProps): React__default.JSX.Element;

interface QuickStatItem {
    /** 展示标签 */
    label: string;
    /** 主数值/文字 */
    value: string | number;
    /** 辅助说明文字 */
    helper?: string;
    /** 主值颜色覆盖 */
    valueColor?: string;
    /** 趋势值 (正数上升, 负数下降, 0保持不变) */
    trend?: number;
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
    /** @deprecated Use `rows` instead */
    data?: T[];
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
declare function DataTable<T>({ columns, rows, data, items, rowKey, loading, emptyText, onRowClick, title, striped, compact, }: DataTableProps<T>): React__default.JSX.Element;

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

interface ProgressRingProps {
    /** 进度百分比 (0-100) */
    percent: number;
    /** 环大小 (px) */
    size?: number;
    /** 环宽度 (px) */
    strokeWidth?: number;
    /** 进度环颜色 */
    color?: string;
    /** 轨道环颜色 */
    trackColor?: string;
    /** 标题 */
    title?: string;
    /** 是否显示百分比文字 */
    showPercentLabel?: boolean;
    /** 自定义格式函数 */
    formatLabel?: (percent: number) => string;
    /** 自定义类名 */
    className?: string;
    /** 加载态 */
    loading?: boolean;
    /** 动画过渡时间 (ms) */
    transitionDuration?: number;
}
declare const ProgressRing: React__default.FC<ProgressRingProps>;

interface TreeSelectNode {
    value: string;
    label: string;
    children?: TreeSelectNode[];
    disabled?: boolean;
}
interface TreeSelectProps {
    /** 当前选中值（受控） */
    value?: string;
    /** 值变化回调 */
    onChange?: (value: string) => void;
    /** 树节点数据 */
    treeData: TreeSelectNode[];
    /** 占位文本 */
    placeholder?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否允许清除 */
    allowClear?: boolean;
    /** 空数据提示 */
    notFoundContent?: React__default.ReactNode;
    /** 最小宽度 */
    minWidth?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 下拉菜单类名 */
    dropdownClassName?: string;
    /** 表单 name */
    name?: string;
    /** aria-label */
    'aria-label'?: string;
}
declare function TreeSelect({ value, onChange, treeData, placeholder, disabled, allowClear, notFoundContent, minWidth, className, style, dropdownClassName, name, 'aria-label': ariaLabel, }: TreeSelectProps): React__default.JSX.Element;

interface ProgressCardProps {
    /** Card title */
    title: string;
    /** Main metric value */
    value: string | number;
    /** Progress value (0-100 or against max) */
    progress: number;
    /** Maximum progress value, default 100 */
    maxProgress?: number;
    /** Short label for the metric (e.g. "¥", "件", "人") */
    unit?: string;
    /** Visual variant for progress bar */
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    /** Optional icon rendered before the title */
    icon?: React__default.ReactNode;
    /** Extra description line below progress */
    description?: string;
    /** Optional trend arrow */
    trend?: {
        direction: 'up' | 'down' | 'stable';
        label?: string;
        invert?: boolean;
    };
    /** Click handler for the whole card */
    onClick?: () => void;
    /** Optional footer content */
    footer?: React__default.ReactNode;
    className?: string;
    style?: React__default.CSSProperties;
    'data-testid'?: string;
}
/**
 * ProgressCard — displays a key metric with an embedded progress bar.
 *
 * Use for completion rates, budget attainment, SLA targets, quota tracking, etc.
 */
declare function ProgressCard({ title, value, progress, maxProgress, unit, variant, icon, description, trend, onClick, footer, className, style, 'data-testid': dataTestId, }: ProgressCardProps): React__default.JSX.Element;

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
    /** @deprecated Breadcrumb is not rendered. Use `subtitle` or `description` instead. */
    breadcrumb?: React__default.ReactNode;
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

type LabelSize = 'sm' | 'md' | 'lg';
type LabelWeight = 'normal' | 'medium' | 'semibold' | 'bold';
type LabelColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'muted';
interface LabelProps {
    /** 标签文本 */
    children: React__default.ReactNode;
    /** 关联表单控件的 htmlFor */
    htmlFor?: string;
    /** 尺寸 */
    size?: LabelSize;
    /** 字重 */
    weight?: LabelWeight;
    /** 颜色主题 */
    color?: LabelColor;
    /** 是否必填（显示红色星号） */
    required?: boolean;
    /** 辅助说明文本 */
    hint?: string;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
}
/**
 * Label — 标签组件。
 *
 * 与表单控件配合使用，支持必填标记、辅助文本、多种颜色主题。
 *
 * @example
 * // 必填标签
 * <Label htmlFor="name" required>姓名</Label>
 * <Input id="name" />
 *
 * @example
 * // 带辅助提示
 * <Label htmlFor="email" hint="将用于登录验证" color="primary">邮箱</Label>
 */
declare function Label({ children, htmlFor, size, weight, color, required, hint, className, style, }: LabelProps): React__default.JSX.Element;

interface LoadingSkeletonProps {
    lines?: number;
    rows?: number;
    label?: string;
    variant?: 'default' | 'card' | 'table';
}
declare function LoadingSkeleton({ lines, rows, label, variant, }: LoadingSkeletonProps): React__default.JSX.Element;

type SkeletonShape = 'rect' | 'circle' | 'text';
interface SkeletonProps extends React__default.HTMLAttributes<HTMLDivElement> {
    /** 骨架屏形状：rect 矩形 / circle 圆形 / text 文本行 */
    shape?: SkeletonShape;
    /** 宽度（默认 100%） */
    width?: number | string;
    /** 高度（shape=circle 时自动等于 width） */
    height?: number;
    /** 圆角大小，覆盖 shape 默认值 */
    borderRadius?: number | string;
    /** 是否启用动画，默认 true */
    animated?: boolean;
    /** 行数（shape=text 时生效，渲染多条文本行） */
    lines?: number;
    /** 每行随机宽度范围 [min%, max%]，仅 lines 有效 */
    lineWidthRange?: [number, number];
    /** 行间距，默认 12 */
    lineGap?: number;
}
declare function Skeleton({ shape, width, height, borderRadius, animated, lines, lineWidthRange, lineGap, style, className, ...rest }: SkeletonProps): React__default.JSX.Element;

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
        includeColumns: ("status" | "title" | "severity" | "createdAt")[];
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
        includeColumns: ("status" | "type" | "id" | "createdAt")[];
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
        includeColumns: ("status" | "type" | "id" | "createdAt" | "targetId")[];
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
    children?: React__default.ReactNode;
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

interface CodeBlockProps {
    /** 代码内容 */
    code: string;
    /** 语言标签（用于显示，如 json / tsx / bash / yaml / log） */
    language?: string;
    /** 是否显示行号，默认 true */
    showLineNumbers?: boolean;
    /** 最大显示行数（超出折叠），默认 0 表示不限制 */
    maxLines?: number;
    /** 是否可复制，默认 true */
    copyable?: boolean;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 容器类名 */
    className?: string;
    /** 是否默认折叠（当 maxLines 生效时），默认 false */
    defaultCollapsed?: boolean;
    /** 测试 id */
    'data-testid'?: string;
}
declare function CodeBlock({ code, language, showLineNumbers, maxLines, copyable, style, className, defaultCollapsed, 'data-testid': dataTestId, }: CodeBlockProps): React__default.JSX.Element;

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

interface FeedbackWidgetProps {
    /** Initial rating value (0 to max). */
    initialRating?: number;
    /** Maximum rating value. */
    maxRating?: number;
    /** Rating labels per star index (1-based). */
    ratingLabels?: string[];
    /** Placeholder for the comment textarea. */
    commentPlaceholder?: string;
    /** Maximum comment length. */
    maxCommentLength?: number;
    /** Label for the submit button. */
    submitLabel?: string;
    /** Label for the cancel/reset button. */
    cancelLabel?: string;
    /** Show cancel button. */
    showCancel?: boolean;
    /** Called when feedback is submitted. */
    onSubmit?: (rating: number, comment: string) => void | Promise<void>;
    /** Called when cancelled. */
    onCancel?: () => void;
    /** Whether feedback is being submitted (shows loading). */
    submitting?: boolean;
    /** Title text displayed above the rating. */
    title?: string;
    /** Description / prompt text. */
    description?: string;
    /** Show success state after submission. */
    submitted?: boolean;
    /** Success message shown after submission. */
    successMessage?: string;
    /** CSS class name. */
    className?: string;
}
declare function FeedbackWidget({ initialRating, maxRating, ratingLabels, commentPlaceholder, maxCommentLength, submitLabel, cancelLabel, showCancel, onSubmit, onCancel, submitting, title, description, submitted, successMessage, className, }: FeedbackWidgetProps): React__default.JSX.Element;

/** 上传文件信息 */
interface UploadFile {
    /** 唯一标识 */
    uid: string;
    /** 文件名 */
    name: string;
    /** 文件大小（字节） */
    size: number;
    /** 文件类型（MIME） */
    type: string;
    /** 上传进度 0-100，undefined 表示未开始 */
    percent?: number;
    /** 文件状态 */
    status: 'pending' | 'uploading' | 'done' | 'error';
    /** 文件对象 */
    originFileObj?: File;
    /** 预览 URL（本地图片等） */
    url?: string;
    /** 错误信息 */
    error?: string;
}
/** FileUpload 组件属性 */
interface FileUploadProps {
    /** 是否允许多文件 */
    multiple?: boolean;
    /** 接受的文件类型（如 "image/*,.pdf"） */
    accept?: string;
    /** 最大文件大小（字节） */
    maxSize?: number;
    /** 最大文件数量 */
    maxCount?: number;
    /** 文件列表 */
    fileList?: UploadFile[];
    /** 文件列表变化回调 */
    onChange?: (files: UploadFile[]) => void;
    /** 上传触发前的校验，返回 false/reject 阻止上传 */
    beforeUpload?: (file: File) => boolean | Promise<boolean>;
    /** 自定义上传处理（返回 Promise），默认仅管理文件列表 */
    customRequest?: (file: File, onProgress: (percent: number) => void) => Promise<void>;
    /** 是否禁用 */
    disabled?: boolean;
    /** 拖拽上传 */
    drag?: boolean;
    /** 占位文本 */
    placeholder?: string;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** aria-label */
    'aria-label'?: string;
}
/**
 * FileUpload — 文件上传组件。
 *
 * 支持单文件/多文件上传，拖拽上传，文件大小/类型校验，上传进度展示。
 * 可通过 beforeUpload 自定义校验逻辑，customRequest 自定义上传请求。
 *
 * @example
 * <FileUpload
 *   multiple
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024}
 *   maxCount={5}
 *   onChange={(files) => console.log(files)}
 * />
 */
declare function FileUpload({ multiple, accept, maxSize, maxCount, fileList: controlledFileList, onChange, beforeUpload, customRequest, disabled, drag, placeholder, className, style, 'aria-label': ariaLabel, }: FileUploadProps): React__default.JSX.Element;

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

/** 采购订单快照 */
interface PurchaseOrderSnapshot {
    id: string;
    orderNo: string;
    /** 供应商 */
    supplier: string;
    /** 采购金额 */
    amount: number;
    /** 状态 */
    status: 'pending_approval' | 'approved' | 'shipped' | 'partial_received' | 'completed' | 'cancelled';
    /** 下单日期 */
    orderedAt: string;
    /** 预计到货 */
    expectedArrival: string;
    /** 到货率 (0-100) */
    arrivalRate: number;
    /** 采购员 */
    buyer: string;
}
/** 采购汇总指标 */
interface ProcurementSummary {
    /** 进行中订单数 */
    activeOrders: number;
    /** 本月采购总额 */
    monthlyTotalAmount: number;
    /** 环比上月 */
    monthlyTrend: number;
    /** 本月到货订单 */
    monthlyArrivedOrders: number;
    /** 平均到货时长(天) */
    avgArrivalDays: number;
    /** 到货准时率 */
    onTimeRate: number;
    /** 待审批订单 */
    pendingApprovalCount: number;
    /** 异常订单数 */
    anomalyCount: number;
}
/** 供应商概况 */
interface SupplierOverview {
    id: string;
    name: string;
    /** 合作等级 */
    tier: 'platinum' | 'gold' | 'silver' | 'bronze';
    /** 本月采购额 */
    monthlyAmount: number;
    /** 到货准时率 */
    onTimeRate: number;
    /** 退货率 */
    returnRate: number;
    /** 活跃合同数 */
    activeContracts: number;
    /** 上次采购 */
    lastPurchaseDate: string;
    /** 状态 */
    status: 'active' | 'suspended' | 'onboarding';
}
interface ProcurementManagerDashboardProps {
    /** 采购汇总 */
    summary: ProcurementSummary;
    /** 采购订单列表 */
    orders: PurchaseOrderSnapshot[];
    /** 供应商概况 */
    suppliers: SupplierOverview[];
    /** 用户名 */
    userName?: string;
    /** 近期待办任务(审批/异常) */
    pendingApprovals?: number;
}
declare function ProcurementManagerDashboard({ summary, orders, suppliers, userName, pendingApprovals, }: ProcurementManagerDashboardProps): React__default.JSX.Element;

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
    /** 是否禁用该字段 */
    disabled?: boolean;
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
    error?: boolean;
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
    /** 取消链接（若未设置则回退到 backUrl） */
    cancelHref?: string;
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
declare function FormPageScaffold<T extends Record<string, unknown> = Record<string, unknown>>({ meta, fields, onSubmit, onChange, topActions, submitLabel, submitVariant, backUrl, cancelHref, maxWidth, className, footer, onSuccess, disabled, }: FormPageScaffoldProps<T>): React__default.JSX.Element;

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

type TextAreaSize = 'sm' | 'md' | 'lg';
type TextAreaResize = 'none' | 'both' | 'horizontal' | 'vertical';
interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'value'> {
    value?: string;
    /** Visual size */
    size?: TextAreaSize;
    /** Label text rendered above the textarea */
    label?: string;
    /** Helper / hint text below the textarea */
    helperText?: string;
    /** Error message — when set, displays error styling */
    error?: string;
    /** Whether the textarea is in a loading state */
    loading?: boolean;
    /** Show character count (when maxLength is set) */
    showCount?: boolean;
    /** Make the textarea fill its container width */
    block?: boolean;
    /** Auto-resize height as content grows */
    autoSize?: boolean;
    /** Minimum rows when autoSize is true */
    minRows?: number;
    /** Maximum rows when autoSize is true (scroll beyond this) */
    maxRows?: number;
    /** Resize CSS property */
    resize?: TextAreaResize;
    /** Test id */
    'data-testid'?: string;
    /** aria-label fallback when no label */
    'aria-label'?: string;
}
declare function TextArea({ size, label, helperText, error, loading, showCount, block, autoSize, minRows, maxRows, resize, className, disabled, placeholder, value, defaultValue, onChange, maxLength, id: externalId, 'data-testid': dataTestId, 'aria-label': ariaLabel, ...rest }: TextAreaProps): React__default.JSX.Element;

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

type CollapseSize = 'sm' | 'md';
type CollapseVariant = 'default' | 'bordered' | 'minimal';
interface CollapseProps {
    /** Title text or custom title node. */
    title: React__default.ReactNode;
    /** Collapsible content. */
    children: React__default.ReactNode;
    /** Uncontrolled: initially open. */
    defaultOpen?: boolean;
    /** Controlled: external open state. */
    open?: boolean;
    /** Controlled callback. */
    onOpenChange?: (open: boolean) => void;
    /** Size preset. @default 'md' */
    size?: CollapseSize;
    /** Visual variant. @default 'default' */
    variant?: CollapseVariant;
    /** Additional CSS class. */
    className?: string;
    /** Disable toggle. */
    disabled?: boolean;
    /** Subtitle shown next to the chevron area. */
    subtitle?: React__default.ReactNode;
}
declare function Collapse({ title, children, defaultOpen, open: controlledOpen, onOpenChange, size, variant, className, disabled, subtitle, }: CollapseProps): React__default.JSX.Element;

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

/** 下拉菜单项分隔线 */
interface DropdownMenuSeparator {
    kind: 'separator';
}
/** 下拉菜单项操作 */
interface DropdownMenuItem {
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
    /** 子菜单项（实现嵌套） */
    children?: DropdownMenuEntry[];
    /** 点击回调 */
    onSelect?: () => void;
}
/** 下拉菜单项类型 */
type DropdownMenuEntry = DropdownMenuItem | DropdownMenuSeparator;
/** DropdownMenu 组件属性 */
interface DropdownMenuProps {
    /** 触发器内容（按钮/链接等） */
    trigger: React__default.ReactNode;
    /** 菜单项列表 */
    items: DropdownMenuEntry[];
    /** 菜单对齐方向 */
    align?: 'start' | 'center' | 'end';
    /** 菜单展开方向 */
    side?: 'bottom' | 'top';
    /** 关闭回调 */
    onOpenChange?: (open: boolean) => void;
    /** 是否默认打开 */
    defaultOpen?: boolean;
    /** 自定义宽度 */
    width?: number;
    /** 额外类名 */
    className?: string;
    /** 禁用整个下拉菜单 */
    disabled?: boolean;
}
declare const DropdownMenu: React__default.FC<DropdownMenuProps>;

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

interface DatePickerProps {
    /** 当前值 (ISO 8601 日期字符串 YYYY-MM-DD) */
    value?: string;
    /** 值变化回调 */
    onChange?: (value: string) => void;
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
    placeholder?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 自定义类名 */
    className?: string;
}
declare const DatePicker: React__default.FC<DatePickerProps>;

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

/** 通知条目 */
interface NotificationItem$1 {
    /** 唯一标识 */
    id: string;
    /** 标题 */
    title: string;
    /** 描述/内容 */
    description?: string;
    /** 是否已读 */
    read: boolean;
    /** 通知类型 */
    type?: 'info' | 'success' | 'warning' | 'error';
    /** 时间戳 (ISO) */
    timestamp: string;
    /** 可选图标 emoji */
    icon?: string;
    /** 点击回调 */
    onClick?: (item: NotificationItem$1) => void;
}
interface NotificationBellProps {
    /** 通知列表 */
    items: NotificationItem$1[];
    /** 未读徽章最大显示数 (超过显示 N+) */
    maxBadgeCount?: number;
    /** 下拉面板最多显示条数 */
    maxListCount?: number;
    /** 空状态提示文字 */
    emptyText?: string;
    /** 查看全部链接文字 */
    viewAllText?: string;
    /** 查看全部回调 */
    onViewAll?: () => void;
    /** 标记已读回调 */
    onMarkRead?: (id: string) => void;
    /** 全部标记已读回调 */
    onMarkAllRead?: () => void;
    /** 铃铛尺寸 */
    size?: 'sm' | 'md' | 'lg';
    /** 自定义 className */
    className?: string;
}
declare function NotificationBell({ items, maxBadgeCount, maxListCount, emptyText, viewAllText, onViewAll, onMarkRead, onMarkAllRead, size, className, }: NotificationBellProps): React__default.JSX.Element;

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

/** 营销活动快照 */
interface CampaignSnapshot {
    id: string;
    name: string;
    /** 活动类型 */
    type: 'promotion' | 'member' | 'seasonal' | 'new_product' | 'cross_sell';
    /** 活动状态 */
    status: 'draft' | 'active' | 'paused' | 'ended' | 'cancelled';
    /** 预算金额 */
    budget: number;
    /** 已花费 */
    spent: number;
    /** 触达人数 */
    reachCount: number;
    /** 参与人数 */
    participantCount: number;
    /** 转化率 (0-100) */
    conversionRate: number;
    /** ROI (百分比, 如 150 = 150%) */
    roi: number;
    /** 开始日期 */
    startDate: string;
    /** 结束日期 */
    endDate?: string;
    /** 负责人 */
    owner?: string;
}
/** 营销增长指标 */
interface MarketingGrowthMetrics {
    /** 新增会员数 (今日/本周/本月) */
    newMembers: number;
    /** 新增会员环比 (%) */
    newMembersQoQ: number;
    /** 活跃会员数 */
    activeMembers: number;
    /** 活跃会员环比 */
    activeMembersQoQ: number;
    /** 会员复购率 (0-100) */
    repurchaseRate: number;
    /** 复购率环比 */
    repurchaseRateQoQ: number;
    /** 客单价 */
    avgOrderValue: number;
    /** 客单价环比 */
    avgOrderValueQoQ: number;
    /** 活动ROI均值 */
    avgCampaignRoi: number;
    /** ROI环比 */
    avgCampaignRoiQoQ: number;
}
/** 渠道效果 */
interface ChannelEffectiveness {
    channel: string;
    /** 触达人次 */
    impressions: number;
    /** 点击次数 */
    clicks: number;
    /** 点击率 (0-100) */
    ctr: number;
    /** 转化数 */
    conversions: number;
    /** 花费 */
    cost: number;
    /** 获客成本 */
    customerAcquisitionCost: number;
}
/** 营销经理快速操作 */
interface MarketingQuickAction {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
}
/** 营销经理工作台属性 */
interface MarketingManagerDashboardProps {
    /** 营销经理姓名 */
    managerName?: string;
    /** 上次同步时间 */
    lastSyncAt?: string;
    /** 增长指标 */
    growthMetrics?: MarketingGrowthMetrics;
    /** 活动列表 */
    campaigns?: CampaignSnapshot[];
    /** 渠道效果 */
    channels?: ChannelEffectiveness[];
    /** 快速操作 */
    quickActions?: MarketingQuickAction[];
    /** 月度预算 */
    monthlyBudget?: number;
    /** 已用预算占比 (0-100) */
    budgetUsedPercent?: number;
    /** 加载态 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
}
declare function MarketingManagerDashboard({ managerName, lastSyncAt, growthMetrics, campaigns, channels, quickActions, monthlyBudget, budgetUsedPercent, loading, compact, }: MarketingManagerDashboardProps): React__default.JSX.Element;

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
    render(): string | number | boolean | React__default.JSX.Element | Iterable<React__default.ReactNode> | null | undefined;
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

/** 回访任务优先级 */
type FollowUpPriority = 'urgent' | 'high' | 'medium' | 'low';
/** 回访任务状态 */
type FollowUpTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
/** 回访分类 */
type FollowUpCategory = 'birthday' | 'renewal' | 'visit' | 'complaint' | 'survey' | 'promotion' | 'general';
/** 回访记录 */
interface FollowUpRecord {
    /** 会员姓名 */
    memberName: string;
    /** 会员手机号 */
    memberPhone: string;
    /** 会员等级 */
    memberTier?: string;
    /** 任务标题 */
    title: string;
    /** 任务描述 */
    description: string;
    /** 优先级 */
    priority: FollowUpPriority;
    /** 状态 */
    status: FollowUpTaskStatus;
    /** 回访分类 */
    category: FollowUpCategory;
    /** 截止日期 */
    dueDate: string;
    /** 分配人 */
    assignee: string;
    /** 备注 */
    note?: string;
    /** 上次回访时间 */
    lastContactDate?: string;
}
interface MemberFollowUpTaskPanelProps {
    /** 导购/前台姓名 */
    staffName: string;
    /** 今日待完成任务列表 */
    tasks: FollowUpRecord[];
    /** 总待处理数 */
    totalPending?: number;
    /** 今日已完成数 */
    completedToday?: number;
    /** 逾期任务数 */
    overdueCount?: number;
    /** 开始回访回调 */
    onStartFollowUp?: (task: FollowUpRecord) => void;
    /** 标记完成回调 */
    onMarkComplete?: (task: FollowUpRecord) => void;
    /** 跳过回调 */
    onSkip?: (task: FollowUpRecord) => void;
    /** 查看更多回调 */
    onViewAll?: () => void;
}
declare function MemberFollowUpTaskPanel({ staffName, tasks, totalPending, completedToday, overdueCount, onStartFollowUp, onMarkComplete, onSkip, onViewAll, }: MemberFollowUpTaskPanelProps): React__default.JSX.Element;

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

/** 充值方案 */
interface RechargePlan {
    /** 方案 ID */
    id: string;
    /** 方案名称 */
    name: string;
    /** 充值金额 (分) */
    amount: number;
    /** 赠送金额 (分) */
    bonus: number;
    /** 是否推荐 */
    recommended?: boolean;
    /** 额外积分赠送 */
    bonusPoints?: number;
    /** 到期天数 */
    expiryDays?: number;
}
/** 充值方式 */
type RechargePaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card' | 'points';
/** 充值记录 */
interface RechargeRecord {
    id: string;
    memberName: string;
    memberPhone: string;
    amount: number;
    bonus: number;
    paymentMethod: RechargePaymentMethod;
    createdAt: string;
    operator: string;
    status: 'success' | 'failed' | 'pending';
}
/** 会员充值面板属性 */
interface MemberRechargePanelProps {
    /** 会员姓名 */
    memberName: string;
    /** 会员手机号 */
    memberPhone: string;
    /** 会员等级 */
    memberTier?: string;
    /** 当前余额 (分) */
    currentBalance: number;
    /** 充值方案列表 */
    plans: RechargePlan[];
    /** 最近充值记录 */
    recentRecords?: RechargeRecord[];
    /** 是否显示自定义金额输入 */
    customAmount?: boolean;
    /** 支付方式列表 */
    paymentMethods?: RechargePaymentMethod[];
    /** 已选方案 ID */
    selectedPlanId?: string | null;
    /** 自定义金额 (元) */
    customAmountValue?: string;
    /** 已选支付方式 */
    selectedPaymentMethod?: RechargePaymentMethod;
    /** 是否提交中 */
    submitting?: boolean;
    /** 是否加载中 */
    loading?: boolean;
    /** 错误信息 */
    error?: string;
    /** 充值成功 */
    success?: boolean;
    /** 方案选择回调 */
    onPlanSelect?: (planId: string) => void;
    /** 自定义金额变更 */
    onCustomAmountChange?: (value: string) => void;
    /** 支付方式变更 */
    onPaymentMethodChange?: (method: RechargePaymentMethod) => void;
    /** 充值提交 */
    onRecharge?: () => void;
    /** 关闭成功提示 */
    onDismissSuccess?: () => void;
    /** 关闭错误提示 */
    onDismissError?: () => void;
    /** 类名 */
    className?: string;
}
declare function MemberRechargePanel({ memberName, memberPhone, memberTier, currentBalance, plans, recentRecords, customAmount, paymentMethods, selectedPlanId, customAmountValue, selectedPaymentMethod, submitting, loading, error, success, onPlanSelect, onCustomAmountChange, onPaymentMethodChange, onRecharge, onDismissSuccess, onDismissError, className, }: MemberRechargePanelProps): React__default.JSX.Element;

/** 单条 RFM 记录 */
interface RFMRecord {
    /** 会员标识 */
    id: string;
    /** 会员名称 */
    name: string;
    /** 最近一次消费分数 (1-5) */
    recency: number;
    /** 消费频率分数 (1-5) */
    frequency: number;
    /** 消费金额分数 (1-5) */
    monetary: number;
    /** 头像颜色 */
    avatarColor?: string;
}
/** 分层标签 */
type RFMSegment = '高价值' | '重要发展' | '重要保持' | '重要挽留' | '一般价值' | '一般发展' | '一般保持' | '流失预警';
/** 分层信息 */
interface RFMSegmentInfo {
    label: RFMSegment;
    color: string;
    count: number;
}
/** MemberRFMAnalysisPanel Props */
interface MemberRFMAnalysisPanelProps {
    /** RFM 数据集 */
    data: RFMRecord[];
    /** 标题 */
    title?: string;
    /** 面板高度（默认 300） */
    height?: number;
    /** 是否加载中 */
    loading?: boolean;
    /** 空态文案 */
    emptyText?: string;
    /** 显示模式：'list'（列表）| 'segment'（分层分布）| 'all'（两者，默认） */
    mode?: 'list' | 'segment' | 'all';
    /** 自定义类名 */
    className?: string;
    'data-testid'?: string;
}
/**
 * MemberRFMAnalysisPanel — 会员RFM分析面板
 *
 * 展示会员最近消费时间(Recency)、消费频率(Frequency)、
 * 消费金额(Monetary)的三维评分，自动分层归类。
 * 适用角色：会员营销经理、店长、运营经理。
 */
declare function MemberRFMAnalysisPanel({ data, title, height, loading, emptyText, mode, className, 'data-testid': dataTestId, }: MemberRFMAnalysisPanelProps): React__default.JSX.Element;

/** 流失风险等级 */
type ChurnRiskLevel = 'low' | 'medium' | 'high' | 'critical';
/** 流失信号因子 */
interface ChurnSignalFactor {
    /** 因子编码 */
    code: string;
    /** 因子名称 */
    label: string;
    /** 贡献权重 0-100 */
    weight: number;
    /** 详细描述 */
    description: string;
    /** 风险方向 positive=正向, negative=负向 */
    direction: 'positive' | 'negative';
}
/** 建议挽回动作 */
interface RetentionAction {
    /** 动作编码 */
    code: string;
    /** 动作名称 */
    label: string;
    /** 推荐渠道 */
    channel: 'sms' | 'wechat' | 'app_push' | 'coupon' | 'phone';
    /** 优先级 */
    priority: 'high' | 'medium' | 'low';
    /** 预期挽回概率 0-100 */
    expectedRecoveryRate: number;
    /** 动作说明 */
    description: string;
}
/** 流失预测结果 */
interface ChurnPrediction {
    /** 会员 ID */
    memberId: string;
    /** 会员名称 */
    memberName: string;
    /** 当前会员等级 */
    memberTier: string;
    /** 风险等级 */
    riskLevel: ChurnRiskLevel;
    /** 整体流失概率 0-100 */
    churnProbability: number;
    /** 预测流失时间窗口（天） */
    predictedWindowDays: number;
    /** 流失信号因子列表 */
    signalFactors: ChurnSignalFactor[];
    /** 建议挽回动作列表 */
    recommendedActions: RetentionAction[];
    /** 历史趋势 last30d/last90d/last180d */
    activityTrend: 'declining' | 'stable' | 'recovering';
    /** 上次活跃距今天数 */
    daysSinceLastActivity: number;
    /** 预测生成时间 */
    predictedAt: string;
}
interface AIMemberChurnPredictionPanelProps {
    /** 流失预测数据 */
    prediction: ChurnPrediction;
    /** 是否加载中 */
    loading?: boolean;
    /** 错误信息 */
    error?: string | null;
    /** 点击执行挽回动作回调 */
    onExecuteAction?: (action: RetentionAction) => void;
    /** 重新预测回调 */
    onRefresh?: () => void;
    /** 自定义类名 */
    className?: string;
}
declare function AIMemberChurnPredictionPanel({ prediction, loading, error, onExecuteAction, onRefresh, className, }: AIMemberChurnPredictionPanelProps): React__default.JSX.Element;

/** 指标变化趋势 */
type TrendDirection$3 = 'up' | 'down' | 'flat';
/** 高亮指标项 */
interface HighlightMetric {
    /** 指标名称 */
    label: string;
    /** 当前值 */
    value: string | number;
    /** 变化趋势 */
    trend?: TrendDirection$3;
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

/** 建议优先级 */
type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';
/** 建议来源 */
type SuggestionSource = 'ai' | 'rule' | 'manual' | 'system';
/** AI 建议项 */
interface SuggestionItem {
    /** 建议 ID */
    id: string;
    /** 建议标题 */
    title: string;
    /** 建议详细描述 */
    description: string;
    /** 优先级 */
    priority: SuggestionPriority;
    /** 来源类型 */
    source: SuggestionSource;
    /** AI 置信度 (0-100) */
    confidence: number;
    /** 预期收益描述 */
    expectedBenefit?: string;
    /** 关联指标 */
    relatedMetrics?: {
        label: string;
        value: string;
        trend?: 'up' | 'down';
    }[];
    /** 建议操作列表 */
    actions?: {
        label: string;
        key: string;
        variant?: 'primary' | 'secondary' | 'ghost';
    }[];
    /** 是否已采纳 */
    adopted?: boolean;
    /** 建议生成时间 ISO */
    createdAt?: string;
    /** 额外标签 */
    tags?: string[];
}
/** 组件 Props */
interface AISuggestionCardProps {
    /** 建议数据 */
    suggestion: SuggestionItem;
    /** 操作回调 */
    onAction?: (actionKey: string, suggestionId: string) => void;
    /** 采纳/拒绝回调 */
    onAdopt?: (adopted: boolean, suggestionId: string) => void;
    /** 卡片变体 */
    variant?: 'compact' | 'detailed';
    /** 类名 */
    className?: string;
}
declare function AISuggestionCard({ suggestion, onAction, onAdopt, variant, className, }: AISuggestionCardProps): React__default.JSX.Element;

/** 定价策略建议 */
interface PricingRecommendation {
    /** 商品ID */
    productId: string;
    /** 商品名称 */
    productName: string;
    /** 当前售价 */
    currentPrice: number;
    /** 建议售价 */
    recommendedPrice: number;
    /** 建议变动百分比 */
    changePercent: number;
    /** 预计销量影响 (百分比) */
    estimatedSalesImpact: number;
    /** 预计利润影响 */
    estimatedProfitImpact: number;
    /** 置信度 (0-100) */
    confidence: number;
    /** 定价策略类型 */
    strategy: 'markup' | 'markdown' | 'promotion' | 'dynamic' | 'premium';
    /** 策略原因 */
    reason: string;
    /** 竞争对手比较 */
    competitorComparison?: {
        competitorName: string;
        competitorPrice: number;
        position: 'above' | 'at' | 'below';
    };
}
/** 汇总统计 */
interface PricingSummary {
    /** 总商品数 */
    totalProducts: number;
    /** 建议涨价的商品数 */
    markupCount: number;
    /** 建议降价的商品数 */
    markdownCount: number;
    /** 平均建议变动 */
    averageChangePercent: number;
    /** 预计整体收入影响 */
    totalRevenueImpact: number;
    /** 分析时间范围 */
    analysisTimeRange: string;
}
/** AI定价推荐面板属性 */
interface AIPricingRecommendationPanelProps {
    /** 定价推荐列表 */
    recommendations: PricingRecommendation[];
    /** 汇总统计 */
    summary: PricingSummary;
    /** 是否加载中 */
    loading?: boolean;
    /** 错误信息 */
    error?: string;
    /** 应用推荐的回调 */
    onApplyRecommendation: (productId: string) => void;
    /** 忽略推荐的回调 */
    onDismissRecommendation: (productId: string) => void;
    /** 批量应用所有推荐 */
    onApplyAll?: () => void;
    /** 刷新数据 */
    onRefresh?: () => void;
}
declare function AIPricingRecommendationPanel({ recommendations, summary, loading, error, onApplyRecommendation, onDismissRecommendation, onApplyAll, onRefresh, }: AIPricingRecommendationPanelProps): React__default.JSX.Element;

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

/** 建议置信度 */
type RecommendationConfidence = 'high' | 'medium' | 'low';
/** 建议类别 */
type RecommendationCategory = 'governance' | 'compliance' | 'performance' | 'security' | 'cost' | 'member_retention';
/** 单条规则建议 */
interface RuleRecommendation {
    /** 建议 ID */
    id: string;
    /** 建议标题 */
    title: string;
    /** 建议描述 */
    description: string;
    /** 建议类别 */
    category: RecommendationCategory;
    /** 置信度 */
    confidence: RecommendationConfidence;
    /** 潜在影响描述 */
    impact?: string;
    /** 预估收益（如节省成本百分比/提升效率百分比）*/
    estimatedBenefit?: string;
    /** 是否已被采纳 */
    adopted?: boolean;
    /** 采纳后关联规则 ID */
    resultingRuleId?: string;
    /** 创建时间 */
    createdAt: string;
}
/** 汇总统计 */
interface RecommendationSummary {
    total: number;
    highConfidence: number;
    adopted: number;
    /** 预估总收益 */
    totalEstimatedBenefit?: string;
}
/** 面板属性 */
interface RuleRecommendationPanelProps {
    /** 建议列表 */
    recommendations: RuleRecommendation[];
    /** 汇总统计 */
    summary?: RecommendationSummary;
    /** 采纳回调 */
    onAdopt?: (recommendationId: string) => void;
    /** 忽略回调 */
    onDismiss?: (recommendationId: string) => void;
    /** 查看详情回调 */
    onViewDetail?: (recommendationId: string) => void;
    /** 加载状态 */
    loading?: boolean;
    /** 类名 */
    className?: string;
}
declare function RuleRecommendationPanel({ recommendations, summary, onAdopt, onDismiss, onViewDetail, loading, className, }: RuleRecommendationPanelProps): React__default.JSX.Element;

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

/** 排班/人员状态 */
interface StaffScheduleEntry {
    id: string;
    name: string;
    role: string;
    /** 今日排班时段 */
    shift: string;
    /** 出勤状态 */
    attendance: 'on_time' | 'late' | 'absent' | 'leave' | 'finished';
    /** 今日业绩 (销售额) */
    todaySales?: number;
    /** 会员拉新数 */
    newMembers?: number;
    /** 服务评分 (1-5) */
    serviceScore?: number;
    /** 头像/代号 */
    avatar?: string;
}
/** 培训进度 */
interface TrainingProgress {
    id: string;
    title: string;
    /** 参与人数 */
    enrolledCount: number;
    /** 完成人数 */
    completedCount: number;
    /** 截止日期 */
    deadline: string;
    /** 状态 */
    status: 'in_progress' | 'pending' | 'completed' | 'overdue';
}
/** 服务质量汇总 */
interface QualityMetrics {
    /** 今日评价数 */
    totalReviews: number;
    /** 好评率 (0-100) */
    positiveRate: number;
    /** 差评数 */
    negativeCount: number;
    /** 待处理投诉 */
    pendingComplaints: number;
    /** 服务达标率 (0-100) */
    serviceCompliance: number;
    /** 神秘顾客评分 (0-100) */
    mysteryShopperScore?: number;
}
/** 交接班概览 */
interface ShiftHandover {
    /** 当前班次 */
    currentShift: string;
    /** 交接事项目录 */
    items: HandoverItem[];
}
/** 交接事项 */
interface HandoverItem {
    id: string;
    category: 'revenue' | 'inventory' | 'personnel' | 'device' | 'member' | 'other';
    summary: string;
    priority: 'high' | 'medium' | 'low';
    resolved: boolean;
}
/** 助理经理操作 */
interface AsstQuickAction {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick?: () => void;
}
/** 门店副店长/助理经理工作台 Props */
interface AssistantManagerDashboardProps {
    /** 门店名称 */
    storeName?: string;
    /** 助理经理姓名 */
    assistantName?: string;
    /** 今日员工排班 & 考勤 */
    staffSchedules?: StaffScheduleEntry[];
    /** 培训任务进度 */
    trainingItems?: TrainingProgress[];
    /** 服务质量指标 */
    qualityMetrics?: QualityMetrics;
    /** 交接班事项 */
    handover?: ShiftHandover;
    /** 快速操作 */
    quickActions?: AsstQuickAction[];
    /** 人事运营汇总 */
    peopleSummary?: {
        totalStaff: number;
        onDuty: number;
        onLeave: number;
        trainingRate: number;
    };
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
 * AssistantManagerDashboard — 门店副店长/助理经理工作台
 *
 * 面向门店二把手角色，聚合人员排班考勤、培训进度、服务质量监控、交接班管理等核心工作。
 * 适用于零售门店 / 餐饮连锁 / 服务门店的管理场景。
 *
 * @example
 * <AssistantManagerDashboard
 *   storeName="朝阳旗舰店"
 *   assistantName="王强"
 *   peopleSummary={{ totalStaff: 28, onDuty: 16, onLeave: 3, trainingRate: 72 }}
 *   staffSchedules={[...]}
 *   qualityMetrics={{ totalReviews: 86, positiveRate: 94.2, negativeCount: 2, pendingComplaints: 1, serviceCompliance: 91.5 }}
 *   trainingItems={[...]}
 *   handover={{ currentShift: '早班', items: [...] }}
 *   quickActions={[{ key: 'schedule', label: '排班管理', primary: true }]}
 * />
 */
declare function AssistantManagerDashboard({ storeName, assistantName, staffSchedules, trainingItems, qualityMetrics, handover, quickActions, peopleSummary, lastSyncAt, loading, compact, className, }: AssistantManagerDashboardProps): React__default.JSX.Element;

/** 客服服务质量指标 */
interface ServiceQualityMetrics {
    /** 今日已处理工单数 */
    resolvedTickets: number;
    /** 平均响应时间 (分钟) */
    avgResponseTime: number;
    /** 平均解决时间 (分钟) */
    avgResolutionTime: number;
    /** 客户满意度 (1-5) */
    satisfactionScore: number;
}
/** 客服工单 */
interface ServiceTicket {
    id: string;
    title: string;
    customerName: string;
    priority: 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    category: 'complaint' | 'inquiry' | 'refund' | 'exchange' | 'other';
    createdAt: string;
    assignedTo?: string;
}
/** 座席状态摘要 */
interface AgentStatusSummary {
    total: number;
    online: number;
    busy: number;
    away: number;
    offline: number;
}
/** 快速操作 */
interface QuickAction$1 {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick?: () => void;
}
/** 客服主管工作台 Props */
interface CustomerServiceDashboardProps {
    /** 服务质量指标 */
    serviceMetrics?: ServiceQualityMetrics;
    /** 待处理工单列表 */
    pendingTickets?: ServiceTicket[];
    /** 座席状态 */
    agentStatus?: AgentStatusSummary;
    /** 快速操作按钮 */
    quickActions?: QuickAction$1[];
    /** 团队名称 */
    teamName?: string;
    /** 最后同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
}
declare function CustomerServiceDashboard({ serviceMetrics, pendingTickets, agentStatus, quickActions, teamName, lastSyncAt, loading, compact, className, }: CustomerServiceDashboardProps): React__default.JSX.Element;

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

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'default' | 'primary' | 'inverted';
interface SpinnerProps {
    /** 尺寸 */
    size?: SpinnerSize;
    /** 外观变体 */
    variant?: SpinnerVariant;
    /** 可选标签，展示在旋转图标下方 */
    label?: string;
    className?: string;
}
declare function Spinner({ size, variant, label, className, }: SpinnerProps): React__default.JSX.Element;

type StepStatus = 'waiting' | 'processing' | 'completed' | 'error';
interface StepItem {
    /** Step title */
    title: string;
    /** Step description / subtitle */
    description?: string;
    /** Custom icon (replaces step number) */
    icon?: React__default.ReactNode;
    /** Step status; defaults derived from `current` prop */
    status?: StepStatus;
    /** Whether the step is clickable */
    clickable?: boolean;
}
type StepsSize = 'sm' | 'md' | 'lg';
type StepsOrientation = 'horizontal' | 'vertical';
interface StepsProps {
    /** Ordered list of steps */
    items: StepItem[];
    /** 0-based index of the current active step */
    current?: number;
    /** Visual size */
    size?: StepsSize;
    /** Direction */
    orientation?: StepsOrientation;
    /** Callback when a clickable step is clicked */
    onStepClick?: (index: number) => void;
    /** Whether to show connecting lines */
    showConnector?: boolean;
    /** Custom class name */
    className?: string;
    /** Custom styles */
    style?: React__default.CSSProperties;
    /** Test id */
    'data-testid'?: string;
}
declare const Steps: React__default.FC<StepsProps>;

/** 分割方向 */
type SplitDirection = 'horizontal' | 'vertical';
interface SplitPaneProps {
    /** 第一个面板 (左侧/上侧) */
    first: React__default.ReactNode;
    /** 第二个面板 (右侧/下侧) */
    second: React__default.ReactNode;
    /** 分割方向 (默认 horizontal) */
    direction?: SplitDirection;
    /** 初始分割比例, 0-1 之间, 默认 0.5 */
    initialSplit?: number;
    /** 分隔条宽度 (默认 4) */
    dividerWidth?: number;
    /** 分隔条颜色 (默认 rgba(148,163,184,0.24)) */
    dividerColor?: string;
    /** 分隔条悬停颜色 (默认 rgba(148,163,184,0.48)) */
    dividerHoverColor?: string;
    /** 容器最小高度 (默认 300) */
    minHeight?: number;
    /** 容器最小宽度 (默认 300) */
    minWidth?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
}
/**
 * SplitPane — 可拖拽分割面板
 *
 * 支持水平和垂直方向分割，拖拽分隔条调整两个面板尺寸。
 * 用于管理后台的左右分栏、上下分栏等场景。
 *
 * @example
 * // 水平分割（左右）
 * <SplitPane
 *   first={<ListPanel />}
 *   second={<DetailPanel />}
 *   direction="horizontal"
 *   initialSplit={0.3}
 * />
 *
 * @example
 * // 垂直分割（上下）
 * <SplitPane
 *   first={<EditorPanel />}
 *   second={<PreviewPanel />}
 *   direction="vertical"
 *   initialSplit={0.6}
 * />
 */
declare function SplitPane({ first, second, direction, initialSplit, dividerWidth, dividerColor, dividerHoverColor, minHeight, minWidth, className, style, }: SplitPaneProps): React__default.JSX.Element;

/** 趋势方向 */
type TrendDirection$2 = 'up' | 'down' | 'stable' | 'volatile';
/** 趋势分类标签 */
type TrendLabel = 'growth' | 'decline' | 'warning' | 'normal' | 'critical';
/** 数据点 */
interface TrendDataPoint$1 {
    /** 时间戳 ISO */
    timestamp: string;
    /** 数值 */
    value: number;
    /** 可选标签 */
    label?: string;
}
/** 趋势分析结果 */
interface TrendAnalysis {
    /** 方向 */
    direction: TrendDirection$2;
    /** 变化率（百分比） */
    changeRate: number;
    /** AI 分类标签 */
    label: TrendLabel;
    /** 预测说明 */
    insight: string;
    /** 置信度 0-1 */
    confidence: number;
    /** 是否检测到异常 */
    hasAnomaly: boolean;
    /** 建议操作 */
    suggestion?: string;
}
/** 预测数据点 */
interface ForecastPoint {
    timestamp: string;
    predicted: number;
    upperBound: number;
    lowerBound: number;
}
/** 智能趋势分析面板 Props */
interface SmartTrendAnalysisPanelProps {
    /** 趋势名称 */
    title: string;
    /** 数值单位 */
    unit?: string;
    /** 最近一期数值 */
    currentValue: number;
    /** 上期数值（用于对比） */
    previousValue: number;
    /** 历史数据点（用于异常检测模式识别） */
    history?: TrendDataPoint$1[];
    /** AI 分析结果 */
    analysis: TrendAnalysis;
    /** 预测数据 */
    forecast?: ForecastPoint[];
    /** 指标说明 */
    metricDescription?: string;
    /** 面板主题色 */
    accentColor?: string;
    /** 自定义类名 */
    className?: string;
}
/**
 * SmartTrendAnalysisPanel — 智能趋势分析面板组件。
 *
 * 结合 AI 分析进行趋势判定、异常检测和预测可视化。
 * 适用于会员增长趋势、销售趋势、设备状态趋势等场景。
 *
 * @example
 * <SmartTrendAnalysisPanel
 *   title="会员增长率"
 *   unit="%"
 *   currentValue={12.5}
 *   previousValue={8.3}
 *   analysis={{
 *     direction: 'up',
 *     changeRate: 50.6,
 *     label: 'growth',
 *     insight: '近7天会员注册量持续上升，建议加大拉新投入',
 *     confidence: 0.85,
 *     hasAnomaly: false,
 *     suggestion: '建议配合营销活动，预计下月增长率可提升至 18%',
 *   }}
 * />
 */
declare function SmartTrendAnalysisPanel({ title, unit, currentValue, previousValue, history, analysis, forecast, metricDescription, accentColor, className, }: SmartTrendAnalysisPanelProps): React__default.JSX.Element;

interface UsageMetric {
    /** Metric identifier */
    key: string;
    /** Display label */
    label: string;
    /** Current value */
    value: number;
    /** Unit suffix */
    unit?: string;
    /** Percentage change vs previous period */
    changePercent?: number;
    /** Trend direction hint */
    trend?: 'up' | 'down' | 'flat';
    /** Color variant */
    color: 'info' | 'warning' | 'error' | 'success' | 'default';
}
interface UsageMetricsPanelProps {
    /** Panel title */
    title: string;
    /** Array of metrics to display */
    metrics: UsageMetric[];
    /** Optional time range label (e.g. "过去7天") */
    timeRange?: string;
    /** Optional className override */
    className?: string;
}
declare function UsageMetricsPanel({ title, metrics, timeRange, className }: UsageMetricsPanelProps): React__default.JSX.Element;

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

/** 导出格式 */
type ExportFormat = 'csv' | 'json' | 'xlsx';
/** ExportButton 属性 */
interface ExportButtonProps {
    /** 导出文件名（不含扩展名） */
    filename: string;
    /** 导出格式 */
    format?: ExportFormat;
    /** 生成导出数据的异步函数 */
    onExport: () => Promise<string | Record<string, unknown>[]>;
    /** 自定义按钮文本 */
    label?: string;
    /** 按钮变体 */
    variant?: 'primary' | 'secondary' | 'ghost';
    /** 禁用状态 */
    disabled?: boolean;
    /** 附加 className */
    className?: string;
    /** 成功回调 */
    onSuccess?: () => void;
    /** 失败回调 */
    onError?: (err: unknown) => void;
}
/** 将记录数组序列化为 CSV 字符串 */
declare function serializeToCsv(records: Record<string, unknown>[]): string;
/**
 * ExportButton — 通用数据导出按钮，支持 CSV / JSON 格式。
 *
 * 用法：
 * ```tsx
 * <ExportButton
 *   filename="members-2026-06"
 *   format="csv"
 *   onExport={async () => fetchMembers()}
 *   onSuccess={() => toast('导出成功')}
 * />
 * ```
 */
declare function ExportButton({ filename, format, onExport, label, variant, disabled, className, onSuccess, onError, }: ExportButtonProps): React__default.JSX.Element;

interface MetricTile {
    id: string;
    label: string;
    value: string | number;
    trend?: {
        value: string;
        positive: boolean;
    };
    icon?: React__default.ReactNode;
    variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
    helper?: React__default.ReactNode;
    onClick?: () => void;
}
interface MetricsDashboardGridProps {
    tiles: MetricTile[];
    columns?: 2 | 3 | 4 | 'auto-fit';
    gap?: number;
    loading?: boolean;
    loadingSkeletonCount?: number;
    emptyMessage?: string;
    emptyAction?: React__default.ReactNode;
    error?: string | null;
    onRetry?: () => void;
    className?: string;
}
declare function MetricsDashboardGrid({ tiles, columns, gap, loading, loadingSkeletonCount, emptyMessage, emptyAction, error, onRetry, className, }: MetricsDashboardGridProps): React__default.JSX.Element;

type TrendDirection$1 = 'up' | 'down' | 'stable';
interface StatTrendProps {
    /** 趋势方向 */
    direction: TrendDirection$1;
    /** 变化数值（如 +12.5%） */
    value?: string;
    /** 标签文字 */
    label?: string;
    /** 尺寸 */
    size?: 'sm' | 'md' | 'lg';
    /** 是否反转颜色（下跌为绿色时设为 true） */
    invert?: boolean;
    className?: string;
}
/**
 * StatTrend — 统计趋势指示器
 *
 * 在仪表盘/卡片上显示数据变化的升降趋势。
 */
declare function StatTrend({ direction, value, label, size, invert, className, }: StatTrendProps): React__default.JSX.Element;

interface AutoCompleteOption<T = string> {
    value: T;
    label: string;
    /** 可选的副标题/描述 */
    subtitle?: string;
    /** 可选的图标/标记 */
    icon?: React__default.ReactNode;
    /** 是否禁用该选项 */
    disabled?: boolean;
}
interface AutoCompleteProps<T = string> {
    /** 选项列表 */
    options: AutoCompleteOption<T>[];
    /** 当前选中值（受控） */
    value?: T;
    /** 默认值（非受控） */
    defaultValue?: T;
    /** 选中回调 */
    onChange?: (value: T, option: AutoCompleteOption<T>) => void;
    /** 输入值变化回调 */
    onInputChange?: (input: string) => void;
    /** 占位文字 */
    placeholder?: string;
    /** 是否显示搜索图标 */
    showSearchIcon?: boolean;
    /** 是否允许清空 */
    clearable?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否显示加载状态 */
    loading?: boolean;
    /** 加载占位文字 */
    loadingText?: string;
    /** 空数据占位文字 */
    emptyText?: string;
    /** 输入防抖毫秒数，默认 300 */
    debounceMs?: number;
    /** 自定义过滤函数，默认 label 模糊匹配 */
    filterOption?: (input: string, option: AutoCompleteOption<T>) => boolean;
    /** 最大显示选项数 */
    maxOptions?: number;
    /** 宽度 */
    width?: number | string;
    /** 自定义类名 */
    className?: string;
    /** 自定义 data-testid */
    'data-testid'?: string;
}
declare function AutoComplete<T = string>(props: AutoCompleteProps<T>): React__default.JSX.Element;

interface SparklinePoint {
    label: string;
    value: number;
}
interface DrilldownDetail {
    /** 钻取后的详细条目 */
    items: DrilldownDetailItem[];
    /** 钻取标题 */
    title: string;
    /** 钻取描述 */
    description?: string;
}
interface DrilldownDetailItem {
    label: string;
    value: string | number;
    trend?: {
        value: string;
        positive: boolean;
    };
    icon?: React__default.ReactNode;
    variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
    onClick?: () => void;
}
type TrendDirection = 'up' | 'down' | 'stable';
interface DrilldownTrendCardProps {
    /** 主指标标签 */
    label: string;
    /** 主指标值 */
    value: string | number;
    /** 趋势方向 */
    trendDirection: TrendDirection;
    /** 趋势变化文本（如 +12.5%） */
    trendValue?: string;
    /** 趋势是否反转颜色 */
    trendInvert?: boolean;
    /** 图标 */
    icon?: React__default.ReactNode;
    /** 变体样式 */
    variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
    /** 迷你 Sparkline 数据 */
    sparklineData?: SparklinePoint[];
    /** 附加描述文本（显示在指标下方） */
    description?: string;
    /** 钻取详情 — 点击卡片后展开 */
    drilldownDetail?: DrilldownDetail;
    /** 是否默认展开钻取 */
    defaultExpanded?: boolean;
    /** 是否允许钻取展开 */
    expandable?: boolean;
    /** 类名 */
    className?: string;
}
/**
 * DrilldownTrendCard — 带钻取功能的趋势指标卡片
 *
 * 在决策面板/仪表盘上展示核心 KPI 指标，支持：
 * - 迷你 Sparkline 趋势图
 * - 方向性趋势指示器
 * - 点击展开钻取详情
 */
declare function DrilldownTrendCard({ label, value, trendDirection, trendValue, trendInvert, icon, variant, sparklineData, description, drilldownDetail, defaultExpanded, expandable, className, }: DrilldownTrendCardProps): React__default.JSX.Element;

interface KanbanColumn {
    /** Unique column id. */
    id: string;
    /** Column title. */
    title: string;
    /** Optional badge count shown beside the title. */
    count?: number;
    /** CSS background color override. */
    bgColor?: string;
}
interface KanbanCard {
    /** Unique card id. */
    id: string;
    /** Card title. */
    title: string;
    /** Optional subtitle / description. */
    subtitle?: string;
    /** Current column id the card belongs to. */
    columnId: string;
    /** Optional priority label. */
    priority?: 'low' | 'medium' | 'high' | 'critical';
    /** Optional assignee name. */
    assignee?: string;
    /** Additional metadata rendered as tags. */
    tags?: string[];
    /** ISO date string for display. */
    dueDate?: string;
}
interface KanbanBoardProps {
    /** Column definitions. */
    columns: KanbanColumn[];
    /** Cards across all columns. */
    cards: KanbanCard[];
    /** Callback when a card is dragged to a new column. */
    onCardMove?: (cardId: string, targetColumnId: string, targetIndex: number) => void;
    /** Callback when a card is clicked. */
    onCardClick?: (card: KanbanCard) => void;
    /** Loading state. */
    loading?: boolean;
    /** Custom class name. */
    className?: string;
    /** Test id. */
    'data-testid'?: string;
}
declare function KanbanBoard({ columns, cards, onCardMove, onCardClick, loading, className, 'data-testid': dataTestId, }: KanbanBoardProps): React__default.JSX.Element;

/** 时间桶中的异常统计 */
interface AnomalyTimeBucket {
    /** 时间标签 (e.g. "06-26 08:00", "周一") */
    label: string;
    /** 该时段异常总数 */
    total: number;
    /** 各严重程度计数 */
    bySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    /** 可选点击回调数据 */
    bucketId?: string;
}
/** 异常时序频率图 Props */
interface AnomalyFrequencyTimelineProps {
    /** 按时间分桶的数据 */
    buckets: AnomalyTimeBucket[];
    /** 面板标题 */
    title?: string;
    /** 图表高度 px */
    height?: number;
    /** 最大显示桶数 */
    maxBuckets?: number;
    /** 加载中 */
    loading?: boolean;
    /** 空状态文本 */
    emptyText?: string;
    /** 测试 ID */
    'data-testid'?: string;
}
/**
 * AnomalyFrequencyTimeline — 异常时序频率图
 * 以堆叠条形图展示各时间段内不同严重程度异常的分布频率。
 */
declare function AnomalyFrequencyTimeline({ buckets, title, height, maxBuckets, loading, emptyText, 'data-testid': dataTestId, }: AnomalyFrequencyTimelineProps): React__default.JSX.Element;

/** 识别出的异常模式类别 */
type AnomalyPatternType = 'periodic_spike' | 'time_correlated' | 'cascading' | 'silent_failure' | 'threshold_drift' | 'resource_exhaustion';
type PatternSeverity = 'critical' | 'high' | 'medium' | 'low';
/** 单条识别出的异常模式 */
interface AnomalyPattern {
    /** 模式唯一 ID */
    id: string;
    /** 模式类型 */
    patternType: AnomalyPatternType;
    /** 模式名称 */
    name: string;
    /** 模式描述 */
    description: string;
    /** 严重程度 */
    severity: PatternSeverity;
    /** 影响实体数量 */
    affectedCount: number;
    /** 置信度 0-100 */
    confidence: number;
    /** 首次发现时间 */
    firstDetected: string;
    /** 最近触发时间 */
    lastTriggered: string;
    /** 触发次数 */
    triggerCount: number;
    /** 建议操作 */
    suggestion?: string;
}
interface AnomalyPatternPanelProps {
    /** 识别出的异常模式列表 */
    patterns: AnomalyPattern[];
    /** 面板标题 */
    title?: string;
    /** 是否正在加载 */
    loading?: boolean;
    /** 空状态文案 */
    emptyLabel?: string;
    /** 点击建议操作回调 */
    onApplySuggestion?: (pattern: AnomalyPattern) => void;
    /** 点击查看详情回调 */
    onViewDetail?: (pattern: AnomalyPattern) => void;
}
declare function AnomalyPatternPanel({ patterns, title, loading, emptyLabel, onApplySuggestion, onViewDetail, }: AnomalyPatternPanelProps): React__default.JSX.Element;

/** 排班约束类型 */
type SchedulingConstraintType = 'max_weekly_hours' | 'min_rest_hours' | 'preferred_shift' | 'skill_requirement' | 'max_consecutive_days';
/** 排班约束 */
interface SchedulingConstraint {
    type: SchedulingConstraintType;
    label: string;
    value: number | string;
    active: boolean;
}
/** 员工排班偏好 */
interface StaffPreference {
    staffId: string;
    staffName: string;
    /** 员工等级 / 技能标签 */
    skills: string[];
    /** 可用工时(周) */
    availableWeeklyHours: number;
    /** 偏好班次: morning/afternoon/night */
    preferredShift: 'morning' | 'afternoon' | 'night' | 'flexible';
    /** 已排天数 */
    scheduledDays?: number;
    /** 头像颜色 */
    avatarColor?: string;
}
/** 排班时间段 */
interface ScheduleSlot {
    date: string;
    shiftName: string;
    startTime: string;
    endTime: string;
    requiredStaff: number;
    assignedStaff: string[];
}
/** AI 推荐结果 */
interface SchedulingRecommendation {
    date: string;
    shiftName: string;
    startTime: string;
    endTime: string;
    recommendedStaff: string[];
    confidenceScore: number;
    /** 替代人选 */
    alternates?: string[];
    /** 推荐依据 */
    rationale?: string;
}
/** AI 智能排班面板 Props */
interface AISmartSchedulingPanelProps {
    /** 员工列表 */
    staff: StaffPreference[];
    /** 待排班时间段 */
    slots: ScheduleSlot[];
    /** AI 推荐结果 */
    recommendations?: SchedulingRecommendation[];
    /** 面板标题 */
    title?: string;
    /** 正在生成中 */
    isGenerating?: boolean;
    /** 约束条件 */
    constraints?: SchedulingConstraint[];
    /** 生成排班回调 */
    onGenerate?: () => void;
    /** 应用推荐回调 */
    onApplyRecommendation?: (rec: SchedulingRecommendation) => void;
    /** 批量应用所有推荐 */
    onApplyAll?: (recs: SchedulingRecommendation[]) => void;
    /** 修改约束回调 */
    onToggleConstraint?: (type: SchedulingConstraintType) => void;
    /** 自定义类名 */
    className?: string;
}
declare function AISmartSchedulingPanel({ staff, slots, recommendations, title, isGenerating, constraints: initialConstraints, onGenerate, onApplyRecommendation, onApplyAll, onToggleConstraint, className, }: AISmartSchedulingPanelProps): React__default.JSX.Element;

/** 策略参数类型 */
type StrategyParamType = 'number' | 'string' | 'boolean' | 'select' | 'tags';
/** 策略参数选项 */
interface StrategyParamOption {
    label: string;
    value: string;
}
/** 策略参数定义 */
interface StrategyParamDef {
    /** 参数 key */
    key: string;
    /** 参数名称 */
    name: string;
    /** 参数描述 */
    description?: string;
    /** 参数类型 */
    type: StrategyParamType;
    /** 默认值 */
    defaultValue: string | number | boolean | string[];
    /** 当前值（编辑时） */
    value?: string | number | boolean | string[];
    /** select/tags 的可选值 */
    options?: StrategyParamOption[];
    /** 数值范围（type=number） */
    min?: number;
    max?: number;
    step?: number;
    /** 是否必填 */
    required?: boolean;
    /** 占位符 */
    placeholder?: string;
    /** 校验正则 */
    pattern?: string;
    /** 校验提示 */
    patternMessage?: string;
}
/** 策略规则条件 */
interface StrategyCondition {
    /** 条件 ID */
    id: string;
    /** 条件字段 */
    field: string;
    /** 运算符 */
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
    /** 条件值 */
    value: string | number;
    /** 关联值（between 时第二个值） */
    value2?: string | number;
}
/** 策略定义 */
interface StrategyConfig {
    /** 策略 ID */
    id: string;
    /** 策略名称 */
    name: string;
    /** 策略描述 */
    description?: string;
    /** 策略分类 */
    category?: string;
    /** 是否启用 */
    enabled: boolean;
    /** 优先级（1-100，越高越优先） */
    priority: number;
    /** 参数配置 */
    params: StrategyParamDef[];
    /** 触发条件 */
    conditions?: StrategyCondition[];
    /** 标签 */
    tags?: string[];
    /** 最后修改时间 */
    updatedAt?: string;
}
/** 策略配置面板 Props */
interface StrategyConfigPanelProps {
    /** 当前策略配置 */
    strategy: StrategyConfig;
    /** 面板标题 */
    title?: string;
    /** 策略分类选项 */
    categoryOptions?: StrategyParamOption[];
    /** 保存回调 */
    onSave?: (config: StrategyConfig) => void;
    /** 重置回调 */
    onReset?: (config: StrategyConfig) => void;
    /** 启用/禁用回调 */
    onToggle?: (id: string, enabled: boolean) => void;
    /** 自定义类名 */
    className?: string;
    /** 是否只读模式 */
    readOnly?: boolean;
    /** 是否加载中 */
    loading?: boolean;
    /** 保存提示文案 */
    saveLabel?: string;
    /** 重置提示文案 */
    resetLabel?: string;
}
/**
 * StrategyConfigPanel — AI 策略配置面板。
 *
 * 用于可视化的策略参数编辑、条件配置、启用/禁用切换。
 * 适用于智能规则策略、风控策略、推荐策略等场景的运营配置。
 *
 * @example
 * // 基础用法
 * <StrategyConfigPanel
 *   strategy={{
 *     id: 'strategy-1',
 *     name: '价格异常检测策略',
 *     enabled: true,
 *     priority: 75,
 *     params: [
 *       { key: 'price_threshold', name: '价格波动阈值', type: 'number', defaultValue: 20, min: 0, max: 100 },
 *       { key: 'auto_fix', name: '自动修正', type: 'boolean', defaultValue: false },
 *     ],
 *   }}
 *   onSave={(s) => console.log('save', s)}
 * />
 *
 * @example
 * // 只读模式
 * <StrategyConfigPanel strategy={strategy} readOnly />
 */
declare function StrategyConfigPanel({ strategy: initialStrategy, title, categoryOptions, onSave, onReset, onToggle, className, readOnly, loading, saveLabel, resetLabel, }: StrategyConfigPanelProps): React__default.JSX.Element;

interface ComparisonItem {
    /** 分类名称 */
    label: string;
    /** 数值 */
    value: number;
    /** 可选的基准值（用于双柱对比） */
    baseline?: number;
    /** 柱状颜色（默认使用主题色） */
    color?: string;
}
interface ComparisonBreakdownChartProps {
    /** 对比数据 */
    data: ComparisonItem[];
    /** 图表标题 */
    title?: string;
    /** 是否显示数值标签（默认 true） */
    showValues?: boolean;
    /** 是否显示基准柱（默认 true） */
    showBaseline?: boolean;
    /** 主柱颜色（默认 #3b82f6） */
    barColor?: string;
    /** 基准柱颜色（默认 #d1d5db） */
    baselineColor?: string;
    /** 高度 px（默认 240） */
    height?: number;
    /** 加载态 */
    loading?: boolean;
    /** 空态文案 */
    emptyText?: string;
    /** 自定义类名 */
    className?: string;
    'data-testid'?: string;
}
/**
 * ComparisonBreakdownChart — 横向对比柱状图
 * 用于 AI 面板中展示分类对比/占⽐分析，支持双柱对比（主值 vs 基准值）。
 */
declare function ComparisonBreakdownChart({ data, title, showValues, showBaseline, barColor, baselineColor, height, loading, emptyText, className, 'data-testid': dataTestId, }: ComparisonBreakdownChartProps): React__default.JSX.Element;

interface ScenarioMetric {
    /** 指标名称 */
    label: string;
    /** 当前值 */
    value: number;
    /** 单位（如 '元', '%', '件'） */
    unit?: string;
    /** 趋势方向 good | bad | neutral */
    trend?: 'good' | 'bad' | 'neutral';
    /** 变化量 */
    delta?: number;
}
interface ScenarioItem {
    /** 场景名称 */
    name: string;
    /** 场景描述 */
    description?: string;
    /** 场景指标列表 */
    metrics: ScenarioMetric[];
    /** 得分（满分 100） */
    score?: number;
    /** 颜色标识 */
    color?: string;
    /** 是否推荐 */
    recommended?: boolean;
}
interface ScenarioComparisonPanelProps {
    /** 待比较的场景列表 */
    scenarios: ScenarioItem[];
    /** 面板标题 */
    title?: string;
    /** 加载态 */
    loading?: boolean;
    /** 空态文案 */
    emptyText?: string;
    /** 自定义类名 */
    className?: string;
    'data-testid'?: string;
}
/**
 * ScenarioComparisonPanel — 场景对比面板
 * 用于 AI 决策场景中对比不同方案的指标、得分，辅助选择最优方案。
 */
declare function ScenarioComparisonPanel({ scenarios, title, loading, emptyText, className, 'data-testid': dataTestId, }: ScenarioComparisonPanelProps): React__default.JSX.Element;

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline' | 'label';
type TextColor = 'default' | 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'danger' | 'inherit';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
type TextAlign = 'left' | 'center' | 'right';
type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
interface TypographyProps {
    variant?: TextVariant;
    color?: TextColor;
    weight?: TextWeight;
    align?: TextAlign;
    transform?: TextTransform;
    truncate?: boolean;
    as?: keyof JSX.IntrinsicElements;
    children: React__default.ReactNode;
    className?: string;
    style?: React__default.CSSProperties;
    id?: string;
}
declare const Typography: React__default.FC<TypographyProps>;
declare const Heading: React__default.FC<Omit<TypographyProps, 'variant'> & {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
}>;
declare const Text: React__default.FC<Omit<TypographyProps, 'variant'>>;
declare const Paragraph: React__default.FC<Omit<TypographyProps, 'variant'>>;
declare const Caption: React__default.FC<Omit<TypographyProps, 'variant'>>;

/**
 * Phase-32: SSE 连接状态徽章 (4 状态可视化)
 *
 * - connecting: 灰色 "🔄 连接中..."
 * - open: 绿色 "✓ 已连接" (3 秒后自动隐藏)
 * - reconnecting: 黄色 "🔄 重连中... (2/3)"
 * - closed: 红色 "❌ 连接已断开 [重试]" (带按钮)
 *
 * 通过 props `state` 控制,不耦合具体 stream 逻辑
 * 通过 `attempt` 显示当前重试次数 (用于 reconnecting 状态)
 * 通过 `onRetry` 触发手动重试 (用于 closed 状态)
 */
type ReconnectingState = 'connecting' | 'open' | 'reconnecting' | 'closed';
interface ReconnectingBadgeProps {
    state: ReconnectingState;
    /** 当前重试次数 (1-based),用于 reconnecting 状态显示 */
    attempt?: number;
    /** 最大重试次数,默认 3 */
    maxRetries?: number;
    /** 手动重试回调 (closed 状态显示按钮) */
    onRetry?: () => void;
    /** open 状态自动隐藏延迟 ms,默认 3000 */
    autoHideMs?: number;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
}
declare function ReconnectingBadge({ state, attempt, maxRetries, onRetry, autoHideMs, style }: ReconnectingBadgeProps): React__default.JSX.Element | null;

/** 今日服务指标 */
interface GuideDailyMetrics {
    /** 接待人次 */
    guestCount: number;
    /** 游玩时长 (分钟) */
    avgPlayDuration: number;
    /** 满意度评分 (1-5) */
    satisfactionScore: number;
    /** 引导转化 (引导办卡/充值) */
    conversionCount: number;
    /** 同比变化 */
    guestTrend: number;
    durationTrend: number;
    satisfactionTrend: number;
    conversionTrend: number;
}
/** 当前接待任务 */
interface GuestTask {
    id: string;
    /** 客人年龄组: 儿童/青少年/成人/家庭 */
    guestType: 'child' | 'teen' | 'adult' | 'family';
    /** 客人数量 */
    guestCount: number;
    /** 游玩区域 / 项目 */
    area: string;
    /** 状态 */
    status: 'accompanying' | 'waiting' | 'completed';
    /** 开始时间 */
    startedAt: string;
    /** 备注 */
    note?: string;
}
/** 游玩区域状态 */
interface AreaStatus {
    id: string;
    name: string;
    /** 当前游客数 */
    currentGuests: number;
    /** 最大容量 */
    capacity: number;
    /** 排队人数 */
    queueLength: number;
    /** 是否需要清洁/维护 */
    needsMaintenance: boolean;
    /** 设备运行状态 */
    deviceOnline: boolean;
}
/** 道具/玩具借用 */
interface PropRental {
    id: string;
    propName: string;
    borrowedAt: string;
    expectedReturnAt: string;
    guestName: string;
    status: 'active' | 'overdue' | 'returned';
}
/** 导玩员工作台 Props */
interface EntertainmentGuideDashboardProps {
    /** 今日服务指标 */
    dailyMetrics?: GuideDailyMetrics;
    /** 当前接待任务 */
    guestTasks?: GuestTask[];
    /** 区域状态 */
    areaStatuses?: AreaStatus[];
    /** 道具借用 */
    propRentals?: PropRental[];
    /** 导玩员姓名 */
    guideName?: string;
    /** 当班区域 */
    assignedArea?: string;
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
 * EntertainmentGuideDashboard — 导玩员工作台
 *
 * 聚合导玩员日常所需的核心服务指标、接待任务、区域状态与道具管理。
 * 适用于室内儿童乐园 / 游乐场等场景的导玩员角色。
 *
 * @example
 * <EntertainmentGuideDashboard
 *   guideName="王小明"
 *   assignedArea="淘气堡区"
 *   dailyMetrics={{ guestCount: 68, avgPlayDuration: 42, satisfactionScore: 4.8, conversionCount: 5, guestTrend: 12.3, durationTrend: -2.1, satisfactionTrend: 0.3, conversionTrend: 25.0 }}
 *   guestTasks={[{ id: '1', guestType: 'family', guestCount: 3, area: '淘气堡', status: 'accompanying', startedAt: '10:30' }]}
 * />
 */
declare function EntertainmentGuideDashboard({ dailyMetrics, guestTasks, areaStatuses, propRentals, guideName, assignedArea, lastSyncAt, loading, compact, className, }: EntertainmentGuideDashboardProps): React__default.JSX.Element;

interface QuickAction {
    id: string;
    label: string;
    icon?: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    disabled?: boolean;
    loading?: boolean;
    shortcut?: string;
    onClick: () => void;
}
interface QuickActionBarProps {
    title?: string;
    actions: QuickAction[];
    role?: string;
    className?: string;
    columns?: 2 | 3 | 4 | 5;
    /** Show as floating bar at bottom instead of inline */
    floating?: boolean;
}
declare function QuickActionBar({ title, actions, role, className, columns, floating, }: QuickActionBarProps): React__default.JSX.Element;

/** 活动效果指标 */
interface CampaignMetric {
    label: string;
    value: string;
    unit?: string;
    trend?: 'up' | 'down' | 'flat';
    delta?: string;
    color?: string;
}
/** 活动数据点（趋势图用） */
interface CampaignDataPoint {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
}
/** AI 活动建议 */
interface CampaignInsight {
    type: 'positive' | 'negative' | 'info' | 'warning';
    message: string;
    recommendation?: string;
}
/** 活动性能面板 Props */
interface CampaignPerformancePanelProps {
    /** 活动名称 */
    campaignName: string;
    /** 活动状态 */
    status: 'active' | 'scheduled' | 'ended' | 'draft';
    /** 核心指标 */
    metrics: CampaignMetric[];
    /** 趋势数据 */
    trendData?: CampaignDataPoint[];
    /** AI 洞察/建议 */
    insights?: CampaignInsight[];
    /** 加载中 */
    loading?: boolean;
    /** 空状态文案 */
    emptyText?: string;
    /** 类名 */
    className?: string;
    /** 测试 ID */
    'data-testid'?: string;
}
/**
 * CampaignPerformancePanel — AI 增强型活动效果分析面板
 *
 * 展示活动核心指标、转化趋势、AI 洞察建议。
 * 适用于 店长工作台/营销面板/活动详情页。
 */
declare function CampaignPerformancePanel({ campaignName, status, metrics, trendData, insights, loading, emptyText, className, 'data-testid': dataTestId, }: CampaignPerformancePanelProps): React__default.JSX.Element;

/** 单个预测数据点 */
interface CampaignTrendForecastPoint {
    date: string;
    predicted: number;
    lowerBound: number;
    upperBound: number;
}
/** 历史数据点 */
interface CampaignTrendHistoricalPoint {
    date: string;
    actual: number;
}
/** 模型元信息 */
interface CampaignTrendModelInfo {
    modelName: string;
    accuracy: number;
    confidence: 'high' | 'medium' | 'low';
}
/** 影响因子 */
interface CampaignTrendImpactFactor {
    factor: string;
    direction: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
}
/** 趋势预报面板 Props */
interface CampaignTrendForecastProps {
    /** 指标标题（如"销售额预测"） */
    title: string;
    /** 指标单位 */
    unit?: string;
    /** 历史数据 */
    historical: CampaignTrendHistoricalPoint[];
    /** 预测数据 */
    forecast: CampaignTrendForecastPoint[];
    /** AI 模型信息 */
    modelInfo?: CampaignTrendModelInfo;
    /** 影响因子 */
    impactFactors?: CampaignTrendImpactFactor[];
    /** 数据上次更新时间 */
    updatedAt?: string;
    /** AI 结论 */
    aiConclusion?: string;
    /** 加载状态 */
    loading?: boolean;
    /** 空状态文案 */
    emptyText?: string;
    /** 错误状态 */
    error?: string;
    /** 类名 */
    className?: string;
}
declare function CampaignTrendForecast({ title, unit, historical, forecast, modelInfo, impactFactors, updatedAt, aiConclusion, loading, emptyText, error, className, }: CampaignTrendForecastProps): React__default.JSX.Element;

type DiffSeverity = 'critical' | 'major' | 'minor' | 'info';
interface ReconciliationDiff {
    id: string;
    /** 业务主体，如订单号、流水号 */
    refId: string;
    /** 来源系统 */
    sourceSystem: string;
    /** 目标系统 */
    targetSystem: string;
    /** 源系统值 */
    sourceValue: string | number;
    /** 目标系统值 */
    targetValue: string | number;
    /** 差异绝对值 */
    diffAmount: number;
    /** 差异字段名 */
    field: string;
    /** 严重级别 */
    severity: DiffSeverity;
    /** 差异说明 */
    description?: string;
    /** 发生时间 */
    occurredAt: string;
    /** 是否已处理 */
    resolved: boolean;
}
interface ReconciliationDiffPanelProps {
    /** 差异数据列表 */
    diffs: ReconciliationDiff[];
    /** 标题 */
    title?: string;
    /** 开启自动刷新指示 */
    loading?: boolean;
    /** 单条标记已处理的回调 */
    onResolve?: (id: string) => void;
    /** 查看差异详情回调 */
    onViewDetail?: (diff: ReconciliationDiff) => void;
    /** 导出回调 */
    onExport?: () => void;
}
declare function ReconciliationDiffPanel({ diffs, title, loading, onResolve, onViewDetail, onExport, }: ReconciliationDiffPanelProps): React__default.JSX.Element;

type ResultStatus = 'success' | 'error' | 'info' | 'warning' | '403' | '404' | '500';
interface ResultProps {
    status?: ResultStatus;
    title?: string;
    subTitle?: string;
    icon?: React__default.ReactNode;
    extra?: React__default.ReactNode;
    children?: React__default.ReactNode;
}
declare function Result({ status, title, subTitle, icon, extra, children, }: ResultProps): React__default.JSX.Element;

interface RevenueSnapshot {
    /** 当前营收 */
    currentRevenue: number;
    /** 目标营收 */
    targetRevenue: number;
    /** 完成百分比 */
    completionPercent: number;
    /** 同比变化百分比 */
    yoyPercent: number;
    /** 环比变化百分比 */
    momPercent: number;
    /** 交易笔数 */
    transactionCount: number;
    /** 客单价 */
    avgOrderValue: number;
    /** 在线订单数 */
    onlineOrders: number;
    /** 线下订单数 */
    offlineOrders: number;
    /** 峰值并发 */
    peakConcurrent: number;
    /** 当前收银台在线数 */
    activeRegisters: number;
}
interface RevenueTrendPoint {
    /** 标签（"10:00" / "06-27"） */
    label: string;
    /** 营收额 */
    revenue: number;
    /** 订单量 */
    orders: number;
}
interface RevenueByCategory {
    category: string;
    amount: number;
    percent: number;
    color?: string;
}
interface RealTimeRevenueDisplayProps {
    /** 快照数据 */
    snapshot: RevenueSnapshot;
    /** 时段趋势（最近 24 小时或今日逐时） */
    hourlyTrend: RevenueTrendPoint[];
    /** 品类分布 */
    categoryRevenue: RevenueByCategory[];
    /** 门店名称 */
    storeName?: string;
    /** 最后更新时间 */
    lastUpdate?: string;
    /** 刷新间隔标记 */
    isLive?: boolean;
    className?: string;
}
declare function RealTimeRevenueDisplay({ snapshot, hourlyTrend, categoryRevenue, storeName, lastUpdate, isLive, className, }: RealTimeRevenueDisplayProps): React__default.JSX.Element;

/** 今日接待指标 */
interface CoachDailyMetrics {
    /** 接待人次 */
    servedCount: number;
    /** 新增会员 */
    newMembers: number;
    /** 推广转化数 (裂变/分享) */
    promoConversions: number;
    /** 跟进回访数 */
    followUps: number;
    /** 同比变化 */
    servedTrend: number;
    memberTrend: number;
    promoTrend: number;
    followUpTrend: number;
}
/** 待跟进会员 */
interface FollowUpMember {
    id: string;
    name: string;
    /** 会员等级 */
    tier: string;
    /** 上次互动时间 */
    lastContactAt: string;
    /** 跟进状态 */
    status: 'pending' | 'contacted' | 'converted' | 'lost';
    /** 跟进事项 */
    note?: string;
    phone?: string;
}
/** 推广活动任务 */
interface PromoTask {
    id: string;
    title: string;
    /** 活动类型 */
    type: 'share' | 'referral' | 'event' | 'coupon';
    /** 目标 */
    target: number;
    /** 已完成 */
    completed: number;
    deadline: string;
}
/** 教练工作台 Props */
interface CoachDashboardProps {
    /** 今日接待指标 */
    dailyMetrics?: CoachDailyMetrics;
    /** 待跟进会员 */
    followUpMembers?: FollowUpMember[];
    /** 推广任务 */
    promoTasks?: PromoTask[];
    /** 教练姓名 */
    coachName?: string;
    /** 门店名称 */
    storeName?: string;
    /** 工号 */
    employeeId?: string;
    /** 本月业绩排名 */
    rank?: {
        current: number;
        total: number;
    };
    /** 最后同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 (移动/PAD 适配) */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
}
/**
 * CoachDashboard — 教练工作台 (导玩员)
 *
 * 面向 PAD 端教练角色，聚合会员接待、推广转化与跟进任务。
 * 适用于娱乐场馆 / 电玩城 / 运动场馆的导玩员日常运营。
 *
 * @example
 * <CoachDashboard
 *   coachName="张教练"
 *   storeName="朝阳旗舰店"
 *   dailyMetrics={{ servedCount: 68, newMembers: 12, promoConversions: 23, followUps: 8, servedTrend: 5.2, memberTrend: 8.0, promoTrend: 12.3, followUpTrend: -2.1 }}
 *   followUpMembers={[{ id: '1', name: '王小明', tier: 'GOLD', lastContactAt: '06-25', status: 'pending' }]}
 *   promoTasks={[{ id: 'p1', title: '扫码分享有礼', type: 'share', target: 50, completed: 32, deadline: '06-30' }]}
 *   rank={{ current: 3, total: 12 }}
 * />
 */
declare function CoachDashboard({ dailyMetrics, followUpMembers, promoTasks, coachName, storeName, employeeId, rank, lastSyncAt, loading, compact, className, }: CoachDashboardProps): React__default.JSX.Element;

type OTPInputSize = 'sm' | 'md' | 'lg';
type OTPInputVariant = 'outlined' | 'filled' | 'underlined';
interface OTPInputProps {
    /** 验证码长度 (默认 6) */
    length?: number;
    /** 当前值 */
    value: string;
    /** 值变更回调 */
    onChange: (value: string) => void;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否只读 */
    readOnly?: boolean;
    /** 错误状态 */
    error?: boolean;
    /** 尺寸 */
    size?: OTPInputSize;
    /** 变体 */
    variant?: OTPInputVariant;
    /** 自动聚焦 */
    autoFocus?: boolean;
    /** 完成输入回调 (所有格填满时) */
    onComplete?: (value: string) => void;
    /** 额外类名 */
    className?: string;
    /** 占位符字符 */
    placeholder?: string;
    /** input 类型: text / tel / number */
    inputMode?: 'text' | 'numeric' | 'tel';
    /** aria-label */
    label?: string;
}
declare const OTPInput: React__default.FC<OTPInputProps>;

type QRCodeType = 'payment' | 'membership' | 'miniapp' | 'coupon' | 'generic';
interface QRCodeDisplayProps {
    /** QR code value (URL, payload string) */
    value: string;
    /** Visual type label */
    type?: QRCodeType;
    /** Human-readable description shown below the QR */
    label?: string;
    /** Title displayed above the QR image */
    title?: string;
    /** Width/height of the QR image area in px */
    size?: number;
    /** Callback fired after the QR is successfully copied */
    onCopy?: () => void;
    /** Callback fired on refresh / regenerate */
    onRefresh?: () => void;
    /** Whether the QR has expired (shows overlay) */
    expired?: boolean;
    /** Custom image source – defaults to a data-uri or external QR generator URL */
    src?: string;
    /** Extra CSS class */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
declare const QRCodeDisplay: React__default.FC<QRCodeDisplayProps>;

type HandoverCategory = 'cash' | 'order' | 'member' | 'inventory' | 'device' | 'other';
interface ShiftHandoverEntry {
    id: string;
    category: HandoverCategory;
    title: string;
    description: string;
    status: 'pending' | 'resolved' | 'escalated';
    createdBy: string;
    createdAt: string;
    handoverTo?: string;
    resolvedAt?: string;
    notes?: string;
}
interface ShiftSummary {
    totalItems: number;
    pendingCount: number;
    resolvedCount: number;
    escalatedCount: number;
    cashTotal: number;
    orderTotal: number;
    shiftStart: string;
    shiftEnd: string;
    currentStaff: string;
    incomingStaff: string;
}
interface ShiftHandoverPanelProps {
    summary: ShiftSummary;
    items: ShiftHandoverEntry[];
    onResolveItem: (id: string) => void;
    onEscalateItem: (id: string) => void;
    onStartHandover: () => void;
    onEditNotes: (id: string, notes: string) => void;
    loading?: boolean;
}
declare const ShiftHandoverPanel: React__default.FC<ShiftHandoverPanelProps>;

interface SegmentedOption {
    value: string;
    label: string;
    icon?: React__default.ReactNode;
    disabled?: boolean;
}
interface SegmentedControlProps {
    /** 选项列表 */
    options: SegmentedOption[];
    /** 当前选中值 */
    value?: string;
    /** 默认选中值 (非受控) */
    defaultValue?: string;
    /** 选中回调 */
    onChange?: (value: string) => void;
    /** 尺寸 */
    size?: 'sm' | 'md' | 'lg';
    /** 是否填充父容器宽度 */
    fullWidth?: boolean;
    /** 禁用状态 */
    disabled?: boolean;
    /** 自定义样式 */
    className?: string;
    style?: React__default.CSSProperties;
    /** ARIA label */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * SegmentedControl — 分段控件/按钮组。
 *
 * 提供互斥选项切换，支持图标、受控/非受控、多尺寸。
 * 适用于视图切换、筛选切换等场景。
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   options={[
 *     { value: 'day', label: '日' },
 *     { value: 'week', label: '周' },
 *     { value: 'month', label: '月' },
 *   ]}
 *   defaultValue="week"
 *   onChange={(v) => console.log(v)}
 * />
 * ```
 */
declare function SegmentedControl({ options, value: controlledValue, defaultValue, onChange, size, fullWidth, disabled, className, style, 'aria-label': ariaLabel, 'data-testid': dataTestId, }: SegmentedControlProps): React__default.JSX.Element;

interface TransferItem {
    key: string;
    label: string;
    description?: string;
    disabled?: boolean;
}
interface TransferProps {
    /** All available items */
    dataSource: TransferItem[];
    /** Keys of selected / target items */
    targetKeys: string[];
    /** Called when target keys change */
    onChange?: (targetKeys: string[], direction: 'left' | 'right', moveKeys: string[]) => void;
    /** Left / source panel title */
    leftTitle?: string;
    /** Right / target panel title */
    rightTitle?: string;
    /** Custom render for each item */
    render?: (item: TransferItem) => React__default.ReactNode;
    /** Whether to show search */
    showSearch?: boolean;
    /** Placeholder for search input */
    searchPlaceholder?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Custom class name */
    className?: string;
    /** Custom style */
    style?: React__default.CSSProperties;
    /** Height of each list box */
    listHeight?: number;
}
declare const Transfer: React__default.FC<TransferProps>;

interface MasonryProps {
    /** Items to render in the masonry layout */
    children: React__default.ReactNode;
    /** Number of columns — responsive by breakpoint map or single number (default 3) */
    columns?: number | {
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    /** Gap between items in px (default 16) */
    gap?: number;
    /** Minimum column width in px (when using responsive columns) */
    minColumnWidth?: number;
    /** CSS class name */
    className?: string;
    /** Inline style */
    style?: React__default.CSSProperties;
    /** Test id */
    'data-testid'?: string;
}
/**
 * Masonry — a CSS-columns-based waterfall layout.
 *
 * Renders children into equal-width columns, automatically stacking them
 * by available height. Supports responsive column counts.
 *
 * @example
 * ```tsx
 * <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap={16}>
 *   {items.map(item => <Card key={item.id}>{item.content}</Card>)}
 * </Masonry>
 * ```
 */
declare function Masonry({ children, columns, gap, minColumnWidth: _minColumnWidth, className, style, 'data-testid': dataTestId, }: MasonryProps): React__default.JSX.Element;
interface WaterfallMasonryProps extends Omit<MasonryProps, 'columns'> {
    /** Column count (number only for JS-based waterfall) */
    columns?: number;
    /** Whether to animate position changes (default false) */
    animated?: boolean;
}
/**
 * WaterfallMasonry — JavaScript-driven waterfall (Pinterest-style) layout.
 *
 * Places each item into the shortest column, producing a tight waterfall effect.
 * Useful when item heights are known upfront (e.g., from an API).
 */
declare function WaterfallMasonry({ children, columns, gap, className, style, animated, 'data-testid': dataTestId, }: WaterfallMasonryProps): React__default.JSX.Element;

/** 底部导航项 */
interface BottomNavItem {
    /** 唯一标识 */
    id: string;
    /** 显示标签 */
    label: string;
    /** 图标字符 (emoji/icon 文本) */
    icon?: string;
    /** 是否当前活跃 */
    active?: boolean;
    /** 徽章数量 */
    badge?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 点击回调 */
    onClick: () => void;
}
interface BottomNavigationProps {
    /** 导航项列表 */
    items: BottomNavItem[];
    /** 底部安全区适配 (iOS 刘海屏等) */
    safeArea?: boolean;
    /** 自定义 className */
    className?: string;
    /** 主题色变体 */
    variant?: BottomNavVariant;
    /** 是否显示标签文字 */
    showLabels?: boolean;
    /** 是否有顶部边框分割线 */
    bordered?: boolean;
}
type BottomNavVariant = 'default' | 'frosted' | 'dark';
declare function BottomNavigation({ items, safeArea, className, variant, showLabels, bordered, }: BottomNavigationProps): React__default.JSX.Element;

interface CollapsibleProps {
    /** 标题内容 */
    title: React__default.ReactNode;
    /** 子内容 */
    children: React__default.ReactNode;
    /** 是否默认展开 */
    defaultOpen?: boolean;
    /** 受控展开状态 */
    open?: boolean;
    /** 展开/折叠回调 */
    onOpenChange?: (open: boolean) => void;
    /** 标题右侧额外操作区 */
    extra?: React__default.ReactNode;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 展开/折叠动画时长(ms)，0 表示无动画 */
    animationDuration?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义展开图标，默认 ▲/▼ */
    expandIcon?: React__default.ReactNode;
    /** 是否隐藏展开图标 */
    hideExpandIcon?: boolean;
}
/**
 * Collapsible — 可折叠内容面板
 *
 * 支持受控/非受控模式、动画过渡、标题额外操作区。
 */
declare const Collapsible: React__default.FC<CollapsibleProps>;

interface CountUpProps {
    /** 目标数值 */
    end: number;
    /** 起始数值，默认 0 */
    start?: number;
    /** 动画时长（毫秒），默认 1000 */
    duration?: number;
    /** 小数位数，默认 0 */
    decimals?: number;
    /** 数字前缀 */
    prefix?: string;
    /** 数字后缀 */
    suffix?: string;
    /** 千分位分隔符，默认 ',' */
    separator?: string;
    /** 是否自动开始动画，默认 true */
    autoStart?: boolean;
    /** 是否在可见时才触发动画（使用 IntersectionObserver） */
    enableScrollTrigger?: boolean;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 自定义 className */
    className?: string;
    /** 动画完成回调 */
    onEnd?: () => void;
    /** 格式化函数，覆盖默认格式化 */
    formatter?: (value: number) => string;
    /** 测试 id */
    'data-testid'?: string;
}
declare function CountUp({ end, start, duration, decimals, prefix, suffix, separator, autoStart, enableScrollTrigger, style, className, onEnd, formatter, 'data-testid': dataTestId, }: CountUpProps): React__default.JSX.Element;

type CountdownStatus = 'running' | 'paused' | 'finished';
interface CountdownProps {
    /** 剩余秒数 */
    seconds: number;
    /** 倒计时结束回调 */
    onFinish?: () => void;
    /** 每秒回调（当前剩余秒数） */
    onTick?: (remaining: number) => void;
    /** 是否自动开始 (默认 true) */
    autoStart?: boolean;
    /** 自定义格式函数 (默认 mm:ss) */
    format?: (remaining: number) => string;
    /** 自定义类名 */
    className?: string;
    /** 文字颜色 */
    color?: string;
    /** 数字样式 */
    digitStyle?: React__default.CSSProperties;
    /** 加载态 */
    loading?: boolean;
    /** 测试 id */
    'data-testid'?: string;
}
declare const Countdown: React__default.FC<CountdownProps>;
declare function useCountdown(initialSeconds?: number): {
    remaining: number;
    status: CountdownStatus;
    start: (seconds?: number) => void;
    pause: () => void;
    reset: (seconds?: number) => void;
};

interface ToggleOption {
    value: string;
    label: React__default.ReactNode;
    disabled?: boolean;
    icon?: React__default.ReactNode;
}
type ToggleGroupVariant = 'outline' | 'filled' | 'underline';
type ToggleGroupSize = 'sm' | 'md' | 'lg';
interface ToggleGroupProps {
    /** Controlled selected value(s) */
    value?: string | string[];
    /** Default selected value(s) */
    defaultValue?: string | string[];
    /** Allow multiple selections */
    multiple?: boolean;
    /** Options to display */
    options: ToggleOption[];
    /** Callback when selection changes */
    onChange?: (value: string | string[]) => void;
    /** Visual variant */
    variant?: ToggleGroupVariant;
    /** Size */
    size?: ToggleGroupSize;
    /** Disable entire group */
    disabled?: boolean;
    /** Label for the group (aria-label) */
    label?: string;
    /** Additional CSS class */
    className?: string;
    /** Inline style */
    style?: React__default.CSSProperties;
    /** Orientation */
    orientation?: 'horizontal' | 'vertical';
}
interface ToggleButtonProps {
    value: string;
    children?: React__default.ReactNode;
    disabled?: boolean;
    icon?: React__default.ReactNode;
    className?: string;
    style?: React__default.CSSProperties;
}
declare const ToggleButton: React__default.FC<ToggleButtonProps>;
declare const ToggleGroup: React__default.FC<ToggleGroupProps> & {
    Button: typeof ToggleButton;
};

/** 库房概览指标 */
interface WarehouseMetrics {
    /** 总 SKU 数量 */
    totalSku: number;
    /** 在库总件数 */
    totalStock: number;
    /** 今日入库单数量 */
    todayInbound: number;
    /** 今日出库单数量 */
    todayOutbound: number;
    /** 库存金额 (元) */
    stockValue: number;
    /** 低库存预警数量 */
    lowStockCount: number;
    /** 过期预警数量 */
    expiryWarningCount: number;
    /** 库位利用率 (0-1) */
    locationUtilization: number;
}
/** 库存预警项 */
interface StockAlert {
    id: string;
    sku: string;
    name: string;
    category: string;
    currentQty: number;
    minQty: number;
    status: 'low_stock' | 'overstock' | 'expiring' | 'expired';
    updatedAt: string;
    location: string;
}
/** 入库待处理单 */
interface InboundTask {
    id: string;
    orderNo: string;
    supplier: string;
    skuCount: number;
    totalQty: number;
    status: 'pending' | 'inspecting' | 'shelving' | 'completed';
    createdAt: string;
    expectedAt?: string;
    operator?: string;
}
/** 出库待处理单 */
interface OutboundTask {
    id: string;
    orderNo: string;
    destination: string;
    skuCount: number;
    totalQty: number;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'picking' | 'packing' | 'shipped';
    createdAt: string;
    deadline?: string;
}
/** 快速操作 */
interface KeeperQuickAction {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick?: () => void;
}
/** 仓库管理员工作台 Props */
interface InventoryKeeperDashboardProps {
    /** 库房名称 */
    warehouseName?: string;
    /** 库房概览指标 */
    metrics?: WarehouseMetrics;
    /** 库存预警列表 */
    stockAlerts?: StockAlert[];
    /** 入库待处理单 */
    inboundTasks?: InboundTask[];
    /** 出库待处理单 */
    outboundTasks?: OutboundTask[];
    /** 快速操作 */
    quickActions?: KeeperQuickAction[];
    /** 加载状态 */
    loading?: boolean;
    /** 错误信息 */
    error?: string;
}
declare function InventoryKeeperDashboard({ warehouseName, metrics, stockAlerts, inboundTasks, outboundTasks, quickActions, loading, error, }: InventoryKeeperDashboardProps): React__default.JSX.Element;

/** 收银员状态 */
type CashierStatus = 'active' | 'break' | 'offline';
/** 班次类型 */
type ShiftType = 'morning' | 'afternoon' | 'full_day';
/** 班次信息 */
interface ShiftInfo {
    /** 班次类型 */
    type: ShiftType;
    /** 开始时间 */
    startAt: string;
    /** 结束时间 (预计) */
    endAt: string;
    /** 时长 (小时) */
    duration: number;
}
/** 收银当班统计 */
interface CashierShiftMetrics {
    /** 当班收银单数 */
    transactionCount: number;
    /** 当班收款总额 */
    totalRevenue: number;
    /** 现金收款 */
    cashAmount: number;
    /** 移动支付收款 */
    mobileAmount: number;
    /** 现金交班应缴 */
    expectedCashRemit: number;
    /** 找零开支 */
    changeFloatUsed: number;
    /** 刷单/退款次数 */
    refundCount: number;
    /** 退款总额 */
    refundTotal: number;
}
/** 当前班次操作记录 */
interface TransactionLog {
    id: string;
    /** 流水号 */
    receiptNo: string;
    /** 时间 */
    time: string;
    /** 类型: sale收款, refund退款, void作废 */
    type: 'sale' | 'refund' | 'void';
    /** 金额 */
    amount: number;
    /** 支付方式 */
    payment: string;
    /** 会员名(可选) */
    memberName?: string;
}
/** 收银终端状态 */
interface TillStatus {
    /** 终端编号 */
    tillNo: string;
    /** 系统版本 */
    version: string;
    /** 打印机 */
    printerOnline: boolean;
    /** 钱箱 */
    cashDrawerOpen: boolean;
    /** 扫码枪 */
    scannerOnline: boolean;
    /** 网络 */
    networkOnline: boolean;
    /** 收银员名称 */
    cashierName?: string;
}
/** 收银面板 Props */
interface CashierPanelProps {
    /** 面板标题 */
    title?: string;
    /** 收银员名称 */
    cashierName?: string;
    /** 收银员状态 */
    cashierStatus?: CashierStatus;
    /** 班次信息 */
    shiftInfo?: ShiftInfo;
    /** 收银当班统计 */
    metrics?: CashierShiftMetrics;
    /** 操作记录 */
    transactions?: TransactionLog[];
    /** 终端状态 */
    tillStatus?: TillStatus;
    /** 加载中 */
    loading?: boolean;
    /** 错误 */
    error?: string;
    /** 上班打卡回调 */
    onClockIn?: () => void;
    /** 交班回调 */
    onShiftHandover?: () => void;
    /** 退款回调 */
    onRefund?: (receiptNo: string) => void;
    /** 打印小票回调 */
    onPrint?: (receiptNo: string) => void;
    /** 自定义类名 */
    className?: string;
}
/**
 * CashierPanel — 收银员工作面板
 *
 * 收银员每日工作台 - 班次管理、交班核算、终端监控。
 * 与 FrontDeskPanel（面向顾客的收银/购物篮）不同，
 * CashierPanel 面向收银员自身的排班、日结、设备状态。
 *
 * @example
 * <CashierPanel
 *   title="收银员面板"
 *   cashierName="张丽"
 *   cashierStatus="active"
 *   shiftInfo={{ type: 'morning', startAt: '08:00', endAt: '14:00', duration: 6 }}
 *   metrics={{
 *     transactionCount: 87,
 *     totalRevenue: 28650,
 *     cashAmount: 12300,
 *     mobileAmount: 16350,
 *     expectedCashRemit: 12000,
 *     changeFloatUsed: 300,
 *     refundCount: 2,
 *     refundTotal: 598,
 *   }}
 *   tillStatus={{
 *     tillNo: 'POS-01',
 *     version: 'v3.2.1',
 *     printerOnline: true,
 *     cashDrawerOpen: false,
 *     scannerOnline: true,
 *     networkOnline: true,
 *   }}
 * />
 */
declare function CashierPanel({ title, cashierName, cashierStatus, shiftInfo, metrics, transactions, tillStatus, loading, error, onClockIn, onShiftHandover, onRefund, onPrint, className, }: CashierPanelProps): React__default.JSX.Element;

/** 顾客画像 */
interface CustomerProfile {
    id: string;
    name: string;
    phone: string;
    memberTier: string;
    totalSpent: number;
    visitCount: number;
    lastVisit: string;
    preferences: string[];
    tags: string[];
}
/** 推荐商品 */
interface RecommendedProduct {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image?: string;
    reason: string;
    stock: number;
}
/** 今日业绩 */
interface DailyPerformance {
    customersServed: number;
    totalSales: number;
    conversionRate: number;
    avgSpend: number;
}
/** 导购提醒 */
interface GuideAlert {
    id: string;
    type: 'birthday' | 'follow_up' | 'restock' | 'vip_visit';
    message: string;
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
}
interface SalesGuideToolProps {
    /** 导购员姓名 */
    guideName: string;
    /** 今日业绩 */
    performance?: DailyPerformance;
    /** 当前顾客画像 */
    currentCustomer?: CustomerProfile | null;
    /** 推荐商品列表 */
    recommendations?: RecommendedProduct[];
    /** 提醒列表 */
    alerts?: GuideAlert[];
    /** 是否加载中 */
    loading?: boolean;
    /** 错误信息 */
    error?: string | null;
    /** 选择顾客回调 */
    onSelectCustomer?: (customerId: string) => void;
    /** 推荐商品点击回调 */
    onRecommendProduct?: (productId: string) => void;
    /** 提醒点击回调 */
    onAlertClick?: (alertId: string) => void;
}
declare function SalesGuideTool({ guideName, performance, currentCustomer, recommendations, alerts, loading, error, onSelectCustomer, onRecommendProduct, onAlertClick, }: SalesGuideToolProps): React__default.JSX.Element;

/** 退换货类型 */
type ReturnType = 'refund' | 'exchange' | 'repair';
/** 退换货状态 */
type ReturnStatus = 'pending_review' | 'approved' | 'rejected' | 'return_received' | 'refund_issued' | 'replacement_sent' | 'closed';
/** 商品明细条目 */
interface ReturnItem {
    /** SKU */
    sku: string;
    /** 商品名 */
    name: string;
    /** 规格 */
    spec: string;
    /** 购买数量 */
    purchasedQty: number;
    /** 退货数量 */
    returnQty: number;
    /** 单价 (分) */
    unitPrice: number;
    /** 是否有瑕疵/损坏 */
    defective: boolean;
    /** 退换货原因 */
    reason: string;
}
/** 退换货申请单 */
interface ReturnRequest {
    /** 退换单号 */
    id: string;
    /** 关联订单号 */
    orderNo: string;
    /** 客户姓名 */
    customerName: string;
    /** 客户电话 */
    customerPhone: string;
    /** 会员等级 */
    memberTier?: string;
    /** 退换货类型 */
    returnType: ReturnType;
    /** 状态 */
    status: ReturnStatus;
    /** 申请时间 */
    appliedAt: string;
    /** 处理人 */
    handler?: string;
    /** 处理备注 */
    remark?: string;
    /** 商品列表 */
    items: ReturnItem[];
    /** 退款金额 (分) */
    refundAmount: number;
    /** 换货金额 (分) — 如换更贵商品需补差价 */
    exchangeExtra?: number;
}
/** 面板配置 */
interface ReturnGoodsPanelConfig {
    /** 标题 */
    title?: string;
    /** 是否只读 */
    readOnly?: boolean;
    /** 允许的退换货操作 */
    allowedActions?: Array<'approve' | 'reject' | 'receive' | 'issue_refund' | 'send_replacement' | 'close'>;
}
/** 组件总 Props */
interface ReturnGoodsPanelProps {
    /** 退换货申请列表 */
    requests: ReturnRequest[];
    /** 面板配置 */
    config?: ReturnGoodsPanelConfig;
    /** 操作回调 */
    callbacks?: ReturnGoodsPanelCallbacks;
}
/** 操作回调 */
interface ReturnGoodsPanelCallbacks {
    /** 状态流转回调 */
    onStatusChange?: (requestId: string, newStatus: ReturnStatus, remark?: string) => void;
}

declare function ReturnGoodsProcessingPanel({ requests, config: { title, readOnly, allowedActions }, callbacks, }: ReturnGoodsPanelProps): React__default.ReactElement;

/** 优惠券/卡券类型 */
type CouponType = 'discount' | 'cash_voucher' | 'product_free' | 'shipping_free';
/** 优惠券状态 */
type CouponStatus = 'active' | 'used' | 'expired' | 'frozen';
/** 单张优惠券 */
interface CouponEntry {
    /** 券号 */
    code: string;
    /** 券类型 */
    type: CouponType;
    /** 券名称 */
    name: string;
    /** 面额/折扣描述 */
    value: string;
    /** 门槛描述 */
    threshold?: string;
    /** 状态 */
    status: CouponStatus;
    /** 有效期: 领取时间 */
    issuedAt: string;
    /** 有效期: 截止时间 */
    expiresAt: string;
}
/** 兑换请求 */
interface RedemptionRequest {
    /** 券码 */
    code: string;
    /** 当前订单金额 */
    orderAmount: number;
}
/** 兑换结果 */
interface RedemptionResult {
    /** 是否成功 */
    success: boolean;
    /** 优惠券信息 */
    coupon?: CouponEntry;
    /** 优惠金额 */
    discountAmount?: number;
    /** 折扣后金额 */
    finalAmount?: number;
    /** 失败原因 */
    errorMessage?: string;
    /** 处理时间 */
    processedAt: string;
}
/** 兑换汇总 */
interface RedemptionSummary {
    /** 今日兑换次数 */
    todayCount: number;
    /** 今日优惠总额 */
    todayDiscountTotal: number;
    /** 可用券数 */
    availableCount: number;
    /** 即将过期券数(48h内) */
    expiringSoonCount: number;
}
interface CouponRedemptionPanelProps {
    /** 优惠券列表 */
    coupons: CouponEntry[];
    /** 兑换汇总 */
    summary: RedemptionSummary;
    /** 最近兑换结果 */
    lastResult?: RedemptionResult;
    /** 兑换额度检查 */
    orderAmount: number;
    /** 是否加载中 */
    loading?: boolean;
    /** 错误信息 */
    error?: string;
    /** 输入框 placeholder */
    inputPlaceholder?: string;
    /** 兑换按钮文字 */
    redeemButtonText?: string;
    /** 输入框值 */
    inputValue?: string;
    /** 输入框变更回调 */
    onInputChange?: (value: string) => void;
    /** 兑换回调 */
    onRedeem?: (code: string) => void;
    /** 重新加载 */
    onRetry?: () => void;
}
declare const CouponRedemptionPanel: React__default.FC<CouponRedemptionPanelProps>;

/**
 * Phase-34: ViewModelProvider (前端三层防御的最外层)
 *
 * 设计:
 * - React Context 注入 tenantId + userId
 * - useViewModel() / useTenantId() / useUserId() 三个 hook
 * - setTenantId 切换租户时, 触发 re-render, 自动失效旧 view-model 数据
 * - 未包裹 Provider 时抛错 (防绕过)
 *
 * data-testid:
 * - view-model-provider
 * - tenant-id-display
 * - user-id-display
 */
interface ViewModel {
    tenantId: string;
    userId: string;
}
interface ViewModelContextValue extends ViewModel {
    setTenantId: (tenantId: string) => void;
    setUserId: (userId: string) => void;
}
interface ViewModelProviderProps {
    initialTenantId: string;
    initialUserId: string;
    children: React__default.ReactNode;
}
declare function ViewModelProvider({ initialTenantId, initialUserId, children }: ViewModelProviderProps): React__default.JSX.Element;
declare function useViewModel(): ViewModelContextValue;
declare function useTenantId(): string;
declare function useUserId(): string;

interface SpeedDialAction {
    /** 操作唯一标识 */
    key: string;
    /** 显示标签 */
    label: string;
    /** 图标 (emoji 或 SVG 字符串) */
    icon: string;
    /** 点击回调 */
    onClick: () => void;
    /** 是否危险操作（红色高亮） */
    danger?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
}
interface SpeedDialProps {
    /** 主按钮图标 */
    icon?: string;
    /** 操作列表 */
    actions: SpeedDialAction[];
    /** 展开方向：上/下/左/右，默认 up */
    direction?: 'up' | 'down' | 'left' | 'right';
    /** 按钮大小，默认 md */
    size?: 'sm' | 'md' | 'lg';
    /** 距离底部/顶部偏移 (px)，默认 24 */
    offset?: number;
    /** 距离右侧偏移 (px)，默认 24 */
    offsetRight?: number;
    /** 是否固定在右下角，默认 true */
    fixed?: boolean;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 自定义类名 */
    className?: string;
}
declare function SpeedDial({ icon, actions, direction, size, offset, offsetRight, fixed, style, className, }: SpeedDialProps): React__default.JSX.Element;

interface SortableItem {
    id: string;
    label: string;
    description?: string;
    disabled?: boolean;
}
interface SortableListProps {
    /** Items in current order */
    items: SortableItem[];
    /** Called when order changes */
    onReorder: (items: SortableItem[]) => void;
    /** Optional custom renderer for each item */
    renderItem?: (item: SortableItem, index: number) => React__default.ReactNode;
    /** Disable drag sorting entirely */
    disabled?: boolean;
    /** CSS class name */
    className?: string;
    /** Accessible label for the list */
    ariaLabel?: string;
}
/**
 * A keyboard- and mouse-accessible sortable list.
 * Users can drag items by their handle, or use Arrow Up / Arrow Down
 * when an item is focused.
 */
declare const SortableList: React__default.FC<SortableListProps>;

type NumberFormatType = 'decimal' | 'integer' | 'currency' | 'percent' | 'compact';
type NumberFormatSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
interface NumberFormatProps {
    /** 数值 */
    value: number | null | undefined;
    /** 格式化类型 */
    type?: NumberFormatType;
    /** 小数位数（默认按类型自动） */
    decimals?: number;
    /** 货币符号 */
    currencySymbol?: string;
    /** 字号 */
    size?: NumberFormatSize;
    /** 颜色 */
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted';
    /** 前缀文字 */
    prefix?: string;
    /** 后缀文字 */
    suffix?: string;
    /** 是否显示正负号 */
    signDisplay?: 'auto' | 'always' | 'never';
    /** null/undefined 时的占位文字 */
    placeholder?: string;
    /** 高亮变化方向（正值上升/负值下降分别着色） */
    colorizeTrend?: boolean;
    /** 自定义 class */
    className?: string;
    style?: React__default.CSSProperties;
}
declare const NumberFormat: React__default.FC<NumberFormatProps>;
declare const Currency: React__default.FC<Omit<NumberFormatProps, 'type'>>;
declare const Percent: React__default.FC<Omit<NumberFormatProps, 'type'>>;
declare const Compact: React__default.FC<Omit<NumberFormatProps, 'type'>>;

interface SparklineDataPoint {
    value: number;
    label?: string;
}
interface SparklineChartProps {
    /** Data points for the sparkline */
    data: SparklineDataPoint[];
    /** Width of the SVG */
    width?: number;
    /** Height of the SVG */
    height?: number;
    /** Line color */
    color?: string;
    /** Fill color (area under curve); set to '' for no fill */
    fillColor?: string;
    /** Stroke width */
    strokeWidth?: number;
    /** Show dots at data points */
    showDots?: boolean;
    /** Dot radius */
    dotRadius?: number;
    /** Smooth curve (cubic bezier) instead of straight lines */
    smooth?: boolean;
    /** Minimum value (computed from data if omitted) */
    min?: number;
    /** Maximum value (computed from data if omitted) */
    max?: number;
    /** Custom class name */
    className?: string;
    /** Accessibility label */
    'aria-label'?: string;
    /** Highlight the last point with a different color */
    highlightLast?: boolean;
    /** Color for the highlighted last point */
    highlightColor?: string;
}
declare function SparklineChart({ data, width, height, color, fillColor, strokeWidth, showDots, dotRadius, smooth, min: forcedMin, max: forcedMax, className, 'aria-label': ariaLabel, highlightLast, highlightColor, }: SparklineChartProps): React__default.JSX.Element;

interface ConfirmActionDialogProps {
    /** 是否可见 */
    open: boolean;
    /** 标题 */
    title: string;
    /** 描述内容 */
    message: string;
    /** 确认按钮文本 */
    confirmLabel?: string;
    /** 取消按钮文本 */
    cancelLabel?: string;
    /** 确认按钮 variant */
    confirmVariant?: 'primary' | 'danger';
    /** 是否处于加载中（防重复提交） */
    loading?: boolean;
    /** 点击确认回调 */
    onConfirm: () => void;
    /** 点击取消 / 关闭回调 */
    onCancel: () => void;
}
/**
 * ConfirmActionDialog — 通用确认操作弹窗
 *
 * 用于删除确认、状态变更确认、高危操作二次确认等场景。
 * 支持加载态防重复提交。
 */
declare function ConfirmActionDialog({ open, title, message, confirmLabel, cancelLabel, confirmVariant, loading, onConfirm, onCancel, }: ConfirmActionDialogProps): React__default.JSX.Element;

/** 预测置信区间 */
interface ConfidenceInterval {
    lowerBound: number;
    upperBound: number;
    confidenceLevel: number;
}
/** 单个预测数据点 */
interface PredictionPoint {
    label: string;
    predictedValue: number;
    actualValue?: number;
    confidenceInterval?: ConfidenceInterval;
    trend?: 'up' | 'down' | 'stable';
    anomalyScore?: number;
}
/** 预测分析摘要 */
interface PredictionSummary {
    /** 最高置信度预测 */
    bestPrediction: string;
    /** 预测趋势 */
    overallTrend: 'up' | 'down' | 'stable';
    /** 变化百分比 */
    changePercent: number;
    /** 风险等级 */
    riskLevel: 'low' | 'medium' | 'high';
    /** AI 建议 */
    recommendation?: string;
}
/** 预测分析面板属性 */
interface PredictionAnalysisPanelProps {
    /** 标题 */
    title?: string;
    /** 预测数据点列表 */
    predictions: PredictionPoint[];
    /** 预测摘要 */
    summary?: PredictionSummary;
    /** 加载状态 */
    loading?: boolean;
    /** 错误状态 */
    error?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 自定义类名 */
    className?: string;
    /** 指标单位 */
    unit?: string;
}
declare const PredictionAnalysisPanel: React__default.FC<PredictionAnalysisPanelProps>;

interface ScrollToTopProps {
    /** Scroll threshold in px before the button appears. Default: 300 */
    threshold?: number;
    /** Scroll behavior: 'smooth' (default) or 'auto' */
    behavior?: ScrollBehavior;
    /** Position from bottom in px. Default: 32 */
    bottom?: number;
    /** Position from right in px. Default: 32 */
    right?: number;
    /** Button size in px. Default: 40 */
    size?: number;
    /** Background color. Default: #3b82f6 (blue-500) */
    backgroundColor?: string;
    /** Icon color. Default: #ffffff */
    iconColor?: string;
    /** Hover background color. Default: #2563eb (blue-600) */
    hoverBackgroundColor?: string;
    /** ARIA label */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style override */
    style?: React__default.CSSProperties;
    /** Custom icon element. Default: upward arrow */
    icon?: React__default.ReactNode;
}
/**
 * ScrollToTop — floating button that appears after the user scrolls past a threshold.
 *
 * Smoothly scrolls the window to the top when clicked.
 */
declare function ScrollToTop({ threshold, behavior, bottom, right, size, backgroundColor, iconColor, hoverBackgroundColor, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, icon, }: ScrollToTopProps): React__default.JSX.Element | null;

/** 指标趋势方向 */
type MetricTrend = 'up' | 'down' | 'flat';
/** 计算/预测模式 */
type MetricMode = 'actual' | 'predicted' | 'target';
/** 单个指标目标定义 */
interface MetricGoal {
    /** 指标 ID */
    id: string;
    /** 指标名称 */
    label: string;
    /** 当前实际值 */
    actual: number;
    /** 目标值 */
    target: number;
    /** 预测值（可选） */
    predicted?: number;
    /** 单位 */
    unit: string;
    /** 趋势方向 */
    trend: MetricTrend;
    /** 环比变化百分比 */
    changePercent: number;
    /** 指标类别 */
    category: 'revenue' | 'member' | 'operation' | 'sales' | 'service';
    /** 图标 emoji */
    icon?: string;
    /** 是否为主要指标 */
    primary?: boolean;
}
/** 面板属性 */
interface AIMetricGoalPanelProps {
    /** 指标目标数据列表 */
    goals: MetricGoal[];
    /** 面板标题 */
    title?: string;
    /** 加载状态 */
    loading?: boolean;
    /** 统计周期描述 */
    period?: string;
    /** 空状态提示 */
    emptyText?: string;
}
declare function AIMetricGoalPanel({ goals, title, loading, period, emptyText, }: AIMetricGoalPanelProps): React__default.JSX.Element;

/** 模型性能指标 */
interface ModelPerformanceMetric {
    /** 指标标识 */
    key: string;
    /** 指标名称 */
    label: string;
    /** 当前值 */
    value: number;
    /** 单位 */
    unit: string;
    /** 趋势: 上升/下降/持平 */
    trend?: 'up' | 'down' | 'flat';
    /** 变化百分比 */
    changePct?: number;
    /** 是否正向指标（上升好/下降好） */
    positiveDirection?: 'up' | 'down';
    /** 警告阈值 */
    warnThreshold?: number;
    /** 危险阈值 */
    dangerThreshold?: number;
}
/** 单个模型数据 */
interface ModelPerformanceData {
    /** 模型 ID */
    modelId: string;
    /** 模型名称 */
    modelName: string;
    /** 模型版本 */
    version: string;
    /** 供应商 */
    provider: string;
    /** 性能指标列表 */
    metrics: ModelPerformanceMetric[];
    /** 最近24小时请求数 */
    requestCount24h: number;
    /** 在线状态 */
    status: 'online' | 'degraded' | 'offline';
    /** 最后更新时间 */
    lastUpdated: string;
}
/** 面板属性 */
interface AIModelPerformancePanelProps {
    /** 模型数据列表 */
    models: ModelPerformanceData[];
    /** 面板标题 */
    title?: string;
    /** 加载状态 */
    loading?: boolean;
    /** 空状态提示 */
    emptyText?: string;
    /** 点击模型回调 */
    onModelClick?: (model: ModelPerformanceData) => void;
    className?: string;
    style?: React__default.CSSProperties;
}
declare function AIModelPerformancePanel({ models, title, loading, emptyText, onModelClick, className, style, }: AIModelPerformancePanelProps): React__default.JSX.Element;

interface NavMenuItem {
    /** Unique key */
    key: string;
    /** Display label */
    label: string;
    /** Optional href */
    href?: string;
    /** Optional icon element */
    icon?: React__default.ReactNode;
    /** Nested items for dropdown sub-menus */
    children?: NavMenuItem[];
    /** Disabled state */
    disabled?: boolean;
    /** Optional badge count */
    badge?: number;
}
interface NavigationMenuProps {
    /** Ordered list of top-level navigation items */
    items: NavMenuItem[];
    /** Currently active item key */
    activeKey: string;
    /** Click/select handler */
    onSelect: (key: string, item: NavMenuItem) => void;
    /** Orientation */
    orientation?: 'horizontal' | 'vertical';
    /** ARIA label */
    'aria-label'?: string;
    /** Additional class name */
    className?: string;
    /** Styling variant */
    variant?: 'default' | 'pills' | 'underline';
    /** Test id */
    'data-testid'?: string;
}
declare function NavigationMenu({ items, activeKey, onSelect, orientation, 'aria-label': ariaLabel, className, variant, 'data-testid': dataTestId, }: NavigationMenuProps): React__default.JSX.Element | null;

type HoverCardPlacement = 'top' | 'bottom' | 'left' | 'right';
interface HoverCardProps {
    /** 触发元素 */
    children: React__default.ReactNode;
    /** 卡片内容 */
    content: React__default.ReactNode;
    /** 浮层方向 */
    placement?: HoverCardPlacement;
    /** 显示延迟 (ms) */
    openDelay?: number;
    /** 隐藏延迟 (ms) */
    closeDelay?: number;
    /** 卡片最大宽度 */
    maxWidth?: number;
    /** 卡片最大高度 */
    maxHeight?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 内容区域样式 */
    contentStyle?: React__default.CSSProperties;
}
declare function HoverCard({ children, content, placement, openDelay, closeDelay, maxWidth, maxHeight, disabled, className, style, contentStyle, }: HoverCardProps): React__default.ReactElement;

type AnnouncementSeverity = 'info' | 'success' | 'warning' | 'error' | 'promotion';
type AnnouncementVariant = 'banner' | 'bar' | 'ribbon';
interface AnnouncementBannerAction {
    label: string;
    onClick: () => void;
    href?: string;
}
interface AnnouncementBannerProps {
    /** 公告内容 */
    message: React__default.ReactNode;
    /** 严重级别 */
    severity?: AnnouncementSeverity;
    /** 视觉变体 */
    variant?: AnnouncementVariant;
    /** 是否可关闭 */
    closable?: boolean;
    /** 是否默认可见 */
    defaultVisible?: boolean;
    /** 操作按钮 */
    action?: AnnouncementBannerAction;
    /** 图标 (覆盖默认) */
    icon?: React__default.ReactNode;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 关闭回调 */
    onClose?: () => void;
    /** 自定义类名 */
    className?: string;
}
declare function AnnouncementBanner({ message, severity, variant, closable, defaultVisible, action, icon, style, onClose, className, }: AnnouncementBannerProps): React__default.JSX.Element | null;

/** 时间轴节点状态 */
type TimelineNodeStatus = 'success' | 'failure' | 'warning' | 'skipped' | 'running';
/** 决策事件节点 */
interface DecisionEvent {
    /** 事件唯一 ID */
    id: string;
    /** 事件时间戳 */
    timestamp: string;
    /** 事件标题 */
    title: string;
    /** 事件描述 */
    description?: string;
    /** 事件状态 */
    status: TimelineNodeStatus;
    /** 关联规则数 */
    ruleCount?: number;
    /** 通过规则数 */
    passedCount?: number;
    /** 失败规则数 */
    failedCount?: number;
    /** 操作人 */
    operator?: string;
    /** 操作说明 */
    actionLabel?: string;
    /** 自定义详情节点回调 */
    renderDetail?: () => React__default.ReactNode;
}
/** AI 决策时间线 Props */
interface AIDecisionTimelineProps {
    /** 决策事件列表 */
    events: DecisionEvent[];
    /** 面板标题 */
    title?: string;
    /** 面板副标题 */
    subtitle?: string;
    /** 最多显示条数(超出折叠) */
    maxVisible?: number;
    /** 空状态文案 */
    emptyText?: string;
    /** 自定义类名 */
    className?: string;
    /** 事件点击回调 */
    onEventClick?: (event: DecisionEvent) => void;
}
/**
 * AIDecisionTimeline — AI 决策执行历史时间线。
 *
 * 以纵轴时间线展示 AI 决策历史事件，包括：
 * - 时间线节点 + 状态着色连线
 * - 操作记录（时间/操作人/动作标签）
 * - 规则统计（规则数/通过数/失败数）
 * - 最大条数折叠功能
 * - 事件点击交互
 *
 * @example
 * <AIDecisionTimeline
 *   title="决策执行记录"
 *   events={[
 *     {
 *       id: '1',
 *       timestamp: '2026-06-30 14:22',
 *       title: '库存异常规则触发',
 *       description: '3个SKU库存为负数，触发自动补货流程',
 *       status: 'warning',
 *       ruleCount: 12,
 *       passedCount: 9,
 *       failedCount: 3,
 *       operator: 'system',
 *       actionLabel: '自动触发',
 *     },
 *     {
 *       id: '2',
 *       timestamp: '2026-06-30 13:50',
 *       title: '价格合规检查完成',
 *       description: '全量价格检查完成，未发现异常',
 *       status: 'success',
 *       ruleCount: 8,
 *       passedCount: 8,
 *       operator: 'admin',
 *       actionLabel: '手动执行',
 *     },
 *   ]}
 *   maxVisible={10}
 *   onEventClick={(e) => console.log(e.id)}
 * />
 */
declare function AIDecisionTimeline({ events, title, subtitle, maxVisible, emptyText, className, onEventClick, }: AIDecisionTimelineProps): React__default.JSX.Element;

/** 顾客会话状态 */
type SessionStatus = 'active' | 'waiting' | 'checking' | 'completed' | 'cancelled';
/** 顾客信息 */
interface CustomerInfo {
    id: string;
    name: string;
    phone?: string;
    memberLevel?: string;
    avatar?: string;
    visitCount: number;
    lastVisitAt?: string;
    tags?: string[];
}
/** 服务项 */
interface ServiceItem {
    id: string;
    name: string;
    duration: number;
    price: number;
    assignedTo?: string;
}
/** 会话操作按钮 */
interface SessionAction {
    id: string;
    label: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    icon?: string;
    disabled?: boolean;
}
/** 顾客会话面板属性 */
interface CustomerSessionPanelProps {
    /** 当前顾客 */
    customer: CustomerInfo;
    /** 会话状态 */
    status: SessionStatus;
    /** 排队人数 (仅 waiting 状态) */
    queueLength?: number;
    /** 已选服务列表 */
    selectedServices?: ServiceItem[];
    /** 预计等待时间 (分钟) */
    estimatedWaitMin?: number;
    /** 开始服务时间 (ISO) */
    startedAt?: string;
    /** 操作按钮列表 */
    actions: SessionAction[];
    /** 操作点击回调 */
    onAction: (actionId: string) => void;
    /** 添加服务回调 */
    onAddService?: () => void;
    /** 移除服务回调 */
    onRemoveService?: (serviceId: string) => void;
    /** 备注 */
    notes?: string;
    /** 备注变更回调 */
    onNotesChange?: (notes: string) => void;
    /** 自定义类名 */
    className?: string;
}
declare function CustomerSessionPanel({ customer, status, queueLength, selectedServices, estimatedWaitMin, startedAt, actions, onAction, onAddService, onRemoveService, notes, onNotesChange, className, }: CustomerSessionPanelProps): React__default.JSX.Element;

interface DiagnosisFinding {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    description: string;
    rootCause: string;
    impact: string;
    recommendation: string;
    timestamp: string;
    owner?: string;
    resolved?: boolean;
}
interface AnomalyDiagnosisReportProps {
    /** 诊断报告标题 */
    title?: string;
    /** 诊断发现的异常项列表 */
    findings: DiagnosisFinding[];
    /** 是否正在加载 */
    loading?: boolean;
    /** 处理异常回调 */
    onHandleFinding?: (findingId: string) => void;
    /** 忽略异常回调 */
    onDismissFinding?: (findingId: string) => void;
    /** 全量刷新回调 */
    onRefresh?: () => void;
    /** 导出报告回调 */
    onExport?: () => void;
    /** 自定义类名 */
    className?: string;
}
declare function AnomalyDiagnosisReport({ title, findings, loading, onHandleFinding, onDismissFinding, onRefresh, onExport, className, }: AnomalyDiagnosisReportProps): React__default.JSX.Element;

/** 调拨单状态 */
type TransferStatus = 'draft' | 'pending_approval' | 'approved' | 'shipping' | 'completed' | 'rejected' | 'cancelled';
/** 调拨单 */
interface TransferOrder {
    /** 调拨单号 */
    id: string;
    /** 调出门店 */
    sourceStore: string;
    /** 调入门店 */
    targetStore: string;
    /** SKU 数量 */
    skuCount: number;
    /** 总件数 */
    totalQty: number;
    /** 调拨金额 (元) */
    amount: number;
    /** 状态 */
    status: TransferStatus;
    /** 申请人 */
    requester: string;
    /** 审核人 */
    approver?: string;
    /** 创建时间 */
    createdAt: string;
    /** 完成时间 */
    completedAt?: string;
    /** 备注 */
    remark?: string;
}
/** 调拨单面板属性 */
interface StoreTransferOrderPanelProps {
    /** 调拨单列表 */
    orders?: TransferOrder[];
    /** 加载中 */
    loading?: boolean;
    /** 门店名称（调出方可选列表） */
    storeOptions?: string[];
    /** 新增调拨回调 */
    onCreateTransfer?: () => void;
    /** 查看详情回调 */
    onViewDetail?: (orderId: string) => void;
    /** 取消调拨回调 */
    onCancelTransfer?: (orderId: string) => void;
}
declare function StoreTransferOrderPanel({ orders, loading, storeOptions, onCreateTransfer, onViewDetail, onCancelTransfer, }: StoreTransferOrderPanelProps): React__default.JSX.Element;

/**
 * MemberActivityCard — 会员活动卡片组件
 *
 * 用于展示会员的最近活动记录，如消费、充值、积分变动等。
 * 支持多种活动类型、自定义图标和交互回调。
 *
 * Pattern: 纯展示组件，无外部依赖，支持 .test.tsx 测试
 */

type ActivityType = 'purchase' | 'recharge' | 'redeem' | 'visit' | 'review' | 'register' | 'upgrade' | 'referral';
interface MemberActivity {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    amount?: number;
    points?: number;
    createdAt: string;
    metadata?: Record<string, string>;
}
interface MemberActivityCardProps {
    activity: MemberActivity;
    onClick?: (activity: MemberActivity) => void;
    compact?: boolean;
    className?: string;
    style?: React__default.CSSProperties;
}
declare function MemberActivityCard({ activity, onClick, compact, className, style, }: MemberActivityCardProps): React__default.JSX.Element;

type SpaceDirection = 'horizontal' | 'vertical';
type SpaceSize = 'small' | 'middle' | 'large' | number;
interface SpaceProps extends React__default.HTMLAttributes<HTMLDivElement> {
    /** 排列方向：horizontal（水平）/ vertical（垂直），默认为 horizontal */
    direction?: SpaceDirection;
    /** 间距大小：small=8 / middle=16 / large=24 或自定义数值（单位 px），默认为 small */
    size?: SpaceSize;
    /** 是否自动换行（仅 horizontal 生效） */
    wrap?: boolean;
    /** 水平对齐方式 */
    align?: 'start' | 'end' | 'center' | 'baseline';
    /** 垂直对齐方式（flex 容器的 justify-content） */
    justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
}
declare const Space: React__default.FC<SpaceProps>;

interface InfoCardItem {
    /** 标签/字段名 */
    label: string;
    /** 值 */
    value: React__default.ReactNode;
    /** 可选颜色变体 */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    /** Tooltip 提示 */
    tooltip?: string;
}
interface InfoCardProps {
    /** 标题 */
    title?: string;
    /** 数据条目列表 */
    items: InfoCardItem[];
    /** 布局方向 */
    layout?: 'vertical' | 'horizontal';
    /** 列数 (仅 vertical 有效) */
    columns?: 1 | 2 | 3 | 4;
    /** 卡片变体 */
    variant?: 'default' | 'elevated' | 'compact';
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 自定义类名 */
    className?: string;
    /** 测试 id */
    'data-testid'?: string;
}
/**
 * InfoCard — a reusable key-value info display card.
 *
 * Renders a titled card containing a list of label/value pairs,
 * supporting multi-column grid, horizontal layout, and color variants.
 */
declare function InfoCard({ title, items, layout, columns, variant, style, className, 'data-testid': dataTestId, }: InfoCardProps): React__default.JSX.Element;

interface EmptyProps {
    /** 空状态描述文案 */
    description?: string;
    /** 自定义空状态图标 */
    image?: React__default.ReactNode;
    /** 额外的操作区域（按钮等） */
    children?: React__default.ReactNode;
    /** 外层容器样式 */
    style?: React__default.CSSProperties;
    /** 外层容器类名 */
    className?: string;
}
declare const Empty: React__default.FC<EmptyProps>;

interface DecisionComparisonItem {
    /** 决策唯一标识 */
    id: string;
    /** 规则/策略名称 */
    ruleName: string;
    /** 决策类别 */
    category: 'pricing' | 'inventory' | 'promotion' | 'allocation' | 'recommendation';
    /** 置信度 0-1 */
    confidence: number;
    /** 执行状态 */
    status: 'success' | 'failure' | 'rejected';
    /** 推荐值（数值摘要） */
    recommendedValue: string;
    /** 原始值（执行前） */
    originalValue: string;
    /** 预期提升百分比 */
    expectedLiftPct: number;
    /** 实际提升百分比（null=尚未采集） */
    actualLiftPct: number | null;
    /** 偏差分数 */
    deviationScore: number | null;
    /** 执行时间 */
    executedAt: string;
    /** 是否被采纳 */
    adopted: boolean;
    /** 触发方式 */
    trigger: 'manual' | 'cron' | 'event';
}
interface AIDecisionComparisonPanelProps {
    /** 对比数据列表 */
    items: DecisionComparisonItem[];
    /** 排序方式 */
    sort?: 'confidence' | 'deviation' | 'lift-gap' | 'time';
    /** 类别筛选 */
    categoryFilter?: DecisionComparisonItem['category'] | 'all';
    /** 状态筛选 */
    statusFilter?: DecisionComparisonItem['status'] | 'all';
    /** 采纳筛选 */
    adoptedFilter?: 'all' | 'adopted' | 'not-adopted';
    /** 点击详情回调 */
    onItemClick?: (item: DecisionComparisonItem) => void;
    /** 点击采纳/取消采纳回调 */
    onToggleAdopt?: (item: DecisionComparisonItem) => void;
}
declare function AIDecisionComparisonPanel({ items, sort, categoryFilter, statusFilter, adoptedFilter, onItemClick, onToggleAdopt, }: AIDecisionComparisonPanelProps): React__default.JSX.Element;

/**
 * ResourceOptimizationPanel · T403-3 AI 资源优化建议面板
 * 用途: 展示门店资源(人力/设备/库存)的AI优化建议，含收益预估
 * 关联: P3-8 智能资源分配 / P4-5 运营效率提升
 */
interface ResourceOptimizationSuggestion {
    id: string;
    category: 'STAFF' | 'EQUIPMENT' | 'INVENTORY';
    title: string;
    description: string;
    estimatedBenefit: string;
    effortLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    priority: number;
}
interface ResourceOptimizationPanelProps {
    suggestions: ResourceOptimizationSuggestion[];
    isLoading?: boolean;
}
declare function ResourceOptimizationPanel({ suggestions, isLoading, }: ResourceOptimizationPanelProps): React__default.JSX.Element;

interface MentionOption {
    /** 唯一标识 */
    id: string;
    /** 显示名称 */
    label: string;
    /** 匹配关键词（默认同 label） */
    keyword?: string;
    /** 头像/图标 */
    avatar?: React__default.ReactNode;
    /** 副标题 */
    subtitle?: string;
    /** 是否禁用 */
    disabled?: boolean;
}
interface MentionItem {
    /** 提及的选项 id */
    id: string;
    /** 显示的文本（含 @前缀） */
    display: string;
    /** 原始触发位置 */
    trigger: string;
}
interface MentionsProps {
    /** 可选提及列表 */
    options: MentionOption[];
    /** 当前文本值（受控） */
    value?: string;
    /** 默认文本值（非受控） */
    defaultValue?: string;
    /** 文本变化回调 */
    onChange?: (text: string, mentions: MentionItem[]) => void;
    /** 提及变化回调 */
    onMentionsChange?: (mentions: MentionItem[]) => void;
    /** 触发字符，默认 '@' */
    trigger?: string;
    /** 占位文字 */
    placeholder?: string;
    /** 最大高度 */
    maxHeight?: number | string;
    /** 最小行数 */
    minRows?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 自定义 data-testid */
    'data-testid'?: string;
}
declare function Mentions({ options, value: controlledValue, defaultValue, onChange, onMentionsChange, trigger, placeholder, maxHeight, minRows, disabled, className, 'data-testid': dataTestId, }: MentionsProps): React__default.JSX.Element;

interface CommentAuthor {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
}
interface CommentItem {
    id: string;
    author: CommentAuthor;
    content: string;
    createdAt: string;
    likes: number;
    liked?: boolean;
    replies?: CommentItem[];
}
interface CommentListProps {
    /** 评论数据 */
    comments: CommentItem[];
    /** 当前用户 ID */
    currentUserId?: string;
    /** 添加评论回调 */
    onAddComment?: (content: string, parentId?: string) => void;
    /** 删除评论回调 */
    onDeleteComment?: (commentId: string) => void;
    /** 点赞/取消点赞回调 */
    onToggleLike?: (commentId: string) => void;
    /** 加载更多回调 */
    onLoadMore?: () => void;
    /** 是否正在加载更多 */
    loading?: boolean;
    /** 是否还有更多 */
    hasMore?: boolean;
    /** 占位文本 */
    placeholder?: string;
    /** 测试 ID */
    'data-testid'?: string;
}
declare function CommentList({ comments, currentUserId, onAddComment, onDeleteComment, onToggleLike, onLoadMore, loading, hasMore, placeholder, 'data-testid': testId, }: CommentListProps): React__default.JSX.Element;

interface KpiItem {
    /** 唯一标识 */
    id: string;
    /** 标签文字 */
    label: string;
    /** 当前值 */
    value: string | number;
    /** 与前值对比（百分比变化） */
    change?: number;
    /** 变化方向：true=上升(正), false=下降(负), undefined=无变化 */
    changePositive?: boolean;
    /** 格式化后的变化文字 */
    changeLabel?: string;
    /** 单位 */
    unit?: string;
    /** 自定义图标/emoji */
    icon?: string;
    /** 色系 */
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}
interface RealtimeKpiStripProps {
    /** KPI 数据列表 */
    items: KpiItem[];
    /** 滚动方向 */
    direction?: 'horizontal' | 'vertical';
    /** 卡片宽度（horizontal） */
    cardWidth?: number;
    /** 是否显示边框高亮 */
    bordered?: boolean;
    /** 最多显示条数（超出省略） */
    maxItems?: number;
    /** 自动刷新标记 */
    isLive?: boolean;
    /** 最后更新时间 */
    lastUpdate?: string;
    className?: string;
}
declare function RealtimeKpiStrip({ items, direction, isLive, lastUpdate, maxItems, className, }: RealtimeKpiStripProps): React__default.JSX.Element;

type AttachmentStatus = 'uploading' | 'completed' | 'error';
interface AttachmentItem {
    /** 附件唯一标识 */
    id: string;
    /** 文件名 */
    name: string;
    /** 文件大小（字节） */
    size: number;
    /** 文件类型 (MIME) */
    mimeType: string;
    /** 文件下载/预览URL */
    url?: string;
    /** 上传状态 */
    status?: AttachmentStatus;
    /** 上传进度 0-100 */
    progress?: number;
    /** 缩略图URL（图片类） */
    thumbnailUrl?: string;
    /** 错误信息 */
    errorMessage?: string;
}
interface AttachmentListProps {
    /** 附件列表 */
    items: AttachmentItem[];
    /** 点击下载回调 */
    onDownload?: (item: AttachmentItem) => void;
    /** 删除附件回调 */
    onRemove?: (item: AttachmentItem) => void;
    /** 重试上传回调 */
    onRetry?: (item: AttachmentItem) => void;
    /** 是否展示删除按钮 */
    showRemove?: boolean;
    /** 是否只读模式（不展示任何操作按钮） */
    readonly?: boolean;
    /** 是否紧凑模式 */
    compact?: boolean;
    /** 是否展示文件图标 */
    showIcon?: boolean;
    /** 空状态文案 */
    emptyText?: string;
    /** 最大显示附件数，超出折叠 */
    maxVisible?: number;
    /** className */
    className?: string;
}
declare const AttachmentList: React__default.FC<AttachmentListProps>;

interface StoreComparisonMetric {
    revenue: number;
    orderCount: number;
    avgOrderValue: number;
    activeMembers: number;
    deviceUtilization: number;
    customerSatisfaction: number;
}
interface StoreComparisonItem {
    id: string;
    name: string;
    region: string;
    status: 'online' | 'offline' | 'maintenance';
    trend: 'up' | 'down' | 'stable';
    metrics: StoreComparisonMetric;
}
interface StoreComparisonPanelProps {
    stores: StoreComparisonItem[];
    loading?: boolean;
    baselineStoreId?: string;
    'data-testid'?: string;
}
declare const StoreComparisonPanel: React__default.FC<StoreComparisonPanelProps>;

interface BulkEditField<T = string> {
    /** Unique field key */
    key: T;
    /** Display label */
    label: string;
    /** Current field value type */
    type: 'text' | 'number' | 'select' | 'toggle' | 'date';
    /** For select type: available options */
    options?: {
        label: string;
        value: string;
    }[];
    /** Placeholder for text/number inputs */
    placeholder?: string;
    /** Validation function: return error string or null */
    validate?: (value: string | number | boolean | null) => string | null;
}
interface BulkEditEntry<ID = string> {
    /** Unique record id */
    id: ID;
    /** Display title (shown in preview row) */
    title: string;
    /** Subtitle or secondary info */
    subtitle?: string;
    /** Current field values keyed by field key */
    values: Record<string, string | number | boolean | null>;
}
interface BulkEditPanelProps<ID = string, F = string> {
    /** All selected entries that will be edited */
    entries: BulkEditEntry<ID>[];
    /** Field definitions for the edit form */
    fields: BulkEditField<F>[];
    /** Currently editing values (can be partial) */
    editingValues: Record<string, string | number | boolean | null>;
    /** Called when a field value changes */
    onFieldChange: (fieldKey: string, value: string | number | boolean | null) => void;
    /** Called when "Apply to all" is confirmed */
    onApply: (values: Record<string, string | number | boolean | null>) => void;
    /** Called when the panel is closed / cancelled */
    onCancel: () => void;
    /** Whether the panel is performing the update */
    isSubmitting?: boolean;
    /** Custom submit button label */
    submitLabel?: string;
    /** Error message to display */
    error?: string | null;
    /** CSS class */
    className?: string;
}
declare function BulkEditPanel<ID extends string = string, F extends string = string>({ entries, fields, editingValues, onFieldChange, onApply, onCancel, isSubmitting, submitLabel, error, className, }: BulkEditPanelProps<ID, F>): React__default.JSX.Element;

type WatermarkContent = string | React__default.ReactNode;
interface WatermarkProps {
    /** Watermark text or node to display */
    content?: WatermarkContent;
    /** Whether to enable the watermark */
    disabled?: boolean;
    /** Font size in px */
    fontSize?: number;
    /** Font color */
    color?: string;
    /** Opacity 0-1 */
    opacity?: number;
    /** Rotation angle in degrees */
    rotate?: number;
    /** Gap between watermarks (horizontal, vertical) in px */
    gap?: [number, number];
    /** Offset of the first watermark from top-left (x, y) in px */
    offset?: [number, number];
    /** Z-index of the watermark overlay */
    zIndex?: number;
    /** Children to be watermarked */
    children?: React__default.ReactNode;
    /** data-testid */
    'data-testid'?: string;
}
/**
 * Watermark 组件
 *
 * 在内容区域覆盖半透明水印，用于敏感页面/文档的权限标识。
 * 支持自定义文字、旋转角度、间距和透明度。
 */
declare const Watermark: React__default.FC<WatermarkProps>;

type SpinSize = 'sm' | 'md' | 'lg';
interface SpinProps {
    /** 是否为加载中状态，默认 true */
    spinning?: boolean;
    /** 加载描述文案（显示在指示器下方） */
    tip?: string;
    /** 指示器尺寸 */
    size?: SpinSize;
    /** 自定义加载指示器，替换默认 spinner */
    indicator?: React__default.ReactNode;
    /** 延迟显示加载时间（毫秒），用于防止闪烁 */
    delay?: number;
    /** 包裹的内容区域 */
    children?: React__default.ReactNode;
    /** 外层容器类名 */
    className?: string;
    /** 遮罩容器样式 */
    style?: React__default.CSSProperties;
    /** 是否全屏覆盖 */
    fullscreen?: boolean;
}
declare function Spin({ spinning, tip, size, indicator, delay, children, className, style, fullscreen, }: SpinProps): React__default.JSX.Element;

/** 会员生命周期阶段 */
type LifecycleStage = 'new' | 'active' | 'engaged' | 'slipping' | 'at_risk' | 'churned';
/** 阶段指标 */
interface StageMetric {
    /** 指标名称 */
    label: string;
    /** 当前值 */
    currentValue: number;
    /** 历史值 */
    previousValue: number;
    /** 单位 */
    unit: string;
    /** 变化方向 */
    direction: 'up' | 'down' | 'flat';
}
/** 阶段迁移建议 */
interface StageTransitionAdvice {
    /** 目标阶段 */
    targetStage: LifecycleStage;
    /** 预期效果描述 */
    description: string;
    /** 建议行动项 */
    actions: string[];
    /** 预期改善幅度 0-100 */
    expectedImprovement: number;
    /** 预估周期 */
    expectedTimeline: string;
}
/** 生命周期预测结果 */
interface MemberLifecycleForecast {
    /** 会员 ID */
    memberId: string;
    /** 会员名称 */
    memberName: string;
    /** 当前阶段 */
    currentStage: LifecycleStage;
    /** 上次阶段变化日期 */
    lastStageChange: string;
    /** 在该阶段停留天数 */
    daysInCurrentStage: number;
    /** 下一预测阶段 */
    predictedNextStage?: LifecycleStage;
    /** 预测置信度 0-100 */
    confidence: number;
    /** 预测时间窗口 (天数) */
    predictedWindowDays: number;
    /** 阶段关键指标 */
    metrics: StageMetric[];
    /** 阶段迁移建议 */
    advice: StageTransitionAdvice[];
    /** 历史阶段序列 */
    stageHistory: {
        stage: LifecycleStage;
        date: string;
    }[];
    /** 生命周期价值预估 */
    estimatedLtv: number;
    /** 上期 LTV 对比 */
    previousLtv: number;
}
interface AIMemberLifecycleForecastPanelProps {
    /** 预测数据 */
    forecast: MemberLifecycleForecast;
    /** 加载态 */
    loading?: boolean;
    /** 空态文本 */
    emptyText?: string;
    /** 自定义 class */
    className?: string;
    /** 测试 id */
    'data-testid'?: string;
}
declare function AIMemberLifecycleForecastPanel({ forecast, loading, emptyText, className, 'data-testid': testId, }: AIMemberLifecycleForecastPanelProps): React__default.JSX.Element;

/** 规则链节点状态 */
type RuleNodeStatus = 'pending' | 'running' | 'passed' | 'blocked' | 'skipped' | 'error';
/** 规则链节点 */
interface RuleChainNode {
    /** 节点 ID */
    id: string;
    /** 规则名称 */
    name: string;
    /** 规则描述 */
    description?: string;
    /** 执行状态 */
    status: RuleNodeStatus;
    /** 规则类型标签 */
    tag?: string;
    /** 耗时 (ms) */
    durationMs?: number;
    /** 置信度 0-1 */
    confidence?: number;
    /** 子节点（分支） */
    children?: RuleChainNode[];
    /** 输出信息 */
    output?: string;
}
/** 决策摘要 */
interface DecisionSummary {
    /** 总规则数 */
    totalRules: number;
    /** 已触发数 */
    triggeredRules: number;
    /** 已阻塞数 */
    blockedRules: number;
    /** 总耗时 ms */
    totalDurationMs: number;
    /** 最终决策 */
    finalDecision?: 'approve' | 'reject' | 'review';
    /** 最终决策说明 */
    finalDecisionReason?: string;
}
/** 组件 Props */
interface AIDecisionRuleChainProps {
    /** 规则链节点 */
    rules: RuleChainNode[];
    /** 决策摘要 */
    summary?: DecisionSummary;
    /** 标题 */
    title?: string;
    /** 精简模式（仅显示状态图标 + 名称） */
    compact?: boolean;
    /** 变体 */
    variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram';
}
/**
 * AIDecisionRuleChain — AI 决策规则链可视化组件
 *
 * 展示多层级规则链的执行路径、命中状态、耗时和置信度。
 * 适用于：
 * - 风控规则链执行结果展示
 * - AI 决策路径回溯
 * - 会员等级自动评估链路
 * - 积分风控规则执行展示
 *
 * @example
 * <AIDecisionRuleChain
 *   title="会员自动升级规则链"
 *   rules={[
 *     { id: 'r1', name: '消费门槛检查', status: 'passed', tag: '风控', confidence: 0.95, durationMs: 12 },
 *     { id: 'r2', name: '积分风控检查', status: 'blocked', tag: '风控', confidence: 0.3, durationMs: 8, output: '近30天积分突增300%' },
 *   ]}
 *   summary={{ totalRules: 3, triggeredRules: 2, blockedRules: 1, totalDurationMs: 45, finalDecision: 'review' }}
 * />
 */
declare function AIDecisionRuleChain({ rules, summary, title, compact, variant, }: AIDecisionRuleChainProps): React__default.JSX.Element;

/** 实验变体身份 */
type TestVariant = 'A' | 'B';
/** 单个实验分组统计 */
interface VariantStats {
    variant: TestVariant;
    /** 执行总次数 */
    totalExecutions: number;
    /** 成功次数 */
    successCount: number;
    /** 失败次数 */
    failureCount: number;
    /** 平均耗时（ms） */
    avgDurationMs: number;
    /** P95 耗时（ms） */
    p95DurationMs: number;
    /** 平均置信度 */
    avgConfidence: number;
    /** 采纳次数（adopted） */
    adoptionCount: number;
    /** 建议节省/提升平均值（单位自定） */
    avgValueDelta: number;
}
/** 单次实验记录 */
interface ABTestRecord {
    id: string;
    variant: TestVariant;
    ruleName: string;
    status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT';
    confidence: number;
    valueDelta: number;
    durationMs: number;
    adopted: boolean;
    executedAt: string;
}
/** A/B 实验摘要对比 */
interface ABTestComparison {
    experimentId: string;
    experimentName: string;
    ruleName: string;
    startedAt: string;
    endedAt: string;
    variantA: VariantStats;
    variantB: VariantStats;
    /** 置信区间 95% 下是否显著 */
    isSignificant: boolean;
    /** p 值 */
    pValue: number;
    /** 推荐采信变体（null=无显著差异） */
    recommendedVariant: TestVariant | null;
    /** 提升幅度摘要 */
    liftSummary: string;
}
/** 组件 props */
interface AiABTestComparisonPanelProps {
    comparisons: ABTestComparison[];
    onSelectComparison?: (experimentId: string) => void;
    onAdoptVariant?: (experimentId: string, variant: TestVariant) => void;
    compact?: boolean;
}

declare function AiABTestComparisonPanel({ comparisons, onAdoptVariant, compact, }: AiABTestComparisonPanelProps): React__default.JSX.Element;

type SortKey = 'pValue' | 'lift' | 'name' | 'date';
interface UseAiABTestComparisonReturn {
    comparisons: ABTestComparison[];
    loading: boolean;
    error: string | null;
    sortKey: SortKey;
    setSortKey: (key: SortKey) => void;
    showOnlySignificant: boolean;
    setShowOnlySignificant: (v: boolean) => void;
    adoptVariant: (experimentId: string, variant: TestVariant) => void;
    getVariantRate: (stats: VariantStats) => number;
    getVariantAdoptionRate: (stats: VariantStats) => number;
}
declare function useAiABTestComparison(): UseAiABTestComparisonReturn;

/** 反馈来源上下文 */
interface FeedbackSource {
    /** 来源标识（推荐ID / 预测ID / 规则ID） */
    id: string;
    /** 来源类型 */
    type: 'recommendation' | 'prediction' | 'decision' | 'insight';
    /** 来源名称 */
    label: string;
    /** 推荐/预测的具体内容摘要 */
    summary: string;
    /** 置信度 (0-100) */
    confidence?: number;
    /** 相关指标影响 */
    metricImpact?: string;
}
/** 用户反馈条目 */
interface UserFeedbackItem {
    sourceId: string;
    rating: FeedbackRating;
    comment: string;
    timestamp: string;
}
/** 反馈评分 */
type FeedbackRating = 'helpful' | 'somewhat' | 'not_helpful' | 'inaccurate';
/** 聚合统计 */
interface FeedbackAggregate {
    totalFeedback: number;
    helpfulRate: number;
    somewhatRate: number;
    notHelpfulRate: number;
    inaccurateRate: number;
    trend: 'up' | 'down' | 'stable';
}
interface AIRecommendationFeedbackPanelProps {
    /** 当前待反馈的推荐来源 */
    source: FeedbackSource;
    /** 历史反馈统计 */
    aggregate?: FeedbackAggregate;
    /** 提交反馈回调 */
    onSubmitFeedback: (sourceId: string, rating: FeedbackRating, comment: string) => Promise<void>;
    /** 忽略/跳过回调 */
    onSkip?: (sourceId: string) => void;
    /** 是否正在提交 */
    submitting?: boolean;
    /** 自定义类名 */
    className?: string;
}
declare function AIRecommendationFeedbackPanel({ source, aggregate, onSubmitFeedback, onSkip, submitting, className, }: AIRecommendationFeedbackPanelProps): React__default.JSX.Element;

type PopconfirmPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
interface PopconfirmProps {
    /** 触发器元素 */
    children: React__default.ReactNode;
    /** 确认弹窗标题 */
    title?: React__default.ReactNode;
    /** 确认弹窗描述 */
    description?: React__default.ReactNode;
    /** 确认按钮文本，默认「确定」 */
    confirmText?: string;
    /** 取消按钮文本，默认「取消」 */
    cancelText?: string;
    /** 弹出方向，默认 top */
    placement?: PopconfirmPlacement;
    /** 触发方式，默认 click */
    triggerMode?: 'click' | 'hover';
    /** 确认按钮是否为危险样式 */
    danger?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 最大宽度 */
    maxWidth?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 确认回调 */
    onConfirm?: () => void | Promise<void>;
    /** 取消回调 */
    onCancel?: () => void;
    /** 打开/关闭状态变化回调 */
    onOpenChange?: (open: boolean) => void;
    /** 确认前校验，返回 false 阻止关闭 */
    beforeConfirm?: () => boolean | Promise<boolean>;
}
declare const Popconfirm: React__default.NamedExoticComponent<PopconfirmProps>;

type SupportedPadRole = 'store_manager' | 'front_desk' | 'sales_clerk';
interface RolePadClientProps {
    role: SupportedPadRole;
    /** 当前激活的 tab，默认 'workbench' */
    activeTab?: string;
    /** tab 切换回调 */
    onTabChange?: (tab: string) => void;
    /** Pad 屏幕分辨率提示 */
    deviceWidthHint?: number;
}
declare function RolePadClient({ role, activeTab, onTabChange, deviceWidthHint, }: RolePadClientProps): React__default.JSX.Element;

type RichTextEditorSize = 'sm' | 'md' | 'lg';
interface ToolbarAction {
    key: string;
    label: string;
    icon?: string;
    command: (editor: RichTextEditorHandle) => void;
}
interface RichTextEditorHandle {
    getContent: () => string;
    setContent: (html: string) => void;
    exec: (command: string, value?: string) => void;
    focus: () => void;
}
interface RichTextEditorProps {
    /** Current HTML value */
    value?: string;
    /** Called when content changes (debounced) */
    onChange?: (html: string) => void;
    /** Placeholder text when empty */
    placeholder?: string;
    /** Visual size — affects toolbar and editor font */
    size?: RichTextEditorSize;
    /** Label text rendered above the editor */
    label?: string;
    /** Error message */
    error?: string;
    /** Helper / hint text */
    helperText?: string;
    /** Whether the editor is in a loading state */
    loading?: boolean;
    /** Disable editing */
    disabled?: boolean;
    /** Make the editor fill its container width */
    block?: boolean;
    /** Minimum height in px */
    minHeight?: number;
    /** Maximum height in px (scroll beyond) */
    maxHeight?: number;
    /** Show character count */
    showCount?: boolean;
    /** Toolbar configuration — which buttons to show */
    toolbar?: ToolbarPreset | ToolbarAction[];
    /** Max length for character count */
    maxLength?: number;
    /** Callback when editor ref handle is ready */
    editorRef?: React__default.Ref<RichTextEditorHandle>;
    /** Test id */
    'data-testid'?: string;
}
type ToolbarPreset = 'full' | 'basic' | 'minimal';
declare const RichTextEditor: React__default.ForwardRefExoticComponent<RichTextEditorProps & React__default.RefAttributes<RichTextEditorHandle>>;

interface YearPickerProps {
    /** Current value (ISO 8601 year string YYYY) */
    value?: string;
    /** Value change callback */
    onChange?: (value: string) => void;
    /** Minimum year (YYYY) */
    min?: string;
    /** Maximum year (YYYY) */
    max?: string;
    /** Whether disabled */
    disabled?: boolean;
    /** Required */
    required?: boolean;
    /** Label */
    label?: string;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
    /** Placeholder */
    placeholder?: string;
    /** Custom style */
    style?: React__default.CSSProperties;
    /** Custom class name */
    className?: string;
    /** Start year (default: current year - 20) */
    startYear?: number;
    /** End year (default: current year + 10) */
    endYear?: number;
    /** Whether to show current decade as initial view */
    decadeView?: boolean;
}
declare const YearPicker: React__default.FC<YearPickerProps>;

/**
 * StoreStatusIndicator — 门店状态指示器组件
 *
 * 用于展示门店的运营状态，如营业中、休息中、维修中、离线等。
 * 支持多种状态类型、颜色编码、尺寸变体、脉冲动画和可选的点击交互。
 *
 * Pattern: 纯展示组件，无外部依赖，支持 .test.tsx 测试
 */

type StoreStatus = 'open' | 'closed' | 'busy' | 'maintenance' | 'offline' | 'error';
type StoreStatusSize = 'sm' | 'md' | 'lg';
interface StoreStatusIndicatorProps {
    /** 门店运营状态 */
    status: StoreStatus;
    /** 自定义状态显示文本，默认使用内置中文映射 */
    label?: string;
    /** 尺寸变体 */
    size?: StoreStatusSize;
    /** 是否显示脉冲动画（open/busy 状态默认开启） */
    animated?: boolean;
    /** 是否显示最后更新时间 */
    lastUpdated?: string;
    /** 是否显示纯文本模式（无圆点指示器） */
    textOnly?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 点击回调 */
    onClick?: (status: StoreStatus) => void;
}
declare function StoreStatusIndicator({ status, label, size, animated, lastUpdated, textOnly, className, style, onClick, }: StoreStatusIndicatorProps): React__default.JSX.Element;

interface StoreItem {
    /** 门店唯一标识 */
    id: string;
    /** 门店名称 */
    label: string;
    /** 所属城市 */
    city: string;
    /** 所属区域（可选） */
    region?: string;
    /** 门店地址（搜索辅助） */
    address?: string;
    /** 是否禁用选择 */
    disabled?: boolean;
}
interface StoreGroup {
    /** 分组标识 */
    key: string;
    /** 分组显示名 */
    label: string;
    /** 组内门店 */
    stores: StoreItem[];
}
type StoreSelectorMode = 'single' | 'multiple';
interface StoreSelectorProps {
    /** 门店列表（平铺结构） */
    stores: StoreItem[];
    /** 按城市/区域分组（默认按 city 分组，null=不分组） */
    groupBy?: 'city' | 'region' | null;
    /** 分组自定义标签函数 */
    groupLabel?: (key: string, stores: StoreItem[]) => string;
    /** 当前选中值（受控） */
    value?: string | string[];
    /** 值变化回调 */
    onChange?: (value: string | string[]) => void;
    /** 选择模式 */
    mode?: StoreSelectorMode;
    /** 占位文本 */
    placeholder?: string;
    /** 搜索占位文本 */
    searchPlaceholder?: string;
    /** 空数据提示 */
    notFoundContent?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否显示全选（多选模式） */
    showSelectAll?: boolean;
    /** 全选文本 */
    selectAllText?: string;
    /** 最大显示标签数量（多选模式） */
    maxTagCount?: number;
    /** 最小宽度 */
    minWidth?: number;
    /** 最大高度（下拉面板） */
    maxDropdownHeight?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React__default.CSSProperties;
    /** 下拉类名 */
    dropdownClassName?: string;
    /** 表单 name */
    name?: string;
}
declare function groupStoresByKey(stores: StoreItem[], key: 'city' | 'region'): StoreGroup[];
declare function StoreSelector({ stores, groupBy, groupLabel, value, onChange, mode, placeholder, searchPlaceholder, notFoundContent, disabled, showSelectAll, selectAllText, maxTagCount, minWidth, maxDropdownHeight, className, style, dropdownClassName, name, }: StoreSelectorProps): React__default.JSX.Element;
declare namespace StoreSelector {
    var displayName: string;
}

/** 决策执行结果状态 */
type DecisionResult = 'success' | 'partial' | 'failure';
/** 决策来源 */
type DecisionSource = 'rule' | 'model' | 'hybrid';
/** 单条决策评估记录 */
interface DecisionEffectivenessItem {
    /** 决策 ID */
    id: string;
    /** 决策名称 */
    name: string;
    /** 决策来源 */
    source: DecisionSource;
    /** 执行结果 */
    result: DecisionResult;
    /** 执行次数 */
    executionCount: number;
    /** 成功次数 */
    successCount: number;
    /** 平均响应时间 ms */
    avgResponseMs: number;
    /** 提升指标 % 如转化率提升 */
    liftPercent?: number;
    /** 最后执行时间 */
    lastExecutedAt: string;
    /** 是否启用 */
    enabled: boolean;
}
/** 汇总卡 */
interface EffectivenessSummary {
    totalDecisions: number;
    totalExecutions: number;
    overallSuccessRate: number;
    avgResponseMs: number;
    avgLiftPercent: number;
}
/** 决策效果看板 Props */
interface AIDecisionEffectivenessBoardProps {
    /** 决策效果数据 */
    items: DecisionEffectivenessItem[];
    /** 面板标题 */
    title?: string;
    /** 是否显示汇总 */
    showSummary?: boolean;
    /** 成功阈值（超过此百分比视为高效果） */
    successThreshold?: number;
}
declare function AIDecisionEffectivenessBoard({ items, title, showSummary, successThreshold, }: AIDecisionEffectivenessBoardProps): React__default.JSX.Element;

interface RuleWeightItem {
    id: string;
    name: string;
    description: string;
    currentWeight: number;
    adjustable: boolean;
    category: 'risk' | 'promotion' | 'member' | 'stock' | 'staff';
    enabled: boolean;
}
interface WeightAdjustResult {
    ruleId: string;
    oldWeight: number;
    newWeight: number;
    impact: 'low' | 'medium' | 'high';
    affectedCount: number;
    previewImpact: string;
}
interface AIRuleWeightPanelProps {
    rules: RuleWeightItem[];
    onWeightChange?: (ruleId: string, newWeight: number) => void;
    onBatchAdjust?: (adjustments: WeightAdjustResult[]) => void;
    onReset?: () => void;
    loading?: boolean;
    disabled?: boolean;
}

declare function AIRuleWeightPanel({ rules, onWeightChange, onBatchAdjust, onReset, loading, disabled, }: AIRuleWeightPanelProps): React__default.JSX.Element;

interface UseAIRuleWeightReturn {
    rules: RuleWeightItem[];
    loading: boolean;
    error: string | null;
    updateWeight: (ruleId: string, newWeight: number) => void;
    batchUpdate: (adjustments: WeightAdjustResult[]) => void;
    resetWeights: () => void;
}
declare function useAIRuleWeight(initialRules: RuleWeightItem[]): UseAIRuleWeightReturn;

type AIModelCapability = 'chat' | 'vision' | 'code' | 'reasoning' | 'embedding';
type AIModelPricingTier = 'budget' | 'standard' | 'premium';
interface AIModelOption {
    /** 模型唯一标识 */
    id: string;
    /** 显示名称 */
    name: string;
    /** 提供商 */
    provider: string;
    /** 能力标签 */
    capabilities: AIModelCapability[];
    /** 定价层级 */
    pricingTier: AIModelPricingTier;
    /** 每 1K 输入 tokens 价格 (USD) */
    inputPricePer1K: number;
    /** 每 1K 输出 tokens 价格 (USD) */
    outputPricePer1K: number;
    /** 平均延迟 ms */
    avgLatencyMs: number;
    /** 上下文窗口 */
    contextWindow: number;
    /** 是否推荐 */
    recommended?: boolean;
    /** 当前是否可用 */
    available: boolean;
    /** 简要描述 */
    description?: string;
}
interface AIModelSelectorProps {
    /** 模型列表 */
    models: AIModelOption[];
    /** 当前选中模型 ID */
    value?: string;
    /** 选择回调 */
    onChange?: (modelId: string) => void;
    /** 是否加载中 */
    loading?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 视图模式 */
    variant?: 'compact' | 'detailed';
}
declare function AIModelSelector({ models, value, onChange, loading, disabled, className, variant, }: AIModelSelectorProps): React__default.JSX.Element;

/** 检查分类 */
type InspectionCategory = 'environment' | 'device' | 'staff' | 'safety' | 'hygiene';
/** 检查任务状态 */
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
/** 质量问题严重度 */
type IssueSeverity = 'critical' | 'major' | 'minor';
/** 巡检区域 */
interface InspectionArea {
    id: string;
    name: string;
    /** 待检项总数 */
    total: number;
    /** 已通过 */
    passed: number;
    /** 不合格 */
    failed: number;
    /** 通过率 */
    passRate: number;
}
/** 待处理问题 */
interface QualityIssue {
    id: string;
    title: string;
    area: string;
    severity: IssueSeverity;
    status: InspectionItemStatus;
    reporter: string;
    createdAt: string;
    deadline: string;
    description?: string;
}
/** 今日质检指标 */
interface InspectorDailyMetrics {
    /** 今日检查门店数 */
    storeCount: number;
    /** 检查总项数 */
    totalItems: number;
    /** 通过项 */
    passedItems: number;
    /** 不合格项 */
    failedItems: number;
    /** 整体通过率 (%) */
    passRate: number;
    /** 发现重大问题数 */
    criticalIssues: number;
}
/** 今日检查任务 */
interface InspectionTask {
    id: string;
    storeName: string;
    area: string;
    status: TaskStatus;
    checkedCount: number;
    totalCount: number;
    scheduledAt: string;
    priority: 'normal' | 'urgent';
    deadline: string;
}
/** 质检员工作台 Props */
interface QualityInspectorDashboardProps {
    /** 今日质检指标 */
    dailyMetrics?: InspectorDailyMetrics;
    /** 今日检查任务列表 */
    tasks?: InspectionTask[];
    /** 待处理质量问题 */
    issues?: QualityIssue[];
    /** 区域巡检概况 */
    areas?: InspectionArea[];
    /** 质检员姓名 */
    inspectorName?: string;
    /** 工号 */
    employeeId?: string;
    /** 负责区域 */
    region?: string;
    /** 最后同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 点击开始检查 */
    onStartInspection?: (taskId: string) => void;
    /** 点击处理问题 */
    onHandleIssue?: (issueId: string) => void;
    /** 点击查看详情 */
    onViewTaskDetail?: (taskId: string) => void;
    /** 点击上报问题 */
    onReportIssue?: (issueId: string) => void;
}
/**
 * 质量巡检员工作台
 *
 * 为质量巡检/品控人员提供每日检查概览、任务管理和问题跟踪功能。
 */
declare const QualityInspectorDashboard: React__default.FC<QualityInspectorDashboardProps>;
/** @deprecated Use QualityInspectionTask instead - conflicts with OperationsManagerDashboard */
type QualityInspectionTask = InspectionTask;
/** @deprecated Use QcTaskStatus instead - conflicts with other modules */
type QcTaskStatus = TaskStatus;

interface FeedbackEntry {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    content: string;
    category: 'service' | 'product' | 'experience' | 'other';
    createdAt: string;
    resolved: boolean;
    reply?: string;
}
interface FeedbackListProps {
    entries: FeedbackEntry[];
    maxItems?: number;
    onFeedbackClick?: (entry: FeedbackEntry) => void;
    onResolve?: (entryId: string) => void;
    emptyText?: string;
}
declare function FeedbackList({ entries, maxItems, onFeedbackClick, onResolve, emptyText, }: FeedbackListProps): React__default.JSX.Element;

export { type ABTestComparison, type ABTestRecord, AIAgentChatPanel, type AIAgentChatPanelProps, AIAgentThinkingPanel, type AIAgentThinkingPanelProps, AIAgentToolCallPanel, type AIAgentToolCallPanelProps, AIAgentWorkloadDistributionPanel, type AIAgentWorkloadDistributionPanelProps, AIAnalysisInsightsPanel, type AIAnalysisInsightsPanelProps, AICompetitiveAnalysisPanel, type AICompetitiveAnalysisPanelProps, type AICompetitiveSuggestion, AIDecisionComparisonPanel, type AIDecisionComparisonPanelProps, AIDecisionEffectivenessBoard, type AIDecisionEffectivenessBoardProps, AIDecisionPanel, AIDecisionRuleChain, type AIDecisionRuleChainProps, AIDecisionTimeline, type AIDecisionTimelineProps, AIDemandForecastPanel, type AIDemandForecastPanelProps, AIDeviceFaultPredictionPanel, type AIDeviceFaultPredictionPanelProps, AIExecutionAuditPanel, type AIExecutionAuditPanelProps, type AIExecutionRecord, AIExperimentOptimizationPanel, type AIExperimentOptimizationPanelProps, AIMemberChurnPredictionPanel, type AIMemberChurnPredictionPanelProps, AIMemberLifecycleForecastPanel, type AIMemberLifecycleForecastPanelProps, AIMetricGoalPanel, type AIMetricGoalPanelProps, type AIModelCapability, type AIModelOption, AIModelPerformancePanel, type AIModelPerformancePanelProps, type AIModelPricingTier, AIModelSelector, type AIModelSelectorProps, AIPricingRecommendationPanel, type AIPricingRecommendationPanelProps, AIRecommendationFeedbackPanel, type AIRecommendationFeedbackPanelProps, AIRuleWeightPanel, type AIRuleWeightPanelProps, AIScenarioSimulator, type AIScenarioSimulatorProps, AISmartInsightPanel, type AISmartInsightPanelProps, AISmartSchedulingPanel, type AISmartSchedulingPanelProps, AISuggestionCard, type AISuggestionCardProps, AISummaryCard, type AISummaryCardProps, Accordion, type AccordionItem, type AccordionProps, type ActivityType, type AgentConclusion, type AgentStatusSummary, type AgentWorkload, AiABTestComparisonPanel, type AiABTestComparisonPanelProps, Alert, type AlertProps, type AlertState, type AlertVariant, type AnalysisInsight, AnnouncementBanner, type AnnouncementBannerAction, type AnnouncementBannerProps, type AnnouncementSeverity, type AnnouncementVariant, type AnomalyAlert, AnomalyAlertPanel, type AnomalyAlertPanelProps, AnomalyDiagnosisReport, type AnomalyDiagnosisReportProps, AnomalyFrequencyTimeline, type AnomalyFrequencyTimelineProps, type AnomalyPattern, AnomalyPatternPanel, type AnomalyPatternPanelProps, type AnomalyPatternType, type AnomalySeverity, type AnomalyTimeBucket, type Appointment, AppointmentBookingPanel, type AppointmentBookingPanelProps, type AppointmentStatus, type AreaStatus, AssistantManagerDashboard, type AssistantManagerDashboardProps, type AsstQuickAction, type AttachmentItem, AttachmentList, type AttachmentListProps, type AttachmentStatus, type AuditAction, type AuditEntry, type AuditFilter, type AuditSeverity, type AuditSummary, AutoComplete, type AutoCompleteOption, type AutoCompleteProps, Avatar, AvatarGroup, type AvatarGroupProps, type AvatarProps, type AvatarSize, type AvatarStatus, Badge, type BadgePlacement, type BadgeProps, type BadgeSize, type BadgeVariant, type BasketItem, type BatchAction, BatchSelectionBar, type BatchSelectionBarProps, type BookingParams, type BottomNavItem, BottomNavigation, type BottomNavigationProps, BranchSelector, type BranchSelectorNode, type BranchSelectorProps, Breadcrumb, type BreadcrumbItem, BreadcrumbPageHeader, type BreadcrumbPageHeaderAction, type BreadcrumbPageHeaderProps, type BreadcrumbProps, type BudgetOverview, type BudgetOverviewItem, type BulkEditEntry, type BulkEditField, BulkEditPanel, type BulkEditPanelProps, Button, type ButtonProps, type ButtonSize, type ButtonVariant, Calendar, type CalendarMarker, type CalendarProps, type CampaignDataPoint, type CampaignInsight, type CampaignMetric, CampaignPerformancePanel, type CampaignPerformancePanelProps, type CampaignSnapshot$1 as CampaignSnapshot, CampaignTrendForecast, type CampaignTrendForecastPoint, type CampaignTrendForecastProps, type CampaignTrendHistoricalPoint, type CampaignTrendImpactFactor, type CampaignTrendModelInfo, Caption, Card, Carousel, type CarouselProps, type CarouselSlide, Cascader, type CascaderOption, type CascaderProps, CashierPanel, type CashierPanelProps, type CashierShiftMetrics, type CashierStatus, type CertificatePosture, type ChannelEffectiveness, Chart, type ChartDataPoint, type ChartProps, type ChartType, type ChatMessage, type ChatMessageRole, type ChatMessageStatus, Checkbox, type CheckboxProps, type CheckboxSize, type CheckoutStatus, Chip, type ChipProps, type ChipSize, type ChipVariant, type ChurnPrediction, type ChurnRiskLevel, type ChurnSignalFactor, type CoachDailyMetrics, CoachDashboard, type CoachDashboardProps, CodeBlock, type CodeBlockProps, Collapse, type CollapseProps, type CollapseSize, type CollapseVariant, Collapsible, type CollapsibleProps, ColorPicker, type ColorPickerProps, type ColorValue, CombinedDetailPage, type CombinedDetailPageProps, Combobox, type ComboboxOption, type ComboboxProps, type CommandItem, CommandPalette, type CommandPaletteProps, type CommentAuthor, type CommentItem, CommentList, type CommentListProps, Compact, ComparisonBreakdownChart, type ComparisonBreakdownChartProps, type ComparisonItem, type CompetitorDimension, type CompetitorEntry, type CompetitorMetric, type ConciergeAction, ConciergePanel, type ConciergePanelProps, type ConfidenceInterval, ConfigurationPosturePanel, type ConfigurationPosturePanelProps, ConfigurationVersionDiff, type ConfigurationVersionDiffProps, ConfirmActionDialog, type ConfirmActionDialogProps, ConfirmDialog, ContentSwitcher, type ContentSwitcherProps, type ContentSwitcherSegment, ContextMenu, type ContextMenuEntry, type ContextMenuItem, type ContextMenuProps, type ContextMenuSeparator, CopyToClipboard, CountUp, type CountUpProps, Countdown, type CountdownProps, type CountdownStatus, type CouponEntry, CouponRedemptionPanel, type CouponRedemptionPanelProps, type CouponStatus, type CouponType, Currency, type CustomerInfo, type CustomerProfile, CustomerServiceDashboard, type CustomerServiceDashboardProps, CustomerSessionPanel, type CustomerSessionPanelProps, type DailyPerformance, type DailyReceptionStats, DataTable, type DataTableColumn, type DataTableSortConfig, DatePicker, type DatePickerProps, DateRangePicker, type DateRangePickerProps, type DateRangePreset, type DateRangeValue, DateTimePicker, type DateTimePickerMode, type DateTimePickerProps, DecisionAuditTrail, type DecisionAuditTrailProps, type DecisionComparisonItem, type DecisionEffectivenessItem, type DecisionEvent, type DecisionPanelConfig, type DecisionResult, type DecisionRuleResult, type DecisionSource, type DecisionSummary, type DemandForecastDimension, type DemandForecastEntry, type DescriptionItem, DescriptionList, type DescriptionListProps, DetailActionBar, type DetailActionBarAction, type DetailActionBarIcon, type DetailActionBarProps, DetailClosureBar, type DetailClosureBarProps, type DetailClosureLink, type DetailInfoRow, DetailShell, type DetailShellAction, type DetailTab, type DeviceCategory, type DeviceEntry, type DeviceFaultPrediction, type InspectionItem as DeviceInspectionItem, DeviceInspectionPanel, type DeviceInspectionPanelProps, type DevicePanelSummary, type DeviceStatus, DeviceStatusPanel, type DeviceStatusPanelProps, type DeviceStatusSummary, type DeviceType, type DiagnosisFinding, type DiffChangeType, type DiffEntry, type DiffSeverity, type DistrictStoreSnapshot, type DistrictSummary, Divider, type DividerOrientation, type DividerProps, type DividerVariant, DotNavigation, type DotNavigationProps, type DotSize, type DotVariant, Drawer, type DrawerPlacement, type DrawerProps, type DrilldownDetail, type DrilldownDetailItem, DrilldownTrendCard, type DrilldownTrendCardProps, type TrendDirection as DrilldownTrendDirection, Dropdown, type DropdownItem, DropdownMenu, type DropdownMenuEntry, type DropdownMenuItem, type DropdownMenuProps, type DropdownMenuSeparator, type DropdownProps, type EffectivenessSummary, Empty, type EmptyProps, EmptyState, EntertainmentGuideDashboard, type EntertainmentGuideDashboardProps, ErrorBoundary, type ErrorBoundaryFallbackArgs, type ErrorBoundaryProps, type ErrorBoundarySeverity, type ExecutionStatus, type ExperimentEntry, type ExperimentStatus, type ExperimentVariant, ExportButton, type ExportButtonProps, type ExportFormat, type FaultPredictionSummary, type FaultSeverity, type FeedbackAggregate, type FeedbackEntry, FeedbackList, type FeedbackListProps, type FeedbackRating, type FeedbackSource, FeedbackWidget, type FeedbackWidgetProps, FileUpload, type FileUploadProps, FilterBar, type FilterChip, FilterChips, type FilterChipsProps, type FilterShortcut, FinanceManagerDashboard, type FinanceManagerDashboardProps, type FinanceSummary, type FinanceTransaction, type FollowUpCategory, type FollowUpClient, type FollowUpMember, type FollowUpPriority, type FollowUpRecord, type FollowUpTaskStatus, type ForecastAccuracy, type ForecastDataPoint, type ForecastModelMeta, type ForecastPoint, type ForecastTrend, FormField, type FormPageField, type FormPageFieldRule, FormPageScaffold, type FormPageScaffoldMeta, type FormPageScaffoldProps, type FormPageSubmitResult, FormSubmitFeedback, FoundationAlertAcknowledgeActionButton, FoundationAlertDemoListPage, FoundationAlertDetailView, FoundationAlertDetailsReadout, type FoundationAlertFilterState, type FoundationAlertFilterSummaryItem, type FoundationAlertGovernance, type FoundationAlertGovernanceAlert, FoundationAlertLinkedAlertGridReadout, FoundationAlertLinkedFocusBarReadout, type FoundationAlertLinkedOverviewCardDefinition, type FoundationAlertLinkedOverviewPalette, type FoundationAlertLinkedOverviewPanelRenderArgs, FoundationAlertLinkedOverviewSection, type FoundationAlertLinkedOverviewStatsPreset, FoundationAlertLinkedOverviewStatsReadout, type FoundationAlertLinkedOverviewSummaryLike, FoundationAlertLinkedOverviewSurface, type FoundationAlertLinkedOverviewSurfaceProps, FoundationAlertListPageSection, type FoundationAlertMutation, type FoundationAlertMutationAction, FoundationAlertOverviewReadout, type FoundationAlertOwnerSummaryItem, type FoundationAlertPanelClientAccess, FoundationAlertPanelFrame, FoundationAlertPanelOwnerSummaryReadout, type FoundationAlertPanelPalette, type FoundationAlertPanelReadoutPalette, FoundationAlertPanelSelectedAlertReadout, FoundationAlertPanelSourceSummaryReadout, FoundationAlertPanelSummaryDigestReadout, FoundationAlertPanelSurface, type FoundationAlertPanelSurfaceProps, type FoundationAlertPanelThemePreset, FoundationAlertPanelTimelineReadout, type FoundationAlertPanelToolbarPalette, FoundationAlertPresetDetailRoute, type FoundationAlertRecord, FoundationAlertRuntimeCallbackStalledReadout, type FoundationAlertSourceSummaryItem, FoundationAlertTableCard, type FoundationAlertTimelineItem, type FoundationAlertTimelineMetrics, FoundationConsumerWiringSection, type FoundationConsumerWiringSectionProps, type FrontDeskMetrics, FrontDeskPanel, type FrontDeskPanelProps, FrontDeskSupervisorDashboard, type FrontDeskSupervisorDashboardProps, FunnelChart, type FunnelChartProps, type FunnelStage, type FunnelStep, GaugeChart, type GaugeChartProps, type GaugeSegment, type GovernanceAlert, GovernanceQuickViewSection, type GovernanceQuickViewSectionProps, type GovernanceReadModel, type GuestTask, type GuideAlert, type GuideDailyMetrics, type HSBColor, type HandoverCategory, type HandoverItem, Heading, type HeatmapCell, HeatmapChart, type HeatmapChartProps, type HeatmapColorScheme, type HighlightMetric, HoverCard, type HoverCardPlacement, type HoverCardProps, type ImageItem, ImagePreview, type ImagePreviewProps, type InboundTask, InfoCard, type InfoCardItem, type InfoCardProps, InfoRow, Input, InputNumber, type InputNumberProps, type InputNumberSize, type InputProps, type InputSize, type InputVariant, type InsightCategory, type InsightItem, type InsightSeverity, type InspectionAlert, type InspectionArea, type InspectionCategory, InspectionChecklist, type InspectionChecklistProps, type InspectionItem$1 as InspectionItem, type InspectionItemStatus, type InspectionMetrics, type InspectionResult, type InspectionSummary, type InspectionTask$1 as InspectionTask, type InspectorDailyMetrics, InventoryKeeperDashboard, type InventoryKeeperDashboardProps, type IssueSeverity, KanbanBoard, type KanbanBoardProps, type KanbanCard, type KanbanColumn, type KeeperQuickAction, type KpiCardItem, type KpiItem, KpiSummaryCard, type KpiSummaryCardProps, Label, type LabelColor, type LabelProps, type LabelSize, type LabelWeight, type LifecycleStage, type ListPageFacetConfig, type ListPageFacetState, ListToolbar, type ListToolbarBatchAction, type ListToolbarFilterOption, type ListToolbarProps, type ListToolbarSortOption, type ListToolbarViewMode, LoadingSkeleton, type MarketerQuickAction, type CampaignSnapshot as MarketingCampaignSnapshot, type MarketingGrowthMetrics, type MarketingKpi, MarketingManagerDashboard, type MarketingManagerDashboardProps, type MarketingQuickAction, Masonry, type MasonryProps, type MemberActivity, MemberActivityCard, type MemberActivityCardProps, MemberFollowUpTaskPanel, type MemberFollowUpTaskPanelProps, type MemberGrowthMetrics, type MemberLevel, MemberLevelDistribution, type MemberLevelDistributionProps, type MemberLifecycleForecast, MemberMarketerDashboard, type MemberMarketerDashboardProps, type MemberQuickLookup, MemberRFMAnalysisPanel, type MemberRFMAnalysisPanelProps, MemberRechargePanel, type MemberRechargePanelProps, type MemberServiceOverview, type MemberTier, MemberTierDistribution, type MemberTierDistributionProps, type MemberVisitRecord, type MentionItem, type MentionOption, Mentions, type MentionsProps, type MetricGoal, type MetricMode, type MetricTile, type MetricTrend, MetricsDashboardGrid, type MetricsDashboardGridProps, Modal, type ModalProps, type ModelPerformanceData, type ModelPerformanceMetric, MonthPicker, type MonthPickerProps, type MonthlyTarget, MultiSelect, type MultiSelectOption, type MultiSelectProps, type NavMenuItem, NavigationMenu, type NavigationMenuProps, type NotificationAction, NotificationBell, type NotificationItem$1 as NotificationBellItem, type NotificationBellProps, type NotificationCategory, NotificationCenter, type NotificationCenterProps, type NotificationItem, type NotificationSeverity, type NotificationSummary, NumberFormat, type NumberFormatProps, type NumberFormatSize, type NumberFormatType, OTPInput, type OTPInputProps, type OTPInputSize, type OTPInputVariant, OperationsManagerDashboard, type OperationsManagerDashboardProps, type OpsQuickAction, type OptimizationSuggestion, type OutboundTask, PageShell, PaginatedDataTableCard, Pagination, Paragraph, PasswordInput, type PasswordInputProps, type PatternSeverity, type PaymentMethod, type PendingCertification, type PendingTask, Percent, PerformanceRanking, type PerformanceRankingProps, type PersonalizedRecommendation, type PointsTransaction, Popconfirm, type PopconfirmPlacement, type PopconfirmProps, Popover, type PopoverPlacement, type PopoverProps, PortalConsumerGovernanceSection, type PortalConsumerGovernanceSectionProps, PortalList, type PortalListItemView, PredictionAnalysisPanel, type PredictionAnalysisPanelProps, type PredictionPoint, type PredictionStatus, type PredictionSummary, type PresetColor, type PricingRecommendation, type PricingSummary, ProcurementManagerDashboard, type ProcurementManagerDashboardProps, type ProcurementSummary, Progress, ProgressCard, type ProgressCardProps, type ProgressProps, ProgressRing, type ProgressRingProps, type PromoTask, type PropRental, type PurchaseOrderSnapshot, QRCodeDisplay, type QRCodeDisplayProps, type QRCodeType, type QcTaskStatus, type QualityInspectionTask, QualityInspectorDashboard, type QualityInspectorDashboardProps, type QualityIssue, type QualityMetrics, type QueueItem, type QueueOverview, type QuickAction$2 as QuickAction, QuickActionBar, type QuickAction as QuickActionBarAction, type QuickActionBarProps, type QuickFnButton, type QuickStatItem, QuickStats, type QuickStatsProps, type RFMRecord, type RFMSegment, type RFMSegmentInfo, type RGBColor, RadarChart, type RadarChartProps, type RadarDimension, type RadarSeries, type RadioDirection, RadioGroup, type RadioGroupProps, type RadioOption, type RadioSize, type RankingItem, Rating, type RatingProps, RealTimeRevenueDisplay, type RealTimeRevenueDisplayProps, RealtimeKpiStrip, type RealtimeKpiStripProps, type ReasoningStep, type ReasoningStepStatus, type ReceiptData, type ReceiptHeader, type ReceiptLineItem, type ReceiptPayment, type PaymentMethod$1 as ReceiptPaymentMethod, ReceiptPreview, type ReceiptPreviewProps, type RechargePaymentMethod, type RechargePlan, type RechargeRecord, type RecommendationCategory, type RecommendationConfidence, type RecommendationSummary, type RecommendedProduct, type ReconciliationDiff, ReconciliationDiffPanel, type ReconciliationDiffPanelProps, ReconnectingBadge, type ReconnectingBadgeProps, type ReconnectingState, type RedemptionRequest, type RedemptionResult, type RedemptionSummary, type RegionStoreSnapshot, RegionalManagerDashboard, type RegionalManagerDashboardProps, type RegionalQuickAction, type RegionalSummary, ResourceOptimizationPanel, type ResourceOptimizationPanelProps, type ResourceOptimizationSuggestion, Result, type ResultProps, type ResultStatus, type RetentionAction, type ReturnGoodsPanelCallbacks, type ReturnGoodsPanelConfig, type ReturnGoodsPanelProps, ReturnGoodsProcessingPanel, type ReturnItem, type ReturnRequest, type ReturnStatus, type ReturnType, type RevenueByCategory, type RevenueSnapshot, type RevenueTrendPoint, RichTextEditor, type RichTextEditorHandle, type RichTextEditorProps, type RichTextEditorSize, RolePadClient, type RolePadClientProps, type RuleChainNode, type RuleExecutionStatus, type RuleNodeStatus, type RuleRecommendation, RuleRecommendationPanel, type RuleRecommendationPanelProps, type RuleWeightItem, type RuntimeGovernancePanelPreset, RuntimeGovernancePanelTemplate, RuntimeOperationDateTimeReadout, RuntimeOperationDemoListPage, RuntimeOperationDetailView, RuntimeOperationIdReadout, RuntimeOperationOverviewReadout, RuntimeOperationPresetDetailRoute, RuntimeOperationReceiptListReadout, type RuntimeOperationReceiptRecord, type RuntimeOperationRecord, RuntimeOperationStatusReadout, RuntimeOperationTargetReadout, RuntimeOperationTimelineReadout, RuntimeOperationToolbar, RuntimeOperationTypeReadout, RuntimeOperationsListPageSection, RuntimeOperationsTableCard, RuntimePanelFeedback, RuntimePanelFrame, RuntimePanelGrid, RuntimePresetCard, RuntimePresetSelector, RuntimeReceiptEvents, RuntimeReceiptStatusCard, SalesClerkTool, type SalesClerkToolProps, SalesConversionFunnel, type SalesConversionFunnelProps, SalesForecastPanel, type SalesForecastPanelProps, SalesGuideTool, type SalesGuideToolProps, type SalesScript, ScenarioComparisonPanel, type ScenarioComparisonPanelProps, type ScenarioItem, type ScenarioMetric, type ScenarioVariable, type ScheduleSlot, type SchedulingConstraint, type SchedulingConstraintType, type SchedulingRecommendation, ScrollArea, type ScrollAreaProps, ScrollToTop, type ScrollToTopProps, SearchFilterInput, type SecretPosture, SegmentedControl, type SegmentedControlProps, type SegmentedOption, Select, type SelectOption, type SelectProps, type ServiceItem$1 as ServiceItem, type ServiceQualityMetrics, type ServiceRecord, type ServiceTicket, type SessionAction, type SessionStatus, type ShiftAssignment, type ShiftHandover, type ShiftHandoverEntry, ShiftHandoverPanel, type ShiftHandoverPanelProps, type ShiftInfo, type ShiftSlot, type ShiftSummary, type ShiftType, type SideNavItem, SideNavigation, type SideNavigationProps, type SimulationResult, Skeleton, type SkeletonProps, Slider, type SliderProps, type SmartInsight, type SmartInsightCategory, type SmartInsightPriority, SmartTrendAnalysisPanel, type SmartTrendAnalysisPanelProps, SmartTrendChart, type SmartTrendChartProps, type SortableItem, SortableList, type SortableListProps, Space, type SpaceDirection, type SpaceProps, type SpaceSize, SparklineChart, type SparklineChartProps, type SparklineDataPoint, type SparklinePoint, SpeedDial, type SpeedDialAction, type SpeedDialProps, Spin, type SpinProps, type SpinSize, Spinner, type SpinnerProps, type SpinnerSize, type SpinnerVariant, type SplitDirection, SplitPane, type SplitPaneProps, type StaffPreference, type StaffScheduleEntry, type StaffShiftInfo, StaffShiftSchedulePanel, type StaffShiftSchedulePanelProps, type StageMetric, type StageTransitionAdvice, StatCard, StatTrend, type StatTrendProps, Statistic, type StatisticLayout, type StatisticProps, type StatisticSize, type StatisticVariant, StatusBadge, StatusBadgeGroup, type StepItem, type StepStatus, Stepper, type StepperProps, type StepperStep, Steps, type StepsOrientation, type StepsProps, type StepsSize, type StockAlert, type StoreComparisonItem, type StoreComparisonMetric, StoreComparisonPanel, type StoreComparisonPanelProps, type StoreDailyMetrics, type StoreGroup, type StoreItem, StoreManagerDashboard, type StoreManagerDashboardProps, StoreSelector, type StoreSelectorMode, type StoreSelectorProps, type StoreStatus, StoreStatusIndicator, type StoreStatusIndicatorProps, type StoreStatusSize, StoreTransferOrderPanel, type StoreTransferOrderPanelProps, type StrategyCondition, type StrategyConfig, StrategyConfigPanel, type StrategyConfigPanelProps, type StrategyParamDef, type StrategyParamOption, type StrategyParamType, SubmitButton, type SubmitButtonProps, type SubmitButtonVariant, type SuggestionItem, type SuggestionPriority, type SuggestionSource, type SupplierOverview, type SupportedPadRole, Switch, type SwitchProps, type SwitchSize, Table, type TableColumn, type TablePaginationState, type TableProps, type TableSortState, Tabs, Tag, TagGroup, TagInput, type TagInputProps, type TagProps, type TagVariant, type TestVariant, Text, type TextAlign, TextArea, type TextAreaProps, type TextAreaResize, type TextAreaSize, type TextColor, type TextTransform, type TextVariant, type TextWeight, type TierData, TierDistributionChart, type TierDistributionChartProps, type TillStatus, TimePicker, type TimePickerProps, type TimeSlot, Timeline, type TimelineItem, type TimelineItemVariant, type TimelineNodeStatus, type TimelineProps, ToastContainer, type ToastEntry, type ToastOptions, type ToastVariant, ToggleButton, type ToggleButtonProps, ToggleGroup, type ToggleGroupProps, type ToggleGroupSize, type ToggleGroupVariant, type ToggleOption, type ToolCallParameter, type ToolCallRecord, type ToolCallStatus, type ToolbarAction, type ToolbarPreset, Tooltip, type TooltipPlacement, type TooltipProps, type TrainingDailyMetrics, TrainingManagerDashboard, type TrainingManagerDashboardProps, type TrainingNeed, type TrainingProgress, type TrainingSession, type TransactionLog, Transfer, type TransferItem, type TransferOrder, type TransferProps, type TransferStatus, type TransitionAction, Tree, type TreeNode, type TreeProps, TreeSelect, type TreeSelectNode, type TreeSelectProps, type TrendAnalysis, type TrendDirection$2 as TrendAnalysisDirection, type TrendDataPoint, type TrendDirection$3 as TrendDirection, type TrendDirection$1 as TrendIndicatorDirection, Typography, type TypographyProps, type UploadFile, type UsageMetric, UsageMetricsPanel, type UsageMetricsPanelProps, type UseAlertOptions, type UseToastReturn, type UserFeedbackItem, type VariantStats, type ViewModelContextValue, ViewModelProvider, type ViewModelProviderProps, VirtualizedList, type VirtualizedListProps, type VirtualizedListRow, type WarehouseMetrics, WaterfallMasonry, type WaterfallMasonryProps, Watermark, type WatermarkContent, type WatermarkProps, WeekPicker, type WeekPickerProps, type WeightAdjustResult, type WorkbenchBreadcrumb, WorkbenchHeader, type WorkbenchHeaderProps, type WorkbenchNavItem, WorkspaceBreadcrumb, type WorkspaceBreadcrumbProps, type WorkspaceBreadcrumbSegment, YearPicker, type YearPickerProps, buildFoundationAlertDrilldownSections, buildFoundationAlertLytConnectionGovernanceSections, buildFoundationAlertRecordFromDrilldown, canReplayRuntimePanelAction, canReplayRuntimePanelReceipt, collectLeafIds, computeDeviceSummary, createFoundationAdminGovernanceStatsCopy, createFoundationAlertDetailMockMap, createFoundationAlertLinkedOverviewStats, createFoundationAlertMockRecords, createFoundationAlertNextNavigationBindings, createFoundationAlertPanelActionButtonStyle, createFoundationAlertPanelFeedbackStyle, createFoundationAlertPanelFilterButtonStyle, createFoundationAlertPanelFilterChipStyle, createFoundationAlertPanelSectionStyle, createFoundationAlertPanelSelectionButtonStyle, createFoundationAlertPanelShortcutCardStyle, createFoundationAlertPanelSummaryCardStyle, createFoundationAlertTableColumns, createRuntimeOperationDetailMockMap, createRuntimeOperationMockRecords, createRuntimeOperationTableColumns, createRuntimeOperationToolbarProps, createRuntimeReceiptStatusCard, createRuntimeReceiptStatusCardProps, describeRuntimeCallbackStalledEscalation, executeRuntimePanelOperation, findNodeById, formatFoundationAlertActionLabel, formatFoundationAlertDrilldownDateTime, formatRuntimeCallbackStalledDuration, foundationAdminGovernanceListPreset, foundationAdminGovernanceSourceLabels, foundationAlertDetailDemoPresets, foundationAlertListDemoPresets, foundationAlertPanelThemePresets, foundationAlertSeverityLabels, foundationAlertStatusLabels, getRuntimePanelTenantId, groupStoresByKey, hasRuntimePanelReceiptCode, joinRuntimeScopeSummary, listPageStatCardStyle, mapFoundationGovernanceAlertsToRecords, refreshFoundationAlertSelection, runtimeOperationDetailDemoPresets, runtimeOperationListDemoPresets, runtimeOperationStatusLabels, runtimeOperationStatusVariants, serializeToCsv, summarizeRuntimePanelReceipt, useAIRuleWeight, useAiABTestComparison, useAlert, useCountdown, useFormSubmit, useFoundationAlertDemoAcknowledge, useFoundationAlertDrilldownQuery, useFoundationAlertFocusSync, useFoundationAlertGovernanceState, useFoundationAlertLinkedFocusQuery, useFoundationAlertMutationController, useFoundationAlertTimelineQueryState, useFoundationAlertViewLinkController, useFoundationAsyncLoader, useListPageSectionState, useNotificationSummary, usePagination, useRuntimePanelState, useRuntimePresetSelection, useSearchFilter, useSortedItems, useTenantId, useToast, useUserId, useViewModel, validateFormFields };
