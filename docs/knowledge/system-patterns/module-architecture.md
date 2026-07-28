# 🧩 shenjiying88 模块架构模式 (V24)

> 最后更新: 2026-07-29 01:26 CST
> 维护: 🦞 龙虾哥

---

## 一、191模块分类

```
shenjiying88 模块架构
├── 核心业务 (Phase 31-38)    — 收银/会员/库存/财务
├── 品牌运营 (Phase 47)       — brand-custom/analytics/workspace
├── 后勤管理 (Phase 30)       — logistics/supplement/stock-transfer
├── AI 智能                    — ai-{diagnosis,forecast,insight,marketing,model-config,push,rag,recommend,review,reviewer,rule-engine,sales}
├── 安全合规                   — auth/rbac/rls/minor-protection/permission
├── 租户管理                   — tenant/tenant-config/tenant-llm/multi-region
├── 交易支付                   — cashier/payment-gateway/checkout/transactions/currency
├── 门店管理                   — storefront/stores/scout/locale
├── 营销运营                   — campaign/coupon/loyalty/marketing/marketing-metrics
├── 基础设施                   — deploy/devops/monitoring/observability/chaos/canary
├── 数据平台                   — analytics/analytics-v2/reports/report/insight
└── 领域模型                   — packages/domain/{member,inventory,finance,order,...}
```

## 二、三层架构标准

每个模块遵循统一的分层结构：

```
modules/<name>/
├── <name>.entity.ts        # 实体/类型定义 (接口+类型)
├── <name>.dto.ts           # DTO (class-validator)
├── <name>.module.ts        # NestJS Module 注册
├── <name>.service.ts       # 业务逻辑层
├── <name>.controller.ts    # API 端点 (含 @UseGuards)
├── README.md               # 模块说明
├── ACCEPTANCE.md           # 验收标准
├── <name>.service.test.ts  # Service 单元测试 (15+)
├── <name>.controller.test.ts # Controller 测试
├── <name>.e2e.test.ts      # 模块 E2E 测试
└── __tests__/              # 额外测试
```

## 三、圈梁五道箍派单模式

```
每天 06:00-08:00 龙虾哥派单
├── 树哥A: 文档线 → README/ACCEPTANCE/PRD 产出
├── 树哥B: 测试线 → Service 测试 15+ (边界+异常+并发)
└── 树哥C: E2E线  → 端到端 25+ (跨模块链路)

完成后 → 提交 + 下一轮
```

### 保底续产
- 30分钟一次检查工作区
- 有修改即提交（不空跑）
- 带 `[保底续产]` / `🔄` 标签

## 四、E2E 测试体系

### 41条端到端链

| 链 | 覆盖领域 |
|:---:|:-----|
| 01-06 | admin→SDK→API→storefront 基础链路 |
| 07-12 | storefront→mobile→tob 跨端 |
| 13-18 | miniapp→SDK→domain→admin 异步管道 |
| 19-24 | 低代码→i18n→监控→租户 |
| 25-30 | 会员积分→点餐→规则引擎→采购 |
| 31 | P-31 RLS 多租户验收 |
| 32 | P-37 库存采购验收 |
| 33 | P-38 财务对账验收 |
| 34 | P-47 品牌运营验收 (V24 新增) |
| 35 | P-30 后勤管理验收 (V24 新增) |
| 36 | 未成年保护验收 (V24 新增) |
| 37 | storefront checkout API |
| 38 | API checkout payment refund |
| 34-38 | cross-module-journey (非Phase专用) |

### 三端测试模式

```
apps/admin-web/app/__e2e__/    → 43个测试文件 (41链 + pos-checkout)
apps/api/test/                    → API模块测试
e2e/tests/                        → Playwright浏览器测试
```

## 五、安全架构

```
请求 → IdentityAccessGuard (全局) → 224/224 Controller
     → RLS (54/65表 tenant_id 隔离)
     → RateLimit (按模块)
     → 未成年保护 (6种限制: 时长/消费/盲盒/内容/游戏/聊天)
```

## 六、部署架构

```
代码仓库 → kaniko build → k8s deploy → 阿里云 ACK
         → Prisma migrate → ACK RDS PostgreSQL
         → 四端: admin-web / storefront-web / tob-web / api
```

## 七、V24 模式演进

| 维度 | V23 旧模式 | V24 新模式 |
|:-----|:-----|:-----|
| 保底续产 | 30分钟全模块轮查 | 30分钟仅提交变更 |
| 树哥派单 | 三线全开轮查 | 按需分派指定模块 |
| 测试深度 | 15+/25+ 数量驱动 | 边界/异常/并发覆盖 |
| 文档 | 模板填充 | ACCEPTANCE 验收标准 |
| 知识管理 | 15天滞后 | 每日刷新 |

---

*🦞 龙虾哥 · V24 · 2026-07-29 01:26 CST*
