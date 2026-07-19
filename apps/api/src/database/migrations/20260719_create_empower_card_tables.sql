-- ============================================================================
-- 知识赋能卡片表 迁移 V2 (ADR-045)
-- 创建时间: 2026-07-19 11:48
-- 说明: 从 markdown 管理升级为数据库管理的赋能卡片表
-- ============================================================================

-- ── 1. 赋能卡片表 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empower_card (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag             TEXT NOT NULL,           -- 标签: 竞品|技术|市场|用户|合规|设备|会员|运营|选址
    summary         TEXT NOT NULL,           -- 摘要(≤140字)
    source          TEXT NOT NULL,           -- 来源: ZVZO2026|内部成熟模式|国家标准
    freshness_score INT DEFAULT 100,        -- 新鲜度 0-100
    module_mapping  TEXT,                    -- 模块映射: P-38/会员系统/...
    quote_count     INT DEFAULT 0,           -- 引用次数
    last_quoted_at  TIMESTAMPTZ,            -- 最后引用时间
    confidence      INT DEFAULT 70,          -- 可信度 0-100
    expert_vetted   BOOLEAN DEFAULT FALSE,  -- 是否经专家校审
    detail_url      TEXT,                    -- 详细内容链接
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- tag 查询索引
CREATE INDEX IF NOT EXISTS idx_empower_card_tag ON empower_card (tag);

-- 新鲜度降序 (用于展示活跃知识)
CREATE INDEX IF NOT EXISTS idx_empower_card_freshness ON empower_card (freshness_score DESC);

-- 引用次数 (用于匹配未使用知识)
CREATE INDEX IF NOT EXISTS idx_empower_card_quotes ON empower_card (quote_count ASC);

-- 全文搜索 (用以关键词匹配 summary + tag + module_mapping)
CREATE INDEX IF NOT EXISTS idx_empower_card_fts
    ON empower_card USING GIN (to_tsvector('simple', summary || ' ' || tag || ' ' || COALESCE(module_mapping, '')));

-- ── 2. 引用日志表 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empower_card_quote_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id         UUID NOT NULL REFERENCES empower_card(id) ON DELETE CASCADE,
    quoted_by       TEXT NOT NULL,           -- 引用的sessionKey/agent
    quoted_at       TIMESTAMPTZ DEFAULT NOW(),
    task_name       TEXT NOT NULL,           -- 派单任务名
    module_name     TEXT NOT NULL            -- 引用模块
);

CREATE INDEX IF NOT EXISTS idx_empower_quote_card ON empower_card_quote_log (card_id);
CREATE INDEX IF NOT EXISTS idx_empower_quote_date ON empower_card_quote_log (quoted_at DESC);
