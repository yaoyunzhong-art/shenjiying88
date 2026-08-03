# ✅ ACCEPTANCE: campaign-performance
> 2026-07-29 | V23 圈梁: 代码✅ 测试✅ | 活动效果评估模块

## 模块功能说明

活动效果评估模块（Phase3）用于评估门店营销活动的执行效果，提供活动列表查询、汇总统计和详情查看能力。支持按门店、时间范围、活动类型和状态多维度筛选，自动计算 ROI 及满意度等关键指标。

## API 端点列表

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/campaign-performance` | 活动效果列表（分页+筛选+汇总） | TenantGuard + `report:read` |
| GET | `/campaign-performance/summary` | 活动效果汇总（预算/成本/营收/ROI） | TenantGuard + `report:read` |
| GET | `/campaign-performance/:id` | 单条活动效果详情 | TenantGuard + `report:read` |
| POST | `/campaign-performance` | 创建活动效果记录 | TenantGuard + `report:export` |

### 查询参数 (CampaignQueryDto)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| storeId | string | N | 门店 ID 筛选 |
| startDate | string | N | 开始日期 |
| endDate | string | N | 结束日期 |
| campaignType | enum | N | 活动类型 |
| status | enum | N | 活动状态 |

### 创建请求体 (CreateCampaignDto)

| 字段 | 类型 | 说明 |
|------|------|------|
| campaignName | string | 活动名称 |
| type | enum | 活动类型 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| budget | number | 预算金额 |
| actualCost | number | 实际成本 |
| participants | number | 参与人数 |
| newMembers | number | 新增会员数 |
| revenue | number | 营收金额 |
| satisfaction | number | 满意度评分(0-100, 默认0) |

## 测试覆盖

| 测试文件 | 覆盖内容 |
|----------|----------|
| `campaign-performance.controller.metadata.test.ts` | Controller 元数据/装饰器验证 |
| `campaign-performance.role-extended.test.ts` | 角色扩展测试 |
| `campaign-performance.service.spec.ts` | Service 单元测试 |
| `campaign-performance.service.supplement.spec.ts` | Service 补充场景测试 |
| `campaign-performance.test.ts` | 综合集成测试 |

### 测试类型分布

- **单元测试**: Service 正例/反例/边界全覆盖
- **Controller 测试**: 路由元数据 + 角色权限校验
- **集成测试**: 完整请求-响应链路

## 验收标准

### 功能性

- [x] 活动列表支持多维度筛选（门店/时间/类型/状态）
- [x] 列表返回自动计算 ROI（revenue/cost × 100）
- [x] 汇总接口聚合预算/成本/营收/ROI 统计
- [x] 详情接口按 ID 精准查询
- [x] 创建接口接收完整活动参数并返回计算结果
- [x] 不存在活动返回 404（通过 null 表示）

### 安全性

- [x] Controller 使用 `TenantGuard` 多租户隔离
- [x] 读取操作要求 `report:read` 权限
- [x] 写入操作要求 `report:export` 权限
- [x] `@RequireTenantScope()` 租户范围约束

### 代码质量

- [x] Service 有单元测试
- [x] Controller 有 AuthGuard
- [x] TSC 零错误
- [x] 零 skip/only
- [x] DTO 使用 class-validator 严格校验
- [x] Swagger `@ApiTags`/`@ApiOperation` 文档完备
