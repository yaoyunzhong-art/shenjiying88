# 🧾 收银台模块 — Cashier (P-35)

## 模块用途

前台收银台模块（PRD-001 驱动，验收卡 AC-35）面向门店收银员，提供商品搜索与选择、购物车管理、会员识别与折扣、支付方式选择及结算下单的完整收银流程。适用于街机厅/游艺厅等实体门店的前台收银场景。

## 核心功能

| 验收卡 | 功能 | 说明 |
|---|---|---|
| AC-35-01 | 商品搜索 | 按商品名称/分类模糊搜索，大小写不敏感 |
| AC-35-02 | 商品添加到已选清单 | 从商品卡片点击加入购物车 |
| AC-35-03 | 多件商品金额计算 | 购物车数量增减、小计/折扣/应付实时计算 |
| AC-35-04 | 会员识别 | 通过手机号查询会员信息（真实 API 调用） |
| AC-35-05 | 会员折扣应用 | 根据会员等级自动计算折扣金额 |
| AC-35-07 | 支付方式选择 | 微信扫码 / 会员余额 / 现金三种方式 |
| AC-35-10 | 空结算防御 | 购物车为空或未选择支付方式时阻止结算 |

## 主要组件与数据流

### 组件结构

- **`page.tsx`** — 页面主入口（`'use client'`），管理全部状态
- **`loading.tsx`** — 页面级加载状态展示
- **`page.test.ts`** — L1 源码分析测试（Node test）
- **`page.test.tsx`** — L1 React 渲染测试（RTL + Vitest）
- **`page.vitest.tsx`** — L1 Vitest 集成测试

### 核心状态（useState）

| 状态 | 类型 | 用途 |
|---|---|---|
| `searchText` | string | 商品搜索关键词 |
| `products` / `productsLoading` / `productsError` | 三元组 | 商品目录加载 |
| `cart` | CartItem[] | 购物车商品列表 |
| `memberPhone` / `member` | string / MemberInfo | 会员识别 |
| `paymentMethod` | PaymentMethod | 支付方式选择 |
| `isProcessing` | boolean | 结算提交中标志 |
| `checkoutStatus` | 'idle' | 'success' | 'error' | 结算状态 |
| `messageText` | string | 全局消息提示文本 |

### 数据流

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  listStorefront │     │  lookupStorefront     │     │ ensureStorefront │
│  CashierProducts │     │  Member               │     │ MemberRegistered  │
└────────┬────────┘     └──────────┬───────────┘     └────────┬─────────┘
         │                         │                          │
         ▼                         ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CashierPage                                  │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ 商品搜索 │→│ 购物车管理 │→│ 会员识别  │→│ 支付选择  │→│ 结算  │ │
│  └─────────┘  └──────────┘  └──────────┘  └──────────┘  └───┬───┘ │
│                                                              │       │
│                                                              ▼       │
│                                                    startStorefront   │
│                                                    Checkout           │
│                                                              │       │
│                                                              ▼       │
│                                                  router.push('/h5/   │
│                                                  payment/{orderId}') │
└─────────────────────────────────────────────────────────────────────┘
```

### 持久化

- 购物车草稿自动写入 `sessionStorage`（key: `storefront.checkout.draft`）
- 结算成功后清除草稿

## 依赖的服务/API

全部定义在 `apps/storefront-web/lib/storefront-transactions.ts`：

| API 函数 | 用途 | 所属 |
|---|---|---|
| `listStorefrontCashierProducts()` | 获取商品目录 | `@m5/sdk` |
| `lookupStorefrontMember(phone)` | 会员手机号查询 | `@m5/sdk` |
| `buildStorefrontMemberId(phone)` | 构建会员 ID | 本地工具 |
| `ensureStorefrontMemberRegistered(memberId, name)` | 确保会员已注册 | `@m5/sdk` |
| `startStorefrontCheckout(memberId, items, method, total)` | 创建结算订单 | `@m5/sdk` |

### UI 组件库

- `@m5/ui` — `PageShell`, `Button`, `Input`, `Card`, `Tag`

## 权限要求

- 收银员需具有 `storefront:cashier` 角色的登录令牌
- `storefront-transactions.ts` 通过 `@m5/sdk` 的 `ApiClient` 完成鉴权
- 结算操作受后端 JWT token 校验

## 注意点/常见问题

1. **空结算防御**：购物车为空或未选支付方式时，结算按钮会显示提示且阻止提交（AC-35-10）
2. **会员折扣**：`discountRate` 为 0~1 的乘数（如 0.9 表示九折），取整方式为 `Math.round`
3. **SessionStorage 草稿**：仅保存当前会话，页面关闭后丢失；如果有刷新恢复需求需额外持久化
4. **支付跳转**：结算成功后路由跳到 `/h5/payment/{orderId}`，**需要确保该支付页面已实现**
5. **异常处理**：商品加载失败、会员查询失败、结算异常均有独立的用户提示及重试/清除操作
6. **Scope 常量**：硬编码 `DEFAULT_STOREFRONT_SCOPE` 中的 `storeId: 'store-001'` 等值，生产环境应改为动态配置
