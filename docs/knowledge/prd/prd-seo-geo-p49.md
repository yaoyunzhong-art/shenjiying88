# PRD-015: SEO/GEO 智能优化 — SEO & GEO Engine (P-49)

> 版本: v1.0 · 签发人: 🦞 龙虾哥 · 对接专家: E44 开放平台
> 发布日期: 2026-07-13 · 状态: 🟢 已签发
> 关联Phase: P-49
> 来源收口: `prd-seo-geo-intelligent-system.md`

## 1. 业务背景

品牌官网与开放平台需要同时拿下传统搜索流量和 AI 引用流量。
当前已有 SEO/GEO 旧稿，但未收敛成标准化 PRD，无法直接映射测试、审计和任务派发。

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-49-11 | 元标签智能生成 | P0 | 页面生成时可输出 title、description、OG 等基础元信息 |
| RQ-49-12 | 站点地图与 robots 管理 | P0 | 可自动维护 `sitemap.xml` 与 `robots.txt`，随页面变化更新 |
| RQ-49-13 | 结构化数据注入 | P0 | 支持 Organization、FAQ、Breadcrumb 等 JSON-LD 输出 |
| RQ-49-14 | 地域内容适配 | P0 | 支持按地域渲染 GEO 文案、FAQ 或落地页策略 |
| RQ-49-15 | AI 引用优化 | P1 | 支持为 AI 问答场景产出可引用的结构化内容片段 |
| RQ-49-16 | 监控与告警 | P1 | 能监控 Core Web Vitals、收录、引用与异常波动并告警 |
| RQ-49-17 | 社媒与转化追踪 | P1 | 具备 UTM、分享组件、联系入口等链路追踪能力 |
| RQ-49-18 | 自治优化闭环 | P1 | 系统可基于效果指标提出或执行优化动作并保留记录 |

## 3. 验收卡

| AC | 场景 | 前置 | 预期 |
|:---|:-----|:-----|:-----|
| AC-49-11 | 生成页面元信息 | 页面内容已存在 | 输出 title、description 与 OG 基础字段 |
| AC-49-12 | 访问 `/sitemap.xml` | 站点已部署 | 返回合法 sitemap，包含新增页面 |
| AC-49-13 | 访问 `/robots.txt` | 站点已部署 | 返回爬虫规则与站点地图地址 |
| AC-49-14 | 抽查页面源码 | 页面支持 SEO 组件 | 存在 JSON-LD 结构化数据脚本 |
| AC-49-15 | 模拟不同地域访问 | 地域解析服务可用 | 页面文案或策略发生地域差异化输出 |
| AC-49-16 | 查看监控看板 | 已采集性能/收录数据 | 可见核心指标与异常状态 |
| AC-49-17 | 触发分享/联系组件 | 页面存在社媒与联系入口 | UTM 或行为埋点被记录 |
| AC-49-18 | 识别异常后执行优化 | 已存在异常样本 | 系统记录建议或自动修复动作 |

## 4. 技术落点

```typescript
interface SeoDocumentMeta {
  title: string;
  description: string;
  openGraph?: Record<string, string>;
  jsonLd?: Array<Record<string, unknown>>;
}

interface GeoOptimizationSnapshot {
  locale: string;
  regionCode: string;
  landingVariant: string;
  aiSnippetCount: number;
  webVitalsScore?: number;
}
```

## 5. 边界说明

- 不覆盖付费广告投放与预算自动托管
- 不覆盖搜索引擎官方账号人工申诉流程
- 不覆盖整站多语言翻译生产
- 不覆盖跨品牌共享 SEO 策略池
