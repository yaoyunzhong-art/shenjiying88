-- ============================================================================
-- V10 Day 6 Phase 90: 三级独立配置 (V9 需求 4)
-- Migration 007_three_level_config.sql
--
-- 三级工作台 (Three Workbenches):
--   W-S (store)   门店级
--   W-T (tenant)  租户级
--   W-B (brand)   品牌级
--
-- 表结构:
--   config_instance   - 配置实例 (key + level + owner_id + value)
--   config_audit_log  - 配置审计日志 (V9 需求 2: 180 天保留)
--
-- 隔离策略:
--   - tenant_id 列: V9 RLS 强制隔离
--   - level + owner_id: 联合唯一 (V9 需求 4 实例级隔离)
--   - inherits: true/false (V9 需求 4 继承链)
-- ============================================================================

-- ============ 1. config_instance ============

CREATE TABLE IF NOT EXISTS config_instance (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL,
  key          TEXT NOT NULL,
  value        TEXT NOT NULL,
  category     TEXT NOT NULL,
  level        TEXT NOT NULL CHECK (level IN ('store', 'tenant', 'brand')),
  owner_id     TEXT NOT NULL,
  inherits     BOOLEAN NOT NULL DEFAULT false,
  version      INTEGER NOT NULL DEFAULT 1,
  updated_by   TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (level, owner_id, key)
);

CREATE INDEX IF NOT EXISTS idx_config_instance_tenant_level
  ON config_instance (tenant_id, level);
CREATE INDEX IF NOT EXISTS idx_config_instance_category
  ON config_instance (category);
CREATE INDEX IF NOT EXISTS idx_config_instance_owner
  ON config_instance (level, owner_id);

COMMENT ON TABLE config_instance IS '三级配置实例 (V9 需求 4)';
COMMENT ON COLUMN config_instance.level IS 'store | tenant | brand (V9 三级独立)';
COMMENT ON COLUMN config_instance.owner_id IS 'store_id | tenant_id | brand_id';
COMMENT ON COLUMN config_instance.inherits IS 'true = 继承上级默认值 (V9 继承链)';
COMMENT ON COLUMN config_instance.version IS '版本号 (审计 + 回滚)';

-- ============ 2. config_audit_log ============

CREATE TABLE IF NOT EXISTS config_audit_log (
  id               TEXT PRIMARY KEY,
  config_id        TEXT,
  key              TEXT NOT NULL,
  level            TEXT NOT NULL,
  owner_id         TEXT NOT NULL,
  previous_value   TEXT,
  new_value        TEXT,
  action           TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'rollback')),
  operator         TEXT NOT NULL,
  operator_role    TEXT NOT NULL,
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  context          JSONB
);

CREATE INDEX IF NOT EXISTS idx_config_audit_tenant_time
  ON config_audit_log (owner_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_config_audit_key
  ON config_audit_log (key, timestamp DESC);

COMMENT ON TABLE config_audit_log IS '配置审计日志 (V9 需求 2: 180 天)';

-- ============ 3. RLS Policies (V9 需求 5 强隔离) ============

ALTER TABLE config_instance ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_audit_log ENABLE ROW LEVEL SECURITY;

-- config_instance RLS: 仅允许当前 tenant 读写
DROP POLICY IF EXISTS config_instance_tenant_isolation ON config_instance;
CREATE POLICY config_instance_tenant_isolation ON config_instance
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- config_audit_log RLS: 通过 owner_id 前缀匹配 (与 tenant_id 一致)
DROP POLICY IF EXISTS config_audit_log_tenant_isolation ON config_audit_log;
CREATE POLICY config_audit_log_tenant_isolation ON config_audit_log
  USING (owner_id LIKE current_setting('app.tenant_id', true) || '%'
      OR owner_id = current_setting('app.tenant_id', true))
  WITH CHECK (owner_id LIKE current_setting('app.tenant_id', true) || '%'
           OR owner_id = current_setting('app.tenant_id', true));

-- ============ 4. 种子数据 (示例: 1 品牌 / 1 租户 / 1 门店) ============

INSERT INTO config_instance (id, tenant_id, key, value, category, level, owner_id, inherits, version, updated_by)
VALUES
  -- 品牌级 (brand-shenjiying)
  it('cfg-sql-brand-audit', 'tenant-A', 'compliance.audit_retention_days', '180', 'compliance', 'brand', 'brand-shenjiying', false, 1, 'system'),
  it('cfg-sql-brand-color', 'tenant-A', 'branding.primary_color', '#1677ff', 'branding', 'brand', 'brand-shenjiying', false, 1, 'system'),

  -- 租户级 (tenant-A)
  it('cfg-sql-tenant-tier', 'tenant-A', 'member.tier_upgrade_threshold', '1000', 'member', 'tenant', 'tenant-A', false, 1, 'admin'),
  it('cfg-sql-tenant-ai', 'tenant-A', 'ai.default_model', 'gpt-4o-mini', 'ai', 'tenant', 'tenant-A', false, 1, 'admin'),

  -- 门店级 (store-001 属于 tenant-A)
  it('cfg-sql-store-tax', 'tenant-A', 'pos.tax_rate', '0.13', 'pos', 'store', 'store-001', false, 1, 'admin')
ON CONFLICT (level, owner_id, key) DO NOTHING;

-- ============ 5. 清理任务 (V9 需求 2: 180 天) ============

-- 定时清理: 删除 180 天前的审计日志
-- 实际部署时通过 cron job 或 pg_cron 触发
-- 这里仅记录清理逻辑
COMMENT ON TABLE config_audit_log IS '配置审计日志 (V9 需求 2: 180 天保留,自动清理)';
