-- ============================================================================
-- Phase-35 T158: orders / order_items / payments / refunds RLS Policies
-- DR-36 决策 9: 全部子表启用 RLS, 父+子联合查询自动过滤
-- 复用 Phase-34 模板: current_setting('app.tenant_id', true)
-- ============================================================================

-- ── orders 表 RLS ──
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_select ON orders;
CREATE POLICY tenant_isolation_select ON orders
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_insert ON orders;
CREATE POLICY tenant_isolation_insert ON orders
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_update ON orders;
CREATE POLICY tenant_isolation_update ON orders
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_delete ON orders;
CREATE POLICY tenant_isolation_delete ON orders
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ── order_items 表 RLS (子表, 与父表同 tenant) ──
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_select ON order_items;
CREATE POLICY tenant_isolation_select ON order_items
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_insert ON order_items;
CREATE POLICY tenant_isolation_insert ON order_items
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_update ON order_items;
CREATE POLICY tenant_isolation_update ON order_items
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_delete ON order_items;
CREATE POLICY tenant_isolation_delete ON order_items
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ── payments 表 RLS ──
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_select ON payments;
CREATE POLICY tenant_isolation_select ON payments
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_insert ON payments;
CREATE POLICY tenant_isolation_insert ON payments
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_update ON payments;
CREATE POLICY tenant_isolation_update ON payments
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_delete ON payments;
CREATE POLICY tenant_isolation_delete ON payments
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ── refunds 表 RLS ──
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_select ON refunds;
CREATE POLICY tenant_isolation_select ON refunds
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_insert ON refunds;
CREATE POLICY tenant_isolation_insert ON refunds
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_update ON refunds;
CREATE POLICY tenant_isolation_update ON refunds
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_delete ON refunds;
CREATE POLICY tenant_isolation_delete ON refunds
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true));
