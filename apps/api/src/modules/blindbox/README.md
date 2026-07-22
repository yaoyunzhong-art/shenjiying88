# Blindbox Module — 盲盒模块

## 模块概述

Blindbox 模块提供盲盒抽奖系统的完整实现，支持多层级奖池配置、概率公示、保底机制（Pity System）、单抽/十连抽等核心功能。基于 NestJS + RxJS Observable 构建，通过 TenantGuard 实现多租户隔离。

## 核心功能

- **盲盒计划管理** — 创建和管理盲盒抽奖计划，每个计划包含多层级奖池
- **概率阶梯机制** — 每层奖池配置独立概率，层级内奖品按权重分配
- **保底（Pity）机制** — 设定保底次数，连续未中高等级时保底必出
- **单次抽取** — 用户单次抽盒，扣除库存并记录抽奖结果
- **十连抽取** — 批量抽盒，一次 10 连抽，支持十连保底
- **概率公示** — 公开各层级理论概率及总和，满足合规要求
- **奖池查询** — 查看盲盒计划的完整奖池配置
- **抽奖历史** — 按用户/计划查询抽奖记录，默认返回最近 20 条
- **库存扣减** — 抽中后实时扣减奖品库存，库存为零自动跳过

## 核心接口

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/blindbox/plans` | 创建盲盒计划 |
| POST | `/blindbox/:planId/draw` | 单次抽盒 |
| POST | `/blindbox/:planId/draw/batch` | 十连抽盒 |
| GET | `/blindbox/:planId/probabilities` | 获取概率公示 |
| GET | `/blindbox/:planId/prize-pool` | 获取奖池详情 |
| GET | `/blindbox/:planId/history` | 获取抽奖历史（支持 limit 参数） |

### 合约接口（跨模块消费）

- `BlindBoxPlanContract` — 盲盒计划安全子集
- `BlindBoxPrizeContract` — 奖品信息安全子集
- `BlindBoxDrawRecordContract` — 抽奖记录安全子集
- `BlindBoxOddsContract` — 概率公示条目
- 转换函数：`toBlindBoxPlanContract`, `toBlindBoxDrawRecordContract`, `toBlindBoxOddsContracts`

## 实体类型

- `BlindBoxPlan` — 盲盒计划（planId, name, tiers, guaranteePityCount, status）
- `BlindBoxTier` — 层级定义（tierId, name, probability, prizes[]）
- `BlindBoxPrize` — 奖品定义（prizeId, name, description, stock, weight, isMythic）
- `BlindBoxDrawRecord` — 抽取记录（recordId, planId, userId, tier, prizeId, prizeName, drawType）
- `BlindBoxStatus` — 计划状态枚举（ACTIVE / DRAFT / PAUSED）
- `DrawType` — 抽取类型枚举（SINGLE / BATCH10）

## DTO（数据验证）

| DTO | 用途 | 关键校验 |
|-----|------|----------|
| `CreatePlanDto` | 创建计划请求 | name 非空, tiers 至少 1 层, guaranteePityCount ≥ 1 |
| `TierDto` | 层级定义 | probability 范围 [0,1], prizes 至少 1 个 |
| `PrizeDto` | 奖品定义 | stock ≥ 0, weight ≥ 1 |
| `DrawBodyDto` | 抽盒请求 | userId 非空 |
| `HistoryQueryDto` | 历史查询 | limit 范围 [1,100], 可选 |
| `DrawResultDto` | 抽取响应 | success + data/message |

## 配置说明

当前模块为内存存储模式（V1），暂无外部数据库配置需求。数据通过 `Map<string, BlindBoxPlan>` 和 `Map<string, BlindBoxDrawRecord[]>` 维护。

**后续接入适配：**
- 数据库：可将 `Map` 存储替换为 TypeORM Repository
- 缓存：添加 Redis 缓存热点计划和奖池数据
- 事务：批量抽盒操作需加事务保证库存一致性

## 依赖

- NestJS Common / Core
- RxJS（响应式流处理）
- class-validator / class-transformer（DTO 校验）
- `TenantGuard`（多租户守卫，来自 `agent/tenant.guard`）
