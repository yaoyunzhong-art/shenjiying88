# 日志记录最佳实践

> 分类: 开发实践 | 标签: 日志, Winston, 结构化日志, 可观测性 | 适用: 后端开发

## 概述

日志是系统运行时最宝贵的信息来源——在排查问题时，开发者90%以上的时间都在阅读日志。高质量的日志记录可以使故障排查时间从小时级缩短到分钟级。Shenjiying88系统使用Winston作为日志框架，采用结构化日志(Structured Logging）格式，将所有日志以JSON格式输出到stdout并由容器运行时收集到ELK集群。这一设计使得日志可以被Logstash自动解析、被Elasticsearch索引和全文搜索。

根据Elastic的实践报告，结构化日志相比文本日志在故障排查效率上提升约3-4倍。一个关键原因是：结构化日志中的 `tenant_id`, `transaction_id`, `error_code` 等字段可以被直接索引和过滤，而文本日志只能依靠正则表达式匹配。Shenjiying88的日志策略定义了四个日志级别(ERROR、WARN、INFO、DEBUG）、统一的结构化字段集合和每层日志记录的最小颗粒度。

## 核心原则

- **原则1: 结构化日志JSON格式**: 所有日志条目以JSON格式输出，包含固定字段集：`timestamp`(ISO8601 UTC）、`level`、`message`、`logger`(模块名）、`tenantId`、`userId`、`transactionId`、`requestPath`、`durationMs`(API响应耗时）、`service`(服务名）。这些字段使得ELK可以高效索引和聚合。
- **原则2: ERROR记录异常，WARN记录异常行为，INFO记录正常流程**: ERROR：未预期的异常，需要人工介入排查。WARN：预期之外但系统自动恢复的场景(如重试成功、熔断器打开后恢复）。INFO：关键业务事件(审计任务创建、完成、报告生成）。DEBUG：详细的执行流程信息，仅开发环境开启。
- **原则3: 日志中不包含敏感信息**: 密码、Token、SSN、信用卡号等敏感信息决不记录到日志。Shenjiying88的Logger包装(Winston Transport）在写入前过滤掉配置的敏感字段模式。如果API请求体或响应体可能包含敏感数据，使用 `[REDACTED]` 代替。
- **原则4: 每层职责不同**: Controller层记录请求入口和响应(INFO级，包含请求路径和状态码）、Service层记录业务事件(INFO级，包含业务关键参数）、Repository层记录SQL查询和耗时(DEBUG级）。ERROR级日志可以出现在任何层。Shenjiying88的Logger实例通过DI注入，每个Service在构造函数中获取Logger。
- **原则5: 日志轮转和保留策略**: 本地开发日志保留7天，staging环境保留30天，生产环境保留180天(符合审计需求）。日志文件轮转按大小(100MB）和时间(每天）双重触发。使用LogRotate配置自动压缩和清理。生产环境的日志不允许本地持久化，直接输出到stdout由容器运行时(Docker log driver）管理。

## 实践案例（基于shenjiying88项目）

- **案例1: AuditService的日志策略**: `createAudit()` 在INFO级记录 `{ action: 'create_audit', status: 'started', params: { name: ... } }`。完成时记录 `{ action: 'create_audit', status: 'success', auditId: ..., durationMs: ... }`。失败时记录 `{ action: 'create_audit', status: 'error', error: ..., stack: ... }`(ERROR级）。这种"开始-完成/失败"的日志对可以帮助追踪每个业务操作的完整生命周期。

- **案例2: 请求日志中间件**: NestJS全局中间件在每个请求进入时生成 `transactionId`(UUID），记录INFO级入口日志(包含method、path、query、headers(User-Agent, Referer））。响应完成时记录出口日志(包含statusCode、durationMs）。异常时记录ERROR级日志(包含完整的error和stack）。所有日志都携带相同的transactionId用于追踪。

## 反模式警示

- **反模式1: 日志级别使用不当**: 将业务异常使用ERROR级别记录(如"用户不存在"返回404，这不是ERROR而是正常业务流程），或将系统级故障使用INFO级别记录(如数据库连接失败，这是需要紧急处理的ERROR）。Shenjiying88要求：4xx错误使用WARN级别，5xx错误使用ERROR级别。

- **反模式2: 过度记录DEBUG日志到生产环境**: 生产环境开启DEBUG级别日志会导致单次请求产生数万行日志，对磁盘I/O和Elasticsearch存储造成巨大压力。DEBUG日志仅应在特定问题排查时临时开启，且必须通过动态配置控制而非修改配置文件重启服务。

## 参考文献

- Winston Documentation (2025) "Logger Best Practices"
- Elastic (2024) "Structured Logging Best Practices"
- 12 Factor App (2024) "Logs" — 12factor.net/logs
