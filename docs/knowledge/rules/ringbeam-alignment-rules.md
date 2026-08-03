# 🔩 圈梁对齐四道箍原则（树哥必读）

> 大飞哥硬性指令 · 2026-07-17 21:40 · 所有树哥必须遵守

## 核心原则

**每次新建/修改代码文件后，必须同步更新圈梁表。**

## 四道箍

| 箍 | 含义 | 验收标准 |
|:--:|:-----|:---------|
| 🟢 代码 | 代码本身正确、TSC通过 | `tsc --noEmit` 零错误 |
| 🟢 测试 | 有对应的测试文件 | 新建页面必须有 `page.test.ts(x)` 或 `.test.ts` |
| 🟢 审计 | 变更在圈梁表中记录 | 更新 `alignment-final-YYYY-MM-DD.md` 或 `phase-to-module-mapping.md` |
| 🟡 PRD | 页面/模块有PRD映射 | 新建页面需在24h内补充PRD摘要卡 |

## 具体执行规则

### 1. 新建页面
```
cd apps/admin-web/app/<page>/
├── page.tsx          # 服务端组件 + ErrorBoundary + Suspense
├── page.test.tsx     # 测试文件 (L1冒烟)
└── <page>-client.tsx # 客户端组件 (可选)
```
**必须做：**
- ✅ 写入 `phase-to-module-mapping.md` → 绑定到对应Phase
- ✅ 更新 `alignment-final-YYYY-MM-DD.md` → 记录新建页变更
- 🔴 标记PRD状态为待补充

### 2. 修改现有页面
- ✅ 在 `alignment-progress-YYYY-MM-DD.md` 记录修改内容
- ✅ 更新四道箍状态

### 3. 新增E2E验收链
- ✅ 在 `alignment-final-YYYY-MM-DD.md` 记录链号、覆盖Phase、测试数
- ✅ 更新 `phase-progress.md` 中的E2E链计数

### 4. 新增API模块
- ✅ 更新 `phase-to-module-mapping.md` 文件数/测试数
- ✅ 检查并更新圈梁基线 `code-ringbeam-alignment.md` 或 `code-ringbeam-alignment-v2.md`

## 反模式
| ID | 反模式 | 后果 |
|:--:|:-------|:-----|
| AM-050 | 新建页面不更新圈梁表 | 圈梁逐渐偏离真实现状，PRD映射缺失 |
| AM-051 | 测试文件先于页面存在但页面更新后不同步 | 测试假阳性(引用了不存在的page.tsx) |

## 快速检查清单
每次commit前：
```
[ ] TSC通过 (pnpm turbo typecheck --filter=@m5/admin-web...)
[ ] 测试文件存在 (page.test.tsx或.test.ts)
[ ] 圈梁表已更新 (phase-to-module-mapping.md 或 alignment-final-*.md)
[ ] PRD状态已标记 (新建页=🔴 改现状页面=已有标签)
```
