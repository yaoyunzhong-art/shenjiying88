# Brand Analytics 验收标准

## 一、模块完整性

- [x] `brand-analytics.module.ts` — NestJS 模块定义、导入/导出依赖
- [x] `brand-analytics.controller.ts` — REST 控制器（13+ 端点）
- [x] `brand-analytics.service.ts` — 业务逻辑层（内置 Mock 数据）
- [x] `brand-analytics.dto.ts` — 请求 DTO 定义（class-validator）
- [x] `brand-analytics.entity.ts` — 实体/类型定义

## 二、REST 端点验收

| # | 方法 | 路由 | 描述 | 状态 |
|---|------|------|------|------|
| 1 | GET | `/brand-analytics/kpi/:brandId` | 查 KPI 指标 | ✅ |
| 2 | POST | `/brand-analytics/kpi` | 记录 KPI | ✅ |
| 3 | GET | `/brand-analytics/attribution/:brandId` | 渠道归因 | ✅ |
| 4 | GET | `/brand-analytics/attribution/:brandId/compare` | 归因模型对比 | ✅ |
| 5 | GET | `/brand-analytics/mentions/:brandId` | 品牌声量 | ✅ |
| 6 | POST | `/brand-analytics/mentions` | 记录声量 | ✅ |
| 7 | GET | `/brand-analytics/health/:brandId` | 健康度 | ✅ |
| 8 | PATCH | `/brand-analytics/health/:brandId` | 更新健康度 | ✅ |
| 9 | GET | `/brand-analytics/content/:brandId` | 内容表现 | ✅ |
| 10 | POST | `/brand-analytics/content` | 记录内容 | ✅ |
| 11 | POST | `/brand-analytics/report/:brandId` | 生成报告 | ✅ |
| 12 | GET | `/brand-analytics/reports/:brandId` | 报告列表 | ✅ |
| 13 | GET | `/brand-analytics/report/:id` | 报告详情 | ✅ |
| 14 | GET | `/brand-analytics/roi/:brandId` | ROI 计算 | ✅ |
| 15 | GET | `/brand-analytics/market-share` | 市场占比 | ✅ |
| 16 | GET | `/brand-analytics/analytics/:brandId` | 综合查询 | ✅ |
| 17 | POST | `/brand-analytics/compare` | 品牌对比 | ✅ |
| 18 | POST | `/brand-analytics/competitors` | 竞品对比 | ✅ |
| 19 | GET | `/brand-analytics/top-content/:brandId` | 热门内容排名 | ✅ |
| 20 | GET | `/brand-analytics/health/:brandId/trend` | 健康度趋势 | ✅ |
| 21 | GET | `/brand-analytics/content-suggestions/:contentId` | 内容建议 | ✅ |

## 三、认证与守卫

- [x] 控制器级别 `IdentityAccessGuard` 保护
- [x] 全局 `ValidationPipe` 请求校验

## 四、DTO 校验

- [x] `GetKPIDto` — startDate / endDate 日期格式
- [x] `TrackKPIDto` — 品牌 + 指标数据结构
- [x] `TrackMentionDto` — 品牌声量录入
- [x] `UpdateHealthDto` — 健康度部分更新
- [x] `TrackContentDto` — 内容表现录入
- [x] `GenerateReportDto` — 报告类型枚举
- [x] `ROIDto` — ROI 时间范围参数

## 五、模块边界

- ✅ 聚焦品牌分析指标采集与计算
- ❌ 不处理广告投放/渠道对接
- ❌ 不处理用户画像/CRM（见 member/user）
- ❌ 不依赖外部 AI API

## 六、测试覆盖

- [x] 服务层单元测试 — `brand-analytics.service.spec.ts`（17 tests, all ✅）
- [x] 控制器单元测试 — `brand-analytics.controller.spec.ts` 覆盖 15 端点路由绑定
- [x] DTO 校验测试 — `brand-analytics.dto.spec.ts` 覆盖枚举、日期格式、必填字段
- [x] E2E 集成测试 — `__tests__/brand-analytics.e2e-spec.ts` (14 组, 覆盖全部 8 个业务域)
