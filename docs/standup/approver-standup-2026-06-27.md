# Approver 早会议程 · 2026-06-27 (Day 2 · Pulse-68 等待期)

> 主持: E1 陈架构(待 R7 通过后正式任命)
> 时间: 2026-06-27 (周五) 09:00 - 09:30 CST
> 形式: 同步早会 (线上)
> 关联: [R7-approver-appointment.md](../../rfcs/voting/R7-approver-appointment.md) · [voting-record.md](../process/voting-record.md) · [72h-action-plan.md](../operations/72h-action-plan.md)

---

## 1. 📋 议程 (30 min)

| 时间 | 时长 | 议题 | 主持 | 关联 |
|---|---|---|---|---|
| 09:00 - 09:05 | 5min | R7 投票进度同步 | E1 | voting-record.md §2.2 |
| 09:05 - 09:10 | 5min | R8 Champion 任命同步 | E5 | R8-champion-appointment.md |
| 09:10 - 09:15 | 5min | Pulse-68 Coupon 启动包评审 | E4 | commit 84335d211 |
| 09:15 - 09:20 | 5min | RAG BM25 增强 + 评估指标 | E9 | retrieval.bm25.ts |
| 09:20 - 09:25 | 5min | Day 2 任务分配 | main agent | 72h-action-plan.md |
| 09:25 - 09:30 | 5min | Q&A + Standup 衔接 | 全体 | standup-2026-06-27.md |

---

## 2. 🗳️ R7 投票进度 (E1 主持 · 5 min)

### 2.1 状态回顾
- **截止**: 2026-06-29 00:30 CST(剩余 ~1天 15h)
- **当前票数**: 0 票(等待 Approver 候选自荐/他荐投票)
- **门槛**: 同意权重 ≥3.0 + 0 Champion 否决

### 2.2 待解决问题
- [ ] **8 候选 Approver 投票意向**: E1/E6/E9/E10/E16(立即任命 5)+ E2/E4/E5(候补 3)
- [ ] **拟投票 Approver**: E10/E15/E16/E40/E4(已投 R6,本次需重投 R7)
- [ ] **Champion 联名提名**: 因 0 Champion,本批使用"用户直批 + 试用"特殊路径

### 2.3 投票入口
- [voting-record.md §2.2](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/process/voting-record.md#L59-L86) · R7 投票明细表
- 投票模板: [template.md](../../rfcs/voting/template.md)
- 操作: 直接 PR 提交到 voting-record.md 或在 R7 RFC 下评论

---

## 3. 🏆 R8 Champion 任命 (E5 主持 · 5 min)

### 3.1 候选确认
- **E5 赵数据**(W1+W6)· Champion(跨级 + 试用)
- **E40 杨客户**(W8)· Champion(跨级 + 试用)
- 试用期: 1 个月 → Pulse-72 (2026-07-26) 评估

### 3.2 责任分工
| 维度 | E5 (数据 Champion) | E40 (客户 Champion) |
|---|---|---|
| 主要 veto 范围 | 架构/数据/性能/AI | 客户体验/UX/续约 |
| 主持 standup | ✅ 默认 | ⚠️ 候补 |
| 主持 phase retro | ✅ Phase-19/20 | ✅ Phase-17/18 |

### 3.3 任命生效条件
- [ ] R8 投票通过 (与 R7 同步)
- [ ] 用户直批 (因 0 Champion 特殊路径)
- [ ] 试用期评估机制启动 (Pulse-72)

---

## 4. 🎯 Pulse-68 Coupon 启动包评审 (E4 主持 · 5 min)

### 4.1 提交清单 (commit `84335d211`)
- **6 文件新增** + **3 文件修改** · 450 行
  - [coupon.contract.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/coupon/coupon.contract.ts) · 契约
  - [coupon.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/coupon/coupon.controller.ts) · 6 REST 端点
  - [coupon.dto.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/coupon/coupon.dto.ts) · 8 DTOs
  - 4 测试文件 · 60 用例 (11+30+8+11)
  - [coupon.module.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/coupon/coupon.module.ts) · NestJS 装配
- [apps/api/vitest.config.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/vitest.config.ts) · vitest 配置

### 4.2 评审要点
- ✅ DTO 校验完整(class-validator + 8 DTO)
- ✅ Controller 路由清晰(6 端点 / 错误码 / HttpStatus)
- ✅ 契约转换严格(`toCouponContract` 类型守卫)
- ⚠️ create/updateStatus 仍 NOT_IMPLEMENTED → Pulse-68 T2 填实
- ⚠️ list/get 端点返回空实现 → Pulse-68 T2 填实

### 4.3 Pulse-68 T2 任务分配
- **T2 Owner**: E4 张营销(Phase-17 Owner)
- **验收标准**: 跨门店核销 < 200ms,e2e 覆盖 ≥5 场景
- **截止**: 2026-06-29 (Pulse-68 启动日)

---

## 5. 🤖 RAG BM25 增强 (E9 主持 · 5 min)

### 5.1 新增文件
- [retrieval.bm25.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/retrieval/retrieval.bm25.ts) · 完整 BM25 + Hybrid 融合 + A/B 评估
- 设计依据: [DR-005-rag-architecture.md](../../knowledge/decision-records/DR-005-rag-architecture.md)

### 5.2 核心能力
| 函数 | 用途 | 验收 |
|---|---|---|
| `tokenize(text)` | 中英文混合分词 | 单测覆盖 ≥10 case |
| `BM25Index.search(q, topK)` | 离线检索 | topK=10, 评估 hit rate |
| `BM25Index.querySparseVector(q)` | 生成 Qdrant 稀疏向量 | 与 Qdrant 集成测试 |
| `evaluateAB(results, gt)` | A/B 评估 (Hit Rate @ K, MRR @ K) | 用于 Reranker 对比 |

### 5.3 Pulse-71 集成任务
- [ ] retrieval.client.ts hybridSearch 接入 BM25 sparse vector
- [ ] retrieval.service.ts retrieveCode 启用 hybrid 模式
- [ ] scripts/eval-reranker.py 生成 ground truth + 跑 A/B
- [ ] 调参 α/β/γ (默认 0.7/0.3/0.1)

---

## 6. 📋 Day 2 任务分配 (main agent · 5 min)

### 6.1 自动化触发
- ✅ 00:00 cron 自动跑 monitoring-daily.sh(已配置)
- ✅ 09:00 Standup 模板自动生成(standup-prep.py)
- ⏳ 09:30 后台启动 Qdrant docker-compose(若未运行)

### 6.2 Day 2 前台任务
| 任务 | Owner | 验收 |
|---|---|---|
| Approver 早会 | E1 主持 | 9:00-9:30 完成 + 纪要 |
| Standup | E5 主持 | 9:30-10:00 完成 |
| R7 投票催办 | main agent | 12:00 前 ≥3 Approver 投票 |
| RAG BM25 单测 | E9 + W5-L3 QA | coverage ≥80% |
| Phase-17 T2 启动 | E4 + E16 | Coupon service 填实 |

### 6.3 Day 2 后台任务
- index-codebase.py 真实跑(需 Qdrant 启动)
- Qdrant 1.10+ 启动 + 健康检查
- pre-commit hook 全员启用验证

---

## 7. ❓ Q&A + Standup 衔接 (全体 · 5 min)

- 早会纪要输出到: `docs/standup/approver-standup-2026-06-27-minutes.md`
- 09:30 直接衔接 Standup(同会议)
- 关键决策同步到: voting-record.md + debt.md

---

## 8. 📎 关联文档

- [R7-approver-appointment.md](../../rfcs/voting/R7-approver-appointment.md) · 8 候选 Approver
- [R8-champion-appointment.md](../../rfcs/voting/R8-champion-appointment.md) · 2 Champion
- [voting-record.md](../process/voting-record.md) · 投票历史
- [72h-action-plan.md](../operations/72h-action-plan.md) · 等待期详细计划
- [DR-005-rag-architecture.md](../../knowledge/decision-records/DR-005-rag-architecture.md) · RAG 架构
- [cross-store-quota.md](../../knowledge/patterns/cross-store-quota.md) · 跨门店 quota 模式

---

> 由 main agent 创建 · Pulse-68 Day 1 收尾
> 维护: 每个 Pulse 周期同步更新(每日 standup 时增量)
> 下次更新: 2026-06-28 09:00 (Day 3 倒计时)
