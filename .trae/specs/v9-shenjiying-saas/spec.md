# 神机营 SaaS · V9 多端大模型授权平台 Spec

> **项目代号**: 神机营 SaaS (原 lyt 电玩游乐管理系统 升级版)
> **版本**: V9.0
> **生效**: 2026-06-28 12:00 CST
> **制定**: 🦞 龙虾哥 (后台) + 🐜 树哥 (前台)
> **派工人**: 大飞哥 (产品决策人)
> **上游**: [V8 多端 AI 中枢 spec](./v8-multi-tenant-ai/spec.md) · [宪法](../../DEVELOPMENT_CONSTITUTION.md) 12 条
> **覆盖期**: 2026-07 ~ 2027-12 (18 月 / Phase 87-92 / 6 阶段)

---

## 一、概述

### 1.1 项目背景

**神机营 SaaS** 是基于 **lyt 电玩游乐管理系统** 升级迭代的多租户 SaaS 平台,核心定位:

> **AI 能力 + 知识库体系 = 不可复制的护城河** (宪法第一条)

**lyt 既有基础**:
- 多门店电玩游乐管理 (会员/收银/库存/财务)
- 跨门店营销 (优惠券/积分/活动)
- 多端支持 (PC + H5 + 小程序,3 端)
- 多租户隔离 (品牌 + 门店)

**V9 升级目标 (6 大核心需求)**:
1. **大模型配置能力** — 系统预设 + 门店自主 + 一键切换 + 历史回滚
2. **付费授权机制** — 租户级 + 单门店级 + 前置校验 + 自动激活 + 日志
3. **多系统对接** — RESTful 标准 + 鉴权/同步/指令三类接口 + 白名单
4. **三级独立配置** — 门店/租户/品牌方 各自工作台 + 全流程自助
5. **权限隔离保障** — 字段级 + 实例级 双重隔离 + 行级过滤器 + 等保三级
6. **交付验收** — 测试 + 文档 + 接口对照表

### 1.2 V8 + V9 融合定位

```
┌────────────────────────────────────────────────────────────────┐
│                    神机营 SaaS · V9                              │
│   ┌──────────────────────────────────────────────────────┐    │
│   │   V8 多端 AI 中枢 (宪法 12 条)                         │    │
│   │   • 5 端 × 3 站点 × 4 工作台 × AI × 知识库            │    │
│   └──────────────────────────────────────────────────────┘    │
│                              +                                  │
│   ┌──────────────────────────────────────────────────────┐    │
│   │   V9 6 大业务能力 (本 spec)                            │    │
│   │   1. 大模型配置 (4 子模块)                              │    │
│   │   2. 付费授权 (3 类前置)                               │    │
│   │   3. 多系统对接 (3 类接口)                              │    │
│   │   4. 三级独立配置 (3 工作台)                           │    │
│   │   5. 权限隔离 (字段级+实例级)                          │    │
│   │   6. 交付验收 (测试+文档)                              │    │
│   └──────────────────────────────────────────────────────┘    │
│                              =                                  │
│   ┌──────────────────────────────────────────────────────┐    │
│   │   神机营 SaaS (lyt 升级)                               │    │
│   │   18 月 / Phase 87-92 / 6 阶段                         │    │
│   └──────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

---

## 二、6 大核心需求详细规格

### 需求 1 · 大模型配置能力开发 (Phase 87)

#### 1.1 多维度大模型配置模块

**两层配置**:
- **系统预设配置** (P0): 通用推理参数包 / 行业适配微调参数包
  - 通用推理: GPT-4o / Claude 3.5 / Qwen-VL (默认 GPT-4o)
  - 行业适配: 游乐场行业 / 电玩行业 / 亲子娱乐行业 (微调参数)
- **门店自主配置** (P0): 6 类参数全量可调
  - API 密钥 (encrypted at rest)
  - 请求域名 (endpoint URL)
  - 上下文窗口大小 (context window: 4k / 8k / 16k / 32k / 64k / 128k)
  - 温度系数 (temperature: 0.0-2.0)
  - 最大生成长度 (max_tokens: 1-32000)
  - 自定义请求头 (custom headers)

#### 1.2 一键切换功能 (无刷新)

**技术方案**:
- 后端: 配置中心 (`ai-model-config` 模块) + 热加载 (config reload)
- 前端: React Query 缓存 + 乐观更新 + WebSocket 推送配置变更
- 切换流程: 选配置 → 验证 (ping 测试) → 切换 → 缓存失效 → 新配置生效
- **关键**: 切换全程不刷新页面 (SPA + 服务端配置中心)

**SLA**: 切换完成 < 500ms,可用率 ≥ 99.9%

#### 1.3 历史版本 + 回滚

- 每次配置变更 → 自动保存版本 (含 author / timestamp / diff)
- 版本保留期: 90 天
- 一键回滚到任意历史版本
- 回滚操作权限: 店长 / 租户管理员 / 品牌管理员

#### 1.4 数据模型

```sql
-- 系统预设配置 (只读)
ai_model_preset (
  id UUID PK,
  preset_code VARCHAR(50) UNIQUE,  -- "gpt4o-general" / "claude-game"
  display_name VARCHAR(100),
  provider VARCHAR(50),  -- openai / anthropic / qwen / custom
  model_name VARCHAR(100),
  default_params JSONB,  -- {temperature, max_tokens, context_window, ...}
  industry VARCHAR(50),  -- general / arcade / family-entertainment
  is_active BOOLEAN,
  created_at TIMESTAMP
)

-- 门店自主配置 (可写)
ai_model_store_config (
  id UUID PK,
  store_id UUID FK,  -- 关联门店
  config_name VARCHAR(100),
  provider VARCHAR(50),
  endpoint_url TEXT,
  api_key_encrypted TEXT,  -- AES-256 加密
  context_window INT,
  temperature DECIMAL(3,2),
  max_tokens INT,
  custom_headers JSONB,
  is_current BOOLEAN,  -- 当前生效
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- 历史版本 (回滚)
ai_model_config_history (
  id UUID PK,
  config_id UUID FK,
  snapshot JSONB,  -- 完整配置快照
  version_number INT,
  change_type VARCHAR(20),  -- create / update / rollback
  changed_by UUID,
  changed_at TIMESTAMP,
  reason TEXT  -- 回滚理由
)
```

---

### 需求 2 · 付费授权机制搭建 (Phase 88)

#### 2.1 授权层级

```
租户级 (Tenant)        单门店级 (Store)
   │                       │
   ├── AI 基础能力         ├── AI 基础能力
   ├── 知识库容量          ├── 知识库容量
   ├── 行业增值 (3 类)     ├── 行业增值 (3 类)
   │                       │
   └─ 套餐                  └─ 单店订阅
```

**授权对象 (3 大类)**:
- **AI 能力**: 推荐引擎 / 选择题引擎 / 匹配引擎 / 知识库引擎
- **知识库容量**: 1GB / 10GB / 100GB / 1TB / 自定义
- **行业增值**: 行业模板 / 高级报表 / 第三方对接 / 专属客户经理

#### 2.2 前置校验拦截

**两道关卡**:
- **入口关卡**: 前端 UI (按钮置灰 + tooltip "请升级套餐")
- **调用关卡**: 后端中间件 (`LicenseGuard`) — 调用 API 前强制校验

**校验流程**:
```typescript
@UseGuards(LicenseGuard)
@RequireLicense('ai.recommend', 'PRO')  // 装饰器声明所需授权
async getRecommendation() {
  // LicenseGuard 拦截:
  //   1. 从 JWT 取 tenantId + storeId
  //   2. 查询 license 表
  //   3. 校验 license.feature === 'ai.recommend'
  //   4. 校验 license.tier >= 'PRO'
  //   5. 校验 license.expires_at > now()
  //   6. 通过 → 继续; 失败 → 403 LICENSE_REQUIRED
}
```

**激活条件** (任一):
1. ✅ 已付费 (订单已支付)
2. ✅ 合作协议免费试用 (trial_end_at > now())
3. ✅ 等级达标权益 (会员等级 ≥ L4)
4. ✅ 内部测试白名单 (test_tenant_ids IN whitelist)

**激活流程**:
1. 满足条件 → 系统自动激活 (cron 每分钟扫描)
2. 写入 license 表 (含 activation_log)
3. 实时通知租户/门店管理员 (站内消息 + 邮件)
4. Redis 缓存 license (TTL 5min,失效后回源 DB)

#### 2.3 数据模型

```sql
-- 授权记录
license (
  id UUID PK,
  tenant_id UUID,  -- 租户级授权
  store_id UUID,   -- 单门店级授权 (可空)
  feature VARCHAR(100),  -- ai.recommend / kb.capacity.10gb / ...
  tier VARCHAR(20),  -- FREE / BASIC / PRO / ENTERPRISE
  source VARCHAR(30),  -- paid / trial / level / internal
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  metadata JSONB
)

-- 授权激活日志
license_activation_log (
  id UUID PK,
  license_id UUID FK,
  event VARCHAR(30),  -- activated / renewed / expired / revoked
  triggered_by VARCHAR(30),  -- cron / user / admin / system
  order_id UUID,  -- 关联订单 (如 source=paid)
  operator_id UUID,
  occurred_at TIMESTAMP,
  details JSONB
)
```

---

### 需求 3 · 多系统对接能力开发 (Phase 89)

#### 3.1 RESTful 接口集 (3 类核心)

```
/api/v9/open/
├── /auth        # 身份鉴权接口
│   ├── POST /auth/token          # 颁发 access_token
│   ├── POST /auth/refresh        # 刷新 token
│   └── POST /auth/revoke         # 撤销 token
├── /sync        # 数据同步接口
│   ├── POST /sync/members        # 同步会员
│   ├── POST /sync/orders         # 同步订单
│   ├── POST /sync/inventory      # 同步库存
│   ├── POST /sync/devices        # 同步设备
│   └── POST /sync/batch          # 批量同步
└── /command     # 指令下发接口
    ├── POST /command/dispatch    # 派发指令
    ├── GET  /command/:id/status  # 查询指令状态
    └── POST /command/:id/cancel  # 取消指令
```

**接口规范**:
- **格式**: JSON (UTF-8)
- **鉴权**: OAuth 2.0 (client_credentials 模式) + HMAC-SHA256 签名
- **限流**: 100 QPS / client (可配置)
- **幂等**: Idempotency-Key 头 (UUID, 24h 去重)
- **文档**: OpenAPI 3.0 规范 + Swagger UI

#### 3.2 鉴权方案

```bash
# 1. 申请 access_token
POST /api/v9/open/auth/token
Headers:
  X-Client-Id: <client_id>
  X-Client-Secret: <client_secret>
  X-Signature: <HMAC-SHA256(timestamp + nonce + body)>
Body:
  {
    "grant_type": "client_credentials",
    "scope": "sync.members sync.orders command.dispatch"
  }
Response:
  {
    "access_token": "eyJhbGc...",
    "expires_in": 7200,
    "scope": "sync.members sync.orders command.dispatch"
  }

# 2. 调用业务接口
POST /api/v9/open/sync/members
Headers:
  Authorization: Bearer <access_token>
  X-Signature: <HMAC-SHA256(...)>
  Idempotency-Key: <uuid>
Body:
  {
    "members": [
      {"external_id": "lyt_001", "phone": "13800138000", ...}
    ]
  }
```

#### 3.3 白名单机制

```sql
-- 第三方接入白名单
openapi_client (
  id UUID PK,
  client_id VARCHAR(50) UNIQUE,
  client_secret_hash VARCHAR(255),  -- bcrypt
  client_name VARCHAR(100),
  brand_id UUID,  -- 归属品牌
  tenant_id UUID,  -- 归属租户
  scopes TEXT[],  -- 允许的 scope
  allowed_ips INET[],  -- IP 白名单 (可选)
  rate_limit_qps INT DEFAULT 100,
  is_active BOOLEAN,
  whitelist_added_by UUID,
  whitelist_added_at TIMESTAMP
)

-- 接口调用日志
openapi_call_log (
  id BIGSERIAL PK,
  client_id VARCHAR(50),
  endpoint VARCHAR(100),
  method VARCHAR(10),
  request_id UUID,
  ip INET,
  status_code INT,
  latency_ms INT,
  occurred_at TIMESTAMP
)
```

---

### 需求 4 · 独立配置权限实现 (Phase 90)

#### 4.1 三级独立工作台

| 层级 | 工作台 | 权限范围 | 配置内容 |
|------|--------|----------|---------|
| **门店 (Store)** | W-S 门店配置台 | 自身门店 | 第三方系统基础参数 + 联调测试 |
| **租户 (Tenant)** | W-T 租户配置台 | 旗下所有门店 | 系统接入配置 + 批量调试 |
| **品牌方 (Brand)** | W-B 品牌配置台 | 全品牌 | 全局接入配置 + 全局参数调试 |

#### 4.2 自助流程 (无需平台介入)

```
门店自助接入流程:
1. 登录 → W-S 工作台
2. 选择第三方系统 (下拉)
3. 填基础参数 (client_id / secret / endpoint)
4. 点 "联调测试" → 系统自动 ping 测试
5. 测试通过 → 自动激活 + 生成 client_secret
6. 测试失败 → 显示具体错误 + 修复建议
7. 全程无平台客服介入 (大飞哥: "平台不介入")
```

**批量调试 (租户层)**:
- 选中 N 个门店 → 统一应用配置模板
- 异步执行 → 进度条显示
- 失败门店 → 列表展示 + 一键重试

**全局调试 (品牌层)**:
- 全品牌统一配置 + 灰度发布 (10% → 50% → 100%)
- 配置版本管理 + A/B 测试

#### 4.3 前端组件 (M5 Design System 扩展)

```typescript
// @m5/store-config-panel
<StoreConfigPanel
  storeId={store.id}
  systemType="lyt"
  onTest={(result) => toast(result)}
  onSave={(config) => api.save(config)}
/>

// @m5/tenant-batch-panel
<TenantBatchPanel
  tenantId={tenant.id}
  storeIds={selectedStores}
  template={configTemplate}
  onProgress={(done, total) => setProgress(...)}
/>

// @m5/brand-gray-release
<BrandGrayRelease
  brandId={brand.id}
  config={newConfig}
  stages={[
    { percent: 10, duration: '1d' },
    { percent: 50, duration: '3d' },
    { percent: 100, duration: 'auto' }
  ]}
/>
```

---

### 需求 5 · 权限隔离保障体系建设 (Phase 91)

#### 5.1 字段级 + 实例级 双重隔离

**字段级隔离 (Column-Level)**:
```typescript
// 敏感字段加密 + 字段权限
@Entity('ai_model_store_config')
@FieldLevelSecure({
  encrypted: ['api_key_encrypted', 'endpoint_url'],
  scoped: ['store_id'],  // 仅 store 自己可读
  redacted: ['api_key_encrypted']  // API 响应脱敏
})
```

**实例级隔离 (Row-Level)**:
```sql
-- PostgreSQL RLS 策略
CREATE POLICY tenant_isolation ON ai_model_store_config
  USING (
    current_setting('app.current_store_id')::uuid = store_id
    OR current_setting('app.current_role') = 'PLATFORM_ADMIN'
  );
```

#### 5.2 行级权限过滤器 (NestJS Interceptor)

```typescript
@Injectable()
export class TenantRowLevelFilter implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const tenantId = user.tenantId;
    const storeId = user.storeId;
    const role = user.role;

    // 注入 session 变量 (供 RLS 使用)
    return from(
      this.dataSource.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'; ` +
        `SET LOCAL app.current_store_id = '${storeId}'; ` +
        `SET LOCAL app.current_role = '${role}';`
      )
    ).pipe(
      switchMap(() => next.handle())
    );
  }
}
```

#### 5.3 等保三级合规

**等保 2.0 三级要求** (网络安全法):
- ✅ 身份鉴别 (双因素认证)
- ✅ 访问控制 (RBAC + ABAC)
- ✅ 安全审计 (全操作日志,180 天保留)
- ✅ 数据完整性 (HMAC 校验)
- ✅ 数据保密性 (AES-256 加密)
- ✅ 数据备份 (异地 3-2-1 备份策略)
- ✅ 个人信息保护 (PII 检测 + 脱敏)
- ✅ 安全事件响应 (SIEM + 告警)

#### 5.4 数据隔离矩阵

| 数据类型 | 字段级 | 实例级 | 加密 | 脱敏 | 审计 |
|---------|:------:|:------:|:----:|:----:|:----:|
| API 密钥 | ✅ | ✅ | AES-256 | ✅ | ✅ |
| 用户 PII (手机/身份证) | ✅ | ✅ | AES-256 | ✅ | ✅ |
| AI 调用日志 | — | ✅ | — | ✅ | ✅ |
| 授权 license | — | ✅ | — | — | ✅ |
| 配置历史 | — | ✅ | — | — | ✅ |
| 第三方 client_secret | ✅ | ✅ | bcrypt | ✅ | ✅ |

---

### 需求 6 · 交付验收标准 (Phase 92)

#### 6.1 测试用例覆盖

| 需求 | 测试套件 | 用例数 | 验收标准 |
|------|----------|:-----:|----------|
| 1 大模型配置 | `ai-model-config.e2e.test.ts` | 25 | 切换灵活性 100% |
| 2 付费授权 | `license-activation.e2e.test.ts` | 30 | 触发及时性 + 准确性 100% |
| 3 多系统对接 | `openapi-compat.e2e.test.ts` | 40 | 兼容性 100% |
| 4 三级配置 | `config-workstation.e2e.test.ts` | 35 | 易用性 100% |
| 5 权限隔离 | `tenant-isolation.e2e.test.ts` | 50 | 0 跨主体泄漏 |
| 6 交付验收 | 汇总测试报告 | — | 全部通过 |

**总计**: **180 用例,0 fail**

#### 6.2 第三方接入接口文档

**输出文档**:
1. **接口参数说明** (`docs/openapi/v9-parameter-spec.md`)
2. **调用示例** (`docs/openapi/v9-examples/`)
   - curl / Python / Java / JavaScript / Go
3. **错误码对照表** (`docs/openapi/v9-error-codes.md`)
   - 100+ 错误码 (鉴权/限流/参数/业务)
4. **联调步骤指南** (`docs/openapi/v9-integration-guide.md`)
   - 5 步接入流程 + 沙箱环境

#### 6.3 测试报告

**报告内容** (`docs/reports/v9-acceptance-2027-12.md`):
- 测试概要 (用例数 / 通过率 / 耗时)
- 6 需求逐一验证 (含截图/日志/数据)
- 性能报告 (5 端 P95 / API P95)
- 安全报告 (等保三级 / 渗透测试)
- 遗留问题 + 后续优化

---

## 三、V9 6 阶段 18 月 Phase 87-92 总览

```
阶段 1 (2026-07~09) 大模型配置      Phase 87  (3 month)
   └─ 4 子模块: 系统预设 + 门店自主 + 一键切换 + 历史回滚
   └─ 后台主场 70% + 前台支援 30%

阶段 2 (2026-10~12) 付费授权        Phase 88  (3 month)
   └─ LicenseGuard + 3 类前置 + 自动激活 + 日志
   └─ 后台主场 80% + 前台支援 20%

阶段 3 (2027-01~03) 多系统对接      Phase 89  (3 month)
   └─ 3 类 RESTful 接口 + 鉴权 + 白名单 + 限流
   └─ 后台主场 90% + 前台支援 10%

阶段 4 (2027-04~06) 三级独立配置    Phase 90  (3 month)
   └─ 3 工作台 (W-S 门店 / W-T 租户 / W-B 品牌) + 自助流程
   └─ 前台主场 60% + 后台支援 40%

阶段 5 (2027-07~09) 权限隔离        Phase 91  (3 month)
   └─ 字段级 + 实例级 + 行级过滤器 + 等保三级
   └─ 后台主场 70% + 前台支援 30%

阶段 6 (2027-10~12) 验收交付        Phase 92  (3 month)
   └─ 180 用例 + 测试报告 + 接口文档 + 等保测评
   └─ 后台 40% + 前台 60%

2027-12-31   V9.0 正式上线 🎉
```

---

## 四、V8 + V9 协同架构

### 4.1 6 大需求映射到 V8 宪法

| V9 需求 | V8 宪法 | 协同方式 |
|---------|---------|---------|
| 1 大模型配置 | 第三条 AI 深度赋能 | AI 4 子模块的"配置层" |
| 2 付费授权 | 第五条 多租户隔离 | L1 应用层 + LicenseGuard |
| 3 多系统对接 | 第八条 SDLC V8 | RESTful 标准接口 |
| 4 三级配置 | 第六条 全链路工作台 | W-S/W-T/W-B 3 个新工作台 |
| 5 权限隔离 | 第五条 3 层隔离 | L1 + L2 强化 |
| 6 交付验收 | 第九条 防御与测试 | 测试金字塔 + 验收清单 |

### 4.2 工作台扩展 (V8 4 个 → V9 7 个)

```
V8 4 工作台 (原):
  W-1 ToC 前台
  W-2 ToB 前台
  W-3 业务中台
  W-4 管理后台

V9 新增 3 工作台 (本 spec):
  W-S 门店配置台   (Phase 90)
  W-T 租户配置台   (Phase 90)
  W-B 品牌配置台   (Phase 90)

合计: V9.0 共 7 工作台
```

### 4.3 数据模型扩展 (V8 → V9)

```
V8 数据模型:
  Tenant / Store / Brand
  + AI 引擎配置 (4 子模块)
  + 知识库中枢 (PG + pgvector + ES + Neo4j)
  + 多租户隔离 (3 层)

V9 新增数据模型:
  + ai_model_preset (系统预设)
  + ai_model_store_config (门店自主)
  + ai_model_config_history (历史版本)
  + license (授权记录)
  + license_activation_log (激活日志)
  + openapi_client (第三方白名单)
  + openapi_call_log (调用日志)
  + field_level_policy (字段级策略)
  + row_level_policy (实例级策略)
```

---

## 五、技术栈与依赖

### 5.1 后台 (V9 后端扩展)

| 模块 | 技术 |
|------|------|
| 框架 | NestJS 10 (V8 已用) |
| 数据库 | PostgreSQL 16 + pgvector + RLS |
| 缓存 | Redis 7 (license / config 缓存) |
| 配置中心 | Apollo / Nacos (热加载配置) |
| 鉴权 | OAuth 2.0 + JWT + HMAC-SHA256 |
| 接口文档 | OpenAPI 3.0 + Swagger UI |
| 加密 | AES-256 (字段) + bcrypt (密钥) |
| 监控 | OpenTelemetry + Prometheus |

### 5.2 前台 (V9 前端扩展)

| 端 | 新增组件 |
|----|---------|
| PC | W-S / W-T / W-B 配置台 + AI 模型切换 UI |
| H5 | 移动端配置台 (只读 + 切换) |
| APP | 推送配置变更通知 |
| Pad | 完整配置台 (同 PC) |
| 小程序 | 配置变更查看 (无修改权限) |

### 5.3 安全工具

| 工具 | 用途 |
|------|------|
| OWASP ZAP | 渗透测试 |
| Snyk | 依赖漏洞扫描 |
| HashiCorp Vault | 密钥管理 (API key) |
| Keycloak | OAuth 2.0 服务器 |
| SonarQube | 代码质量 + 安全 |

---

## 六、验收指标 (18 月累计)

| 维度 | 起点 | 终点 |
|------|:----:|:----:|
| 神机营 commits | 0 | **180** (V9 增量) |
| 神机营测试 | 0 | **3500** (V9 增量) |
| 6 阶段 phase | — | **6 阶段 (Phase 87-92)** |
| 大模型配置 | 0 | **门店 100% 自助切换** |
| 付费授权 | 0 | **3 类前置 + 自动激活** |
| 多系统对接 | 0 | **3 类接口 + 白名单** |
| 三级工作台 | 0 | **W-S/W-T/W-B 3 工作台上线** |
| 权限隔离 | 0 | **字段级 + 实例级 + 等保三级** |
| 测试用例 | 0 | **180 全部通过** |
| 接口文档 | 0 | **完整 OpenAPI + 5 类调用示例** |
| 等保认证 | — | **三级通过** |

---

## 七、风险与缓解

| 风险 | 影响 | 缓解策略 |
|------|------|---------|
| 大模型切换引发 AI 服务中断 | 高 | 灰度切换 + 健康检查 + 自动回滚 |
| License 校验性能瓶颈 | 中 | Redis 缓存 + 异步刷新 + 降级策略 |
| 第三方对接安全 | 高 | IP 白名单 + HMAC 签名 + 限流 + 审计 |
| 字段级加密影响查询性能 | 中 | 仅敏感字段加密 + 索引优化 |
| 等保测评延期 | 高 | 提前 3 月准备 + 外部测评机构对接 |

---

## 八、Phase 87-92 详细任务

### Phase 87 (2026-07~09) · 大模型配置

**P0 任务** (T-V9-P87-001~004):
1. **ai-model-config 模块** — NestJS module + 6 类参数管理
2. **系统预设配置** — 通用 + 行业 4 个预设包
3. **门店自主配置** — 6 类参数 CRUD + 加密存储
4. **一键切换** — 热加载 + 缓存失效 + WebSocket 推送
5. **历史版本** — 自动快照 + 90 天保留 + 一键回滚
6. **前端 W-S 配置台 (大模型部分)**

**验收**: 切换 P95 < 500ms,可用率 ≥ 99.9%,25 测试用例全过

### Phase 88 (2026-10~12) · 付费授权

**P0 任务** (T-V9-P88-001~005):
1. **license 表 + activation_log 表** 设计与迁移
2. **LicenseGuard** NestJS Guard 实现
3. **@RequireLicense() 装饰器** 自动拦截
4. **激活触发器** (cron 1min 扫描 + 订单 webhook)
5. **Redis 缓存** (TTL 5min,失效回源)
6. **license 管理 UI** (W-4 后台 + W-T 租户)

**验收**: 拦截准确率 100%,激活延迟 < 60s,30 测试用例全过

### Phase 89 (2027-01~03) · 多系统对接

**P0 任务** (T-V9-P89-001~006):
1. **openapi 模块** — RESTful 控制器 + 路由
2. **OAuth 2.0 鉴权** — token 颁发/刷新/撤销
3. **HMAC-SHA256 签名验证** 中间件
4. **白名单机制** — IP / client_id / scopes
5. **限流** — Redis token bucket (100 QPS default)
6. **OpenAPI 3.0 文档** + Swagger UI 集成
7. **调用日志** (全量审计)

**验收**: 40 测试用例全过,支持 5+ 客户端并行,文档可读性评分 ≥ 4.5

### Phase 90 (2027-04~06) · 三级独立配置

**P0 任务** (T-V9-P90-001~007):
1. **W-S 门店配置台** (前台主场) — 基础参数 + 联调
2. **W-T 租户配置台** (前台主场) — 批量 + 异步进度
3. **W-B 品牌配置台** (前台主场) — 全局 + 灰度
4. **自助流程后端** — 联调测试 + 自动激活
5. **批量调试 API** (后台支援) — 异步任务队列
6. **灰度发布后端** (后台支援) — 10%→50%→100%
7. **M5 组件扩展** — 3 新组件 + 35 测试用例

**验收**: 35 测试用例全过,易用性评分 ≥ 4.5

### Phase 91 (2027-07~09) · 权限隔离 + 等保三级

**P0 任务** (T-V9-P91-001~006):
1. **字段级加密** — AES-256 + 脱敏中间件
2. **PostgreSQL RLS** — 3 层 RLS 策略
3. **行级过滤器** — NestJS Interceptor + session 注入
4. **审计日志** — 全操作 + 180 天保留
5. **等保测评准备** — 物理/网络/主机/应用/数据 5 层
6. **PII 检测** — 自动识别 + 脱敏

**验收**: 50 测试用例全过,渗透测试 0 高危,等保三级通过

### Phase 92 (2027-10~12) · 验收交付

**P0 任务** (T-V9-P92-001~006):
1. **180 测试用例** 全量回归
2. **测试报告** 撰写 (含截图/日志/数据)
3. **接口文档** OpenAPI + 5 语言示例
4. **错误码表** 100+ 错误码对照
5. **联调指南** 沙箱环境 + 5 步接入
6. **等保测评** 正式测评 + 备案

**验收**: 180/180 测试通过,文档完整,等保三级通过

---

## 九、组织 + 治理

### 9.1 角色分工 (V9 扩展)

V8 11 角色 + V9 新增:

| 角色 | 身份 | V9 职责 |
|------|------|---------|
| 🦞 龙虾哥 | 后台 AI | 大模型配置后端 + License + OpenAPI + 权限隔离 |
| 🐜 树哥 | 前台 AI | W-S/W-T/W-B 工作台 + AI 切换 UI + 文档站 |
| 🕵️ 侦察兵 | 外勤 AI | 客户调研 + 等保测评对接 |
| 👑 Champion × 5 | 决策层 | 6 大需求评审 + DR-V9 决策 |
| 🤖 AI 训练师 | AI 专家 | 大模型微调 (行业适配参数包) |
| 📊 数据分析师 | 数据专家 | license 报表 + 等保数据 |
| 🔐 安全专家 | 安全专家 | 等保测评 + 渗透测试 + 加密方案 |

### 9.2 DR-V9-N 决策记录

V9 7 DR 必须存在:
- DR-V9-1: 大模型配置方案 (4 预设包选定)
- DR-V9-2: 付费授权商业模式 (套餐设计)
- DR-V9-3: OpenAPI 接口规范 (RESTful + OAuth)
- DR-V9-4: 三级工作台权限模型 (W-S/W-T/W-B)
- DR-V9-5: 等保三级实施方案
- DR-V9-6: 字段级加密方案 (AES-256 + Vault)
- DR-V9-7: 行级隔离方案 (RLS + Interceptor)

### 9.3 协作边界

**🦞 龙虾哥 (后台)** 负责:
- ai-model-config 后端模块
- LicenseGuard + activation 触发器
- openapi 控制器 + 鉴权 + 限流
- RLS 策略 + 行级过滤器
- 加密 + Vault 集成

**🐜 树哥 (前台)** 负责:
- W-S 门店配置台 (大模型切换 UI)
- W-T 租户配置台 (批量配置)
- W-B 品牌配置台 (灰度发布)
- 第三方接入文档站 (Swagger UI 嵌入)
- AI 模型切换的乐观更新 UI

**共享协作**:
- 后台起草 OpenAPI, 前台集成调用
- 后台提供 license API, 前台 UI 显示授权状态
- 后台推送配置变更, 前台 WebSocket 监听

---

## 十、关键里程碑

- **2026-07-01**: V9 阶段 1 启动 (Phase 87: 大模型配置)
- **2026-09-30**: Phase 87 验收 (大模型配置上线)
- **2026-10-01**: V9 阶段 2 启动 (Phase 88: 付费授权)
- **2026-12-31**: Phase 88 验收 (付费授权上线)
- **2027-01-01**: V9 阶段 3 启动 (Phase 89: 多系统对接)
- **2027-03-31**: Phase 89 验收 (OpenAPI 上线)
- **2027-04-01**: V9 阶段 4 启动 (Phase 90: 三级配置)
- **2027-06-30**: Phase 90 验收 (3 工作台上线)
- **2027-07-01**: V9 阶段 5 启动 (Phase 91: 权限隔离)
- **2027-09-30**: Phase 91 验收 (等保三级通过)
- **2027-10-01**: V9 阶段 6 启动 (Phase 92: 验收交付)
- **2027-12-31**: V9.0 正式上线 🎉

---

## 十一、参考

- 上游: [.trae/specs/v8-multi-tenant-ai/spec.md](./v8-multi-tenant-ai/spec.md)
- 宪法: [DEVELOPMENT_CONSTITUTION.md](../../DEVELOPMENT_CONSTITUTION.md) (12 条)
- V7: [.trae/specs/v7-scientific-saas/spec.md](./v7-scientific-saas/spec.md)
- V6: [.trae/specs/v6-rhythm/spec.md](./v6-rhythm/spec.md)

---

> 🦞🐜 **"V8 = 多端 AI 中枢架构,V9 = 6 大业务能力落地"**
> 📊 **"lyt 升级神机营,18 月 / 6 阶段 / Phase 87-92 / 180 测试 / 2027-12 上线"**
> 🏛️ **"宪法优先 + V8 协同 + 6 需求 = 神机营 SaaS 完整蓝图"**