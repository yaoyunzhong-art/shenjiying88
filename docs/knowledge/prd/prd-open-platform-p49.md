# PRD-016: 开放平台网关 — Open Platform Gateway (P-49)

> 版本: v1.0 · 签发人: 🦞 龙虾哥 · 对接专家: E44 开放平台
> 发布日期: 2026-07-13 · 状态: 🟢 已签发
> 关联Phase: P-49
> 来源收口: `open-api` + `openapi`

## 1. 业务背景

P-49 不能只有 AI 接入，没有平台入口。
当前仓库里已经存在两套开放能力实现: `open-api` 偏 OAuth + HMAC + 客户端接入，`openapi` 偏 API Key 生命周期、Webhook、Sandbox、Usage 文档化输出，但还缺一个统一的正式 PRD 来收口平台基座边界。

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-49-21 | OAuth 客户端认证 | P0 | 支持 `client_credentials` 获取与校验 Bearer Token |
| RQ-49-22 | HMAC 签名校验 | P0 | 请求支持 HMAC-SHA256 验签、时间窗口校验和防重放 |
| RQ-49-23 | API Key 生命周期 | P0 | 支持创建、查询、列表、撤销、过期检查与脱敏展示 |
| RQ-49-24 | 多租户与作用域隔离 | P0 | API Key、客户端、用量、Webhook 必须绑定 tenantId 与 scope |
| RQ-49-25 | Webhook 订阅与投递 | P1 | 支持订阅、暂停、恢复、投递、重试、死信队列 |
| RQ-49-26 | Sandbox 沙箱环境 | P1 | 支持创建、查询、状态变更和过期清理 |
| RQ-49-27 | 用量统计与限流 | P1 | 支持配额检查、限流桶、usage 报表和统计查询 |
| RQ-49-28 | 开放文档输出 | P1 | 提供 OpenAPI 文档页，覆盖主要平台接口与安全方案说明 |

## 3. 验收卡

| AC | 场景 | 前置 | 预期 |
|:---|:-----|:-----|:-----|
| AC-49-21 | 使用合法 client_id/client_secret 认证 | 已注册客户端 | 返回 Bearer Token 与 scope 信息 |
| AC-49-22 | 使用错误 client_secret 认证 | 客户端存在 | 返回认证失败，不签发 token |
| AC-49-23 | 使用合法 HMAC 请求 sync/command | 已具备 clientId、signature、timestamp | 请求通过验签并被接受 |
| AC-49-24 | 使用过期时间窗口签名请求 | timestamp 超出容差窗口 | 请求被拒绝，标记为签名无效 |
| AC-49-25 | 创建并查询 API Key | tenantId、scope 合法 | API Key 创建成功，查询时仅返回脱敏信息 |
| AC-49-26 | 撤销 API Key 后再次认证 | API Key 已撤销 | 认证失败，返回 revoked/invalid 状态 |
| AC-49-27 | 创建 Webhook 并触发投递失败重试 | 已存在订阅且首次投递失败 | 投递日志记录失败并进入重试或死信流程 |
| AC-49-28 | 访问 `/openapi/docs` | 服务正常运行 | 返回 OpenAPI 文档，包含 API Key、安全方案和 usage 路径 |

## 4. 核心模型

```typescript
interface OpenPlatformClient {
  clientId: string;
  tenantId: string;
  scopes: string[];
  ipWhitelist?: string[];
  status: 'active' | 'disabled';
}

interface OpenPlatformApiKey {
  keyId: string;
  tenantId: string;
  environment: 'LIVE' | 'TEST' | 'SANDBOX';
  scopes: Array<{ resource: string; actions: string[] }>;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt?: string;
}

interface OpenPlatformWebhook {
  id: string;
  tenantId: string;
  topic: string;
  endpoint: string;
  status: 'active' | 'paused' | 'dead-letter';
}
```

## 5. 边界说明

- 本 PRD 聚焦开放平台接入基座，不覆盖 AI 模型接入配置
- 不覆盖第三方计费结算与商家账单系统
- 不覆盖完整 ISV 应用市场
- 不覆盖多区域 API 边缘加速策略
