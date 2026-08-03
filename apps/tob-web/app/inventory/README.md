# 进销存管理模块 (Inventory)

## 模块概述

进销存管理模块是 ToB 管理端（tob-web）的品牌运营与门店管理核心页面，提供商品管理、采购订单、库存盘点、跨店调拨四大板块的一站式库存操作入口。该模块采用 React 18 + Next.js App Router 架构，内置 Mock 数据兜底策略与完整的多门店经营看板，同时支持商品详情页（含 SKU 库存明细、采购/盘点/调拨关联记录查询），角色视角覆盖品牌运营、采购经理、门店店长。

## 核心功能

| 功能 | 说明 |
|------|------|
| 门店库存看板 | 多门店卡片式统计，展示总库存、SKU 数量、低库存预警数和缺货数 |
| 商品管理 | 商品列表展示及新增商品表单（名称/品类/品牌/单位），自动计算各 SKU 库存并标记异常状态 |
| 采购订单 | 采购单列表（草稿→待审批→已审批→已收货→已取消），支持「确认收货」操作 |
| 库存盘点 | 盘点单列表，展示账面库存 vs 实际库存的盘差分析，异常项红色高亮 |
| 跨店调拨 | 调拨单全链路管理（草稿→待审批→已审批→调拨中→已完成），支持审批、执行、接收三步操作 |
| 商品详情页 | 基于 `[id]/page.tsx` 的产品详情，含 SKU 库存明细表、库存概览统计、采购/盘点/调拨关联记录 |
| SKU 库存状态 | 实时计算每项 SKU 的库存状态（正常/库存不足/已售罄），带进度条可视化 |
| 数据容错 | API 请求失败时自动降级为 Mock 数据，确保 UI 始终可渲染 |

## 技术依赖

| 依赖 | 版本/来源 | 用途 |
|------|-----------|------|
| React 18 + Hooks | ^18.x.x | UI 框架、useState/useEffect/useMemo/useCallback |
| Next.js | ^14.x.x | App Router 动态路由（`[id]`）、客户端导航 |
| @m5/ui | workspace | PageShell、DetailShell、DataTable、StatusBadge、Modal、SubmitButton 等 |
| TypeScript | ^5.x.x | 全部类型定义（Product、SKU、PurchaseOrder、InventoryCheck、CrossStoreTransfer） |
| Fetch API | 原生 | 通过 `inventory-service.ts` 封装的 RESTful HTTP 请求 |

## API 接口清单

| 接口 | 方法 | 说明 |
|------|------|------|
| `GET /api/inventory/products` | GET | 获取所有商品列表 |
| `GET /api/inventory/products/{id}` | GET | 获取单个商品详情 |
| `POST /api/inventory/products` | POST | 新增商品 |
| `PATCH /api/inventory/products/{id}` | PATCH | 更新商品信息 |
| `GET /api/inventory/products/{id}/skus` | GET | 获取商品的 SKU 列表 |
| `PATCH /api/inventory/skus/{id}/stock` | PATCH | 更新 SKU 库存（增量） |
| `GET /api/inventory/purchase-orders` | GET | 获取采购订单列表（支持 status 过滤） |
| `POST /api/inventory/purchase-orders/{id}/receive` | POST | 采购单收货确认 |
| `GET /api/inventory/checks` | GET | 获取盘点单列表（支持 storeId 过滤） |
| `GET /api/inventory/transfers` | GET | 获取调拨单列表（支持 status 过滤） |
| `POST /api/inventory/transfers/{id}/approve` | POST | 审批调拨单 |
| `POST /api/inventory/transfers/{id}/execute` | POST | 执行调拨（扣减调出方库存） |
| `POST /api/inventory/transfers/{id}/receive` | POST | 接收调拨（增加调入方库存） |
| `GET /api/inventory/store-stats` | GET | 获取门店库存统计汇总 |

## 目录结构

```
apps/tob-web/app/inventory/
├── page.tsx                    # 进销存主页（Tab 导航：商品管理 / 采购订单 / 库存盘点 / 跨店调拨）
├── inventory-data.ts           # 类型定义、Mock 数据、辅助函数（formatCurrency、formatDate、getSKUStockStatus）
├── inventory-service.ts        # HTTP 请求封装层，含 Mock 降级兜底逻辑
├── page.test.ts                # 单元测试
├── [id]/
│   ├── page.tsx                # 商品/库存详情页（SKU 明细、采购/盘点/调拨关联记录表格）
│   └── page.test.tsx           # 详情页组件测试
```

## 使用说明

### 本地开发

```bash
# 进入 tob-web 目录
cd apps/tob-web

# 启动开发服务器
pnpm dev

# 访问进销存主页
# 浏览器打开 http://localhost:3001/inventory

# 访问商品详情
# 浏览器打开 http://localhost:3001/inventory/P001
```

### 四板块操作流程

1. **商品管理**：查看全量商品及 SKU 库存状态 → 点击「+ 新增商品」添加新品类
2. **采购订单**：查看采购单流转状态 → 已审批的单据点击「确认收货」完成入库
3. **库存盘点**：查看已完成的盘点结果，关注盘差（差异列红色高亮）→ 点击「开始盘点」进入盘点流程
4. **跨店调拨**：调拨单按「待审批→已审批（执行）→调拨中（接收）→已完成」四步流转

### 数据容错策略

- 所有 API 请求优先调用真实后端接口
- 请求失败（网络异常/服务端 4xx/5xx）自动降级到 `MOCK_*` 数据
- `x-tenant-id` 请求头默认值为 `demo-tenant`，生产环境需由认证中间件注入真实租户 ID

## 安全注意事项

1. **租户隔离**：服务层通过 `x-tenant-id` 请求头实现多租户数据隔离，前端不应伪造或篡改该头信息。
2. **库存操作权限**：采购单收货、调拨审批/执行/接收等写操作应进行角色权限校验，避免非授权操作影响实际库存。
3. **数据降级风险**：Mock 降级仅在开发/测试阶段可用，生产环境应确保 API 端点可用或提供明确的错误提示。
4. **IDOR 防护**：商品详情页（`[id]/page.tsx`）应校验当前租户是否有权访问该产品 ID，防止越权访问其他租户库存数据。
5. **输入验证**：商品新增/编辑表单的所有输入（名称、品类等）应在服务端进行长度限制和 XSS 过滤，防止恶意脚本注入。
6. **操作日志**：采购收货、调拨执行等关键操作应记录操作人、时间、变更前后的库存数量，用于库存审计追溯。
