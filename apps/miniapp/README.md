# @m5/miniapp — 神机营 微信小程序

> Taro 4 跨端框架 · React 18 运行时 · TypeScript Strict · 门店运营核心工具集

## 📋 模块概述

`@m5/miniapp` 是神机营 SaaS 平台的微信小程序端，面向门店运营人员和管理者提供轻量化的移动办公能力。基于 **Taro 4** 跨端编译框架构建，使用 **React 18** 作为 UI 运行时，编译目标为微信小程序 (weapp) 平台。

与 iOS/Android Native App 不同，小程序定位为"轻量级运营工具"——入口轻、分享快、社交裂变能力强，适合门店日常高频操作（会员接待、采购下单、兑换核销），同时承担微信生态内的流量转化与裂变传播角色。

**架构要点：**
- 以 `@m5/sdk` 作为 API 接口层封装，与后端 `@m5/api` 解耦
- 类型定义完全复用 `@m5/types` 共享包，保证前后端类型一致
- 基于 Taro 4 的跨端编译能力，后续可扩展到支付宝/百度/H5 等多平台
- 组件级状态管理（React hooks），无全局状态库的冗余负担

---

## 🏗️ 架构总览

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                       │
│   Taro components + 自定义组件库 + 业务页面      │
├─────────────────────────────────────────────────┤
│               Business Logic                    │
│   Custom Hooks + 工具函数 + 业务封装            │
├─────────────────────────────────────────────────┤
│            API Integration Layer                │
│   @m5/sdk (统一 API 调用) + 请求拦截器 + 缓存   │
├─────────────────────────────────────────────────┤
│                 Taro 4 跨端编译                  │
│   JSX → 小程序 WXML → 双线程渲染 (逻辑层+视图层)│
├─────────────────────────────────────────────────┤
│               微信原生能力                       │
│   wx.login / wx.requestPayment / 云开发         │
└─────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
apps/miniapp/
├── config/                       # Taro 编译配置
│   ├── index.js                  # 通用配置 (alias, plugins, defineConstants)
│   ├── dev.js                    # 开发环境 (local API + mock)
│   └── prod.js                   # 生产环境 (线上 API)
├── types/                        # 小程序特定类型定义
├── src/
│   ├── app.tsx                   # 应用入口 (Provider 注入 + 全局状态初始化)
│   ├── app.config.ts             # 小程序全局配置 (pages, window, tabBar)
│   ├── app.scss                  # 全局样式 (CSS variables + reset)
│   ├── pages/                    # 业务页面
│   │   ├── index/                # 首页 — 门店工作台/数据概览
│   │   ├── member/               # 会员管理 — 查询/详情/积分/开卡
│   │   │   ├── index.tsx         # 会员列表页
│   │   │   └── detail/           # 会员详情页
│   │   ├── purchase-orders/      # 采购订单 — 创建/审批/跟踪
│   │   │   ├── index.tsx         # 订单列表
│   │   │   └── detail/           # 订单详情/操作
│   │   ├── return-orders/        # 退货订单 — 退货申请/审核/退款跟踪
│   │   │   ├── index.tsx         # 退货列表
│   │   │   └── detail/           # 退货详情
│   │   ├── redeem-center/        # 兑换中心 — 积分兑换/优惠券核销/礼品兑换
│   │   ├── customer-service/     # 客服工具 — 在线问答/工单提交/历史记录
│   │   └── sales-tools/          # 销售工具 — 推荐话术/商品展示/客户画像
│   ├── components/               # 通用 UI 组件
│   │   ├── DomainGovernancePanel.tsx   # 多租户治理面板
│   │   ├── TriStateComponents.tsx      # 三态切换组件 (正常/禁用/加载)
│   │   ├── DataTable/            # 数据表格 (排序/筛选/分页)
│   │   ├── FormField/            # 表单字段 (输入/选择/日期)
│   │   ├── StatusBadge/          # 状态标签 (待处理/进行中/已完成)
│   │   └── EmptyState/           # 空状态展示
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useAuth.ts            # 登录态管理 (wx.login token 维护)
│   │   ├── usePagination.ts      # 分页加载 (scroll 触底加载)
│   │   ├── useDebounce.ts        # 防抖输入 (搜索场景)
│   │   └── usePermission.ts      # 小程序权限申请 (位置/相册)
│   ├── utils/                    # 工具函数
│   │   ├── request.ts            # 请求封装 (@m5/sdk 包装)
│   │   ├── storage.ts            # wx.setStorage / getStorage 封装
│   │   ├── formatters.ts         # 金额/日期/手机号脱敏处理
│   │   └── track.ts              # 埋点上报 (自定义分析)
│   ├── api-integration.test.ts   # API 集成测试
│   ├── market-bootstrap.ts       # 市场引导初始化逻辑
│   ├── supplychain-runtime.ts    # 供应链业务运行时
│   └── __smoke__/                # 冒烟测试 (快速验证关键路径)
├── project.config.json           # 微信开发者工具项目配置
├── project.tt.json               # 字节跳动小程序 (预留)
├── package.json                  # 依赖定义与 npm scripts
├── tsconfig.json                 # TypeScript strict 编译配置
└── babel.config.js               # Babel 配置 (Taro preset)
```

---

## ⚙️ 环境要求

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | ≥ 18 LTS | 开发运行时 |
| pnpm | ≥ 8 | 包管理 (monorepo) |
| Taro CLI | 4.x | 跨端编译脚手架 |
| 微信开发者工具 | ≥ 1.06 | 小程序预览/调试/上传 |
| 微信小程序 AppID | 必填 | 项目注册与 API 权限 |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 在 monorepo 根目录执行
pnpm install
```

### 2. 配置开发环境

微信开发者工具 -> 导入项目 -> 选择 `apps/miniapp/dist/` 目录，填入 AppID。

小程序后端 API 基地址通过 `@m5/sdk` 配置注入，编译时通过 `defineConstants` 注入：

```javascript
// config/dev.js
module.exports = {
  env: {
    NODE_ENV: '"development"',
  },
  defineConstants: {
    API_BASE_URL: '"https://api-dev.shenjiying.com"',
  },
  mini: {},
  h5: {},
};
```

### 3. 启动开发构建

```bash
# 开发模式 (热重载 + 监听文件变化)
pnpm --filter @m5/miniapp dev

# 构建完成后，在微信开发者工具中打开 dist/ 目录
# 点击"预览"可生成二维码，真机扫码体验
```

### 4. 生产构建

```bash
# 生产构建 (压缩 + 分包优化)
pnpm --filter @m5/miniapp build:weapp

# 类型检查 (TS strict 校验)
pnpm --filter @m5/miniapp typecheck

# 运行测试
pnpm --filter @m5/miniapp test
```

### 5. 上传发布

```bash
# 在微信开发者工具中
# 工具栏 -> 上传 -> 填写版本号与更新说明
# 登录微信小程序管理后台 -> 版本管理 -> 提交审核
```

### 可用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm --filter @m5/miniapp dev` | 开发模式 (HMR + 监听) |
| `pnpm --filter @m5/miniapp build` | TypeScript 编译检查 |
| `pnpm --filter @m5/miniapp build:weapp` | 微信小程序生产构建 |
| `pnpm --filter @m5/miniapp test` | 运行单元/集成测试 |
| `pnpm --filter @m5/miniapp typecheck` | TypeScript 类型检查 |
| `pnpm --filter @m5/miniapp lint` | ESLint 代码规范检查 |

---

## 🎯 核心功能

| # | 功能模块 | 页面路径 | 说明 |
|---|---------|----------|------|
| 1 | **门店工作台** | `pages/index` | 当日营收、客流量、待办提醒、快捷入口 |
| 2 | **会员查询与管理** | `pages/member` | 扫码/搜索会员、详情、积分调整、开卡充值 |
| 3 | **采购订单管理** | `pages/purchase-orders` | 下单、审批流、订单跟踪、历史记录 |
| 4 | **退货处理** | `pages/return-orders` | 退货申请、质检审核、退款处理、进度追踪 |
| 5 | **兑换中心** | `pages/redeem-center` | 积分兑换商品/优惠券、核销码验证、兑换记录 |
| 6 | **客服工具** | `pages/customer-service` | 在线客服、工单提交/追踪、FAQ 知识库 |
| 7 | **销售工具** | `pages/sales-tools` | 商品推荐话术、客户画像、销售排行 |
| 8 | **消息通知** | 全局悬浮 | 订单状态变更、审核结果、系统公告的实时推送 |
| 9 | **数据看板** | 首页嵌入 | 门店核心 KPI 可视化、趋势图、同比环比 |
| 10 | **扫码能力** | 全局 | 扫码查会员、查商品、核销兑换码、签到打卡 |
| 11 | **多租户切换** | 全局 | 管理多门店的账号权限切换与数据隔离 |
| 12 | **离线缓存** | 全局 Tab | 常用页面数据本地缓存，弱网下可浏览历史数据 |
| 13 | **社交分享** | 各详情页 | 商品/活动/会员通过微信分享卡片传播裂变 |
| 14 | **语音输入/搜索** | 搜索入口 | 支持语音转文字快速搜索会员/商品/订单 |
| 15 | **权限管理** | 页面级 | 基于角色的页面/操作权限控制和功能灰度 |

---

## 🔧 技术栈

| 类别 | 选型 | 版本 | 用途 |
|------|------|------|------|
| **跨端框架** | Taro | 4.x | 多端统一编译 (weapp/h5/支付宝等) |
| **UI 运行时** | React | 18.x | JSX 组件渲染 |
| **语言** | TypeScript | 5.x | 类型安全开发 (strict) |
| **组件库** | @tarojs/components | 4.x | Taro 内置 UI 组件 |
| **状态管理** | React Hooks (内置) | — | 组件级状态，避免全局冗余 |
| **后端 SDK** | @m5/sdk | — | 统一 API 接口调用封装 |
| **类型定义** | @m5/types | — | 公共模型/DTO 类型定义 |
| **构建工具** | Webpack 5 (Taro) | 5.x | 代码打包与分包优化 |
| **样式方案** | SCSS + CSS Variables | — | 模块化样式编写 |
| **测试** | Node `--test` (tsx) | — | 测试运行器 (tsx 支持) |
| **代码检查** | ESLint + Taro 规则 | — | 代码规范与最佳实践 |

---

## 📐 开发规范

### 代码风格
- **TypeScript strict** 模式，禁止 `any` 类型
- 组件采用 Functional Component + Hooks 模式
- 页面组件放在 `pages/<module>/` 下，通用组件放 `components/`
- 样式使用 SCSS，遵循 BEM 命名规范

### 分包策略
小程序包体积限制 2MB，采用分包加载：

```
主包 (≈800KB)           → 首页、会员管理、通用组件
分包1: purchase-orders  → 采购订单 (≈400KB)
分包2: return-orders    → 退货处理 (≈350KB)
分包3: redeem-center    → 兑换中心 (≈300KB)
分包4: customer-service → 客服工具 (≈250KB)
分包5: sales-tools      → 销售工具 (≈200KB)
```

### 性能优化
- 列表页使用虚拟列表 (Taro VirtualList)
- 图片使用 `lazy-load` 属性 + WebP 格式
- 控制 `setData` 数据量，避免单次 > 1024KB
- 使用 Taro 的预加载 (preload) 加速页面切换
- 关键路径数据本地缓存 (wx.setStorage)

### 提交规范
```
feat(miniapp): 新增兑换中心核销码扫码功能
fix(miniapp): 修复采购订单审批状态不同步问题
chore(miniapp): 升级 Taro 4.2 → 4.3
```

---

## 🧩 相关依赖包

| 包名 | 说明 | 引用方式 |
|------|------|---------|
| `@m5/sdk` | API SDK — Axios 实例 + 请求/响应拦截 | 直接 import |
| `@m5/types` | 公共类型 — 会员/订单/商品等模型定义 | 类型引用 |
| `@m5/api` | 后端 API 服务 | 运行时调用 |

---

## 🔗 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| Taro 4 文档 | https://docs.taro.zone/ | 跨端框架官方文档 |
| 微信小程序开发 | https://developers.weixin.qq.com/miniprogram/dev/ | 微信官方开发文档 |
| API SDK 使用指南 | `packages/sdk/README.md` | @m5/sdk 调用方式与错误码 |
| 公共类型定义 | `packages/types/README.md` | @m5/types 模型说明 |
| 后端 API 服务 | `apps/api/README.md` | 后端模块接口文档 |
| 冒烟测试 | `src/__smoke__/` | 关键路径冒烟测试脚本 |

---

## ✅ 测试策略

| 测试层级 | 工具 | 覆盖范围 |
|---------|------|---------|
| 单元测试 | Node `--test` (tsx) | Hooks、工具函数、格式化器 |
| 组件测试 | Node `--test` (tsx) | 通用 UI 组件、业务组件 |
| API 集成测试 | `api-integration.test.ts` | API 调用链路、错误处理 |
| 冒烟测试 | `__smoke__/` | 关键用户路径 (登录→首页→会员查询) |
| E2E (手动) | 微信开发者工具 | 流程验证、扫码、支付 |

---

## 📊 发布流程

```
feature 开发 → PR → Code Review → merge to develop
       ↓
   dev 环境验证 (开发者工具真机调试)
       ↓
   staging 构建 (build:weapp + typecheck)
       ↓
   QA 验收 (测试用例覆盖)
       ↓
   release 分支 → 构建上传 → 提交审核
       ↓
  微信审核通过 → 全量/灰度发布
```

---

## 许可证

私有 — 仅供 神机营 平台内部使用。
