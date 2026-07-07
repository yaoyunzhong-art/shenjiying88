# 🗺️ 神机营 SaaS · 开发路线图 (dev-roadmap.md)

> 最后更新: 2026-06-25 23:30 CST · Pulse-65
> **核心原则**: 不断学习 + 不断进化 + 高度智能化 + 知识库赋能
>
> 本文件是 `dev-evaluation.md` 的**执行版本**,每阶段配套 spec/tasks/checklist 三件套。
>
> **当前执行口径说明**: 自 2026-06-30 起,当前一线开发排期与流程以 `DEVELOPMENT_CONSTITUTION.md`、`.trae/specs/v12-master-90day/`、`.trae/execution/v12-plan-process-alignment.md` 为准。本文档保留为路线图与历史背景索引,其中 Phase-17~21 章节不得单独作为当前 Sprint 排期依据。

---

## 0. 🎯 顶层哲学 (Philosophy)

### 0.1 三大核心目标
1. **开发能力可复制**: 通过 40 人专家团 + 知识库,让团队任何成员都能复用累积经验
2. **系统自我进化**: 每个 phase 完成后,系统自动内化教训,下个 phase 自动应用
3. **业务 + 技术双轮驱动**: 专家团投票 + RFC 评审,避免纯技术自嗨

### 0.2 智能化三要素
- **L1 辅助型**: AI 辅助代码生成/补全/单测 (当前已达)
- **L2 自动化型**: AI 自动 code review/漏洞检测/性能优化 (Phase-19 目标)
- **L3 自进化型**: 系统根据专家反馈自动调整架构/优先级/范式 (Phase-25+ 远期)

### 0.3 知识沉淀公式
```
经验 (Experience) → 文档化 (Document) → 结构化 (Structure) → 自动化 (Automate) → 智能化 (Intelligent)
```

---

## 1. ✅ 已完成阶段 (Closed Stages)

### Stage A · 工程基线 (Phase-1 ~ Phase-12)
- 多工作区 monorepo (apps/api, apps/app, apps/miniapp, apps/admin-web, packages/sdk, packages/types, packages/ui)
- NestJS 11 + TypeScript strict + tsx runtime
- 基础 CRUD + 鉴权 + 单元/e2e 测试框架

### Stage B · 多租户架构 (Phase-13 ~ Phase-15)
- Phase-13: TenantQuota + TenantLifecycle + QuotaEnforcement
- Phase-14: TenantIsolation 中间件
- Phase-15D/E: registerPersistent 接入 lifecycle + quota 守卫
- **结果**: 8 个业务 service 全部接入守卫 (Brand/Store/Member/Campaign/Product/Invoice/ApiCall)

### Stage C · 业务深化 (Phase-16)
- Phase-16D: CampaignService (9 e2e)
- Phase-16E: InventoryService + QuotaResourceKind.Product (8 e2e)
- Phase-16F: FinanceService + QuotaResourceKind.Invoice (10 e2e)

### Stage D · 质量基线 + 债务清理 (Pulse-60 ~ Pulse-64)
- P0-001 ✅ registerPersistent 集成 (Pulse-60)
- P0-002 ✅ app-journey 66s 超时修复 (Pulse-63,5 处 assertion + Node 22 bug)
- P0-003 ✅ admin-web TSC 0 errors (Pulse-62)
- V5.1 40 人专家团机制 (Pulse-64): experts/ + docs/process/ + rfcs/voting/

### 当前测试基线
- **总测试数**: ~1700+ (含 unit + e2e + integration)
- **覆盖率**: ~85% (核心 service)
- **TSC 错误**: 0
- **P0 债务**: 0 (全部闭环)

---

## 2. 🚧 进行中阶段 (Active Stages)

### Stage E · 知识库基础 (Phase-65 ~ Phase-67)
**目标**: 建立结构化知识库,沉淀所有 phase 经验
**预计周期**: 3 个 pulse
**核心产出**:
- `knowledge/` 目录 (7 个子库)
- `dev-roadmap.md` (本文件)
- 自动化 lessons-learned 提取脚本

### Stage F · 智能化引擎 (Phase-68 ~ Phase-72)
**目标**: AI 辅助开发 + 自动 review + 智能推荐
**预计周期**: 5 个 pulse
**核心产出**:
- AI code reviewer (基于 LLM)
- 自动 e2e 生成器
- 智能 RFC 起草助手
- 业务异常自愈机制

### Stage G · 自我进化机制 (Phase-73+)
**目标**: 系统根据反馈自动调整优先级/架构
**预计周期**: 长期演进

---

## 3. 🗓️ 详细 Phase 路线图

### ✅ Phase-15 · 多租户架构 (2026-06-22 ~ 24) · 已闭环
- 关键交付: registerPersistent 守卫 / TenantQuota / TenantLifecycle
- 专家激活: E1(架构) / E2(安全)

### ✅ Phase-16 · 业务深化 (2026-06-24 ~ 25) · 已闭环
- 关键交付: Campaign/Inventory/Finance service 全部接入 quota
- 专家激活: E10(财务) / E11(店长)

### ✅ Pulse-60 ~ 64 · 质量基线 + 专家团 (2026-06-25)
- P0 全部闭环 + V5.1 专家团机制

### 🚧 Phase-17 · 营销 + 社群 (RFC R6 已通过)
- **预计开始**: 2026-06-29
- **预计结束**: 2026-07-03
- **Owner**: E4 张营销
- **核心功能**:
  - 营销活动触发 → 内容日历联动 (E15)
  - 跨门店优惠券核销 (E40 P0)
  - 社群裂变追踪 (E16)
  - 渠道招商自动化 (E24)
- **验收标准**:
  - 营销活动 e2e 测试 ≥5 个
  - 优惠券核销响应 < 200ms
  - 社群裂变追踪率 ≥95%

### ✅ Phase-18 · 体验优化 + AI 增强 (2026-06-26 闭环)
- **状态**: ✅ 完成 (Pulse-69 → Pulse-73,5 pulse)
- **Owner**: E7 孙体验 + E9 吴AI
- **核心功能**:
  - perf-monitor: 路由级 P95/P99 + SLA 监控 (T15)
  - AI Code Reviewer: 5 规则自动扫描 + ciVerdict (T17)
  - Champion Dashboard: 评分模型 (5 kind × 权重) + Grafana 6 panel (T19-T20)
  - 跨租户隔离 Lint: 3 规则 + 100 场景集成测试 (T21-T22)
  - RAG 索引器: V1 mock embedding + chunk 切分策略 (T23)
  - Phase-18 Retro: lessons + DR-005/006 + 3 patterns + 3 anti-patterns (T24)
- **成果**: 4 commits (V1-V4),+1944 行,30/30 e2e PASS,tsc 0 errors
- **关联**: [.trae/specs/phase-18-experience-ai/](.trae/specs/phase-18-experience-ai/)

### 🚧 Phase-19 · 数据驱动 + 智能化引擎 ⭐ (NEW)
- **预计开始**: 2026-07-09
- **预计结束**: 2026-07-15 (5 天,智能化阶段)
- **Owner**: E5 赵数据 + E9 吴AI
- **核心功能**:
  - **智能化 1**: AI 辅助代码补全 (Copilot-like)
  - **智能化 2**: 自动 e2e 生成器 (基于 OpenAPI)
  - **智能化 3**: 业务异常自愈 (anomaly detection + auto-rollback)
  - **数据 1**: 营销 ROI 仪表板
  - **数据 2**: 实时租户健康度评分
  - **AI 1**: 个性化推荐引擎

### 🚧 Phase-20 · 合规与审计
- **预计开始**: 2026-07-16
- **预计结束**: 2026-07-20
- **Owner**: E6 刘合规 + E36 卫审计
- **核心功能**:
  - GDPR/网络安全法 合规模块
  - 第三方审计接口
  - 监管报告自动生成

### 🚧 Phase-21+ · 远期演进
- **Phase-21**: 国际化 (i18n) + 多市场 (CN/US/EU)
- **Phase-22**: 移动原生 (React Native + 离线)
- **Phase-23**: 开放平台 (OAuth + Webhook + ISV 生态)
- **Phase-24**: 边缘计算 (Edge runtime + CDN 优化)
- **Phase-25+**: 自进化 (auto-architecture / auto-prioritize)

---

## 4. 🧠 知识库架构 (Knowledge Base)

> 创建于 Pulse-65,详细架构见 [`knowledge/INDEX.md`](knowledge/INDEX.md)

### 4.1 7 个子库
| 子库 | 内容 | 来源 |
|---|---|---|
| `lessons-learned/` | 每个 phase retro 的关键教训 | Phase retro 文档 |
| `patterns/` | 验证过的设计模式 | Phase 实施过程 |
| `anti-patterns/` | 反面教材 | Bug 复盘 |
| `expert-insights/` | 专家团反馈整合 | Standup + Weekly Memo |
| `decision-records/` | 重大架构决策 (ADR) | RFC 投票结果 |
| `best-practices/` | 编码规范 + 测试规范 | 静态分析 + review |
| `automations/` | 自动化脚本 (生成/检测/修复) | 重复任务脚本化 |

### 4.2 自动化机制
- 每个 phase 完成后,自动提取 lessons → `lessons-learned/phase-XX.md`
- 每个 bug 修复后,自动追加 anti-pattern → `anti-patterns/`
- 每个 RFC 投票后,自动追加 decision-record → `decision-records/`

---

## 5. 🤖 智能化机制 (Intelligence Engine)

### 5.1 L2 自动化能力 (Phase-19)
1. **AI Code Reviewer**
   - 输入: PR diff + 上下文
   - 输出: 风险点 + 改进建议
   - 技术: LLM + RAG (基于本仓库代码)
2. **Auto E2E Generator**
   - 输入: OpenAPI spec
   - 输出: e2e 测试用例骨架
3. **Business Anomaly Detector**
   - 输入: 业务 metrics stream
   - 输出: 异常告警 + 自动 rollback 建议
4. **Smart RFC Drafter**
   - 输入: 业务需求描述
   - 输出: RFC 草案 (基于历史 RFC 模式)

### 5.2 L3 自进化能力 (Phase-25+,远期)
1. **Auto-Architecture**: 根据专家反馈自动调整模块边界
2. **Auto-Prioritize**: 根据采纳率自动调整 phase 优先级
3. **Auto-Doc**: 自动生成/更新文档,基于代码 diff

---

## 6. 📊 度量指标 (KPIs)

### 6.1 开发效率
- **Phase 完成率**: 已闭环 phase / 总 phase (目标 ≥80%)
- **P0 闭环时间**: 从发现到闭环 (目标 ≤ 2 个 pulse)
- **测试覆盖率**: 核心 service ≥ 85%

### 6.2 智能化程度
- **AI Review 准确率**: ≥70% (false positive ≤20%)
- **自动 e2e 覆盖率**: ≥50% (auto-generated / total)
- **异常检测准确率**: ≥80%

### 6.3 知识库活力
- **每周新增 lessons**: ≥3 条
- **每周 RFC 投票**: ≥1 个
- **专家团周活跃率**: ≥30% (≥12/40 专家)

---

## 7. 🔁 反馈循环 (Feedback Loop)

```
[Phase 启动]
    ↓
[Kickoff 评审 (Owner + Champion + ≥2 Approver)]
    ↓
[实施 + 每日 standup (15 min)]
    ↓
[Mid-Phase 评审 (Reviewer + Approver)]
    ↓
[完成 + Phase Retro (Champion 主导)]
    ↓
[自动提取 lessons → knowledge/lessons-learned/]
    ↓
[同步到 experts/E*.md 反馈日志]
    ↓
[统计 → 更新评级 → 升级 Approver/Owner]
    ↓
[下个 Phase 自动应用 lessons → 智能化循环]
    ↓
[回到 Phase 启动]
```

---

## 8. 📋 关键变更日志 (Changelog)

### Pulse-65 (2026-06-25)
- ✅ 新增 dev-roadmap.md (本文件)
- ✅ 新增 knowledge/ 目录 + 7 个子库
- ⏳ 启动 Phase-17 (RFC R6 已通过)

### Pulse-64 (2026-06-25)
- ✅ V5.1 40 人专家团机制 (experts/ + process/ + rfcs/)
- ✅ P0 全部闭环

### Pulse-63 (2026-06-25)
- ✅ P0-002 app-journey 66s 修复
- ✅ W5L3 专家激活 (Node test runner + mock fetch 经验)

### Pulse-60-62 (2026-06-25)
- ✅ P0-001/003 闭环
- ✅ Phase-15/16 全部完成

---

## 9. 🔗 关联文档

- [dev-evaluation.md](dev-evaluation.md) · 综合评估 (含 Stage A-D 详细评估)
- [agent-collaboration-rfc.md](agent-collaboration-rfc.md) · RFC 协作协议
- [debt.md](debt.md) · 债务追踪
- [knowledge/INDEX.md](knowledge/INDEX.md) · 知识库索引
- [experts/INDEX.md](experts/INDEX.md) · 40 专家档案
- [docs/process/](docs/process/) · 协作流程文档

---

> 本文件由 `dev-roadmap.md` 维护,任何 phase 计划变更请同步更新
> 下次更新: 2026-06-26 (Phase-17 启动后)
