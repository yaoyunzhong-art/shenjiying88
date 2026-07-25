# Day12 L6 — 数据库迁移检查 + Prisma Schema审计

> **审计时间**: 2026-07-25 22:17 CST  
> **审计角色**: 龙虾哥 (龙队数据库专家)  
> **项目**: shenjiying88 (神机营主站)

---

## 1. 迁移历史

### 迁移列表 (共 16 个迁移 + 1 个 lock)

| # | 迁移名 | 日期 |
|---|--------|------|
| 1 | 20260612173000_baseline_foundation | 06-12 |
| 2 | 20260612193000_add_governance_approval | 06-12 |
| 3 | 20260612203000_expand_governance_approval_lifecycle | 06-12 |
| 4 | 20260612220000_add_foundation_alert_acknowledgement | 06-12 |
| 5 | 20260614123000_add_lyt_member_snapshot | 06-14 |
| 6 | 20260614142000_add_lyt_order_payment_snapshots | 06-14 |
| 7 | 20260614154000_extend_lyt_order_snapshot_for_loyalty | 06-14 |
| 8 | 20260615121000_persist_member_operations | 06-15 |
| 9 | 20260717131500_add_config_instance_tables | 07-17 |
| 10 | 20260718112000_add_custom_domain_tables | 07-18 |
| 11 | 20260721113000_add_finance_report_persistence | 07-21 |
| 12 | 20260721235000_add_finance_core_persistence_tables | 07-21 |
| 13 | 20260724010000_add_birthday_team_building_open_platform_alliance | 07-24 |
| 14 | 20260724152125_add_brand_ops_logistics | 07-24 |
| 15 | 20260724155454_add_minor_protection | 07-24 |
| 16 | 20260724174249_add_cashier_persistence | 07-24 |

### 最新 6 个迁移覆盖领域
- **brand_ops_logistics** — 品牌运营物流 (物流模块)
- **cashier_persistence** — 收银持久化 (店A关键)
- **minor_protection** — 未成年人保护 (合规)
- **birthday_team_building_open_platform_alliance** — 生日团建+开放平台联盟 (运营)
- **finance_core_persistence_tables** — 财务核心持久化
- **finance_report_persistence** — 财务报告持久化

---

## 2. Prisma Schema 审计

### 总体统计

| 指标 | 数值 |
|------|------|
| Model 总数 | **114** |
| 迁移文件数 | **16** |
| 迁移 lock 文件 | ✅ 已锁定 |

### @@map 检查 — 缺失 @@map 的 Model

以下 model **未设置 `@@map`**，Prisma 将使用驼峰转换表名（可能与数据库实际表名不一致）：

| Model | 风险等级 |
|-------|----------|
| Tenant | ⚠️ 核心 |
| Store | ⚠️ 核心 |
| User | ⚠️ 核心 |
| MemberProfile | ⚠️ 核心 |
| MemberProfileExtension | ⚠️ 核心 |
| LytMemberSnapshot | ⚠️ 会员 |
| LytOrderSnapshot | ⚠️ 订单 |
| LytPaymentSnapshot | ⚠️ 支付 |
| MemberOperationsTask | ⚠️ 运营 |
| MemberOperationsExecutionReceipt | ⚠️ 运营 |
| AuditLog | ⚠️ 审计 |
| LytConnection | ⚠️ 连接 |
| MarketProfile | ⚠️ 营销 |
| RegionalConfig | ⚠️ 配置 |
| RegionalConfigOverride | ⚠️ 配置 |

> ⚠️ **注意**: 以上 15 个 model 缺少 `@@map`，可能导致 Prisma 生成的表名与数据库实际表名不匹配。

---

## 3. 店A收银模块 — 上线检查

### 收银相关表 (全部有 @@map ✅)

| Model | 映射表名 |
|-------|----------|
| CashierOrder | `cashier_orders` |
| CashierPayment | `cashier_payments` |
| CashierMember | `cashier_members` |
| CashierTransaction | `cashier_transactions` |

### 聚合根 Model

| Model | 状态 |
|-------|------|
| Tenant | 存在 |
| Brand | 存在 |
| Store | 存在 |
| MinorIdentityVerification | 存在 |
| MinorAccessLog | 存在 |

### 关联表

| Model | 用途 |
|-------|------|
| BrandAsset | 品牌资产 |
| BrandCampaign | 品牌营销活动 |
| BrandCampaignTemplate | 营销模板 |
| BrandChannel | 品牌渠道 |
| BrandKPI | 品牌KPI |

---

## 4. 审计结论

### ✅ 通过项
- [x] 迁移文件 16 个，按时间序排列，命名规范
- [x] migration_lock 已锁定，防止并发迁移冲突
- [x] 收银模块 (Cashier) 4 张表全部有 `@@map`
- [x] 未成年人保护表已建立
- [x] 财务模块持久化表已建立
- [x] 最新迁移覆盖品牌运营、收银、合规三个关键领域

### ⚠️ 改进建议
- [ ] **高优先级**: 为 15 个缺少 `@@map` 的 Model 补充表名映射
- [ ] **中优先级**: Tenant / Store / User / MemberProfile 等核心表优先补全 `@@map`
- [ ] **低优先级**: 审计 AuditLog 表是否需要独立的 `@@map` 命名

### 风险点
- 缺少 `@@map` 的表如果在数据库中使用了下划线命名，Prisma 将自动转为驼峰，可能导致找不到表
- LytMemberSnapshot / LytOrderSnapshot 等会员快照表缺少 `@@map`，可能影响数据分析查询

---

> 📝 Day12 L6 审计完成。数据库schema共 114 个 model，迁移历史 16 层清晰可追溯。
