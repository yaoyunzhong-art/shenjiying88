# E1 陈架构 · 架构专家洞察

> 创建: 2026-06-26 · Pulse-68
> 专家: E1 陈架构 (W1-架构领域 Lead)
> 状态: 待 R7 通过后正式 Approver

---

## 1. 🎯 关注领域

- 多租户 SaaS 架构
- 微服务 vs 单体演进
- 性能与扩展性
- 数据一致性

---

## 2. 💡 核心洞察

### 洞察 1: 单体优先,微服务最后

**观点**: SaaS < 50 人团队 / 月活 < 100 万,坚持**模块化单体**。

**理由**:
- 微服务运维成本 = 5x 单体
- 跨服务事务 = 复杂
- 团队规模小,微服务是过度设计

**神机营实践**:
- 当前 Phase-12~17 = 模块化单体 (apps/api 内分模块)
- Phase-22+ 才考虑拆分核心服务 (Coupon / Order / Member)

---

### 洞察 2: 状态 = 复杂度根源

**观点**: 状态越多 bug 越多,优先减少可变状态。

**实践**:
- Event Sourcing (部分场景)
- CQRS (Phase-19 Read Model)
- 不变对象 (DTO / Event)
- 状态机 (Coupon.status: pending → completed)

---

### 洞察 3: 性能问题 80% 在数据库

**观点**: 应用层优化远不如数据库优化收益大。

**实践**:
- 索引设计优先 (而非缓存)
- 慢查询监控 (> 50ms 立即优化)
- 单表 > 1 亿行考虑分库分表

---

## 3. 📚 推荐的 Phase 演进路径

| 阶段 | 架构 |
|---|---|
| Phase 1-15 | 模块化单体 |
| Phase 16-20 | 模块化单体 + 缓存层 (Redis) |
| Phase 21-25 | 模块化单体 + 异步任务 (BullMQ) + RAG |
| Phase 26-30 | 拆分核心服务 (Coupon / Member 微服务) |

---

## 4. 🔗 关联

- [patterns/event-driven-architecture.md](../patterns/event-driven-architecture.md)
- [patterns/saga-pattern.md](../patterns/saga-pattern.md)
- [patterns/cqrs-pattern.md](../patterns/cqrs-pattern.md)
