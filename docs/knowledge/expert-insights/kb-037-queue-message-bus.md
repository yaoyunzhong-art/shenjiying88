# 消息队列与事件驱动

> 分类: 技术架构 | 标签: 消息队列, 事件驱动, RabbitMQ, Redis Streams | 适用: 后端架构师

## 概述

消息队列(MQ）和事件驱动架构是现代分布式系统中解耦服务、削峰填谷、异步处理的核心基础设施。在Shenjiying88系统中，从审计任务的创建、执行到报告生成的完整流程涉及多个服务间的协作：用户提交审计请求 → 审计引擎执行扫描 → 结果分析 → 报告生成 → 通知发送。如果采用同步调用链，整个流程的响应时间等于各个步骤的耗时之和，且任何一步故障都会阻塞整个链。

引入消息队列后，上述流程被拆分为一系列事件：`audit.requested` → `audit.completed` → `report.generated` → `notification.sent`。每个服务只关注自己感兴趣的事件，无需关心消费者的身份和状态。根据Confluent 2025年的技术报告，采用事件驱动架构的系统在吞吐量上提升了3-5倍，在组件变更时的代码影响范围减少了60-80%。

## 核心原则

- **原则1: 事件即事实记录(Event Sourcing思想）**: 事件不可变，一旦发布即为已发生的事实。Shenjiying88的审计事件包含完整的上下文信息(时间戳、发起者、审计参数、结果摘要），消费者根据事件重建视图而非依赖共享状态。
- **原则2: 至少一次送达与幂等消费**: 消息队列保证至少送达一次，但消费者必须实现幂等处理。同一事件被重复消费时不应产生副作用。Shenjiying88的消费者在处理前检查事件ID的Redis去重记录，已处理的事件直接ACK跳过。
- **原则3: 消息不过载，分批处理**: 单个消息体不超过256KB。超过限制的消息通过引用传递——消息中包含文件存储URL，消费者通过URL获取完整数据。Shenjiying88的审计详情(可能包含大量扫描结果）存储在MinIO中，事件体仅包含summary和下载链接。
- **原则4: 死信队列(Dead Letter Queue）兜底**: 处理失败的消息在重试3次后进入DLQ。运维监控DLQ中的消息数量，触发告警。DLQ中的消息可通过管理后台手动重新入队或丢弃。这是防止消息无限循环阻塞消费队列的关键机制。
- **原则5: 事件Schema演进兼容**: 使用Avro或JSON Schema管理事件结构。新增字段使用optional + 默认值，确保旧消费者仍能解析新格式的事件。Shenjiying88的Schema Registry维护所有事件类型的版本历史，新部署的消费者必须注册其所支持的事件版本范围。

## 实践案例（基于shenjiying88项目）

- **案例1: 审计任务事件流**: `audit.requested` → 审计引擎监听并开始执行 → `audit.completed` → Report Service监听并生成报告 → `report.generated` → Notification Service发送邮件/企微通知。每一步都是异步解耦的。当Report Service宕机时，事件在队列中积压，恢复后自动继续处理。Shenjiying88使用Redis Streams作为事件总线，支持消费者组(Consumer Group）实现负载均衡。

- **案例2: 事件溯源审计日志**: 所有核心业务操作生成事件并持久化到"事件存储表"。这个事件流就是不可篡改的审计日志，可用于合规审查和数据恢复。当需要重建某个审计任务的状态时，只需重放其相关的事件序列即可。这满足金融级别的审计追溯要求。

## 反模式警示

- **反模式1: 使用消息队列做RPC**: 同步等待MQ响应(类似HTTP请求-响应模式）违反了消息队列的设计初衷。MQ擅长"发后即忘"的异步通信，对于需要同步响应的场景应使用gRPC或REST。用MQ模拟RPC会导致复杂的临时队列管理、超时处理和服务熔断逻辑。

- **反模式2: 忽视背压(Backpressure）管理**: 当生产者速率远高于消费者速率时，队列无限增长最终导致OOM或被MQ主动丢弃。必须设置队列长度上限和降级策略——当队列积压超过阈值时，降低生产者的速率或丢弃低优先级消息。

## 参考文献

- Confluent (2025) "Event-Driven Architecture: Patterns and Anti-patterns"
- Martin Kleppmann (2017) "Designing Data-Intensive Applications" — 第10章分布式批处理
- RabbitMQ (2025) "Reliability Guide"
- Redis (2025) "Redis Streams Documentation"
