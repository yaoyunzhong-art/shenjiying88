// --------------- @m5/ui shared component library ---------------
export { Badge } from './components/Badge';
export type { BadgeProps, BadgeVariant, BadgePlacement, BadgeSize } from './components/Badge';
export { DescriptionList } from './components/DescriptionList';
export type { DescriptionListProps, DescriptionItem } from './components/DescriptionList';

export { Avatar, AvatarGroup } from './components/Avatar';
export type { AvatarProps, AvatarGroupProps, AvatarSize, AvatarStatus } from './components/Avatar';
export { BatchSelectionBar } from './components/BatchSelectionBar';
export type { BatchSelectionBarProps, BatchAction } from './components/BatchSelectionBar';
export { Accordion } from './components/Accordion';
export type { AccordionItem, AccordionProps } from './components/Accordion';
export { Breadcrumb } from './components/Breadcrumb';
export type { BreadcrumbItem, BreadcrumbProps } from './components/Breadcrumb';
export { Calendar } from './components/Calendar';
export type { CalendarProps, CalendarMarker } from './components/Calendar';
export { Carousel } from './components/Carousel';
export type { CarouselProps, CarouselSlide } from './components/Carousel';
export { WorkspaceBreadcrumb } from './components/WorkspaceBreadcrumb';
export type {
  WorkspaceBreadcrumbProps,
  WorkspaceBreadcrumbSegment,
} from './components/WorkspaceBreadcrumb';
export { DetailClosureBar } from './components/DetailClosureBar';
export type { DetailClosureBarProps, DetailClosureLink } from './components/DetailClosureBar';
export { DetailActionBar } from './components/DetailActionBar';
export type {
  DetailActionBarProps,
  DetailActionBarAction,
  DetailActionBarIcon,
} from './components/DetailActionBar';
export { Chart } from './components/Chart';
export type { ChartProps, ChartDataPoint, ChartType } from './components/Chart';
export { GaugeChart } from './components/GaugeChart';
export type { GaugeChartProps, GaugeSegment } from './components/GaugeChart';
export { AIDecisionPanel } from './components/AIDecisionPanel';
export type {
  AIDecisionPanelProps,
  RuleExecutionResult,
  RuleExecutionStatus,
  RuleExecutionSummary,
} from './components/AIDecisionPanel';
export { HeatmapChart } from './components/HeatmapChart';
export type { HeatmapChartProps, HeatmapCell, HeatmapColorScheme } from './components/HeatmapChart';
export { AnomalyAlertPanel } from './components/AnomalyAlertPanel';
export type {
  AnomalyAlertPanelProps,
  AnomalyAlert,
  AnomalySeverity,
  AnomalySource,
  AnomalySummary,
} from './components/AnomalyAlertPanel';
export { StoreManagerDashboard } from './components/StoreManagerDashboard';
export type {
  StoreManagerDashboardProps,
  StoreDailyMetrics,
  PendingTask,
  DeviceStatusSummary,
  QuickAction,
} from './components/StoreManagerDashboard';
export { FrontDeskPanel } from './components/FrontDeskPanel';
export type {
  FrontDeskPanelProps,
  BasketItem,
  CheckoutStatus,
  QueueItem,
  QuickFnButton,
  PaymentMethod,
} from './components/FrontDeskPanel';
export { SalesClerkTool } from './components/SalesClerkTool';
export type {
  SalesClerkToolProps,
  DailyReceptionStats,
  FollowUpClient,
  SalesScript,
  MemberQuickLookup,
} from './components/SalesClerkTool';
export { OperationsManagerDashboard } from './components/OperationsManagerDashboard';
export type {
  OperationsManagerDashboardProps,
  DistrictSummary,
  DistrictStoreSnapshot,
  InspectionTask,
  OpsQuickAction,
} from './components/OperationsManagerDashboard';
export { ConciergePanel } from './components/ConciergePanel';
export type {
  ConciergePanelProps,
  MemberServiceOverview,
  PointsTransaction,
  MemberVisitRecord,
  PersonalizedRecommendation,
  ConciergeAction,
} from './components/ConciergePanel';
export { StatusBadge, StatusBadgeGroup } from './components/StatusBadge';
export { Tag, TagGroup } from './components/Tag';
export type { TagProps, TagVariant } from './components/Tag';
export { DateTimePicker } from './components/DateTimePicker';
export type { DateTimePickerMode, DateTimePickerProps } from './components/DateTimePicker';
export { TimePicker } from './components/TimePicker';
export type { TimePickerProps } from './components/TimePicker';
export { Card } from './components/Card';
export { StatCard } from './components/StatCard';
export { QuickStats } from './components/QuickStats';
export type { QuickStatItem, QuickStatsProps } from './components/QuickStats';
export { DataTable } from './components/DataTable';
export type { DataTableColumn } from './components/DataTable';
export { Table } from './components/Table';
export type {
  TableColumn,
  TableSortState,
  TablePaginationState,
  TableProps,
} from './components/Table';
export { PaginatedDataTableCard } from './components/PaginatedDataTableCard';
export { Pagination, usePagination } from './components/Pagination';
export { Progress } from './components/Progress';
export type { ProgressProps } from './components/Progress';
export { ScrollArea } from './components/ScrollArea';
export type { ScrollAreaProps } from './components/ScrollArea';
export { PageShell } from './components/PageShell';
export { DetailShell } from './components/DetailShell';
export type { DetailShellAction } from './components/DetailShell';
export { EmptyState } from './components/EmptyState';
export { LoadingSkeleton } from './components/LoadingSkeleton';
export { Tabs } from './components/Tabs';
export { FilterBar } from './components/FilterBar';
export { ListToolbar } from './components/ListToolbar';
export type {
  ListToolbarProps,
  ListToolbarSortOption,
  ListToolbarFilterOption,
  ListToolbarViewMode,
  ListToolbarBatchAction,
} from './components/ListToolbar';
export { FilterChips } from './components/FilterChips';
export type { FilterChip, FilterChipsProps } from './components/FilterChips';
export { useListPageSectionState, listPageStatCardStyle } from './components/ListPageScaffold';
export type { ListPageFacetConfig, ListPageFacetState } from './components/ListPageScaffold';
export { Modal } from './components/Modal';
export type { ModalProps } from './components/Modal';
export { Drawer } from './components/Drawer';
export type { DrawerProps, DrawerPlacement } from './components/Drawer';
export { Dropdown } from './components/Dropdown';
export type { DropdownItem, DropdownProps } from './components/Dropdown';
export { Select } from './components/Select';
export type { SelectOption, SelectProps } from './components/Select';
export { MultiSelect } from './components/MultiSelect';
export type { MultiSelectOption, MultiSelectProps } from './components/MultiSelect';
export { RuntimeGovernancePanelTemplate } from './components/RuntimeGovernancePanel';
export {
  FoundationConsumerWiringSection,
  GovernanceQuickViewSection,
} from './components/FoundationConsumerSections';
export { PortalConsumerGovernanceSection } from './components/PortalConsumerGovernanceSection';
export {
  createFoundationAlertLinkedOverviewStats,
  FoundationAlertLinkedOverviewSection,
  FoundationAlertLinkedOverviewSurface,
} from './components/FoundationAlertLinkedOverview';
export {
  FoundationAlertAcknowledgeActionButton,
  createFoundationAdminGovernanceStatsCopy,
  buildFoundationAlertDrilldownSections,
  buildFoundationAlertLytConnectionGovernanceSections,
  buildFoundationAlertRecordFromDrilldown,
  formatFoundationAlertActionLabel,
  formatFoundationAlertDrilldownDateTime,
  foundationAdminGovernanceListPreset,
  foundationAdminGovernanceSourceLabels,
  FoundationAlertDetailsReadout,
  FoundationAlertDemoListPage,
  createFoundationAlertTableColumns,
  createFoundationAlertDetailMockMap,
  createFoundationAlertMockRecords,
  mapFoundationGovernanceAlertsToRecords,
  FoundationAlertDetailView,
  useFoundationAlertDemoAcknowledge,
  FoundationAlertOverviewReadout,
  FoundationAlertPresetDetailRoute,
  foundationAlertDetailDemoPresets,
  foundationAlertListDemoPresets,
  FoundationAlertListPageSection,
  FoundationAlertTableCard,
  foundationAlertSeverityLabels,
  foundationAlertStatusLabels,
} from './components/FoundationAlertViews';
export {
  createRuntimeOperationTableColumns,
  createRuntimeOperationDetailMockMap,
  RuntimeOperationDateTimeReadout,
  RuntimeOperationDemoListPage,
  RuntimeOperationIdReadout,
  createRuntimeOperationMockRecords,
  RuntimeOperationDetailView,
  RuntimeOperationOverviewReadout,
  RuntimeOperationReceiptListReadout,
  RuntimeOperationPresetDetailRoute,
  RuntimeOperationStatusReadout,
  RuntimeOperationTargetReadout,
  RuntimeOperationTimelineReadout,
  RuntimeOperationTypeReadout,
  runtimeOperationDetailDemoPresets,
  runtimeOperationListDemoPresets,
  RuntimeOperationsListPageSection,
  RuntimeOperationsTableCard,
  runtimeOperationStatusLabels,
  runtimeOperationStatusVariants,
} from './components/RuntimeOperationViews';
export { useSearchFilter } from './components/LinkedOverviewStubs';
export { SearchFilterInput } from './components/SearchFilterInput';
export { FormField } from './components/FormField';
export { FormSubmitFeedback, useFormSubmit } from './components/FormSubmitFeedback';
export { SubmitButton } from './components/SubmitButton';
export type { SubmitButtonProps, SubmitButtonVariant } from './components/SubmitButton';
export { InfoRow, ConfirmDialog } from './components/InfoRow';
export { Alert, useAlert } from './components/Alert';
export type { AlertProps, AlertVariant, AlertState, UseAlertOptions } from './components/Alert';
export { CopyToClipboard } from './components/CopyToClipboard';
export { VirtualizedList } from './components/VirtualizedList';
export type { VirtualizedListProps, VirtualizedListRow } from './components/VirtualizedList';
export { FileUpload } from './components/FileUpload';
export type { FileUploadProps, UploadedFile } from './components/FileUpload';
export { Switch } from './components/Switch';
export type { SwitchProps, SwitchSize } from './components/Switch';
export { RadioGroup } from './components/RadioGroup';
export type {
  RadioGroupProps,
  RadioOption,
  RadioSize,
  RadioDirection,
} from './components/RadioGroup';
export { Tooltip } from './components/Tooltip';
export type { TooltipProps, TooltipPlacement } from './components/Tooltip';
export { Popover } from './components/Popover';
export type { PopoverProps, PopoverPlacement } from './components/Popover';
export { ToastContainer, useToast } from './components/Toast';
export type { ToastEntry, ToastOptions, ToastVariant, UseToastReturn } from './components/Toast';
export { Timeline } from './components/Timeline';
export type { TimelineProps, TimelineItem, TimelineItemVariant } from './components/Timeline';
export {
  FoundationAlertPanelFrame,
  FoundationAlertPanelSurface,
  foundationAlertPanelThemePresets,
  useFoundationAsyncLoader,
} from './components/FoundationAlertPanel';
export type {
  FoundationAlertPanelPalette,
  FoundationAlertPanelToolbarPalette,
  FoundationAlertPanelThemePreset,
  FoundationAlertPanelClientAccess,
  GovernanceAlert,
  GovernanceReadModel,
  FoundationAlertPanelSurfaceProps,
} from './components/FoundationAlertPanel';
export {
  FoundationAlertLinkedAlertGridReadout,
  FoundationAlertLinkedFocusBarReadout,
  FoundationAlertLinkedOverviewStatsReadout,
  createFoundationAlertNextNavigationBindings,
  useFoundationAlertLinkedFocusQuery,
  canReplayRuntimePanelAction,
  createRuntimeReceiptStatusCardProps,
  createRuntimeOperationToolbarProps,
  hasRuntimePanelReceiptCode,
  RuntimeOperationToolbar,
  RuntimePanelFeedback,
  RuntimePanelFrame,
  RuntimePanelGrid,
  joinRuntimeScopeSummary,
  useRuntimePresetSelection,
  useRuntimePanelState,
  RuntimePresetCard,
  RuntimePresetSelector,
  RuntimeReceiptStatusCard,
  executeRuntimePanelOperation,
  PortalList,
  type PortalListItemView,
  formatRuntimeCallbackStalledDuration,
  describeRuntimeCallbackStalledEscalation,
  FoundationAlertRuntimeCallbackStalledReadout,
  summarizeRuntimePanelReceipt,
  canReplayRuntimePanelReceipt,
  getRuntimePanelTenantId,
  createRuntimeReceiptStatusCard,
  RuntimeReceiptEvents,
  refreshFoundationAlertSelection,
  useSortedItems,
} from './components/LinkedOverviewStubs';
export type { DataTableSortConfig } from './components/LinkedOverviewStubs';
export type { RuntimeGovernancePanelPreset } from './components/RuntimeGovernancePanel';
export type {
  FoundationConsumerWiringSectionProps,
  GovernanceQuickViewSectionProps,
} from './components/FoundationConsumerSections';
export type { PortalConsumerGovernanceSectionProps } from './components/PortalConsumerGovernanceSection';
export type {
  FoundationAlertLinkedOverviewCardDefinition,
  FoundationAlertLinkedOverviewStatsPreset,
  FoundationAlertLinkedOverviewSummaryLike,
  FoundationAlertLinkedOverviewPanelRenderArgs,
  FoundationAlertLinkedOverviewPalette,
  FoundationAlertLinkedOverviewSurfaceProps,
} from './components/FoundationAlertLinkedOverview';
export type { FoundationAlertRecord } from './components/FoundationAlertViews';
export type {
  RuntimeOperationReceiptRecord,
  RuntimeOperationRecord,
} from './components/RuntimeOperationViews';
export {
  FoundationAlertPanelSelectedAlertReadout,
  FoundationAlertPanelSourceSummaryReadout,
  FoundationAlertPanelOwnerSummaryReadout,
  FoundationAlertPanelSummaryDigestReadout,
  FoundationAlertPanelTimelineReadout,
  createFoundationAlertPanelSectionStyle,
  createFoundationAlertPanelSelectionButtonStyle,
  createFoundationAlertPanelActionButtonStyle,
  createFoundationAlertPanelFeedbackStyle,
  createFoundationAlertPanelFilterButtonStyle,
  createFoundationAlertPanelFilterChipStyle,
  createFoundationAlertPanelSummaryCardStyle,
  createFoundationAlertPanelShortcutCardStyle,
  useFoundationAlertGovernanceState,
  useFoundationAlertDrilldownQuery,
  useFoundationAlertMutationController,
  useFoundationAlertTimelineQueryState,
  useFoundationAlertViewLinkController,
  useFoundationAlertFocusSync,
} from './components/FoundationAlertPanelReadouts';
export type {
  FoundationAlertPanelReadoutPalette,
  FoundationAlertGovernanceAlert,
  FoundationAlertTimelineItem,
  FoundationAlertSourceSummaryItem,
  FoundationAlertOwnerSummaryItem,
  FoundationAlertFilterSummaryItem,
  FoundationAlertTimelineMetrics,
  FoundationAlertFilterState,
  FoundationAlertGovernance,
  FoundationAlertMutationAction,
  FoundationAlertMutation,
  FilterShortcut,
} from './components/FoundationAlertPanelReadouts';
export { FormPageScaffold, validateFormFields } from './components/FormPageScaffold';
export type {
  FormPageField,
  FormPageFieldRule,
  FormPageScaffoldMeta,
  FormPageScaffoldProps,
  FormPageSubmitResult,
} from './components/FormPageScaffold';
export { CombinedDetailPage } from './components/CombinedDetailPage';
export type {
  CombinedDetailPageProps,
  DetailInfoRow,
  DetailTab,
  TransitionAction,
} from './components/CombinedDetailPage';
export { Stepper } from './components/Stepper';
export type { StepperProps, StepperStep } from './components/Stepper';
export { Input } from './components/Input';
export type { InputProps, InputSize, InputVariant } from './components/Input';
export { Checkbox } from './components/Checkbox';
export type { CheckboxProps, CheckboxSize } from './components/Checkbox';
export { Combobox } from './components/Combobox';
export type { ComboboxProps, ComboboxOption } from './components/Combobox';
export { ContentSwitcher } from './components/ContentSwitcher';
export type { ContentSwitcherProps, ContentSwitcherSegment } from './components/ContentSwitcher';
export { ContextMenu } from './components/ContextMenu';
export type {
  ContextMenuProps,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuEntry,
} from './components/ContextMenu';
export { default as DateRangePicker } from './components/DateRangePicker';
export type {
  DateRangePickerProps,
  DateRangeValue,
  DateRangePreset,
} from './components/DateRangePicker';
export { MemberTierDistribution } from './components/MemberTierDistribution';
export type { MemberTierDistributionProps, MemberTier } from './components/MemberTierDistribution';
export { NotificationCenter, useNotificationSummary } from './components/NotificationCenter';
export type {
  NotificationCenterProps,
  NotificationItem,
  NotificationAction,
  NotificationSummary,
  NotificationSeverity,
  NotificationCategory,
} from './components/NotificationCenter';
export { ConfigurationPosturePanel } from './components/ConfigurationPosturePanel';
export type {
  ConfigurationPosturePanelProps,
  SecretPosture,
  CertificatePosture,
} from './components/ConfigurationPosturePanel';
export { DecisionAuditTrail } from './components/DecisionAuditTrail';
export type {
  DecisionAuditTrailProps,
  AuditEntry,
  AuditAction,
  AuditSeverity,
  AuditSummary,
  AuditFilter,
} from './components/DecisionAuditTrail';
export { ImagePreview } from './components/ImagePreview';
export type { ImagePreviewProps, ImageItem } from './components/ImagePreview';
export { Slider } from './components/Slider';
export type { SliderProps } from './components/Slider';
export { InputNumber } from './components/InputNumber';
export type { InputNumberProps, InputNumberSize } from './components/InputNumber';
export { PasswordInput } from './components/PasswordInput';
export type { PasswordInputProps } from './components/PasswordInput';
export { ErrorBoundary } from './components/ErrorBoundary';
export type {
  ErrorBoundaryProps,
  ErrorBoundarySeverity,
  ErrorBoundaryFallbackArgs,
} from './components/ErrorBoundary';
export { Tree } from './components/Tree';
export type { TreeNode, TreeProps } from './components/Tree';
export { CommandPalette } from './components/CommandPalette';
export type { CommandPaletteProps, CommandItem } from './components/CommandPalette';
export { DeviceStatusPanel, computeDeviceSummary } from './components/DeviceStatusPanel';
export type {
  DeviceEntry,
  DeviceStatus,
  DeviceType,
  DevicePanelSummary,
  DeviceStatusPanelProps,
} from './components/DeviceStatusPanel';
export { DeviceInspectionPanel } from './components/DeviceInspectionPanel';
export type {
  InspectionItem,
  InspectionMetrics,
  InspectionAlert,
  InspectionSummary,
  DeviceInspectionPanelProps,
} from './components/DeviceInspectionPanel';
export { MemberLevelDistribution } from './components/MemberLevelDistribution';
export type {
  MemberLevel,
  MemberLevelDistributionProps,
} from './components/MemberLevelDistribution';
export { AISummaryCard } from './components/AISummaryCard';
export type {
  AISummaryCardProps,
  HighlightMetric,
  InsightItem,
  TrendDirection,
} from './components/AISummaryCard';
export { Rating } from './components/Rating';
export type { RatingProps } from './components/Rating';
export { SmartTrendChart } from './SmartTrendChart';
export type { SmartTrendChartProps, TrendDataPoint } from './SmartTrendChart';
