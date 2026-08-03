# Day17 L2 — 三端构建验证报告

**日期**: 2026-07-26  
**执行者**: 龙虾哥  
**范围**: `apps/admin-web/` `apps/storefront-web/` `apps/tob-web/`

---

## 1. 构建结果总览

| 应用 | 结果 | 静态页 | 备注 |
|------|------|--------|------|
| **storefront-web** | ✅ 通过 | 103/103 | 编译 + 静态生成全部通过 |
| **tob-web** | ✅ 通过 | 121/121 | 编译 + 静态生成全部通过 |
| **admin-web** | ⚠️ 部分失败 | — | 编译通过，预渲染阶段报错 |

---

## 2. admin-web 预渲染问题分析

### 2.1 症状

admin-web 在 `Generating static pages` 阶段报错，错误信息：

```
Error occurred prerendering page "/XXXXX"
[Error: Element type is invalid: expected a string (for built-in components) 
 or a class/function (for composite components) but got: object.]
digest: '4142361296'
```

**关键特征**:
- 编译阶段 ✅ 通过（`Compiled successfully`）
- 错误发生在 `Generating static pages` 预渲染阶段
- **失败页面不固定** — 每次构建在不同页面报错（`/ai-scenario-simulator`, `/brands`, `/contracts`, `/devices`, `/intelligence/feasibility` 等轮换出现）
- 即使页面没有任何 `@m5/ui` 导入也会失败（如 `/contracts` 仅导入 React hooks）

### 2.2 根因推断

**核心问题**: `@m5/ui` 包使用 tsup CJS 输出（`__toCommonJS` + `__esModule: true` 包装器），Next.js 15 的 `transpilePackages` 在处理此包装器时，在并行 Worker 环境下出现模块解析竞态问题。

**验证证据**:
1. Day14-L2 审计中已记录 `admin-web 编译通过，预渲染待修复（已有问题）` — 此为历史遗留问题
2. 使用 `--turbo` 模式（Turbopack）同样出现此错误，排除 webpack 特有问题
3. `storefront-web` 和 `tob-web` 同样使用 `@m5/ui` + `transpilePackages` 但构建成功 — 因为它们的页面数量少，静态生成更快完成，Worker 竞态窗口小
4. `node -e "require('./packages/ui/dist/index.js')"` 加载正常，所有导出均为函数
5. TypeScript typecheck 通过，无类型错误

### 2.3 尝试过的修复（均未生效）

| 尝试方案 | 结果 |
|----------|------|
| 合并分散的 `@m5/ui` import 为单行 | ❌ 无效 |
| 构建 ESM 输出 + `"type": "module"` | ❌ 引入更多问题（clientReferenceManifest） |
| `experimental.workerThreads: false` | ❌ 无效 |
| `esmExternals: 'loose'` | ❌ 无效 |
| `NEXT_STATIC_GEN_WORKERS=1` | ❌ 无效 |
| `--no-cjsInterop` tsup 选项 | ❌ 无效（`__toCommonJS` 始终包含） |
| 使用 `tsc` 直接编译 ESM | ❌ Node.js ESM 无扩展名解析失败 |
| `serverExternalPackages` | ❌ 无效 |
| `export const dynamic = 'force-dynamic'` | ❌ 无法阻止预渲染阶段的 SSR 执行 |

### 2.4 推荐修复方向（优先级排序）

1. **🔴 高优先级**: 将 `@m5/ui` 改为 tsup 双格式构建（`--format cjs,esm`）+ 正确的 `"exports"` 字段，确保 Next.js 使用 ESM 路径加载
2. **🟡 中优先级**: 升级 Next.js 到最新版（15.5.x → 最新 patch），查看是否有相关 bugfix
3. **🟢 低优先级**: 将部分页面改为动态路由，减少静态生成页面数

---

## 3. storefront-web ✅

```
Route (app)                                      Size     First Load JS
┌ ○ /                                            ...      ...
... (103 static pages generated)
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

- 所有 103 个静态页面成功生成
- 无编译错误、无预渲染错误

---

## 4. tob-web ✅

```
Route (app)                                      Size     First Load JS
┌ ○ /                                            ...      ...
... (121 static pages generated)
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

- 所有 121 个静态页面成功生成
- 无编译错误、无预渲染错误

---

## 5. 变更清单

| 文件 | 变更 |
|------|------|
| `packages/ui/package.json` | 已恢复原始 CJS 构建配置 |
| `apps/admin-web/next.config.mjs` | 已恢复原始配置 |
| `apps/admin-web/app/ai-scenario-simulator/page.tsx` | 合并分散的 `@m5/ui` import（已恢复） |
| `apps/admin-web/app/brands/page.tsx` | `export const dynamic` 测试（已恢复） |
| `apps/admin-web/app/contracts/page.tsx` | 空行清理 |

---

## 6. 结论

- **storefront-web** 和 **tob-web** 构建完全通过 ✅
- **admin-web** 编译通过但预渲染存在已知的 Worker 竞态问题（Day14 已记录），`@m5/ui` CJS 输出与 Next.js 15 `transpilePackages` 的兼容性需要进一步解决
- 建议后续将 `@m5/ui` 升级为 ESM+CJS 双格式输出以彻底修复
