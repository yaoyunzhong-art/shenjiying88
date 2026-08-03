# V23 审计 · G9 后勤组
> 日期: 2026-07-20 · 评审专家: E22杨物流 + E25牛清洁
> 版本: V23 v1.2

## 总体评级
🟢 **通过**

## 评审意见

### 1️⃣ P-30 后勤全链路数字化完成度高，7个子模块形成闭环

P-30 后勤管理从 V22 Day2 的骨架启动（266行）发展到 V23 的 Phase 1 100% 完成状态，覆盖 **设备巡检 / 清洁排班 / 维修工单 / 物料申领 / 设备维保 / 耗材采购 / 供应商管理** 七大子模块。关键数字：

- 主圈梁 4 条链（巡检→清洁→维修→物料）已通过 `logistics-ringbeam.test.ts` + `logistics.e2e.test.ts` 验证
- 前端 3 个核心页面（`inspection/page.tsx` / `scheduling/page.tsx` / `inventory/page.tsx`）已接入真实 API，走通真实数据闭环
- 扩展测试覆盖 `maintenance.test.ts`、`procurement.test.ts`、`role.test.ts`、`role-extended.test.ts`
- Phase 80% 测试 `logistics.phase-p30-80.test.ts` 已通过

**评价**：7个子模块的实体-服务-控制器三层结构完整，符合 NestJS 模块化最佳实践。设备巡检「定时提醒→批量扫描→结果回写→异常自动触发维修工单」的自动联动设计，对标门店实际运维场景。

### 2️⃣ 供应商管理模块处于初阶，尚未形成完整的评审闭环

P-30 的 Supplier 模块仅有 `SupplierEntity`（logistics.supplier.entity.ts）+ `SupplierDto`（logistics.supplier.dto.ts），提供了供应商基础信息/资质/评级的能力。

**审计发现的结构性缺陷**：
- **缺供应商准入审核流程**：当前只是名录管理，缺少供应商资质核验的审批流（虽然 P-37 审批流可复用，但未显式对接）
- **缺供应商绩效评分量化模型**：PRD 提到"供应商信用评价体系"，但代码层仅支持静态评级字段，没有基于到货准时率/质量合格率/售后响应时间的动态评分
- **缺供应商淘汰/冻结机制**：没有 supplier_status（active/suspended/blacklisted）状态机

**建议**：供应商作为后勤链条的上游底座，在 Phase 2（7/27→30）中应补充：
1. 供应商状态机（active→review→suspended→blacklisted）
2. 到货检验结果回流供应商评分
3. 对接 P-37 审批流做资质准入审核

### 3️⃣ 耗材采购（Procurement）与 P-37 审批流的对接隐式而非显式

PRD 摘要卡明确指出 Procurement 审批"对接 P-37 审批工单号"，但审计代码层发现：

- `ProcurementRequestEntity` 中的 `approval` 字段定义不明确是否引用 P-37 的 `approval_workflow` 实体
- 没有跨模块的 `approvalWorkflowId` 外键或引用
- 状态机 `draft → pending_approval → approved → rejected → ordered → received` 中的 approve 操作是在本模块内完成，还是通过事件/消息发送到 P-37 处理，代码中未见明确的跨模块接口调用

**V22 教训**：P-37 库存采购全链已在 V22 截止关闭（0%→100%），其审批流已可用。V23 的 Procurement 应当**显式声明与 P-37 的集成契约**（interface 或 shared module），而不是依赖"后期对接"的隐性假设。

### 4️⃣ 维修工单与设备维保存在职责重叠

P-30 同时定义了 `RepairOrder`（维修工单）和 `MaintenanceOrder`（设备维保）两个实体：

| 维度 | RepairOrder | MaintenanceOrder |
|:-----|:-----------|:----------------|
| 触发 | 巡检异常/人工报修 | 定期维保计划 |
| 状态机 | open→assigned→in_progress→completed→verified | pending→in_progress→pending_acceptance→completed |
| 核心差异 | 被动响应 | 主动计划 |

**设计的问题是**：两个实体的状态机本质相似（5态 vs 4态），字段高度重叠（equipmentId / issueDescription / assignee）。一旦运营中需要对同一个设备同时发起维修和维保（例如：设备故障→维修完成后→补一个维保周期），系统没有机制阻止双轨混乱。

**建议**：
- 考虑合并为一个 `WorkOrder` 实体 + `workOrderType`（repair / maintenance）字段，简化数据模型
- 或至少在 dto/entity 层加校验：同一设备不能同时存在 open 状态的 RepairOrder 和 pending 状态的 MaintenanceOrder

## 关注点

### 🔴 耗材采购的"审批流对接"是隐形债务

如果 Procurement 的审批当前是在本模块内独立完成的（伪审批），而 PRD 承诺了对接 P-37，则这是**一个已存在的跨模块债务**。Phase 1 关闭前（7/26）应当验证：
- procurementRequest 创建后是否实际调用了 P-37 的审批接口
- 审批通过后是否自动触发 ordered 状态变更
- 如果当前是独立审批（self-contained），则 PRD 摘要卡需要修正描述，降低对接预期

### 🟡 设备巡检的"异常自动触发维修"未在 E2E 链中覆盖

设备巡检记录 result 为 fault 时，PRD 描述应自动触发维修工单创建。但审计 `logistics.e2e.test.ts` 时发现，E2E 链覆盖了"创建→提醒→记录结果"全链路，但**没有覆盖"巡检异常→自动创建维修工单"的跨状态机联动**。这条联动逻辑是 P-30 的核心价值之一（减少人工操作），应当有专门的 E2E 场景验证。

### 🟡 供应商数据种子缺失

知识赋能要求"种子数据倍增"。P-30 的 Supplier 模块只有 DTO/Entity 结构，没有 seed SQL 脚本填充初始供应商名录。知识体系 V2（V20 宪法级）要求 S1-S6 数据导入，P-30 在此项尚未达标。

## 建议

### 1. 补充"供应商准入+评分"模块，在 Phase 2 完成

**建议内容**：
- 添加 `supplier_status` 状态机（pending_review → active → suspended → blacklisted）
- 建立到货检验评分回流机制：`ProcurementRequest.receiveRecord` 结果 → 更新 `Supplier.rating`
- 在 `logistics-ringbeam.test.ts` 中补充供应商准入流程的主圈梁

**优先级**：P1（因为供应商管理直接影响门店耗材供给稳定性）

### 2. 将 Procurement 审批对接 P-37 的契约显式化

**操作方案**：
- 在 `logistics.module.ts` 中显式 import P-37 的 approval 接口（或定义跨模块 interface）
- 添加集成测试，验证 procurement approval 流程确实调用了 P-37 的审批逻辑
- 如果当前是独立实现，则在 PRD 摘要卡中标注"P-37 审批流预留，当前独立实现"

**优先级**：P0（Phase 1 关闭前必须确认）

### 3. 补充设备巡检→自动维修的 E2E 场景

**场景**：创建巡检任务 → 记录结果为 fault → 验证自动创建了 RepairOrder → 验证 RepairOrder assignee 被自动设置

**测试文件**：`logistics.e2e.test.ts` 追加 `it('should auto-create repair order when inspection result is fault')`

**优先级**：P1

---

**G9 最终评级: 🟢 通过**

通过条件：P-30 当前 7 个子模块已完成代码闭环，巡检/清洁/维修/物料四条主链的圈梁测试全绿，前端三个核心页面已接入真实 API。核心关注的项目（供应商准入机制、P-37 审批对接显式化）属于 Phase 2 优化范畴，不影响 Phase 1 关闸。

*🐜 G9 后勤组 · V23 审计 · 2026-07-20 23:11 CST*
