# Champion Module — 冠军/优胜者模块

## 模块概述

Champion Module（Champion Dashboard）提供知识贡献评分与排名系统，用于追踪和量化团队成员在知识管理中的贡献。通过 5 种贡献维度（Commit/Review/RFC/Pulse Review/Retro）加权计分，生成排行榜、决策时间线和知识地图。基于 NestJS + TenantGuard 多租户架构。

## 核心功能

- **Champion 注册** — 注册团队成员为 Champion，指定角色（APPROVER / CHAMPION / OBSERVER）
- **知识贡献记录** — 记录团队成员的知识贡献，支持 5 种贡献类型加权计分
- **排行榜** — 按总分降序排列 Champion，展示各类贡献数量明细
- **决策时间线** — 按时间倒序展示 Champion 的关键决策与贡献事件
- **知识地图** — 整体知识贡献聚合统计（按类型/按角色分组）
- **贡献查询** — 按角色筛选 Champion 列表、按 ID 查询详情
- **幂等性保障** — 相同 refId 的贡献自动更新而非重复添加

## 贡献权重体系

| 贡献类型 | 权重分 | 说明 |
|----------|--------|------|
| COMMIT | 2 分 | 代码提交贡献 |
| REVIEW | 3 分 | Code Review 评审 |
| RFC | 8 分 | 决策提议（高价值） |
| PULSE_REVIEW | 4 分 | Pulse 评审 |
| RETRO | 6 分 | 回顾总结 |

## 核心接口

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/champions` | 注册 Champion |
| POST | `/champions/contribution` | 记录知识贡献 |
| GET | `/champions` | 列出 Champion（支持 role 筛选） |
| GET | `/champions/ranking` | 获取排行榜 |
| GET | `/champions/timeline` | 获取决策时间线（支持 championId/sinceDate 筛选） |
| GET | `/champions/knowledge-map` | 获取知识地图统计 |
| GET | `/champions/:id` | 查询单个 Champion 详情 |

### 合约接口（跨模块消费）

- `ChampionContract` — Champion 档案安全子集
- `ChampionRankingContract` — 排行榜安全子集
- `KnowledgeMapContract` — 知识地图安全子集
- 转换函数：`toChampionContract`, `toChampionRankingContract`, `toKnowledgeMapContract`

## 实体类型

- `ChampionRole` — 角色枚举（APPROVER / CHAMPION / OBSERVER）
- `ContributionKind` — 贡献类型枚举（COMMIT / REVIEW / RFC / PULSE_REVIEW / RETRO）
- `ChampionProfile` — 用户档案（id, name, role, joinedAt, contributions[], totalScore）
- `ChampionContribution` — 贡献记录（id, kind, weight, refId, occurredAt, description）
- `ChampionRankingEntry` — 排行榜条目（含各类贡献计数 + rank）
- `DecisionTimelineEntry` — 时间线条目（date, championId, name, action, refId）
- `KnowledgeMap` — 知识地图聚合结果（byKind, byRole）
- `CONTRIBUTION_WEIGHTS` — 权重映射常量

## DTO（数据验证）

| DTO | 用途 | 关键校验 |
|-----|------|----------|
| `RegisterChampionDto` | 注册请求 | name 非空, role 枚举, joinedAt 可选日期 |
| `RecordContributionDto` | 记录贡献 | championId 非空, kind 枚举, refId 非空 |
| `RankingQueryDto` | 排行榜查询 | role 可选枚举 |
| `TimelineQueryDto` | 时间线查询 | championId 可选, sinceDate 可选日期 |
| `ChampionResponseDto` | 响应 DTO | 含贡献列表和总分 |
| `RankingResponseDto` | 排行榜响应 | 含 entries 数组和 totalChampions |
| `KnowledgeMapResponseDto` | 知识地图响应 | 含 6 个聚合字段 |

## 配置说明

当前 V1 版本为内存存储模式，Map 存储 ChampionProfile。

**数据源抽象（V2 计划）：**
- `commit`: git log 解析接入
- `review`: review_request 表查询
- `RFC`: decision-records/DR-*.md 解析 frontmatter
- `pulse_review`: pulse-review 提交记录
- `retro`: lessons-learned/*.md 作者提取

**未来扩展：**
- 接入 PostgreSQL 持久化
- 集成 GitLab/GitHub API 自动采集贡献数据
- 添加数据看板前端组件

## 依赖

- NestJS Common
- `TenantGuard`（多租户守卫，来自 `agent/tenant.guard`）
- `class-validator` / `reflect-metadata`（DTO 校验）
