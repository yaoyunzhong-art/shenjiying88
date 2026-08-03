# Brand Analytics 验收标准

## 一、模块完整性

- [x] `brand-analytics.module.ts` — NestJS 模块定义（配置 Controller / Service / 导出）
- [x] `brand-analytics.controller.ts` — REST 控制器（21 端点，TrafficGovernanceGuard + ValidationPipe）
- [x] `brand-analytics.service.ts` — 业务逻辑层（内存 Map 存储，覆盖 8 个业务域：KPI / 归因 / 声量 / 健康度 / 内容 / 报告 / ROI / 市场占比）
- [x] `brand-analytics.dto.ts` — 请求 DTO（13 个 class-validator 类，含日期格式、枚举、边界验证）
- [x] `brand-analytics.entity.ts` — 实体/类型定义（BrandKPI / ChannelAttribution / BrandMention / BrandHealthScore / ContentPerformance / BrandAnalyticsReport / ROICalculation / MarketShareData 等 17 个接口/类型）
- [x] `index.ts` — 模块 Barrel 导出
- [x] 已注册到 `app.module.ts`

## 二、REST 端点验收

| # | 方法 | 路由 | 描述 | 状态 |
|---|------|------|------|------|
| 1 | GET | `/brand-analytics/kpi/:brandId` | KPI 指标查询（按日期范围） | ✅ |
| 2 | POST | `/brand-analytics/kpi` | 录入 KPI 数据 | ✅ |
| 3 | GET | `/brand-analytics/attribution/:brandId` | 7 渠道归因分析 | ✅ |
| 4 | GET | `/brand-analytics/attribution/:brandId/compare` | 5 种归因模型对比 | ✅ |
| 5 | GET | `/brand-analytics/mentions/:brandId` | 品牌声量查询（可选 platform 筛选） | ✅ |
| 6 | POST | `/brand-analytics/mentions` | 录入品牌声量 | ✅ |
| 7 | GET | `/brand-analytics/health/:brandId` | 品牌健康度评分（5 维度） | ✅ |
| 8 | PATCH | `/brand-analytics/health/:brandId` | 部分更新健康度 | ✅ |
| 9 | GET | `/brand-analytics/content/:brandId` | 内容表现列表 | ✅ |
| 10 | POST | `/brand-analytics/content` | 录入内容表现 | ✅ |
| 11 | POST | `/brand-analytics/report/:brandId` | 生成分析报告 | ✅ |
| 12 | GET | `/brand-analytics/reports/:brandId` | 历史报告列表 | ✅ |
| 13 | GET | `/brand-analytics/report/:id` | 报告详情（按 ID） | ✅ |
| 14 | GET | `/brand-analytics/roi/:brandId` | ROI / ROAS / 净利计算 | ✅ |
| 15 | GET | `/brand-analytics/market-share` | 品牌市场占有率排名 | ✅ |
| 16 | GET | `/brand-analytics/analytics/:brandId` | 综合查询（KPI + 归因 + 声量 + 健康 + 内容） | ✅ |
| 17 | POST | `/brand-analytics/compare` | 多品牌 KPI + 健康度对比 | ✅ |
| 18 | POST | `/brand-analytics/competitors` | 主品牌 vs 竞品差异分析 | ✅ |
| 19 | GET | `/brand-analytics/top-content/:brandId` | 热门内容排名（按类型/平台/日期） | ✅ |
| 20 | GET | `/brand-analytics/health/:brandId/trend` | 月度健康度趋势（可配置月数） | ✅ |
| 21 | GET | `/brand-analytics/content-suggestions/:contentId` | 内容优化建议 | ✅ |

## 三、认证与守卫

- [x] 控制器级别 `@UseGuards(TrafficGovernanceGuard)` 保护所有端点
- [x] 全局 `ValidationPipe({ transform: true })` 自动请求校验与类型转换

## 四、DTO 校验（13 个 DTO 类）

| DTO | 字段 | 校验规则 | 状态 |
|-----|------|----------|------|
| `GetKPIDto` | startDate, endDate | @IsDateString + YYYY-MM-DD regex | ✅ |
| `TrackKPIDto` | brandId, tenantId, metrics | brandId/tenantId @IsNotEmpty, metrics 必填 | ✅ |
| `TrackMentionDto` | brandId, date, platform, mentionCount... | 全字段校验含 sentimentScore | ✅ |
| `UpdateHealthDto` | overallScore?, dimensions? | 全可选 Partial Update | ✅ |
| `TrackContentDto` | contentType, title, platform, metrics... | contentType @IsNotEmpty | ✅ |
| `GenerateReportDto` | reportType | @IsString + @IsNotEmpty | ✅ |
| `ROIDto` | startDate, endDate | @IsDateString + regex | ✅ |
| `AnalyticsQueryDto` | startDate, endDate, granularity, channels?, platforms? | granularity @IsEnum, channels/platforms 可选数组 | ✅ |
| `CompareBrandsDto` | brandIds, startDate, endDate | brandIds 2-10 个 | ✅ |
| `CompetitorQueryDto` | brandId, competitorIds, startDate, endDate | competitorIds 1-10 个 | ✅ |
| `TopContentQueryDto` | contentType?, platform?, startDate, endDate | contentType @IsEnum optional | ✅ |
| `HealthTrendQueryDto` | months? | @Matches(number) optional, 默认 6 | ✅ |
| `ContentSuggestionsDto` | contentType? | @IsOptional @IsString | ✅ |

## 五、服务层业务域验收

| 业务域 | 方法 | 数据存储 | 状态 |
|--------|------|----------|------|
| KPI 指标 | getKPI / trackKPI | Map<brandId:date, BrandKPI> | ✅ |
| 渠道归因 | getChannelAttribution / compareAttributionModels | Mock 随机生成 | ✅ |
| 品牌声量 | getBrandMentions / trackMention | Map<id, BrandMention> | ✅ |
| 健康度 | getBrandHealth / updateHealthScore | Map<brandId, BrandHealthScore> | ✅ |
| 内容表现 | getContentPerformance / trackContent | Map<contentId, ContentPerformance> + Map<contentId, brandId> | ✅ |
| 报告生成 | generateReport / getReports / getReport | Map<id, BrandAnalyticsReport> | ✅ |
| ROI 计算 | calculateROI | 随机计算（Cost + Revenue → ROI/ROAS/净利） | ✅ |
| 市场占比 | getMarketShare | 静态预置 3 品牌数据 | ✅ |
| 综合查询 | getAnalytics | 聚合 KPI + 归因 + 声量 + 健康 + 内容 | ✅ |
| 品牌对比 | compareBrands | 多品牌 KPI + Health 对比 | ✅ |
| 竞品对比 | compareCompetitors | 主品牌 vs 竞品差异（4 维度） | ✅ |
| 热门内容 | getTopContent | 按 contentType/platform/date 过滤 + qualityScore 排序 | ✅ |
| 健康度趋势 | getHealthTrend | 按月反向生成（默认 6 个月） | ✅ |
| 内容建议 | getContentSuggestions | 5 条建议（high/medium/low 优先级） | ✅ |

## 六、模块边界（合规性）

- ✅ 聚焦品牌分析指标采集与计算
- ✅ 数据存储：内存 Map（生产应迁移至数据库）
- ❌ 不处理广告投放/渠道实时对接
- ❌ 不处理用户画像/CRM（见 member/user 模块）
- ❌ 不依赖外部 AI API
- ✅ 使用随机 Mock 数据模拟真实数据形态
- ✅ 控制器层严格分离 DTO 校验与业务逻辑

## 七、测试覆盖（4 文件，~70 tests）

| 测试文件 | 覆盖范围 | Tests | 状态 |
|----------|----------|-------|------|
| `brand-analytics.service.spec.ts` | KPI / 归因 / 声量 / 健康度 / 内容 / 报告 / ROI / 市场占比 | 17 | ✅ |
| `brand-analytics.controller.spec.ts` | 全部 21 端点路由绑定（含 V24 Phase1 新增 7 端点） | 15+ | ✅ |
| `brand-analytics.dto.spec.ts` | 13 个 DTO 类：日期格式、必填字段、枚举、边界、数组长度 | 13+ | ✅ |
| `__tests__/brand-analytics.e2e-spec.ts` | 8 业务域完整链路：KPI / 归因 / 声量 / 健康度 / 内容 / 报告 / ROI / 市场占比 | 14 组 | ✅ |

## 八、V24 Phase1 新增验收

- [x] `GET /analytics/:brandId` — 综合查询聚合接口
- [x] `POST /compare` — 多品牌对比
- [x] `POST /competitors` — 竞品对比
- [x] `GET /top-content/:brandId` — 热门内容排名
- [x] `GET /health/:brandId/trend` — 健康度趋势
- [x] `GET /content-suggestions/:contentId` — 内容建议
- [x] 新增 DTO 类均已添加 class-validator 校验
- [x] 新增端点已在 controller.spec.ts / e2e-spec.ts 覆盖
- [x] README.md 已同步更新（新增端点示例 + 箍一结构扩展）
