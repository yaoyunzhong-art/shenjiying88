-- ============================================================================
-- 侦察兵全国扩展数据库迁移 V2
-- 创建时间: 2026-07-12 01:00
-- 说明: 全国城市分级采集 + scout_collection_logs + competitor_venues扩展
-- 关联文件: docs/knowledge/scout-city-tier.md
-- ============================================================================

BEGIN;

-- ── 1. 城市登记表 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scout_cities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,           -- 城市名称(北京/上海/...)
    tier            TEXT NOT NULL CHECK (tier IN ('T1','T2','T3','T4','T5')),
    region          TEXT NOT NULL,           -- 区域: 华东/华南/华北/华中/西南/东北/西北/港澳台
    priority        INT NOT NULL DEFAULT 0,  -- 采集优先级 0~100, 越高越优先
    status          TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','paused','completed','archived')),
    expected_venues INT DEFAULT 0,           -- 预计可采集场馆数
    last_collected  TIMESTAMPTZ,             -- 上次成功采集时间
    notes           TEXT,                    -- 备注(聚焦竞品/特殊配置)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 按等级查询索引
CREATE INDEX IF NOT EXISTS idx_scout_cities_tier ON scout_cities (tier);
-- 按区域查询索引
CREATE INDEX IF NOT EXISTS idx_scout_cities_region ON scout_cities (region);
-- 按状态查询索引
CREATE INDEX IF NOT EXISTS idx_scout_cities_status ON scout_cities (status);
-- 按优先级排序索引
CREATE INDEX IF NOT EXISTS idx_scout_cities_priority ON scout_cities (priority DESC);
-- 城市名称唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_scout_cities_name ON scout_cities (name);

-- ── 2. 采集日志表 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scout_collection_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id         UUID NOT NULL REFERENCES scout_cities(id) ON DELETE CASCADE,
    batch_no        TEXT NOT NULL,           -- 批次号: YYYYMMDD-HHMMSS-{city}
    platform        TEXT NOT NULL,           -- 采集平台(抖音/美团/大众点评/小红书/猫眼/携程/天眼查/BOSS直聘/all)
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','running','completed','partial','failed','cancelled')),
    items_count     INT DEFAULT 0,           -- 采集到数据条数
    error_log       JSONB DEFAULT '[]',      -- 错误日志数组 [{time,platform,error}]
    is_resume       BOOLEAN DEFAULT FALSE,   -- 是否为中断恢复的续采
    resume_from     UUID,                    -- 恢复自哪个batch(同一city+platform的上一batch)
    started_at      TIMESTAMPTZ,             -- 实际开始时间
    completed_at    TIMESTAMPTZ,             -- 完成时间
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 按城市+时间查询
CREATE INDEX IF NOT EXISTS idx_scout_log_city_time ON scout_collection_logs (city_id, created_at DESC);
-- 按状态查询(用于调度器查找待处理/运行中任务)
CREATE INDEX IF NOT EXISTS idx_scout_log_status ON scout_collection_logs (status) WHERE status IN ('pending','running');
-- 按批次号查询
CREATE INDEX IF NOT EXISTS idx_scout_log_batch ON scout_collection_logs (batch_no);
-- 按平台查询
CREATE INDEX IF NOT EXISTS idx_scout_log_platform ON scout_collection_logs (platform);

-- ── 3. 扩展 competitor_venues 表 ──────────────────────────────

-- 3a. 添加 region(区域) 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'competitor_venues' AND column_name = 'region'
    ) THEN
        ALTER TABLE competitor_venues ADD COLUMN region TEXT;
        COMMENT ON COLUMN competitor_venues.region IS '区域分类: 华东/华南/华北/华中/西南/东北/西北/港澳台';
    END IF;
END $$;

-- 3b. 添加 city_tier(城市等级) 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'competitor_venues' AND column_name = 'city_tier'
    ) THEN
        ALTER TABLE competitor_venues ADD COLUMN city_tier TEXT CHECK (city_tier IN ('T1','T2','T3','T4','T5'));
        COMMENT ON COLUMN competitor_venues.city_tier IS '城市等级: T1~T5, 关联 scout_cities.tier';
    END IF;
END $$;

-- 3c. 添加 collection_batch(采集批次号) 字段(用于知识库同步追踪)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'competitor_venues' AND column_name = 'collection_batch'
    ) THEN
        ALTER TABLE competitor_venues ADD COLUMN collection_batch TEXT;
        COMMENT ON COLUMN competitor_venues.collection_batch IS '采集批次号, 关联 scout_collection_logs.batch_no';
    END IF;
END $$;

-- 3d. 添加 scout_city_id(关联城市登记表) 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'competitor_venues' AND column_name = 'scout_city_id'
    ) THEN
        ALTER TABLE competitor_venues ADD COLUMN scout_city_id UUID REFERENCES scout_cities(id);
        COMMENT ON COLUMN competitor_venues.scout_city_id IS '关联 scout_cities.id';
    END IF;
END $$;

-- 3e. 添加 scout_updated_at(侦察兵最后采集时间) 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'competitor_venues' AND column_name = 'scout_updated_at'
    ) THEN
        ALTER TABLE competitor_venues ADD COLUMN scout_updated_at TIMESTAMPTZ;
        COMMENT ON COLUMN competitor_venues.scout_updated_at IS '侦察兵最后采集更新时间';
    END IF;
END $$;

-- 更新 competitor_venues 索引
CREATE INDEX IF NOT EXISTS idx_venue_region ON competitor_venues (region);
CREATE INDEX IF NOT EXISTS idx_venue_city_tier ON competitor_venues (city_tier);
CREATE INDEX IF NOT EXISTS idx_venue_collection_batch ON competitor_venues (collection_batch);

-- ── 4. scout_cities 初始数据 (T1+T2+T3, 共30城) ──────────────
INSERT INTO scout_cities (name, tier, region, priority, status, expected_venues, notes) VALUES
    -- T1: 已覆盖10城 (优先级100)
    ('北京',   'T1', '华北', 100, 'active', 20, '大玩家朝阳800㎡·4.3分 / meland荟聚2500㎡·4.8分 / 万达通州·4.5分'),
    ('上海',   'T1', '华东', 100, 'active', 25, '星际传奇合生汇500㎡ / 反斗乐园世纪汇400㎡'),
    ('广州',   'T1', '华南', 100, 'active', 20, 'P0竞品密集区, 待首采'),
    ('深圳',   'T1', '华南', 100, 'active', 20, 'P0竞品密集区, 待首采'),
    ('成都',   'T1', '西南', 100, 'active', 15, '大玩家锦华万达1000㎡·4.4分 / 环球meland·4.7分 / 龙泉驿万达·4.3分'),
    ('杭州',   'T1', '华东', 95,  'active', 15, 'P1, 新一线标杆'),
    ('重庆',   'T1', '西南', 95,  'active', 15, 'P1, 西南重镇'),
    ('武汉',   'T1', '华中', 90,  'active', 12, 'P2, 华中核心'),
    ('西安',   'T1', '西北', 90,  'active', 12, 'P2, 西北核心'),
    ('南京',   'T1', '华东', 90,  'active', 12, 'P2, 长三角重要城市'),
    -- T2: 本周扩展10城 (优先级80-70)
    ('天津',   'T2', '华北', 80,  'active', 8,  '本周扩展第一批'),
    ('苏州',   'T2', '华东', 80,  'active', 8,  '本周扩展第一批'),
    ('长沙',   'T2', '华中', 80,  'active', 8,  '本周扩展第一批'),
    ('郑州',   'T2', '华中', 80,  'active', 8,  '本周扩展第一批'),
    ('东莞',   'T2', '华南', 75,  'active', 6,  '本周扩展第二批'),
    ('青岛',   'T2', '华东', 75,  'active', 6,  '本周扩展第二批'),
    ('沈阳',   'T2', '东北', 75,  'active', 6,  '本周扩展第二批'),
    ('宁波',   'T2', '华东', 75,  'active', 6,  '本周扩展第二批'),
    ('昆明',   'T2', '西南', 70,  'active', 5,  '本周扩展第三批'),
    ('大连',   'T2', '东北', 70,  'active', 5,  '本周扩展第三批'),
    -- T3: 下周扩展10城 (优先级60)
    ('佛山',   'T3', '华南', 60,  'active', 6,  '下周扩展第一批'),
    ('合肥',   'T3', '华东', 60,  'active', 5,  '下周扩展第一批'),
    ('福州',   'T3', '华东', 60,  'active', 5,  '下周扩展第一批'),
    ('济南',   'T3', '华东', 60,  'active', 5,  '下周扩展第一批'),
    ('厦门',   'T3', '华东', 60,  'active', 5,  '下周扩展第一批'),
    ('南宁',   'T3', '华南', 55,  'active', 5,  '下周扩展第二批'),
    ('贵阳',   'T3', '西南', 55,  'active', 5,  '下周扩展第二批'),
    ('哈尔滨', 'T3', '东北', 55,  'active', 5,  '下周扩展第二批'),
    ('长春',   'T3', '东北', 55,  'active', 5,  '下周扩展第二批'),
    ('石家庄', 'T3', '华北', 55,  'active', 5,  '下周扩展第二批')
ON CONFLICT (name) DO NOTHING;

-- ── 5. 触发器 ──────────────────────────────────────────────────

-- scout_cities 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 如果 scout_cities 的触发器不存在则创建
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_scout_cities_updated_at'
    ) THEN
        CREATE TRIGGER trg_scout_cities_updated_at
            BEFORE UPDATE ON scout_cities
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT;
