# 🧪 e2e — 端到端测试目录

## 模块概述

`e2e/` 是神机营 SaaS 平台的端到端测试根目录，基于 **Playwright** 框架构建，覆盖 8 个角色视角的前端页面冒烟验证与 36+ 条跨模块全链路测试。测试以"龙虾哥"为执行代号，每晚第二段（03:30-05:30 CST）自动执行，累计维护 **~338 个 subtests**，覆盖 admin-web、storefront-web、tob-web、miniapp、mobile 等多个入口。

本目录不直接包含测试文件，而是组织测试的共享基础设施——页面对象（Page Object）、测试夹具（Fixture）、工具函数（Test Helper），以及顶层冒烟入口。具体测试用例集中在 `tests/` 子目录中。

## 核心文件结构

```
e2e/
├── README.md                       # 本文档
├── smoke-role-frontend.spec.ts     # 🧪 8 角色视角前端冒烟（店长/前台/HR/安监/导玩员/运行专员/团建/营销）
├── pages/                          # 🏗 页面对象模型（Page Object Model）
│   ├── base.page.ts               #   基类：通用导航、等待、断言
│   └── license.page.ts            #   许可管理页面
├── fixtures/                       # 🛠 测试夹具与测试数据
│   ├── auth.fixture.ts            #   认证授权夹具（角色登录态模拟）
│   └── test-data.ts               #   测试数据工厂（种子数据生成）
├── utils/                          # 🔧 工具函数
│   └── test-helpers.ts            #   通用辅助方法
└── tests/                          # 📝 测试用例目录（22+ 条 E2E 用例）
    ├── README.md                   # 测试用例详细说明
    ├── license-*.spec.ts           # 许可管理（激活/检查/管理/错误/安全/性能）
    ├── cashier-pos-*.spec.ts       # 收银 POS 测试
    ├── checkout-amount-*.spec.ts   # 结算金额测试
    ├── cross-module-chain*.ts      # 跨模块链路（SKU/通知/退款/i18n/BI）
    ├── member-full-flow.spec.ts    # 会员全流程
    ├── e2e-l3-baseline-*.test.ts   # L3 店面前台基线
    └── responsive/                 # 响应式适配（五端验证）
```

## 使用方式

```bash
# 运行所有 E2E 测试
pnpm exec playwright test --project=chromium e2e/

# 按分类运行
pnpm exec playwright test e2e/tests/license-*.spec.ts   # 许可模块全系列
pnpm exec playwright test e2e/tests/cross-module-*      # 跨模块链路
pnpm exec playwright test e2e/smoke-role-frontend.spec.ts  # 角色冒烟

# 带 UI 模式调试
pnpm exec playwright test --ui e2e/tests/

# 生成 HTML 报告并查看
pnpm exec playwright show-report
```

## 测试架构说明

- **角色冒烟（smoke-role-frontend）**：以 8 个"角色人"视角对前端关键页面做冒烟验证，正例 + 反例 + 边界三级覆盖
- **跨模块链路（cross-module-*）**：串联多个微服务的前->后->端全流程验证，依赖完整部署环境
- **许可管理系列**：覆盖许可激活、续期、错误处理、安全边界、性能基准等完整生命周期
- **页面对象模型**：`pages/` 采用 Page Object 模式，将页面元素与操作逻辑封装为可复用的类，减少测试代码重复

## 注意事项

- 运行前确保 Node.js 环境正常，TypeScript 编译通过，Playwright 浏览器已安装（`pnpm exec playwright install chromium`）
- 跨模块测试需前置启动 API 网关 + 各微服务实例，依赖数据库种子数据初始化
- 测试夹具 `auth.fixture.ts` 使用 OAuth 2.0 client credentials 流获取 token，需配置有效的服务账号
- 响应式测试依赖移动端 viewport 预设，建议使用 Playwright 内置设备模拟
- 测试日志默认输出至 `testing-system/logs/`，时长为 30s 超时，可根据网络环境调整

> 🦞 **龙虾哥说**：冒烟不过别下班，链子断了全白干。
