# @m5/app — 神机营移动端 App

> 神机营 React Native 移动端应用，面向门店运营人员，提供收银、订单、库存、会员、客服、报表等核心业务功能的移动工作台。

---

## 定位

@m5/app 是神机营 SaaS 平台的**移动端 App**，基于 React Native (Expo) 构建，门店一线运营人员通过该应用完成收银、订单处理、库存管理、会员服务、报表查看等日常运营工作，支持离线模式及推送通知。

---

## 核心功能清单

| 功能域 | 说明 |
|--------|------|
| 收银管理 | 收银面板、扫码支付、结账流程 |
| 订单管理 | 订单查询、订单卡片/详情、状态流转、订单列表加载更多 |
| 库存管理 | 库存盘点、采购下单、门店调拨 |
| 会员管理 | 会员等级分布/升级路径、积分历史、RFM 分析、充值面板 |
| 客户服务 | 客服工单、会员跟进任务 |
| 报表分析 | 运营报表、门店对比、会员生命周期 |
| 设备管理 | 设备巡检、状态面板 |
| 员工管理 | 排班管理、交接班 |
| 营销工具 | 促销管理、会员营销 |
| 离线支持 | 网络状态监测、离线数据缓存 |
| 推送通知 | Expo Notifications 推送 |
| 国际化 | 多语言支持 (i18n) |
| 门店选择 | 多门店身份切换 |
| AI 能力 | AI 决策、智能洞察、场景推荐 |

---

## 关键文件说明

```
apps/app/
├── screens/                # 页面级组件
│   ├── cashier/            # 收银相关页面
│   ├── cs/                 # 客服相关页面
│   ├── device/             # 设备相关页面
│   ├── home/               # 首页
│   ├── inventory/          # 库存管理页面
│   ├── marketing/          # 营销相关页面
│   ├── member/             # 会员管理页面
│   ├── orders/             # 订单管理页面
│   ├── report/             # 报表页面
│   ├── scan/               # 扫码页面
│   ├── settings/           # 设置页面
│   └── staff/              # 员工管理页面
├── components/             # 共享业务组件
│   ├── common/             # 通用业务组件
│   ├── OrderCard.tsx       # 订单卡片
│   ├── MemberCard.tsx      # 会员卡片
│   ├── InventoryCard.tsx   # 库存卡片
│   └── ...                 # 其他业务组件
├── services/               # 业务服务层
├── context/                # React Context 状态管理
├── navigation/             # React Navigation 导航配置
├── types/                  # 类型定义
├── utils/                  # 工具函数
├── test/                   # 测试环境配置
├── test-utils/             # 测试工具
├── market-bootstrap.ts     # 市场引导启动
├── App.tsx                 # 应用入口
├── app.json                # Expo 配置
├── babel.config.js         # Babel 配置
├── package.json            # 包信息 (@m5/app)
└── tsconfig.json           # TypeScript 配置
```

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React Native 0.74 (Expo SDK 51) |
| 语言 | TypeScript 5.8 |
| 导航 | React Navigation 6 (BottomTab + NativeStack) |
| 状态管理 | React Context + useReducer |
| 离线支持 | @react-native-community/netinfo + AsyncStorage |
| 推送通知 | expo-notifications |
| 生物识别 | expo-local-authentication |
| 国际化 | expo-localization + i18n |
| 测试 | Node Test Runner + 自定义 mock 环境 |
| 包管理 | pnpm workspace (monorepo) |
| 内部包 | @m5/sdk, @m5/types |

---

## 开发命令

```bash
pnpm dev           # Expo 开发模式
pnpm android       # Android 构建与运行
pnpm ios           # iOS 构建与运行
pnpm web           # Web 模式运行
pnpm lint          # ESLint 检查
pnpm typecheck     # TypeScript 类型检查
pnpm test          # 运行测试
```

---

## Owner

- **维护团队**: 神机营前端组 (M5 FE Team)
- **Owner**: yaoyunzhong
