# DR-007 · Monorepo + Turborepo

> 决策日期: 2026-06-26
> 决策者: Champion + W1-架构 (E1 陈架构)
> 状态: ✅ 已通过 (Phase-12 起生效)

---

## 1. 🎯 背景

神机营多前端 + 后端 + 共享包:
- 3 个前端 (admin-web / app-web / tob-web)
- 1 个 API (apps/api)
- 共享 packages (types / ui / config / eslint-config)

---

## 2. 📋 候选方案

| 方案 | 优点 | 缺点 |
|---|---|---|
| **Nx** | 功能丰富 / 生态广 | 学习曲线陡 / 配置复杂 |
| **Turborepo** ⭐ | 简单 / 快速 / Vercel 出品 | 部分功能缺失 |
| **Lerna** | 经典 | 性能差 / 已不维护 |
| **多 repo** | 简单 | 共享代码难管理 |

---

## 3. ✅ 决策

**选用 Turborepo + pnpm workspace**。

**理由**:
1. **简洁**:turbo.json 配置即可,无需学习曲线
2. **性能**:增量构建 + 远程缓存
3. **pnpm 集成**:硬链接节省空间
4. **CI 友好**:turbo run build --filter=...[origin/main] 智能增量
5. **Vercel 收购**:持续投入

---

## 4. 📐 目录结构

```
shenjiying88/
├── apps/
│   ├── api/                   # NestJS API
│   ├── admin-web/             # 后台 (Vue 3 + Pinia)
│   ├── app-web/               # 会员端 (Next.js)
│   └── tob-web/               # B 端 (Vue 3)
├── packages/
│   ├── types/                 # 共享 TypeScript 类型
│   ├── ui/                    # 共享 UI 组件
│   ├── config-typescript/     # tsconfig base
│   ├── config-eslint/         # eslint config
│   └── sdk/                   # API client SDK
├── turbo.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

---

## 5. 📐 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## 6. 🔗 关联

- [decision-records/](../) · 其他决策
- [knowledge/INDEX.md](../../INDEX.md) · 知识库总览
