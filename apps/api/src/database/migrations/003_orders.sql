-- ============================================================================
-- Phase-35 T158: 订单 / 订单行 / 支付 / 退款 Schema
-- DR-36 决策: 整数分(cents) + 乐观锁(version) + 4 类幂等键
-- ============================================================================

-- ── orders 主单 ──
CREATE TABLE IF NOT EXISTS orders (
  id              VARCHAR(40) PRIMARY KEY,        -- ORD-YYYYMMDD-XXXXX
  tenant_id       VARCHAR(64) NOT NULL,           -- 多租户
  member_id       VARCHAR(64),                    -- 散客 = null
  status          VARCHAR(32) NOT NULL,           -- OrderStatus enum
  -- 金额 (整数分, 绝不用浮点)
  subtotal_cents  BIGINT NOT NULL DEFAULT 0,
  discount_cents  BIGINT NOT NULL DEFAULT 0,
  tax_cents       BIGINT NOT NULL DEFAULT 0,
  total_cents     BIGINT NOT NULL DEFAULT 0,
  paid_cents      BIGINT NOT NULL DEFAULT 0,
  refunded_cents  BIGINT NOT NULL DEFAULT 0,      -- 累计退款
  payment_method  VARCHAR(32),                    -- PaymentMethod
  created_by      VARCHAR(64) NOT NULL,           -- 收银员 userId
  client_order_id VARCHAR(64) NOT NULL,           -- 前端 UUID, 幂等键
  version         BIGINT NOT NULL DEFAULT 1,      -- 乐观锁
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ,                    -- 取消/完成
  CONSTRAINT chk_orders_amounts CHECK (
    subtotal_cents >= 0
    AND discount_cents >= 0
    AND tax_cents >= 0
    AND total_cents >= 0
    AND paid_cents >= 0
    AND refunded_cents >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_status
  ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created
  ON orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_member
  ON orders(tenant_id, member_id) WHERE member_id IS NOT NULL;

-- 幂等键 UNIQUE: 同一租户 + clientOrderId 唯一
CREATE UNIQUE INDEX IF NOT EXISTS uniq_orders_tenant_client
  ON orders(tenant_id, client_order_id);

-- ── order_items 订单行 ──
CREATE TABLE IF NOT EXISTS order_items (
  id                VARCHAR(40) PRIMARY KEY,      -- OIT-YYYYMMDD-XXXXX
  order_id          VARCHAR(40) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id         VARCHAR(64) NOT NULL,         -- 冗余 (RLS 便利)
  product_id        VARCHAR(64) NOT NULL,
  product_name      VARCHAR(255) NOT NULL,        -- 冗余 (商品改名不影响历史)
  unit_price_cents  BIGINT NOT NULL CHECK (unit_price_cents >= 0),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  subtotal_cents    BIGINT NOT NULL CHECK (subtotal_cents >= 0),
  discount_cents    BIGINT NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant
  ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product
  ON order_items(tenant_id, product_id);

-- ── payments 支付记录 ──
CREATE TABLE IF NOT EXISTS payments (
  id                VARCHAR(40) PRIMARY KEY,      -- PAY-YYYYMMDD-XXXXX
  tenant_id         VARCHAR(64) NOT NULL,
  order_id          VARCHAR(40) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method            VARCHAR(32) NOT NULL,         -- CASH/WECHAT/ALIPAY/CARD
  amount_cents      BIGINT NOT NULL CHECK (amount_cents > 0),
  status            VARCHAR(32) NOT NULL,         -- PENDING/SUCCESS/FAILED/REFUNDED
  provider_txn_id   VARCHAR(128),                 -- 微信/支付宝流水号
  idempotency_key   VARCHAR(128) NOT NULL,        -- (order_id, method) hash
  paid_at           TIMESTAMPTZ,
  failure_reason    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_order
  ON payments(tenant_id, order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(tenant_id, status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_payments_provider_txn
  ON payments(provider_txn_id) WHERE provider_txn_id IS NOT NULL;

-- 幂等键 UNIQUE: providerTxnId 唯一 (回调重发幂等)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_payments_provider_txn
  ON payments(provider_txn_id) WHERE provider_txn_id IS NOT NULL;

-- 幂等键 UNIQUE: 同 (tenant, order, method) 仅一笔 PENDING|SUCCESS
CREATE UNIQUE INDEX IF NOT EXISTS uniq_payments_order_method_active
  ON payments(tenant_id, order_id, method)
  WHERE status IN ('PENDING', 'SUCCESS');

CREATE UNIQUE INDEX IF NOT EXISTS uniq_payments_idempotency_key
  ON payments(tenant_id, idempotency_key);

-- ── refunds 退款记录 ──
CREATE TABLE IF NOT EXISTS refunds (
  id                 VARCHAR(40) PRIMARY KEY,     -- RFD-YYYYMMDD-XXXXX
  tenant_id          VARCHAR(64) NOT NULL,
  order_id           VARCHAR(40) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id         VARCHAR(40) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount_cents       BIGINT NOT NULL CHECK (amount_cents > 0),
  reason             TEXT NOT NULL,
  reason_hash        VARCHAR(64) NOT NULL,        -- 幂等键
  status             VARCHAR(32) NOT NULL,        -- PENDING/SUCCESS/FAILED
  provider_refund_id VARCHAR(128),
  idempotency_key    VARCHAR(128) NOT NULL,
  refunded_at        TIMESTAMPTZ,
  failure_reason     TEXT,
  created_by         VARCHAR(64) NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_tenant_order
  ON refunds(tenant_id, order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status
  ON refunds(tenant_id, status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_refunds_provider
  ON refunds(provider_refund_id) WHERE provider_refund_id IS NOT NULL;

-- 幂等键 UNIQUE: 同 (tenant, order, amount, reasonHash) 仅一笔
CREATE UNIQUE INDEX IF NOT EXISTS uniq_refunds_idempotency
  ON refunds(tenant_id, idempotency_key);

-- ── updated_at 自动触发器 ──
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_refunds_updated_at ON refunds;
CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
