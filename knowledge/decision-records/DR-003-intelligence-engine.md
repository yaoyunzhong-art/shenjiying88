# Decision Record · DR-003 智能化引擎 Phase-19 计划

> 创建日期: 2026-06-25
> 来源: extract-knowledge.py 自动补全

> 决策日期: 2026-06-25
> 决策者: E5 赵数据 + E9 吴AI + E1 陈架构
> 关联 Phase: Phase-19 (预计 2026-07-09 启动)

## 背景
用户要求"系统要能够不断学习,不断进化,高度智能化"。

当前 L1 (辅助型) 已达 (Copilot-like 补全),但缺 L2 (自动化) + L3 (自进化)。

## 决策
Phase-19 启动智能化引擎,投入 5 天 (比其他 phase 长 1 天):

### L2 自动化能力 (Phase-19 目标)
1. **AI Code Reviewer**
   - 输入: PR diff + 上下文 (知识库检索)
   - 输出: 风险点 + 改进建议
   - 技术: LLM + RAG 基于本仓库代码
2. **Auto E2E Generator**
   - 输入: OpenAPI spec
   - 输出: e2e 测试用例骨架
3. **Business Anomaly Detector**
   - 输入: 业务 metrics stream
   - 输出: 异常告警 + auto-rollback 建议
4. **Smart RFC Drafter**
   - 输入: 业务需求描述
   - 输出: RFC 草案 (基于历史 RFC 模式)

### L3 自进化能力 (Phase-25+ 远期)
1. **Auto-Architecture**: 根据专家反馈自动调整模块边界
2. **Auto-Prioritize**: 根据采纳率自动调整 phase 优先级
3. **Auto-Doc**: 自动生成/更新文档

## 理由
1. **学习闭环**: 每个 phase retro → 自动提取 lessons → 自动应用到下个 phase
2. **专家团放大**: AI 帮专家处理重复工作,专家专注创意
3. **规模化**: L2 自动化能力让团队规模缩小时仍能产出
4. **差异化**: 神机营 SaaS 智能化是核心竞争力

## 后果
- 5 天 phase,需要更多 Owner (E5 + E9 + E1 三 Owner)
- 需引入 LLM API (OpenAI / Claude / Qwen)
- 知识库需扩展 (RAG 用)
- E5/E9 需从 Approver 升级到 Owner

## 风险
1. **LLM 成本**: $XXX/月 (待估算)
2. **误判**: AI reviewer 准确率 < 70% 会拖累团队
3. **依赖**: 外部 API 故障会影响开发流程

## 缓解措施
- 先小范围试点 (Phase-19 早期只对 1-2 个 PR 用 AI review)
- 监控准确率,低于 70% 自动降级 (关闭 AI reviewer)
- 准备 LLM 替代方案 (Qwen / GLM)

## 关联文档
- [dev-roadmap.md](../../dev-roadmap.md) · Stage F
- [dev-evaluation.md](../../dev-evaluation.md) · Stage F 评估
- [experts/INDEX.md](../../experts/INDEX.md) · E5/E9/E1 关注点
