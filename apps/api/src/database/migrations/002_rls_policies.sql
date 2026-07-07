-- Phase-34: RLS (Row-Level Security) Policies
-- 用途: 数据库层强制 tenant_id 隔离, 即使应用代码漏写也能拦截
-- 设计: 见 DR-35 §4.1

-- ── agent_events RLS ──

ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

-- SELECT: 只能读当前 tenant 的事件
DROP POLICY IF EXISTS tenant_isolation_select ON agent_events;
CREATE POLICY tenant_isolation_select ON agent_events
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

-- INSERT: 必须以当前 tenant 写入
DROP POLICY IF EXISTS tenant_isolation_insert ON agent_events;
CREATE POLICY tenant_isolation_insert ON agent_events
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- UPDATE: 只能改当前 tenant 的事件
DROP POLICY IF EXISTS tenant_isolation_update ON agent_events;
CREATE POLICY tenant_isolation_update ON agent_events
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- DELETE: 只能删当前 tenant 的事件
DROP POLICY IF EXISTS tenant_isolation_delete ON agent_events;
CREATE POLICY tenant_isolation_delete ON agent_events
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ── audit_log 表 (跨租户访问尝试的审计) ──

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor       TEXT,
  tenant_id   TEXT NOT NULL,
  resource    TEXT NOT NULL,
  action      TEXT NOT NULL,
  metadata    JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_time ON audit_log (tenant_id, occurred_at DESC);

-- ── 使用方法 ──
-- 每个请求开始时:
--   SET LOCAL app.tenant_id = 'tenant-A';
-- 然后所有 SQL 自动过滤:
--   SELECT * FROM agent_events;  -- 仅返回 tenant-A 的事件
--   INSERT INTO agent_events ...  -- tenant_id 必须 = 'tenant-A'
--
-- 若忘记 SET app.tenant_id:
--   SELECT 返回 0 行
--   INSERT 抛错误 (RLS policy 拒绝)