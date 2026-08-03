# 租户 LLM 配置模块 (Tenant-LLM Module) — API 接受度文档

## 1. 模块概述与业务目标

租户 LLM 配置模块 (Phase-35: 智能体接入模块) 为每个租户、站点、门店提供完全隔离的大模型（LLM）接入能力。租户可以独立配置 LLM 提供商、模型参数、API Key 与配额，并通过审批流获取平台管理员授权后，通过统一网关调用 LLM。

**业务目标：**
- 多租户 LLM 配置：每个 tenant 独立管理 LLM 配置（provider/model/params）
- 审批治理：配置创建后需审批才能启用，含权限校验和审计日志
- 统一 LLM 网关：支持 7 大 LLM 提供商（OpenAI/Anthropic/DeepSeek/Qwen/Moonshot/Minimax/Custom）
- 配额管理：token 配额上限 + 告警阈值控制
- 调用统计与审计：完整的调用日志、费用估算、审计追溯
- 全球化 i18n-geo 适配：按 IP/国家自动适配语言、货币、时区、社媒渠道

### 核心能力矩阵

| 能力 | 说明 |
|------|------|
| LLM 配置 CRUD | 创建/查询/更新/删除 LLM 配置 |
| 接入申请与审批 | submit → pending → approve/reject → enabled |
| 调用网关 | call() 方法统一分发，配额 + 权限校验 |
| 配额跟踪 | 实时累计 token usage，超限即拒绝 |
| 费用估算 | 按模型定价表 (USD/1M tokens) 估算每次调用费 |
| 审计日志 | 所有审批、调用记录可追溯 |
| 地理路由 | I18nGeoService 按地域自动适配 locale/currency/social |

## 2. 核心实体及字段说明

### TenantLLMConfig (站点 LLM 配置)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 配置 ID (格式: llm-{nanoid}) |
| `tenantId` | `string` | 租户 ID |
| `siteId?` | `string` | 站点 ID |
| `storeId?` | `string` | 门店 ID |
| `name` | `string` | 配置名称 |
| `provider` | `LLMProvider` | 提供商 (openai/anthropic/deepseek/qwen/moonshot/minimax/custom) |
| `modelName` | `string` | 模型名称 (如 deepseek-chat, gpt-4) |
| `apiEndpoint?` | `string` | 自定义 API 端点 |
| `temperature` | `number` | 温度 (默认 0.7, 范围 0-2) |
| `maxTokens` | `number` | 最大 Token 数 (默认 4096) |
| `topP?` | `number` | Top-P (0-1) |
| `quotaLimit?` | `number` | 配额上限 (token 数) |
| `quotaUsed?` | `number` | 已用配额 |
| `quotaAlertThreshold` | `number` | 告警阈值 (默认 0.8) |
| `status` | `LLMConfigStatus` | pending / approved / rejected / suspended |
| `enabled` | `boolean` | 是否启用 |
| `createdAt` | `string` | 创建时间 (ISO) |
| `updatedAt` | `string` | 更新时间 (ISO) |
| `approvedAt?` | `string` | 审批时间 |
| `approvedBy?` | `string` | 审批人 |

### LLMCallRequest (调用请求)

| 字段 | 类型 | 说明 |
|------|------|------|
| `configId` | `string` | LLM 配置 ID |
| `messages` | `Array<{role, content}>` | 消息列表 (system/user/assistant) |
| `temperature?` | `number` | 覆盖温度 |
| `maxTokens?` | `number` | 覆盖最大 Token |
| `tools?` | `ToolDefinition[]` | 工具定义列表 |

### LLMCallLog (调用日志)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 日志 ID |
| `configId` | `string` | 关联配置 ID |
| `tenantId` | `string` | 租户 ID |
| `sessionId?` | `string` | 会话 ID |
| `promptTokens` | `number` | 提示 Token |
| `completionTokens` | `number` | 补全 Token |
| `totalTokens` | `number` | 总 Token |
| `costEstimate` | `number` | 费用估算 (USD) |
| `currency` | `string` | 货币 (USD) |
| `latencyMs` | `number` | 延迟 (ms) |
| `status` | `'success'/'error'/'timeout'` | 调用状态 |
| `errorMessage?` | `string` | 错误信息 |
| `createdAt` | `string` | 创建时间 |

### LLMStats (调用统计)

| 字段 | 类型 | 说明 |
|------|------|------|
| `totalCalls` | `number` | 总调用次数 |
| `successCalls` | `number` | 成功调用 |
| `failedCalls` | `number` | 失败调用 |
| `totalPromptTokens` | `number` | 总输入 Token |
| `totalCompletionTokens` | `number` | 总输出 Token |
| `totalTokens` | `number` | 总 Token |
| `totalCost` | `number` | 总费用 (USD) |
| `currency` | `string` | 货币 |
| `avgLatencyMs` | `number` | 平均延迟 |
| `successRate?` | `number` | 成功率 (0-100) |
| `periodStart` | `string` | 统计起始 |
| `periodEnd` | `string` | 统计结束 |

### LLMAuditLog (审批审计日志)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 审计 ID |
| `tenantId` | `string` | 租户 ID |
| `configId` | `string` | 配置 ID |
| `action` | `'apply'/'approve'/'reject'/'approve_denied'` | 操作 |
| `actorId` | `string` | 操作人 |
| `actorRole?` | `string` | 操作人角色 |
| `success` | `boolean` | 是否成功 |
| `reason?` | `string` | 原因 |
| `createdAt` | `string` | 记录时间 |
| `metadata?` | `Record<string, unknown>` | 额外元数据 |

## 3. API 端点清单

基础路径：`/llm` (应用 TenantScopeGuard + RequireTenantScope + RequirePermissions)

### 3.1 GET /llm/configs
获取当前站点的所有 LLM 配置

**Request Headers:** `x-tenant-id: tenant-001`
**Query:** `?siteId=site-a`
**Response:** `TenantLLMConfig[]` (apiEndpoint masked)

### 3.2 GET /llm/configs/:id
获取单个 LLM 配置详情

### 3.3 POST /llm/configs
创建 LLM 配置 (需 `llm:write`)

**Request:**
```json
{
  "name": "生产环境 DeepSeek",
  "provider": "deepseek",
  "modelName": "deepseek-chat",
  "apiEndpoint": "https://api.deepseek.com/v1",
  "apiKey": "sk-xxxx",
  "temperature": 0.7,
  "maxTokens": 4096,
  "topP": 0.9,
  "quotaLimit": 100000,
  "quotaAlertThreshold": 0.8,
  "siteId": "site-001"
}
```

**Response (201):** `TenantLLMConfig` (apiEndpoint masked, status: "pending")

### 3.4 PUT /llm/configs/:id
更新 LLM 配置 (需 `llm:write`)

### 3.5 DELETE /llm/configs/:id
删除 LLM 配置 (需 `llm:write`)

### 3.6 POST /llm/configs/:id/apply
提交接入申请 (需 `llm:write`)

**Request:**
```json
{
  "configId": "llm-abc123",
  "useCase": "智能客服对话",
  "expectedVolume": 1000,
  "businessJustification": "需要 DeepSeek 支撑客服机器人"
}
```

### 3.7 POST /llm/configs/:id/approve
审批配置 (需 `llm:approve`)

**Request:**
```json
{
  "approved": true,
  "approvedBy": "admin@platform",
  "permissions": ["llm:approve"],
  "actorRole": "platform-admin",
  "reason": "审批通过"
}
```

### 3.8 GET /llm/stats
获取调用统计

**Query:** `?configId=llm-abc123&periodStart=2025-01-01T00:00:00Z&periodEnd=2025-12-31T23:59:59Z`

### 3.9 GET /llm/logs
获取调用日志 (同 stats 查询参数)

### 3.10 GET /llm/audit-logs
获取审批与治理审计日志

## 4. 状态机流转图

### LLM 配置生命周期
```
                    ┌──────────┐
                    │ Draft    │  ← createConfig → status=pending
                    └────┬─────┘
                         │ apply
                    ┌────▼─────┐
                    │ Pending  │  ← applyConfig → status=pending
                    └────┬─────┘
                         │ approve/reject
                    ┌────┴────┐
                    ▼         ▼
              ┌────────┐ ┌────────┐
              │Approved│ │Rejected│
              │enabled │ │        │
              └───┬────┘ └────────┘
                  │ suspend
              ┌───▼────┐
              │Suspended│ → 可重新审批
              └────────┘
```

### LLM 调用网关流
```
TenantLLMGateway.call(tenantId, request)
  ├── 1. getConfig(configId, tenantId) → 校验存在 + tenant 隔离
  ├── 2. 校验 enabled=true AND status=approved
  ├── 3. 配额检查: quotaUsed < quotaLimit
  ├── 4. getApiKey(configId, tenantId) → 解密 API Key
  ├── 5. resolveEndpoint(provider, customEndpoint) → 确定 URL
  ├── 6. buildHeaders(provider, apiKey) → Authorization/x-api-key
  ├── 7. buildBody(config, request) → provider 适配 payload
  ├── 8. executeRequest(endpoint, headers, body) → fetch()
  ├── 9. parseResponse(response, provider) → OpenAI/Anthropic 格式适配
  ├── 10. estimateCost(modelName, usage) → 按 MODEL_PRICING 算费
  └── 11. logCall(...) → 记录调用日志 + 更新 quotaUsed

失败路径:
  ├── 配置不存在 → UnauthorizedException
  ├── 未启用/未审批 → UnauthorizedException
  ├── 配额用尽 → UnauthorizedException
  └── API 调用失败 → 记录 error 日志, 返回 finishReason=error
```

## 5. 错误码清单

| HTTP Status | 错误场景 | 说明 |
|-------------|----------|------|
| `200` | 正常返回 | GET, POST, PUT, POST/approve |
| `201` | 创建成功 | POST /configs |
| `400` | 参数校验失败 | class-validator 拒绝 |
| `401` | 未认证 / 无 x-tenant-id | TenantScopeGuard 拒绝 |
| `403` | 缺少 llm:write/llm:approve 权限 | RequirePermissions 拒绝 |
| `404` | 配置不存在 | getConfig/updateConfig/deleteConfig 返回 null/error |
| `500` | LLM API 调用失败 | fetch 异常 (网络/超时/HTTP 非 2xx) |

### 网关层自定义错误
| 场景 | 异常类型 | 说明 |
|------|----------|------|
| 配置不存在或跨租户 | `UnauthorizedException` | getConfig 返回 null |
| 未启用/未审批 | `UnauthorizedException` | enabled=false 或 status≠approved |
| 配额用尽 | `UnauthorizedException` | quotaUsed >= quotaLimit |
| 缺少审批权限 | `ForbiddenException` | canApprove() 返回 false |
| API Key 未配置 | `Error` | getApiKey 返回 null |

## 6. 性能要求

### LLM 配置管理

| 指标 | 目标 | 说明 |
|------|------|------|
| P50 | ≤ 20ms | 配置 CRUD（纯内存 Map 操作） |
| P95 | ≤ 50ms | getConfigs 含 tenant 过滤 |
| P99 | ≤ 100ms | 审计日志查询 |

### LLM 调用网关

| 指标 | 目标 | 说明 |
|------|------|------|
| P50 | ≤ 2s | 网关层开销 (不含 LLM API 本身) |
| P95 | ≤ 5s | 含 quota + key 解密 + fetch |
| P99 | ≤ 10s | 含重试 (LLM_RETRY_MAX_ATTEMPTS=3) |
| 超时 | 30s | LLM_REQUEST_TIMEOUT_MS |

### 配额与统计

| 指标 | 目标 | 说明 |
|------|------|------|
| P50 | ≤ 30ms | getStats 全量遍历日志 (小数据) |
| P95 | ≤ 200ms | 大规模日志过滤 (建议迁移 DB) |

**优化策略：**
- 当前为内存实现，生产应迁移至 Prisma (pg) + Redis 缓存
- `getCallLogs` 需按 `configId + createdAt` 索引分页
- `MODEL_PRICING` 可动态加载而非硬编码
- I18nGeoService 的 IP 映射建议使用 GeoIP2 库

## 7. 安全约束

### RBAC 权限体系

| 权限 | 说明 | 适用端点 |
|------|------|----------|
| `llm:view` | 查看 LLM 配置 | GET /configs, /configs/:id, /stats, /logs |
| `llm:write` | 增删改 LLM 配置 | POST /configs, PUT/DELETE /configs/:id, POST /apply |
| `llm:approve` | 审批 LLM 配置 | POST /approve |

所有端点通过 `RequirePermissions` 装饰器校验，默认所有端点需要 `llm:view`。

### 租户隔离
- `x-tenant-id` 头必需，TenantScopeGuard 校验
- `TenantLLMService` 所有操作均按 `tenantId` 过滤
- `getApiKey()` 解密时再次校验 config.tenantId === tenantId
- 跨租户访问返回 `null`（等同于配置不存在）

### API Key 安全
- API Key 独立存储于 `apiKeyStore` Map，不在 `TenantLLMConfig` 主配置中
- `encryptApiKey` 使用 Base64 编码（生产应使用 AES-256-GCM 或 KMS）
- getConfig 返回时 mask apiEndpoint
- 生产建议：敏感 Key 存储于 Vault / AWS Secrets Manager

### 审批安全
- `canApprove()` 逻辑：检查 options.permissions 中是否包含 `llm:approve` 或 actorId 匹配 admin/security/safety/platform/owner/root
- 审批拒绝操作也记录审计日志，权限不足返回 ForbiddenException
- 每次审批均记录 `LLMAuditLog`，含 actorRole 和 reason

### I18n 地理安全
- I18nGeoService 不做 IP 防伪，仅用于 locale 推测
- 社媒渠道限制：按国家返回受支持列表（中国: WeChat/Weibo/Douyin）
- `isGeoRestricted()` 标记流媒体/赌博/政治类为受限内容
