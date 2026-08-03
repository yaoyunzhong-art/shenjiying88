# E54 审计底座专项实施方案

## 1. 文档定位

本文件是 `54名行业与技术专家联合审计与规划方案 v2` 的配套专项文档，专门负责以下能力的建设与验收：

- 审计事件模型
- `trace_id` 全链路贯通
- `EventStore` 持久化与双写迁移
- 哈希链与防篡改
- 不可变快照
- 审计留存、归档、查询、回放、举证
- 审计专项 hard gate 与上线门禁

本文件不负责 54 名专家总控编组与全局流程管理；相关内容以 [expert54-full-process-audit-plan.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/expert54-full-process-audit-plan.md) 为准。

## 2. 背景与目标

### 2.1 E54 专家要求

根据 E54 专家意见，当前审计底座必须满足以下硬要求：

1. 审计日志哈希链防篡改
2. `EventStore` 持久化，支持事件溯源
3. 财务类事件实现不可否认记录
4. 审计日志支持 10 年留存策略
5. 所有写操作必须产生日志
6. 审计日志必须携带 `trace_id`
7. 审计日志存储必须与业务数据库物理分离

### 2.2 本专项目标

本专项不追求“一次性全量重构”，而是采用“兼容现状、分阶段迁移、双写验证、硬门禁验收”的方式，实现以下目标态：

1. 所有高危写操作具备统一审计事件
2. 关键链路 `trace_id` 贯通到请求、业务事件、审计记录、查询与回放
3. 审计日志与事件存储从内存实现迁移到持久化存储
4. 哈希链与不可变快照形成可验证的防篡改闭环
5. 财务、权限、治理、开放平台等高风险域具备取证与回放能力

## 3. 当前现状基线

### 3.1 已有能力

1. `AuditService` 已具备：
   - 审计事件类型
   - 风险分级
   - `traceId` / `parentSpanId`
   - 多租户字段
   - 查询、分页、导出与合规报告能力
2. `RequestAuditInterceptor` 已能对非 GET HTTP 请求自动写入请求审计
3. `Request Context Middleware` 已支持从 `traceparent` 中提取 `traceId`
4. `HashChainService` 已具备基础 SHA-256 哈希链实现和完整性校验
5. `EventBufferService + EventStoreService` 已存在 dual-write 雏形
6. `EventStoreService` 已预留 Postgres 演进接口

### 3.2 已知缺口

1. `AuditService` 当前仍以内存 `Map` 存储审计日志，不满足生产要求
2. `HashChainService` 当前仍是内存链，缺少持久化链头快照与独立不可变存储
3. `RequestAuditInterceptor` 目前只做通用请求记录，尚未统一到领域级“写操作事件模型”
4. `traceId` 已能从请求头提取，但尚未形成贯穿控制器、服务、审计、回放、导出、查询的统一规范
5. `EventStoreService` 目前仍是内存实现，`Postgres + LISTEN/NOTIFY + RLS` 尚未落地
6. 审计日志、事件日志、哈希链、快照还没有形成统一存储拓扑和保留策略
7. 审计查询、回放、举证与恢复演练尚未形成正式门禁

## 4. 现状证据

### 4.1 审计服务现状

- [audit.service.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/audit/audit.service.ts)
  - 审计日志当前落在 `Map<string, AuditLog>`
  - 已包含 `traceId`、`tenantId`、PII 字段、风险等级等

### 4.2 请求审计现状

- [request-audit.interceptor.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/common/interceptors/request-audit.interceptor.ts)
  - 目前默认只审计非 GET 请求
  - 自动记录 method、statusCode、latency、tenantId 等

### 4.3 哈希链现状

- [chain-audit.service.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/chain/chain-audit.service.ts)
  - `HashChainService` 已具备链记录、校验、Merkle 树基础能力
  - 当前仍为内存实现

### 4.4 traceId 现状

- [request-context.middleware.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/observability/logger/request-context.middleware.ts)
  - 已支持从 `traceparent` 中提取 32 位 `traceId`
  - 已回写 `x-request-id`

### 4.5 EventStore 现状

- [event-store.service.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/agent/event-store.service.ts)
  - 已定义向 Postgres 演进的接口目标
  - 当前仍为 in-memory 兼容实现
- [event-buffer.service.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/agent/event-buffer.service.ts)
  - 已存在 dual-write 逻辑，内存写为主，EventStore fire-and-forget

## 5. 目标架构

### 5.1 总体原则

目标态采用“四层审计底座”：

1. 请求上下文层
   - 统一生成或继承 `requestId` / `traceId`
   - 注入 tenant / brand / store / actor 基础上下文
2. 审计事件层
   - 所有高危写操作输出标准化领域审计事件
   - 区分请求审计、领域审计、财务审计、治理审计、开放平台审计
3. 持久化与防篡改层
   - 审计日志写入独立审计存储
   - 事件写入 `EventStore`
   - 哈希链与不可变快照单独保存
4. 查询与举证层
   - 多维查询
   - 链完整性验证
   - 时间点回放
   - 快照比对
   - 证据导出

### 5.2 存储拓扑

目标存储拓扑如下：

1. 业务数据库
   - 仍保存业务主数据
   - 不承担最终审计存储职责
2. 审计数据库
   - 独立物理实例或独立集群
   - 保存审计日志、审计索引、查询投影
3. EventStore
   - 保存领域事件流
   - 支持会话、链路、聚合根历史追溯
4. 不可变快照存储
   - 保存每日链头快照、签名、校验摘要
   - 只允许追加，不允许覆盖

### 5.3 trace_id 贯通模型

目标态必须保证以下对象共享同一 `trace_id`：

1. 入站请求
2. 控制器写操作
3. 服务层领域事件
4. 审计日志
5. EventStore 事件
6. 导出记录
7. 回放记录
8. 告警与异常恢复记录

## 6. 审计事件模型

### 6.1 统一字段

所有高危审计事件至少必须包含：

- `eventId`
- `eventType`
- `traceId`
- `requestId`
- `tenantId`
- `brandId`
- `storeId`
- `actorId`
- `actorType`
- `resourceType`
- `resourceId`
- `action`
- `beforeState`
- `afterState`
- `riskLevel`
- `occurredAt`
- `source`
- `complianceTags`

### 6.2 事件分层

1. 请求级事件
   - 例如 `api.request.write`
2. 领域级事件
   - 例如 `order.created`、`payment.refunded`
3. 财务级事件
   - 例如 `settlement.approved`、`invoice.generated`
4. 治理级事件
   - 例如 `admin.config_change`、`admin.user_impersonate`
5. 开放平台级事件
   - 例如 API Key、Webhook、网关配额、签名验证

### 6.3 财务事件额外要求

财务类事件必须额外记录：

- 金额
- 币种
- 账户或结算主体
- 审批人
- 前状态与后状态
- 关联交易号
- 链记录 ID
- 导出或取证单号

## 7. 哈希链与不可变快照

### 7.1 哈希链策略

每条审计日志写入时，计算：

```text
hash = SHA256(prev_hash + canonical_payload + timestamp + trace_id)
```

要求：

1. 使用规范化 payload
2. 链记录单调递增
3. 每条记录保留 `previousHash` 与 `hash`
4. 链校验失败必须触发高优告警

### 7.2 快照策略

1. 每日生成链头快照
2. 快照包含：
   - 日期
   - 链尾 hash
   - 当日记录数
   - 校验摘要
   - 签名信息
3. 快照写入独立不可变存储
4. 快照生成失败视为 P0 风险

### 7.3 篡改检测

每次回放、导出、举证时必须支持：

1. 重新计算局部链
2. 对比链头快照
3. 输出校验结论
4. 如检测到断裂，生成审计告警和阻断项

## 8. EventStore 与双写迁移

### 8.1 当前策略

当前仓内已有内存 `EventBuffer -> EventStore` dual-write 雏形，可作为迁移起点。

### 8.2 目标策略

分三步迁移：

1. `Phase A`
   - 保持现有业务路径
   - 先把高危写操作统一输出事件
   - 建立审计与 EventStore 的事件映射表
2. `Phase B`
   - 业务写 -> 内存 / 业务存储 + EventStore 双写
   - 补一致性校验和失败补偿
3. `Phase C`
   - EventStore 持久化切换到 Postgres
   - 开启 `LISTEN/NOTIFY`
   - 接入租户隔离与查询投影

### 8.3 双写原则

1. 主流程优先保证业务成功
2. 审计写入失败不可静默吞掉，必须有告警与重试策略
3. 双写一致性必须可校验
4. 关键财务与治理链路不得长期停留在“只内存”模式

## 9. 留存、归档、查询、回放

### 9.1 留存策略

1. 财务与审计核心记录默认 10 年留存
2. 一般请求审计按风险与合规标签分级留存
3. 高风险事件不可被普通清理任务删除

### 9.2 归档策略

1. 热数据保留在审计数据库
2. 温数据归档到低成本存储
3. 冷数据仍必须支持受控取回与验证

### 9.3 查询策略

查询至少支持：

- 按 `traceId`
- 按 actor
- 按 tenant
- 按 resource
- 按风险等级
- 按事件类型
- 按时间范围
- 按链完整性状态

### 9.4 回放与举证

必须支持：

1. 按 `traceId` 重建关键链路
2. 按实体或交易重建时间线
3. 生成附带链校验结果的导出包
4. 抽样执行恢复演练并留存证据

## 10. 迁移里程碑

### M1：模型冻结

- 冻结审计事件统一字段
- 冻结高危写操作事件清单
- 冻结 `traceId` 贯通规范

### M2：高危写操作接入

- 财务、权限、治理、开放平台高危写操作全部接入审计事件
- 完成 `metadata + diagnostics + 定向回归`

### M3：EventStore 双写验证

- 完成关键领域双写
- 完成一致性对账
- 完成失败补偿策略

### M4：哈希链与快照

- 链记录持久化
- 每日快照生成
- 快照校验与告警上线

### M5：查询、回放、举证

- 支持按 `traceId` 查询
- 支持链校验导出
- 完成回放与恢复演练

### M6：上线门禁

- 满足所有 E54 hard gate
- 完成风险矩阵复核
- 完成管理层复签

## 11. Hard Gate

以下条目为本专项上线硬门禁：

1. 所有高危写操作必须具备审计事件定义
2. `traceId` 必须从请求贯通到审计记录
3. 审计日志不得只停留在内存 `Map`
4. EventStore 不得长期仅依赖内存模式承担生产审计职责
5. 哈希链必须可验证，快照必须可追溯
6. 快照必须写入独立不可变存储
7. 财务链路必须支持不可否认导出
8. 回放与恢复演练必须至少完成抽样验证
9. 审计专项结论必须附 `A 级` 证据

## 12. 风险矩阵

### 12.1 Map 内存丢失

- 触发条件：进程重启或实例迁移导致日志丢失
- 指标：仅内存事件占比
- 责任人：后端负责人
- 处置：加速持久化迁移，阻断高风险域上线

### 12.2 双写不一致

- 触发条件：业务成功但审计写入失败
- 指标：双写失败率、补偿队列积压
- 责任人：审计专项负责人
- 处置：重试、补偿、对账、告警

### 12.3 traceId 断裂

- 触发条件：链路中任一节点缺失 `traceId`
- 指标：`traceId` 贯通率
- 责任人：平台负责人
- 处置：阻断对应链路验收

### 12.4 链断裂或快照失败

- 触发条件：哈希校验失败或快照未生成
- 指标：链校验失败次数、快照失败次数
- 责任人：安全负责人
- 处置：高优告警、停止结论出具、保全现场

### 12.5 跨租户串读

- 触发条件：租户 A 可读到租户 B 审计数据
- 指标：隔离校验失败数
- 责任人：多租户负责人
- 处置：立即阻断查询与导出

## 13. 验收标准

### 13.1 最低验收

1. 专项文档冻结
2. 事件模型冻结
3. 高危域接入审计
4. `traceId` 贯通可验证
5. 持久化路径不再只依赖内存

### 13.2 完整验收

1. 高危写操作审计覆盖率达到 100%
2. `traceId` 贯通率达到 100%
3. 哈希链校验与快照验证通过
4. 财务审计导出与举证通过抽样
5. 回放与恢复演练通过
6. 专项风险矩阵全部复核完成

## 14. 下一步执行建议

1. 先输出《高危写操作审计事件清单》
2. 再输出《traceId 贯通规范》
3. 然后完成《EventStore 双写迁移表》
4. 再落《快照与不可变存储方案》
5. 最后按高危域分批接入与验证

## 15. 证据来源

- E54 专家意见：
  - `experts/E54-xu-audit-chain.md`
- 审计服务：
  - `apps/api/src/modules/audit/audit.service.ts`
- 请求审计：
  - `apps/api/src/common/interceptors/request-audit.interceptor.ts`
- trace 上下文：
  - `apps/api/src/modules/observability/logger/request-context.middleware.ts`
- 哈希链：
  - `apps/api/src/modules/chain/chain-audit.service.ts`
- EventStore：
  - `apps/api/src/modules/agent/event-store.service.ts`
  - `apps/api/src/modules/agent/event-buffer.service.ts`
