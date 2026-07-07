/**
 * 付费授权 - 数据库迁移 (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * 表结构:
 * - licenses: 授权主表 (租户级/门店级双层授权)
 * - license_activation_logs: 激活审计日志 (180天保留)
 *
 * 激活源: paid(已付费) | trial(试用) | tier-match(等级达标) | whitelist(白名单)
 */

export const MIGRATION_NAME = '20250712001_create_license_tables'

export const up = async (db: any) => {
  // ========== 1. 授权主表 ==========
  await db.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id VARCHAR(64) PRIMARY KEY,
      tenant_id VARCHAR(64) NOT NULL,
      store_id VARCHAR(64), -- NULL表示租户级授权
      
      -- 授权范围: ai.capability | ai.knowledge | ai.industry | integration.open
      scope VARCHAR(32) NOT NULL,
      
      -- 授权层级: tenant | store
      level VARCHAR(16) NOT NULL DEFAULT 'tenant',
      
      -- 状态: active | expired | suspended | pending
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      
      -- 配额管理
      quota BIGINT, -- 总配额 (知识库容量/调用次数)
      used_quota BIGINT DEFAULT 0,
      
      -- 激活源: paid | trial | tier-match | whitelist
      activation_source VARCHAR(16) NOT NULL,
      
      -- 有效期
      valid_from TIMESTAMPTZ NOT NULL,
      valid_until TIMESTAMPTZ NOT NULL,
      
      -- 订阅管理
      auto_renew BOOLEAN DEFAULT FALSE,
      price_cents INTEGER, -- 价格(分)
      
      -- 审计字段
      created_by VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // 创建索引
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_licenses_tenant ON licenses(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_licenses_store ON licenses(store_id);
    CREATE INDEX IF NOT EXISTS idx_licenses_scope ON licenses(scope);
    CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
    CREATE INDEX IF NOT EXISTS idx_licenses_activation ON licenses(activation_source);
    CREATE INDEX IF NOT EXISTS idx_licenses_valid_until ON licenses(valid_until);
    -- 复合索引: 租户+范围+状态 (授权检查用)
    CREATE INDEX IF NOT EXISTS idx_licenses_check ON licenses(tenant_id, scope, status);
  `)

  // ========== 2. 激活审计日志表 ==========
  await db.query(`
    CREATE TABLE IF NOT EXISTS license_activation_logs (
      id VARCHAR(64) PRIMARY KEY,
      license_id VARCHAR(64) NOT NULL,
      tenant_id VARCHAR(64) NOT NULL,
      store_id VARCHAR(64),
      
      -- 操作类型: create | activate | suspend | expire | consume | reject
      action VARCHAR(16) NOT NULL,
      
      -- 授权范围
      scope VARCHAR(32) NOT NULL,
      
      -- 操作者
      operator VARCHAR(64) NOT NULL, -- user id or 'system'
      
      -- 操作结果
      result VARCHAR(16) NOT NULL, -- success | denied
      
      -- 拒绝原因(如适用)
      reason VARCHAR(255),
      
      -- 上下文信息
      context JSONB,
      
      -- 审计时间
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // 日志索引
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_logs_license ON license_activation_logs(license_id);
    CREATE INDEX IF NOT EXISTS idx_logs_tenant ON license_activation_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_logs_action ON license_activation_logs(action);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON license_activation_logs(timestamp);
    -- 复合索引: 租户+时间 (审计查询用)
    CREATE INDEX IF NOT EXISTS idx_logs_audit ON license_activation_logs(tenant_id, timestamp DESC);
  `)

  console.log(`[Migration ${MIGRATION_NAME}] License tables created successfully`)
}

export const down = async (db: any) => {
  await db.query('DROP TABLE IF EXISTS license_activation_logs;')
  await db.query('DROP TABLE IF EXISTS licenses;')
  console.log(`[Migration ${MIGRATION_NAME}] License tables dropped`)
}
