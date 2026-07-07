# Phase-19 Spec · 数据驱动 + 智能化引擎

> 创建: 2026-06-26 · Pulse-74 Phase-18 Retro 阶段
> 时间: Pulse-74 → Pulse-78 (5 pulse)
> 配合: dev-roadmap.md §Phase-19

---

## 🎯 目标

将 Phase-18 的"知识沉淀"升级为"智能化引擎",重点 3 件事:
1. **AI 辅助 e2e 生成** - 自动从 OpenAPI / 路由表生成测试用例 (10x 提速)
2. **业务异常自愈** - anomaly detection + auto-rollback (零干预)
3. **个性化推荐引擎** - 基于 Champion 评分 + RAG 的上下文感知推荐

## 📐 架构概览

```
[Phase-18 沉淀]
├── perf-monitor (P95/SLA)
├── ai-reviewer (5 规则)
├── champion (评分模型)
├── tenant-isolation (Lint)
└── knowledge-indexer (RAG V1)
       ↓
[Phase-19 升级]
├── anomaly-detector (anomaly score + auto-rollback)
├── e2e-generator (OpenAPI → test cases)
├── recommender (Champion + RAG + tenant context)
├── auto-rollback (rollback workflow + snapshot)
└── health-score (实时租户健康度)
```

## 📋 Phase-19 任务 (11 任务,T25-T35,5 pulse)

### Phase 1 · Pulse-74 · 异常检测 (Anomaly Detection)
- **T25**: 时序指标采集 (perf-monitor 输出流化)
- **T26**: AnomalyDetector (3σ + IQR + EWMA 三种检测算法)
- **T27**: AutoRollback (快照 + 回滚 + 验证)

### Phase 2 · Pulse-75 · E2E 自动生成
- **T28**: OpenAPI 解析器 (route table → test skeleton)
- **T29**: TestCaseGenerator (基于 schema 生成边界值)
- **T30**: AutoRunner (CI 集成 + 报告)

### Phase 3 · Pulse-76 · 推荐引擎
- **T31**: Champion 上下文构建 (历史贡献 + 当前任务)
- **T32**: RAG 召回 + 排序 (topK + 多维度评分)
- **T33**: PersonalizedRecommender (HTTP 接口 + LLM 包装)

### Phase 4 · Pulse-77 · 租户健康度
- **T34**: HealthScore 计算 (P95 + 错误率 + 配额使用 + Champion)
- **T35**: HealthDashboard (Grafana 5 panel + 实时告警)

### Phase 5 · Pulse-78 · Phase-19 Retro + Phase-20 准备
- T36: lessons-learned/phase-19.md
- T37: decision-records/DR-007-*.md
- T38: dev-roadmap.md → Phase-20 准备

---

## 🎯 关键指标

| 指标 | 目标 |
|---|---|
| Anomaly 检测召回率 | ≥ 95% |
| Auto-rollback 误触发率 | < 1% |
| E2E 自动生成覆盖率 | ≥ 80% (相对手工) |
| Recommender 推荐采纳率 | ≥ 30% |
| HealthScore 准确率 | ≥ 90% (相对人工评估) |

---

## 🚧 技术风险

1. **Anomaly 检测** - 业务季节性 (月初 / 周末) 易误判,需白名单机制
2. **E2E 生成** - OpenAPI 描述质量决定生成质量,需 schema 治理
3. **Recommender** - LLM 上下文窗口限制,需分块召回 + 拼装

---

## 📊 Phase-18 → Phase-19 衔接

- Phase-18 perf-monitor 输出 → Phase-19 T25 时序输入
- Phase-18 RAG V1 → Phase-19 T32 召回后端
- Phase-18 Champion → Phase-19 T31 上下文输入
- Phase-18 lessons-learned → Phase-19 行动项 (8 项已识别)

---

> 创建: 2026-06-26 02:35 CST · Pulse-74
> 状态: ⏳ 待启动 (Pulse-74 进入 Phase-19)