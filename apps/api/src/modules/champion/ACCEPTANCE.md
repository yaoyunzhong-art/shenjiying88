# ✅ ACCEPTANCE: champion
> 2026-07-29 | V23 圈梁: 代码✅ 测试✅ | Champion Dashboard 知识贡献管理模块

## 模块功能说明

Champion Dashboard 模块（Phase-18 T19-T20）用于管理"知识 Champion"的注册、贡献记录、排行榜和决策时间线。支持按角色筛选 Champion、按权重累加贡献得分、生成排行榜及可视化知识地图。Champion 角色分为 APPROVER（审批者）、CHAMPION（倡导者）、OBSERVER（观察者）。

### 贡献类型与权重

| 贡献类型 | 权重 | 说明 |
|----------|------|------|
| COMMIT | 3 | 代码提交 |
| REVIEW | 2 | 代码审查 |
| RFC | 5 | RFC 提案 |
| PULSE_REVIEW | 4 | 脉冲审查 |
| RETRO | 1 | 回顾总结 |

## API 端点列表

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/champions` | 注册新 Champion | TenantGuard |
| POST | `/champions/contribution` | 记录知识贡献 | TenantGuard |
| GET | `/champions` | 列出所有 Champion（支持 role 过滤） | TenantGuard |
| GET | `/champions/ranking` | 获取贡献排行榜 | TenantGuard |
| GET | `/champions/timeline` | 决策时间线 | TenantGuard |
| GET | `/champions/knowledge-map` | 知识地图概览 | TenantGuard |
| GET | `/champions/:id` | 查询单个 Champion 详情 | TenantGuard |

### 请求体说明

**注册 Champion (RegisterChampionDto)**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | Y | Champion 名称 |
| role | enum | Y | APPROVER / CHAMPION / OBSERVER |
| joinedAt | string | N | 加入时间 (ISO 日期) |

**记录贡献 (RecordContributionDto)**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| championId | string | Y | Champion ID |
| kind | enum | Y | COMMIT / REVIEW / RFC / PULSE_REVIEW / RETRO |
| refId | string | Y | 关联引用 ID |
| description | string | N | 贡献描述 |
| occurredAt | string | N | 发生时间 (ISO 日期) |

**排行榜查询 (RankingQueryDto)**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | enum | N | 按角色筛选 |

**时间线查询 (TimelineQueryDto)**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| championId | string | N | 按 Champion 筛选 |
| sinceDate | string | N | 起始日期 |

## 测试覆盖

| 测试文件 | 覆盖内容 |
|----------|----------|
| `champion.controller.spec.ts` | Controller 正例/反例/边界全覆盖 |
| `champion.controller.test.ts` | Controller 路由与权限验证 |
| `champion.controller.metadata.test.ts` | Controller NestJS 元数据 |
| `champion.service.spec.ts` | Service 纯函数测试（正例8+、反例5+、边界5+） |
| `champion.service.test.ts` | Service 综合场景测试 |
| `champion.service-extended.test.ts` | Service 扩展场景 |
| `champion.module.test.ts` | 模块元数据校验 |
| `champion.contract.test.ts` | 契约测试 |
| `champion.dto.test.ts` | DTO 验证规则测试 |
| `champion.entity.test.ts` | 实体定义测试 |
| `champion.role.test.ts` | 角色逻辑测试 |
| `champion.role-extended.test.ts` | 角色扩展测试 |
| `champion.role-v3.test.ts` | 角色 V3 场景 |
| `champion.role-scenario.test.ts` | 角色场景化测试 |
| `champion.ringbeam.test.ts` | 全链路测试 |
| `champion.e2e.test.ts` | E2E 测试 |
| `champion.e2e.enhanced.test.ts` | E2E 增强测试 |
| `champion.simulator.test.ts` | 模拟器测试 |

## 验收标准

### 功能性

- [x] Champion 注册：名称+角色必填，可加入时间可选
- [x] 贡献记录：支持 5 种贡献类型，自动按权重累加得分
- [x] Champion 列表：支持按角色（APPROVER/CHAMPION/OBSERVER）筛选
- [x] 排行榜：按总贡献得分降序排列，细分各类贡献计数
- [x] 决策时间线：支持按 championId + sinceDate 过滤
- [x] 知识地图：统计 Champion 总数、贡献总数、得分总额及分类型/分角色聚合
- [x] 不存在的 Champion 返回 404（NOT_FOUND）
- [x] 无贡献的 Champion 排行榜正常返回（得分=0）

### 安全性

- [x] Controller 使用 `TenantGuard` 多租户隔离
- [x] 所有端点均受租户上下文保护

### 代码质量

- [x] Service 有单元测试
- [x] Controller 有 AuthGuard
- [x] TSC 零错误
- [x] 零 skip/only
- [x] DTO 使用 class-validator 严格校验（@IsString/@IsEnum/@IsDateString/@IsOptional）
- [x] 测试覆盖正例/反例/边界 3 种场景
- [x] E2E 测试覆盖完整请求链路
