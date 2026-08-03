# ✅ 模块验收文档: 自动回滚引擎

> 模块: apps/api/src/modules/auto-rollback
> 需求编号: Phase-19 T27 | 智能运维
> 最后更新: 2026-07-29

## 功能清单 (Feature List)

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| 1 | 触发回滚 | 异常检测触发自动回滚流程 | ✅ |
| 2 | CRITICAL 级别二次确认 | 严重异常需手动确认才执行 | ✅ |
| 3 | WARNING 级别自动执行 | 低严重度走自动模式 | ✅ |
| 4 | 回滚确认 | 手动确认执行回滚 | ✅ |
| 5 | 回滚取消 | 任何阶段可手动取消 | ✅ |
| 6 | 自动超时取消 | 确认超时自动取消 | ✅ |
| 7 | 快照创建（DB/REDIS/CONFIG/FULL） | 回滚前创建状态快照 | ✅ |
| 8 | 回滚执行（模拟） | 从快照还原状态 | ✅ |
| 9 | 回滚验证 | 验证异常指标是否恢复 | ✅ |
| 10 | 回滚记录列表/筛选 | 按状态/指标查询 | ✅ |
| 11 | 回滚记录详情 | 单条记录全生命周期 | ✅ |
| 12 | 快照详情查询 | 查看快照元数据 | ✅ |
| 13 | 引擎动态配置 | 运行时调整阈值/超时/并发 | ✅ |
| 14 | 引擎状态查询 | 活跃回滚数/配置/运行状态 | ✅ |
| 15 | 并发限制 | 最大并发控制 | ✅ |

## 接口验收 (API Acceptance)

所有接口前缀: `/auto-rollback`
认证: `@UseGuards(TenantGuard)` — 所有端点需携带租户上下文
校验: `@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))`

### POST `/trigger` — 触发回滚

- **功能**: 异常检测模块调用，创建回滚记录并启动状态机
- **请求体** (JSON):
  ```json
  {
    "reason": "anomaly score 0.95 on /api/coupons P95",
    "severity": "WARNING|CRITICAL",
    "metricKey": "api.coupons.p95",
    "anomalyValue": 2850,
    "baselineValue": 1200,
    "snapshotKind": "DB|REDIS|CONFIG|FULL",
    "trigger": "auto-detection|manual"
  }
  ```
- **响应** `200 OK`:
  ```json
  {
    "data": {
      "id": "rollback-uuid",
      "reason": "anomaly score 0.95 on /api/coupons P95",
      "severity": "CRITICAL",
      "metricKey": "api.coupons.p95",
      "anomalyValue": 2850,
      "baselineValue": 1200,
      "status": "AWAITING_CONFIRM",
      "snapshotId": null,
      "requiresConfirmation": true,
      "confirmationDelayMs": 30000,
      "history": [{ "status": "AWAITING_CONFIRM", "timestamp": "...", "note": "Triggered: ..." }],
      "createdAt": "..."
    }
  }
  ```

### POST `/confirm` — 回滚确认

- **功能**: 手动确认执行 CRITICAL 级别回滚
- **请求体**: `{ "id": "rollback-uuid" }`
- **响应** `200 OK`: `{ "data": RollbackRecordDto }` (status → PENDING 并开始执行)
- **错误**: id 不存在返回 `{ "data": null }`

### POST `/cancel` — 回滚取消

- **功能**: 任何阶段手动取消回滚
- **请求体**: `{ "id": "rollback-uuid", "reason": "false alarm" }`
- **响应** `200 OK`: `{ "data": RollbackRecordDto }` (status → CANCELLED)
- **错误**: id 不存在返回 `{ "data": null }`

### GET `/records` — 回滚记录列表

- **查询参数** (可选):
  - `status`: "PENDING|AWAITING_CONFIRM|SNAPSHOTTING|ROLLING_BACK|VERIFYING|COMPLETED|FAILED|CANCELLED"
  - `metricKey`: 按指标键筛选
- **响应** `200 OK`:
  ```json
  { "data": [RollbackRecordDto, ...] }
  ```
- 结果按 createdAt 倒序排列

### GET `/records/:id` — 回滚记录详情

- **请求参数**: `id` (路径参数)
- **响应** `200 OK`: `{ "data": RollbackRecordDto | null }`

### GET `/snapshots/:id` — 快照详情

- **请求参数**: `id` (路径参数)
- **响应** `200 OK`:
  ```json
  {
    "data": {
      "id": "snap-uuid",
      "kind": "FULL",
      "size": 567,
      "createdAt": "...",
      "trigger": "anomaly score 0.95 on /api/coupons P95"
    } | null
  }
  ```

### POST `/configure` — 引擎配置更新

- **功能**: 运行时调整自动回滚引擎参数
- **请求体** (JSON):
  ```json
  {
    "criticalRequiresConfirm": true,
    "confirmationDelayMs": 30000,
    "autoTimeoutMs": 300000,
    "maxConcurrent": 3,
    "snapshotRetentionMs": 604800000
  }
  ```
- **响应** `200 OK`:
  ```json
  { "status": "ok", "applied": ["criticalRequiresConfirm", "maxConcurrent"] }
  ```

### GET `/status` — 引擎状态查询

- **响应** `200 OK`:
  ```json
  {
    "data": {
      "engineName": "AutoRollback",
      "activeRecords": 2,
      "config": {
        "criticalRequiresConfirm": true,
        "maxConcurrent": 3
      },
      "status": "ACTIVE|DEGRADED|STOPPED",
      "lastEvaluationAt": "2026-07-29T00:00:00.000Z"
    }
  }
  ```

## 验收标准 (Acceptance Criteria)

### 触发与状态机

1. **GIVEN** anomaly 检测到 CRITICAL 异常
   **WHEN** 调用 `POST /trigger` 传入 severity=CRITICAL
   **THEN** 返回的记录 status='AWAITING_CONFIRM'，requiresConfirmation=true

2. **GIVEN** anomaly 检测到 WARNING 异常
   **WHEN** 调用 `POST /trigger` 传入 severity=WARNING
   **THEN** 返回的记录 status='PENDING'，requiresConfirmation=false

3. **GIVEN** CRITICAL 级别回滚进入 AWAITING_CONFIRM
   **WHEN** 执行 `executeRollbackSync` 跳过确认直接执行
   **THEN** 状态机按 SNAPSHOTTING → ROLLING_BACK → VERIFYING → COMPLETED/FAILED 流转

4. **GIVEN** anomalyValue=100, baselineValue=100(无偏差)
   **WHEN** 执行回滚验证
   **THEN** verifyRollback 返回 true，最终 status='COMPLETED'

5. **GIVEN** anomalyValue=500, baselineValue=100(偏差超过20%)
   **WHEN** 执行回滚验证
   **THEN** verifyRollback 返回 false，最终 status='FAILED'

### 二次确认与取消

6. **GIVEN** 回滚处于 AWAITING_CONFIRM 状态
   **WHEN** 调用 `POST /confirm` 传入正确 id
   **THEN** 确认成功，清除自动取消定时器，执行回滚

7. **GIVEN** 回滚处于 AWAITING_CONFIRM 状态
   **WHEN** 调用 `POST /cancel` 传入正确 id
   **THEN** 状态变为 CANCELLED，清除定时器

8. **GIVEN** 回滚处于 COMPLETED 状态
   **WHEN** 调用 `POST /cancel`
   **THEN** 状态不变，仍为 COMPLETED

9. **GIVEN** CRITICAL 回滚未被确认且超时
   **WHEN** 超过 confirmationDelayMs 时间
   **THEN** 记录自动被标记为 CANCELLED（auto-cancelled）

10. **GIVEN** 不存在的回滚 id
    **WHEN** 调用 `POST /confirm` 或 `POST /cancel`
    **THEN** 返回 `{ data: null }`

### 查询

11. **GIVEN** 系统中有10条回滚记录(7条COMPLETED, 3条FAILED)
    **WHEN** 调用 `GET /records?status=FAILED`
    **THEN** 仅返回3条 FAILED 记录

12. **GIVEN** 系统中有5条回滚记录，涉及2种 metricKey
    **WHEN** 调用 `GET /records?metricKey=api.coupons.p95`
    **THEN** 仅返回该 metricKey 相关的记录

13. **GIVEN** 某回滚记录正在执行
    **WHEN** 调用 `GET /records/:id`
    **THEN** 返回完整历史，包含每一步的状态变更记录

14. **GIVEN** 回滚执行创建了快照
    **WHEN** 调用 `GET /snapshots/:id`
    **THEN** 返回快照的 kind、size、createdAt 等元数据

### 配置

15. **GIVEN** 需要调整引擎配置
    **WHEN** 调用 `POST /configure` 只传入 maxConcurrent=5
    **THEN** 返回 `{ status: "ok", applied: ["maxConcurrent"] }`，仅该字段生效

16. **GIVEN** 配置变更后
    **WHEN** 调用 `GET /status`
    **THEN** 返回的 config 中 maxConcurrent=5

### 引擎状态

17. **GIVEN** 系统正常运行
    **WHEN** 调用 `GET /status`
    **THEN** 返回 engineName="AutoRollback"，status="ACTIVE"

18. **GIVEN** 系统有2个活跃回滚记录(非终态)
    **WHEN** 调用 `GET /status`
    **THEN** data.activeRecords = 2

19. **GIVEN** 修复已完成无异常
    **WHEN** 调用 `GET /status`
    **THEN** 返回 lastEvaluationAt 为最近时间

### 异常场景

20. **GIVEN** DTO 校验未通过
    **WHEN** 调用 `POST /trigger` 缺少必要字段(如 reason 为空)
    **THEN** ValidationPipe 抛出 400 Bad Request

## 测试覆盖要求 (Coverage Requirements)

| 项目 | 要求 | 当前 |
|------|------|------|
| 测试文件数 | ≥10 | 15 ✅ |
| 测试断言总数 | ≥300 | 342 ✅ |
| Controller 有 AuthGuard | 是 | ✅ |
| DTO ValidationPipe | 是 | ✅ |
| TSC 零错误 | 是 | ✅ |
| 零 skip/only | 是 | ✅ |
| 状态机全路径覆盖 | 7个状态全部验证 | ✅ |
| 并发限制测试 | 有 | ✅ |
| 快照生命周期测试 | 有 | ✅ |

### 核心测试覆盖

- **Service**: `auto-rollback.service.spec.ts` / `auto-rollback.service.test.ts` ✅
- **Controller**: `auto-rollback.controller.spec.ts` / `auto-rollback.controller.test.ts` ✅
- **DTO**: `auto-rollback.dto.test.ts` ✅
- **Entity**: `auto-rollback.entity.test.ts` ✅
- **Contract**: `auto-rollback.contract.test.ts` ✅
- **E2E**: `auto-rollback.e2e.test.ts` / `auto-rollback.e2e.enhanced.test.ts` ✅
- **Simulator**: `auto-rollback.simulator.test.ts` ✅

### 建议补充测试

- `maxConcurrent` 并发限制实际达到上限时的行为
- snapshot retention 真实清理
- 引擎 DEGRADED/STOPPED 状态的切换逻辑

---

> ⭕ **圈梁五道箍** | 2026-07-29 | V23 ✅ 代码 ✅ 测试 ✅ 文档 ✅ 验收 ✅ 部署
