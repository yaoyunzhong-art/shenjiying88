# @m5/ui / components — 共享 UI 组件库

> 神机营 SaaS 平台统一 UI 组件库，供 admin-web（管理后台）和 app（移动端）等消费端使用。

---

## 定位

`packages/ui/src/components/` 是神机营前端 monorepo 中**共享 UI 组件层**，封装了业务无关的通用 UI 原子组件以及面向运营场景的业务组件（面板/Dashboard/图表），遵循 Ant Design 6 设计语言。

---

## 核心功能清单

本目录包含 **588 个组件文件**（含 .tsx 源代码和 .test.tsx 测试文件），按类别可分为：

| 类别 | 典型组件 | 数量 |
|------|---------|------|
| 基础 UI 组件 | Button, Input, Select, Checkbox, Radio, Switch, Tag, Badge, Modal, Drawer, Dialog, Toast | ~120 |
| 反馈与通知 | Alert, Notification, Popconfirm, Progress, Result, Skeleton, Spin, Empty, ErrorBoundary, LoadingOverlay | ~40 |
| 数据录入 | Form, DatePicker, DateTimePicker, TimePicker, MonthPicker, YearPicker, WeekPicker, Cascader, ColorPicker, FileUpload, OTPInput, RichTextEditor | ~60 |
| 数据显示 | Table, DataTable, List, Tree, TreeSelect, Timeline, KanbanBoard, Calendar, Avatar, Card, Comment | ~50 |
| 布局与导航 | NavigationMenu, SideNavigation, BottomNavigation, Breadcrumb, Tabs, Steps, Stepper, Menu, DropdownMenu, PageShell | ~30 |
| 图表与可视化 | Chart, DonutChart, GaugeChart, HeatmapChart, RadarChart, FunnelChart, SparklineChart, WordCloudChart, FunnelChart | ~30 |
| AI 智能面板 | AIAgentChatPanel, AIAgentThinkingPanel, AIAgentToolCallPanel, AIAnalysisInsightsPanel, AIDecision系列, AIAIAutomationSuggestionPanel | ~60 |
| 业务仪表盘 | StoreManagerDashboard, RegionalManagerDashboard, OperationsManagerDashboard, FinanceManagerDashboard, MarketingManagerDashboard, ConciergePanel | ~40 |
| 告警监控 | AlertCorrelationDashboard, AnomalyAlertPanel, FoundationAlertPanel, FoundationAlertViews, RuntimeOperationViews | ~30 |
| 运营工具 | CashierPanel, FrontDeskPanel, SalespersonToolPanel, ShiftHandoverPanel, StaffShiftSchedulePanel, InspectionChecklist | ~30 |
| 复杂面板 | AiDecisionPanel/, ChartExportPanel/, ReturnGoodsProcessingPanel/ | 3 子目录 |

---

## 关键文件说明

### 基础 UI 组件 (原子组件)
```
├── Button.tsx / Button.test.tsx       # 按钮组件
├── Input.tsx / Input.test.tsx         # 文本输入框
├── Select.tsx / Select.test.tsx       # 下拉选择器（含受控模式）
├── Modal.tsx / Modal.test.tsx         # 模态对话框
├── Toast.tsx / Toast.test.tsx         # 轻提示
├── Table.tsx / Table.test.tsx         # 表格组件
├── Form.tsx / Form.test.tsx           # 表单容器
├── Tabs.tsx / Tabs.test.tsx           # 标签页
├── Calendar.tsx / Calendar.test.tsx   # 日历
├── Dialog.tsx / Dialog.test.tsx       # 弹窗
├── DatePicker.tsx / ... 测试         # 日期选择器系列（Date/DateTime/Time/Month/Year/Week/Range）
└── ...
```

### AI 决策面板系列
```
├── AIDecisionRuleChain.tsx            # AI 决策规则链
├── AIDecisionTimeline.tsx             # AI 决策时间线
├── AIDecisionExplainerPanel.tsx       # AI 决策解释面板
├── AIDecisionDistributionPanel.tsx    # AI 决策分布
├── AIDecisionComparisonPanel.tsx      # AI 决策对比
├── AIDecisionEffectivenessBoard.tsx   # AI 决策效果看板
├── AiDecisionPanel/                   # AI 决策面板（子目录，含 hooks/类型）
└── ...
```

### 业务仪表盘系列
```
├── StoreManagerDashboard.tsx          # 门店经理仪表盘
├── RegionalManagerDashboard.tsx       # 区域经理仪表盘
├── OperationsManagerDashboard.tsx     # 运营经理仪表盘
├── FinanceManagerDashboard.tsx        # 财务经理仪表盘
├── MarketingManagerDashboard.tsx      # 市场经理仪表盘
├── TrainingManagerDashboard.tsx       # 培训经理仪表盘
├── ProductManagerDashboard.tsx        # 产品经理仪表盘
├── ProcurementManagerDashboard.tsx    # 采购经理仪表盘
└── ...
```

### 告警监控系列
```
├── AlertCorrelationDashboard.tsx      # 告警关联仪表盘
├── AnomalyAlertPanel.tsx              # 异常告警面板
├── AnomalyAlertTrendPanel.tsx         # 告警趋势面板
├── FoundationAlertPanel.tsx           # 基础告警面板
├── FoundationAlertViews.tsx           # 告警视图
└── RuntimeOperationViews.tsx          # 运行时运维视图
```

### 子目录组件（复杂面板）
```
├── AiDecisionPanel/                   # AI 决策面板（含 index.ts/types/useDecisionPanel）
├── ChartExportPanel/                  # 图表导出面板
└── ReturnGoodsProcessingPanel/        # 退货处理面板
```

---

## 技术规范

- **框架**: React 18 + TypeScript 5.8
- **UI 基底**: Ant Design 6
- **测试**: Node Test Runner + @testing-library/react
- **构建**: tsup → ESM + CJS + dts
- **样式方案**: Ant Design 内置样式 + CSS-in-JS
- 每个组件遵循 `.tsx` (源码) + `.test.tsx` (测试) 双文件模式
- 测试覆盖率要求: 基础组件 ≥ 90%，面板组件 ≥ 80%

---

## 开发指南

```bash
# 在 monorepo 根目录
pnpm --filter @m5/ui dev       # 开发模式（tsup watch）
pnpm --filter @m5/ui build     # 生产构建
pnpm --filter @m5/ui test      # 运行测试
pnpm --filter @m5/ui lint      # ESLint 检查
pnpm --filter @m5/ui typecheck # 类型检查
```

---

## Owner

- **维护团队**: 神机营前端组 (M5 FE Team)
- **Owner**: yaoyunzhong
