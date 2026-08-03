# 企业端门户 (ToB Web)

> 神机营体育 — 企业级后台管理与运营门户

## 定位

ToB Web 是神机营体育面向**品牌总部、运营团队、企业客户**的管理后台。提供告警监控、订单管理、库存管理、客户管理、营销活动、财务管理等全面的企业运营能力，采用深色主题设计。

## 路由 & 核心模块

| 子模块 | 说明 |
|--------|------|
| `/` | Dashboard — 系统概览、告警统计、快速入口 |
| `/[marketCode]` | 按市场代码动态路由 |
| `/ai-marketing` | AI 营销工具 |
| `/ai-rules-dashboard` | AI 规则仪表盘 |
| `/ai-sales-panel` | AI 销售面板 |
| `/alliance-dashboard` | 联盟管理面板 |
| `/announcements` | 系统公告管理 |
| `/audit-logs` | 审计日志 |
| `/blindbox` | 盲盒管理 |
| `/brand-website` | 品牌官网配置 |
| `/brands` | 品牌管理 |
| `/campaigns-data.ts` | 营销活动数据层 |
| `/cashier-pos` | POS 收银管理 |
| `/contracts` | 合同管理 |
| `/customers` | 客户管理 |
| `/docs-center` | 文档中心 |
| `/enterprise` | 企业信息管理 |
| `/finance-dashboard` | 财务管理面板 |
| `/member-center` | 会员中心 (B端) |
| `/members-data` | 会员数据层 |
| `/openapi-portal` | OpenAPI 开放平台 |
| `/operations` | 运维操作记录 |
| `/orders-data.ts` | 订单数据层 |
| `/products` | 产品管理 |
| `/purchase-orders` | 采购订单管理 |
| `/rbac-admin` | RBAC 权限管理 |
| `/salesperson-workbench` | 销售人员工作台 |
| `/sports-ants` | 运动蚂蚁（赛事/活动） |
| `/stock-data.ts` | 库存数据层 |
| `/stock-transfer` | 调拨管理 |
| `/stores` | 门店管理 |
| `/stores-data.ts` | 门店数据层 |
| `/suppliers-data.ts` | 供应商数据层 |
| `/suppliers` | 供应商管理 |
| `/svip` | SVIP 会员管理 |
| `/tenants` | 租户管理 |
| `/tournament` | 赛事管理 |
| `/training-center` | 培训中心 |

## 技术栈

- **Next.js App Router** — Server/Client Component 混合
- **TypeScript** — 严格类型，`@m5/types` 共享类型包
- **@m5/ui** — UI 组件（PageShell, StatCard, Tooltip 等）
- **深色主题** — 全局 `#0f172a` 背景，适合运营后台长时间使用

## 关键设计决策

1. **深色主题默认** — 整体采用 slate 色调深色背景，支持长时间监控操作
2. **数据层与页面分离** — `*-data.ts` 独立于 `page.tsx`，如 `orders-data.ts`、`stores-data.ts`、`campaigns-data.ts`，方便复用与测试
3. **RBAC 权限管理** — 通过 `/rbac-admin` 模块实现完整的角色-权限-用户管理
4. **多租户架构** — 通过 `/tenants` 模块管理租户生命周期，URL 动态路由支持多市场
5. **集成 runtime governance** — 参考 `runtime-governance.ts`，继承门店端类似的操作治理能力
6. **Fastify / OpenAI 集成** — 通过 `ai-marketing`、`ai-sales-panel`、`ai-rules-dashboard` 模块接入 AI 能力

## 测试入口

| 文件 | 类型 | 覆盖 |
|------|------|------|
| `tob-landing.test.ts` | 渲染测试 | 着陆页快照 |
| `portal-snapshot.test.ts` | 快照测试 | 门户加载完整性 |
| `brand-management.test.ts` | 单元测试 | 品牌管理功能 |
| `campaigns-page.test.ts` | 单元测试 | 活动管理页面 |
| `coupons-data.test.ts` | 单元测试 | 优惠券数据层 |
| `domain-governance-page.test.ts` | 单元测试 | 域治理页面 |
| `stores-data.test.ts` | 单元测试 | 门店数据层 |
| `tenant-settings.test.ts` | 单元测试 | 租户设置 |
| `__e2e__/` | E2E 测试 | 全链路集成 |
| `__smoke__/` | 冒烟测试 | 全模块冒烟健康检查 |

## 维护者

- 模块归属: Shenjiying ToB Team
- 依赖: `@m5/types`, `@m5/ui`
