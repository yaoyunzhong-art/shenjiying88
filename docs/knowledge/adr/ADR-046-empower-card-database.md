# ADR-046: 科学知识体系 V2 数据库实现架构

> 决策日期: 2026-07-19
> 状态: ✅ 已实施
> 标签: architecture, knowledge-system, database, empower-card

## 背景

ADR-045 定义了科学知识体系 V2 的五环工厂框架（R1-R5 → E1-E5 → S1-S6 → A1-A5 → F1-F5），但初始实现全部基于 markdown 文件管理。随着知识体系在 V21 Day1 投入实战，暴露出以下问题：

1. **知识不可检索** — 14 条赋能卡片全在 markdown 中，派单时靠人工回忆/搜索匹配
2. **引用无追踪** — usage-stats.md 手动更新，容易滞后
3. **退化无自动化** — F3 退化曲线缺少数据库定时任务
4. **赋能无 API** — 树哥派单需要手动注入知识卡片，不能自动匹配

## 决策

采用 **PostgreSQL 数据库 + NestJS 完整 REST API** 实现知识体系 V2 的 S1-S6 存储层和 A1-A5 赋能层。

## 架构设计

```
┌──────────────────────────────────────────────────────────────┐
│  ADR-045 五环工厂                                              │
│                                                              │
│  R1-R5 (采集)                                                │
│    └─ markdown 文件 (usage-stats.md, daily-research, ADR...)  │
│    └─ 竞品数据爬虫 (competitive-intelligence.md → DB)         │
│                                                              │
│  E1-E5 (处理)                                                │
│    └─ import-empower-cards.ts (md→DB)                        │
│    └─ auto-classify (tag提取 + 模块映射推理)                  │
│    └─ freshness校正 (创建=100, 引用+5, 24h未引用-10)         │
│    └─ confidence计算 (sourceTrust×0.3+vetted×0.4+fresh×0.3)  │
│                                                              │
│  S1-S6 (存储) ← **当前ADR**                                   │
│    └─ PostgreSQL: empower_card 表                             │
│    └─ PostgreSQL: empower_card_quote_log 表                   │
│    └─ 全文索引 (GIN to_tsvector)                              │
│    └─ 内存降级模式 (pg不可用时)                                │
│                                                              │
│  A1-A5 (赋能)                                                │
│    └─ POST /api/empower-cards/match → 自动匹配 top-3         │
│    └─ POST /api/empower-cards/:id/quote → 引用日志注入       │
│    └─ 派单流程集成: scpEo5 (调用API匹配→注入prompt)           │
│                                                              │
│  F1-F5 (反馈)                                                │
│    └─ POST /api/empower-cards/decay → F3退化曲线             │
│    └─ GET /api/empower-cards/stats/today → F4赋能评分        │
│    └─ 引用日志 → F1使用率统计                                 │
└──────────────────────────────────────────────────────────────┘
```

## 数据模型

### empower_card (知识赋能卡片)

| 字段 | 类型 | 说明 |
|:-----|:-----|:------|
| id | UUID PK | 自动生成 |
| tag | TEXT NOT NULL | 分类标签: 竞品/技术/市场/用户/合规/设备/会员/运营/选址 |
| summary | TEXT NOT NULL | 摘要(≤140字) |
| source | TEXT NOT NULL | 来源名 |
| freshness_score | INT DEFAULT 100 | 新鲜度 0-100 |
| module_mapping | TEXT | 关联模块: P-38/竞品分析/安全合规... |
| quote_count | INT DEFAULT 0 | 引用次数 |
| last_quoted_at | TIMESTAMPTZ | 最后引用时间 |
| confidence | INT DEFAULT 70 | 可信度 0-100 |
| expert_vetted | BOOLEAN DEFAULT FALSE | 是否经专家校审 |
| detail_url | TEXT | 详细文档链接 |

索引: tag / freshness_score DESC / quote_count ASC / GIN全文索引

### empower_card_quote_log (引用日志)

| 字段 | 类型 | 说明 |
|:-----|:-----|:------|
| id | UUID PK | 自动生成 |
| card_id | UUID FK | 关联卡片 |
| quoted_by | TEXT | 引用者(sessionKey/agentId) |
| quoted_at | TIMESTAMPTZ | 引用时间 |
| task_name | TEXT | 对应的派单任务 |
| module_name | TEXT | 引用模块 |

索引: card_id / quoted_at DESC

## API 接口

| 方法 | 路径 | 用途 | 版本 |
|:-----|:------|:------|:-----|
| POST | /api/empower-cards | 创建卡片 | v1 ✅ |
| GET | /api/empower-cards | 列表(新鲜度降序) | v1 ✅ |
| GET | /api/empower-cards/:id | 卡片详情 | v1 ✅ |
| POST | /api/empower-cards/search | 关键词+标签+模块检索 | v1 ✅ |
| POST | /api/empower-cards/match | 派单自动匹配 top-3 | v1 ✅ |
| POST | /api/empower-cards/:id/quote | 记录引用(F1) | v1 ✅ |
| POST | /api/empower-cards/decay | 退化曲线(F3) | v1 ✅ |
| GET | /api/empower-cards/stats/today | 今日赋能评分(F4) | v1 ✅ |

## 匹配算法

```
score = 新鲜度×0.3 + 可信度×0.2 + 标签精确匹配+20 + 模块模糊匹配+15 + 关键词命中+10
```

top-3 返回后，如果不足 3 条则补充新鲜度最高且引用少(≥50分·≤1引用)的通用卡片。

## 退化曲线算法 (F3)

```
每天 22:00 执行:
  1. 选择 freshness_score > 20 且 过去24h未被引用的卡片 → freshness_score -= 10
  2. 选择 freshness_score < 20 的卡片 → DELETE (归档)
```

## 引用日志 & 使用率 (F1)

```
每次引用:
  1. empower_card.quote_count += 1
  2. empower_card.last_quoted_at = NOW()
  3. empower_card_quote_log 插入一行 (card_id, task_name, module_name, quoted_by)
```

## 赋能评分 (F4)

```
当日赋能评分 = 当日引用次数 × 10 + 当日新增卡片 × 5
```

## 降级策略

当 PostgreSQL 不可用时（`POSTGRES_URL` 未配置或连接失败），自动降级到内存模式（`Map<string, EmpowerCardEntity>`），不影响已有业务。

## 文件结构

```
apps/api/src/modules/empower-card/
├── empower-card.entity.ts      — 类型定义 + DTO
├── empower-card.service.ts     — 业务层 (pg-pool直连 + 内存降级)
├── empower-card.controller.ts  — 7个REST端点
└── empower-card.module.ts      — NestJS模块 (无Prisma依赖)

apps/api/src/database/migrations/
└── 20260719_create_empower_card_tables.sql  — SQL建表迁移

scripts/
└── import-empower-cards.ts     — usage-stats.md → DB导入工具
```

## 12段Cron知识操作对齐

| 时段 | 操作 | 对齐接口 | 状态 |
|:----:|:-----|:---------|:----:|
| 02:00 | 知识提醒(低新鲜度卡片) | GET /api/empower-cards?minFreshness=30 | 📋 |
| 06:00 | 就绪检查(新鲜度分布) | GET /api/empower-cards/stats/today | 📋 |
| 08:00 | A1注入(记录引用) | POST /api/empower-cards/:id/quote | 📋 |
| 10:00 | E3验收(可信度更新) | POST /api/empower-cards (新建) | 📋 |
| 11:00 | 全流程(导入新采集) | import-empower-cards.ts | 📋 |
| 12:00 | A1+E5(匹配top-3) | POST /api/empower-cards/match | 📋 |
| 14:00 | 审计(密度检查) | GET /api/empower-cards (列表) | 📋 |
| 16:00 | A1注入(匹配) | POST /api/empower-cards/match | 📋 |
| 18:00 | E3验收(统计) | GET /api/empower-cards/stats/today | 📋 |
| 20:00 | 赋能报告 | GET /api/empower-cards (活跃列表) | 📋 |
| **22:00** | **闭环(decay+stats)** | POST /api/empower-cards/decay | ✅ |
| 23:00 | 日评分(废弃→改V21 L3) | — | ✅ |

## 与原有 knowledge 模块的关系

- `knowledge/` — 语义搜索 + 文档 chunking + 嵌入检索（RAG风格）
- `db-knowledge/` — knowledge_documents 表的管理（文件型知识库）
- **`empower-card/`（新）** — 知识赋能卡片（派单注入专用，和 knowledge/ 互补）

三个模块职责不重叠：
- 知识文档 → `knowledge/` 和 `db-knowledge/`
- 赋能卡片 → `empower-card/`

## 下一步

1. ✅ 数据库建表迁移 SQL
2. ✅ NestJS 完整模块 (201-9342字节)
3. ✅ 导入脚本 (usage-stats.md → DB)
4. ⏳ 22:00 首次闭环运行 (decay + stats)
5. ⏳ 12段 cron payload 更新为调用 API
6. ⏳ ADR-046 撰写完成
7. 📋 14:00 首次通过 API 进行知识审计
