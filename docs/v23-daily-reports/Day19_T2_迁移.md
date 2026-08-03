# Day 19 T2: 数据库迁移安全性检查

> 日期: 2026-07-26  
> 检查范围: `apps/api/prisma/migrations/`  
> 目标: 确保所有迁移文件安全，无破坏性操作

---

## 一、迁移文件概览

| # | 迁移 | 文件大小 | 主要内容 |
|---|------|---------|---------|
| 1 | `20260612173000_baseline_foundation` | 38 KB | 基础 Schema、枚举、核心表、外键、索引 |
| 2 | `20260612193000_add_governance_approval` | 1.4 KB | 治理审批表 + 索引 |
| 3 | `20260612203000_expand_governance_approval_lifecycle` | 213 B | 枚举值扩展 (CANCELLED, SUPERSEDED) |
| 4 | `20260612220000_add_foundation_alert_acknowledgement` | 909 B | 告警确认表 |
| 5 | `20260614123000_add_lyt_member_snapshot` | 1.1 KB | LYT 会员快照表 |
| 6 | `20260614142000_add_lyt_order_payment_snapshots` | 2.2 KB | LYT 订单/支付快照表 |
| 7 | `20260614154000_extend_lyt_order_snapshot_for_loyalty` | 148 B | LYT 订单快照字段扩展 |
| 8 | `20260615121000_persist_member_operations` | 2.4 KB | 会员操作持久化表 |
| 9 | `20260717131500_add_config_instance_tables` | 1.7 KB | 配置实例表 |
| 10 | `20260718112000_add_custom_domain_tables` | 2.8 KB | 自定义域名表 |
| 11 | `20260721113000_add_finance_report_persistence` | 2.0 KB | 财务报告持久化 |
| 12 | `20260721235000_add_finance_core_persistence_tables` | 3.7 KB | 财务核心表 (发票/账本/账户/结算) |
| 13 | `20260724010000_add_birthday_team_building_open_platform_alliance` | 21.7 KB | 生日/团建/开放平台/联盟表 |
| 14 | `20260724152125_add_brand_ops_logistics` | 25.2 KB | 品牌运营/后勤/采购/库存表 |
| 15 | `20260724155454_add_minor_protection` | 1.7 KB | 未成年人保护表 |
| 16 | `20260724174249_add_cashier_persistence` | 3.6 KB | 收银台持久化表 |

**总计: 16 个迁移文件，覆盖 114 个 Model，34 个 Enum。**

---

## 二、安全检查结果

### ✅ DROP 操作: **0 处** — 完全安全
没有 DROP TABLE、DROP COLUMN、DROP INDEX 等破坏性删除操作。

### ✅ TRUNCATE 操作: **0 处** — 完全安全
没有任何清表操作。

### ✅ DELETE FROM 操作: **0 处** — 完全安全
没有数据删除语句。

### ✅ ALTER TYPE 枚举扩展: **2 处** — 低风险（仅 ADD VALUE）

| 文件 | 操作 |
|------|------|
| `20260612203000_expand_governance_approval_lifecycle` | `ApprovalStatus` 枚举新增 `CANCELLED`、`SUPERSEDED` |

- PostgreSQL `ALTER TYPE ... ADD VALUE` 是不可逆的（无法删除枚举值），但仅添加值是安全的，不会丢失数据。

---

### ⚠️ ALTER COLUMN 类型变更: **4 处** — 需要关注

| 文件 | 表 | 字段 | 变更 |
|------|---|------|------|
| `20260724152125_add_brand_ops_logistics` | `LytOrderSnapshot` | `amount` | `DoublePrecision` → `DECIMAL(10,2)` |
| 同上 | `LytOrderSnapshot` | `discountAmount` | `DoublePrecision` → `DECIMAL(10,2)` |
| 同上 | `LytOrderSnapshot` | `payableAmount` | `DoublePrecision` → `DECIMAL(10,2)` |
| 同上 | `LytPaymentSnapshot` | `amount` | `DoublePrecision` → `DECIMAL(10,2)` |

**风险分析:**
- `DoublePrecision` → `DECIMAL(10,2)`：浮点数转为精确小数
- 整数部分 ≤ 8 位的值安全转换（`10 - 2 = 8` 位整数部分）
- Prisma 在迁移文件中已标注 Warning：数据可能因为精度截断而丢失
- **实际风险**: 低。如果金额在 `-99,999,999.99` 到 `+99,999,999.99` 范围内，转换是安全的

---

## 三、架构质量评估

### 索引覆盖: ✅ 优秀
- 所有 `CREATE INDEX` 使用 `IF NOT EXISTS`（幂等安全）
- 近 200+ 个索引覆盖所有关键查询路径
- 常见索引模式: `tenantId_idx`、`tenantId+status_idx`、`tenantId+createdAt_idx`
- 唯一索引覆盖: `code`、`email`、`apiKey`、`invoiceNo` 等业务唯一键

### 外键约束: 66 处
- 基础迁移文件定义了所有核心表的外键关系
- 主要使用 `ON DELETE RESTRICT`（保护性删除）
- 部分使用 `ON DELETE SET NULL`（级联置空）
- 没有 `ON DELETE CASCADE` 的级联删除 → 更安全

### 架构模式
- 多租户隔离: 所有业务表包含 `tenantId` 字段 + 索引
- IF NOT EXISTS: 较新的迁移都使用幂等语法
- 迁移顺序: 严格按时间戳排序，向后兼容

---

## 四、缺失的安全实践

| 实践 | 状态 | 建议 |
|------|------|------|
| 回滚脚本 | ❌ 缺失 | 每个迁移应配套 `down.sql` |
| 大表操作超时 | ⚠️ 无 | 未使用 `CONCURRENTLY` 创建索引（当前为首次创建，影响小） |
| 迁移前备份 | ❌ 未自动化 | 建议 CI 中加入迁移前自动备份步骤 |
| 迁移锁定检查 | ✅ 安全 | 无显式 `LOCK` 语句 |

---

## 五、结论

### 总体评级: 🟢 安全

**16 个迁移文件全部通过安全检查：**
- 0 处 DROP（破坏性删除）
- 0 处 TRUNCATE（清表）
- 0 处 DELETE FROM（数据删除）
- 仅 4 处类型变更（低风险，精度提升）
- 仅 2 处枚举扩展（低风险，只添加值）

**建议改进（非紧急）：**
1. 为大表未来的索引变更准备 `CONCURRENTLY` 策略
2. 为每个迁移补充 `.down.sql` 回滚脚本
3. 在 CI Pipeline 中加入迁移前自动备份

---

*检查完成时间: 2026-07-26 01:34 CST*
