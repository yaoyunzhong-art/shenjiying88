# PRD-ADMIN: P-47/P-30/P-48 Admin页面

> 创建: 2026-07-18 · V20 Day1

## P-47 品牌运营 — 营销活动管理
- 活动列表: 名称/类型/状态/描述/渠道/进度条
- 目标达成率: 完成度百分比+进度条
- 四维统计: 活动总数/进行中/总预算/已花费
- Tab筛选: 进行中/草稿/已完成/全部
- 页面: `admin-web/app/campaigns/page.tsx`

## P-30 后勤 — 后勤维护
- 维护任务列表: 门店/标题/优先级/状态/负责人
- 紧急标识: 紧急/高/中/低四级优先级
- 四维统计: 任务总数/待处理/进行中/紧急
- Tab筛选: 待处理/进行中/已完成/全部
- 页面: `admin-web/app/maintenance/page.tsx`

## P-48 联名券 — 联名活动管理
- 联名列表: 名称/合作方/类型/状态/有效期/核销率
- ROI分析: 营收/成本/ROI/拉新数
- 核销进度条: 核销率可视化
- Tab筛选: 进行中/已结束/全部
- 页面: `admin-web/app/alliances/page.tsx`

## 代码统计
| 页面 | 文件 | 测试 |
|:-----|:----:|:----:|
| campaigns | 1src | 19 |
| maintenance | 1src | 16 |
| alliances | 1src | 17 |
| procurement | 1src | 38 V20✅ |
| payment-channels | 1src | 15 |
| points-rules | 1src | 15 |
| system-monitor | 1src | 18 |
| profit-loss | 1src | 23 |
| staff | 1src | 51 |
| equipment | 1src | 56 |
| approvals | 1src | 53 |
| notifications | 1src | 40 |
| store-reports | 1src | 31 |
| training | 1src | 49 |
| feedback | 1src | 18 |
| audit-logs | 1src | 63 |
| tags | 1src | 57 |
| coupon-templates | 1src | 68 |
| alliances | 1src | 17 |
| analytics | 1src | 12 |
| coupons | 1src | 65(7假阳) V20✅ |
| customer-tags | 1src | 57 |
| knowledge | 1src | 30 |
| member | 1src | 80 |
| reports | 1src | 48 |
| rules | 1src | 40 V20✅ |
| safety | 1src | 10 |
| settings | 1src | 13 |
| **合计** | **29src** | **962** |
