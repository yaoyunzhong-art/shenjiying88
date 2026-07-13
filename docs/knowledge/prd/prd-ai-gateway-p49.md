# PRD-014: 智能体接入网关 — AI Gateway (P-49)

> 版本: v1.0 · 签发人: 🦞 龙虾哥 · 对接专家: E44 开放平台
> 发布日期: 2026-07-13 · 状态: 🟢 已签发
> 关联Phase: P-49
> 来源收口: `prd-tenant-llm-gateway.md`

## 1. 业务背景

开放平台需要把多租户 AI 接入从“能配”提升到“可治理、可审计、可隔离”。
当前已有旧版网关设计稿，但缺少标准化需求卡与验收卡，无法直接进入 V17 的 Gate 0 派单和审计链路。

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-49-01 | 多租户配置隔离 | P0 | 每条 LLM 配置必须绑定 tenantId，跨租户不可读不可写 |
| RQ-49-02 | 多模型供应商接入 | P0 | 支持 OpenAI、Anthropic、DeepSeek、Qwen 等供应商配置 |
| RQ-49-03 | API Key 安全管理 | P0 | API Key 加密存储，界面仅展示脱敏值 |
| RQ-49-04 | 配额与告警 | P0 | 支持月度额度、已用额度、阈值告警配置 |
| RQ-49-05 | 权限细分 | P1 | 管理员、运营、客服具备差异化读写与审批权限 |
| RQ-49-06 | 调用统计与日志 | P1 | 支持按日/周/月查看调用量、token、费用和状态 |
| RQ-49-07 | 全球化展示 | P1 | 后台支持多语言、时区和货币维度展示 |
| RQ-49-08 | 接入申请流转 | P1 | 新模型接入支持申请、审批、拒绝、暂停状态流转 |

## 3. 验收卡

| AC | 场景 | 前置 | 预期 |
|:---|:-----|:-----|:-----|
| AC-49-01 | 租户A创建模型配置 | 已带 tenantA 上下文登录 | 配置创建成功且仅 tenantA 可见 |
| AC-49-02 | 租户B访问租户A配置 | 已知 tenantA 配置 ID | 返回无权限或不存在 |
| AC-49-03 | 新增 OpenAI 配置 | 当前用户有 `llm:write` 权限 | 配置保存成功并展示供应商字段 |
| AC-49-04 | 查看配置详情 | 已存在 API Key | 页面仅展示脱敏值，不返回明文 |
| AC-49-05 | 设置额度阈值 | 配置存在 | 可保存 `quotaLimit` 与告警阈值 |
| AC-49-06 | 查询统计页 | 已有调用记录 | 展示调用次数、token、费用与状态维度 |
| AC-49-07 | 提交接入申请 | 配置满足申请前置条件 | 状态进入 pending 或 approved 流程 |
| AC-49-08 | 普通运营执行审批 | 当前用户无 `llm:approve` 权限 | 审批被拒绝并记录审计日志 |

## 4. 数据模型

```typescript
interface TenantLLMConfig {
  id: string;
  tenantId: string;
  provider: 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'custom';
  modelName: string;
  apiKeyEncrypted: string;
  temperature: number;
  maxTokens: number;
  quotaLimit?: number;
  quotaUsed?: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  enabled: boolean;
}

interface LLMCallLog {
  id: string;
  configId: string;
  tenantId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimate: number;
  latencyMs: number;
  status: 'success' | 'error' | 'timeout';
}
```

## 5. 边界说明

- 本 PRD 聚焦租户级 AI 接入治理，不覆盖 Prompt 市场
- 不包含模型效果自动 A/B 评估
- 不包含财务代扣和自动账单结算
- 不包含跨云厂商灾备调度
