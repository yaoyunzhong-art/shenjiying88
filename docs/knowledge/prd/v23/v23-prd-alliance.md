# V23 PRD: 异业联盟 P0 — WP-17A 入驻退出/分账/状态日志 卡

> 版本: v23 (2026-07-23)
> 状态: ✅ 已交付
> 来源: [6-8-dev-master-backlog-v2 §6](./2026-07-23-6-8-development-master-backlog-v2.md)
> 工作包: WP-17A
> 关联: BS-0217, BS-0220, BS-0221
> 前置: WP-02A, WP-02B, WP-04A, WP-13A

---

## 1. 交付内容

### 1.1 入驻/退出机制 (BS-0217)

| 能力 | 端点 | 状态 |
|------|------|------|
| 伙伴注册 | `POST /alliance/partner/register` | ✅ 已有 (controller + service) |
| 伙伴信息更新 | `PUT /alliance/partner/:partnerId` | ✅ 已有 |
| 伙伴查询/列表 | `GET /alliance/partner/:partnerId` / `GET /alliance/partner` | ✅ 已有 |
| **伙伴退出/停用** | `POST /alliance/partner/:partnerId/deactivate` | 🆕 **本次新增** |
| **伙伴重新启用** | `POST /alliance/partner/:partnerId/reactivate` | 🆕 **本次新增** |

**退出机制实现细节：**
- `AlliancePartner.deactivatePartner()` — 将 status 从 ACTIVE → INACTIVE
- `AlliancePartner.reactivatePartner()` — 将 status 从 INACTIVE → ACTIVE
- 退出时带审计日志 (eventType: `admin.config_change`, riskLevel: `medium`)
- 退出后伙伴保留在列表中（过滤可查），不可重新注册同名

### 1.2 分账报表 + 驳回/取消 (BS-0220)

| 能力 | 端点 | 状态 |
|------|------|------|
| 创建分账单 | `POST /alliance/settlement/create` | ✅ 已有 (支持 ratio / fixed) |
| 审批分账 | `POST /alliance/settlement/:settlementId/approve` | ✅ 已有 |
| 执行分账 | `POST /alliance/settlement/:settlementId/execute` | ✅ 已有 |
| 查询分账 | `GET /alliance/settlement/:settlementId` | ✅ 已有 |
| 分账历史 | `GET /alliance/settlement/history/:partnerId` | ✅ 已有 |
| **驳回分账** | `POST /alliance/settlement/:settlementId/reject` | 🆕 **本次新增** |
| **取消分账** | `POST /alliance/settlement/:settlementId/cancel` | 🆕 **本次新增** |
| 标记可疑 | `POST /alliance/settlement/:settlementId/flag-suspicious` | ✅ 已有 |

**分账流程：**
```
pending → [approve] → approved → [execute] → executed
  |                     |
  └ [reject] → cancelled └ [cancel] → cancelled
```

### 1.3 完整状态日志与审计 (BS-0221)

| 审计事件 | 触发操作 | 记录位置 |
|----------|----------|----------|
| `admin.role_create` | 伙伴注册 | `AllianceService.registerPartner()` |
| `admin.config_change` | 伙伴更新/停用/启用/等级变更 | `AllianceService.*` |
| `settlement.created` | 创建分账 | `AllianceService.createSettlement()` |
| `settlement.approved` | 审批分账 | `AllianceService.approveSettlement()` |
| `settlement.rejected` | 驳回/取消分账 | `AllianceService.rejectSettlement()` / `cancelSettlement()` |
| `settlement.paid` | 执行分账 | `AllianceService.executeSettlement()` |

> ⚠️ **注意:** Controller 目前**直接注入子服务**（`AlliancePartner` 等），绕过 `AllianceService` facade 的审计桩。审计日志通过 `AllianceService` 方法触发才能写出。Controller 端点当前只走子服务逻辑，审计日志有待后续统一接入。

## 2. 模块架构关系

```
┌──────────────────────────────┐
│       AllianceController     │ ← TenantGuard + ValidationPipe
├──────────────────────────────┤
│       AllianceService        │ ← Facade, 6 子服务 + 审计
├──────────┬─────────┬─────────┤
│ Alliance │Alliance-│Royalty  │ ← 分润引擎（品牌级）
│ Partner  │Settlement│Service  │
│ Grading  │Detector │         │
│ Health   │Anomaly  │Contract │ ← 合同管理（全生命周期）
└──────────┴─────────┴─────────┘
```

## 3. API 清单（完整版，含本次新增）

| 方法 | 端点 | 描述 | 新增 |
|------|------|------|------|
| POST | `/alliance/partner/register` | 注册联盟伙伴 | - |
| PUT | `/alliance/partner/:partnerId` | 更新伙伴信息 | - |
| GET | `/alliance/partner/:partnerId` | 获取伙伴详情 | - |
| GET | `/alliance/partner` | 列表（支持过滤） | - |
| **POST** | **`/alliance/partner/:partnerId/deactivate`** | **停用/退出伙伴** | 🆕 |
| **POST** | **`/alliance/partner/:partnerId/reactivate`** | **重新启用伙伴** | 🆕 |
| GET | `/alliance/grading/criteria` | 分级标准 | - |
| POST | `/alliance/grading/:partnerId/calculate` | 计算等级 | - |
| PUT | `/alliance/grading/:partnerId/assign` | 手动指定等级 | - |
| GET | `/alliance/grading/:partnerId` | 当前等级 | - |
| POST | `/alliance/grading/:partnerId/auto-upgrade` | 自动升级 | - |
| POST | `/alliance/grading/:partnerId/auto-downgrade` | 自动降级 | - |
| POST | `/alliance/health/:partnerId/calculate` | 计算健康度 | - |
| GET | `/alliance/health/:partnerId/factors` | 健康度因素 | - |
| GET | `/alliance/health/:partnerId/trend` | 健康度趋势 | - |
| POST | `/alliance/settlement/create` | 创建分账 | - |
| POST | `/alliance/settlement/:settlementId/approve` | 审批分账 | - |
| POST | `/alliance/settlement/:settlementId/execute` | 执行分账 | - |
| **POST** | **`/alliance/settlement/:settlementId/reject`** | **驳回分账** | 🆕 |
| **POST** | **`/alliance/settlement/:settlementId/cancel`** | **取消分账** | 🆕 |
| GET | `/alliance/settlement/:settlementId` | 查询分账 | - |
| GET | `/alliance/settlement/history/:partnerId` | 分账历史 | - |
| POST | `/alliance/settlement/:settlementId/flag-suspicious` | 标记可疑 | - |
| POST | `/alliance/order/scan-unlinked` | 扫描未关联订单 | - |
| POST | `/alliance/order/:orderId/link` | 手动关联 | - |
| POST | `/alliance/order/:orderId/auto-link` | 自动关联 | - |
| POST | `/alliance/anomaly/detect/:partnerId` | 检测异常 | - |
| GET | `/alliance/anomaly/report/:partnerId` | 异常报告 | - |

## 4. 依赖模块

| 模块 | 关系 | 说明 |
|------|------|------|
| audit | 强依赖 | 审计日志模块，所有关键操作记录审计事件 |
| agent | 强依赖 | TenantGuard 多租户鉴权守卫 |
| notification | 消费 | 注册/等级变更/分账/异常告警事件 (alliance.contract.ts) |
| analytics | 消费 | 伙伴健康度趋势 |

## 5. 遗留项 / 缺口

- [ ] **Controller 审计接入** — Controller 直接注入 6 个子服务而非通过 AllianceService facade，导致审计日志在 controller 路径下不会写出
- [ ] **分账报表导出** — 未实现 CSV/PDF 导出功能
- [ ] **分账汇总报表** — 缺少按时间/伙伴维度的汇总报表 API
- [ ] **硬删除** — 当前只支持软停用（INACTIVE），无硬删除入口
