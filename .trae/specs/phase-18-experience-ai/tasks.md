# Phase-18 Tasks · 体验优化 + AI 增强

> 创建: 2026-06-26 · Pulse-68 Retro 阶段
> 时间: Pulse-69 → Pulse-73 (5 pulse)
> 配合 spec: [./spec.md](./spec.md)

---

## Phase 1 · Pulse-69 · 体验瓶颈消除

### T14: 用户旅程分析
- [ ] 漏斗分析 (登录/注册/下单/支付/核销 5 路径)
- [ ] 流失点识别 (跳失率 > 30% 标记 P0)
- [ ] 用户访谈 (≥5 用户)

### T15: 关键路径性能优化
- [ ] 首页加载 P95 < 1s
- [ ] 优惠券核销 P95 < 200ms (Phase-17 T4 已达)
- [ ] 订单提交 P95 < 500ms

### T16: 移动端适配
- [ ] H5 响应式布局
- [ ] 小程序原生组件迁移

---

## Phase 2 · Pulse-70 · AI Code Reviewer

### T17: Anti-pattern 规则库
- [ ] quota-double-increment 检测
- [ ] unsafe-catch (吞掉错误) 检测
- [ ] missing-guard (没 lifecycle/quota 守卫) 检测
- [ ] cross-tenant-leak 检测
- [ ] stub-test-fragility 检测

### T18: CI 集成
- [ ] GitHub Action / GitLab CI
- [ ] PR 评论自动贴检测结果
- [ ] 检测准确率 ≥ 90% 验证集

---

## Phase 3 · Pulse-71 · Champion Dashboard

### T19: 数据采集
- [ ] Approver / Champion / Observer 档案结构化
- [ ] 知识贡献统计 (commit / review / RFC)
- [ ] 反馈聚合 (pulse-review / 月度复盘)

### T20: Dashboard 上线
- [ ] Grafana panel (Champion Ranking / Knowledge Map / Decision Timeline)
- [ ] 月度自动邮件 (月底 cron)
- [ ] 移动端可访问

---

## Phase 4 · Pulse-72 · 跨租户隔离加固

### T21: Lint 规则
- [ ] 禁止 findOne() 不带 tenantId (where: { tenantId } 强制)
- [ ] 禁止跨租户 JOIN
- [ ] 自动化 ESLint rule

### T22: 集成测试
- [ ] 100 跨租户场景自动生成
- [ ] E2E: tenant-A 操作 tenant-B 数据返回 0 行 (不抛错)
- [ ] 性能开销 < 5%

---

## Phase 5 · Pulse-73 · RAG 知识库 + Retro

### T23: RAG 索引器
- [ ] docs/**.md 结构化分块 (chunk size 512 tokens)
- [ ] 向量化 (sentence-transformers/all-MiniLM-L6-v2)
- [ ] 索引存储 (LanceDB / SQLite-vec)
- [ ] Q&A 接口 (POST /api/knowledge/query)

### T24: Phase-18 Retro
- [ ] lessons-learned/phase-18.md
- [ ] decision-records/DR-006-*.md
- [ ] patterns/*.md
- [ ] dev-roadmap.md 更新 Phase-19 准备

---

## 📊 任务统计

| 优先级 | 任务数 | Pulse |
|---|---|---|
| **P0** 体验 | 3 (T14-T16) | 69 |
| **P0** AI | 2 (T17-T18) | 70 |
| **P1** Champion | 2 (T19-T20) | 71 |
| **P1** 隔离 | 2 (T21-T22) | 72 |
| **P2** RAG + Retro | 2 (T23-T24) | 73 |
| **总计** | **11 任务** | **5 pulse** |

---

> 由 Pulse-68 Retro 生成 · Phase-18 启动
