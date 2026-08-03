# e2e/tests — 端到端测试用例集

## 模块简介

本目录存放神机营 SaaS 平台的 22 个端到端（E2E）测试用例文件，覆盖收银 POS、结算金额、会员全流程、许可管理、跨模块链路等核心业务场景。测试基于 Playwright 框架，按分类分为 smoke（冒烟）、regression（回归）、cross-module（跨模块）三大类，支持独立运行与全量执行。

## 目录结构

```
e2e/tests/
├── cashier-pos-enhanced.spec.ts       # 收银 POS 增强测试
├── cashier-pos-minimal.spec.ts        # 收银 POS 最小可用测试
├── checkout-amount-enhanced.spec.ts   # 结算金额增强测试
├── checkout-amount-l3.spec.ts         # 结算金额 L3 跨模块测试
├── cross-module-chain-full.spec.ts    # 跨模块全链路测试
├── cross-module-chain16-*.test.ts     # SKU 生命周期缓存跨模块
├── cross-module-chain17-*.test.ts     # 通知管道跨模块
├── cross-module-chain18-*.test.ts     # 退款全流程跨模块
├── cross-module-chain37-*.test.ts     # i18n 内容同步
├── cross-module-chain38-*.test.ts     # BI 分析导出
├── e2e-l3-baseline-storefront-*.test.ts  # L3 店面前台基线
├── license-*.spec.ts                  # 许可管理系列（激活/检查/管理/错误/扩展/回归/安全/性能）
├── member-full-flow.spec.ts          # 会员全流程测试
├── responsive/                       # 响应式适配子目录
│   └── 5-end-validation.spec.ts     # 移动端五端适配验证
└── README.md                         # 本文件
```

## 测试分类

| 分类 | 文件前缀 | 说明 |
|------|----------|------|
| **Smoke (冒烟)** | `*-minimal.spec.ts` | 核心流程最小可用验证，快速反馈 |
| **Regression (回归)** | `license-*.spec.ts`、`*-enhanced.spec.ts` | 许可全生命周期、POS/结算增强覆盖 |
| **Cross-module (跨模块)** | `cross-module-*`、`*-l3-baseline-*` | 跨多个微服务的端到端链路验证 |

## 使用方式

```bash
# 运行所有 E2E 测试
pnpm exec playwright test --project=chromium e2e/tests/

# 按分类运行
pnpm exec playwright test e2e/tests/cross-module-*     # 跨模块
pnpm exec playwright test e2e/tests/license-*.spec.ts   # 许可模块
pnpm exec playwright test e2e/tests/responsive/         # 响应式适配

# 生成 HTML 报告
pnpm exec playwright show-report
```

## 注意事项

- 测试依赖数据库种子数据（参考 `scripts/seed-*.sql` 和 `scripts/seed-*.ts`）
- 跨模块测试涉及多服务部署，需前置启动 API + Web 应用
- 响应式测试需要配置移动端 viewport，建议使用 Playwright 设备预设
