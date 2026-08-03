# 设计模式知识库

> 设计模式知识库收录了 shenjiying88 项目在 Phase-15 至 Pulse-68 期间沉淀的架构与设计模式文档，涵盖分布式系统、API 容错、事件驱动、配额治理等核心场景。

---

## 📂 目录结构

```
knowledge/patterns/
├── README.md                          # 本文件 — 模块概述
├── api-gateway-pattern.md             # API 网关模式
├── bulkhead-pattern.md                # 舱壁隔离模式
├── cache-aside-pattern.md             # Cache-Aside 缓存模式
├── circuit-breaker.md                 # 熔断器模式（3 状态自动切换）
├── cqrs-pattern.md                    # CQRS 命令查询职责分离
├── cross-store-quota.md               # 跨商店配额管理
├── event-driven-architecture.md       # 事件驱动架构
├── idempotency-pattern.md             # 幂等性保障模式
├── observer-pattern.md                # 观察者模式
├── optional-di.md                     # 可选依赖注入
├── outbox-pattern.md                  # Outbox 可靠事件发布
├── quota-guard.md                     # 配额守卫
├── reserve-rollback.md                # 预留-回滚模式
├── retry-pattern.md                   # 重试模式
├── saga-pattern.md                    # Saga 分布式事务
├── strategy-pattern.md                # 策略模式
└── throttling-pattern.md             # 限流模式
```

---

## 🚀 快速开始

```bash
# 浏览所有模式列表
ls knowledge/patterns/

# 阅读某个模式（例如熔断器）
cat knowledge/patterns/circuit-breaker.md

# 搜索模式相关内容
grep -l "熔断\|circuit" knowledge/patterns/*.md
```

---

## 🧠 核心功能

本知识库涵盖以下设计模式类别：

| 类别 | 模式 | 适用场景 |
|------|------|----------|
| **容错** | Circuit Breaker, Bulkhead, Retry | LLM Provider 调用、外部 API、数据库连接 |
| **事务** | Saga, Outbox, Reserve-Rollback | 跨模块订单、优惠券、积分、库存分布式事务 |
| **架构** | CQRS, Event-Driven, API Gateway | 复杂查询、事件驱动架构、网关路由 |
| **性能** | Cache-Aside, Throttling | 缓存加速、请求限流 |
| **治理** | Quota Guard, Cross-Store Quota, Idempotency | 配额管理、幂等去重 |
| **设计** | Strategy, Observer, Optional DI | 策略切换、事件通知、可选依赖注入 |

每个模式文档均包含：
- **问题描述** — 模式要解决的具体痛点
- **解决方案** — 核心思路与架构决策
- **实现要点** — 代码级别的最佳实践
- **参考来源** — 项目内实战沉淀出处

---

## ⚠️ 注意事项

1. **实战驱动** — 所有模式均来源于项目实际开发中遇到的问题与解决方案，非纯理论搬运
2. **版本对应** — 每个模式文档头部标注了创建阶段（如 `Phase-15` / `Pulse-68`），便于追溯上下文
3. **组合使用** — 多个模式常配合出现（如 Saga + Outbox + Event-Driven），建议关联阅读
4. **持续演进** — 随项目迭代，模式文档会更新补充，请保持关注 `git log` 变更
5. **代码示例** — 部分模式文档包含 TypeScript 代码片段，需结合项目源码理解完整实现
