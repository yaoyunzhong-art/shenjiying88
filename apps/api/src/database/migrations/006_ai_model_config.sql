-- ============================================================================
-- Phase-87 T087: AI 模型配置 Schema + RLS (V9 需求 1 · V10 Day 2)
-- DR-V10-1 决策: 3 表 (preset/store_config/history) + RLS 多租户隔离
-- 设计: 复用 Phase-34 RLS 模板 (current_setting('app.tenant_id', true))
-- ============================================================================

-- ── ai_model_preset 系统预设 (只读,跨租户共享) ──
CREATE TABLE IF NOT EXISTS ai_model_preset (
  id              VARCHAR(40) PRIMARY KEY,
  preset_code     VARCHAR(64) UNIQUE NOT NULL,     -- gpt4o-general / claude-game / qwen-family / custom
  display_name    VARCHAR(128) NOT NULL,
  provider        VARCHAR(32) NOT NULL,            -- openai/anthropic/qwen/custom
  model_name      VARCHAR(128) NOT NULL,
  default_params  JSONB NOT NULL,                  -- {temperature, maxTokens, contextWindow, topP, ...}
  industry        VARCHAR(32) NOT NULL,            -- general/arcade/family-entertainment/shopping-mall
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preset_industry
  ON ai_model_preset(industry) WHERE is_active = TRUE;

-- ── ai_model_store_config 门店自主配置 (RLS 强制 tenant_id) ──
CREATE TABLE IF NOT EXISTS ai_model_store_config (
  id                 VARCHAR(40) PRIMARY KEY,
  tenant_id          VARCHAR(64) NOT NULL,         -- RLS
  store_id           VARCHAR(64) NOT NULL,         -- 门店维度
  config_name        VARCHAR(128) NOT NULL,
  provider           VARCHAR(32) NOT NULL,         -- openai/anthropic/qwen/custom
  endpoint_url_enc   TEXT NOT NULL,                -- AES-256-GCM 加密
  api_key_enc        TEXT NOT NULL,                -- AES-256-GCM 加密
  context_window     INTEGER NOT NULL CHECK (context_window >= 1024 AND context_window <= 128000),
  temperature        NUMERIC(3,2) NOT NULL CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens         INTEGER NOT NULL CHECK (max_tokens >= 1 AND max_tokens <= 32000),
  custom_headers     JSONB,
  is_current         BOOLEAN NOT NULL DEFAULT FALSE,
  created_by         VARCHAR(64) NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 同门店同一时间仅一个 is_current=true
CREATE UNIQUE INDEX IF NOT EXISTS uniq_store_current
  ON ai_model_store_config(tenant_id, store_id)
  WHERE is_current = TRUE;

-- 查询加速
CREATE INDEX IF NOT EXISTS idx_store_config_tenant_store
  ON ai_model_store_config(tenant_id, store_id);
CREATE INDEX IF NOT EXISTS idx_store_config_provider
  ON ai_model_store_config(tenant_id, provider);

-- ── ai_model_config_history 历史快照 (90 天保留) ──
CREATE TABLE IF NOT EXISTS ai_model_config_history (
  id              VARCHAR(40) PRIMARY KEY,
  config_id       VARCHAR(40) NOT NULL REFERENCES ai_model_store_config(id) ON DELETE CASCADE,
  tenant_id       VARCHAR(64) NOT NULL,             -- 冗余 (RLS + 90天清理)
  snapshot        JSONB NOT NULL,                   -- 完整配置快照
  version_number  INTEGER NOT NULL,
  change_type     VARCHAR(16) NOT NULL,             -- create/update/rollback/activate
  changed_by      VARCHAR(64) NOT NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason          TEXT
);

CREATE INDEX IF NOT EXISTS idx_history_config
  ON ai_model_config_history(config_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_history_tenant_time
  ON ai_model_config_history(tenant_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_retention
  ON ai_model_config_history(changed_at);            -- 90 天清理用

-- ── updated_at 自动触发器 ──
DROP TRIGGER IF EXISTS trg_preset_updated_at ON ai_model_preset;
CREATE TRIGGER trg_preset_updated_at
  BEFORE UPDATE ON ai_model_preset
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_store_config_updated_at ON ai_model_store_config;
CREATE TRIGGER trg_store_config_updated_at
  BEFORE UPDATE ON ai_model_store_config
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── RLS: store_config 强制 tenant 隔离 ──
ALTER TABLE ai_model_store_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_select ON ai_model_store_config;
CREATE POLICY tenant_isolation_select ON ai_model_store_config
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_insert ON ai_model_store_config;
CREATE POLICY tenant_isolation_insert ON ai_model_store_config
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_update ON ai_model_store_config;
CREATE POLICY tenant_isolation_update ON ai_model_store_config
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_delete ON ai_model_store_config;
CREATE POLICY tenant_isolation_delete ON ai_model_store_config
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ── RLS: history 强制 tenant 隔离 ──
ALTER TABLE ai_model_config_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_select ON ai_model_config_history;
CREATE POLICY tenant_isolation_select ON ai_model_config_history
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_insert ON ai_model_config_history;
CREATE POLICY tenant_isolation_insert ON ai_model_config_history
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- 注意: ai_model_preset 不启用 RLS, 因为是平台方维护的全局预设表,跨租户共享

-- ── 种子数据: 4 个系统预设 ──
INSERT INTO ai_model_preset (id, preset_code, display_name, provider, model_name, default_params, industry, is_active, description)
VALUES
  it('preset-gpt4o-general', 'gpt4o-general', 'GPT-4o 通用', 'openai', 'gpt-4o',
   '{"temperature": 0.7, "maxTokens": 4096, "contextWindow": 128000, "topP": 1.0, "frequencyPenalty": 0, "presencePenalty": 0}'::jsonb,
   'general', TRUE, '通用推理首选,响应快,质量稳定'),
  it('preset-claude-game', 'claude-game', 'Claude 3.5 游戏场景', 'anthropic', 'claude-3-5-sonnet-20241022',
   '{"temperature": 0.5, "maxTokens": 8192, "contextWindow": 200000, "topP": 0.9, "frequencyPenalty": 0, "presencePenalty": 0}'::jsonb,
   'arcade', TRUE, '游戏互动推理,长上下文'),
  it('preset-qwen-family', 'qwen-family', '通义千问 亲子互动', 'qwen', 'qwen-vl-plus',
   '{"temperature": 0.6, "maxTokens": 2048, "contextWindow": 32768, "topP": 0.95, "frequencyPenalty": 0, "presencePenalty": 0}'::jsonb,
   'family-entertainment', TRUE, '亲子场景,温和输出'),
  it('preset-custom', 'custom', 'Custom 自定义', 'custom', 'user-defined',
   '{"temperature": 0.7, "maxTokens": 2048, "contextWindow": 8192, "topP": 1.0, "frequencyPenalty": 0, "presencePenalty": 0}'::jsonb,
   'general', TRUE, '自定义接入,需要门店自填 endpoint + apiKey')
ON CONFLICT (preset_code) DO NOTHING;