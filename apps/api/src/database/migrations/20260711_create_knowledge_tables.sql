-- ============================================================================
-- 知识库数据库表迁移 V1
-- 创建时间: 2026-07-11 20:40
-- 说明: 将所有文件型知识库(md文件)迁移到PostgreSQL可查询表结构
-- ============================================================================

-- ── 1. 知识文档表 (替代 docs/knowledge 下的活跃层文件) ─────────
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_path     TEXT NOT NULL,          -- 原md文件路径,如 docs/knowledge/evolution-log.md
    title           TEXT NOT NULL,           -- 文档标题
    kind            TEXT NOT NULL CHECK (kind IN (
                        'spec','lesson','pattern','decision','anti-pattern','doc',
                        'daily-plan','phase-progress','expert-brief','competitor','venue')),
    tags            TEXT[] DEFAULT '{}',     -- 标签数组
    content         TEXT NOT NULL,           -- 全文内容
    summary         TEXT,                    -- AI自动摘要(≤500字)
    chunk_count     INT DEFAULT 0,           -- 分块数(用于混合检索)
    is_archive      BOOLEAN DEFAULT FALSE,   -- 是否归档层(archive/)
    metadata        JSONB DEFAULT '{}',      -- 额外元数据
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_fts
    ON knowledge_documents USING GIN (to_tsvector('simple', content));

-- 按类型查询索引
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_kind
    ON knowledge_documents (kind);

-- 按路径去重索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_docs_path
    ON knowledge_documents (source_path);

-- ── 2. 专家团队表 (替代 experts/E*.md) ──────────────────────────
CREATE TABLE IF NOT EXISTS expert_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT UNIQUE NOT NULL,    -- E1, E2, ..., E54
    name            TEXT NOT NULL,           -- 姓名
    group_id        TEXT NOT NULL,           -- G1~G12
    role            TEXT NOT NULL,           -- 架构/安全/收银/会员...
    specialization  TEXT[],                  -- 专长领域列表
    active_phases   TEXT[],                  -- 关联Phase (P-35, P-36...)
    activity_level  TEXT DEFAULT 'active' CHECK (activity_level IN ('active','idle','retired')),
    insights        JSONB DEFAULT '[]',      -- 专业洞察(K3产出)数组
    learning_notes  JSONB DEFAULT '[]',      -- 学习笔记(L1/L2/L3产出)数组
    feedback_log    JSONB DEFAULT '[]',      -- 反馈日志(M1/M2产出)数组
    evolution_log   JSONB DEFAULT '[]',      -- 进化历史数组
    profile_size    INT DEFAULT 0,           -- 文件大小(bytes)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 按分组查询
CREATE INDEX IF NOT EXISTS idx_expert_group ON expert_profiles (group_id);

-- ── 3. 验收脉冲记录表 (替代 phase-progress.md 的验收行) ──────
CREATE TABLE IF NOT EXISTS acceptance_pulses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pulse_number    INT NOT NULL,            -- pulse#编号
    module          TEXT NOT NULL,           -- 模块名
    status          TEXT NOT NULL CHECK (status IN ('✅','⚠️','🔴')),
    base_pass       BOOLEAN DEFAULT TRUE,
    service_pass    BOOLEAN DEFAULT TRUE,
    controller_pass BOOLEAN DEFAULT TRUE,
    ctest_pass      BOOLEAN DEFAULT TRUE,
    streak_count    INT DEFAULT 0,           -- 连续全绿数
    fix_count       INT DEFAULT 0,           -- 本次修复数
    closed_pulse    INT,                     -- 闭环的上次脉冲号
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pulse_number ON acceptance_pulses (pulse_number DESC);
CREATE INDEX IF NOT EXISTS idx_pulse_date   ON acceptance_pulses (created_at DESC);

-- ── 4. 反模式/正向模式记录表 (替代 patterns-anti-patterns.md) ──
CREATE TABLE IF NOT EXISTS pattern_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type    TEXT NOT NULL CHECK (pattern_type IN ('anti-pattern','positive-pattern')),
    code            TEXT NOT NULL,           -- AM-001, PP-001 等
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    discovery_date  DATE NOT NULL,
    root_cause      TEXT,
    fix_description TEXT,
    related_phases  TEXT[],                  -- 关联Phase
    severity        TEXT CHECK (severity IN ('🔴','🟡','🟢')),
    resolved        BOOLEAN DEFAULT FALSE,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pattern_code ON pattern_records (code);
CREATE INDEX IF NOT EXISTS idx_pattern_type ON pattern_records (pattern_type);

-- ── 5. Phase 进度表 (替代 phase-progress.md 的Phase行) ───────
CREATE TABLE IF NOT EXISTS phase_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_code      TEXT UNIQUE NOT NULL,    -- P-35, P-36...
    name            TEXT NOT NULL,
    owner           TEXT NOT NULL,           -- E13, E40...
    deadline        DATE,
    completion_pct  INT DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
    status          TEXT DEFAULT '🔴' CHECK (status IN ('🔴','🟡','✅','⬜')),
    store_a_required BOOLEAN DEFAULT FALSE, -- 店A必达?
    frontend_done   BOOLEAN DEFAULT FALSE,
    backend_done    BOOLEAN DEFAULT FALSE,
    test_done       BOOLEAN DEFAULT FALSE,
    acceptance_done BOOLEAN DEFAULT FALSE,
    notes           TEXT,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. 每日简报表 (替代 daily-brief.md) ───────────────────────
CREATE TABLE IF NOT EXISTS daily_briefs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date            DATE UNIQUE NOT NULL,
    commits         INT DEFAULT 0,
    tree_commits    INT DEFAULT 0,           -- 🐜
    lobster_commits INT DEFAULT 0,           -- 🦞
    expert_commits  INT DEFAULT 0,           -- 🧠/👥
    acceptance_pulses INT DEFAULT 0,
    streak_max      INT DEFAULT 0,           -- 当日最大连胜
    tests_pass      INT DEFAULT 0,
    tests_fail      INT DEFAULT 0,
    tsc_modules     INT DEFAULT 0,
    tsc_passed      INT DEFAULT 0,
    crons_enabled   INT DEFAULT 0,
    balance         DECIMAL(10,2),           -- 余额
    summary         TEXT,
    highlights      JSONB DEFAULT '[]',
    issues          JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. 竞品数据库表 (替代 competitive-intelligence.md + national-venue-database.md) ──
CREATE TABLE IF NOT EXISTS competitor_venues (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city            TEXT NOT NULL,           -- 城市
    venue_name      TEXT NOT NULL,
    venue_type      TEXT,                    -- 电玩城/游乐场/...
    source_platform TEXT,                    -- 抖音/美团/大众点评/...
    data_9dims      JSONB DEFAULT '{}',      -- 9维数据: {price,device,members,activity...}
    scout_notes     TEXT,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venue_city ON competitor_venues (city);
CREATE INDEX IF NOT EXISTS idx_venue_name ON competitor_venues (venue_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_uniq ON competitor_venues (city, venue_name);

-- ── 8. 进化日志表 (替代 evolution-log.md) ────────────────────
CREATE TABLE IF NOT EXISTS evolution_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date            DATE NOT NULL,
    event_type      TEXT NOT NULL CHECK (event_type IN (
                        'insight','fix','anti-pattern','positive-pattern',
                        'architecture-change','cron-change','review','other')),
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    root_cause      TEXT,
    resolution      TEXT,
    affected_crons  TEXT[],                  -- 影响的cron
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolog_date ON evolution_logs (date DESC);

-- ── 9. 搜索日志 (用于统计和优化) ──────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_search_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text      TEXT NOT NULL,
    result_count    INT DEFAULT 0,
    duration_ms     INT DEFAULT 0,
    source          TEXT DEFAULT 'api',       -- api/cron/manual
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_log_time ON knowledge_search_log (created_at DESC);

-- ============================================================================
-- 更新触发器
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有有updated_at列的表添加触发器
CREATE TRIGGER trg_knowledge_docs_updated_at
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_expert_updated_at
    BEFORE UPDATE ON expert_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pulse_updated_at
    BEFORE UPDATE ON acceptance_pulses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pattern_updated_at
    BEFORE UPDATE ON pattern_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_phase_updated_at
    BEFORE UPDATE ON phase_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_daily_brief_updated_at
    BEFORE UPDATE ON daily_briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
