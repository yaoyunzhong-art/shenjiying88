# 限流策略全景

> 分类: 技术架构 | 标签: 限流, 速率限制, 过载保护, 稳定性 | 适用: 后端架构师

## 概述

限流(Rate Limiting）是保护系统免受过载和滥用攻击的核心手段。它的核心思想是控制进入系统的请求速率，确保系统在其容量范围内平稳运行，避免因突发流量导致的服务雪崩。Shenjiying88系统在企业审计场景中面临多种流量特征：月底审计报告截止日前的高峰流量、大企业客户的批量审计请求、内部系统的定时轮询任务。

根据AWS的架构最佳实践，合理的限流策略可以将系统在高负载下的可用性提升3-5倍。限流算法有多种选择——固定窗口(简单但有边界效应）、滑动窗口(更平滑但复杂）、令牌桶(Token Bucket，允许突发）和漏桶(Leaky Bucket，平滑输出）。Shenjiying88选择了令牌桶算法作为主要限流实现，因为它支持一定的突发流量(企业客户提交审计批处理任务），同时能有效控制长期平均速率。

## 核心原则

- **原则1: 限流分层部署**: API网关层(全局+租户级限流）→ Service层(服务级限流）→ 数据访问层(连接池限流）。网关层限流过滤大部分异常请求，服务层限流保护核心业务逻辑，数据访问层防止数据库过载。Shenjiying88在Nginx Ingress Controller上配置了租户级限流规则。
- **原则2: 限流维度多级**: 全局QPS(保护整个集群）、按租户(保护资源公平分配）、按API路径(保护特定端点）、按用户IP(防御DDoS）、按认证Token(防凭证共享）。Shenjiying88的Redis限流Key格式为 `rate_limit:{dimension}:{value}:{window}`。
- **原则3: 限流反馈明确**: 被限流的请求必须返回标准化的响应：HTTP 429 Too Many Requests + `Retry-After` 头(秒数）+ JSON body 包含 `{ code: 42900, message: 'Rate limit exceeded. Retry after X seconds.' }`。客户端应通过读取Retry-After头实现退避。
- **原则4: 动态限流而非静态硬编码**: 限流阈值应根据系统当前负载动态调整。当数据库连接池利用率>70%时，自动降低API限流阈值。使用反馈控制系统——实时监控P99响应时间，如果P99超过200ms则目标限流降级为正常值的70%。Shenjiying88的限流配置存储在配置中心，可在不重启服务的情况下动态调整。
- **原则5: 限流数据精确计数**: 使用Redis的Sorted Set(Sliding Window算法）进行精确计数，而非固定窗口(有边界效应）。滑动窗口的精度为1秒，窗口大小为1分钟。Redis操作使用Lua脚本保证原子性，避免竞态条件导致超限。

## 实践案例（基于shenjiying88项目）

- **案例1: 租户级API限流**: 免费版租户：60 requests/minute，专业版租户：1000 requests/minute，企业版租户：10000 requests/minute。限流计数器使用 `rate_limit:tenant:{tenantId}:api:v1` 作为Key。当租户升级套餐时，配置中心的限流配置实时生效，无需重启服务。Shenjiying88的Admin Panel允许手动调整单个租户的临时限流配额。

- **案例2: 防御性限流(Circuit Breaker + Rate Limiter）**: 当审计引擎监测到连续失败(执行审计任务失败率>50%持续30秒）时，限流器自动将新审计任务的创建速率降低到10%。同时REST客户端在接收429后自动进行指数退避重试(1s, 2s, 4s, 8s... 最大30秒）。这避免了重试风暴(Retry Storm）对系统造成二次伤害。

## 反模式警示

- **反模式1: 只在API网关层做限流**: 如果API网关限流失效或被绕过(内网直连服务），系统可能直接暴露在过载风险中。每个服务应当有自己的限流能力作为最后一道防线——即使网关限流绕过，服务自身的限流仍能保护数据库。

- **反模式2: 限流后不提供任何反馈**: 被限流的请求直接断开连接或返回空响应，不告知客户端限流原因和重试时间。客户端可能反复重试加重过载，或不知道问题原因持续报错。始终返回429 + Retry-After + 清晰的消息。

## 参考文献

- AWS Well-Architected Framework — "Rate Limiting Best Practices"
- Kong API Gateway (2025) "Rate Limiting Configuration Guide"
- Martin Fowler (2024) "Circuit Breaker" pattern — martinfowler.com
