# Day20 L1: SEO + Metadata审计 — 2026-07-26

> 龙虾哥 V23 Day20 三层一致审计，仅 apps/admin-web apps/tob-web apps/storefront-web

## 检查项
1. metadata 导出覆盖
2. title / description 完整性
3. robots.txt / sitemap.xml
4. canonical URL / alternates
5. OpenGraph 标签

---

## 一、metadata 导出覆盖

| Web | 根 layout | 页面/子 layout 数量 | 覆盖率 |
|---|---|---|---|
| admin-web | ✅ metadata | 19 个 (含 layout/page) | ⚠️ 高，但大量用 layout 而非 page |
| tob-web | ✅ metadata | 3 个 (root + sports-ants + brand-website) | ⚠️ 低，仅 3 个 metadata |
| storefront-web | ✅ metadata | 7 个 (含 generateMetadata) | ⚠️ 中 |

### admin-web 具体文件 (19个，含 test)

| 文件 | 类型 | 说明 |
|---|---|---|
| `layout.tsx` | root | 完整 SEO：title template、description、keywords、og、twitter、canonical、verification |
| `ai-scenario-simulator/layout.tsx` | 子 layout | title ✓ / description ✓ / og ❌ |
| `alerts/page.tsx` | page | ✅ 含 OpenGraph |
| `anomaly-frequency/page.tsx` | page | ✅ 含 OpenGraph |
| `brands/layout.tsx` | 子 layout | title ✓ / description ✓ / og ❌ |
| `brands/new/layout.tsx` | 子 layout | title ✓ / description ✓ / og ❌ |
| `contracts/layout.tsx` | 子 layout | title ✓ / description ✓ / og ❌ |
| `devices/layout.tsx` | 子 layout | title ✓ / description ✓ / og ❌ |
| `help-center/layout.tsx` | 子 layout | title ✓ / description ✓ / og ❌ |
| `intelligence/feasibility/layout.tsx` | 子 layout | title ✓ / description ✓ / og ❌ |
| `license-renewal/layout.tsx` | 子 layout | title ✓ / description ❌ (空) / og ❌ |
| `llm-config/page.tsx` | page | ✅ 含 OpenGraph |
| `operations/sla/page.tsx` | page | ✅ 含 OpenGraph |
| `payment-channels/layout.tsx` | 子 layout | title ✓ / description ❌ (空) / og ❌ |
| `resilience/page.tsx` | page | ✅ 含 OpenGraph |
| `returns/layout.tsx` | 子 layout | title ✓ / description ✓ / og ❌ |
| `stock-transfer/form/layout.tsx` | 子 layout | title ✓ / description ✓ / og ❌ |
| `suppliers/layout.tsx` | 子 layout | title ✓ / description ❌ (空) / og ❌ |
| `training/layout.tsx` | 子 layout | title ✓ / description ❌ (空) / og ❌ |

### storefront-web 具体文件 (7个)

| 文件 | 类型 | og |
|---|---|---|
| `layout.tsx` | root | ❌ 无 og |
| `stores/compare/page.tsx` | page | ✅ |
| `store-manager/page.tsx` | page | ✅ |
| `member-upgrade-path/page.tsx` | page | ✅ |
| `reports/page.tsx` | page | ✅ |
| `reports/[id]/page.tsx` | page (generateMetadata) | ✅ |

### tob-web 具体文件 (3个)

| 文件 | 类型 | og |
|---|---|---|
| `layout.tsx` | root | ❌ 无 og |
| `sports-ants/layout.tsx` | 子 layout | ✅ |
| `brand-website/layout.tsx` | 子 layout | ✅ |

---

## 二、title / description 完整性

### ✅ 合规
- **admin-web root layout**：title template (`%s | 神机营体育`) + description + keywords + authors，P-49 SEO/GEO 全量
- 所有子 layout 均有 title，大部分有 description

### ⚠️ 问题

1. **空 description (4处，admin-web)**
   - `license-renewal/layout.tsx` → `description: ''`
   - `payment-channels/layout.tsx` → `description: ''`
   - `suppliers/layout.tsx` → `description: ''`
   - `training/layout.tsx` → `description: ''`

2. **tob-web root layout**：title 仅 `Shenjiying - ToB Admin`，description 为英文，无 keywords、无 og
3. **storefront-web root layout**：title 仅 `Shenjiying - Storefront`，description 为英文，无 keywords、无 og

---

## 三、robots.txt / sitemap.xml

| Web | robots.ts / robots.txt | sitemap.ts / sitemap.xml | 评价 |
|---|---|---|---|
| **admin-web** | ❌ 无 | ❌ 无 | 🔴 严重：管理后台无 robots，爬虫可能抓取敏感后台路径 |
| **tob-web** | ✅ 完善 | ✅ 根级 + 子站级 | 🟢 完善：双 UA 规则 + 禁用 API/后台 + hreflang alternates |
| **storefront-web** | ❌ 无 | ❌ 无 | 🔴 严重：面向用户的 C 端无 robots + sitemap |

### tob-web robots.ts 亮点
```ts
- 双 UA 规则 (通用 + Googlebot/Bingbot/YandexBot 锁定)
- 允许: / /brand-website/ /sports-ants/ /api/public/
- 禁止: /admin/ /api/ /console/ /login/ /register/ /_next/ /internal/
- sitemap 指向: ${SITE_URL}/sitemap.xml
```

### tob-web sitemap.ts 亮点
- 根路由 (/, /brand-website, /sports-ants, /admin)
- 5 市场 × 3 租户 动态 sitemap，含 `alternates.languages` hreflang
- ISR revalidate = 3600

---

## 四、canonical URL / alternates

| Web | canonical | alternates | 评价 |
|---|---|---|---|
| **admin-web** | ✅ root layout | ✅ languages (zh-CN/en-US) | 🟢 完整 |
| **tob-web** | ❌ 无 | ❌ 无 | 🟡 root layout 缺 canonical |
| **storefront-web** | ❌ 无 | ❌ 无 | 🔴 缺 |

### admin-web canonical 详情
```ts
metadataBase: new URL('https://admin.shenjiying.com'),
alternates: {
  canonical: '/',
  languages: { 'zh-CN': '/zh', 'en-US': '/en' },
},
```

---

## 五、OpenGraph 标签

### 覆盖统计

| Web | metadata 总数 | 有 OpenGraph | 缺失率 |
|---|---|---|---|
| admin-web | 19 | 6 (含 root) | 68% |
| tob-web | 3 | 2 | 33% |
| storefront-web | 7 | 5 | 29% |

### og:image 覆盖

| Web | 有 og:image | 详情 |
|---|---|---|
| admin-web root | ✅ | `https://assets.shenjiying.com/og-image.png` (1200×630) |
| admin-web 其他 | ❌ | 5 个有 og 的页面均无 images 字段 |
| tob-web | ❌ | 2 个有 og 的 layout 均无 images |
| storefront-web | ❌ | 所有页面均无 og:image |

### ⚠️ 关键问题

1. **og:image 几乎全缺**：仅 admin-web root layout 有 og:image
2. **storefront-web root layout 无 og**：C 端根布局无 OpenGraph 标签
3. **tob-web root layout 无 og**：ToB 入口无社交分享标签
4. **admin-web 13 个子 layout 无 og**：大量管理页缺社交元数据

---

## 六、总结评分

| Web | metadata | robots/sitemap | canonical | og | 总分 |
|---|---|---|---|---|---|
| admin-web | 🟢 8/10 | 🔴 0/10 | 🟢 8/10 | 🟡 5/10 | 🟡 **5.3** |
| tob-web | 🟡 5/10 | 🟢 9/10 | 🔴 0/10 | 🟡 5/10 | 🟡 **4.8** |
| storefront-web | 🟡 5/10 | 🔴 0/10 | 🔴 0/10 | 🟡 4/10 | 🔴 **2.3** |

---

## 七、修复建议 (优先级排序)

### P0 (立即修复)

1. **admin-web + robots.ts**：禁止搜索引擎爬取管理后台所有路径
   ```ts
   // apps/admin-web/app/robots.ts
   export default function robots() {
     return {
       rules: { userAgent: '*', disallow: '/' },
     };
   }
   ```

2. **storefront-web + robots.ts + sitemap.ts**：C 端必须有 robots + sitemap

### P1 (本周修复)

3. **storefront-web root layout** 补全 og + canonical
4. **tob-web root layout** 补全 canonical + og
5. **admin-web 4 个空 description** 补填内容（license-renewal, payment-channels, suppliers, training）

### P2 (后续迭代)

6. **og:image 全量补齐**：至少 root layout 提供共享 og:image
7. **admin-web 子 layout 补 og**：13 个 layout 均缺 OpenGraph
8. **admin-web + sitemap.ts**（内部 sitemap 供搜索引擎发现主要功能入口）
