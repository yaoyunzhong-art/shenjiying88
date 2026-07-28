# 门店前端 (Storefront Web)

> 神机营体育 — 门店数字运动潮玩空间前端核心

## 定位

Storefront Web 是神机营体育面向**门店访客与会员**的官方网站。提供门店信息展示、设备预约、自助充值、会员服务、收银支付等完整的前台体验。采用多市场（multi-market）与多门店（multi-store）架构，通过 URL 路径段解析门店范围。

## 路由 & 核心模块

| 子模块 | 说明 |
|--------|------|
| `/` | 门店首页 — 活动推荐、快速入口、设备展示 |
| `/appointments` | 预约管理 |
| `/announcements` | 门店公告 |
| `/booking` | 预订系统 |
| `/bookshelf` | 书架上架/展示 |
| `/cashier` | 前台收银 |
| `/checkout` | 结算流程 |
| `/customer-service` | 客服入口 |
| `/customers` | 客户信息 |
| `/departments` | 部门管理 |
| `/device-reservation` | 设备预定 |
| `/feedback` | 用户反馈 |
| `/group-booking` | 团队预约 |
| `/h5` | H5 页面路由 |
| `/insights` | 运营洞察 |
| `/member-center` | 会员中心 |
| `/messages` | 消息通知 |
| `/operations` / `/operatio` | 运营管理 |
| `/ops-manager` | 运营经理面板 |
| `/products` | 商品管理 |
| `/purchase-orders` | 采购订单 |
| `/replenishment` | 补货管理 |
| `/return-orders` | 退单处理 |
| `/sales-clerk` | 店员管理 |
| `/scheduling` | 排班管理 |
| `/self-recharge` | 自助充值 |
| `/settings` | 门店设置 |
| `/shift-handover` | 交接班 |
| `/stock-transfer` | 调拨管理 |
| `/stocktaking` | 盘点 |
| `/store-locator` | 门店定位 |
| `/store-rank` | 门店排名 |
| `/store-ratings` | 门店评分 |
| `/stores` | 门店信息 |
| `/suppliers` | 供应商管理 |

## 技术栈

- **Next.js App Router** — 混合渲染 (SSR/SSG/CSR)
- **TypeScript** — 严格类型，`@m5/types` 共享类型包
- **@m5/ui** — UI 组件库（PageShell, Button, Card, Tag, StatCard 等）
- **@m5/sdk** — API 客户端与 SDK（含 runtime governance 能力）
- **React** — Hooks + Server Components + Client Components 混合

## 关键设计决策

1. **多门店 URL 路由** — 通过路径段解析 `marketCode/tenantCode/brandCode/storeCode`，`resolveStoreScope()` 在前后端统一处理
2. **运行时治理 (Runtime Governance)** — 核心操作（预约提交、支付提交）经过 runtime governance 体系，支持阻断/回调/回放，避免前端伪造成功态
3. **Bootstrap 消费端快照** — 启动时加载 `storefrontWebBootstrap`，注入 wiring、consumer descriptor、portal contract 等依赖上下文
4. **页面隔离** — 每个子模块独立目录，不共享页面级状态，降低耦合度
5. **Fallback 机制** — `StorefrontHomeSnapshot` 支持 API 优先 / fallback 两种交付模式

## 测试入口

| 文件 | 类型 | 覆盖 |
|------|------|------|
| `page.test.tsx` | 渲染测试 | 首页渲染、组件树快照 |
| `store-scope.test.ts` | 单元测试 | 门店范围解析、默认值补全 |
| `member-center.test.ts` | 单元测试 | 会员中心功能 |
| `store-portal.test.ts` | 集成测试 | 门店门户加载 |
| `product-detail.test.ts` | 单元测试 | 商品详情 |
| `product-display.test.ts` | 单元测试 | 商品展示 |
| `storefront-product-edit.test.ts` | 单元测试 | 商品编辑 |
| `store-events.test.ts` | 单元测试 | 门店事件 |
| `store-portal.test.ts` | 集成测试 | 门户集成 |
| `__smoke__/` | 冒烟测试 | 全量模块冒烟健康检查 |

## 维护者

- 模块归属: Shenjiying Storefront Team
- 依赖: `@m5/types`, `@m5/ui`, `@m5/sdk`
