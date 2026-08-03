# Day14 L3 — 前端性能基线 + 三端安全头检查

> 日期: 2026-07-26 | 边界: admin-web / tob-web / storefront-web | 不碰 api/

---

## 1. Next.js 配置统一性 ✅

三端 `next.config.mjs` 高度一致：

| 配置项 | admin-web | tob-web | storefront-web |
|--------|-----------|---------|----------------|
| `output: 'standalone'` | ✅ | ✅ | ✅ |
| `transpilePackages: ['@m5/ui','@m5/domain']` | ✅ | ✅ | ✅ |
| `ignoreBuildErrors: false` | ✅ | ✅ | ✅ |
| `ignoreDuringBuilds: true`（ESLint） | ✅ | ✅ | ✅ |

**storefront-web 额外配置：**
- `experimental.strictNextPageExport: false` — 因为 page.tsx 中导出了接口/helper（已知技术债，TODO 已标记）
- `webpack: config.cache = false`（dev 模式）— 避免本地随机重启时的 ENOENT 崩溃

**admin-web 额外文件：**
- `next.config.performance.js` — 异步 headers 安全头 + splitChunks + 缓存 + 图片优化（AVIF/WebP）+ optimizePackageImports

⚠️ **该 performance 配置通过 `require('./next.config.mjs')` 加载，但 actual build 入口是 `next.config.mjs`。需要确认构建脚本是否指定了 `--config`。**

---

## 2. 安全头检查

### admin-web（通过 next.config.performance.js 的 headers()）

| Header | 值 | 状态 |
|--------|----|-----|
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | ✅ |
| X-Content-Type-Options | nosniff | ✅ |
| Referrer-Policy | origin-when-cross-origin | ✅ |
| X-DNS-Prefetch-Control | on | ✅ |
| Cache-Control（JS/CSS/WOFF2） | public, max-age=31536000, immutable | ✅ |

**缺失（需关注）：**
- ❌ `Content-Security-Policy` — 无一端设置 CSP
- ❌ `X-Frame-Options` — 无一端设置
- ❌ `Permissions-Policy` — 无一端设置

### tob-web
- `middleware.ts` 仅处理 `document-language` header，**无安全头**
- 无 `next.config.performance.js`

### storefront-web
- **无安全头配置**

---

## 3. 图片资产分析

| 格式 | 数量 | 评价 |
|------|------|------|
| JPG | 97 | 全部在 `apps/tob-web/public/images/` |
| PNG | 0 | — |
| SVG | 0 | — |
| WEBP | 0 | ❌ 无 WebP 格式 |
| 超大图片（>500KB） | 0 | ✅ |

**JPG 大小分布：**
- 172KB: 10 张（产品/场景图）
- 537B: 87 张（占位符/缩略图？极小文件）

⚠️ 87 张 537B 的 JPG 文件看起来都是占位符，可以检视是否为误提交的 tiny 文件。

**next/image 使用：**
- admin-web: 0
- tob-web: 0  
- storefront-web: 3

⚠️ **next/image 使用率极低**（3/97 图片），大量 jpg 未经 Next.js 优化 pipeline。

---

## 4. 打包体积

| App | .next 构建 | 大小 |
|-----|-----------|------|
| admin-web | ❌ 无 build | — |
| tob-web | ❌ 无 build | — |
| storefront-web | ✅ | 1.2G |

**storefront-web chunks：**
- `main-app.js`: 7.8MB ⚠️ 大
- `webpack.js`: 142KB
- `app-pages-internals.js`: 287KB
- `polyfills.js`: 113KB

---

## 5. TSC 零错误验证 ✅

| App | 错误数 |
|-----|--------|
| admin-web | 0 |
| tob-web | 0 |
| storefront-web | 0 |

**三端全部零 TS 错误。**

---

## 6. 动态导入/代码分割

- 代码分割配置（admin-web performance config）：splitChunks 已配置 React/router/UI/utils/vendors/common 分组
- 实际使用：仅 1 处 `dynamic()` 调用（全三端）
- ⚠️ **懒加载使用率极低**

---

## 7. SEO 基础设施（tob-web）

- ✅ `sitemap.xml/route.ts`
- ✅ `robots.txt/route.ts`
- ✅ Geo IP 解析
- ✅ SEO 性能监控

---

## 总结

| 检查项 | 状态 | 说明 |
|--------|------|------|
| TSC 零错误 | ✅ | 三端全通过 |
| 构建产物 | ⚠️ | 仅 storefront-web 有 build |
| 安全头 | ⚠️ | admin-web 有基础安全头（在 performance.js 中）；CSP/X-Frame-Options/Permissions-Policy 缺失 |
| 图片优化 | ⚠️ | 全 JPG 无 WebP；next/image 使用率 3/97 |
| 代码分割 | ⚠️ | config 已配置但实际 lazy import 极少 |
| 静态资源缓存 | ✅ | JS/CSS/WOFF2 一年 immutable |
| SEO | ✅ | tob-web 有 robots.txt + sitemap |
