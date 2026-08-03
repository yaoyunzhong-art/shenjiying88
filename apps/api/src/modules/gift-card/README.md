# 礼品卡模块 (Gift Card)

礼品卡全生命周期管理模块，提供礼品卡创建、激活、充值、消费、冻结、解冻、取消、退款等完整业务流程，并记录每一笔交易流水。

## 一、模块概述

**业务定位**: 连锁门店场景下的预付卡/礼品卡管理子系统，支撑礼品卡从发行到消费的完整生命周期管理，对接多租户隔离体系。

**业务目标**:
- 提供礼品卡完整生命周期管理（创建→激活→消费→核销）
- 支持礼品卡常见业务操作（充值、冻结、解冻、退款、取消）
- 记录每笔交易流水，实现余额变动可追溯
- 多租户隔离（`x-tenant-id`），保障租户间数据安全

**核心能力**:
| 能力 | 说明 |
|------|------|
| 卡片管理 | 创建（pending）、激活（→active）、过期检测 |
| 余额操作 | 充值、消费（余额不足自动标记 redeemed）、退款 |
| 风控操作 | 冻结（锁定余额）、解冻、取消 |
| 交易流水 | 8 种交易类型全程记录，支持查询 |
| 统计摘要 | 按状态/余额维度汇总所有礼品卡 |

**模块依赖**:
- `TenantGuard` — 多租户隔离守卫
- `ValidationPipe` — 参数校验（`whitelist + transform`）

---

## 二、架构图

```
┌────────────────────────────────────────────────────────────────┐
│                       GiftCardModule                            │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   GiftCardController                     │   │
│  │  ┌───────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ POST  │  │ GET      │  │ GET      │  │ POST     │   │   │
│  │  │ /     │  │ /:cardId │  │ /        │  │ stats    │   │   │
│  │  │ create│  │ details  │  │ list     │  │ cleanup  │   │   │
│  │  └───┬───┘  └─────┬────┘  └────┬─────┘  └──────────┘   │   │
│  │      │            │            │                        │   │
│  │      ▼            ▼            ▼                        │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              GiftCardService                     │    │   │
│  │  │                                                  │    │   │
│  │  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │    │   │
│  │  │  │ 卡片管理  │  │ 余额操作  │  │ 风控操作     │  │    │   │
│  │  │  │ create   │  │ topup     │  │ freeze       │  │    │   │
│  │  │  │ activate │  │ consume   │  │ unfreeze     │  │    │   │
│  │  │  │ cancel   │  │ refund    │  │              │  │    │   │
│  │  │  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │    │   │
│  │  │       │              │               │           │    │   │
│  │  │       └──────┬───────┴───────┬───────┘           │    │   │
│  │  │              │               │                   │    │   │
│  │  │              ▼               ▼                   │    │   │
│  │  │       ┌──────────┐   ┌──────────────┐           │    │   │
│  │  │       │ cards[]  │   │ transactions │           │    │   │
│  │  │       │ (Map)    │   │ Map          │           │    │   │
│  │  │       └──────────┘   └──────────────┘           │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  守卫层: @UseGuards(TenantGuard)                          │   │
│  │  校验层: @UsePipes(ValidationPipe)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  外部访问入口: /gift-card                                      │
└────────────────────────────────────────────────────────────────┘

状态流转:

  pending ──激活──→ active ──消费→₀──→ redeemed
                     │   │                │
                     │   ├──冻结──→ frozen ──解冻──→ active
                     │   └──取消──→ cancelled
                     │
                     └──过期──→ expired

```

---

## 三、核心表结构

### GiftCard (礼品卡)

| 字段 | 类型 | 说明 |
|------|------|------|
| cardId | string | 唯一卡号（`GC` + 时间戳 Base36 + 随机字符） |
| tenantId | string? | 多租户隔离字段 |
| templateId | string | 礼品卡模板 ID |
| denomination | number | 面额（**单位: 分**，避免浮点误差） |
| balance | number | 当前余额（单位: 分） |
| currency | string | 币种，默认 `CNY` |
| status | GiftCardStatus | 卡状态 |
| holderName | string | 持卡人姓名 |
| holderPhone | string | 持卡人手机号 |
| purchasedAt | string | 购买时间 |
| activatedAt | string? | 激活时间 |
| expiresAt | string | 过期时间 |
| frozenAmount | number | 冻结金额（冻结时锁定全部余额） |
| storeScope | string[] | 适用门店范围（空=全部门店） |
| sourceOrderId | string? | 来源订单 ID |
| totalConsumed | number | 累计消费（分） |
| createdAt / updatedAt | string | 时间戳 |

### GiftCardStatus 枚举

| 值 | 说明 |
|----|------|
| `pending` | 待激活 — 刚创建，余额为 0 |
| `active` | 活跃 — 已激活可消费 |
| `frozen` | 冻结 — 余额锁定不可消费 |
| `expired` | 过期 — 超过 expiresAt |
| `redeemed` | 已核销 — 余额为 0 自动标记 |
| `cancelled` | 已取消 — 手动取消 |

### GiftCardTransaction (交易流水)

| 字段 | 类型 | 说明 |
|------|------|------|
| txId | string | 交易流水 ID（UUID） |
| cardId | string | 关联礼品卡 ID |
| tenantId | string? | 租户 ID |
| type | TransactionType | 交易类型 |
| amount | number | 变动金额（正=减少，负=增加） |
| beforeBalance | number | 变动前余额 |
| afterBalance | number | 变动后余额 |
| orderId | string? | 关联订单 |
| operatorId | string? | 操作人 |
| remark | string? | 备注 |
| createdAt | string | 创建时间 |

### TransactionType 枚举

| 值 | 说明 |
|----|------|
| `purchase` | 购买 |
| `activation` | 激活（充值面额到余额） |
| `topup` | 充值 |
| `freeze` | 冻结 |
| `unfreeze` | 解冻 |
| `consume` | 消费 |
| `refund` | 退款 |
| `cancel` | 取消 |

---

## 四、关键 API / Service 接口

### REST API (Controller)

**前缀**: `/gift-card`
**守卫**: `@UseGuards(TenantGuard)` — 需要 `x-tenant-id` 请求头

| 方法 | 路径 | 请求体 | 返回 | 说明 |
|------|------|--------|------|------|
| POST | `/gift-card` | `CreateGiftCardDto` | `{success, data}` | 创建礼品卡（pending 状态） |
| POST | `/gift-card/:cardId/activate` | `ActivateGiftCardDto` | `{success, data}` | 激活（pending → active） |
| POST | `/gift-card/:cardId/topup` | `TopupGiftCardDto` | `{success, data}` | 充值 |
| POST | `/gift-card/:cardId/consume` | `ConsumeGiftCardDto` | `{success, data}` | 消费（余额=0 自动变 redeemed） |
| POST | `/gift-card/:cardId/freeze` | `StatusActionDto` | `{success, data}` | 冻结 |
| POST | `/gift-card/:cardId/unfreeze` | `StatusActionDto` | `{success, data}` | 解冻 |
| POST | `/gift-card/:cardId/cancel` | `StatusActionDto` | `{success, data}` | 取消 |
| POST | `/gift-card/:cardId/refund` | `RefundGiftCardDto` | `{success, data}` | 退款（余额冲回） |
| GET | `/gift-card/:cardId` | — | `{success, data}` | 礼品卡详情 |
| GET | `/gift-card` | `ListGiftCardQueryDto` | `{success, data, total}` | 礼品卡列表（支持过滤） |
| GET | `/gift-card/:cardId/transactions` | — | `{success, data, total}` | 交易流水 |
| GET | `/gift-card/stats` | —（读 `x-tenant-id`） | `{success, data}` | 统计摘要 |
| POST | `/gift-card/cleanup-expired` | — | `{success, data, message}` | 手动触发过期卡清理 |

### GiftCardService 核心方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `create(request)` | `GiftCardCreateRequest` | `GiftCard` | 创建礼品卡（pending） |
| `activate(cardId, operatorId?)` | `string, string?` | `GiftCard` | 激活并充值面额 |
| `topup(request)` | `GiftCardTopupRequest` | `GiftCard` | 充值 |
| `consume(request)` | `GiftCardConsumeRequest` | `GiftCard` | 消费（余额不足抛异常） |
| `freeze(cardId, operatorId?, remark?)` | `string, string?, string?` | `GiftCard` | 冻结（锁定余额） |
| `unfreeze(cardId, operatorId?, remark?)` | `string, string?, string?` | `GiftCard` | 解冻 |
| `cancel(cardId, operatorId?, remark?)` | `string, string?, string?` | `GiftCard` | 取消（不可恢复） |
| `refund(cardId, amount, operatorId?, remark?)` | `string, number, string?, string?` | `GiftCard` | 退款（消费冲回） |
| `getById(cardId)` | `string` | `GiftCard \| undefined` | 查询详情 |
| `list(filter?)` | `GiftCardFilter` | `GiftCard[]` | 过滤查询 |
| `getTransactions(cardId)` | `string` | `GiftCardTransaction[]` | 获取交易流水 |
| `getStats(tenantId?)` | `string?` | `{total, active, frozen, ...}` | 统计摘要 |
| `cleanupExpired()` | — | `number` | 清理过期卡（返回清理数） |

### 交易流水记录规则

| 操作 | amount 符号 | 说明 |
|------|------------|------|
| purchase | 正数 | 购买记录，余额不变 |
| activation | 正数 (面额) | 面额充值到余额 |
| topup | **负数** | 充值增加余额 |
| consume | 正数 | 消费扣除余额 |
| refund | **负数** | 退款退回余额 |
| freeze | 0 | 状态变更，余额不变 |
| unfreeze | 0 | 状态变更，余额不变 |
| cancel | 正数 (余额) | 取消将余额清 0 |

---

## 五、配置 / 部署 / 测试指引

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| 无 | 当前模块无额外环境变量依赖 | — |

### 模块注册

```typescript
// 在父模块中引入
import { GiftCardModule } from './gift-card/gift-card.module'

@Module({
  imports: [GiftCardModule],
})
export class SomeParentModule {}
```

### 测试命令

```bash
# 运行全部测试
cd apps/api && npx jest gift-card

# 运行 Controller 测试
cd apps/api && npx jest gift-card.controller

# 运行角色扩展测试
cd apps/api && npx jest gift-card.role-extended

# 带覆盖率报告
cd apps/api && npx jest gift-card --coverage
```

### 测试文件说明

| 文件 | 类型 | 覆盖范围 |
|------|------|----------|
| `gift-card.controller.test.ts` | 单元测试 (Controller) | REST 端点路由和校验 |
| `gift-card.role-extended.test.ts` | 角色扩展测试 | 多角色/权限场景 |

### 部署注意事项

- 当前使用 `Map<string, GiftCard>` 内存存储，生产环境应替换为数据库
- 所有金额以 **分** 为单位（`number`），避免浮点运算误差
- 所有端点受 `TenantGuard` 保护，需在请求头传递 `x-tenant-id`
- `ValidationPipe` 启用 `whitelist: true` + `transform: true`
- `cleanupExpired()` 可对接定时任务（cron job）定期清理过期卡
- 礼品卡 ID 格式: `GC{时间戳36进制}{UUID前6位大写}`
- 注意 `POST /gift-card/stats` 和 `POST /gift-card/:cardId/...` 的路由顺序——`stats` 必须注册在 `:cardId` 之前，否则会因通配符匹配导致路由冲突。当前 Controller 中 `GET /stats`（非 `POST`）通配在 `GET :cardId/transactions` 之上注册，路由顺序已正确。
