# 神机营 SaaS 移动端 — shenjiying-mobile

> React Native 0.74 · Offline-First 架构 · 实时推送 · 多设备协同 · TypeScript Strict

## 📋 模块概述

`shenjiying-mobile` 是神机营 SaaS 平台的原生移动端 App，覆盖 iOS 与 Android 双平台。采用 **React Native 0.74** 框架搭建，以 **Offline-First** 为核心理念，确保门店运维人员在弱网甚至无网络环境下仍能流畅完成核心业务操作。

架构上遵循"状态可离线 → 变更可同步 → 冲突可合并"的三级可靠性模型，底层由 WatermelonDB（本地 SQLite）承载离线数据，通过 CRDT 算法保障多设备间的数据最终一致性。同时集成 FCM/APNs 原生推送与 WebSocket 实时通道，保障消息触达的及时性。

**定位:** 神机营平台的"现场操作端"——面向门店管理员、区域督导、一线运维人员，提供会员接待、订单处理、库存盘点、设备巡检等关键业务能力。

---

## 🏗️ 架构总览

```
┌────────────────────────────────────────────────┐
│                  UI Layer                       │
│  React Navigation (Stack/Tab/Drawer)  +  Screens│
├────────────────────────────────────────────────┤
│              State & Cache Layer               │
│  Zustand (global) + React Query (server cache) │
├────────────────────────────────────────────────┤
│           Offline-First Engine                 │
│  WatermelonDB (SQLite) → Sync Queue → CRDT     │
├────────────────────────────────────────────────┤
│              Network Layer                     │
│  Axios (interceptors) + WebSocket + Push (FCM) │
├────────────────────────────────────────────────┤
│              Platform Layer                    │
│  React Native 0.74 (iOS/Android) + Native APIs │
└────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
apps/mobile/
├── App.tsx                          # 根组件 (NavigationContainer + providers)
├── index.js                         # RN entry point (AppRegistry)
├── app.json                         # App metadata (name, displayName, scheme)
├── package.json
├── tsconfig.json                    # TypeScript strict 配置
├── babel.config.js                  # Babel + module-resolver aliases
├── metro.config.js                  # Metro bundler 配置
├── android/                         # Android 原生工程
├── ios/                             # iOS 原生工程 (Xcode workspace)
├── __tests__/                       # 集成测试
└── src/
    ├── app/                         # 应用初始化与引导
    │   ├── Bootstrap.tsx            # 启动逻辑 (auth check, sync init)
    │   └── ErrorBoundary.tsx        # 全局错误边界
    ├── navigation/                  # 路由定义
    │   ├── RootNavigator.tsx        # 根导航 (auth stack + main stack)
    │   ├── TabNavigator.tsx         # 底部 Tab 导航
    │   └── types.ts                 # 路由参数类型
    ├── screens/                     # 业务页面
    │   ├── Login/                   # 登录/扫码登录
    │   ├── Dashboard/               # 工作台首页
    │   ├── Member/                  # 会员管理 (详情/积分/充值)
    │   ├── Order/                   # 订单列表/详情/操作
    │   ├── Inventory/               # 库存盘点/调拨
    │   ├── Store/                   # 门店管理
    │   ├── Notification/            # 通知中心
    │   └── Profile/                 # 个人中心/设置
    ├── components/                  # 通用 UI 组件
    │   ├── Form/                    # 表单控件 (Input, Picker, DatePicker)
    │   ├── DataDisplay/            # 数据展示 (Card, List, Badge)
    │   ├── Feedback/               # 反馈组件 (Toast, Modal, ActionSheet)
    │   └── Layout/                 # 布局组件 (SafeArea, Header, Loading)
    ├── store/                       # Zustand 全局状态
    │   ├── authStore.ts             # 认证状态 (token, user)
    │   ├── syncStore.ts             # 同步状态 (queue size, last sync)
    │   └── appStore.ts              # 应用状态 (device info, settings)
    ├── network/                     # 网络层
    │   ├── api.ts                   # Axios 实例 + 拦截器
    │   ├── queryClient.ts           # React Query 客户端配置
    │   ├── pushService.ts           # FCM/APNs 推送注册与处理
    │   └── websocket.ts             # WebSocket 连接管理
    ├── sync/                        # 离线同步引擎
    │   ├── syncEngine.ts            # 同步调度器 (pull/push)
    │   ├── syncQueue.ts             # 离线操作队列 (FIFO + retry)
    │   ├── conflictResolver.ts      # CRDT 冲突解决策略
    │   └── syncStatus.ts            # 同步状态监控
    ├── db/                          # WatermelonDB 数据层
    │   ├── schema.ts                # 数据库 Schema 定义
    │   ├── models/                  # 数据模型 (Member, Order, Product...)
    │   └── migrations/              # 数据库迁移
    └── utils/                       # 工具函数
        ├── storage.ts               # AsyncStorage 封装
        ├── permissions.ts           # 权限请求 (camera, location)
        ├── formatters.ts            # 日期/金额/手机号格式化
        └── constants.ts             # 全局常量
```

---

## ⚙️ 环境要求

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | ≥ 18 LTS | 运行时 |
| pnpm | ≥ 8 | 包管理 (monorepo) |
| Xcode | ≥ 15 | iOS 构建 (macOS only) |
| CocoaPods | ≥ 1.14 | iOS 依赖管理 |
| Android Studio | ≥ Hedgehog | Android 构建 |
| JDK | ≥ 17 | Android 编译 |
| Ruby | ≥ 2.7 (系统) | CocoaPods 依赖 |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 在 monorepo 根目录执行
pnpm install

# iOS 额外安装 Pods
cd apps/mobile/ios && pod install && cd ../..
```

### 2. 配置环境

复制 `.env.example` 为 `.env` 并填入以下配置：

```env
# API 服务地址
API_BASE_URL=https://api-dev.shenjiying.com

# 推送配置
FCM_SENDER_ID=your_fcm_sender_id
APNS_TOPIC=com.shenjiying.mobile

# 第三方服务
SENTRY_DSN=your_sentry_dsn
UMENG_APP_KEY=your_umeng_key
```

### 3. 启动 Metro Bundler

```bash
# 单独启动 Metro
cd apps/mobile && npx react-native start

# 或使用 monorepo 脚本
pnpm --filter shenjiying-mobile start
```

### 4. 运行应用

```bash
# iOS Simulator (macOS)
pnpm --filter shenjiying-mobile ios

# Android Emulator / 真机
pnpm --filter shenjiying-mobile android

# 指定设备/模拟器
pnpm --filter shenjiying-mobile ios --simulator "iPhone 15 Pro"
pnpm --filter shenjiying-mobile android --device "Pixel_7_API_34"
```

### 5. 开发构建

```bash
# Debug APK
cd android && ./gradlew assembleDebug

# Release IPA (iOS)
# 通过 Xcode Archive 导出
```

---

## 🎯 核心功能

| # | 功能模块 | 说明 | 离线支持 |
|---|---------|------|---------|
| 1 | **工作台 Dashboard** | 门店当日概览：营收、客流量、待处理单据 | ✅ 可缓存 |
| 2 | **会员管理** | 会员查询、详情、积分操作、充值、开卡 | ✅ 全离线 |
| 3 | **订单处理** | 订单列表、详情、退款/退货操作 | ✅ 全离线 |
| 4 | **库存管理** | 实时库存查询、盘点录入、调拨申请 | ✅ 全离线 |
| 5 | **门店管理** | 门店信息查看、设备状态监控、开关门操作 | ✅ 可缓存 |
| 6 | **推送通知** | 业务事件推送（订单变更、库存预警、营销活动） | ❌ 依赖网络 |
| 7 | **实时消息** | WebSocket 点对点聊天、客服会话 | ❌ 依赖网络 |
| 8 | **离线同步** | 变更队列 → 网络恢复后台自动拉取/推送 | ✅ 核心能力 |
| 9 | **多设备协同** | 同一账号多设备登录、操作状态实时合并 | ✅ CRDT 合并 |
| 10 | **扫一扫** | 扫码查会员、扫码查商品、扫码核销 | ✅ 扫码可离线 |
| 11 | **报表查看** | 门店日报、周报、月报数据可视化 | ✅ 可缓存 |
| 12 | **个人设置** | 密码修改、通知偏好、设备管理 | ✅ 可离线 |
| 13 | **手势/面容解锁** | 快捷登录（Biometric Auth） | ✅ 本地 |
| 14 | **深色模式** | 跟随系统或手动切换主题 | ✅ 本地 |

---

## 🔧 技术栈

| 类别 | 选型 | 版本 | 用途 |
|------|------|------|------|
| **框架** | React Native | 0.74 | 跨平台移动端框架 |
| **语言** | TypeScript | 5.x | 类型安全开发 (strict) |
| **路由** | React Navigation | 6.x | Stack + Tab + Drawer 路由 |
| **状态管理** | Zustand | 4.x | 轻量级全局状态 (≤1KB) |
| **服务端缓存** | TanStack React Query | 5.x | 异步数据缓存与乐观更新 |
| **本地数据库** | WatermelonDB | 0.27 | SQLite + Observable 响应式数据 |
| **离线同步** | CRDT (自定义) | — | Conflict-free Replicated Data Type |
| **HTTP 客户端** | Axios | 1.x | 请求/响应拦截器 (auth + refresh + logging) |
| **推送** | Notifee + FCM/APNs | — | 双平台原生推送服务 |
| **实时通信** | WebSocket | — | 点对点聊天与事件推送 |
| **表单** | React Hook Form | 7.x | 高性能表单 + zod 校验 |
| **动画** | React Native Reanimated | 3.x | 60fps 动画 |
| **存储** | AsyncStorage / MMKV | — | KV 持久化存储 |
| **日志** | Sentry | — | 崩溃监控与性能追踪 |
| **测试** | Jest + React Native Testing Library | — | 单元测试 + 组件测试 |

---

## 🧩 关键依赖包

| 包名 | 说明 | 是否 monorepo 内部 |
|------|------|-------------------|
| `@m5/types` | 公共类型定义 (与 API 共享) | ✅ |
| `@m5/sdk` | API 接口封装 (Axios 实例) | ✅ |
| `@m5/api` | 后端 API 服务 | 外部引用 |

---

## 📐 开发规范

### 代码风格
- **TypeScript strict** 模式启用，禁止使用 `any`
- **ESLint** + **Prettier** 自动格式化（Husky pre-commit hook）
- 组件采用 **Functional Component + Hooks** 模式
- 命名规范: 组件 `PascalCase`，工具函数 `camelCase`，常量 `UPPER_SNAKE`

### 分支策略
```
main        → 生产发布
develop     → 日常开发集成
feature/*   → 功能分支
fix/*       → 修复分支
release/*   → 发布分支
```

### 提交规范 (Conventional Commits)
```
feat(mobile): 添加库存盘点功能
fix(mobile): 修复离线队列死锁问题
chore(mobile): 升级 React Native 至 0.74.5
```

### 测试要求
- 新功能必须包含 **组件测试** (React Native Testing Library)
- 离线同步逻辑必须覆盖 **集成测试**
- E2E 测试使用 **Detox** 框架（iOS/Android）

### 性能优化检查清单
- [ ] 图片使用 resize mode: contain/cover，避免 OOM
- [ ] FlatList 启用 `getItemLayout` 和 `windowSize`
- [ ] 使用 `React.memo` 包裹高频重渲染组件
- [ ] 避免 `inline style`，优先使用 StyleSheet.create
- [ ] 离线数据使用 WatermelonDB lazy loading

---

## 🔗 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 架构规格 | `/.trae/specs/phase-21-mobile/` | Phase-21 Mobile 完整规格 |
| 任务分解 | `/.trae/specs/phase-21-mobile/tasks.md` | Pulse 任务清单 |
| WatermelonDB 集成 | `/.trae/specs/phase-21-mobile/watermelon-guide.md` | 本地数据库使用指南 |
| 离线同步设计 | `/.trae/specs/phase-21-mobile/sync-design.md` | CRDT 同步协议 |
| API 文档 | `apps/api/README.md` | 后端 API 服务说明 |
| 公共类型 | `packages/types/README.md` | 共享类型定义 |

---

## 📊 Phase-21 里程碑

| Pulse | 范围 | 状态 |
|-------|------|------|
| Pulse-84 (T51-T54) | RN Foundation + 路由 + 状态 + 网络 | ✅ Done |
| Pulse-85 (T55-T56) | Offline-First I — WatermelonDB + 离线队列 | ✅ Done |
| Pulse-86 (T57-T58) | Offline-First II — CRDT + 同步引擎 | ✅ Done |
| Pulse-87 (T59-T61) | Push & Realtime — FCM/APNs + WebSocket | ✅ Done |
| Pulse-88 (T62-T63) | Multi-Device — 设备清单 + 状态合并 | ✅ Done |
| Pulse-89 (T64) | Retro + Phase-22 规划 | 🔄 In Progress |

---

## 👥 Owner

| 角色 | 负责人 | 领域 |
|------|--------|------|
| E7 孙体验 | 孙XX | UX 设计与体验 |
| E22 郑移动 | 郑XX | Mobile 架构与开发 |
| QA | 待定 | 测试与质量保障 |

---

## 许可证

私有 — 仅供 神机营 平台内部使用。
