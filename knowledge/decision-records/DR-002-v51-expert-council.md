# Decision Record · DR-002 V5.1 40 人专家团机制

> 创建日期: 2026-06-25
> 来源: extract-knowledge.py 自动补全

> 决策日期: 2026-06-25
> 决策者: 用户 + main agent
> 关联 Pulse: Pulse-64

## 背景
原 V4 编制是 W-L 工作流矩阵 (40 抽象技术岗位),但用户提出新需求:
1. 系统使用方 (专家团) 应同时是产品设计者 + 产品经理
2. 专家团应在开发的事前-事中-事后深度参与
3. 系统应不断学习+进化

## 决策
升级到 V5.1 编制:**E1-E40 业务专家团**

1. **40 个具名业务专家** (不是抽象岗位)
   - 覆盖 8 大领域: 架构/安全/营销/数据/财务/UX/租户/高层
   - 每个专家有姓名 + 编号 + 领域 + 初始级别
2. **5 级评级体系**: Observer / Reviewer / Approver / Owner / Champion
3. **3 反馈渠道**: Morning Voice / Weekly Memo / Emergency Veto
4. **RFC 投票机制**: ≥3 Approver 同意 + 0 Champion 否决

## 理由
1. **业务深度**: 具名专家有真实业务经验,能识别纯技术视角盲点
2. **事前参与**: RFC 投票让专家在开发前介入,避免做错
3. **事中监控**: standup 让专家每日跟踪进度
4. **事后沉淀**: retro 让经验沉淀到 `experts/E*.md` 反馈日志
5. **进化机制**: Phase 完成后自动应用 lessons → 智能化循环

## 后果
- ✅ 40 个 `experts/E*.md` 档案已生成
- ✅ `docs/process/` 协作流程已建立 (standup/phase-review/expert-rating)
- ✅ `rfcs/voting/` RFC 投票机制已建立
- ✅ RFC R6 (Phase-17 计划) 试运行投票通过
- ⏳ 35 位专家尚未启用,需 Pulse-65 唤醒

## 备选方案 (否决)
1. **保持 V4 W-L 矩阵**: ❌ 不能反映真实业务
2. **外部 Slack 群投票**: ⚠️ 反馈难追溯,无版本控制
3. **Jira + Confluence**: ⚠️ 过度工程化

## 关联文档
- [.trae/specs/expert-council-empowerment/spec.md](../../.trae/specs/expert-council-empowerment/spec.md)
- [experts/INDEX.md](../../experts/INDEX.md)
- [docs/process/daily-standup.md](../../docs/process/daily-standup.md)
