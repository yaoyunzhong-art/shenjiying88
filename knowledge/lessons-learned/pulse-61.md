# Lessons Learned · Pulse-61 (P0-003 admin-web TSC 修复)

> 创建: 2026-06-26 · Pulse-68 大批量扩充
> 范围: Pulse-61 (2026-06-25 21:37) admin-web TSC 16 error → 闭环
> 关联: pulse-60.md · pulse-63.md

---

## 1. 🎯 背景

Pulse-61 (2026-06-25 21:37) admin-web TSC 16 error 修复。

---

## 2. 🔧 修复

- markets + notifications-data 测试泛型化
- 可选链 (optional chaining) 替代 `&&` 链
- 类型守卫 (type guards) 替代 `as` 断言

---

## 3. 📚 Lessons (2)

### Lesson 1: 测试代码也需严格类型

**现象**: 测试中 `as any` 堆积 → 失去类型保护。

**正确做法**:
```typescript
// ✅ 正确: 泛型测试
function createMockMarket(overrides?: Partial<Market>): Market {
  return { id: 'm1', name: 'Test', ...overrides }
}

// ❌ 反例: any
const market = { ... } as any
```

---

### Lesson 2: 可选链 > && 链

**现象**:
```typescript
// ❌ 旧写法
const name = user && user.profile && user.profile.name

// ✅ 新写法
const name = user?.profile?.name
```

**收益**:
- 代码简洁
- 类型推断正确
- TS 自动处理 null/undefined

---

## 4. 🔗 关联

- [best-practices/testing-strategy.md](../best-practices/testing-strategy.md) · 测试策略
- [pulse-63.md](./pulse-63.md) · P0-002 lessons
