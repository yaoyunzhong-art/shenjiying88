# Day19 L1: 前端性能 + Bundle 分析

> 🦞 龙虾哥 · 2026-07-26  
> 范围: `apps/admin-web/` `apps/tob-web/` `apps/storefront-web/`

---

## 1. 审计概览

| 维度 | 度量 | 评级 |
|------|------|------|
| 超大组件 (>20KB) | 0 个 | ✅ |
| 大组件 (>10KB) | 2 个 (locale-provider, h5-components) | ⚠️ |
| 懒加载 (next/dynamic) | 0 处 | 🔴 |
| Suspense 流式渲染 | 57 处 import | ✅ |
| force-dynamic 页面 | 15 个 | ⚠️ |
| 超大静态图片 (>500KB) | 0 张 | ✅ |
| 图片资源总量 | 7.1MB (全部 JPG) | ⚠️ |
| next/image 使用 | 5 处 | ⚠️ |
| optimizePackageImports | 仅 admin-web 配置 | ⚠️ |
| splitChunks 分包 | 仅 admin-web 配置 | ⚠️ |

---

## 2. 大组件分析

### 2.1 无超大组件 (>20KB) ✅

三个项目的 components 目录均无超过 20KB 的单个 TSX 文件。单文件拆分边界良好。

### 2.2 中等大组件 (>10KB) — 2 个 ⚠️

| 组件 | 行数 | 位置 | 问题 |
|------|------|------|------|
| `h5-components.tsx` | 511 行 | storefront-web | **胖组件**: 单文件导出 8 个组件 (MobileLayout, TabBar, Card, Button, Input, Select, Badge, Loading)，建议拆分为独立文件 |
| `locale-provider.tsx` | 288 行 | tob-web | **翻译资源内联**: 9 种语言的翻译字典直接写在组件文件内，应按语言拆分 + 按需加载 |

**建议**:
- `h5-components.tsx` → 拆为 `components/h5/` 目录，每个组件独立文件
- `locale-provider.tsx` → 翻译 JSON 移至 `lib/i18n/` 按 locale 拆分，组件只保留 Context + Hook

---

## 3. 懒加载与代码分割

### 3.1 next/dynamic 懒加载: 0 处 🔴

三个 app 目录中**完全没有使用** `next/dynamic` 或 `React.lazy`。所有页面/组件均为静态导入，首屏 JS 体积可能较大。

**建议**:
- 非首屏的重组件（图表、编辑器、AI 对话面板）用 `next/dynamic(() => import(...), { ssr: false })` 懒加载
- Dashboard → 卡片组件懒加载
- AI Scenario Simulator → 懒加载
- 集成编排事件详情 → 懒加载

### 3.2 Suspense 流式渲染: 57 处 ✅

admin-web 已较完善使用 Suspense 包裹异步数据区域（rate-limits、configuration、integration-orchestration 等页面）。

**覆盖率**: admin-web 使用良好，tob-web / storefront-web 使用较少。

### 3.3 force-dynamic 页面: 15 个 ⚠️

全部在 admin-web，包括 dashboard、agents、rate-limits、audit-trail 等核心页面。这些页面每次请求都动态渲染，不走 SSG/ISR 缓存。

**建议**: 对于非实时数据的页面（如 configuration、knowledge），可改为 ISR (`revalidate: 60`)。

---

## 4. 静态资源分析

### 4.1 图片资源: 7.1MB，全 JPG 格式 ⚠️

tob-web 的 `public/images/` 目录 7.1MB，约40+张产品/场景图，**全部为 JPG 格式，无 WebP/AVIF 转换**。每张约 172KB。

| 分级 | 数量 | 问题 |
|------|------|------|
| products/ | ~35 张 | 产品展示图 172KB×35 ≈ 6MB |
| scenes/ | 4 张 | 场景图 |
| solutions/ | 4 张 | 解决方案图 |
| hero/ | 2 张 | 首屏大图 |
| contact/ | 2 张 | 联系我们 |
| partners/ | 2 张 | 合作伙伴 |

**严重问题**:
1. ❌ 无 WebP/AVIF 格式 — 现代浏览器压缩率可减少 50-70%
2. ❌ 首屏 hero 图未优先加载
3. ❌ 图片无响应式多尺寸 (srcset)
4. ⚠️ 大部分 <img> 标签（17处），仅 5 处使用 next/image

**建议**:
```bash
# 批量转 WebP（质量 80%, 预期减小 50-60%）
for f in apps/tob-web/public/images/**/*.jpg; do
  cwebp -q 80 "$f" -o "${f%.jpg}.webp"
done
```
或使用 Next.js 内置图片优化 (`next/image` 自动生成 WebP/AVIF)。

### 4.2 无超大图片 ✅

所有图片均在 500KB 以内，无超大单图。

---

## 5. Bundle 优化配置

### 5.1 admin-web: 有性能配置但未启用 ⚠️

`next.config.performance.js` 包含完整的优化配置（splitChunks、optimizePackageImports、图片格式、缓存头），但**主 config 未引用它**：

```js
// next.config.mjs 第1-2行 — 没有 require('./next.config.performance.js')
import path from 'node:path';
import { fileURLToPath } from 'node:url';
```

**绩效配置中的优化项**:
- ✅ `optimizePackageImports: ['antd', '@ant-design/icons', 'lodash', 'date-fns']` — Tree-shaking 增强
- ✅ `splitChunks` — React/router/ui/utils/vendors/common 分层分包
- ✅ 静态资源长期缓存头 (1年 immutable)
- ✅ 图片格式优先 AVIF → WebP
- ✅ 压缩/console移除

### 5.2 tob-web / storefront-web: 无 bundle 优化 🔴

两个项目的 `next.config.mjs` 只有基础配置（standalone输出 + 安全头），缺少：
- `optimizePackageImports`
- `splitChunks`
- 静态资源缓存头
- 图片优化配置

---

## 6. 综合评分

| 维度 | 得分 | 说明 |
|------|------|------|
| 组件拆分 | 7/10 | 无超大组件，但有胖组件待拆 |
| 懒加载 | 2/10 | 零使用，所有组件静态导入 |
| 流式渲染 | 7/10 | admin-web 用得好，tob/storefront 少 |
| 图片优化 | 3/10 | 全 JPG，无 WebP，少 next/image |
| Bundle 配置 | 4/10 | admin-web 有绩效配置但未启用，tob/storefront 无 |
| 缓存策略 | 3/10 | 仅 admin-web 绩效配置中有（未启用） |
| **综合** | **4.3/10** | 🟡 需要体系化优化 |

---

## 7. 优先修复清单

### 🔴 紧急 (本周)
1. **admin-web 启用绩效配置** — 将 `next.config.performance.js` 合并到主 config
2. **tob-web/storefront-web 添加 bundle 优化** — optimizePackageImports + splitChunks
3. **tob-web 图片转 WebP** — 批量转换 7.1MB → 预计 3MB

### 🟡 重要 (本月)
4. **h5-components.tsx 拆分为独立组件文件** (8个组件 → 8个文件)
5. **locale-provider.tsx 翻译资源外置** (按语言拆分 JSON)
6. **首屏大组件懒加载** — Dashboard / AI Simulator / Integration Events
7. **首屏 <img> 替换为 next/image** — LCP 优化

### 🟢 改进 (下月)
8. 非实时页面从 force-dynamic 改为 ISR
9. 响应式图片 srcset + sizes
10. 引入 `@next/bundle-analyzer` 定期分析
