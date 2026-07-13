# PRD-011: 多租户隔离 — Multi-tenant Isolation (P-31)

> 版本: v1.0 · 签发人: 🦞 龙虾哥 · 对接专家: E44 周技术
> 发布日期: 2026-07-13 · 状态: 🟢 已签发
> 关联Phase: P-31

## 1. 业务背景

当前所有门店数据在同一schema。未来需要多租户隔离：每个门店/品牌数据隔离，互不可见。

## 2. 技术方案

| 方案 | 说明 | 选择 |
|:-----|:-----|:----:|
| RLS (Row Level Security) | 每行记录tenant_id, 数据库级过滤 | ✅ **优选** |
| Schema隔离 | 每个租户独立schema | ❌ 维护成本高 |
| DB隔离 | 每个租户独立数据库 | ❌ 服务器浪费 |

## 3. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-31-01 | TenantID注入 | P0 | 每个请求自动获取tenant_id |
| RQ-31-02 | 数据过滤 | P0 | 查询自动WHERE tenant_id=当前 |
| RQ-31-03 | 租户管理 | P0 | 创建/编辑/删除租户 |
| RQ-31-04 | 跨租户数据 | P1 | 超级管理员可跨租户查询 |
| RQ-31-05 | 迁移工具 | P1 | 现有数据→分配tenant_id→数据不丢 |

## 4. 验收卡

| AC | 场景 | 预期 |
|:---|:-----|:-----|
| AC-31-01 | A店登录→查订单→仅看到A店订单 | 无B店数据 |
| AC-31-02 | 创建新租户C→分配管理员 | C管理员可登录 |
| AC-31-03 | 超级管理员跨租户看数据 | 可见所有租户汇总 |

## 5. 数据模型

```typescript
// 全局Filter
interface TenantScoped {
  tenantId: string;
}

// 每个Model扩展
// @TenantFilter('tenantId')
// class Order extends TenantScoped { ... }

// 中间件自动注入
// request.tenantId = extractTenant(request.headers['x-tenant-id']);
```
