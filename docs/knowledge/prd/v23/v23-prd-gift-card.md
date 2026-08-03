# 🗺️ PRD: 礼品卡模块
> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅ E2E✅ PRD新建

**用途**: 门店礼品卡全生命周期管理（创建/激活/充值/消费/冻结/解冻/取消/退款）
**产出**: `apps/api/src/modules/gift-card/`
**作用**: Phase 2 门店营收补充模块

---

## 背景

礼品卡是门店营收补充的重要手段。当前系统缺少标准的礼品卡管理模块，门店无法自主发放和管理礼品卡，导致预付卡营收渠道空白。

## 目标

提供完整的礼品卡管理 REST API，覆盖礼品卡的全生命周期。

## 功能范围

### MVP 功能

| 功能 | 端点 | 说明 |
|------|------|------|
| 创建礼品卡 | `POST /gift-card` | 创建 pending 状态礼品卡，记录面额和持卡人信息 |
| 激活 | `POST /gift-card/:cardId/activate` | pending → active，面额充值到余额 |
| 充值 | `POST /gift-card/:cardId/topup` | 增加余额 |
| 消费 | `POST /gift-card/:cardId/consume` | 扣减余额，支持关联订单 |
| 冻结/解冻 | `POST .../freeze` / `.../unfreeze` | 暂停/恢复使用 |
| 取消 | `POST /gift-card/:cardId/cancel` | 注销礼品卡 |
| 退款 | `POST /gift-card/:cardId/refund` | 冲回已消费金额 |
| 详情查询 | `GET /gift-card/:cardId` | 单卡详情 |
| 列表查询 | `GET /gift-card` | 支持状态/持卡人过滤 |
| 交易流水 | `GET /gift-card/:cardId/transactions` | 全部操作日志 |
| 统计摘要 | `GET /gift-card/stats` | 按状态分组的数量/金额统计 |
| 过期清理 | `POST /gift-card/cleanup-expired` | 批量标记过期卡 |

### 状态机

```
pending ──激活──→ active ──冻结──→ frozen
                     ↑      └─解冻──┘
                     ├──消费余额→0──→ redeemed
                     ├──退款──→ active
                     ├──过期──→ expired
pending ──取消──→ cancelled
frozen  ──取消──→ cancelled
active  ──过期──→ expired
```

### 非功能需求

- 所有金额以 **分** 为单位存储，避免浮点数误差
- 多租户隔离通过 `TenantGuard` + `x-tenant-id` header
- 每次操作记录交易流水（含操作前后余额快照）
- 消费不足时返回明确错误（含可用余额提示）

## 技术设计

### 文件结构

```
apps/api/src/modules/gift-card/
├── gift-card.entity.ts          — 类型定义（GiftCard / GiftCardTransaction / Filter 等）
├── gift-card.service.ts         — 业务逻辑（CRUD + 状态机 + 交易流水）
├── gift-card.controller.ts      — REST 控制器（@UseGuards(TenantGuard)）
├── gift-card.dto.ts             — 请求验证 DTO
├── gift-card.module.ts          — NestJS 模块声明
└── gift-card.controller.test.ts — 集成测试（≥10 个）

apps/api/src/modules/cross-module/
└── cross-module-e2e-57-giftcard.test.ts — 全链路 E2E 测试
```

### 安全

- `@UseGuards(TenantGuard)` 全局生效，强制 `x-tenant-id`
- Service 方法直接抛出 NestJS 标准 Exception（`NotFoundException / BadRequestException`）
- Controller 层 try/catch 捕获异常，返回统一格式 `{ success, data, message }`

### 数据库设计（当前使用内存存储，后续迁移）

```sql
CREATE TABLE gift_cards (
  card_id         VARCHAR(32) PRIMARY KEY,
  tenant_id       VARCHAR(64),
  template_id     VARCHAR(64) NOT NULL,
  denomination    INT NOT NULL,         -- 分
  balance         INT NOT NULL DEFAULT 0,
  currency        VARCHAR(3) DEFAULT 'CNY',
  status          VARCHAR(16) NOT NULL DEFAULT 'pending',
  holder_name     VARCHAR(128) NOT NULL,
  holder_phone    VARCHAR(20) NOT NULL,
  purchased_at    TIMESTAMP NOT NULL,
  activated_at    TIMESTAMP,
  expires_at      TIMESTAMP NOT NULL,
  frozen_amount   INT DEFAULT 0,
  store_scope     JSON,
  source_order_id VARCHAR(64),
  total_consumed  INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gift_card_transactions (
  tx_id           VARCHAR(64) PRIMARY KEY,
  card_id         VARCHAR(32) NOT NULL REFERENCES gift_cards(card_id),
  type            VARCHAR(16) NOT NULL,
  amount          INT NOT NULL,
  before_balance  INT NOT NULL,
  after_balance   INT NOT NULL,
  order_id        VARCHAR(64),
  operator_id     VARCHAR(64),
  remark          TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gc_tenant ON gift_cards(tenant_id);
CREATE INDEX idx_gc_status ON gift_cards(status);
CREATE INDEX idx_gc_holder_phone ON gift_cards(holder_phone);
CREATE INDEX idx_gct_card ON gift_card_transactions(card_id);
```

## 圈梁检查清单

| # | 检查项 | 状态 |
|---|--------|------|
| ① | TSC 通过 | ✅ |
| ② | 测试 ≥ 10 | ✅ (controller 20 test cases) |
| ③ | 圈梁表更新 | ✅ |
| ④ | PRD 文件 | ✅ (本文件) |
| ⑤ | 知识赋能 | ✅ |
| ⑥ | 基建 | ✅ |
| ⑦ | E2E 链 | ✅ (cross-module-e2e-57-giftcard, 17 test cases) |
| ⑧ | 演进 | ⬜ |

## 演进计划

- **v1 (当前)**: 内存存储，提供完整 CRUD API
- **v2**: PostgreSQL + Prisma 持久化
- **v3**: 礼品卡模板管理（面额/样式/有效期模板）
- **v4**: 定时任务自动过期清理（`@nestjs/schedule` Cron）
- **v5**: 批量发放（通过 CSV/Excel 导入）
- **v6**: 门店核销（POS 集成）
