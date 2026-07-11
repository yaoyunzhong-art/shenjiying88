-- ============================================================================
-- 全国场馆+竞品数据表迁移 V3
-- 创建时间: 2026-07-12 02:00
-- 说明: venues主表 + 6张竞品子表
-- 关联: scout_cities(from V2) / competitor_venues(from V1)
-- ============================================================================

BEGIN;

-- ── 1. venues 全国场馆主表 ────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    city            VARCHAR(50),
    city_tier       VARCHAR(10),
    region          VARCHAR(20),
    address         TEXT,
    lat             DECIMAL,
    lng             DECIMAL,
    category        VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'active',
    source          VARCHAR(50),
    source_url      TEXT,
    rating          DECIMAL,
    review_count    INT,
    opening_hours   TEXT,
    phone           VARCHAR(50),
    email           VARCHAR(100),
    tags            TEXT[],
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_city ON venues (city);
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues (category);
CREATE INDEX IF NOT EXISTS idx_venues_tier ON venues (city_tier);
CREATE INDEX IF NOT EXISTS idx_venues_region ON venues (region);
CREATE INDEX IF NOT EXISTS idx_venues_source ON venues (source);

-- ── 2. competitor_prices 竞品价格表 ────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_prices (
    id              SERIAL PRIMARY KEY,
    venue_id        INT REFERENCES venues(id) ON DELETE CASCADE,
    game_type       VARCHAR(50),
    unit_price      DECIMAL,
    package_name    VARCHAR(100),
    package_price   DECIMAL,
    member_price    DECIMAL,
    duration        VARCHAR(20),
    effective_from  DATE,
    effective_to    DATE,
    source          VARCHAR(50),
    captured_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cp_venue ON competitor_prices (venue_id);
CREATE INDEX IF NOT EXISTS idx_cp_game ON competitor_prices (game_type);

-- ── 3. competitor_devices 竞品设备表 ────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_devices (
    id              SERIAL PRIMARY KEY,
    venue_id        INT REFERENCES venues(id) ON DELETE CASCADE,
    device_name     VARCHAR(100),
    device_type     VARCHAR(50),
    brand           VARCHAR(100),
    model           VARCHAR(100),
    quantity        INT,
    condition       VARCHAR(20),
    source          VARCHAR(50),
    captured_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cd_venue ON competitor_devices (venue_id);

-- ── 4. competitor_membership 竞品会员体系表 ────────────────────
CREATE TABLE IF NOT EXISTS competitor_membership (
    id              SERIAL PRIMARY KEY,
    venue_id        INT REFERENCES venues(id) ON DELETE CASCADE,
    tier_name       VARCHAR(50),
    join_fee        DECIMAL,
    monthly_fee     DECIMAL,
    benefits        TEXT[],
    member_count    INT,
    source          VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_cm_venue ON competitor_membership (venue_id);

-- ── 5. competitor_reviews 竞品评价表 ────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_reviews (
    id              SERIAL PRIMARY KEY,
    venue_id        INT REFERENCES venues(id) ON DELETE CASCADE,
    platform        VARCHAR(30),
    reviewer        VARCHAR(100),
    rating          DECIMAL,
    content         TEXT,
    tags            TEXT[],
    posted_at       TIMESTAMP,
    sentiment       VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_cr_venue ON competitor_reviews (venue_id);
CREATE INDEX IF NOT EXISTS idx_cr_platform ON competitor_reviews (platform);

-- ── 6. competitor_activities 竞品活动表 ────────────────────────
CREATE TABLE IF NOT EXISTS competitor_activities (
    id              SERIAL PRIMARY KEY,
    venue_id        INT REFERENCES venues(id) ON DELETE CASCADE,
    activity_name   VARCHAR(200),
    activity_type   VARCHAR(50),
    start_date      DATE,
    end_date        DATE,
    discount_info   TEXT,
    source          VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_ca_venue ON competitor_activities (venue_id);

-- ── 7. scout_cities 补充字段 ──────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scout_cities' AND column_name = 'next_collect'
    ) THEN
        ALTER TABLE scout_cities ADD COLUMN next_collect TIMESTAMPTZ;
    END IF;
END $$;

COMMIT;
