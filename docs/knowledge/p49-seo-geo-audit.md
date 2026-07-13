# P-49 SEO/GEO 专项审计

> 更新时间: 2026-07-14 05:31
> 范围: `PRD-015` / `apps/tob-web` / `SEO/GEO`

## 1. 审计结论

`PRD-015` 已从“只有正式 PRD”推进到“有需求卡、有前台代码映射、有圈梁测试、且已完成浏览器级抽检”的状态，当前结论为 `🟡 已补主圈梁，待补更深层 UI/回放证据`。

## 2. 证据总表

| 模块 | PRD | 代码入口 | 测试证据 | 审计结论 |
|:-----|:----|:---------|:---------|:---------|
| 根级站点入口 | PRD-015 | `apps/tob-web/app/sitemap.ts` / `apps/tob-web/app/robots.ts` | `seo-geo-p49.test.ts` 中 AC-49-12 / AC-49-13 | 根级抓取入口已存在且可校验 |
| 品牌站 SEO/GEO 路由 | PRD-015 | `apps/tob-web/app/brand-website/sitemap.xml/route.ts` / `robots.txt/route.ts` / `api/geo/route.ts` | `seo-geo-p49.test.ts` 中 AC-49-12 / AC-49-13 / AC-49-15 | 动态 sitemap、robots、地域解析主链可执行 |
| 元标签与结构化数据 | PRD-015 | `apps/tob-web/app/brand-website/lib/seo/meta-generator.ts` | `seo-geo-p49.test.ts` 中 AC-49-11 / AC-49-14 | title/description/OG/canonical/JSON-LD 已有生成能力 |
| AI 引用优化 | PRD-015 | `apps/tob-web/app/brand-website/lib/geo/ai-reference-optimizer.ts` | `seo-geo-p49.test.ts` 中 RQ-49-15 | AI 友好内容切分、结构化片段、地域化改写可执行 |
| 监控与自治优化 | PRD-015 | `apps/tob-web/app/brand-website/lib/intelligent/self-system.ts` / `app/api/metrics/web-vitals/route.ts` / `app/brand-website/monitoring/page.tsx` | `seo-geo-p49.test.ts` 中 AC-49-16 / AC-49-18 + `route.test.ts` 2例 + 浏览器抽检 | 健康快照、性能上报落点、监控页 UI 均已形成主证据 |
| 社媒与转化追踪锚点 | PRD-015 | `apps/tob-web/app/brand-website/page.tsx` / `apps/tob-web/app/sports-ants/page.tsx` / `app/api/crm/leads/route.ts` | `seo-geo-p49.test.ts` 中 AC-49-17 + 页面契约测试 + `crm/leads/route.test.ts` 5例 + `conversion-service.test.ts` 1例 | 分享、联系、CTA、UTM/referrer 归因与 CRM 转发均已形成证据 |

## 3. 本轮补齐

1. 新增需求卡 `docs/knowledge/requirement-cards/2026-07-14-P49-seo-geo.md`
2. 新增圈梁测试 `apps/tob-web/app/seo-geo-p49.test.ts`，覆盖 19 条关键场景
3. 将 `PRD-015` 从“页面契约”推进到“路由/模块可执行证据”：
   - 根级 `sitemap.xml` / `robots.txt`
   - 品牌站 `sitemap.xml` / `robots.txt` / `api/geo`
   - `meta-generator` 的 OG / canonical / alternate / JSON-LD
   - `ai-reference-optimizer` 的 AI 引用友好化与地域化改写
   - `intelligent/self-system` 的健康快照与异常优化任务
4. 浏览器级抽检 `brand-website` / `sports-ants` / `sitemap.xml` / `robots.txt`：
   - 确认品牌站真实页面存在 `description`、`OG`、`Organization JSON-LD`
   - 确认根级 `sitemap.xml` 为 `application/xml` 且包含品牌站、运动蚂蚁、租户级路由
   - 确认根级 `robots.txt` 为 `text/plain` 且包含 `Sitemap`、`/admin/`、`/api/` 禁止规则
   - 修复 `sports-ants` 继承 ToB Admin 标题的问题
   - 修复 `PersonalizedRecommendations` 默认数组引用不稳定导致的无交互重复埋点
5. 补齐监控与归因的 HTTP/UI 证据：
   - 新增 `apps/tob-web/app/api/metrics/web-vitals/route.ts`，接住 `performance-monitor` 的 `sendBeacon/fetch keepalive` 上报
   - 新增 `app/api/metrics/web-vitals/route.test.ts`，覆盖存储与查询两条路径
   - 新增 `app/sports-ants/lib/conversion-service.test.ts`，验证 URL 上的 `utm_source` / `utm_medium` / `utm_campaign` 与 `document.referrer` 会进入转化 payload
   - 补齐 `app/api/crm/leads/route.ts` 对 `referrer` 的转发，并在 `route.test.ts` 中验证
   - 浏览器抽检 `http://127.0.0.1:3005/brand-website/monitoring`，确认看板真实渲染指标卡、告警、任务队列，`触发检测` 可用且无业务报错
6. 补齐多市场 / 多品牌 SEO 隔离证据：
   - 为 `app/[marketCode]/[tenantCode]/page.tsx` 与 `app/[marketCode]/[tenantCode]/[brandCode]/page.tsx` 新增 `generateMetadata`
   - 新增 `app/lib/document-language.ts` 与 `middleware.ts`，让动态门户根 `<html lang>` 按市场切换
   - `seo-geo-p49.test.ts` 新增 6 条断言，锁定 tenant / brand 动态路由的 title、description、canonical、languages、OG url，以及 document lang 路径解析/白名单逻辑
   - 浏览器抽检 `http://127.0.0.1:3005/cn-mainland/demo-tenant`，确认标题为 `demo-tenant ToB 官网 | 中国大陆 | 神机营`
   - 浏览器抽检 `http://127.0.0.1:3005/us-default/demo-tenant/demo-brand`，确认标题为 `demo-brand 品牌 ToB 官网 | United States | 神机营`
   - 浏览器抽检 `http://127.0.0.1:3005/sea-sg/demo-tenant`，确认标题为 `demo-tenant ToB 官网 | Singapore | 神机营`
   - 浏览器抽检 `http://127.0.0.1:3005/jp-tokyo/demo-tenant`，确认 `document.documentElement.lang === 'ja-JP'` 且无控制台告警
   - 浏览器抽检 `http://127.0.0.1:3005/eu-de/demo-tenant/sportslife`，确认 `document.documentElement.lang === 'de-DE'` 且无控制台告警
   - 修复 `PortalConsumerGovernanceSection` 在动态门户下触发的 React child key 告警
7. 固化浏览器自动化证据：
   - 新增 `scripts/phase49-e2e-seo-geo.ts` 与根脚本命令 `pnpm run e2e:phase49:seo-geo`
   - 新增 `scripts/run-phase49-seo-geo.sh`，支持自动探测/复用现有 `tob-web` 服务，离线时自动起本地 `3005` 端口再执行验收
   - 自动抽检 `cn-mainland / sea-sg / jp-tokyo / eu-de` 四条动态门户路径
   - 自动校验 `title / html lang / canonical / og:locale / description / h1 / console messages`
   - 证据已落盘到 `tmp/phase49-seo-geo/report.json` 与同目录 4 张全页截图
8. 接入持续回归入口：
   - `.github/workflows/ci.yml` 新增 `SEO/GEO Browser E2E` job，安装 Playwright Chromium 后执行 `pnpm run e2e:phase49:seo-geo`
   - `scripts/nightly-jobs.sh` 的 Phase 2 新增 `2.4 SEO/GEO 浏览器回归`，夜间自动补 `PRD-015` 浏览器证据

## 4. AC / RQ 映射

| 需求 | 证据 |
|:-----|:-----|
| AC-49-11 | `seoMetaGenerator.generate()` 输出 title / description / OG / canonical；多市场 tenant / brand 动态路由会生成独立 metadata，避免继承后台标题；动态门户根 `<html lang>` 会随 `marketCode` 切换 |
| AC-49-12 | 根级与品牌站 `sitemap.xml` 返回合法公开链接 |
| AC-49-13 | 根级与品牌站 `robots.txt` 返回爬虫规则与 sitemap |
| AC-49-14 | `generateOrganizationJsonLd()` / `generateLocalBusinessJsonLd()` 输出结构化数据 |
| AC-49-15 | `GET /brand-website/api/geo` 返回地域与地域内容 |
| AC-49-16 | `IntelligentSystem.triggerCycle()` 刷新 SEO/GEO 健康状态 |
| AC-49-17 | `brand-website` 包含分享/联系入口，`sports-ants` 包含 CTA 埋点追踪，`conversion-service` 会合并 UTM/referrer，`crm leads` 路由会继续转发归因字段 |
| AC-49-18 | 性能异常可转化为待执行优化任务 |
| RQ-49-15 | `aiReferenceOptimizer.optimize()` / `generateLocalContent()` 产出 AI 友好内容 |

## 5. 剩余缺口

1. 浏览器自动化证据已落盘并接入 CI / 夜间回归；后续可继续补失败告警通知与更长期的截图归档策略。

## 6. 验证记录

```bash
pnpm --dir apps/tob-web exec node --import tsx --test app/seo-geo-p49.test.ts
pnpm --dir apps/tob-web exec node --import tsx --test app/api/crm/leads/route.test.ts
pnpm --dir apps/tob-web exec node --import tsx --test app/api/metrics/web-vitals/route.test.ts
pnpm --dir apps/tob-web exec node --import tsx --test app/sports-ants/lib/conversion-service.test.ts
pnpm --dir packages/ui build
pnpm --dir apps/tob-web typecheck
pnpm run e2e:phase49:seo-geo
bash scripts/prd-validate.sh
```
