# Lessons Learned · Pulse-64 (V5.1 40 专家团启动)

> 创建: 2026-06-26 · Pulse-68 大批量扩充
> 范围: Pulse-64 (2026-06-25) V5.1 40 专家团机制建立
> 关联: experts/INDEX.md · docs/process/expert-rating.md · rfcs/voting/

---

## 1. 🎯 背景

Pulse-64 建立 V5.1 40 人专家团 + 5 级评级体系 + RFC 投票机制。

---

## 2. 📊 数字

- **40 专家档案** (E1~E40) ✅
- **5 级评级体系** (Observer/Reviewer/Approver/Owner/Champion) ✅
- **RFC 模板 + 投票流程** ✅
- **4 文件**: experts/INDEX.md + docs/process/expert-rating.md + rfcs/voting/template.md

---

## 3. 📚 Lessons (3)

### Lesson 1: 启动期 0 Champion 是真实困境

**困境**:
- V5.1 设计要求 Champion 联名提名
- 启动时无 Champion → 死锁

**解决**:
- 跨级特殊路径 (Observer → Champion,用户直批 + 1 月试用)
- 后续 Champion 任命必须经现有 Champion 联名

---

### Lesson 2: 5 级评级需要清晰升级路径

| 当前级别 | 升级目标 | 路径 |
|---|---|---|
| Observer | Reviewer | 提交 ≥3 feedback |
| Reviewer | Approver | ≥2 Approver 联名 |
| Approver | Owner | 主导 1 phase 完整生命周期 |
| Owner | Champion | ≥2 Champion 联名 |

---

### Lesson 3: 知识库是专家团运转的基石

**实践**:
- 专家决策依据 → knowledge/patterns
- 专家审查参考 → knowledge/best-practices
- 专家避坑参考 → knowledge/anti-patterns

**Insight**: 没有知识库的专家团 = 没有记忆的评审会

---

## 4. 🔗 关联

- [experts/INDEX.md](../../experts/INDEX.md) · 40 专家档案
- [docs/process/expert-rating.md](../../docs/process/expert-rating.md) · 评级
- [knowledge/INDEX.md](../INDEX.md) · 知识库
