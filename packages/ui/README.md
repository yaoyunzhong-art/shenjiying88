# @m5/ui — UI Component Library / UI 组件库

**@m5/ui** 是 M5 平台统一的前端 UI 组件库，基于 React 18 + Ant Design 6.5 构建，提供 200+ 可复用的 UI 组件与业务模块，覆盖前台门店运营、后台管理、AI 智能分析等多个场景。

---

## 技术栈 Tech Stack

| 技术          | 版本        |
|---------------|-------------|
| React         | 18.3.1      |
| Ant Design    | ^6.5.0      |
| TypeScript    | —           |
| tsup (构建)   | —           |
| @m5/types     | workspace:* |

---

## 目录结构 Directory Structure

```
packages/ui/
├── src/
│   ├── index.tsx                            # 入口文件，导出全部组件
│   ├── index.test.ts                        # 入口级测试
│   ├── components/                          # 基础 UI 组件（150+）
│   │   ├── Accordion/                       # 手风琴
│   │   ├── ActionPanel/                     # 操作面板
│   │   ├── AIAgentChatPanel/                # AI 智能体对话面板
│   │   ├── AIAgentPerformancePanel/         # AI 智能体性能面板
│   │   ├── AIAgentThinkingPanel/            # AI 智能体推理面板
│   │   ├── AIAgentToolCallPanel/            # AI 智能体工具调用面板
│   │   ├── AIAgentWorkloadDistributionPanel/# AI 智能体负载分布面板
│   │   ├── AIAnalysisInsightsPanel/         # AI 分析洞察面板
│   │   ├── AIAutomationSuggestionPanel/     # AI 自动化建议面板
│   │   ├── AICompetitiveAnalysisPanel/      # AI 竞品分析面板
│   │   ├── AIDecisionComparisonPanel/       # AI 决策对比面板
│   │   ├── AIDecisionDistributionPanel/     # AI 决策分布面板
│   │   ├── AIDecisionEffectivenessBoard/    # AI 决策效果看板
│   │   ├── AIDecisionExplainerPanel/        # AI 决策解释面板
│   │   ├── AIDecisionOutcomeCard/           # AI 决策结果卡片
│   │   ├── AIDecisionPanel/                 # AI 决策面板
│   │   ├── AIDecisionRuleChain/             # AI 决策规则链
│   │   ├── AIDecisionTimeline/              # AI 决策时间线
│   │   ├── AIDemandForecastPanel/           # AI 需求预测面板
│   │   ├── AIDeviceFaultPredictionPanel/    # AI 设备故障预测面板
│   │   ├── AIExecutionAuditPanel/           # AI 执行审计面板
│   │   ├── AIExperimentOptimizationPanel/   # AI 实验优化面板
│   │   ├── AIMemberChurnPredictionPanel/    # AI 会员流失预测面板
│   │   ├── AIMemberLifecycleForecastPanel/  # AI 会员生命周期预测面板
│   │   ├── AIMemberSegmentationPanel/       # AI 会员分群分析面板
│   │   ├── AIMetricGoalPanel/               # AI 指标目标面板
│   │   ├── AIModelPerformancePanel/         # AI 模型性能面板
│   │   ├── AIModelSelector/                 # AI 模型选择器
│   │   ├── AIPricingRecommendationPanel/    # AI 定价推荐面板
│   │   ├── AIRecommendationFeedbackPanel/   # AI 推荐反馈面板
│   │   ├── AIScenarioSimulator/             # AI 场景模拟器
│   │   ├── AISmartInsightPanel/             # AI 智能洞察面板
│   │   ├── AISmartSchedulingPanel/          # AI 智能排班面板
│   │   ├── AISuggestionCard/                # AI 建议卡片
│   │   ├── AISummaryCard/                   # AI 摘要卡片
│   │   ├── Alert/                           # 告警组件
│   │   ├── AlertCorrelationDashboard/       # 告警关联仪表盘
│   │   ├── AnomalyAlertPanel/               # 异常告警面板
│   │   ├── AnomalyAlertTrendPanel/          # 异常告警趋势面板
│   │   ├── AnomalyDiagnosisReport/          # 异常诊断报告
│   │   ├── AnomalyFrequencyTimeline/        # 异常频率时间线
│   │   ├── AnomalyPatternPanel/             # 异常模式分析面板
│   │   ├── AnnouncementBanner/              # 公告横幅
│   │   ├── AppointmentBookingPanel/         # 预约面板
│   │   ├── ArcadeRevenueCard/               # 游艺营收卡片
│   │   ├── AssistantManagerDashboard/       # 店助管理仪表盘
│   │   ├── AsyncSelect/                     # 异步选择器
│   │   ├── AttachmentList/                  # 附件列表
│   │   ├── AuditTimeline/                   # 审计时间线
│   │   ├── AutoComplete/                    # 自动完成
│   │   ├── Avatar/                          # 头像
│   │   ├── Badge/                           # 徽标
│   │   ├── BatchSelectionBar/               # 批量选择栏
│   │   ├── BottomNavigation/                # 底部导航
│   │   ├── BranchSelector/                  # 分支选择器
│   │   ├── Breadcrumb/                      # 面包屑
│   │   ├── BreadcrumbPageHeader/            # 面包屑页面头部
│   │   ├── BulkEditPanel/                   # 批量编辑面板
│   │   ├── Button/                          # 按钮
│   │   ├── Calendar/                        # 日历
│   │   ├── Card/                            # 卡片
│   │   ├── Carousel/                        # 轮播
│   │   ├── Cascader/                        # 级联选择器
│   │   ├── CashierPanel/                    # 收银面板
│   │   ├── Chart/                           # 图表
│   │   ├── ChartExportPanel/                # 图表导出面板
│   │   ├── Checkbox/                        # 复选框
│   │   ├── Chip/                            # 筹码/标签
│   │   ├── CoachDashboard/                  # 教练仪表盘
│   │   ├── CodeBlock/                       # 代码块
│   │   ├── Collapse/                        # 折叠面板
│   │   ├── Collapsible/                     # 可折叠区域
│   │   ├── ColorPicker/                     # 颜色选择器
│   │   ├── Combobox/                        # 组合框
│   │   ├── CombinedDetailPage/              # 组合详情页
│   │   ├── CommandPalette/                  # 命令面板
│   │   ├── CommentList/                     # 评论列表
│   │   ├── ComparisonBreakdownChart/        # 对比分解图表
│   │   ├── ConfigurationPosturePanel/       # 配置安全态势面板
│   │   ├── ConfigurationVersionDiff/        # 配置版本差异
│   │   ├── ConfirmActionDialog/             # 确认操作弹窗
│   │   ├── ConfirmDialog/                   # 确认对话框
│   │   ├── ConciergePanel/                  # 管家服务面板
│   │   ├── ContentSwitcher/                 # 内容切换器
│   │   ├── ContextMenu/                     # 上下文菜单
│   │   ├── CopyToClipboard/                 # 复制到剪贴板
│   │   ├── CountUp/                         # 数字滚动
│   │   ├── Countdown/                       # 倒计时
│   │   ├── CouponRedemptionPanel/           # 优惠券兑换面板
│   │   ├── CustomerServiceDashboard/        # 客服仪表盘
│   │   ├── CustomerSessionPanel/            # 客户会话面板
│   │   ├── DataDriftMonitorPanel/           # 数据漂移监控面板
│   │   ├── DataTable/                       # 数据表格
│   │   ├── DatePicker/                      # 日期选择器
│   │   ├── DateRangePicker/                 # 日期范围选择器
│   │   ├── DateTimePicker/                  # 日期时间选择器
│   │   ├── DecisionAuditTrail/              # 决策审计追踪
│   │   ├── DeliveryPersonDashboard/         # 配送员仪表盘
│   │   ├── DescriptionList/                 # 描述列表
│   │   ├── DetailActionBar/                 # 详情操作栏
│   │   ├── DetailClosureBar/                # 详情关闭栏
│   │   ├── DetailShell/                     # 详情外壳
│   │   ├── DeviceInspectionPanel/           # 设备巡检面板
│   │   ├── DeviceStatusPanel/               # 设备状态面板
│   │   ├── Dialog/                          # 对话框
│   │   ├── Divider/                         # 分隔线
│   │   ├── DonutChart/                      # 环形图
│   │   ├── DotNavigation/                   # 圆点导航
│   │   ├── Drawer/                          # 抽屉
│   │   ├── DrilldownTrendCard/              # 钻取趋势卡片
│   │   ├── Dropdown/                        # 下拉菜单
│   │   ├── DropdownMenu/                    # 下拉菜单
│   │   ├── Empty/                           # 空状态
│   │   ├── EmptyState/                      # 空状态视图
│   │   ├── EntertainmentGuideDashboard/     # 娱乐引导仪表盘
│   │   ├── ErrorBoundary/                   # 错误边界
│   │   ├── ExportButton/                    # 导出按钮
│   │   ├── FeedbackList/                    # 反馈列表
│   │   ├── FeedbackWidget/                  # 反馈挂件
│   │   ├── FileUpload/                      # 文件上传
│   │   ├── FilterBar/                       # 筛选栏
│   │   ├── FilterChips/                     # 筛选标签
│   │   ├── FinanceManagerDashboard/         # 财务经理仪表盘
│   │   ├── FloatingActionButton/            # 浮动操作按钮
│   │   ├── FormField/                       # 表单字段
│   │   ├── FormPageScaffold/                # 表单页脚手架
│   │   ├── FormSubmitFeedback/              # 表单提交反馈
│   │   ├── FoundationAlertLinkedOverview/   # 基础告警关联概览
│   │   ├── FoundationAlertPanel/            # 基础告警面板
│   │   ├── FoundationAlertPanelReadouts/    # 基础告警面板读数
│   │   ├── FoundationAlertViews/            # 基础告警视图
│   │   ├── FoundationConsumerSections/      # 基础消费者区块
│   │   ├── FranchiseOperationsDashboard/    # 加盟运营仪表盘
│   │   ├── FrontDeskPanel/                  # 前台面板
│   │   ├── FrontDeskSupervisorDashboard/    # 前台主管仪表盘
│   │   ├── FunnelChart/                     # 漏斗图
│   │   ├── GaugeChart/                      # 仪表盘图
│   │   ├── HeatmapChart/                    # 热力图
│   │   ├── HoverCard/                       # 悬停卡片
│   │   ├── ImagePreview/                    # 图片预览
│   │   ├── InfoCard/                        # 信息卡片
│   │   ├── InfoRow/                         # 信息行
│   │   ├── InfiniteScroll/                  # 无限滚动
│   │   ├── InlineNotification/              # 内联通知
│   │   ├── Input/                           # 输入框
│   │   ├── InputNumber/                     # 数字输入框
│   │   ├── InspectionChecklist/             # 巡检清单
│   │   ├── InventoryKeeperDashboard/        # 库管仪表盘
│   │   ├── InventoryManagerDashboard/       # 库存经理仪表盘
│   │   ├── KanbanBoard/                     # 看板
│   │   ├── KpiSummaryCard/                  # KPI 摘要卡片
│   │   ├── Label/                           # 标签
│   │   ├── LinkedOverviewStubs/             # 关联概览桩
│   │   ├── ListPageScaffold/                # 列表页脚手架
│   │   ├── ListToolbar/                     # 列表工具栏
│   │   ├── LoadingOverlay/                  # 加载遮罩
│   │   ├── LoadingSkeleton/                 # 加载骨架
│   │   ├── MarketingManagerDashboard/       # 市场经理仪表盘
│   │   ├── Masonry/                         # 瀑布流
│   │   ├── MemberActivityCard/              # 会员活动卡片
│   │   ├── MemberFollowUpTaskPanel/         # 会员跟进任务面板
│   │   ├── MemberLevelDistribution/         # 会员等级分布
│   │   ├── MemberMarketerDashboard/         # 会员营销仪表盘
│   │   ├── MemberPointHistory/              # 会员积分历史
│   │   ├── MemberRechargePanel/             # 会员充值面板
│   │   ├── MemberRFMAnalysisPanel/          # 会员 RFM 分析面板
│   │   ├── MemberTierDistribution/          # 会员层级分布
│   │   ├── MemberUpgradePath/               # 会员升级路径
│   │   ├── Mentions/                        # @提及
│   │   ├── MetricsDashboardGrid/            # 指标仪表盘网格
│   │   ├── Modal/                           # 模态框
│   │   ├── MonthPicker/                     # 月份选择器
│   │   ├── MultiSelect/                     # 多选
│   │   ├── NavigationMenu/                  # 导航菜单
│   │   ├── NotificationBell/                # 通知铃铛
│   │   ├── NotificationCenter/              # 通知中心
│   │   ├── NumberFormat/                    # 数字格式化
│   │   ├── OfflineBadge/                    # 离线徽标
│   │   ├── OperationsManagerDashboard/      # 运营经理仪表盘
│   │   ├── OTPInput/                        # 验证码输入
│   │   ├── PageShell/                       # 页面外壳
│   │   ├── PaginatedDataTableCard/          # 分页数据表格卡片
│   │   ├── Pagination/                      # 分页
│   │   ├── PasswordInput/                   # 密码输入框
│   │   ├── Popconfirm/                      # 气泡确认框
│   │   ├── Popover/                         # 气泡卡片
│   │   ├── PortalConsumerGovernanceSection/ # 门户消费者治理区块
│   │   ├── PortalDomainGovernanceCard/      # 门户域名治理卡片
│   │   ├── PredictionAnalysisPanel/         # 预测分析面板
│   │   ├── PrizeRedemptionCounter/          # 奖品兑换计数器
│   │   ├── ProcurementManagerDashboard/     # 采购经理仪表盘
│   │   ├── ProductManagerDashboard/         # 产品经理仪表盘
│   │   ├── ProfitMarginPanel/               # 利润分析面板
│   │   ├── Progress/                        # 进度条
│   │   ├── ProgressCard/                    # 进度卡片
│   │   ├── ProgressRing/                    # 环形进度
│   │   ├── ProgressSegments/                # 分段进度
│   │   ├── PurchaseOrderPanel/              # 采购订单面板
│   │   ├── QRCodeDisplay/                   # 二维码展示
│   │   ├── QualityInspectorDashboard/       # 质检员仪表盘
│   │   ├── QuickActionBar/                  # 快速操作栏
│   │   ├── QuickStats/                      # 快速统计
│   │   ├── RadarChart/                      # 雷达图
│   │   ├── RadioGroup/                      # 单选组
│   │   ├── Rating/                          # 评分
│   │   ├── RealTimeRevenueDisplay/          # 实时营收展示
│   │   ├── RealtimeKpiStrip/                # 实时 KPI 条
│   │   ├── ReceiptPreview/                  # 收据预览
│   │   ├── ReconnectingBadge/               # 重连中徽标
│   │   ├── ReconciliationDiffPanel/         # 对账差异面板
│   │   ├── RegionalManagerDashboard/        # 区域经理仪表盘
│   │   ├── ResourceOptimizationPanel/       # 资源优化面板
│   │   ├── ResponsiveContainer/             # 响应式容器
│   │   ├── Result/                          # 结果
│   │   ├── ReturnGoodsProcessingPanel/      # 退货处理面板
│   │   ├── RichTextEditor/                  # 富文本编辑器
│   │   ├── RolePadClient/                   # 角色平板客户端
│   │   ├── RuleRecommendationPanel/         # 规则推荐面板
│   │   ├── RuntimeGovernancePanel/          # 运行时治理面板
│   │   ├── RuntimeOperationViews/           # 运行时运维视图
│   │   ├── SalesConversionFunnel/           # 销售转化漏斗
│   │   ├── SalesClerkTool/                  # 售货员工具
│   │   ├── SalesForecastPanel/              # 销售预测面板
│   │   ├── SalesGuideTool/                  # 导购工具
│   │   ├── SalespersonToolPanel/            # 销售人员工具面板
│   │   ├── ScenarioComparisonPanel/         # 场景对比面板
│   │   ├── ScrollArea/                      # 滚动区域
│   │   ├── ScrollToTop/                     # 回到顶部
│   │   ├── SearchFilterInput/               # 搜索筛选输入
│   │   ├── SectionHeader/                   # 区块标题
│   │   ├── SegmentedControl/                # 分段控制器
│   │   ├── Select/                          # 选择器
│   │   ├── ShiftHandoverPanel/              # 交班面板
│   │   ├── SideNavigation/                  # 侧边导航
│   │   ├── Skeleton/                        # 骨架屏
│   │   ├── Slider/                          # 滑块
│   │   ├── SmartTrendAnalysisPanel/         # 智能趋势分析面板
│   │   ├── SortableList/                    # 可排序列表
│   │   ├── Space/                           # 间距
│   │   ├── SparklineChart/                  # 迷你趋势图
│   │   ├── SpeedDial/                       # 快速拨号
│   │   ├── Spin/                            # 旋转加载
│   │   ├── Spinner/                         # 加载指示器
│   │   ├── SplitPane/                       # 分割面板
│   │   ├── StaffShiftSchedulePanel/         # 员工排班面板
│   │   ├── StatCard/                        # 统计卡片
│   │   ├── StatTrend/                       # 统计趋势
│   │   ├── Statistic/                       # 统计数字
│   │   ├── StatusBadge/                     # 状态徽标
│   │   ├── Steps/                           # 步骤条
│   │   ├── Stepper/                         # 步进器
│   │   ├── StoreComparisonPanel/            # 门店对比面板
│   │   ├── StoreManagerDashboard/           # 店长仪表盘
│   │   ├── StoreSelector/                   # 门店选择器
│   │   ├── StoreStatusIndicator/            # 门店状态指示器
│   │   ├── StoreTransferOrderPanel/         # 调拨单面板
│   │   ├── StrategyConfigPanel/             # 策略配置面板
│   │   ├── SubmitButton/                    # 提交按钮
│   │   ├── Switch/                          # 开关
│   │   ├── Table/                           # 表格
│   │   ├── Tabs/                            # 标签页
│   │   ├── Tag/                             # 标签
│   │   ├── TagInput/                        # 标签输入
│   │   ├── TextArea/                        # 文本域
│   │   ├── ThreeLevelConfig/...             # 三级配置组件（见下方模块）
│   │   ├── TierUpgradePanel/                # 层级升级面板
│   │   ├── TimePicker/                      # 时间选择器
│   │   ├── Timeline/                        # 时间线
│   │   ├── Toast/                           # 轻提示
│   │   ├── ToggleGroup/                     # 切换组
│   │   ├── Tooltip/                         # 工具提示
│   │   ├── Tour/                            # 引导
│   │   ├── Transfer/                        # 穿梭框
│   │   ├── Tree/                            # 树
│   │   ├── TreeSelect/                      # 树选择
│   │   ├── Typography/                      # 排版
│   │   ├── UsageMetricsPanel/               # 用量指标面板
│   │   ├── VenueSupervisorDashboard/        # 场地主管仪表盘
│   │   ├── VirtualizedList/                 # 虚拟列表
│   │   ├── Watermark/                       # 水印
│   │   ├── WeekPicker/                      # 周选择器
│   │   ├── WordCloudChart/                  # 词云图
│   │   ├── WorkbenchHeader/                 # 工作台头部
│   │   └── YearPicker/                      # 年份选择器
│   │
│   ├── providers/                           # React Context 提供者
│   │   └── ViewModelProvider/               # 视图模型提供者
│   │
│   ├── canary-control/                      # 灰度控制模块
│   ├── sso-config/                          # SSO 配置模块
│   ├── image-recognition-dashboard/         # 图像识别仪表盘
│   ├── domain-config/                       # 域名配置模块
│   ├── federated-dashboard/                 # 联邦仪表盘
│   ├── ai-model-switcher/                   # AI 模型切换器
│   ├── license/                             # 许可证管理模块
│   ├── license-gate/                        # 许可证网关
│   ├── webhook-config/                      # Webhook 配置模块
│   ├── monitoring-dashboard/                # 监控仪表盘
│   ├── open-api-client/                     # OpenAPI 客户端
│   ├── ocr-workspace/                       # OCR 工作台
│   ├── insight-panel/                       # 洞察面板
│   ├── multimedia-dashboard/                # 多媒体仪表盘
│   ├── multimodal-fusion-workspace/         # 多模态融合工作台
│   ├── voice-processing-panel/              # 语音处理面板
│   ├── report-dashboard/                    # 报表仪表盘
│   ├── three-level-config/                  # 三级配置（门店/租户/品牌）
│   ├── anomaly-alert-panel/                 # 异常告警面板
│   ├── ai-rule-weight-panel/                # AI 规则权重面板
│   ├── ai-ab-test-comparison/               # AI A/B 测试对比
│   ├── CampaignPerformancePanel/            # 营销活动绩效面板
│   ├── CampaignTrendForecast/               # 营销活动趋势预测
│   ├── SmartTrendChart/                     # 智能趋势图表
│   └── TierDistributionChart/               # 层级分布图表
│
├── dist/                                    # 构建产物
├── package.json
├── tsconfig.json
└── README.md                                # 本文件
```

---

## 使用示例 Usage Example

```tsx
import {
  Button,
  DataTable,
  StoreManagerDashboard,
  AIAnalysisInsightsPanel,
} from '@m5/ui';

// 基础组件
function MyPage() {
  return (
    <div>
      <Button variant="primary" size="md">
        保存
      </Button>
      <DataTable columns={columns} dataSource={data} />
    </div>
  );
}

// 业务仪表盘
import type { StoreDailyMetrics } from '@m5/ui';

function MyDashboard() {
  const metrics: StoreDailyMetrics = {
    revenue: 12800,
    orderCount: 42,
    customerCount: 78,
    date: '2026-07-22',
  };
  return <StoreManagerDashboard metrics={metrics} pendingTasks={[]} />;
}
```

---

## Scripts 说明

| 命令                    | 说明                     |
|------------------------|--------------------------|
| `pnpm build`           | 使用 tsup 构建 CJS + 类型声明 |
| `pnpm dev`             | 监听模式增量构建            |
| `pnpm lint`            | ESLint 代码检查             |
| `pnpm typecheck`       | TypeScript 类型检查         |
| `pnpm test`            | 运行测试（node --import tsx） |

---

## 依赖说明 Dependencies

- **@m5/types** — M5 平台共享类型定义
- **antd ^6.5.0** — Ant Design 企业级 UI 组件库
- **react 18.3.1** — React 核心库

🔄 此文件由保底续产机器人自动生成 — 2026-07-22
