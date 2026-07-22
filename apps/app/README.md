# @m5/app — 神机营移动端 App

> 神机营 React Native 移动端应用，面向门店运营人员，提供收银、订单、库存、会员、客服、报表等核心业务功能的移动工作台。

## 技术栈

| 类别         | 技术                                         |
| ------------ | -------------------------------------------- |
| 框架         | React Native 0.74 (Expo SDK 51)              |
| 语言         | TypeScript 5.8                               |
| 导航         | React Navigation 6 (BottomTab + NativeStack)  |
| 状态管理     | React Context + useReducer                    |
| 离线支持     | @react-native-community/netinfo + AsyncStorage |
| 推送通知     | expo-notifications                           |
| 生物识别     | expo-local-authentication                     |
| 国际化       | expo-localization + i18n                      |
| 测试         | Node Test Runner + 自定义 mock 环境            |
| 包管理       | pnpm workspace (monorepo)                    |
| 内部包       | @m5/sdk, @m5/types                           |

## 核心功能

### 首页 (HomeTab)
- 应用首页，快捷入口导航

### 工作台 (WorkTab)
- **收款** — 快速收银、退款处理
- **订单** — 订单列表、订单详情、订单履约全流程
- **库存** — 库存查询、库存扫码盘点
- **扫码** — 通用扫码功能
- **报表** — 数据报表仪表盘
- **设备监控** — 门店设备状态监控
- **营销活动** — 促销活动查看与参与
- **员工管理** — 员工管理、排班调度、交接班

### 会员 (MemberTab)
- 会员首页、会员中心
- 会员登录/注册
- 会员资料编辑
- 我的订单、我的优惠券
- 门店搜索

### 客服 (CSTab)
- 工单工作台 (Ticket Workplace)
- 知识库详情 (Knowledge Base)
- 客户反馈管理

### 设置 (SettingsTab)
- 系统设置主面板
- 生物识别设置 (指纹/面容)
- 通知设置 (推送开关)
- 语言设置 (多语言切换)
- 工具注册管理 (Tool Registry)

### 基础能力
- **离线优先 (Offline-First)** — 网络不可用时自动切换到离线模式，网络恢复后自动同步
- **多市场引导** — 通过 `market-bootstrap.ts` 加载市场级配置
- **推送通知** — 基于 expo-notifications 的统一推送管理
- **生物识别** — 支持指纹和 Face ID 解锁
- **国际化** — 多语言界面切换

## 目录结构

```
apps/app/
├── App.tsx                      # 应用入口 (Provider 组合)
├── app.json                     # Expo 配置
├── navigation/
│   └── AppNavigator.tsx         # 导航配置 (Tab + Stack)
├── context/
│   ├── AppContext.tsx            # 应用全局状态 (会话/引导/推送/生物识别)
│   └── OfflineContext.tsx        # 离线上下文 (网络监听/同步队列)
├── screens/
│   ├── home/                    # 首页
│   │   └── HomeScreen.tsx
│   ├── cashier/                 # 收银
│   │   ├── PaymentScreen.tsx
│   │   └── RefundScreen.tsx
│   ├── orders/                  # 订单
│   │   ├── OrderListScreen.tsx
│   │   └── OrderDetailScreen.tsx
│   ├── inventory/               # 库存
│   │   ├── InventoryScreen.tsx
│   │   └── InventoryScanScreen.tsx
│   ├── member/                  # 会员
│   │   ├── MemberCenterScreen.tsx
│   │   ├── MemberProfileScreen.tsx
│   │   ├── StoreSearchScreen.tsx
│   │   └── ...
│   ├── settings/                # 设置
│   │   ├── SettingsScreen.tsx
│   │   ├── BiometricSettingsScreen.tsx
│   │   ├── NotificationSettingsScreen.tsx
│   │   └── LanguageSettingsScreen.tsx
│   ├── scan/                    # 扫码
│   │   └── ScanScreen.tsx
│   ├── staff/                   # 员工
│   │   ├── StaffManageScreen.tsx
│   │   ├── ScheduleScreen.tsx
│   │   └── HandoffScreen.tsx
│   ├── report/                  # 报表
│   │   └── ReportDashboardScreen.tsx
│   ├── device/                  # 设备
│   │   └── DeviceMonitorScreen.tsx
│   ├── marketing/               # 营销
│   │   └── MarketingScreen.tsx
│   └── cs/                      # 客服
│       ├── TicketWorkplaceScreen.tsx
│       ├── KnowledgeBaseScreen.tsx
│       └── CustomerFeedbackScreen.tsx
├── services/
│   ├── index.ts                 # 服务入口
│   ├── BiometricAuth.ts         # 生物识别认证
│   ├── I18n.ts                  # 国际化
│   ├── OfflineStorage.ts        # 离线存储
│   ├── PushNotification.ts      # 推送通知
│   ├── SyncQueue.ts             # 离线同步队列
│   └── tool-registry-core.ts   # 工具注册核心
├── utils/
│   ├── order-display.ts         # 订单展示格式化
│   ├── order-detail-state.ts    # 订单详情状态
│   ├── order-detail-actions.ts  # 订单详情操作
│   ├── order-detail-sections.ts # 订单详情分段
│   ├── order-detail-items.ts    # 订单详情商品
│   ├── order-finance.ts         # 订单财务计算
│   ├── order-runtime.ts         # 订单运行时
│   ├── order-list-state.ts      # 订单列表状态
│   ├── order-route.ts           # 订单路由参数类型
│   └── payment-channel.ts       # 支付渠道
├── components/
│   └── OfflineIndicator.tsx     # 离线状态指示器
├── types/                       # 类型声明
├── test/                        # 测试基础设施
│   ├── setup.cjs                # 测试环境 (React Native mock)
│   ├── react-native.mock.cjs
│   ├── react-navigation.mock.cjs
│   └── app-context.mock.cjs
├── market-bootstrap.ts          # 市场引导数据加载
├── tsconfig.json                # TypeScript 配置
└── package.json                 # 依赖与脚本
```

## 环境变量

应用本身不直接使用环境变量。市场级配置（API 基地址、市场代码、语言、时区等）通过 `market-bootstrap.ts` 中 `@m5/sdk` 的 `getDefaultApiBaseUrl()` 和 `loadFoundationGovernanceReadModel()` 等接口运行时加载。

## 开发命令

```bash
# 启动 Expo 开发服务器
pnpm dev

# Android 原生运行
pnpm android

# iOS 原生运行
pnpm ios

# Web 模式
pnpm web

# TypeScript 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 代码检查
pnpm lint
```

## 快速开始

1. 在 monorepo 根目录执行 `pnpm install`
2. 确保已配置 Expo 开发环境 (Node.js 18+, Xcode/Android Studio)
3. 执行 `pnpm dev` 启动 Expo 开发服务器
4. 使用 Expo Go 扫码或模拟器运行

## 架构说明

- **离线优先 (Offline-First)** — 通过 `OfflineProvider` + `SyncQueue` + `OfflineStorage` 实现离线数据缓存与网络恢复后自动同步
- **Provider 组合** — `App.tsx` 中以嵌套 Provider 模式组织：`SafeAreaProvider > OfflineProvider > AppProvider`
- **React Navigation 6** — 底部 5 Tab 导航 + 各 Tab 内 NativeStack 子导航
- **导航路由参数** — 全类型安全的导航参数（`OrderDetailRouteParams`, `PaymentRouteParams` 等）
- **模块化测试** — 测试通过 Node `--test` runner 运行，对 `react-native` 和 `@react-navigation/*` 进行 mock 隔离
- **工具注册** — `ToolRegistryScreen` 提供运行时功能开关与工具注册管理
