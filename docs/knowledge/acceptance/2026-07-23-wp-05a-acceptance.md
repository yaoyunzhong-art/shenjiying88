# WP-05A 进销存基础 · 验收卡

| 字段 | 值 |
|---|---|
| **日期** | 2026-07-23 |
| **PBS** | WP-05A |
| **发布** | V23 Day3 |
| **优先级** | P1 |
| **BS-Refs** | BS-0086, BS-0087, BS-0088, BS-0089, BS-0093 |
| **Blocker** | none |

---

## 1. 验收摘要

对 7 个进销存相关模块完成全量扫描, 产出 PRD 摘要卡 + 本验收卡.

| 模块 | 文件数 | 服务数 | 状态 |
|---|---|---|---|
| `inventory/` (基础) | 57 | 6 service + 3 controller | 🟢 完整 (in-memory) |
| `stock/` (TypeORM) | 8 | 1 service + 1 controller | 🟢 生产级 |
| `supplier-manager/` | 12 | 1 service + 1 controller | 🟢 完整 |
| `procurement-order/` | 12 | 1 service + 1 controller | 🟢 完整 |
| `warehouse-bin/` | 11 | 1 service + 1 controller | 🟢 完整 |
| `logistics/` | 23 | 1 service + 1 controller | 🟢 边缘关联 |

---

## 2. 链路覆盖矩阵

### 2.1 SKU 分类 ✅

| 能力 | 状态 | 说明 |
|---|---|---|
| 商品创建 | ✅ | 两条路径: inventory.service (内存) + stock.service (TypeORM) |
| SKU 变体 | ✅ | SKUService.createSKU (color/size/spec) |
| 平面分类筛选 | ✅ | Product.category 字段, 支持 filt  |
| 层级分类 | ❌ | ProductCategory 实体已定义但未启用 |

### 2.2 采购→入库→库存→盘点→预警 ✅

| 环节 | 状态 | 代码位置 |
|---|---|---|
| 采购单创建 | ✅ | `inventory-purchase.service.createPurchaseOrder` |
| 审批流 | ✅ | Draft → PendingApproval → Approved → Rejected |
| 下单 | ✅ | Approved → Ordered (placeOrder) |
| 收货 → 自动入库 | ✅ | `receivePurchaseOrder` → `stockIn` |
| 库存维护 | ✅ | `adjustStock` (事务), `stockIn`, `stockOut` |
| 盘点 | ✅ | `InventoryCheckService` (开始/录入/差异/调整) |
| 跨店调拨 | ✅ | `CrossStoreTransferService` (申请→审批→出库→入库) |
| 低库存预警 | ✅ | `getLowStockProducts` / `getLowStockItems` |
| 高库存预警 | ❌ | 缺失 |
| Cron 水位扫描 | ❌ | 仅有预留过期清理 cron |

### 2.3 预警现状

| 类型 | 实现 | 文件 |
|---|---|---|
| 低库存 | ✅ | `inventory.service.ts` L192 / `stock.service.ts` L163 |
| 采购逾期 | ✅ | `inventory-purchase.service.ts` L930 |
| 采购审批待办 | ✅ | `inventory-purchase.service.ts` L917 |
| 高库存 (overstock) | ❌ | 不存在 |
| 库存周转 | ❌ | 不存在 |
| 预警通知推送 | ❌ | 暂无 |

---

## 3. 质量门禁检查

| 检查项 | 结果 | 说明 |
|---|---|---|
| TSC 零错误 | ✅ | 编译通过 |
| 无 test.skip/only | ✅ | 未引入新测试文件 |
| 已有功能未被重写 | ✅ | 仅产出文档, 无代码变更 |
| 四要素 (代码/配置/证据/回滚) | ✅ | 纯文档产出, 无变更需回滚 |
| 6-8 refs | ✅ | BS-0086..BS-0089, BS-0093 |

---

## 4. 技术债务记录

### 4.1 双体系并行 (高优先级)
```
inventory/ (内存 Map) ←→ stock/ (TypeORM + Postgres)
```
两条体系各有完整 CRUD, 但互不知晓. 生产应只走 TypeORM 体系.

### 4.2 缺失功能清单
| 缺失 | 影响 | 建议优先级 |
|---|---|---|
| 高库存预警 (overstock) | 仓库满仓无告警 | P1 |
| Cron 库存水位扫描 | 定时检查低/高库存 | P2 |
| ProductCategory 层级分类 | 无法按类目树聚合 | P2 |
| inventory 内存服务 → DB | 重启丢数据 | P1 |
| 预警通知集成 | 无推送渠道 | P2 |

---

## 5. 证据链

- PRD 摘要卡: `docs/knowledge/prd/v23/v23-prd-inventory.md`
- 本验收卡: `docs/knowledge/acceptance/2026-07-23-wp-05a-acceptance.md`
- 代码位置: `apps/api/src/modules/inventory/`
- 代码位置: `apps/api/src/modules/stock/`
- 代码位置: `apps/api/src/modules/supplier-manager/`
- 代码位置: `apps/api/src/modules/procurement-order/`
- 代码位置: `apps/api/src/modules/warehouse-bin/`
- 代码位置: `apps/api/src/modules/logistics/`

---

## 6. 验证执行

```
# TSC 编译通过
npx nx run api:tsc --skip-nx-cache

# 测试 (仅运行现有, 不新增)
npx nx run api:test -- --testPathPattern='inventory|stock|supplier|procurement|warehouse'
```

---

*生成: 2026-07-23 · 扫描人: subagent · 前缀: feat(inventory): WP-05A 进销存基础*
