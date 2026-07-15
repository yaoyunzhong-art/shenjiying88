# 可观测性三支柱

> 分类: DevOps | 标签: 可观测性, Prometheus, Grafana, Jaeger, ELK | 适用: DevOps, SRE

## 概述

可观测性(Observability）是指通过系统外部输出了解其内部状态的能力。与传统监控(监控已知问题的指标）不同，可观测性允许工程师在遇到未知问题时也能快速定位根因。可观测性的三支柱——指标(Metrics）、日志(Logs）和链路追踪(Traces）——从不同维度提供系统运行状态的完整视图。Shenjiying88系统基于OpenTelemetry标准构建了统一的可观测性平台。

根据CNCF 2025年可观测性调查报告，采用三支柱完整方案的组织，平均故障排查时间(MTTR）缩短了65%，并且能在问题影响用户之前主动发现。Shenjiying88的Observability Stack包括：Prometheus(指标采集）+ Grafana(可视化仪表盘）+ ELK(日志聚合）+ Jaeger(分布式追踪）。三支柱的集成使得一次用户投诉可以从Grafana告警→ELK日志查询→Jaeger链路追踪的路径快速定位根因。

## 核心原则

- **原则1: 指标、日志、追踪关联统一ID**: 每个请求的 `traceId` 同时出现在指标标签(metric label）、日志条目(log field）和追踪跨度(trace span）中。Grafana面板上的一个异常数据点点击后可以直接跳转到关联的日志和追踪。Shenjiying88使用OpenTelemetry的 `traceparent` HTTP头在服务间传播此ID。
- **原则2: 四个黄金信号(Latency, Traffic, Errors, Saturation）**: Latency(响应时间P50/P95/P99）、Traffic(QPS/RPS）、Errors(HTTP 5xx率、业务异常率）、Saturation(CPU/内存/连接池使用率）。这四个指标构成了Shenjiying88每个微服务的"健康仪表盘"的核心面板。
- **原则3: RED方法(微服务监控）**: Rate(每秒请求数）、Errors(失败请求数/比例）、Duration(响应时间分布）。RED是Saturation的微服务版本，更适合服务粒度的监控。每个微服务的Prometheus指标包括 `http_requests_total`(Counter）、`http_requests_error_total`(Counter）、`http_request_duration_seconds`(Histogram）。
- **原则4: 分布式追踪采样策略**: 高流量服务(API网关、用户服务）使用头部采样(Head-based Sampling）：所有请求都创建trace，但只保留10%的完整trace(延迟较高的部分自动保留）。低流量服务使用尾部采样(Tail-based Sampling)。Shenjiying88的Jaeger配置了基于规则的采样：含有error的trace 100%保留，P99延迟以上的trace 50%保留，其他trace 10%保留。
- **原则5: 仪表盘层次结构**: 第一层: 服务级概览(每个服务的QPS、错误率、延迟）。第二层: 业务级仪表盘(审计任务完成率、新增租户数、报告生成时长）。第三层: 资源级仪表盘(CPU/Memory/磁盘/网络）。不同角色关注不同层次——SRE关注第一层和第三层，业务Owner关注第二层。

## 实践案例（基于shenjiying88项目）

- **案例1: Audit Service的Prometheus指标**: 自定义指标包括 `audit_tasks_created_total`(Counter）、`audit_tasks_completed_total`(Counter）、`audit_task_duration_seconds`(Histogram）、`audit_tasks_running`(Gauge）。Grafana面板展示审计任务的创建速率、完成速率、平均执行时长和当前运行中的任务数。配置了告警规则：当 `audit_tasks_running` 超过阈值(如50）时告警。

- **案例2: 跨服务追踪审计任务链路**: 使用OpenTelemetry SDK在NestJS中自动创建span。一个审计任务的链路包含 `POST /api/audits → AuditService.createAudit() → AuditRuleService.validateRules() → EventBus.publish() → [Audit Engine] → ReportService.generateReport() → NotificationService.sendNotification()`。每个span记录该步骤的耗时和参数。Jaeger UI可以查看完整链路和每个步骤的耗时占比。

## 反模式警示

- **反模式1: 只做指标不做追踪**: 安装Prometheus后就不管了，认为有指标就够了。指标告诉你"哪里慢了"，但追踪才能告诉你"为什么慢了"。一个P99 2秒的API，指标只能告诉你延迟高，追踪可以告诉你80%的时间花在了数据库查询上。

- **反模式2: 日志级别一刀切**: 所有服务使用相同的日志级别和配置。不同服务对日志的需求不同——审计服务需要更详细的操作日志(用于合规审计），而配置服务日志可以简化。Shenjiying88的每个微服务可以独立配置日志级别，通过配置中心动态调整。

## 参考文献

- CNCF (2025) "Observability Survey Report 2025"
- OpenTelemetry Documentation (2025) "Best Practices"
- Google SRE Book — Chapter 6: "Monitoring Distributed Systems"
- Prometheus (2025) "Best Practices"
