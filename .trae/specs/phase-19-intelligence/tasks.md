# Phase-19 Tasks · 数据驱动 + 智能化引擎

> 创建: 2026-06-26 · Pulse-74 Phase-18 Retro 阶段
> 时间: Pulse-74 → Pulse-78 (5 pulse)
> 配合 spec: [./spec.md](./spec.md)

---

## Phase 1 · Pulse-74 · 异常检测 (Anomaly Detection)

### T25: 时序指标采集
- [ ] perf-monitor 输出流化 (prometheus exporter + Kafka)
- [ ] 滚动窗口存储 (1h / 6h / 24h / 7d / 30d)
- [ ] 季节性识别 (周/月/年周期)

### T26: AnomalyDetector
- [ ] 3σ 检测 (z-score > 3)
- [ ] IQR 检测 (Q3 + 1.5 * IQR)
- [ ] EWMA 检测 (指数加权移动平均)
- [ ] 综合评分 (anomaly score 0-1)
- [ ] 白名单 (业务已知波动)

### T27: AutoRollback
- [ ] 快照 (DB + Redis + 配置)
- [ ] 回滚 workflow (验证 → 回滚 → 重启 → 验证)
- [ ] 误触发防护 (二次确认 + 手动覆盖)

---

## Phase 2 · Pulse-75 · E2E 自动生成

### T28: OpenAPI 解析器
- [ ] NestJS route table → OpenAPI 3.0
- [ ] DTO schema → JSON Schema
- [ ] 错误码 → expected response codes

### T29: TestCaseGenerator
- [ ] 边界值生成 (min/max/null/empty)
- [ ] 类型错误生成 (number → string)
- [ ] 安全场景生成 (XSS/SQLi payload)
- [ ] 业务场景生成 (基于历史 e2e 模板)

### T30: AutoRunner
- [ ] CI 集成 (GitHub Action / GitLab CI)
- [ ] 测试报告 (覆盖率 / 通过率 / 性能)
- [ ] 与 Phase-18 ai-reviewer 联动

---

## Phase 3 · Pulse-76 · 推荐引擎

### T31: Champion 上下文构建
- [ ] 历史贡献 (近 90 天)
- [ ] 当前任务 (从 git branch / commit msg)
- [ ] 关联 Champion (相同模块的活跃 Champion)

### T32: RAG 召回 + 排序
- [ ] query 改写 (基于 Champion context)
- [ ] 多维度评分 (cosine sim + recency + Champion affinity)
- [ ] topK + diversity 重排

### T33: PersonalizedRecommender
- [ ] HTTP 接口 (POST /api/recommend)
- [ ] LLM 包装 (context → prompt → response)
- [ ] 采纳率追踪 (推荐 → 是否被引用)

---

## Phase 4 · Pulse-77 · 租户健康度

### T34: HealthScore
- [ ] P95 (perf-monitor 聚合)
- [ ] 错误率 (5xx 占比)
- [ ] 配额使用率 (quota.maxXxx / currentXxx)
- [ ] Champion 活跃度 (近 30 天贡献)
- [ ] 综合评分 0-100

### T35: HealthDashboard
- [ ] Grafana 5 panel
  - 总览 (按租户分布)
  - 趋势 (30 天)
  - 告警 (健康度 < 60)
  - 推荐操作
  - 历史事件
- [ ] 实时告警 (邮件 / 飞书 / 钉钉)

---

## Phase 5 · Pulse-78 · Phase-19 Retro + Phase-20 准备

### T36: lessons-learned/phase-19.md
- [ ] 5 成功 + 4 痛点
- [ ] 8 Phase-20 行动项

### T37: decision-records/DR-007-*.md
- [ ] 异常检测算法选择
- [ ] E2E 生成策略
- [ ] 推荐引擎 LLM 选择

### T38: dev-roadmap.md → Phase-20 准备
- [ ] Phase-19 标记 ✅
- [ ] Phase-20 spec 草稿

---

## 📊 任务统计

| 优先级 | 任务数 | Pulse |
|---|---|---|
| **P0** 异常检测 | 3 (T25-T27) | 74 |
| **P0** E2E 自动 | 3 (T28-T30) | 75 |
| **P0** 推荐 | 3 (T31-T33) | 76 |
| **P1** 健康度 | 2 (T34-T35) | 77 |
| **P2** Retro | 3 (T36-T38) | 78 |
| **总计** | **14 任务** | **5 pulse** |

---

> 由 Pulse-73 Retro 生成 · Phase-19 启动