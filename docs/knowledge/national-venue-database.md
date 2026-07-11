# 🗺️ 全国场所数据库 — National Venue Database

> 电玩城/游乐厅 · 连锁品牌 · 区域分布 · 行业规模
> 每日更新 · 数据来源: 8平台采集
> 最后更新: 2026-07-12 02:00

## 🏛️ 数据库架构

venues表（全国场馆主表）托管于 PostgreSQL，关联以下竞品子表：
- **competitor_prices** — 竞品价格体系（按游戏类型/套餐/会员价）
- **competitor_devices** — 竞品机台设备（品牌/型号/数量）
- **competitor_membership** — 竞品会员体系（等级/费用/权益）
- **competitor_reviews** — 竞品用户评价（跨平台/情感分析）
- **competitor_activities** — 竞品营销活动（节日/折扣/办卡）
- **scout_cities** / **scout_collection_logs** — 采集调度日志

详见: `apps/api/src/database/migrations/20260712_create_national_venue_competitor_tables.sql`

## 🏙️ T1~T3 城市覆盖 (30城)

### T1 (10城)
北京·上海·广州·深圳·成都·杭州·重庆·武汉·西安·南京
8平台全量覆盖: 抖音·美团·大众点评·小红书·猫眼·携程·天眼查·boss直聘

### T2 (10城)
天津·苏州·长沙·郑州·东莞·青岛·沈阳·宁波·昆明·大连
优先3平台: 抖音·美团·大众点评

### T3 (10城)
佛山·合肥·福州·济南·厦门·南宁·贵阳·哈尔滨·长春·石家庄

## 📐 核心指标

| 维度 | 数据 |
|:----:|:----:|
| 覆盖城市 | 30城 (T1:10 + T2:10 + T3:10) |
| 采集平台 | 8 (抖音/美团/点评/小红书/猫眼/携程/天眼查/BOSS) |
| 目标城市 | 100城 (含T4+T5后续扩展) |
| 场馆分类 | 游艺厅/电玩城/综合娱乐/亲子乐园/VR体验 |
| 采集批次 | 按城市+平台+批次号追踪 |

## 🔧 使用

```sql
-- 查询某城市所有场馆
SELECT * FROM venues WHERE city = '深圳';

-- 查询竞品价格
SELECT v.name, cp.game_type, cp.unit_price, cp.member_price
FROM venues v JOIN competitor_prices cp ON v.id = cp.venue_id
WHERE v.city = '深圳';

-- 查询最新采集批次
SELECT * FROM scout_collection_logs ORDER BY created_at DESC LIMIT 10;
```
