# Lessons Learned · Pulse-60 (Phase-15E registerPersistent 修复)

> 创建: 2026-06-26 · Pulse-68 大批量扩充
> 范围: Pulse-60 (2026-06-25 00:07) 22 fail → 全绿 闭环
> 关联: phase-15.md · pulse-59.md · pulse-63.md

---

## 1. 🎯 背景

Pulse-59 (2026-06-24 21:14) 发现 22 fail 大范围回归 + TSC 10 error,Pulse-60 (2026-06-25 00:07) 修复闭环。

---

## 2. 📊 数字

- **22 fail** → **0 fail** ✅
- **10 TSC error** → **0 error** ✅
- **修复时间**: ~3 小时
- **修复方法**: 3 只树哥 (sub-agent) + 1 次手动修复

---

## 3. 📚 Lessons (3)

### Lesson 1: 大范围回归 = TypeORM 升级或主依赖变更

**现象**: 一次性 22 fail 通常是底层依赖变更引起。

**检查清单**:
- [ ] package.json / pnpm-lock.yaml 变更
- [ ] TypeORM / NestJS 版本升级
- [ ] Node.js 版本升级
- [ ] 共享 package (`@m5/types`) 变更

**缓解**:
- CI 自动依赖更新 (Dependabot)
- 主依赖升级前在 staging 验证

---

### Lesson 2: 树哥 (sub-agent) 并行修复效率高

**做法**:
- 把 22 fail 按模块分组
- 每个树哥负责一个模块的修复
- 并行执行,主 agent 汇总

**收益**:
- 22 fail 修复从 ~6h (串行) → ~3h (并行)
- 单测 / TSC 修复可分离

---

### Lesson 3: 修复后必须全量回归

**做法**: 修复一个模块立即跑全套测试,避免累积回归。

**CI 强制**:
- [ ] PR 必跑全套测试
- [ ] 修复后单独跑一遍 vitest + tsc + lint
- [ ] 主分支 green 必须

---

## 4. 🔗 关联

- [phase-15.md](./phase-15.md) · registerPersistent + quota 守卫
- [pulse-63.md](./pulse-63.md) · P0-002 app-journey 修复
- [debt.md P0-001](../../debt.md) · 22 fail 回归记录
