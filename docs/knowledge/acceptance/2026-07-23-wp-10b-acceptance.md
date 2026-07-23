# WP-10B 赛事与玩法增强 — 验收报告

> 日期: 2026-07-23 | 提交: feat(tournament): WP-10B 赛事与玩法增强 - 兑换/竞猜/投票

## 验收摘要

| 项目 | 结果 |
|---|---|
| TSC 编译 | ✅ 零错误 |
| 已有测试 (412 个) | ✅ 全部通过 |
| 功能覆盖 | ✅ 5 个新端点 + 3 个新查询端点 |
| test.skip/only | ✅ 无 |
| 不重写已有功能 | ✅ 完全兼容 |

## 功能验收

### 1. 实体字段扩展 (Tournament)

| 字段 | 已添加 | 默认值 |
|---|---|---|
| `minParticipants` | ✅ | 2 |
| `entryFee` | ✅ | 0 |
| `prizePool` | ✅ | 0 |

### 2. 新增类型

| 类型 | 枚举值 | 已添加 |
|---|---|---|
| `JoinType` | PARTICIPANT, SPECTATOR | ✅ |
| `RedemptionStatus` | PENDING, COMPLETED, FAILED | ✅ |
| `PredictionStatus` | LOCKED, WON, LOST | ✅ |
| `RedemptionRecord` | — | ✅ |
| `PredictionRecord` | — | ✅ |
| `VoteRecord` | — | ✅ |
| `PopularityEntry` | — | ✅ |

### 3. 新增端点

| 方法 | 路径 | 验收 |
|---|---|---|
| POST | `/tournaments/{id}/join` (增强) | ✅ 支持 PARTICIPANT/SPECTATOR |
| POST | `/tournaments/{id}/redeem` | ✅ 积分兑换 (校验积分+库存+状态) |
| GET | `/tournaments/{id}/redemptions` | ✅ 查询赛事兑换记录 |
| GET | `/tournaments/redemption/{redemptionId}` | ✅ 查询单个兑换 |
| POST | `/tournaments/{id}/prediction` | ✅ 竞猜预测 (锁定积分) |
| GET | `/tournaments/{id}/predictions` | ✅ 查询赛事预测 |
| POST | `/tournaments/{id}/vote` | ✅ 人气投票 (1票=1积分) |
| GET | `/tournaments/{id}/popularity` | ✅ 人气排行榜 |

### 4. 新增 Service 方法

| 方法 | 验收 |
|---|---|
| `redeem()` | ✅ 积分校验、库存校验、状态校验、积分扣减、记录创建 |
| `listRedemptions()` | ✅ 按赛事过滤 + 时间倒排 |
| `getRedemption()` | ✅ 按ID查询 |
| `joinTournament()` | ✅ SPECTATOR不占名额、PARTICIPANT走原有注册 |
| `placePrediction()` | ✅ 赛事状态校验、match归属校验、积分锁定 |
| `settlePredictions()` | ✅ 正确双倍返还、错误没收 |
| `getPredictions()` | ✅ 支持按 tournamentId/matchId/userId 过滤 |
| `castVote()` | ✅ 每票1积分扣减、不改变赛事结果 |
| `getPopularityRankings()` | ✅ 按总票数降序排列 |

### 5. CRUD 兼容

| 方法 | 新字段 |
|---|---|
| `createTournament()` | ✅ 增加 minParticipants/entryFee/prizePool |
| `updateTournament()` | ✅ 支持部分更新新字段 |
| `toTournamentContract()` | ✅ 输出包含新字段 |

## 圈梁验证

- `test.skip` / `test.only` 检查: ✅ 无
- TSC 编译: ✅ 0 errors
- 已有 412 个测试: ✅ 全部通过
- 不重写/replace 已有功能: ✅

## 关联引用

- BS-0143: 赛事兑换与增强加入
- BS-0144: 竞猜预测
- BS-0145: 人气投票

## 积分管理说明

当前使用独立的 `participantPointsStore`（in-memory Map），隔离于生产积分系统。后续对接可通过以下方式：

1. 替换 `getUserPoints` / `deductUserPoints` / `addUserPoints` 为实际积分服务调用
2. 替换 `prizeStockStore` 为数据库库存表
3. 替换 `triggerPrizeDispatch` 为消息队列异步分发
