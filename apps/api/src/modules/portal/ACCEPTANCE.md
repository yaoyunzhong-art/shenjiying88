# 门户模块 (Portal Module) — API 接受度文档

## 1. 模块概述与业务目标

门户模块是 M5 SaaS 平台的核心入口聚合层，负责统一管理 **租户 (Tenant)**、**品牌 (Brand)**、**门店 (Store)** 三个层级的企业门户视图（ToB 官网 / ToC 门店门户）。该模块整合域名治理、市场画像（地域化配置）与 foundation 依赖元数据，为前端门户侧提供一站式 bootstrap 启动信息。

**业务目标：**
- 多层级门户：租户级 ToB 官网 → 品牌级 ToB 官网 → 门店级 ToC 门户，逐层细化
- 域名智能决策：优先使用 custom primary domain，否则回退平台默认域名
- 市场画像聚合：locale/currency/tax/timezone/network/email/social 全维度区域配置
- 域名治理摘要：监控 missing primary scopes，推动主域名补全治理

## 2. 核心实体及字段说明

### PortalEntity (门户实体)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 门户唯一标识 |
| `tenantId` | `string` | 所属租户 ID |
| `brandId?` | `string` | 品牌 ID (品牌/门店门户) |
| `storeId?` | `string` | 门店 ID (门店门户) |
| `audience` | `PortalAudience` | ToC / ToB |
| `scopeType` | `PortalScopeType` | Tenant / Brand / Store |
| `scopeCode` | `string` | 作用域编码 |
| `marketCode` | `string` | 市场编码 (如 cn-mainland) |
| `channel` | `PortalChannel` | 渠道 (Web) |
| `name` | `string` | 门户名称 |
| `primaryDomain?` | `string` | 主域名 |
| `supportedLanguages` | `LanguageCode[]` | 支持语言列表 |
| `heroTitle?` | `string` | 主营标题 (ToB) |
| `heroSubtitle?` | `string` | 副标题 (ToB) |
| `solutionTags?` | `string[]` | 解决方案标签 (ToB) |
| `loginEntry?` | `PortalLoginEntry` | 登录入口配置 |
| `supportedSurfaces?` | `StorefrontSurface[]` | 支持的终端表面 (Store) |
| `storeName?` | `string` | 门店名称 (Store) |
| `createdAt` | `string` | 创建时间 |
| `updatedAt` | `string` | 更新时间 |

### PortalLoginEntry (登录入口配置)

| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 登录按钮文案 |
| `loginPath` | `string` | 登录路径 |
| `ssoEnabled` | `boolean` | 是否启用 SSO |

### Domain 枚举

| 枚举 | 值 | 说明 |
|------|-----|------|
| `PortalAudience` | `ToC`, `ToB` | 门户受众 |
| `PortalScopeType` | `Tenant`, `Brand`, `Store` | 作用域类型 |
| `PortalChannel` | `Web` | 渠道 |
| `StorefrontSurface` | `OfficialSite`, `H5`, `MiniApp`, `App`, `PcConsole`, `PadConsole` | 终端表面 |
| `LanguageCode` | `ZhCn`, `EnUs`, `JaJp` 等 | 语言代码 |
| `PortalDomainSource` | `custom`, `default` | 域名来源 |

## 3. API 端点清单

基础路径：`/portals`（应用 `TenantGuard`，通过 `x-tenant-id` 头识别租户）

### 3.1 GET /portals/bootstrap
获取完整门户 bootstrap 信息（三层门户 + 市场画像 + foundation 元数据）

**Request Headers:**
```
x-tenant-id: tenant-001
```

**Response (PortalBootstrapResponseDto):**
```json
{
  "tenantPortal": {
    "audience": "ToB",
    "scopeType": "Tenant",
    "scopeCode": "tenant-001",
    "tenantCode": "tenant-001",
    "marketCode": "cn-mainland",
    "channel": "Web",
    "name": "tenant-001 ToB 官网",
    "primaryDomain": "tenant-001.cn-mainland.b2b.local",
    "domainSource": "default",
    "supportedLanguages": ["zh-CN", "en-US"],
    "heroTitle": "tenant-001 企业级经营门户",
    "heroSubtitle": "覆盖品牌、门店、会员、营销、赛事、财务与全球化配置的统一 SaaS 官网。",
    "solutionTags": ["多租户", "多端门户", "国际化配置", "门店运营"],
    "loginEntry": { "label": "进入租户后台", "loginPath": "/cn-mainland/tenant-001/login", "ssoEnabled": true }
  },
  "brandPortal": { "audience": "ToB", "scopeType": "Brand", "scopeCode": "brand-demo", "name": "brand-demo 品牌 ToB 官网", ... },
  "storePortal": { "audience": "ToC", "scopeType": "Store", "scopeCode": "store-001", "storeName": "store-001 门店", ... },
  "marketProfile": {
    "marketCode": "cn-mainland",
    "marketName": "中国大陆",
    "countryCode": "CN",
    "locale": { "defaultLanguage": "zh-CN", "supportedLanguages": ["zh-CN", "en-US"] },
    "timezone": { "timezone": "Asia/Shanghai" },
    "currency": { "currencyCode": "CNY", "symbol": "¥" },
    "tax": { "taxMode": "INCLUDED", "taxRate": 13, "taxLabel": "增值税" },
    "network": { "networkRegion": "CHINA_MAINLAND", "apiBaseUrl": "https://cn-api.m5.local", "cdnBaseUrl": "https://cn-cdn.m5.local", "callbackBaseUrl": "https://cn-hooks.m5.local" },
    "email": { "provider": "SMTP", "fromName": "M5 CN", "fromAddress": "hello@cn.local", "replyTo": "support@cn.local" },
    "social": { "primaryPlatforms": ["WECHAT"], "supportPlatforms": [] }
  },
  "regionalOverrides": [...],
  "foundationDependencies": ["identity-access"],
  "foundationContracts": ["portal-page:v1"]
}
```

### 3.2 GET /portals/tenant-portal
获取租户级 ToB 门户信息

**Response (PortalDto):**
```json
{
  "audience": "ToB",
  "scopeType": "Tenant",
  "name": "tenant-001 ToB 官网",
  "primaryDomain": "tenant-001.cn-mainland.b2b.local",
  "domainSource": "custom",
  ...
}
```

### 3.3 GET /portals/brand-portal
获取品牌级 ToB 门户信息

### 3.4 GET /portals/store-portal
获取门店级 ToC 门户信息（含 supportedSurfaces）

### 3.5 GET /portals/domain-governance
获取域名治理摘要

**Response (PortalDomainGovernanceSummaryDto):**
```json
{
  "totalMissingPrimaryScopes": 2,
  "totalActiveWithoutPrimaryDomains": 3,
  "recommendedReadyScopes": 2,
  "tenantMissingPrimaryScopes": 0,
  "brandMissingPrimaryScopes": 1,
  "storeMissingPrimaryScopes": 1,
  "requiresAttention": true,
  "lastEvaluatedAt": "2026-07-18T22:30:00.000Z",
  "currentScopes": [
    {
      "scopeType": "BRAND",
      "tenantId": "tenant-001",
      "brandId": "brand-001",
      "activeDomainCount": 2,
      "missingPrimary": true,
      "currentPrimaryDomain": null,
      "recommendedDomain": "brand-primary.example.io",
      "recommendationReason": "优先推荐 active_ssl，且最近一次校验/更新时间更新"
    }
  ]
}
```

## 4. 状态机流转图

### 门户作用域层级树
```
platform
  └── Tenant (scope: TENANT)
        ├── Tenant ToB Portal (audience=ToB)
        │     ├── primaryDomain: custom or fallback
        │     ├── heroTitle, heroSubtitle, solutionTags
        │     └── loginEntry (ssoEnabled)
        │
        └── Brand(s) (scope: BRAND)
              ├── Brand ToB Portal (audience=ToB)
              │     ├── primaryDomain: custom brand domain or fallback
              │     ├── brand-specific hero/solutionTags
              │     └── loginEntry
              │
              └── Store(s) (scope: STORE)
                    └── Store ToC Portal (audience=ToC)
                          ├── primaryDomain: custom store domain or fallback
                          ├── storeName
                          └── supportedSurfaces: [OfficialSite, H5, MiniApp, App, PcConsole, PadConsole]
```

### 域名决策流
```
Request → DomainResolutionService.findPrimaryDomain(scope)
           ├── found → source='custom', domain=customDomain
           └── not found → source='default', domain=fallbackDomain
```

### 市场配置合并流
```
MarketService.getMergedProfile(context)
  ├── base marketProfile (locale/timezone/currency/tax/network/email/social)
  ├── TenantConfigService.resolveLocalePolicy → normalize languages
  └── MarketService.getOverrides(context) → regional overrides
```

## 5. 错误码清单

| HTTP Status | 错误场景 | 说明 |
|-------------|----------|------|
| `200` | 正常返回 | 数据存在或空值正常返回 |
| `401` | Missing x-tenant-id | TenantGuard 拒绝未认证请求 |
| `403` | 无权访问该租户 | TenantGuard 跨租户访问拦截 |
| `500` | 内部服务错误 | foundation/market 依赖异常 |

当前模块 API 返回值始终为 `200`（无 404 设计—不存在的 scope 返回空数据而非报错）。

## 6. 性能要求

| 指标 | 目标 | 说明 |
|------|------|------|
| P50 | ≤ 50ms | 单门户查询（纯内存聚合） |
| P95 | ≤ 150ms | bootstrap 全量数据（多次远程调用） |
| P99 | ≤ 500ms | 含 domainResolution + marketProfile 合并 |

**优化策略：**
- `MarketProfile` 查询可缓存（TTL 300s）
- `DomainResolutionService.findPrimaryDomain` 预取或 lazy load
- `FoundationService.getDependencySummary` 可静态化

## 7. 安全约束

### RBAC 角色
| 角色 | 权限 | 端点 |
|------|------|------|
| `tenant:admin` | 完全访问 | 全部 /portals/* |
| `tenant:viewer` | 只读 | bootstrap, tenant-portal, brand-portal, store-portal |
| `tenant:governance` | 域名治理 | domain-governance |
| `brand:admin` | 品牌级访问 | brand-portal |
| `store:manager` | 门店级访问 | store-portal |

### 租户隔离
- 所有端点受 `TenantGuard` 保护，`x-tenant-id` 头必需
- `PortalService.resolveTenantPortal/brandPortal/storePortal` 均基于 `RequestTenantContext` 构建
- 域名治理摘要仅返回当前 tenant 上下文下的 scope 数据
- `marketProfile` 基于 tenant context 做 locale 区域化合并，确保租户间语言配置隔离

