# Day13 L4: G4 污染最终清理（调试残留收敛）

**日期:** 2026-07-25  
**层级:** L4 - 质量守卫  
**边界:** apps/admin-web/ apps/tob-web/ apps/storefront-web/  
**⚠️ 不触碰:** apps/api/

---

## 调查结果

### 初始扫描
| 模式 | storefront | admin | tob | 合计 |
|------|-----------|-------|-----|------|
| console.log | 108 | 89 | 1 | 198 |
| debugger/eval | - | - | - | 49 |

### 深度分析
经过 `grep -v "\.test\."` 过滤测试文件后发现：

| 模式 | 非测试文件实际残留 | 说明 |
|------|-------------------|------|
| console.log | **0** | 全部 198 条均在 `*.test.tsx` 中，为代码质量断言检查 |
| debugger | **0** | 全部 49 条均在测试文件中 |
| eval() | **0** | 同上 |

**结论：Day12清理已将生产代码中的 console.log/debugger 清零。L1 扫描的 198 条命中全部是测试文件的 lint 检查代码，非污染。**

### 额外发现：ungated console.error/warn

进一步扫描发现 2 个前端项目存在 **未加环境门控的 console.error/warn**，虽然在生产构建中可能被 tree-shake，但遵循代码规范应统一 gating：

## 修复清单

| # | 文件 | 原始 | 修复 |
|---|------|------|------|
| 1 | `storefront-web/app/member-card/page.tsx:380` | `console.error('Load data error:', error)` | `if (NODE_ENV === 'development')` 包裹 |
| 2 | `admin-web/app/recommendations/page.tsx:291` | `console.error('[recommendations] fetch summary failed:', err)` | `if (NODE_ENV === 'development')` 包裹 |
| 3 | `admin-web/app/recommendations/page.tsx:318` | `.catch(err => console.error(...))` | `if (NODE_ENV === 'development')` 包裹 |
| 4 | `admin-web/app/reports/page.tsx:127` | `.catch((e) => console.error(...))` | `if (NODE_ENV === 'development')` 包裹 |
| 5 | `admin-web/app/intelligence/monitor/page.tsx:66` | `console.warn("[monitor] API不可用...")` | 追加 `&& NODE_ENV === 'development'` |
| 6 | `admin-web/app/stores/[id]/orders/page.tsx:61` | `console.warn('[OrdersPage] SDK fetch failed...')` | `if (NODE_ENV === 'development')` 包裹 |

## TSC 验证

```bash
# admin-web: 仅 1 个预存错误（admin-permission-gate 模块缺失），与本次修复无关
apps/admin-web $ npx tsc --noEmit → PASS (pre-existing:1, our-change:0)

# storefront-web
apps/storefront-web $ npx tsc --noEmit → PASS (clean)
```

## 最终确认

```bash
# 非测试文件中的 console.log: 0
# 非测试文件中的 ungated console.error/warn: 0
# 非测试文件中的 debugger: 0
```

## 总结

- **L1 扫描误报原因：** 测试文件中包含 `assert.ok(!src.includes('console.log('))` 等 lint 检查规则，被 grep 计入
- **实际修复：** 6 个 ungated console.error/warn → dev-mode gated，对齐项目已有的 `console.debug` 模式
- **代码规范：** 所有非测试生产代码的 console 语句均已 dev-mode gated，无 debug 残留泄漏到生产环境
