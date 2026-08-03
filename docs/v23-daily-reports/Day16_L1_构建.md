# Day16-L1 构建大小分析

⏰ 2026-07-26 · 龙虾哥 · V23

## 构建产物概览

| 指标 | admin-web | storefront-web | tob-web |
|------|----------|---------------|---------|
| .next 总大小 | 3.2G | 1.4G | 847M |
| cache 缓存 | 3.1G | 1.1G | 653M |
| server | 103M | 62M | 28M |
| static | 9.3M | 5.7M | 4.1M |

## 路由网络

| 指标 | admin-web | storefront-web | tob-web | 三端合计 |
|------|----------|---------------|---------|---------|
| 路由总数 (server/app) | 88 | 84 | 52 | 224 |
| page.tsx | 268 | 171 | 116 | **555** |
| layout.tsx | 17 | 1 | 3 | 21 |
| loading.tsx | 268 | 175 | 0 | 443 |
| error.tsx | 87 | 1 | 0 | 88 |

## 组件分布

| 指标 | admin-web | storefront-web | tob-web |
|------|----------|---------------|---------|
| components/ 下 TSX | 0 | 2 | 1 |

> ⚠️ 组件几乎全部在 `app/` 目录内（co-located），不在独立 components 目录下。

## 源码规模

| 指标 | admin-web | storefront-web | tob-web | 三端合计 |
|------|----------|---------------|---------|---------|
| TSX 行数 | ~195K | ~138K | ~63K | ~396K |
| 总 TS 行数 | ~297K | ~177K | ~105K | ~579K |

## 静态资源产出

| 指标 | admin-web | storefront-web | tob-web |
|------|----------|---------------|---------|
| JS chunk 数 | 776 | 368 | 157 |
| CSS chunk 数 | 1 | 0 | 1 |
| 最大 JS chunk | 1.3M | 1.2M | 1.3M |

### Top 5 大 chunk (server-side)

**admin-web:**
- `chunks/6507.js` — 1.8M
- `chunks/552.js` — 1.2M
- `chunks/3517.js` — 436K
- client-reference-manifest 普遍 ~332K

**storefront-web:**
- `member-center/page.js` — 2.0M ⚠️ 单页最大
- `chunks/552.js` — 1.2M
- `chunks/853.js` — 416K

**tob-web:**
- `chunks/9188.js` — 1.2M
- `chunks/5246.js` — 460K
- `chunks/5196.js` — 296K

## 发现与建议

1. **cache 占比过大**: admin-web cache 3.1G / 3.2G (97%)，实际产物仅 ~112M（server+static）。cache 膨胀通常是 ISR/增量构建累积，定期 `rm -rf .next/cache` 可回收。
2. **552.js 共享 chunk**: admin-web 和 storefront-web 都有 1.2M 同名 chunk，可能是 monorepo 共享依赖（如 UI 库、工具库）导致的公共 chunk 膨胀。
3. **member-center 单页 2.0M**: storefront-web 的 member-center 页面 server chunk 最大，可能是全量客户端组件直出，建议拆分动态导入。
4. **loading.tsx 覆盖 79.8%**: 555 个 page 中 443 个有 loading.tsx，覆盖率很高，说明 Loading UI 策略统一。
5. **CSS 极少**: admin-web 和 tob-web 各仅 1 个 CSS chunk，可能重度依赖 CSS-in-JS / Tailwind。

## 基线状态

✅ 三端构建正常，无报错。
✅ Day16 L1 基线已记录。
