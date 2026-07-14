# ADR-001: P-31 多租户RLS隔离方案

## 状态
提议

## 上下文
P-31要求多租户数据隔离，影响P-35收银和P-36会员模块。

## 方案A (推荐)
PostgreSQL Row-Level Security (RLS)，通过TenantContext Provider自动注入tenant_id。
- 数据库层强制隔离，应用逻辑无法绕过
- 无需修改现有查询
- 支持按租户透明分片

## 方案B
应用层filter，每个查询手动加WHERE tenant_id=?
- 容易遗漏导致数据泄漏
- 代码侵入性强
- 审计困难

## 决策
选方案A（RLS），因：
1. 强制隔离，不可能被应用逻辑绕过
2. 向后兼容（现有非多租户代码不受影响）
3. 审计跟踪天然支持

## 影响
- 模块: P-31/P-35/P-36
- 接口: TenantContextProvider.getTenantId()
- 兼容: 向后兼容（现有非多租户代码不受影响）
- 性能: RLS策略过滤有微小开销，可通过索引优化

## 签署
{待E1陈架构+E44周技术}

---
🐜 [V17-round3: fix-fuse-force-adr]
