# Lessons Learned · Pulse-67 (Approver/Champion 招募 + lint CI)

> 创建: 2026-06-26 · Pulse-68 大批量扩充
> 范围: Pulse-67 (2026-06-26) Approver/Champion 招募 + 知识库 lint CI
> 关联: rfcs/voting/R7-approver-appointment.md · .github/workflows/knowledge-lint.yml

---

## 1. 🎯 背景

Pulse-67 启动 R7 (8 Approver 候选) + R8 (2 Champion 候选) 72h 投票 + 知识库 lint CI 接入。

---

## 2. 📊 数字

- **R7**: 8 Approver 候选 (E1/E6/E9/E10/E16 立即 + E2/E4/E5 候补)
- **R8**: 2 Champion 候选 (E5 + E40 跨级)
- **5 Approver 实际任命** (待 R7 通过)
- **2 Champion 任命** (待 R8 通过)
- **lint CI**: GitHub Actions + pre-commit hook 完整

---

## 3. 📚 Lessons (3)

### Lesson 1: 跨级任命必须有"特殊路径"理由

**困境**: V5.1 设计要求 Champion 联名,启动期 0 Champion 死锁。

**解决**:
- 用户直批 (因 0 Champion 启动期)
- 1 个月试用期
- 后续任命必须经现有 Champion 联名

---

### Lesson 2: lint 必须三层防护

**层级**:
1. **本地**: pre-commit hook (立即反馈)
2. **CI**: GitHub Actions (合并前)
3. **Cron**: 定期扫描 (发现漂移)

**收益**: 知识库格式 100% 一致

---

### Lesson 3: RFC 投票窗口 72h 是平衡点

**考量**:
- < 24h: 太急,Approver 无法充分评估
- > 7d: 拖延,阻塞实施
- **72h**: 给 Approver 充足时间 (周末也能 cover)

---

## 4. 🔗 关联

- [rfcs/voting/R7-approver-appointment.md](../../rfcs/voting/R7-approver-appointment.md) · R7 RFC
- [rfcs/voting/R8-champion-appointment.md](../../rfcs/voting/R8-champion-appointment.md) · R8 RFC
- [docs/process/voting-record.md](../../docs/process/voting-record.md) · 投票历史
- [pulse-68.md](./pulse-68.md) · 后续等待期
