# 反模式库 v4 · db-index (数据库索引)

> **创建时间**: 2026-06-27 22:47 CST (1h 冲刺 Part 7)
> **分类**: 数据库 · 性能
> **目标读者**: 后端工程师 + DBA

---

## 1. 索引基础

### ❌ 反模式 1: 无索引全表扫描

```sql
-- BAD: 大表无索引,全表扫描 O(N)
SELECT * FROM orders WHERE tenant_id = 't1' AND created_at > '2026-01-01';
-- 假设 orders 表 1000 万行,扫描 1000 万行 = 5+ 秒
```

**问题**:
- 大表查询慢 (5+ 秒)
- 数据库 CPU 100%
- 高并发下连接耗尽

### ✅ 最佳实践: 复合索引 + 覆盖索引

```sql
-- GOOD: 复合索引 (tenant_id, created_at)
CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at DESC);

-- 查询变 O(log N) = 5ms
SELECT * FROM orders WHERE tenant_id = 't1' AND created_at > '2026-01-01';
```

---

## 2. ❌ 反模式 2: 索引过多

```sql
-- BAD: 每列都加索引
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_amount ON orders(amount);
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_user_id ON orders(user_id);
-- 6 个索引!写入性能下降 50%
```

**问题**:
- 写入慢 (每次 INSERT/UPDATE 维护 6 个索引)
- 存储浪费 (索引占 30%+ 磁盘)
- 查询优化器选错索引

### ✅ 最佳实践: 复合索引 (列顺序很关键)

```sql
-- GOOD: 1 个复合索引覆盖 80% 查询
CREATE INDEX idx_orders_tenant_status_created ON orders(tenant_id, status, created_at DESC);

-- 覆盖以下查询:
-- WHERE tenant_id = ? AND status = ? AND created_at > ?
-- WHERE tenant_id = ? AND status = ?
-- WHERE tenant_id = ?  (前缀索引)
```

**黄金规则**: 
- **= 在前, 范围在后**: `tenant_id = ? AND created_at > ?` 中 tenant_id 是 =
- **高频列在前**: 高频查询的列放最左
- **覆盖索引优先**: 索引包含 SELECT 列,无需回表

---

## 3. ❌ 反模式 3: 索引失效

```sql
-- BAD: 索引失效场景
SELECT * FROM orders WHERE YEAR(created_at) = 2026;  -- 函数索引失效
SELECT * FROM orders WHERE tenant_id + 1 = 't1';     -- 表达式索引失效
SELECT * FROM orders WHERE tenant_id LIKE '%t1%';    -- 前导模糊
SELECT * FROM orders WHERE amount != 100;             -- 不等于
SELECT * FROM orders WHERE status IN ('A', 'B');      -- IN 可以,NOT IN 不行
```

### ✅ 最佳实践: 避免索引失效

```sql
-- GOOD: 范围查询不用函数
SELECT * FROM orders WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01';

-- GOOD: 字符串前缀匹配
SELECT * FROM orders WHERE tenant_id LIKE 't1%';  -- 前缀匹配仍走索引

-- GOOD: 表达式改写
SELECT * FROM orders WHERE tenant_id = 't1' - 1;  -- 预先计算
```

---

## 4. ❌ 反模式 4: 索引选择性低

```sql
-- BAD: 低选择性列做索引 (如 status, gender)
CREATE INDEX idx_orders_status ON orders(status);
-- status 只有 8 个值: DRAFT/PENDING/PAID/FULFILLED/REFUNDED/CANCELED/...
-- 索引后查询: 1000万/8 = 125万 行,还不如全表扫描
```

### ✅ 最佳实践: 评估索引选择性

```sql
-- 计算选择性 (1 = 完美,0 = 无用)
SELECT
  COUNT(DISTINCT column_name) / COUNT(*) AS selectivity
FROM orders;
-- status: 8/10000000 = 0.0000008 (极差)
-- tenant_id: 100/10000000 = 0.00001 (差)
-- order_no: 10000000/10000000 = 1 (完美)
```

**规则**: 选择性 < 0.01 不建议单独建索引

---

## 5. ❌ 反模式 5: 隐式类型转换

```sql
-- BAD: VARCHAR 列用 INT 查询 (索引失效)
SELECT * FROM users WHERE mobile = 13800001111;  -- mobile 是 VARCHAR
-- MySQL 会做 CAST(mobile AS SIGNED),索引失效
```

### ✅ 最佳实践: 类型一致

```sql
-- GOOD: 字符串加引号
SELECT * FROM users WHERE mobile = '13800001111';
```

---

## 6. Prisma Schema 索引规范

```prisma
model Order {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String
  status      String
  amount      Int
  createdAt   DateTime @default(now())
  
  // ✅ 复合索引 (按查询频率排序)
  @@index([tenantId, status, createdAt(sort: Desc)])  // 主查询: 列表+筛选+排序
  @@index([tenantId, createdAt(sort: Desc)])          // 次查询: 仪表盘
  @@index([userId, createdAt(sort: Desc)])            // 个人订单
  @@index([status])  // ⚠️ 仅当 status 选择性高
  @@index([dedupeKey], unique: true)  // 唯一索引
}
```

---

## 7. 索引设计 SOP

### 步骤 1: 收集慢查询
```sql
-- MySQL 慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- 1 秒以上算慢

-- 或 pg_stat_statements (PostgreSQL)
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 步骤 2: 分析执行计划
```sql
-- PostgreSQL EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM orders WHERE tenant_id = 't1' AND status = 'PAID';
-- Seq Scan on orders  (cost=0.00..250000.00)  -- 全表扫描!
-- Bitmap Heap Scan on orders  (cost=100..1000)  -- 走了索引
```

### 步骤 3: 建索引 + 验证
```sql
-- 创建
CREATE INDEX CONCURRENTLY idx_orders_tenant_status ON orders(tenant_id, status);

-- 验证 (注意: PostgreSQL CONCURRENTLY 不锁表)
EXPLAIN ANALYZE SELECT ...;  -- 应该走 Index Scan
```

### 步骤 4: 监控索引使用
```sql
-- PostgreSQL 未使用的索引
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
-- 删除 3 个月未使用的索引
```

---

## 8. ❌ 反模式 6: 频繁 REINDEX

```sql
-- BAD: 每次数据变更就 REINDEX
REINDEX TABLE orders;  -- 锁表 30+ 秒,生产事故!
```

### ✅ 最佳实践: VACUUM + 按需

```sql
-- PostgreSQL: 自动 VACUUM + ANALYZE
VACUUM ANALYZE orders;  -- 回收死元组 + 更新统计信息

-- 仅在严重膨胀时 (10%+)
REINDEX INDEX CONCURRENTLY idx_orders_tenant_status;
```

---

## 9. ❌ 反模式 7: 不分区大表

```sql
-- BAD: orders 表 10 亿行,无法高效清理/查询
SELECT * FROM orders WHERE created_at BETWEEN '2025-01-01' AND '2025-12-31';
-- 扫描 10 亿行
```

### ✅ 最佳实践: 按时间分区

```sql
-- PostgreSQL 13+ 原生分区
CREATE TABLE orders (
  id BIGSERIAL,
  tenant_id VARCHAR(50),
  created_at TIMESTAMPTZ,
  ...
) PARTITION BY RANGE (created_at);

-- 按月分区
CREATE TABLE orders_2026_06 PARTITION OF orders
FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- 1 年前数据快速归档
DROP TABLE orders_2025_01;  -- 秒级删除
```

---

## 10. 实战检查清单

新表上线前:

- [ ] 主键索引 (默认)
- [ ] 外键索引 (Prisma 不会自动加)
- [ ] 高频查询复合索引 (按 = 范围 排序 顺序)
- [ ] 唯一索引 (dedupe_key, order_no 等)
- [ ] 索引选择性 > 0.01
- [ ] EXPLAIN 验证索引生效
- [ ] 监控 pg_stat_user_indexes
- [ ] 大表按时间分区
- [ ] 不需要的索引及时删除

---

## 11. 神机营配置

```prisma
// prisma/schema.prisma 索引标准
model Order {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String
  status      OrderStatus
  amount      Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 主复合索引: 列表查询
  @@index([tenantId, status, createdAt(sort: Desc)])
  // 次复合索引: 个人订单
  @@index([tenantId, userId, createdAt(sort: Desc)])
  // 唯一索引: 幂等键
  @@index([tenantId, orderNo], unique: true)
}
```

---

## 12. 关联反模式

- [performance-optimization.md](performance-optimization.md): 慢查询优化
- [concurrency-safety.md](concurrency-safety.md): 索引锁
- [data-migration.md](data-migration.md): 迁移时索引

---

> 🦞 **"索引是把双刃剑:少则慢,多则浪费"**
> **"好索引 = 高选择性 + 复合覆盖 + 排序对齐 = 查询毫秒级"**