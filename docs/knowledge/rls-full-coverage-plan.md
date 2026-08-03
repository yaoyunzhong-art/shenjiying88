# 🔐 RLS 多租户全量覆盖补全报告

> 日期: 2026-07-29 01:20 CST
> 当前: 54/65 表已覆盖 (83%)
> 目标: 65/65 表全覆盖 (100%)

---

## 一、当前状态

| 指标 | 数值 |
|:-----|:---:|
| 已覆盖 | 54 表 |
| 未覆盖 | 11 表 |
| 覆盖率 | 83% |
| 目标 | 100% |

---

## 二、剩余11张表的 tenant_id 补全清单

按业务模块分类：

### P-47 品牌运营 (3/3 ✅)
| 表 | 状态 | tenant_id | RLS策略 |
|:-----|:---:|:---:|:---:|
| `brand_analytics_kpi` | ✅ | 已有 | 已有 |
| `brand_workspace_layout` | ✅ | 已有 | 已有 |
| `brand_calendar_event` | ✅ | 已有 | 已有 |

### P-30 后勤管理 (3/3 ✅)
| 表 | 状态 | tenant_id | RLS策略 |
|:-----|:---:|:---:|:---:|
| `logistics_transport_order` | ✅ | 已有 | 已有 |
| `logistics_route_plan` | ✅ | 已有 | 已有 |
| `stock_transfer` | ✅ | 已有 | 已有 |

### P-47 品牌运营 (1/2 待补)
| 表 | 状态 | tenant_id | 优先级 |
|:-----|:---:|:---:|:---:|
| `brand_custom_font` | 🟡 待补 | ❌ 无 | P1 |
| `brand_custom_script` | 🟡 待补 | ❌ 无 | P1 |

### P-30 后勤管理 (2/2 待补)
| 表 | 状态 | tenant_id | 优先级 |
|:-----|:---:|:---:|:---:|
| `logistics_fuel_record` | 🟡 待补 | ❌ 无 | P1 |
| `logistics_cost_record` | 🟡 待补 | ❌ 无 | P1 |

### 未成年保护 (2/2 等待建表)
| 表 | 状态 | tenant_id | 优先级 |
|:-----|:---:|:---:|:---:|
| `minor_protection_profile` | 🔴 新表 | 待建表 | P0 |
| `minor_parental_consent` | 🔴 新表 | 待建表 | P0 |

### 其他模块 (3/3 待补)
| 表 | 状态 | tenant_id | 优先级 |
|:-----|:---:|:---:|:---:|
| `stock_transfer_item` | 🟡 待补 | ❌ 无 | P2 |
| `logistics_supplement_cargo` | 🟡 待补 | ❌ 无 | P2 |
| `logistics_driver_schedule` | 🟡 待补 | ❌ 无 | P2 |

---

## 三、Prisma Schema 补全脚本

以下 SQL 可直接在数据库中执行，为剩余 11 张表添加 `tenant_id` 列和 RLS 策略：

```sql
-- 品牌相关
ALTER TABLE brand_custom_font ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE brand_custom_script ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';

-- 后勤相关
ALTER TABLE logistics_fuel_record ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE logistics_cost_record ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE stock_transfer_item ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE logistics_supplement_cargo ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE logistics_driver_schedule ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';

-- 未成年保护（新表）
CREATE TABLE minor_protection_profile (
  user_id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  birth_date DATE NOT NULL,
  age INTEGER NOT NULL,
  age_group VARCHAR(16) NOT NULL,
  age_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(32),
  verified_at TIMESTAMP,
  parental_consent_id VARCHAR(64),
  daily_time_limit_min INTEGER DEFAULT 0,
  daily_spend_limit DECIMAL(10,2) DEFAULT 0,
  monthly_spend_limit DECIMAL(10,2) DEFAULT 0,
  restrictions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE minor_parental_consent (
  id VARCHAR(64) PRIMARY KEY,
  minor_user_id VARCHAR(64) NOT NULL REFERENCES minor_protection_profile(user_id),
  parent_user_id VARCHAR(64) NOT NULL,
  parent_name VARCHAR(128) NOT NULL,
  parent_id_card VARCHAR(32) NOT NULL,
  relationship VARCHAR(32) NOT NULL,
  consent_type VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_to TIMESTAMP,
  tenant_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS 策略（为所有新表启用）
-- (实际由 RlsService.applyRlsToTable 自动执行)
```

---

## 四、执行计划

| 步骤 | 说明 | 方式 |
|:---:|:-----|:-----|
| 1 | 执行 ALTER TABLE 添加 tenant_id 列 | DBA/阿里云数据库连接 |
| 2 | 执行 CREATE TABLE 创建未成年保护表 | DBA/阿里云数据库连接 |
| 3 | Prisma migrate 同步最新 schema | `npx prisma migrate dev` |
| 4 | RlsService 自动为新表启用 RLS | 自动 |
| 5 | 安全基线检查确认 65/65 ✅ | 次日 07:30 cron |

---

## 五、当前进展标记

```
RLS 覆盖率: ████████████████░ 54/65 (83%)
新增 V24:   ████████████████░ P-47/P-30 6表 ✅
待补:       ██░░░░░░░░░░░░░░░ 11表 SQL 已生成，待 DB 执行
```

---

*🦞 龙虾哥 · 2026-07-29 01:20 CST*
