# 神机营 SaaS 全端需求梳理与落地规划

> 文档版本: V1.0
> 创建日期: 2026-07-02
> 状态: 规划中
> 关联专家团: 44人超级专家团 (V5.2)

---

## 一、全端角色适配梳理与权限矩阵

### 1.1 六大端定义与边界

| 端名称 | 技术栈 | 目标用户 | 核心场景 |
|--------|--------|----------|----------|
| **toB官网** (tob-web) | Next.js | 商户/企业用户 | 企业官网展示、解决方案介绍、加盟咨询 |
| **toC官网** (storefront-web) | Next.js | 消费者 | 门店展示、产品浏览、在线预约 |
| **管理后台** (admin-web) | Next.js | 平台运营人员 | 平台治理、租户管理、告警监控 |
| **H5端** (mobile-h5) | React Native WebView | 门店员工/消费者 | 移动端轻量服务、扫码、小程序码 |
| **微信小程序** (miniapp) | Taro/React | 消费者 | 会员服务、预约、支付 |
| **原生APP** (mobile/app) | React Native | 会员/员工 | 深度功能、离线支持、推送 |

### 1.2 用户角色体系

基于44人专家团(V5.2)分析，全端角色体系如下：

#### 1.2.1 平台层角色

| 角色 | 角色层级 | 归属 | 核心职责 |
|------|----------|------|----------|
| **超级管理员** | Platform Admin | 平台方 | 系统最高权限，跨租户管理 |
| **平台运营人员** | Platform Ops | 平台方 | 内容运营、用户管理、客服 |
| **平台审计人员** | Platform Auditor | 平台方 | 合规审计、安全监控 |
| **ISV开发者** | ISV Developer | 合作伙伴 | API接入、二次开发 |

关联专家: E1(架构), E2(安全), E6(合规), E38(监管), E39(ISV)

#### 1.2.2 租户层角色 (企业管理员)

| 角色 | 角色层级 | 归属 | 核心职责 |
|------|----------|------|----------|
| **企业管理员** | Tenant Admin | 租户 | 租户配置、用户管理、权限分配 |
| **财务管理员** | Finance Admin | 租户 | 财务对账、账单管理 |
| **运营管理员** | Ops Admin | 租户 | 门店运营、营销活动 |
| **人事管理员** | HR Admin | 租户 | 员工管理、排班调度 |

关联专家: E26(大租户), E27(中租户), E28(小租户)

#### 1.2.3 门店层角色 (普通员工)

| 角色 | 角色层级 | 归属 | 核心职责 |
|------|----------|------|----------|
| **店长** | Store Manager | 门店 | 门店管理、订单处理、员工管理 |
| **收银员** | Cashier | 门店 | 收款、退款、交接班 |
| **导购** | Sales Guide | 门店 | 客户接待、会员推荐、销售 |
| **仓库管理员** | Inventory Manager | 门店 | 库存管理、采购申请 |
| **客服** | Customer Service | 门店/平台 | 客户咨询、投诉处理 |

关联专家: E11(钱店长), E12(孙导购), E13(李收银), E23(朱客服)

#### 1.2.4 消费者角色 (C端用户)

| 角色 | 角色层级 | 归属 | 核心职责 |
|------|----------|------|----------|
| **游客** | Guest | C端 | 无需登录的基础浏览 |
| **注册会员** | Member | C端 | 基础会员服务、积分 |
| **VIP会员** | VIP Member | C端 | 等级权益、专属优惠 |
| **SVIP会员** | SVIP Member | C端 | 最高等级、全部权益 |

关联专家: E40(杨客户), E19(陈老板), E41(王董事长)

### 1.3 全端角色权限矩阵

#### 1.3.1 toB官网 (tob-web)

| 功能模块 | 游客 | 企业用户 | 企业管理员 | 财务管理员 | 运营管理员 |
|----------|------|----------|------------|------------|------------|
| 首页/介绍 | R | R | R | R | R |
| 解决方案 | R | R | R | R | R |
| 定价方案 | R | R | R | R | R |
| 案例展示 | R | R | R | R | R |
| 加盟申请 | C | C | C | - | C |
| 账户注册 | C | - | - | - | - |
| 忘记密码 | C | - | - | - | - |
| 管理员登录 | - | R | R | R | R |
| 企业控制台 | - | - | R | R | R |
| 门店管理 | - | - | R | - | R |
| 员工管理 | - | - | R | - | - |
| 财务对账 | - | - | R | R | - |
| 营销活动 | - | - | R | - | R |

> R=读取, C=创建/写入, -=无权限

#### 1.3.2 toC官网 (storefront-web)

| 功能模块 | 游客 | 注册会员 | VIP会员 | SVIP会员 | 导购 | 店长 |
|----------|------|----------|---------|----------|------|------|
| 首页浏览 | R | R | R | R | R | R |
| 门店搜索 | R | R | R | R | R | R |
| 产品浏览 | R | R | R | R | R | R |
| 会员注册 | C | - | - | - | - | - |
| 会员登录 | C | - | - | - | - | - |
| 我的账户 | - | R | R | R | - | - |
| 积分商城 | - | R | R | R | R | R |
| 预约服务 | - | C | C | C | C | R |
| 订单管理 | - | R | R | R | - | - |
| 导购入口 | - | - | - | - | R | R |

#### 1.3.3 管理后台 (admin-web)

| 功能模块 | 超级管理员 | 平台运营 | 平台审计 | 租户管理员 | ISV开发者 |
|----------|------------|----------|----------|------------|-----------|
| 租户管理 | CRUD | R | R | - | - |
| 用户管理 | CRUD | RU | R | R | - |
| 品牌管理 | CRUD | RU | R | - | - |
| 门店管理 | CRUD | RU | R | R | - |
| 告警监控 | CRUD | RU | R | R | - |
| 审计日志 | R | - | R | R | - |
| 内容运营 | CRUD | RU | - | - | - |
| API管理 | CRUD | R | - | - | R |
| 配置管理 | CRUD | R | R | - | - |
| 财务总览 | R | - | R | - | - |

> CRUD=创建读取更新删除, RU=读取更新

#### 1.3.4 H5端 (mobile)

| 功能模块 | 游客 | 注册会员 | VIP/SVIP | 员工(导购) | 员工(收银) | 店长 |
|----------|------|----------|----------|------------|------------|------|
| 首页 | R | R | R | R | R | R |
| 扫码 | - | R | R | R | R | R |
| 会员码 | - | R | R | R | R | R |
| 支付 | - | C | C | C | C | C |
| 订单 | - | R | R | R | R | R |
| 预约 | - | C | C | - | - | - |
| 门店任务 | - | - | - | R | R | R |
| 库存查询 | - | - | - | - | - | R |

#### 1.3.5 微信小程序 (miniapp)

| 功能模块 | 游客 | 注册会员 | VIP/SVIP | 导购 | 店长 |
|----------|------|----------|----------|------|------|
| 首页 | R | R | R | R | R |
| 会员卡 | - | R | R | - | - |
| 积分 | - | R | R | - | - |
| 优惠券 | - | R | R | - | - |
| 预约 | - | C | C | - | - |
| 支付 | - | C | C | - | - |
| 导购工作台 | - | - | - | R | R |

#### 1.3.6 原生APP (app)

| 功能模块 | 游客 | 注册会员 | VIP/SVIP | 员工(导购) | 员工(收银) | 店长 |
|----------|------|----------|----------|------------|------------|------|
| 首页 | R | R | R | R | R | R |
| 会员中心 | - | R | R | R | R | R |
| 支付收款 | - | C | C | C | C | C |
| 订单管理 | - | R | R | R | R | R |
| 库存管理 | - | - | - | - | - | R |
| 员工管理 | - | - | - | - | - | R |
| 离线支持 | - | R | R | R | R | R |
| 推送通知 | - | R | R | R | R | R |

### 1.4 权限校验技术实现

基于schema.prisma中的多租户隔离模型:

```typescript
// 租户级数据隔离
interface TenantScope {
  tenantId: string;
  brandId?: string;   // 品牌级可选
  storeId?: string;   // 门店级可选
}

// 权限校验层级
enum PermissionLevel {
  PLATFORM = 'platform',   // 平台级
  TENANT = 'tenant',      // 租户级
  BRAND = 'brand',        // 品牌级
  STORE = 'store'         // 门店级
}

// 访问策略模型
interface AccessPolicy {
  effect: 'ALLOW' | 'DENY';
  subjectBindings: string[];  // 角色绑定
  actions: string[];           // 可执行动作
  resources: string[];        // 资源范围
  conditions?: {
    scopeType: FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
  };
  dataScope: {
    scopeType: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE';
    ownOnly: boolean;
  };
}
```

---

## 二、各端功能边界划分与全端互通规则

### 2.1 各端功能边界

#### 2.1.1 端专属功能清单

**toB官网专属:**
- 企业用户注册/认证
- 解决方案展示
- 加盟意向提交
- 企业控制台
- 合同管理

**toC官网专属:**
- 门店搜索与展示
- 产品目录浏览
- 门店预约
- 门店评价

**管理后台专属:**
- 租户生命周期管理
- 平台级配置管理
- 全局告警与监控
- 审计日志查询
- API开放平台管理

**H5端专属:**
- 扫码快捷入口
- 轻量级表单
- 微信分享卡片

**小程序专属:**
- 微信登录
- 微信支付
- 模板消息
- 附近门店

**原生APP专属:**
- 离线数据同步
- 原生相机/相册
- 推送通知
- 生物识别

#### 2.1.2 跨端公共功能清单

| 功能 | toB | toC | Admin | H5 | 小程序 | APP |
|------|-----|-----|-------|----|----|-----|
| 账户注册 | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| 账户登录 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 密码找回 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 会员信息 | - | ✓ | R | ✓ | ✓ | ✓ |
| 订单管理 | - | ✓ | R | ✓ | ✓ | ✓ |
| 支付收款 | - | ✓ | - | ✓ | ✓ | ✓ |
| 消息通知 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 个人信息 | - | ✓ | R | ✓ | ✓ | ✓ |

### 2.2 跨端数据同步规则

#### 2.2.1 同步触发条件

| 同步场景 | 触发条件 | 同步方式 | 时效要求 |
|----------|----------|----------|----------|
| 登录状态 | 首次登录/Token刷新 | 实时 | <1s |
| 会员信息 | 等级变更/积分变动 | 实时+缓存 | <5s |
| 订单状态 | 支付/退款/取消 | 实时 | <2s |
| 库存数据 | 出入库操作 | 准实时 | <10s |
| 门店配置 | 品牌/门店信息变更 | 准实时 | <30s |
| 营销活动 | 活动上下线 | 实时 | <5s |

#### 2.2.2 重试机制

```typescript
interface SyncRetryPolicy {
  maxRetries: 3;
  backoffStrategy: 'EXPONENTIAL';
  initialDelayMs: 1000;
  maxDelayMs: 30000;
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVICE_UNAVAILABLE'
  ];
}

// 异常告警规则
interface SyncAlertRule {
  condition: 'consecutive_failures >= 3' | 'latency_p99 > 5000ms';
  severity: 'WARNING' | 'CRITICAL';
  channels: ['EMAIL', 'PUSH', 'SMS'];
  cooldownMinutes: 15;
}
```

#### 2.2.3 数据隔离规则

**租户级物理隔离:**
```sql
-- 每个租户独立数据库schema
ALTER DATABASE ... SET search_path TO tenant_{tenantId};

-- 行级安全策略 (RLS)
CREATE POLICY tenant_isolation ON member_profiles
  USING (tenant_id = current_setting('app.current_tenant_id')::text);
```

**同租户不同角色数据逻辑隔离:**
```typescript
interface DataScopeRule {
  role: '店长';
  allowedScopes: ['TENANT', 'BRAND', 'STORE'];
  dataFilter: {
    storeId: 'own_or_descendant';  // 本门店及子门店
    brandId: 'own_only';           // 仅本品牌
  };
}

interface DataScopeRule {
  role: '导购';
  allowedScopes: ['STORE'];
  dataFilter: {
    storeId: 'assigned_only';  // 仅被分配的门店
  };
}

interface DataScopeRule {
  role: '收银员';
  allowedScopes: ['STORE'];
  dataFilter: {
    storeId: 'current_only';  // 仅当前上班门店
  };
}
```

---

## 三、全端统一设计规范与技术对接标准

### 3.1 统一UI视觉体系

#### 3.1.1 色值规范

| 用途 | 变量名 | 色值 | 说明 |
|------|--------|------|------|
| 主色 | `--color-primary` | #3B82F6 | 主按钮、链接、强调 |
| 成功 | `--color-success` | #22C55E | 成功状态、正向指标 |
| 警告 | `--color-warning` | #F59E0B | 警告状态、注意提示 |
| 错误 | `--color-error` | #EF4444 | 错误状态、负向指标 |
| 信息 | `--color-info` | #8B5CF6 | 信息提示、次级操作 |
| 背景深 | `--color-bg-dark` | #0F172A | 深色模式背景 |
| 背景浅 | `--color-bg-light` | #F8FAFC | 浅色模式背景 |
| 文字主 | `--color-text-primary` | #1E293B | 主要文字 |
| 文字次 | `--color-text-secondary` | #64748B | 次要文字 |

#### 3.1.2 字体规范

| 用途 | 字体 | 字号 | 字重 |
|------|------|------|------|
| 标题H1 | Inter / 思源黑体 | 32px | 700 |
| 标题H2 | Inter / 思源黑体 | 24px | 600 |
| 标题H3 | Inter / 思源黑体 | 18px | 600 |
| 正文 | Inter / 思源黑体 | 14px | 400 |
| 辅助文字 | Inter / 思源黑体 | 12px | 400 |
| 按钮文字 | Inter / 思源黑体 | 14px | 500 |

#### 3.1.3 组件库标准

基于packages/ui组件库，统一规范:
- Button / Input / Select / Table / Modal / Toast
- 统一尺寸: sm(32px) / md(40px) / lg(48px)
- 统一圆角: 8px(按钮) / 12px(卡片) / 16px(弹窗)

### 3.2 标准化交互逻辑

#### 3.2.1 登录流程

```
┌─────────────────────────────────────────────────────────────┐
│                      统一登录流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │ 选择登录 │───▶│ 输入凭证 │───▶│ 身份验证 │             │
│  │ 方式     │    │          │    │          │             │
│  └──────────┘    └──────────┘    └─────┬────┘             │
│                                          │                   │
│                    ┌─────────────────────┼─────────────────┐│
│                    ▼                     ▼                 ▼│
│             ┌──────────┐         ┌──────────┐     ┌──────────┐
│             │ 验证成功  │         │ 验证失败  │     │ 异常处理  │
│             │ 获取Token │         │ 提示错误  │     │ 联系客服  │
│             └────┬─────┘         └──────────┘     └──────────┘
│                  │                                           │
│                  ▼                                           │
│           ┌──────────────┐                                   │
│           │ 加载用户信息 │                                   │
│           │ 权限/角色    │                                   │
│           └──────┬───────┘                                   │
│                  │                                           │
│                  ▼                                           │
│           ┌──────────────┐                                   │
│           │ 跳转首页/    │                                   │
│           │ 引导页       │                                   │
│           └──────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2.2 权限校验拦截

```typescript
// 权限校验中间件
interface PermissionCheckConfig {
  publicPaths: [
    '/login',
    '/register',
    '/forgot-password',
    '/tob/landing',
    '/storefront/home'
  ];

  authRequiredPaths: [
    '/admin/**',
    '/tob/console/**',
    '/storefront/member/**',
    '/mobile/**',
    '/miniapp/**'
  ];

  roleBasedPaths: {
    '/admin/tenants': ['PLATFORM_ADMIN'],
    '/tob/finance': ['TENANT_ADMIN', 'FINANCE_ADMIN'],
    '/mobile/inventory': ['STORE_MANAGER'],
  };
}

// 无权限处理
interface ForbiddenResponse {
  code: 'FORBIDDEN';
  message: '您没有访问该功能的权限';
  requiredRole: string;
  currentRole: string;
}
```

#### 3.2.3 数据加载反馈

| 场景 | 反馈形式 | 时限 |
|------|----------|------|
| 页面初始加载 | 骨架屏(Skeleton) | - |
| 按钮提交 | 加载中(Spinner) + 禁用 | 5s超时 |
| 列表刷新 | 下拉刷新动画 | - |
| 文件上传 | 进度条(Progress) | - |
| 异步操作 | Toast提示 | 3s |

#### 3.2.4 异常提示规范

| 异常类型 | 提示方式 | 颜色 |
|----------|----------|------|
| 网络错误 | 顶部横幅 + 重试按钮 | 警告色 |
| 业务错误 | Toast气泡 | 错误色 |
| 表单错误 | 输入框下方文字 | 错误色 |
| 权限不足 | 弹窗说明 | - |
| 系统异常 | 全屏错误页 | - |

### 3.3 跨端技术对接标准

#### 3.3.1 统一登录方案

```typescript
// SSO登录票据结构
interface SSOTicket {
  ticketId: string;        // 票据ID
  userId: string;          // 用户ID
  tenantId: string;        // 租户ID
  roleKeys: string[];      // 角色列表
  permissions: string[];   // 权限列表
  expiresAt: number;       // 过期时间
  issuedAt: number;        // 签发时间
  signature: string;       // 防伪签名
}

// Token刷新流程
interface TokenRefreshConfig {
  refreshThresholdSeconds: 300;  // 提前5分钟刷新
  maxRefreshAttempts: 3;
  refreshEndpoint: '/api/auth/refresh';
  logoutOnRefreshFailure: true;
}
```

#### 3.3.2 实时权限校验

```typescript
// 权限校验API
interface PermissionCheckRequest {
  userId: string;
  resource: string;
  action: 'READ' | 'WRITE' | 'DELETE';
  context?: {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
  };
}

interface PermissionCheckResponse {
  allowed: boolean;
  reason?: string;
  evaluatedAt: number;
  cacheHit: boolean;
}

// 权限缓存策略
const permissionCacheConfig = {
  cacheKey: 'perm:{userId}:{resource}',
  ttlSeconds: 300,        // 5分钟缓存
  invalidationEvents: [
    'ROLE_CHANGED',
    'PERMISSION_CHANGED',
    'TENANT_CHANGED'
  ]
};
```

#### 3.3.3 接口安全规范

```typescript
// 等保三级安全要求
interface SecurityConfig {
  // 传输安全
  tlsVersion: '1.2' | '1.3';
  hstsEnabled: true;
  certificatePinning: true;

  // 认证授权
  tokenAlgorithm: 'RS256';
  tokenExpirySeconds: 7200;      // 2小时
  refreshTokenExpirySeconds: 604800;  // 7天
  passwordMinLength: 8;
  passwordRequireComplex: true;

  // 会话安全
  sessionTimeoutMinutes: 30;
  concurrentSessionLimit: 5;
  sessionInvalidateOnRisk: true;

  // 数据安全
  encryptionAlgorithm: 'AES-256-GCM';
  piiLogging: false;
  sensitiveDataMasking: true;

  // 审计
  auditLogEnabled: true;
  auditLogRetentionDays: 180;
}
```

#### 3.3.4 超时重试机制

```typescript
interface RequestConfig {
  timeout: {
    connect: 5000;    // 连接超时5s
    read: 30000;      // 读取超时30s
    write: 30000;     // 写入超时30s
  };

  retry: {
    maxAttempts: 3;
    backoff: 'EXPONENTIAL';
    baseDelayMs: 1000;
    maxDelayMs: 10000;
    retryableStatusCodes: [408, 429, 500, 502, 503, 504];
  };

  circuitBreaker: {
    enabled: true;
    failureThreshold: 5;
    resetTimeoutMs: 60000;
  };
}
```

---

## 四、全端需求文档撰写与落地排期规划

### 4.1 分端页面需求说明书

#### 4.1.1 toB官网需求

| 模块 | 功能点 | P0 | P1 | P2 | 依赖 |
|------|--------|----|----|-----|------|
| 首页 | 企业介绍 | ✓ | | | - |
| 首页 | 解决方案 | ✓ | | | - |
| 首页 | 客户案例 | ✓ | | | - |
| 定价 | 套餐展示 | ✓ | | | - |
| 定价 | 定制报价 | | ✓ | | - |
| 加盟 | 意向提交 | ✓ | | | - |
| 控制台 | 门店管理 | ✓ | | | - |
| 控制台 | 员工管理 | ✓ | | | - |
| 控制台 | 财务对账 | | ✓ | | - |
| 控制台 | 营销活动 | | ✓ | | - |

#### 4.1.2 toC官网需求

| 模块 | 功能点 | P0 | P1 | P2 | 依赖 |
|------|--------|----|----|-----|------|
| 首页 | 门店搜索 | ✓ | | | - |
| 首页 | 热门推荐 | ✓ | | | - |
| 产品 | 分类浏览 | ✓ | | | - |
| 产品 | 详情页 | ✓ | | | - |
| 产品 | 评价 | | ✓ | | - |
| 预约 | 在线预约 | ✓ | | | - |
| 会员 | 注册/登录 | ✓ | | | - |
| 会员 | 个人信息 | ✓ | | | - |
| 会员 | 订单管理 | ✓ | | | - |

#### 4.1.3 管理后台需求

| 模块 | 功能点 | P0 | P1 | P2 | 依赖 |
|------|--------|----|----|-----|------|
| 租户 | 租户管理 | ✓ | | | - |
| 租户 | 套餐配置 | ✓ | | | - |
| 用户 | 用户列表 | ✓ | | | - |
| 用户 | 角色管理 | ✓ | | | - |
| 品牌 | 品牌管理 | ✓ | | | - |
| 门店 | 门店审批 | ✓ | | | - |
| 监控 | 告警中心 | ✓ | | | - |
| 监控 | 审计日志 | | ✓ | | - |
| 内容 | CMS管理 | | ✓ | | - |
| API | 开放平台 | | ✓ | | API文档 |

#### 4.1.4 H5端需求

| 模块 | 功能点 | P0 | P1 | P2 | 依赖 |
|------|--------|----|----|-----|------|
| 首页 | 快捷入口 | ✓ | | | - |
| 扫码 | 扫码支付 | ✓ | | | 小程序 |
| 会员 | 会员码 | ✓ | | | - |
| 订单 | 订单列表 | ✓ | | | - |
| 我的 | 个人信息 | ✓ | | | - |

#### 4.1.5 小程序需求

| 模块 | 功能点 | P0 | P1 | P2 | 依赖 |
|------|--------|----|----|-----|------|
| 首页 | 门店列表 | ✓ | | | - |
| 会员 | 会员卡 | ✓ | | | - |
| 会员 | 积分 | ✓ | | | - |
| 会员 | 优惠券 | ✓ | | | - |
| 服务 | 预约 | ✓ | | | - |
| 支付 | 微信支付 | ✓ | | | 微信支付API |
| 工作台 | 导购入口 | | ✓ | | - |

#### 4.1.6 原生APP需求

| 模块 | 功能点 | P0 | P1 | P2 | 依赖 |
|------|--------|----|----|-----|------|
| 首页 | 底部导航 | ✓ | | | - |
| 会员 | 会员中心 | ✓ | | | - |
| 支付 | 收款 | ✓ | | | 支付通道 |
| 订单 | 订单管理 | ✓ | | | - |
| 库存 | 库存管理 | | ✓ | | - |
| 员工 | 员工管理 | | ✓ | | - |
| 离线 | 离线支持 | | ✓ | | - |
| 推送 | 消息推送 | | ✓ | | 推送服务 |

### 4.2 开发优先级定义

| 优先级 | 定义 | 交付要求 |
|--------|------|----------|
| **P0** | 核心必做 | MVP发布前必须完成，影响主流程 |
| **P1** | 重要迭代 | MVP后第一迭代完成，影响核心体验 |
| **P2** | 优化拓展 | 后续版本迭代，持续优化 |

### 4.3 上下游依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        依赖关系图                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐                                                   │
│  │ API网关  │◀──基础依赖                                        │
│  └────┬────┘                                                   │
│       │                                                         │
│  ┌────▼────┐     ┌─────────┐     ┌─────────┐                 │
│  │ 认证服务 │◀───▶│ 权限服务 │     │ 用户服务 │                 │
│  └────┬────┘     └────┬────┘     └────┬────┘                 │
│       │               │               │                        │
│       └───────────────┼───────────────┘                        │
│                       │                                        │
│                 ┌─────▼─────┐                                  │
│                 │  业务服务  │                                  │
│                 └─────┬─────┘                                  │
│                       │                                        │
│       ┌───────────────┼───────────────┐                       │
│       │               │               │                        │
│  ┌────▼────┐    ┌────▼────┐    ┌────▼────┐                 │
│  │ 订单服务 │    │ 支付服务 │    │ 会员服务 │                 │
│  └────┬────┘    └────┬────┘    └────┬────┘                 │
│       │               │               │                        │
│       └───────────────┼───────────────┘                        │
│                       │                                        │
│                 ┌─────▼─────┐                                  │
│                 │  通知服务  │                                  │
│                 └───────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 全流程节点规划

| 阶段 | 任务 | 责任主体 | 交付标准 | 工期 |
|------|------|----------|----------|------|
| **需求评审** | 全端需求冻结 | 产品经理 | 需求文档签署 | T+0~T+3 |
| **技术设计** | 架构设计/接口设计 | 技术负责人 | 设计文档 | T+3~T+7 |
| **开发** | P0功能开发 | 前端/后端 | 代码提交 | T+7~T+21 |
| **联调** | 端到端联调 | 全栈 | 联调报告 | T+21~T+28 |
| **测试** | 功能/集成测试 | QA | 测试用例通过率≥95% | T+28~T+35 |
| **UAT** | 用户验收 | 客户/业务 | UAT签署 | T+35~T+40 |
| **上线** | 正式环境发布 | 运维 | 上线报告 | T+40 |

### 4.5 测试用例编写规范

#### 4.5.1 角色权限校验测试

```typescript
// 测试用例模板
describe('角色权限校验', () => {
  const testCases = [
    {
      role: 'GUEST',
      path: '/admin/tenants',
      expectedStatus: 403,
      description: '游客访问管理后台应被拒绝'
    },
    {
      role: 'STORE_MANAGER',
      path: '/mobile/inventory',
      expectedStatus: 200,
      description: '店长访问库存管理应成功'
    },
    {
      role: 'CASHIER',
      path: '/mobile/inventory',
      expectedStatus: 403,
      description: '收银员访问库存管理应被拒绝'
    }
  ];

  testCases.forEach(tc => {
    it(tc.description, async () => {
      // 测试实现
    });
  });
});
```

#### 4.5.2 全流程功能流转测试

```typescript
describe('会员下单全流程', () => {
  it('小程序→支付→APP查看订单', async () => {
    // 1. 小程序登录获取token
    // 2. 小程序创建订单
    // 3. 小程序发起微信支付
    // 4. APP端查询订单状态
    // 5. 验证订单数据一致性
  });
});
```

#### 4.5.3 跨端数据同步测试

```typescript
describe('跨端数据同步', () => {
  it('会员等级变更全端同步', async () => {
    // 1. 管理后台修改会员等级
    // 2. 验证toC官网会员状态
    // 3. 验证小程序会员状态
    // 4. 验证APP会员状态
    // 5. 验证推送通知发送
    // 6. 验证积分同步更新
  });
});
```

#### 4.5.4 测试评审与通过率

| 指标 | 标准 |
|------|------|
| 测试用例评审 | 用例完成后48h内评审 |
| 用例覆盖率 | 核心场景100%，边缘场景≥80% |
| 测试通过率 | P0用例100%，P1≥95%，P2≥90% |
| 缺陷修复率 | 严重/致命缺陷100%修复 |
| 回归测试 | 上线前全量回归 |

---

## 五、全端功能互通与业务闭环验证

### 5.1 端到端业务流转验证

#### 5.1.1 核心业务场景清单

| 业务场景 | 覆盖端 | 验证要点 |
|----------|--------|----------|
| **新商户入驻** | toB + Admin | 注册→审核→开通→配置 |
| **会员注册** | toC + 小程序 + APP | 注册→验证→发卡 |
| **门店消费** | toC/小程序 + 收银APP | 选购→支付→积分 |
| **营销活动** | Admin + toC + 小程序 | 创建→投放→核销 |
| **会员运营** | Admin + 全端 | 等级调整→积分变动→通知 |

#### 5.1.2 业务断点检测

```typescript
interface BusinessFlowCheckpoint {
  flowName: 'MEMBER_PURCHASE_FLOW';
  checkpoints: [
    { name: 'ORDER_CREATED', required: true },
    { name: 'PAYMENT_INITIATED', required: true },
    { name: 'PAYMENT_COMPLETED', required: true },
    { name: 'INVENTORY_UPDATED', required: true },
    { name: 'POINTSAwarded', required: true },
    { name: 'NOTIFICATION_SENT', required: false }
  ];
}

// 断点检测规则
const breakPointDetectionRules = [
  {
    condition: 'payment.completed but inventory.not_updated',
    severity: 'CRITICAL',
    alertChannels: ['SMS', 'PUSH']
  },
  {
    condition: 'points_awarded but notification.failed',
    severity: 'WARNING',
    alertChannels: ['PUSH']
  }
];
```

### 5.2 跨端数据一致性验证

| 验证维度 | 验证方法 | 阈值 |
|----------|----------|------|
| 会员数据 | 全端读取对比 | 差异率0% |
| 订单数据 | 状态机完整性 | 100% |
| 库存数据 | 实时同步延迟 | <10s |
| 支付数据 | 金额对账 | 0差异 |
| 积分数据 | 流水核对 | 0差异 |

### 5.3 全端功能互联验证矩阵

| 功能模块 | toB | toC | Admin | H5 | 小程序 | APP |
|----------|-----|-----|-------|----|----|-----|
| 用户登录 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 会员查询 | - | ✓ | R | ✓ | ✓ | ✓ |
| 订单创建 | - | ✓ | - | ✓ | ✓ | ✓ |
| 订单支付 | - | ✓ | - | ✓ | ✓ | ✓ |
| 积分查询 | - | ✓ | R | ✓ | ✓ | ✓ |
| 积分使用 | - | ✓ | - | - | ✓ | ✓ |
| 库存查询 | - | - | R | - | - | R |
| 库存变动 | - | - | R | - | - | W |
| 消息推送 | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| 数据报表 | R | - | ✓ | - | - | - |

> ✓=完整支持 R=只读 - =不支持 W=可写

### 5.4 验证交付标准

| 验证类型 | 交付物 | 通过标准 |
|----------|--------|----------|
| 功能验证 | 功能测试报告 | 通过率≥95% |
| 集成验证 | 集成测试报告 | 全流程通过 |
| 性能验证 | 性能测试报告 | 响应时间达标 |
| 安全验证 | 安全测试报告 | 无高危漏洞 |
| 验收验证 | UAT签署报告 | 业务方签字 |

---

## 附录

### A. 角色-专家映射表

| 角色 | 关联专家 | 专家角色 |
|------|----------|----------|
| 超级管理员 | E44 (周技术总监) | Champion |
| 平台运营 | E8 (周运营) | Reviewer |
| 平台审计 | E36 (卫审计) | Reviewer |
| 企业管理员 | E26/E27/E28 (租户代表) | Reviewer |
| 财务管理员 | E10 (郑财务) | Owner |
| 店长 | E11 (钱店长) | Owner |
| 导购 | E12 (孙导购) | Reviewer |
| 收银员 | E13 (李收银) | Owner |
| 客服 | E23 (朱客服) | Owner |
| 消费者 | E40 (杨客户) | Reviewer |

### B. 术语表

| 术语 | 定义 |
|------|------|
| 租户(Tenant) | 企业级客户，含多个品牌和门店 |
| 品牌(Brand) | 租户下的业务品牌 |
| 门店(Store) | 实际运营的线下店铺 |
| 会员(Member) | C端注册用户 |
| 员工(Employee) | 门店工作人员 |

---

> 文档状态: 待评审
> 下次更新: 根据专家团评审意见修订
