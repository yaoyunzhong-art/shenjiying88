# WP-10B 赛事与玩法增强 — PRD

> 版本: v1.0 | 状态: 完成 | 关联: [BS-0143, BS-0144, BS-0145]

## 1. 概述

在 WP-10A 积分盲盒 P0 的基础上，对 tournament 模块进行玩法增强，引入赛事兑换、竞猜预测、人气投票三种辅助玩法，扩展赛事的社交与变现能力。

### 1.1 目标

- 提供用户在赛事期间用积分兑换实物/虚拟奖品的完整流程
- 引入竞猜预测机制提升观赛参与度
- 引入人气投票机制增强粉丝互动
- 扩展 Tournament entity 字段以支撑新玩法（minParticipants, entryFee, prizePool）

### 1.2 涉及模块

- `tournament.entity.ts` — 实体类型定义
- `tournament.dto.ts` — DTO 定义
- `tournament.service.ts` — 业务逻辑
- `tournament.controller.ts` — HTTP 端点
- `tournament.contract.ts` — 跨模块合约

---

## 2. 功能规格

### 2.1 赛事兑换（BS-0143）

#### 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/tournaments/{id}/redeem` | 积分兑换奖品 |
| GET | `/tournaments/{id}/redemptions` | 查询赛事所有兑换记录 |
| GET | `/tournaments/redemption/{redemptionId}` | 查询单条兑换记录 |

#### 兑换请求体

```json
{
  "userId": "string",
  "prizeId": "string",
  "points": 100
}
```

#### 兑换响应

```json
{
  "success": true,
  "redemptionId": "redemption-xxx",
  "remainingPoints": 900,
  "estimatedDelivery": "2026-07-26T23:18:00.000Z"
}
```

#### 验证规则

1. 用户积分 ≥ 请求的 points
2. 奖品库存 > 0（通过 `setPrizeStock` 预配）
3. 赛事状态必须为 `ONGOING`

#### 流程

1. 扣减用户积分
2. 扣减奖品库存
3. 创建 `RedemptionRecord`（状态 `PENDING`）
4. 异步触发奖品发放（当前为桩，后续接入消息队列）
5. 返回兑换结果

---

### 2.2 竞猜预测（BS-0144）

#### 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/tournaments/{id}/prediction` | 提交竞猜预测 |
| GET | `/tournaments/{id}/predictions` | 查询赛事下所有预测 |

#### 预测请求体

```json
{
  "userId": "string",
  "matchId": "string",
  "prediction": "mem-001",
  "stake": 50
}
```

#### 验证规则

1. 赛事状态必须为 `ONGOING`
2. matchId 属于该赛事
3. 用户积分 ≥ stake
4. 预测即锁定 stake 积分

#### 结算流程

- `settlePredictions(matchId, winnerPrediction, tenantId)` — 由内部调用
- 正确的预测：双倍返还（stake × 2）
- 错误的预测：stake 没收

---

### 2.3 人气投票（BS-0145）

#### 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/tournaments/{id}/vote` | 提交人气投票 |
| GET | `/tournaments/{id}/popularity` | 查询人气排行榜 |

#### 投票请求体

```json
{
  "userId": "string",
  "contestantId": "string",
  "votes": 10
}
```

#### 验证规则

1. 赛事状态必须为 `ONGOING`
2. 每票消耗 1 积分（N 票 = N 积分）
3. 不影响赛事结果，仅产生人气榜单

---

### 2.4 增强加入（BS-0143）

#### 增强 POST /tournaments/{id}/join

```json
{
  "userId": "string",
  "joinType": "PARTICIPANT | SPECTATOR"
}
```

- `PARTICIPANT`: 走原有注册流程（创建 ranking 记录）
- `SPECTATOR`: 仅标记加入，不占参赛名额

---

### 2.5 实体字段扩展

在 `Tournament` 接口新增加字段：

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `minParticipants` | number | 2 | 最小参赛人数 |
| `entryFee` | number | 0 | 参赛费用（积分） |
| `prizePool` | number | 0 | 总奖池（积分） |

---

## 3. 新增类型

### 3.1 RedemptionRecord

```typescript
interface RedemptionRecord {
  id: string
  tournamentId: string
  userId: string
  prizeId: string
  prizeLabel: string
  pointsCost: number
  status: RedemptionStatus  // PENDING | COMPLETED | FAILED
  estimatedDelivery: string
  createdAt: string
  updatedAt: string
}
```

### 3.2 PredictionRecord

```typescript
interface PredictionRecord {
  id: string
  tournamentId: string
  matchId: string
  userId: string
  prediction: string
  stake: number
  status: PredictionStatus  // LOCKED | WON | LOST
  createdAt: string
  updatedAt: string
}
```

### 3.3 VoteRecord

```typescript
interface VoteRecord {
  id: string
  tournamentId: string
  contestantId: string
  userId: string
  votes: number
  createdAt: string
}
```

---

## 4. 数据流

```
User → [Redeem] → Service.redeem() → deductPoints + checkStock → create RedemptionRecord → async dispatch
User → [Prediction] → Service.placePrediction() → lockStake → create PredictionRecord → settle on match complete
User → [Vote] → Service.castVote() → deductPoints(1/vote) → create VoteRecord → popularity ranking
User → [Join] → Service.joinTournament() → Participant(default) | Spectator
```

---

## 5. 未完成项

- 奖品发放异步队列（当前为桩函数 `triggerPrizeDispatch`）
- 预测结算自动触发（当前通过 `settlePredictions` 手动调用）
- 积分来源对接现有用户积分系统（当前使用独立 `participantPointsStore`）

---

## 6. 参考

- WP-10A: 积分盲盒 P0 (commit b586506b8)
- 圈梁: 17 测试文件全通过, 412 tests, TSC 零错误
