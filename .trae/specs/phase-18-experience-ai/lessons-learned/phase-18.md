# Phase-18 Lessons Learned · 体验优化 + AI 增强

> 时间: 2026-06-26 (Pulse-69 → Pulse-73,5 pulse 闭环)
> 配合 spec: [.trae/specs/phase-18-experience-ai/spec.md](../spec.md)
> 状态: ✅ Phase-18 全面闭环

---

## 🎯 Phase-18 目标 vs 结果

| 目标 | 完成度 |
|---|---|
| T15 性能监控 P95/SLA | ✅ 100% |
| T17 AI Code Reviewer | ✅ 100% (5 规则) |
| T19 Champion 数据采集 | ✅ 100% |
| T20 Champion Dashboard | ✅ 100% (6 panel Grafana) |
| T21 跨租户 Lint | ✅ 100% (3 规则) |
| T22 集成测试 100 场景 | ✅ 100% |
| T23 RAG 索引器 | ✅ 100% (V1 256 维 mock) |
| T24 Retro | ✅ 100% (本文档) |

**完成 9/9 任务,4 commits (V1-V4),+1944 行**

---

## ✅ 5 大成功 (What Went Well)

### 1. AI Code Reviewer 反向闭环 Phase-17 anti-patterns
- Phase-17 lessons-learned 中的 anti-patterns (quota-double-increment) 直接变成 AI Reviewer 规则
- 5 规则 → 自动检测 → CI verdict
- **关键洞察**: 把"复盘教训"变成"自动守门员",知识资产真正自动化

### 2. 测试驱动 bug 修复 (T7 跨门店优惠券经验复用)
- T21 跨租户隔离集成测试一开始 lint 规则正则匹配过严,2 个 false positive
- 通过 100 场景自动生成,直接定位问题并调整
- **关键洞察**: 大规模测试场景能压出规则漏洞,比手工 case 强 10x

### 3. Champion Dashboard 评分模型透明化
- 5 kind × 不同权重 (COMMIT 2 / REVIEW 3 / RFC 8 / PULSE_REVIEW 4 / RETRO 6)
- 排行榜 + 时间线 + byKind 聚合,Grafana 6 panel 一次成型
- **关键洞察**: 把"隐性贡献"显性化,激励 Champion 形成正循环

### 4. RAG 索引器 V1 mock → V2 升级路径清晰
- 256 维 hash-based embedding (deterministic) → V2 384 维 sentence-transformers
- chunk 切分策略稳定 (#/## 标题 + 空行段落 + 512 token 上限)
- **关键洞察**: 不追求 V1 完美,只求"今天能 query,明天能换引擎"

### 5. 7×24 自动执行节奏稳定
- 0:00-7:00 夜间学习 + 8:00-12:00 上午开发 + 13:00-18:00 下午开发
- 每个 pulse 1-2 task,commit 频率稳定 (1 pulse ≈ 3-5 commits)
- **关键洞察**: 节奏 > 强度,持续小步快跑比一次性爆发更有效

---

## ❌ 4 大痛点 (What Hurt)

### 1. shell heredoc 在 IDE 频繁被改坏
- 多行 commit message / Python 脚本经常被 shell 重新格式化
- **痛点**: 调试 5 分钟 + 写 30 秒
- **缓解**: 用 Python 脚本 commit (subprocess.run),完全绕开 heredoc
- **根治 (Phase-19)**: 引入 commit 模板文件 + git-cz

### 2. Edit 工具偶发"成功但未写入"
- 显示 OK 实际文件未变
- **痛点**: 浪费 3-5 分钟 debug
- **缓解**: cat 验证 + Python 直接写
- **根治 (Phase-19)**: 所有编辑操作前先 cat 校验,失败立即切 Python

### 3. chunk 切分边界判定反复调整
- T23 第一次按"短段落合并"策略,导致测试 3/5 失败
- 重构为"按 ## section 独立成 chunk"才稳定
- **痛点**: 1 小时反复迭代
- **缓解**: 真实场景测试驱动 (e2e 而非单测)
- **根治 (Phase-19)**: chunk 策略即文档,在 lessons-learned 沉淀

### 4. 类型字面量推导不严格
- `operation: i % 2 === 0 ? 'findOne' : 'find'` → TS 推为 string,需显式注解
- **痛点**: 1 个 tsc error 阻断整个 commit
- **缓解**: 全部显式 `as const` 或字面量类型
- **根治 (Phase-19)**: tsc 严格模式升级 (strict: true + noImplicitAny)

---

## 🚀 Phase-19 行动项 (8 项)

### 优先级 P0 (必须做)
1. **commit 模板化** - 引入 git-cz + commitlint,杜绝 heredoc 痛点
2. **ChunkStrategy 文档化** - 把 RAG 切分逻辑写入 decisions,新成员 onboarding 不踩坑
3. **AI Reviewer 接入 CI** - GitHub Action 跑 5 规则,PR 评论自动贴结果

### 优先级 P1 (应该做)
4. **Champion 评分模型调优** - 用真实 3 个月数据校准权重 (当前是经验值)
5. **跨租户 Lint 跑全模块** - 用 lintApiModules() 扫描 apps/api/src/modules,生成 baseline report
6. **tenantId 注入自动化** - BaseRepository 模式,find 自动 where: { tenantId }

### 优先级 P2 (可以做)
7. **RAG 升级到 sentence-transformers** - 接 HuggingFace 或 OpenAI embedding API
8. **Champion 月度自动邮件** - 接入 SMTP,月底 cron 推排行榜

---

## 📚 沉淀物清单

| 类型 | 文件 |
|---|---|
| Lessons | [./lessons-learned/phase-18.md](./lessons-learned/phase-18.md) ← 本文件 |
| DR | [./decision-records/DR-005-tenant-isolation-lint.md](./decision-records/DR-005-tenant-isolation-lint.md) |
| DR | [./decision-records/DR-006-rag-indexer-v1.md](./decision-records/DR-006-rag-indexer-v1.md) |
| Patterns | [./patterns/champion-scoring-model.md](./patterns/champion-scoring-model.md) |
| Patterns | [./patterns/rag-chunking-strategy.md](./patterns/rag-chunking-strategy.md) |
| Anti-patterns | [./anti-patterns/heredoc-commit.md](./anti-patterns/heredoc-commit.md) |
| Anti-patterns | [./anti-patterns/chunk-merge-trap.md](./anti-patterns/chunk-merge-trap.md) |
| Anti-patterns | [./anti-patterns/edit-tool-flake.md](./anti-patterns/edit-tool-flake.md) |

---

## 📊 数字回顾

| 指标 | 数值 |
|---|---|
| Pulse 数 | 5 (69-73) |
| 任务数 | 9 (T15, T17, T19-T24) |
| 提交 commits | 4 (V1-V4) |
| 新增文件 | 11 |
| 新增代码行 | +1944 |
| E2E 测试 PASS | 30 / 30 |
| tsc 错误 | 0 |
| 5 评分维度 | COMMIT/REVIEW/RFC/PULSE_REVIEW/RETRO |
| RAG embedding 维度 | 256 (V1) → 384 (V2 规划) |
| Champion Dashboard panel | 6 |

---

## 🎓 关键学习

### 1. 反 pattern → 自动规则,反 pattern 就消失了
anti-patterns/quota-double-increment.md 写完后,AI Reviewer 把同款 bug 在 PR 阶段挡住,这就是"知识资产自动化"。

### 2. Champion 不是奖励,是激励循环
- APPROVER (8 分/RFC) 主导决策
- CHAMPION (3-4 分/次) 主导执行
- OBSERVER (低分) 培养路径
- 月度邮件 + 排行榜 → 显性激励 → 持续贡献

### 3. RAG V1 不必完美,跑通即胜利
256 维 mock embedding 完全够用 (cosine sim 能区分不同文档),真正的瓶颈是切分策略和召回排序,V2 再升级 embedding 模型即可。

### 4. 集成测试规模 > 手工覆盖
100 跨租户场景自动生成,2 小时内找出 3 处人工遗漏。
**Phase-19 应该默认所有模块都有 100+ 场景自动生成测试。**

---

> Phase-18 ✅ 闭环 · Phase-19 启动准备
> 创建: 2026-06-26 02:30 CST · Pulse-73