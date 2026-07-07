# Lessons Learned · Pulse-66 (Stage E 收尾 + Phase-17 Spec)

> 创建: 2026-06-26 · Pulse-68 大批量扩充
> 范围: Pulse-66 (2026-06-26) Stage E 收尾 + Phase-17 Spec 三件套
> 关联: .trae/specs/phase-17-marketing-community/ · rfcs/voting/R6-phase-17.md

---

## 1. 🎯 背景

Pulse-66 完成 Stage E 收尾 + 知识库 lint 清零 + Phase-17 Spec 编写。

---

## 2. 📊 数字

- **知识库 lint**: 34 errors → 0 ✅
- **Phase-17 Spec 三件套**: spec.md + tasks.md + checklist.md
- **RFC R6** Phase-17 计划通过 (4.5 权重)

---

## 3. 📚 Lessons (3)

### Lesson 1: 知识库 lint 必须自动化

**做法**:
- CI 检查 kebab-case 命名
- CI 检查 frontmatter 完整性
- CI 检查内链有效性
- pre-commit hook 本地预检

**收益**:
- 知识库格式一致
- 无人工 review 格式
- 新人提交自动合规

---

### Lesson 2: Spec 模式三件套 = 启动加速器

**结构**:
- spec.md: 13 任务 P0~P2 描述
- tasks.md: Pulse-68~71 时间表
- checklist.md: 20 AC + 7 KPI
- kickoff.md: 启动指南 (后续补充)

**价值**:
- 新人快速了解 phase
- Approver 评审有标准
- 实施不再"边做边想"

---

### Lesson 3: RFC 投票 = 决策可追溯

**实践**:
- V5.1 RFC 模板标准化
- 投票明细按时间倒序
- Champion veto 可推翻 (≥2 Owner)
- 归档到 voting-record.md

**收益**:
- 决策历史可查
- 异议有渠道表达
- 团队共识建立

---

## 4. 🔗 关联

- [.trae/specs/phase-17-marketing-community/](../../.trae/specs/phase-17-marketing-community/) · Phase-17 三件套
- [rfcs/voting/R6-phase-17.md](../../rfcs/voting/R6-phase-17.md) · RFC R6
- [pulse-67.md](./pulse-67.md) · Approver/Champion 招募
