# 审计日志设计

> 分类: 安全 | 标签: 审计日志, 不可篡改, 合规, 事件溯源 | 适用: 安全工程师, 后端架构师

## 概述

审计日志(Audit Logging）记录了系统中所有重要的操作事件，为安全调查、合规审阅和问题回溯提供可靠的数据基础。审计日志不同于一般的应用日志——它关注的不是系统调试信息，而是"谁在什么时间对什么资源做了什么操作"。Shenjiying88系统作为审计自动化平台自身也需要被审计，日志记录必须满足合规审计的完整性、不可篡改性和可追溯性要求。

根据ISO 27001和SOC 2的审计要求，审计日志必须保留至少1年(具体取决于法规），需要确保日志的完整性(不能被恶意或意外修改），并且需要能够根据事件ID快速检索相关日志。Shenjiying88的审计日志系统基于事件溯源(Event Sourcing）思想设计，将每次关键操作记录为不可变事件。

## 核心原则

- **原则1: 审计日志与业务日志分离**: 审计日志存储在不同的数据存储(专用数据库表或单独的数据湖表）中，使用不同的访问权限。业务日志可被普通开发者查看(用于调试），审计日志仅允许安全团队和合规团队访问。Shenjiying88的审计日志表存储在独立的 `audit_log` 数据库中。
- **原则2: 不可篡改日志结构**: 每条审计日志包含：`id`(递增或UUID）、`timestamp`(UTC）、`actor_id`(操作用户ID）、`actor_type`(user/system）、`tenant_id`、`action`(create/update/delete/read/execute）、`resource_type`(audit/report/user/config）、`resource_id`、`old_value`(JSON，更新前的值）、`new_value`(JSON，更新后的值）、`ip_address`、`user_agent`、`correlation_id`(追踪ID）。Checksum字段用于验证日志未被篡改。
- **原则3: 谁(Who）- 什么(What）- 何时(When）- 何处(Where）- 为何(Why）**: 每条审计日志必须回答这五个W问题。`who` = actor_id + actor_type；`what` = action + resource；`when` = timestamp；`where` = ip_address + user_agent + source_service；`why` = 操作上下文(如"提交审计报告"的理由）。
- **原则4: 日志完整性校验**: 审计日志表使用"哈希链"(Hash Chain）结构——每条日志包含上一行日志的SHA-256哈希值。任何中间行的修改都会导致后续所有校验失败。Shenjiying88的定时任务每小时对审计日志表进行完整性验证，检测篡改行为。
- **原则5: 日志查询与分析能力**: 审计日志需要支持按用户、按时间段、按资源、按操作类型的联合查询。Shenjiying88的审计日志支持全文搜索和可视化分析——安全团队可以通过Grafana仪表盘查看异常操作模式(如短时间内大量DELETE操作）。

## 实践案例（based shenjiying88项目）

- **案例1: 审计任务操作审计**: 当用户创建、修改或删除审计任务时，系统自动记录审计日志。`api/v1/audits` 的每个变更操作(create/update/delete）在 `AuditService` 中通过 `auditLogService.log({ actor, action, resource, oldValue, newValue })` 记录。特别的是，审计任务的执行操作(run）也会被记录，包含执行参数和执行结果摘要。

- **案例2: 敏感数据访问审计**: 对于包含敏感信息的API端点(如查看客户PII数据的审计报告），每个访问请求都记录审计日志。这包括读取操作(read），不仅限于写操作(write/delete）。Shenjiying88的审计日志监控会触发告警：如果在短时间内(1小时内）大量读取同一客户的报告(>50次），触发"可疑数据访问行为"告警。

## 反模式警示

- **反模式1: 审计日志与应用日志混用**: 将审计信息输出到标准日志文件中与调试日志混在一起。日志文件可能被开发者误删、被日志轮转覆盖、或在排查问题时被忽略。审计日志必须与调试日志分离存储，且使用不同的保留策略。

- **反模式2: 忽略读取操作的审计**: 只记录修改操作(创建/更新/删除）的审计日志，忽略敏感数据的读取操作。对于金融和医疗行业，任何对PII/PHI的访问都需要记录。Shenjiying88对包含敏感信息的API端点执行"读取即审计"策略。

## 参考文献

- ISO 27001:2022 — Annex A: "Logging and Monitoring"
- SOC 2 Trust Services Criteria (2024) — "System Operations and Monitoring"
- OWASP (2024) "Logging Cheat Sheet"
