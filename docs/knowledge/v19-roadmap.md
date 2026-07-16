# V19 Roadmap — 四段轮班制 · 全自动 24h 不间断开发

> 最后更新: 2026-07-16 23:08 · 自进化产出

## 整体框架

### 四段 6 小时轮班制

A 00:00-06:00 — 深夜冲刺（后端 Phase2 + 自动化）
B 06:00-12:00 — 晨间开发（storefront 拉升 + 测试补全）
C 12:00-18:00 — 下午开发（admin-web 增强 + 覆盖率）
D 18:00-00:00 — 晚间收关（验收 + 自进化 + 知识库）

### 每日 KPI

| 指标 | 目标 |
|------|------|
| 代码行数 | >= 60,000 |
| commits | >= 100 |
| TSC | 0 |
| admin-web fail | 0 |
| storefront fail | 0 |
| 脉冲 | >= 12 |

## V19 Day1 (2026-07-17)

### Phase 1: 后端 Phase2 (A段 00:00-06:00)
12个ERP/OMS模块:
1. task-scheduler — 任务调度
2. supplier-manager — 供应商
3. procurement-order — 采购订单
4. warehouse-bin — 库位
5. return-request — 退货
6. quality-inspection — 质检
7. delivery-tracking — 配送跟踪
8. contract-manager — 合同
9. maintenance-plan — 维护
10. shift-scheduler — 排班
11. leave-request — 请假
12. performance-review — 绩效

### Phase 2: storefront 薄页拉升 (B段 06:00-12:00)
7页: insights / maintenance / member-churn / point-history / feedback / loyalty / promotions

### Phase 3: admin-web 深度增强 (C段 12:00-18:00)
覆盖率 48% -> 60%

### Phase 4: 验收 + 知识库 + 自进化 (D段 18:00-00:00)
脉冲 >= 12 + 覆盖率cron + 哈希链 + 23:00自进化

## 策略变更 (V18->V19)
- 子agent: 仅纯新建文件; 复杂页面主session直写
- TSC验证: 主session每次提交前验证
- 测试断言: 宽松匹配 (includes / >=)
- 后端模块: 主session直写 30min/模块

## 反模式预防
- 禁止 as any (AM-001)
- 禁止 subagent 写复杂页面 (AM-009)
- 每次提交前 typecheck (AM-010)
- 测试断言宽松化 (AM-011)

## 技术债务
1. api 测试 hang 24d+
2. admin-web 25 padding it.skip
3. storefront 7页拉升
4. 覆盖率 48% -> 60%
5. Phase2 12模块待创建
