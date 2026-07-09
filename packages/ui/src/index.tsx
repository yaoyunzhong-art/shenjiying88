// --------------- @m5/ui shared component library ---------------
export { ArcadeRevenueCard } from './components/ArcadeRevenueCard';
export type { ArcadeRevenueCardProps, MachineStats, MachineStatus } from './components/ArcadeRevenueCard';

export { ConfigurationVersionDiff } from './components/ConfigurationVersionDiff';
export type { ConfigurationVersionDiffProps, DiffEntry, DiffChangeType } from './components/ConfigurationVersionDiff';

export { Divider } from './components/Divider';
export type { DividerProps, DividerOrientation, DividerVariant } from './components/Divider';

export { DotNavigation } from './components/DotNavigation';
export type { DotNavigationProps, DotVariant, DotSize } from './components/DotNavigation';

export { Dialog } from './components/Dialog';
export type { DialogProps } from './components/Dialog';

export { ReceiptPreview } from './components/ReceiptPreview';
export type { ReceiptPreviewProps, ReceiptData, ReceiptHeader, ReceiptLineItem, ReceiptPayment, PaymentMethod as ReceiptPaymentMethod } from './components/ReceiptPreview';

export { Badge } from './components/Badge';
export type { BadgeProps, BadgeVariant, BadgePlacement, BadgeSize } from './components/Badge';
export { Chip } from './components/Chip';
export type { ChipProps, ChipVariant, ChipSize } from './components/Chip';
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
export { BreadcrumbPageHeader } from './components/BreadcrumbPageHeader';
export type { BreadcrumbPageHeaderProps, BreadcrumbPageHeaderAction } from './components/BreadcrumbPageHeader';
export { Calendar } from './components/Calendar';
export type { CalendarProps, CalendarMarker } from './components/Calendar';
export { Cascader } from './components/Cascader';
export type { CascaderOption, CascaderProps } from './components/Cascader';
export { ColorPicker } from './components/ColorPicker';
export type { ColorPickerProps, PresetColor, HSBColor, RGBColor, ColorValue } from './components/ColorPicker';
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
export { FunnelChart } from './components/FunnelChart';
export type { FunnelChartProps, FunnelStep } from './components/FunnelChart';
export { PerformanceRanking } from './components/PerformanceRanking';
export type { PerformanceRankingProps, RankingItem } from './components/PerformanceRanking';
export { AIDecisionPanel } from './components/AiDecisionPanel';
export type { DecisionRuleResult, DecisionPanelConfig, RuleExecutionStatus } from './components/AiDecisionPanel';
export { HeatmapChart } from './components/HeatmapChart';
export type { HeatmapChartProps, HeatmapCell, HeatmapColorScheme } from './components/HeatmapChart';
export { RadarChart } from './components/RadarChart';
export type { RadarChartProps, RadarDimension, RadarSeries } from './components/RadarChart';
export { AIAgentThinkingPanel } from './components/AIAgentThinkingPanel';
export type {
  AIAgentThinkingPanelProps,
  ReasoningStep,
  ReasoningStepStatus,
  AgentConclusion,
} from './components/AIAgentThinkingPanel';
export { AIAnalysisInsightsPanel } from './components/AIAnalysisInsightsPanel';
export type {
  AIAnalysisInsightsPanelProps,
  AnalysisInsight,
  InsightCategory,
  InsightSeverity,
} from './components/AIAnalysisInsightsPanel';
export { AIAgentChatPanel } from './components/AIAgentChatPanel';
export type {
  AIAgentChatPanelProps,
  ChatMessage,
  ChatMessageRole,
  ChatMessageStatus,
} from './components/AIAgentChatPanel';
export { AIAgentWorkloadDistributionPanel } from './components/AIAgentWorkloadDistributionPanel';
export type {
  AIAgentWorkloadDistributionPanelProps,
  AgentWorkload,
} from './components/AIAgentWorkloadDistributionPanel';
export { AIAgentToolCallPanel } from './components/AIAgentToolCallPanel';
export type {
  AIAgentToolCallPanelProps,
  ToolCallRecord,
  ToolCallStatus,
  ToolCallParameter,
} from './components/AIAgentToolCallPanel';
export { AISmartInsightPanel } from './components/AISmartInsightPanel';
export type {
  AISmartInsightPanelProps,
  SmartInsight,
  SmartInsightPriority,
  SmartInsightCategory,
} from './components/AISmartInsightPanel';
export { AIScenarioSimulator } from './components/AIScenarioSimulator';
export type {
  AIScenarioSimulatorProps,
  ScenarioVariable,
  SimulationResult,
} from './components/AIScenarioSimulator';
export { AIDemandForecastPanel } from './components/AIDemandForecastPanel';
export type {
  AIDemandForecastPanelProps,
  DemandForecastEntry,
  DemandForecastDimension,
  ForecastModelMeta,
} from './components/AIDemandForecastPanel';

export { AIExperimentOptimizationPanel } from './components/AIExperimentOptimizationPanel';
export type {
  AIExperimentOptimizationPanelProps,
  ExperimentEntry,
  ExperimentVariant,
  ExperimentStatus,
  OptimizationSuggestion,
} from './components/AIExperimentOptimizationPanel';

export { AIDeviceFaultPredictionPanel } from './components/AIDeviceFaultPredictionPanel';
export type {
  AIDeviceFaultPredictionPanelProps,
  DeviceFaultPrediction,
  FaultPredictionSummary,
  FaultSeverity,
  PredictionStatus,
  DeviceCategory,
} from './components/AIDeviceFaultPredictionPanel';

export { AICompetitiveAnalysisPanel } from './components/AICompetitiveAnalysisPanel';
export type {
  AICompetitiveAnalysisPanelProps,
  CompetitorEntry,
  CompetitorDimension,
  CompetitorMetric,
  AICompetitiveSuggestion,
} from './components/AICompetitiveAnalysisPanel';

export { AIExecutionAuditPanel } from './components/AIExecutionAuditPanel';
export type {
  AIExecutionAuditPanelProps,
  AIExecutionRecord,
  ExecutionStatus,
} from './components/AIExecutionAuditPanel';
export { AnomalyAlertPanel } from './components/AnomalyAlertPanel';
export type {
  AnomalyAlertPanelProps,
  AnomalyAlert,
  AnomalySeverity,
} from './components/AnomalyAlertPanel';
export { AnomalyAlertTrendPanel } from './components/AnomalyAlertTrendPanel';
export type {
  AnomalyAlertTrendPanelProps,
  AlertTrendDataPoint,
  TrendGranularity,
} from './components/AnomalyAlertTrendPanel';
export { StoreManagerDashboard } from './components/StoreManagerDashboard';
export { TrainingManagerDashboard } from './components/TrainingManagerDashboard';
export { RegionalManagerDashboard } from './components/RegionalManagerDashboard';
export type {
  RegionalManagerDashboardProps,
  RegionalSummary,
  RegionStoreSnapshot,
  RegionalQuickAction,
  MonthlyTarget,
} from './components/RegionalManagerDashboard';
export { InspectionChecklist } from './components/InspectionChecklist';
export type {
  InspectionChecklistProps,
  InspectionItem,
  InspectionItemStatus,
  InspectionResult,
} from './components/InspectionChecklist';
export type {
  StoreManagerDashboardProps,
  StoreDailyMetrics,
  PendingTask,
  DeviceStatusSummary,
  QuickAction,
} from './components/StoreManagerDashboard';
export type {
  TrainingManagerDashboardProps,
  TrainingDailyMetrics,
  TrainingSession,
  PendingCertification,
  TrainingNeed,
} from './components/TrainingManagerDashboard';
export { StaffShiftSchedulePanel } from './components/StaffShiftSchedulePanel';
export type {
  StaffShiftSchedulePanelProps,
  ShiftAssignment,
  ShiftSlot,
} from './components/StaffShiftSchedulePanel';
export { MemberMarketerDashboard } from './components/MemberMarketerDashboard';
export type {
  MemberMarketerDashboardProps,
  CampaignSnapshot,
  MemberGrowthMetrics,
  MarketingKpi,
  MarketerQuickAction,
} from './components/MemberMarketerDashboard';
export { FrontDeskPanel } from './components/FrontDeskPanel';
export { FrontDeskSupervisorDashboard } from './components/FrontDeskSupervisorDashboard';
export type {
  FrontDeskPanelProps,
  BasketItem,
  CheckoutStatus,
  QueueItem,
  QuickFnButton,
  PaymentMethod,
} from './components/FrontDeskPanel';
export type {
  FrontDeskSupervisorDashboardProps,
  StaffShiftInfo,
  QueueOverview,
  FrontDeskMetrics,
  ServiceRecord,
} from './components/FrontDeskSupervisorDashboard';
export { VenueSupervisorDashboard } from './components/VenueSupervisorDashboard';
export type {
  VenueSupervisorDashboardProps,
  ZoneDeviceStatus,
  VenueTraffic,
  VenueRevenue,
  VenueAlert,
} from './components/VenueSupervisorDashboard';
export { SalesClerkTool } from './components/SalesClerkTool';
export type {
  SalesClerkToolProps,
  DailyReceptionStats,
  FollowUpClient,
  SalesScript,
  MemberQuickLookup,
} from './components/SalesClerkTool';
export { AppointmentBookingPanel } from './components/AppointmentBookingPanel';
export type {
  AppointmentBookingPanelProps,
  ServiceItem,
  TimeSlot,
  Appointment,
  AppointmentStatus,
  BookingParams,
} from './components/AppointmentBookingPanel';
export { SalesConversionFunnel } from './components/SalesConversionFunnel';
export type {
  SalesConversionFunnelProps,
  FunnelStage,
} from './components/SalesConversionFunnel';

export { OperationsManagerDashboard } from './components/OperationsManagerDashboard';
export type {
  OperationsManagerDashboardProps,
  DistrictSummary,
  DistrictStoreSnapshot,
  InspectionTask,
  OpsQuickAction,
} from './components/OperationsManagerDashboard';
export { FinanceManagerDashboard } from './components/FinanceManagerDashboard';
export type {
  FinanceManagerDashboardProps,
  FinanceSummary,
  FinanceTransaction,
  BudgetOverview,
  BudgetOverviewItem,
} from './components/FinanceManagerDashboard';
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
export { TagInput } from './components/TagInput';
export type { TagInputProps } from './components/TagInput';
export { DateTimePicker } from './components/DateTimePicker';
export type { DateTimePickerMode, DateTimePickerProps } from './components/DateTimePicker';
export { TimePicker } from './components/TimePicker';
export type { TimePickerProps } from './components/TimePicker';
export { MonthPicker } from './components/MonthPicker';
export type { MonthPickerProps } from './components/MonthPicker';
export { WeekPicker } from './components/WeekPicker';
export type { WeekPickerProps } from './components/WeekPicker';
export { Card } from './components/Card';
export { StatCard } from './components/StatCard';
export { KpiSummaryCard } from './components/KpiSummaryCard';
export type { KpiSummaryCardProps, KpiCardItem } from './components/KpiSummaryCard';
export { Statistic } from './components/Statistic';
export type { StatisticProps, StatisticVariant, StatisticSize, StatisticLayout } from './components/Statistic';
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
export { ProgressRing } from './components/ProgressRing';
export type { ProgressRingProps } from './components/ProgressRing';

export { TreeSelect } from './components/TreeSelect';
export type { TreeSelectProps, TreeSelectNode } from './components/TreeSelect';

export { ProgressCard } from './components/ProgressCard';
export type { ProgressCardProps } from './components/ProgressCard';
export { ScrollArea } from './components/ScrollArea';
export type { ScrollAreaProps } from './components/ScrollArea';
export { PageShell } from './components/PageShell';
export { DetailShell } from './components/DetailShell';
export type { DetailShellAction } from './components/DetailShell';
export { EmptyState } from './components/EmptyState';
export { Label } from './components/Label';
export type { LabelProps, LabelSize, LabelWeight, LabelColor } from './components/Label';
export { LoadingSkeleton } from './components/LoadingSkeleton';
export { Skeleton } from './components/Skeleton';
export type { SkeletonProps } from './components/Skeleton';
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
export { CodeBlock } from './components/CodeBlock';
export type { CodeBlockProps } from './components/CodeBlock';
export { VirtualizedList } from './components/VirtualizedList';
export type { VirtualizedListProps, VirtualizedListRow } from './components/VirtualizedList';
export { FeedbackWidget } from './components/FeedbackWidget';
export type { FeedbackWidgetProps } from './components/FeedbackWidget';
export { FileUpload } from './components/FileUpload';
export type { FileUploadProps, UploadFile } from './components/FileUpload';
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
export type { ProcurementManagerDashboardProps, ProcurementSummary, PurchaseOrderSnapshot, SupplierOverview } from './components/ProcurementManagerDashboard';
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
export { TextArea } from './components/TextArea';
export type { TextAreaProps, TextAreaSize, TextAreaResize } from './components/TextArea';
export { Checkbox } from './components/Checkbox';
export type { CheckboxProps, CheckboxSize } from './components/Checkbox';
export { Collapse } from './components/Collapse';
export type { CollapseProps, CollapseSize, CollapseVariant } from './components/Collapse';
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
export { DropdownMenu } from './components/DropdownMenu';
export type {
  DropdownMenuProps,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuEntry,
} from './components/DropdownMenu';
export { default as DateRangePicker } from './components/DateRangePicker';
export type {
  DateRangePickerProps,
  DateRangeValue,
  DateRangePreset,
} from './components/DateRangePicker';
export { default as DatePicker } from './components/DatePicker';
export type {
  DatePickerProps,
} from './components/DatePicker';
export { MemberTierDistribution } from './components/MemberTierDistribution';
export type { MemberTierDistributionProps, MemberTier } from './components/MemberTierDistribution';
export { NotificationBell } from './components/NotificationBell';
export type { NotificationBellProps, NotificationItem as NotificationBellItem } from './components/NotificationBell';

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
export { ProcurementManagerDashboard } from './components/ProcurementManagerDashboard';
export { PurchaseOrderPanel } from './components/PurchaseOrderPanel';
export type { PurchaseOrderPanelProps, PurchaseOrderDetail, PurchaseOrderLineItem, PurchaseOrderPanelActions } from './components/PurchaseOrderPanel';
export { MarketingManagerDashboard } from './components/MarketingManagerDashboard';
export type {
  MarketingManagerDashboardProps,
  MarketingGrowthMetrics,
  ChannelEffectiveness,
  MarketingQuickAction,
} from './components/MarketingManagerDashboard';
export type { CampaignSnapshot as MarketingCampaignSnapshot } from './components/MarketingManagerDashboard';
export { ProductManagerDashboard } from './components/ProductManagerDashboard';
export type {
  ProductManagerDashboardProps,
  ProductGrowthMetrics,
  ProductSnapshot,
  CategoryStat,
  ProductQuickAction,
} from './components/ProductManagerDashboard';
export type { ProductSnapshot as ProductDashboardSnapshot } from './components/ProductManagerDashboard';
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
  InspectionItem as DeviceInspectionItem,
  InspectionMetrics,
  InspectionAlert,
  InspectionSummary,
  DeviceInspectionPanelProps,
} from './components/DeviceInspectionPanel';
export { MemberFollowUpTaskPanel } from './components/MemberFollowUpTaskPanel';
export type {
  MemberFollowUpTaskPanelProps,
  FollowUpRecord,
  FollowUpPriority,
  FollowUpTaskStatus,
  FollowUpCategory,
} from './components/MemberFollowUpTaskPanel';

export { MemberLevelDistribution } from './components/MemberLevelDistribution';
export { MemberRechargePanel } from './components/MemberRechargePanel';
export type {
  MemberRechargePanelProps,
  RechargePlan,
  RechargeRecord,
  RechargePaymentMethod,
} from './components/MemberRechargePanel';
export type {
  MemberLevel,
  MemberLevelDistributionProps,
} from './components/MemberLevelDistribution';
export { MemberRFMAnalysisPanel } from './components/MemberRFMAnalysisPanel';
export type {
  RFMRecord,
  RFMSegment,
  RFMSegmentInfo,
  MemberRFMAnalysisPanelProps,
} from './components/MemberRFMAnalysisPanel';
export { AIMemberChurnPredictionPanel } from './components/AIMemberChurnPredictionPanel';
export type {
  AIMemberChurnPredictionPanelProps,
  ChurnPrediction,
  ChurnRiskLevel,
  ChurnSignalFactor,
  RetentionAction,
} from './components/AIMemberChurnPredictionPanel';
export { AISummaryCard } from './components/AISummaryCard';
export type {
  AISummaryCardProps,
  HighlightMetric,
  InsightItem,
  TrendDirection,
} from './components/AISummaryCard';
export { AISuggestionCard } from './components/AISuggestionCard';
export type {
  AISuggestionCardProps,
  SuggestionItem,
  SuggestionPriority,
  SuggestionSource,
} from './components/AISuggestionCard';
export { AIPricingRecommendationPanel } from './components/AIPricingRecommendationPanel';
export type {
  AIPricingRecommendationPanelProps,
  PricingRecommendation,
  PricingSummary,
} from './components/AIPricingRecommendationPanel';
export { Rating } from './components/Rating';
export type { RatingProps } from './components/Rating';
export { BranchSelector, findNodeById, collectLeafIds } from './components/BranchSelector';
export type { BranchSelectorNode, BranchSelectorProps } from './components/BranchSelector';

export { RuleRecommendationPanel } from './components/RuleRecommendationPanel';
export type {
  RuleRecommendationPanelProps,
  RuleRecommendation,
  RecommendationConfidence,
  RecommendationCategory,
  RecommendationSummary,
} from './components/RuleRecommendationPanel';

export { SalesForecastPanel } from './components/SalesForecastPanel';
export type {
  SalesForecastPanelProps,
  ForecastDataPoint,
  ForecastTrend,
  ForecastAccuracy,
} from './components/SalesForecastPanel';

export { WorkbenchHeader } from './components/WorkbenchHeader';
export type {
  WorkbenchHeaderProps,
  WorkbenchNavItem,
  WorkbenchBreadcrumb,
} from './components/WorkbenchHeader';

export { SideNavigation } from './components/SideNavigation';
export type { SideNavigationProps, SideNavItem } from './components/SideNavigation';

export { AssistantManagerDashboard } from './components/AssistantManagerDashboard';
export type {
  AssistantManagerDashboardProps,
  StaffScheduleEntry,
  TrainingProgress,
  QualityMetrics,
  ShiftHandover,
  HandoverItem,
  AsstQuickAction,
} from './components/AssistantManagerDashboard';

export { CustomerServiceDashboard } from './components/CustomerServiceDashboard';
export type {
  CustomerServiceDashboardProps,
  ServiceTicket,
  ServiceQualityMetrics,
  AgentStatusSummary,
} from './components/CustomerServiceDashboard';

export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';

export { Spinner } from './components/Spinner';
export type { SpinnerProps, SpinnerSize, SpinnerVariant } from './components/Spinner';
export { LoadingOverlay } from './components/LoadingOverlay';
export type { LoadingOverlayProps, OverlayMode } from './components/LoadingOverlay';

export { Steps } from './components/Steps';
export type { StepsProps, StepItem, StepStatus, StepsSize, StepsOrientation } from './components/Steps';

export { SplitPane } from './components/SplitPane';
export type { SplitPaneProps, SplitDirection } from './components/SplitPane';

export { SmartTrendAnalysisPanel } from './components/SmartTrendAnalysisPanel';
export type {
  SmartTrendAnalysisPanelProps,
  TrendAnalysis,
  ForecastPoint,
} from './components/SmartTrendAnalysisPanel';
export type { TrendDirection as TrendAnalysisDirection } from './components/SmartTrendAnalysisPanel';

export { UsageMetricsPanel } from './components/UsageMetricsPanel';
export type {
  UsageMetricsPanelProps,
  UsageMetric,
} from './components/UsageMetricsPanel';

export { SmartTrendChart } from './SmartTrendChart';
export type { SmartTrendChartProps, TrendDataPoint } from './SmartTrendChart';
export { TierDistributionChart } from './TierDistributionChart';
export type { TierDistributionChartProps, TierData } from './TierDistributionChart';

export { ExportButton, serializeToCsv } from './components/ExportButton';
export type { ExportButtonProps, ExportFormat } from './components/ExportButton';
export { MetricsDashboardGrid } from './components/MetricsDashboardGrid';
export type { MetricsDashboardGridProps, MetricTile } from './components/MetricsDashboardGrid';

export { StatTrend } from './components/StatTrend';
export type { StatTrendProps, TrendDirection as TrendIndicatorDirection } from './components/StatTrend';

export { AutoComplete } from './components/AutoComplete';
export type { AutoCompleteProps, AutoCompleteOption } from './components/AutoComplete';

export { DrilldownTrendCard } from './components/DrilldownTrendCard';
export type {
  DrilldownTrendCardProps,
  SparklinePoint,
  DrilldownDetail,
  DrilldownDetailItem,
  TrendDirection as DrilldownTrendDirection,
} from './components/DrilldownTrendCard';

export { KanbanBoard } from './components/KanbanBoard';
export type { KanbanBoardProps, KanbanColumn, KanbanCard } from './components/KanbanBoard';

export { AnomalyFrequencyTimeline } from './components/AnomalyFrequencyTimeline';
export type { AnomalyFrequencyTimelineProps, AnomalyTimeBucket } from './components/AnomalyFrequencyTimeline';

export { AnomalyPatternPanel } from './components/AnomalyPatternPanel';
export type {
  AnomalyPatternPanelProps,
  AnomalyPattern,
  AnomalyPatternType,
  PatternSeverity,
} from './components/AnomalyPatternPanel';

export { AISmartSchedulingPanel } from './components/AISmartSchedulingPanel';
export type {
  AISmartSchedulingPanelProps,
  StaffPreference,
  ScheduleSlot,
  SchedulingRecommendation,
  SchedulingConstraint,
  SchedulingConstraintType,
} from './components/AISmartSchedulingPanel';

export { StrategyConfigPanel } from './components/StrategyConfigPanel';
export type {
  StrategyConfigPanelProps,
  StrategyConfig,
  StrategyParamDef,
  StrategyParamType,
  StrategyParamOption,
  StrategyCondition,
} from './components/StrategyConfigPanel';

export { ComparisonBreakdownChart } from './components/ComparisonBreakdownChart';

export { ScenarioComparisonPanel } from './components/ScenarioComparisonPanel';
export type {
  ScenarioComparisonPanelProps,
  ScenarioItem,
  ScenarioMetric,
} from './components/ScenarioComparisonPanel';
export type {
  ComparisonBreakdownChartProps,
  ComparisonItem,
} from './components/ComparisonBreakdownChart';

export { Typography, Heading, Text, Paragraph, Caption } from './components/Typography';
export type { TypographyProps, TextVariant, TextColor, TextWeight, TextAlign, TextTransform } from './components/Typography';

export { ReconnectingBadge } from './components/ReconnectingBadge';
export type { ReconnectingBadgeProps, ReconnectingState } from './components/ReconnectingBadge';

export { OfflineBadge } from './components/OfflineBadge';
export type { OfflineBadgeProps, OfflineStatus } from './components/OfflineBadge';

export { EntertainmentGuideDashboard } from './components/EntertainmentGuideDashboard';
export type {
  EntertainmentGuideDashboardProps,
  GuideDailyMetrics,
  GuestTask,
  AreaStatus,
  PropRental,
} from './components/EntertainmentGuideDashboard';

export { QuickActionBar } from './components/QuickActionBar';
export type { QuickActionBarProps, QuickAction as QuickActionBarAction } from './components/QuickActionBar';

export { CampaignPerformancePanel } from './CampaignPerformancePanel';
export type {
  CampaignPerformancePanelProps,
  CampaignMetric,
  CampaignDataPoint,
  CampaignInsight,
} from './CampaignPerformancePanel';

export { CampaignTrendForecast } from './CampaignTrendForecast';
export type {
  CampaignTrendForecastProps,
  CampaignTrendForecastPoint,
  CampaignTrendHistoricalPoint,
  CampaignTrendModelInfo,
  CampaignTrendImpactFactor,
} from './CampaignTrendForecast';

export { ReconciliationDiffPanel } from './components/ReconciliationDiffPanel';
export type {
  ReconciliationDiffPanelProps,
  ReconciliationDiff,
  DiffSeverity,
} from './components/ReconciliationDiffPanel';

export { Result } from './components/Result';
export type { ResultProps, ResultStatus } from './components/Result';

export { RealTimeRevenueDisplay } from './components/RealTimeRevenueDisplay';
export type {
  RealTimeRevenueDisplayProps,
  RevenueSnapshot,
  RevenueTrendPoint,
  RevenueByCategory,
} from './components/RealTimeRevenueDisplay';

export { CoachDashboard } from './components/CoachDashboard';
export type { CoachDailyMetrics, FollowUpMember, PromoTask, CoachDashboardProps } from './components/CoachDashboard';

export { OTPInput } from './components/OTPInput';
export type { OTPInputSize, OTPInputVariant, OTPInputProps } from './components/OTPInput';

export { QRCodeDisplay } from './components/QRCodeDisplay';
export type { QRCodeDisplayProps, QRCodeType } from './components/QRCodeDisplay';

export { ShiftHandoverPanel } from './components/ShiftHandoverPanel';
export type {
  ShiftHandoverPanelProps,
  ShiftSummary,
  ShiftHandoverEntry,
  HandoverCategory,
} from './components/ShiftHandoverPanel';

export { SegmentedControl } from './components/SegmentedControl';
export type { SegmentedOption, SegmentedControlProps } from './components/SegmentedControl';

export { Transfer } from './components/Transfer';
export type { TransferItem, TransferProps } from './components/Transfer';

export { Masonry, WaterfallMasonry } from './components/Masonry';
export type { MasonryProps, WaterfallMasonryProps } from './components/Masonry';

export { BottomNavigation } from './components/BottomNavigation';
export type { BottomNavItem, BottomNavigationProps } from './components/BottomNavigation';

export { Collapsible } from './components/Collapsible';
export type { CollapsibleProps } from './components/Collapsible';

export { CountUp } from './components/CountUp';
export type { CountUpProps } from './components/CountUp';

export { Countdown, useCountdown } from './components/Countdown';
export type { CountdownProps, CountdownStatus } from './components/Countdown';

export { ToggleGroup, ToggleButton } from './components/ToggleGroup';
export type {
  ToggleGroupProps,
  ToggleGroupVariant,
  ToggleGroupSize,
  ToggleOption,
  ToggleButtonProps,
} from './components/ToggleGroup';

export { InventoryKeeperDashboard } from './components/InventoryKeeperDashboard';
export type {
  InventoryKeeperDashboardProps,
  WarehouseMetrics,
  StockAlert,
  InboundTask,
  OutboundTask,
  KeeperQuickAction,
} from './components/InventoryKeeperDashboard';

export { CashierPanel } from './components/CashierPanel';
export type {
  CashierPanelProps,
  CashierStatus,
  ShiftType,
  ShiftInfo,
  CashierShiftMetrics,
  TransactionLog,
  TillStatus,
} from './components/CashierPanel';

export { SalesGuideTool } from './components/SalesGuideTool';
export type {
  SalesGuideToolProps,
  CustomerProfile,
  RecommendedProduct,
  DailyPerformance,
  GuideAlert,
} from './components/SalesGuideTool';

export { ReturnGoodsProcessingPanel } from './components/ReturnGoodsProcessingPanel';
export type {
  ReturnGoodsPanelProps,
  ReturnRequest,
  ReturnItem,
  ReturnType,
  ReturnStatus,
  ReturnGoodsPanelConfig,
  ReturnGoodsPanelCallbacks,
} from './components/ReturnGoodsProcessingPanel';

export { CouponRedemptionPanel } from './components/CouponRedemptionPanel';
export type {
  CouponRedemptionPanelProps,
  CouponEntry,
  CouponType,
  CouponStatus,
  RedemptionRequest,
  RedemptionResult,
  RedemptionSummary,
} from './components/CouponRedemptionPanel';

export { ViewModelProvider, useViewModel, useTenantId, useUserId } from './providers/ViewModelProvider';
export type { ViewModelContextValue, ViewModelProviderProps } from './providers/ViewModelProvider';

export { SpeedDial } from './components/SpeedDial';
export type { SpeedDialProps, SpeedDialAction } from './components/SpeedDial';

export { SortableList } from './components/SortableList';
export type { SortableListProps, SortableItem } from './components/SortableList';

export { NumberFormat, Currency, Percent, Compact } from './components/NumberFormat';
export type { NumberFormatProps, NumberFormatType, NumberFormatSize } from './components/NumberFormat';

export { SparklineChart } from './components/SparklineChart';
export type { SparklineChartProps, SparklineDataPoint } from './components/SparklineChart';

export { ConfirmActionDialog } from './components/ConfirmActionDialog';
export type { ConfirmActionDialogProps } from './components/ConfirmActionDialog';

export { PredictionAnalysisPanel } from './components/PredictionAnalysisPanel';
export type {
  PredictionAnalysisPanelProps,
  PredictionPoint,
  PredictionSummary,
  ConfidenceInterval,
} from './components/PredictionAnalysisPanel';

export { ScrollToTop } from './components/ScrollToTop';
export type { ScrollToTopProps } from './components/ScrollToTop';
export { FloatingActionButton } from './components/FloatingActionButton';
export type { FloatingActionButtonProps, FabPosition, FabSize } from './components/FloatingActionButton';

export { AIMetricGoalPanel } from './components/AIMetricGoalPanel';
export type {
  AIMetricGoalPanelProps,
  MetricGoal,
  MetricTrend,
  MetricMode,
} from './components/AIMetricGoalPanel';

export { AIModelPerformancePanel } from './components/AIModelPerformancePanel';
export type {
  AIModelPerformancePanelProps,
  ModelPerformanceData,
  ModelPerformanceMetric,
} from './components/AIModelPerformancePanel';

export { NavigationMenu } from './components/NavigationMenu';
export type { NavigationMenuProps, NavMenuItem } from './components/NavigationMenu';

export { HoverCard } from './components/HoverCard';
export type { HoverCardProps, HoverCardPlacement } from './components/HoverCard';

export { AnnouncementBanner } from './components/AnnouncementBanner';
export type { AnnouncementBannerProps, AnnouncementSeverity, AnnouncementVariant, AnnouncementBannerAction } from './components/AnnouncementBanner';

export { AIDecisionTimeline } from './components/AIDecisionTimeline';
export type { AIDecisionTimelineProps, DecisionEvent, TimelineNodeStatus } from './components/AIDecisionTimeline';

export { CustomerSessionPanel } from './components/CustomerSessionPanel';
export type {
  CustomerSessionPanelProps,
  CustomerInfo,
  SessionStatus,
  SessionAction,
} from './components/CustomerSessionPanel';

export { AnomalyDiagnosisReport } from './components/AnomalyDiagnosisReport';
export type { AnomalyDiagnosisReportProps, DiagnosisFinding } from './components/AnomalyDiagnosisReport';

export { StoreTransferOrderPanel } from './components/StoreTransferOrderPanel';
export type {
  StoreTransferOrderPanelProps,
  TransferOrder,
  TransferStatus,
} from './components/StoreTransferOrderPanel';

export { MemberActivityCard } from './components/MemberActivityCard';
export type { MemberActivityCardProps, MemberActivity, ActivityType } from './components/MemberActivityCard';

export { Space } from './components/Space';
export type { SpaceProps, SpaceDirection, SpaceSize } from './components/Space';

export { InfoCard } from './components/InfoCard';
export type { InfoCardProps, InfoCardItem } from './components/InfoCard';

export { SectionHeader } from './components/SectionHeader';
export type { SectionHeaderProps, SectionHeaderAction } from './components/SectionHeader';

export { Empty } from './components/Empty';
export type { EmptyProps } from './components/Empty';

export { AIDecisionComparisonPanel } from './components/AIDecisionComparisonPanel';
export type { AIDecisionComparisonPanelProps, DecisionComparisonItem } from './components/AIDecisionComparisonPanel';

export { ResourceOptimizationPanel } from './components/ResourceOptimizationPanel'
export type { ResourceOptimizationPanelProps, ResourceOptimizationSuggestion } from './components/ResourceOptimizationPanel'

export { Mentions } from './components/Mentions';
export type { MentionsProps, MentionOption, MentionItem } from './components/Mentions';

export { CommentList } from './components/CommentList';
export type { CommentListProps, CommentItem, CommentAuthor } from './components/CommentList';

export { RealtimeKpiStrip } from './components/RealtimeKpiStrip';
export type { RealtimeKpiStripProps, KpiItem } from './components/RealtimeKpiStrip';

export { AttachmentList } from './components/AttachmentList';
export type { AttachmentListProps, AttachmentItem, AttachmentStatus } from './components/AttachmentList';

export { StoreComparisonPanel } from './components/StoreComparisonPanel';
export type {
  StoreComparisonPanelProps,
  StoreComparisonItem,
  StoreComparisonMetric,
} from './components/StoreComparisonPanel';

export { BulkEditPanel } from './components/BulkEditPanel';
export type {
  BulkEditPanelProps,
  BulkEditEntry,
  BulkEditField,
} from './components/BulkEditPanel';

export { Watermark } from './components/Watermark';
export type { WatermarkProps, WatermarkContent } from './components/Watermark';

export { Spin } from './components/Spin';
export type { SpinProps, SpinSize } from './components/Spin';

// --------------- AI 会员生命周期预测面板 ---------------
export { AIMemberLifecycleForecastPanel } from './components/AIMemberLifecycleForecastPanel';
export type {
  AIMemberLifecycleForecastPanelProps,
  MemberLifecycleForecast,
  LifecycleStage,
  StageMetric,
  StageTransitionAdvice,
} from './components/AIMemberLifecycleForecastPanel';

// --------------- AI 会员分群分析面板 ---------------
export { AIMemberSegmentationPanel } from './components/AIMemberSegmentationPanel';
export type {
  AIMemberSegmentationPanelProps,
  MemberSegment,
  SegmentAnalysis,
} from './components/AIMemberSegmentationPanel';

// --------------- AI 决策规则链 ---------------
export { AIDecisionRuleChain } from './components/AIDecisionRuleChain';
export type {
  AIDecisionRuleChainProps,
  RuleChainNode,
  RuleNodeStatus,
  DecisionSummary,
} from './components/AIDecisionRuleChain';

// --------------- AI A/B Test Comparison ---------------
export { AiABTestComparisonPanel, useAiABTestComparison } from './ai-ab-test-comparison';
export type {
  AiABTestComparisonPanelProps,
  ABTestComparison,
  VariantStats,
  ABTestRecord,
  TestVariant,
} from './ai-ab-test-comparison';

// --------------- AI 推荐反馈面板 ---------------
export { AIRecommendationFeedbackPanel } from './components/AIRecommendationFeedbackPanel';
export type {
  AIRecommendationFeedbackPanelProps,
  FeedbackSource,
  FeedbackAggregate,
  FeedbackRating,
  UserFeedbackItem,
} from './components/AIRecommendationFeedbackPanel';

// --------------- Popconfirm ---------------
export { Popconfirm } from './components/Popconfirm';
export type { PopconfirmProps, PopconfirmPlacement } from './components/Popconfirm';

// --------------- RolePadClient ---------------
export { RolePadClient } from './components/RolePadClient';
export type { RolePadClientProps, SupportedPadRole } from './components/RolePadClient';

// --------------- RichTextEditor ---------------
export { RichTextEditor } from './components/RichTextEditor';
export type {
  RichTextEditorProps,
  RichTextEditorHandle,
  RichTextEditorSize,
  ToolbarPreset,
  ToolbarAction,
} from './components/RichTextEditor';

// --------------- YearPicker ---------------
export { YearPicker } from './components/YearPicker';
export type { YearPickerProps } from './components/YearPicker';

export { StoreStatusIndicator } from './components/StoreStatusIndicator';
export type { StoreStatusIndicatorProps, StoreStatus, StoreStatusSize } from './components/StoreStatusIndicator';

// --------------- StoreSelector ---------------
export { StoreSelector, groupStoresByKey } from './components/StoreSelector';
export type {
  StoreSelectorProps,
  StoreItem,
  StoreGroup,
  StoreSelectorMode,
} from './components/StoreSelector';

// --------------- AIDecisionEffectivenessBoard ---------------
export { AIDecisionEffectivenessBoard } from './components/AIDecisionEffectivenessBoard';
export type {
  AIDecisionEffectivenessBoardProps,
  DecisionEffectivenessItem,
  DecisionResult,
  DecisionSource,
  EffectivenessSummary,
} from './components/AIDecisionEffectivenessBoard';

export { AIRuleWeightPanel, useAIRuleWeight } from './ai-rule-weight-panel';
export type { AIRuleWeightPanelProps, RuleWeightItem, WeightAdjustResult } from './ai-rule-weight-panel';

export { AIModelSelector } from './components/AIModelSelector';
export type {
  AIModelSelectorProps,
  AIModelOption,
  AIModelCapability,
  AIModelPricingTier,
} from './components/AIModelSelector';

// --------------- QualityInspectorDashboard ---------------
export { QualityInspectorDashboard } from './components/QualityInspectorDashboard';
export type { QualityInspectorDashboardProps, InspectorDailyMetrics, QualityIssue, InspectionArea, IssueSeverity, InspectionCategory } from './components/QualityInspectorDashboard';
// Re-export with unique names (avoid conflict with OperationsManagerDashboard.InspectionTask)
export type { QualityInspectionTask, QcTaskStatus } from './components/QualityInspectorDashboard';

// --------------- FeedbackList ---------------
export { FeedbackList } from './components/FeedbackList';
export type {
  FeedbackListProps,
  FeedbackEntry,
} from './components/FeedbackList';

// --------------- AIDecisionExplainerPanel ---------------
export { AIDecisionExplainerPanel } from './components/AIDecisionExplainerPanel';
export type {
  AIDecisionExplainerPanelProps,
  ExplainabilityData,
  DecisionFactor,
  FactorType,
  DecisionCandidate,
  DecisionStep,
} from './components/AIDecisionExplainerPanel';

// --------------- AIDecisionOutcomeCard ---------------
export { AIDecisionOutcomeCard } from './components/AIDecisionOutcomeCard';
export type {
  AIDecisionOutcomeCardProps,
  DecisionStatus,
  ImpactMetric,
} from './components/AIDecisionOutcomeCard';

// --------------- DonutChart ---------------
export { DonutChart } from './components/DonutChart';
export type { DonutChartProps, DonutSlice } from './components/DonutChart';

// --------------- AsyncSelect ---------------
export { AsyncSelect } from './components/AsyncSelect';
export type { AsyncSelectProps } from './components/AsyncSelect';

// --------------- Tour ---------------
export { Tour } from './components/Tour';
export type { TourProps, TourStep } from './components/Tour';

// --------------- ChartExportPanel ---------------
export { ChartExportPanel } from './components/ChartExportPanel';
export type { ChartExportPanelProps, TimeRangeOption } from './components/ChartExportPanel';

// --------------- AlertCorrelationDashboard ---------------
export { AlertCorrelationDashboard } from './components/AlertCorrelationDashboard';
export type { AlertCorrelationDashboardProps, CorrelatedAlert, AlertCorrelationGroup, AlertSeverity, AlertSource, ConfidenceLevel } from './components/AlertCorrelationDashboard';

// --------------- DeliveryPersonDashboard ---------------
export { DeliveryPersonDashboard } from './components/DeliveryPersonDashboard';
export type { DeliveryPersonDashboardProps, DeliveryDailyStats, DeliveryOrder, RouteStop } from './components/DeliveryPersonDashboard';

// --------------- InventoryManagerDashboard ---------------
export { InventoryManagerDashboard } from './components/InventoryManagerDashboard';
export type { InventoryManagerDashboardProps, InventoryMetrics, SlowMovingItem, SupplierPerformance, CategoryBreakdown } from './components/InventoryManagerDashboard';
