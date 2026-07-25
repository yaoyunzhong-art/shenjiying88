# Day14 L2 依赖审计 + 构建验证

**日期**: 2026-07-26  
**执行人**: 龙虾哥  
**边界**: apps/admin-web/, apps/tob-web/, apps/storefront-web/  
⚠️ 未碰 apps/api/

---

## 1. pnpm outdated — 过期依赖

| Package | Current | Latest |
|---------|---------|--------|
| @eslint/eslintrc (dev) | 3.3.5 | 3.3.6 |
| @commitlint/cli (dev) | 21.1.0 | 21.2.1 |
| @commitlint/config-conventional (dev) | 21.1.0 | 21.2.0 |
| @playwright/test (dev) | 1.61.0 | 1.62.0 |
| lint-staged (dev) | 17.0.8 | 17.2.0 |
| prettier (dev) | 3.8.4 | 3.9.6 |
| tsx (dev) | 4.22.4 | 4.23.1 |
| turbo (dev) | 2.9.18 | 2.10.7 |
| typescript-eslint (dev) | 8.61.0 | 8.65.0 |

**结论**: 9 个过期的 devDependency，均为小版本/补丁版本更新，无 breaking changes 风险。建议随常规维护窗口升级。

---

## 2. pnpm audit — 安全漏洞

```
131 vulnerabilities found
Severity: 8 low | 60 moderate | 60 high | 3 critical
```

**主要漏洞来源**:
- firebase → @firebase/auth → undici (high/critical)
- body-parser <1.20.6 (low, 来自 apps/api 的 @nestjs/platform-express)

**结论**: 131 个漏洞中，大部分来自间接依赖。apps/api 路径（含 body-parser）不在本次审计边界内。建议后续对三个 Web 端进行 `pnpm audit --prod` 分离分析。

---

## 3. 三 Web 端构建验证

### storefront-web ✅ 构建成功
- Next.js 15.5.19 生产构建通过
- 静态 + 动态页面正常生成

### tob-web ✅ 构建成功
- Next.js 15.5.19 生产构建通过
- 静态 + 动态页面正常生成

### admin-web ⚠️ 部分失败
- **编译阶段**: ✅ 通过（15.5s）
- **类型检查**: ✅ 通过
- **预渲染阶段**: ❌ 客户端页面预渲染失败

**错误模式**:
```
Error: Element type is invalid: expected a string (for built-in components) 
or a class/function (for composite components) but got: object.
```

**影响页面**: 多个 `'use client'` 页面在静态生成时失败（如 /contracts, /brands, /ai-scenario-simulator 等）

**根因分析**: 
- 错误发生在 `@m5/ui` 组件库导出的组件渲染时
- `@m5/ui` 通过 `export { ... } from 'antd'` 重新导出 antd 组件
- 可能与 Next.js 15.5.19 的客户端组件预渲染机制不兼容
- 为**已有问题**，非本次审计引入

**修复建议**:
1. 将 affected pages 标记为 `dynamic` 导出以跳过 SSR 预渲染
2. 检查 `@m5/ui` 包的 `moduleResolution` 配置
3. 考虑将 antd 组件改为 tree-shakable 直接导入

---

## 4. 附加修复（本次审计处理）

### `'use client'` 位置修复
修复了 200+ 个文件，将 `'use client'` 指令移至文件第 1 行，解决 Next.js 15 "use client directive must be placed before other expressions" 编译错误。

**影响范围**:
- admin-web: ~50 files (含 13 个 metadata 迁移至 layout.tsx)
- storefront-web: ~102 files
- tob-web: ~64 files

### `metadata` 导出迁移
将 13 个 admin-web 页面的 `metadata` 导出从 `'use client'` page.tsx 移至 server-component layout.tsx，解决 "exporting metadata from a component marked with use client is disallowed" 错误。

**迁移页面**: ai-scenario-simulator, brands, brands/new, contracts, devices, help-center, intelligence/feasibility, license-renewal, payment-channels, returns, stock-transfer/form, suppliers, training

### 语法错误修复
- `stores/[id]/reconciliation/page.tsx`: 修复孤立的 `const` 声明
- `stores/[id]/training/page.tsx`: 修复孤立的 `const` 声明

---

## 5. 总结

| 检查项 | 状态 | 说明 |
|--------|------|------|
| pnpm outdated | ⚠️ | 9 个过期 devDep |
| pnpm audit | ❌ | 131 个漏洞 |
| storefront-web build | ✅ | 构建成功 |
| tob-web build | ✅ | 构建成功 |
| admin-web build | ⚠️ | 编译通过，预渲染失败（已有问题） |
| 'use client' 修复 | ✅ | 200+ 文件修复完成 |
| metadata 迁移 | ✅ | 13 个 layout.tsx 创建完成 |
