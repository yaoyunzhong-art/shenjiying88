# E5 赵数据 · 数据科学专家洞察

> 创建: 2026-06-26 · Pulse-68
> 专家: E5 赵数据 (W1+W6 跨领域, Champion 候选)
> 状态: 待 R8 通过后正式 Champion

---

## 1. 🎯 关注领域

- 数据建模 / 仓库
- 实时分析
- A/B 测试
- 业务指标体系

---

## 2. 💡 核心洞察

### 洞察 1: 指标先于功能,功能才有意义

**观点**: 没有清晰指标的 SaaS,迭代是盲目。

**神机营核心指标 (North Star + Health)**:
- **NSM**: 月活会员数 (MAU)
- **粘性**: 次月留存率
- **增长**: 新增租户 / 月
- **变现**: ARPU / 租户
- **健康**: API P95 / 可用性 / 错误率

---

### 洞察 2: 实时分析 ≠ 实时数据库

**观点**: 不要在 OLTP 库做 OLAP 查询。

**实践**:
- OLTP (PostgreSQL) → 业务读写
- OLAP (ClickHouse / Doris) → 报表 / 分析
- 同步:CDC (Debezium) / ETL 定时

---

### 洞察 3: A/B 测试 = 数据驱动决策

**观点**: 拍脑袋的功能 50% 是失败的,A/B 测试是验证手段。

**实施** (Phase-25 启动):
- 实验平台 (内部)
- 流量分配 (hash(userId) % 100)
- 显著性检验 (p < 0.05)
- 实验报告自动生成

---

## 3. 📐 Phase-19+ 数据架构

| 组件 | 工具 |
|---|---|
| OLTP | PostgreSQL 16 |
| 缓存 | Redis 7 |
| 向量库 | Qdrant |
| OLAP | ClickHouse (Phase-23) |
| BI | Metabase / Superset |
| 监控 | Prometheus + Grafana |

---

## 4. 🔗 关联

- [patterns/cqrs-pattern.md](../patterns/cqrs-pattern.md)
- [best-practices/performance-optimization.md](../best-practices/performance-optimization.md)
