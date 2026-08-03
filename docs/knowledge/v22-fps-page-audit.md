# V22 页面首屏质量审计

审计日期: 2026-07-20
审计范围: admin-web / storefront-web / tob-web 三端全部 page.tsx
审计方式: 代码审计（未运行浏览器）
审计重点: page-level metadata/title、'use client' 标注、显著内容文案、SEO 基础

---

## Admin-web

- **页面总数**: 262 个 page.tsx
- **page-level metadata 覆盖**: 11 个页面（含 2 个动态 generateMetadata）
- **'use client' 标注**: 172 个页面（占 66%）
- **'use server' 标注**: 0 个页面
- **'use client' + metadata 冲突**: 0 个（Next.js 不允许混用，检查通过）

### 有 page-level metadata 的页面（11 个）

| 页面 | 类型 | title |
|------|------|-------|
| `/alerts/page.tsx` | static `export const metadata` | `告警中心 - M5 指挥台` |
| `/anomaly-frequency/page.tsx` | static | `异常时序频率 - M5 指挥台` |
| `/devices/page.tsx` | static | `设备管理 - M5 指挥台` |
| `/devices/[id]/page.tsx` | dynamic `generateMetadata` | `设备详情 {id} - M5 指挥台` |
| `/help-center/page.tsx` | static | `帮助中心 - M5 指挥台` |
| `/llm-config/page.tsx` | static | `LLM 接入配置 - M5 指挥台` |
| `/operations/sla/page.tsx` | static | `SLA 监控看板 - M5 指挥台` |
| `/refunds/page.tsx` | static | `退款管理 - M5 指挥台` |
| `/resilience/page.tsx` | static | `强韧性作战台 - M5 指挥台` |
| `/returns/page.tsx` | static | `退换货管理 - M5 指挥台` |
| `/stock-transfer/[id]/page.tsx` | dynamic `generateMetadata` | `库存调拨单 {id} - M5 指挥台` |

### 无 page-level metadata 的页面
- **251 个页面** 没有独立的 `export const metadata` 或 `generateMetadata`
- 这些页面依赖根布局提供的默认 metadata:
  - `title.template: '%s | 神机营体育'`
  - `title.default: '神机营体育 - 数字运动潮玩平台'`
  - 页面标题显示为**默认 title**（路由名不会自动拼接）

### 显著内容文案质量
- 首页 `page.tsx`: `PageShell title="M5 指挥台"` + 副标题说明
- 多数关键页面使用 `PageShell` 组件，含 title 和 subtitle
- `/admin/dashboard`: 含多个 h3 标题、区域聚合统计、强数字展示
- `/dashboard`: `PageShell title="📊 概览仪表盘"` + 副标题
- `/analytics`: `PageShell title="📈 数据分析"` + 副标题
- 内容结构整体良好，每个业务模块有清晰的标题和说明

### 潜在控制台风险
- 页面大量使用 `async` 组件（Server Components），如配置模块、限流模块等，数据加载失败可能导致运行时错误
- 无明显 `try/catch` 遗漏，多数使用了 `ErrorBoundary` 和 `EmptyState`

---

## Storefront-web

- **页面总数**: 165 个 page.tsx
- **page-level metadata 覆盖**: 5 个页面
- **'use client' 标注**: 62 个页面（占 38%）
- **'use server' 标注**: 0 个页面
- **'use client' + metadata 冲突**: 0 个

### 有 page-level metadata 的页面（5 个）

| 页面 | type | title |
|------|------|-------|
| `/member-upgrade-path/page.tsx` | static | 未直接提取（有测试断言确认） |
| `/reports/page.tsx` | static | 报表列表页 |
| `/reports/[id]/page.tsx` | static | 报表详情 |
| `/store-manager/page.tsx` | static | 门店管理 |
| `/stores/compare/page.tsx` | static | 门店对比 |

### 无 page-level metadata 的页面
- **160 个页面** 没有独立 metadata
- 依赖根布局: `title: 'Shenjiying - Storefront'`（英文，非 SEO 友好）
- 首页为 catch-all 路由 `[...storeScope]/page.tsx`，title 为默认值

### 显著内容文案质量
- 首页 `[...storeScope]`: 使用 `PageShell`、有中文文案说明（门店官网聚合页、触达点列表）；但 title 无中文
- 多数页面使用 `PageShell` + 中文 title/subtitle
- 有完整的 JSDoc 注释说明页面功能

### 潜在控制台风险
- catch-all 路由覆盖广，动态参数处理出错可能影响多个入口
- 部分页面 `'use client'` 标注较一致，无明显异常

---

## Tob-web

- **页面总数**: 116 个 page.tsx
- **page-level metadata 覆盖**: 2 个页面的动态 `generateMetadata` + 2 个子布局 metadata
- **'use client' 标注**: 47 个页面（占 41%）
- **'use server' 标注**: 0 个页面
- **'use client' + metadata 冲突**: 0 个

### 有 page-level metadata 的页面（2 个动态）

| 页面 | type | title |
|------|------|-------|
| `/[marketCode]/[tenantCode]/page.tsx` | dynamic `generateMetadata` | 基于 tenant 动态生成 |
| `/[marketCode]/[tenantCode]/[brandCode]/page.tsx` | dynamic `generateMetadata` | `{portal.name} \| {marketName} \| 神机营` |

### 子布局 Metadata（覆盖特定路由段）

| 子布局 | title |
|--------|-------|
| `/brand-website/layout.tsx` | `神机营 - 企业级全链路服务品牌` |
| `/sports-ants/layout.tsx` | `运动蚂蚁 BigAnts \| 数字运动潮玩一站式提供商` |

### 无 page-level metadata 的页面
- **114 个页面**（含 subtoutes of brand-website/sports-ants）没有独立 metadata
- 默认 title: `'Shenjiying - ToB Admin'`（英文，SEO 友好度低）
- brand-website 下面的 8 个子页面（contact、digital-sports、epc 等）使用子布局 title，但子页面本身应该有更具体的 title

### 显著内容文案质量
- brand-website 各子页有中文 h1/h2/h3 标题列表（如 `title: '特许加盟' / '场地评估' / '售前咨询'`）
- sports-ants 页面有品牌级中文文案
- ToB 核心管理页面文案偏英文或简短，中文化不完整

### 潜在控制台风险
- 动态路由 `[marketCode]/[tenantCode]/...` 解析复杂，参数 Promise 化后需 await，可能有遗漏处理
- 页面 mix 了 Server/Client Component，数据流需关注

---

## 关键发现

### 🔴 高优先级

1. **page-level metadata 覆盖率极低**
   - admin-web: 仅 11/262（4.2%）有独立 metadata
   - storefront-web: 仅 5/165（3.0%）有独立 metadata
   - tob-web: 仅 2/116（1.7%）有独立 page-level metadata
   - **结论**: 超过 95% 的页面没有 SEO title/description，依赖 root layout 默认值

2. **SEO title 缺乏中文优化**
   - storefront-web 根布局: `'Shenjiying - Storefront'`（英文，在中文环境下无 SEO 价值）
   - tob-web 根布局: `'Shenjiying - ToB Admin'`（同上）
   - 仅 admin-web 布局使用了中文模板 `'%s | 神机营体育'`

### 🟡 中优先级

3. **brand-website 子页面缺少 page-level title**
   - `/brand-website/contact/`、`/products/`、`/service/` 等页面虽然内容有中文标题，但页面 `<title>` 只继承子布局，无法区分是"联系我们"还是"产品展示"页，**所有子页面共享同一个 title**

4. **'use client' 占比差异大**
   - admin-web: 66% 页面是 Client Component（偏高，可能过度使用）
   - storefront-web: 38%
   - tob-web: 41%
   - 过度使用 `'use client'` 影响首屏性能和 SEO 元数据能力

### 🟢 低优先级（已有良好实践）

5. **动态 generateMetadata 模式已建立**
   - admin-web 已有 2 个动态 metadata 示例（device detail、stock-transfer detail）
   - tob-web 已有 2 个动态 metadata 示例（tenant/brand portal）
   - **建议**: 将此模式推广到所有详情类页面

6. **PageShell 组件统一了内容标题结构**
   - 三端多数关键页面使用 `PageShell` 或等效组件展示 title + subtitle
   - 视觉上用户能看到标题，但 `<title>` 标签没有对应设置

7. **无 'use client' + metadata 冲突**
   - 所有标注 'use client' 的页面均未尝试导出 metadata，符合 Next.js 规范

---

## 建议

1. **优先为 Top 20 流量页面添加 static metadata**（登录页、Dashboard、首页、核心管理页）
2. **为所有 `[id]/page.tsx` 详情页添加 `generateMetadata`**，模板化复用
3. **更新 storefront/tob 根布局 title 为中文**（如 `'神机营门店 - 门店运营管理平台'`）
4. **为 brand-website 每个子页面添加 `export const metadata`**，描述对应页面功能
5. **引入 ESLint 规则** 强制 page.tsx 必须有 metadata 导出（除 catch-all 外）
