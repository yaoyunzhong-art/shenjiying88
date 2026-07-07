# T167 · 库存模块任务卡

## 元信息
- **T-NN**: T167 (P1 业务深耕启动)
- **Phase**: 37
- **标题**: inventory.service.ts + Reservation/Allocation 机制
- **优先级**: 🟢 P1 (高, P1 业务深耕启动模块)
- **估时**: 2d (16h)
- **创建日期**: 2026-06-27
- **派发人**: 🦞 龙虾哥
- **执行人**: 🌲 树哥trae
- **状态**: 🟡 派发中
- **依赖**: ✅ Phase-35 收银台 (订单/支付) + Phase-36 会员 (休眠/跨租户)

---

## 1. 现状盘点

### ✅ 已就位
- Phase-35 订单服务 (`OrderService`): 商品 ID 已知, 但无库存校验
- Phase-35 支付服务 (`PaymentService`): 支付成功但未扣库存
- Phase-36 会员: 提供 tenantId 强制注入

### ❌ 待建 (T167 真正待办)
- `InventoryItem` entity + `InventoryReservation` entity
- `InventoryService`: CRUD + 出入库 + 预留 + 释放
- `InventoryController`: 8+ endpoint
- `admin-web/app/inventory/page.tsx`: 库存管理界面
- 反模式库 v4 命中

---

## 2. 验收标准 (AC · 14 项)

### AC-1: 实体定义
- [ ] `InventoryItem` interface: id + tenantId + sku + name + totalQty + availableQty + reservedQty + lowStockThreshold
- [ ] `InventoryReservation` interface: id + tenantId + itemId + orderId + qty + status (PENDING/CONFIRMED/RELEASED/EXPIRED) + expiresAt
- [ ] 持久化字段: createdAt + updatedAt + version (乐观锁)

### AC-2: CRUD
- [ ] `create(input)` 创建库存项
- [ ] `getById(id, tenantId)` 查询 (强制 tenantId)
- [ ] `list(filter)` 列表 (按 tenantId + sku + status 过滤)
- [ ] `update(id, tenantId, patch)` 更新 (乐观锁 version)
- [ ] `delete(id, tenantId)` 删除 (软删除, 保留审计)

### AC-3: 出入库
- [ ] `stockIn(itemId, qty, reason)` 入库 + totalQty/availableQty += qty
- [ ] `stockOut(itemId, qty, reason)` 出库 + 校验 availableQty >= qty
- [ ] `adjust(itemId, newQty, reason)` 盘点调整 (diff 写入 audit)

### AC-4: Reservation 机制 (核心)
- [ ] `reserve(itemId, qty, orderId, ttlSeconds=600)` 创建预留
- [ ] 预留时 availableQty -= qty, reservedQty += qty
- [ ] `confirmReservation(reservationId)` 订单支付成功后: reservedQty -= qty, totalQty -= qty
- [ ] `releaseReservation(reservationId)` 订单取消/超时: availableQty += qty, reservedQty -= qty
- [ ] 预留过期 cron: expiresAt < now → 自动 release

### AC-5: 库存不足防御
- [ ] reserve 时 availableQty < qty 抛 InsufficientStockException
- [ ] stockOut 时 availableQty < qty 抛 InsufficientStockException
- [ ] 错误信息不泄露其他租户数据 (PII 防御)

### AC-6: 乐观锁
- [ ] update 时 version 校验 (DR-36 决策 3)
- [ ] 并发更新时 version 冲突抛 BadRequestException
- [ ] 反模式 v4 防御: 不依赖单实例锁

### AC-7: 跨租户隔离
- [ ] 所有查询/操作强制 tenantId
- [ ] 跨租户访问返回 null (由 controller 转 403)
- [ ] 反模式 v4 cross-tenant-data-leak 防御

### AC-8: cron 过期清理
- [ ] `InventoryReservationCron` 每 5 分钟跑一次
- [ ] 扫描 expiresAt < now 的 PENDING reservation
- [ ] 自动 release (回滚 availableQty)
- [ ] 状态变 EXPIRED, 记录 reservationHistory

### AC-9: HTTP endpoint (8+)
- [ ] GET    /api/inventory          列表
- [ ] POST   /api/inventory          创建
- [ ] GET    /api/inventory/:id      详情
- [ ] PATCH  /api/inventory/:id      更新 (乐观锁)
- [ ] DELETE /api/inventory/:id      软删除
- [ ] POST   /api/inventory/:id/stock-in   入库
- [ ] POST   /api/inventory/:id/stock-out  出库
- [ ] POST   /api/inventory/:id/reserve    预留
- [ ] POST   /api/inventory/reservations/:id/confirm 确认预留
- [ ] POST   /api/inventory/reservations/:id/release 释放预留
- [ ] GET    /api/inventory/reservations    预留列表
- [ ] GET    /api/inventory/low-stock       低库存预警

### AC-10: 反模式库 v4 命中 (3 文件)
- [ ] [optimistic-lock-pattern.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/optimistic-lock-pattern.md): 乐观锁
- [ ] [cron-job-pitfall.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/cron-job-pitfall.md): 过期清理 cron
- [ ] [async-try-catch-pattern.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/async-try-catch-pattern.md): 批量错误隔离

### AC-11: admin-web 界面
- [ ] `apps/admin-web/app/inventory/page.tsx` 新建
- [ ] 表格: SKU/名称/总量/可用/预留/低库存预警
- [ ] 操作按钮: 入库/出库/预留/盘点
- [ ] 实时反馈 (toast)

### AC-12: 测试覆盖 (≥ 14 断言)
- [ ] `inventory.test.ts` 新建
- [ ] CRUD 5 断言
- [ ] 出入库 3 断言
- [ ] Reservation 4 断言 (reserve/confirm/release/expire)
- [ ] 库存不足抛错 1 断言
- [ ] 跨租户防御 1 断言

### AC-13: 业务集成点
- [ ] `OrderService.createOrder` 集成 `InventoryService.reserve` (预留)
- [ ] `PaymentService.confirm` 集成 `InventoryService.confirmReservation`
- [ ] `OrderService.cancel` 集成 `InventoryService.releaseReservation`
- [ ] TODO: Phase-46 真实 DB 落地 (当前 in-memory)

### AC-14: race-safe commit
- [ ] commit 前跑 `bash scripts/race-safe-commit.sh "T167 库存模块"`
- [ ] commit message 含 `Phase-37 step 1: T167 库存模块启动`

---

## 3. 实施步骤 (2 天)

### Day 1 (8h): 实体 + Service + Reservation

- Step 1.1: inventory-item.entity.ts (1h)
- Step 1.2: inventory-reservation.entity.ts (1h)
- Step 1.3: inventory.service.ts (3h) - CRUD + stockIn/Out + reserve/confirm/release
- Step 1.4: inventory.cron.ts (1h) - 过期清理
- Step 1.5: inventory.test.ts 基础 (2h)

### Day 2 (8h): Controller + 集成 + admin-web + 反模式库

- Step 2.1: inventory.controller.ts (2h) - 10+ endpoint
- Step 2.2: 集成 OrderService + PaymentService (2h)
- Step 2.3: admin-web/inventory/page.tsx (2h)
- Step 2.4: 反模式库 v4 + 1 (1h)
- Step 2.5: E2E + race-safe commit (1h)

---

## 4. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| 超卖 (oversell) | 高 | 高 | 乐观锁 + 库存预扣 (reserve) + 事务 |
| 预留泄漏 (长时间 PENDING) | 中 | 中 | cron 过期自动 release |
| 并发更新冲突 | 中 | 中 | version 字段乐观锁 |
| 跨租户库存误操作 | 低 | 高 | 强制 tenantId 校验 |
| 低库存无预警 | 中 | 中 | lowStockThreshold + 低库存列表 |
| 大批量扣减性能 | 低 | 中 | 分批 100/批 |

---

## 5. 上下游依赖

### 上游 (✅ 已就位)
- Phase-35 订单: OrderService.createOrder / cancel / confirm
- Phase-35 支付: PaymentService.confirm
- Phase-36 会员: tenantId 强制注入

### 下游
- T168 财务: 库存成本核算
- T169 报表: 库存周转 KPI / 低库存报表
- T170 推荐: 基于库存的推荐

---

## 6. 提交格式

```
🛡️ R-06 race-safe auto-commit

Phase-37 step 1: T167 库存模块启动
- apps/api/src/modules/inventory/inventory-item.entity.ts
- apps/api/src/modules/inventory/inventory-reservation.entity.ts
- apps/api/src/modules/inventory/inventory.service.ts (CRUD + 出入库 + 预留)
- apps/api/src/modules/inventory/inventory.cron.ts (过期清理)
- apps/api/src/modules/inventory/inventory.controller.ts (10+ endpoint)
- apps/api/src/modules/inventory/inventory.test.ts (14+ 断言)
- apps/admin-web/app/inventory/page.tsx (库存管理界面)
- knowledge/anti-patterns/v4/optimistic-lock-pattern.md (新反模式)
- 反模式库 v4: optimistic-lock + cron-job-pitfall + async-try-catch
- R-06 防御: race-safe + HEARTBEAT.record
```

---

> 🦞 **"T167 = 库存是电商命脉 = 超卖零容忍 = Reservation 机制兜底"**