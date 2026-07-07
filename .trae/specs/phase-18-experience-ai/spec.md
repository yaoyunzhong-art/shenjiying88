# Phase-18 Spec · E7 体验优化 + AI 增强

> 创建: 2026-06-26 · Pulse-69 启动
> 配套: [./tasks.md](./tasks.md) · [./checklist.md](./checklist.md)
> Owner: E7 体验 + E40 平台 + E16 社群
> 时间: Pulse-69 → Pulse-73 (5 个 pulse)

---

## 1. 目标

承接 Phase-17 (营销 + 社群) 的成果,聚焦 **用户体验优化 + AI 能力增强**:
- 用户旅程摩擦点消除
- AI 自动检测 anti-patterns
- Champion Dashboard 上线
- 跨租户隔离加固

## 2. 范围

### 2.1 P0 - 体验瓶颈消除
- 单点优化 (登录/下单/支付/核销 4 个关键路径)
- 加载性能 < 1s (P95)
- 移动端 H5 / 小程序 双端适配

### 2.2 P0 - AI Code Reviewer
- 静态扫描 lessons-learned 中的 anti-patterns
- 自动检测 quota 双重 increment / 不安全 catch / 缺失守卫
- 集成到 CI

### 2.3 P1 - Champion Dashboard
- Champion 可视化面板 (知识贡献 / 决策参与度 / 反馈统计)
- 月度复盘自动邮件
- Approver 投票看板

### 2.4 P1 - 跨租户隔离加固
- Lint 规则: 禁止直接跨 tenantId 查询
- 运行时检查: 每次 DB 查询带 tenantId
- 自动化测试: 100 跨租户场景

### 2.5 P2 - RAG 知识库索引
- 64+ 文件结构化
- 向量化 (embeddings)
- 智能问答 (Q&A over knowledge base)

## 3. 不在范围

- Phase-19 AI Agent (独立 spec)
- 跨地区数据中心
- 多语言 i18n (V3)

## 4. 验收标准

| Pulse | 任务 | 验收 |
|---|---|---|
| 69 | T14-T16 体验瓶颈 + 加载性能 | P95 < 1s, 关键路径 0 错误 |
| 70 | T17-T18 AI Code Reviewer | 检测准确率 ≥ 90%, CI 集成 |
| 71 | T19-T20 Champion Dashboard | 上线可访问, 月报自动 |
| 72 | T21-T22 跨租户隔离 | 0 lint 错误, 100 测试通过 |
| 73 | T23-T24 RAG 知识库 + Retro | 上线可问答, Phase-18 lessons |

---

## 5. 风险与缓解

| 风险 | 缓解 |
|---|---|
| AI Code Reviewer 误报高 | 起步只检测 5 类已知 anti-pattern, 收集反馈迭代 |
| Champion Dashboard 开发周期长 | 用 Grafana + 现有数据, V1 简化版 |
| 跨租户隔离破坏现有代码 | Lint 规则 WARN 不 BLOCK, 给 1 月过渡期 |
| RAG 性能不达标 | 先做小规模 (1000 文件) 试点 |

---

## 6. 关联

- [Phase-17 lessons](../phase-17-marketing-community/lessons-learned/phase-17.md) · Phase-17 复盘
- [DR-004](../phase-17-marketing-community/decision-records/DR-004-cross-store-coupon.md) · 跨门店决策
- [dev-roadmap.md](../../dev-roadmap.md) · 整体路线图

---

> 由 Pulse-68 Retro + Phase-19 Champion 启动生成 · 2026-06-26 02:20 CST
