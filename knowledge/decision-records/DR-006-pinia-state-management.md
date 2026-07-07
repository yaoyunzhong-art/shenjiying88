# DR-006 · Pinia (Vue 状态管理)

> 决策日期: 2026-06-26
> 决策者: Champion (E5 赵数据 + E40 杨客户) + W3-前端 Lead
> 状态: ✅ 已通过 (Phase-12 起生效)

---

## 1. 🎯 背景

神机营 admin-web / app-web / tob-web 三个前端均需状态管理:
- 会员信息 / 权限
- 租户配置 / 多语言
- 表单 / 列表 / 详情
- 跨页面共享

---

## 2. 📋 候选方案

| 方案 | 优点 | 缺点 | 适配 |
|---|---|---|---|
| **Vuex 4** | 成熟 | 冗长 / TS 不友好 | 老项目 |
| **Pinia** ⭐ | 简洁 / TS 友好 / composition | 较新 (2020+) | 新项目 |
| Provide/Inject | 原生 | 难跨组件 | 简单场景 |
| Apollo Client | GraphQL 集成 | 需要后端 GraphQL | 暂未启用 |

---

## 3. ✅ 决策

**选用 Pinia** 作为统一状态管理方案。

**理由**:
1. **TS 友好**:类型推断完整,IDE 自动补全
2. **Composition API 风格**:与 Vue 3 setup 一致
3. **轻量**:核心 2KB,启动快
4. **模块化**:每个 store 独立,无需 namespaced
5. **DevTools 支持**:Pinia 官方 plugin
6. **测试友好**:无需 mock 复杂结构

---

## 4. 📐 实施规范

```typescript
// apps/admin-web/src/stores/member.ts
import { defineStore } from 'pinia'

export const useMemberStore = defineStore('member', () => {
  // state
  const currentMember = ref<Member | null>(null)
  const isAuthenticated = computed(() => !!currentMember.value)

  // actions
  async function login(dto: LoginDto) {
    const res = await authApi.login(dto)
    currentMember.value = res.member
    localStorage.setItem('token', res.token)
  }

  async function logout() {
    await authApi.logout()
    currentMember.value = null
    localStorage.removeItem('token')
  }

  return { currentMember, isAuthenticated, login, logout }
})
```

---

## 5. 🔗 关联

- [decision-records/](../) · 其他决策
- [best-practices/dependency-management.md](../best-practices/dependency-management.md) · Pinia 版本管理
