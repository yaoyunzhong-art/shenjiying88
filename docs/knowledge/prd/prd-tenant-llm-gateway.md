# 神机营智能体接入模块 PRD

## 1. 产品概述

**项目名称**: 智能体接入模块 (Tenant AI Gateway)
**项目类型**: 面向神机营SaaS多租户系统的大模型接入配置与管理平台
**核心定位**: 为每个独立租户、门店、站点提供完全隔离的大模型接入能力，实现"单租户、单店、单站点"的自主独立AI配置
**目标用户**: 各租户/门店/站点的管理员

---

## 2. 核心设计原则

### 2.1 隔离机制

| 隔离级别 | 说明 | 实现方式 |
|----------|------|----------|
| 物理隔离 | 每个站点的LLM配置独立存储 | 独立的数据库记录 + tenantId关联 |
| 逻辑隔离 | 调用链路完全独立 | 独立的API路由 + 租户上下文 |
| 权限隔离 | 仅站点管理员可管理 | 基于现有身份认证体系的权限控制 |

### 2.2 自主运营

- 全链路接入流程无需平台方人工介入
- 站点管理员自主完成配置、申请、权限分配
- 调用量统计与分析完全透明

---

## 3. 功能模块

### 3.1 LLM配置管理

| 功能 | 说明 |
|------|------|
| 模型选择 | 支持 OpenAI GPT-4、Anthropic Claude、DeepSeek、通义千问等 |
| API Key管理 | 站点自主配置自有API Key，支持加密存储 |
| 参数配置 | Temperature、Max Tokens、Top-P 等 |
| 额度监控 | 显示已用/可用额度，支持告警设置 |
| 接入申请 | 一键申请接入，平台审核（可选自动通过） |

### 3.2 权限分配

| 功能 | 说明 |
|------|------|
| 角色配置 | 站点管理员、运营人员、客服等角色 |
| 功能权限 | 查看/编辑/删除权限细分 |
| 工具权限 | 不同角色可使用的AI工具集合 |
| 日志审计 | 操作日志完整记录 |

### 3.3 统计分析

| 功能 | 说明 |
|------|------|
| 调用量统计 | 按日/周/月维度统计调用次数 |
| Token消耗 | Prompt/Completion token分开统计 |
| 费用估算 | 基于模型单价估算费用 |
| 质量评估 | 会话质量评分分布 |

### 3.4 全球化适配

| 功能 | 说明 |
|------|------|
| 多语言界面 | 中文、英文、日文、韩文等 |
| 货币显示 | USD、CNY、JPY、KRW 等 |
| 时区同步 | 自动适配用户所在时区 |
| 社媒渠道 | WhatsApp、Line、Telegram、Messenger 等 |

---

## 4. 数据模型

### 4.1 LLM配置实体

```typescript
interface TenantLLMConfig {
  id: string;
  tenantId: string;        // 租户ID
  siteId: string;          // 站点ID (可选)
  storeId?: string;        // 门店ID (可选)

  // 模型配置
  provider: 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'custom';
  modelName: string;
  apiEndpoint?: string;     // 自定义API端点
  apiKeyEncrypted: string;  // 加密存储

  // 参数配置
  temperature: number;
  maxTokens: number;
  topP?: number;

  // 配额配置
  quotaLimit?: number;     // 月度配额上限
  quotaUsed?: number;      // 已使用配额
  quotaAlertThreshold?: number; // 告警阈值

  // 状态
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  enabled: boolean;

  // 时间戳
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}
```

### 4.2 调用记录

```typescript
interface LLMCallLog {
  id: string;
  configId: string;
  tenantId: string;

  // 调用信息
  sessionId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // 费用
  costEstimate: number;
  currency: string;

  // 响应
  latencyMs: number;
  status: 'success' | 'error' | 'timeout';

  // 时间戳
  createdAt: string;
}
```

---

## 5. API设计

### 5.1 路由结构

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | /llm/configs | 获取当前站点LLM配置列表 |
| POST | /llm/configs | 创建LLM配置 |
| GET | /llm/configs/:id | 获取单个配置详情 |
| PUT | /llm/configs/:id | 更新配置 |
| DELETE | /llm/configs/:id | 删除配置 |
| POST | /llm/configs/:id/apply | 提交接入申请 |
| GET | /llm/stats | 获取调用统计 |
| GET | /llm/logs | 获取调用日志 |

### 5.2 权限要求

- `llm:read` - 查看LLM配置
- `llm:write` - 创建/编辑LLM配置
- `llm:delete` - 删除LLM配置
- `llm:approve` - 审批接入申请（平台管理员）
- `llm:admin` - 管理所有站点的LLM配置（平台管理员）

---

## 6. 前端页面

### 6.1 页面清单

| 页面 | 路由 | 说明 |
|------|------|------|
| LLM配置列表 | /llm-config | 展示站点所有LLM配置 |
| 配置详情 | /llm-config/:id | 查看/编辑单个配置 |
| 统计分析 | /llm-config/stats | 调用量与费用统计 |
| 权限管理 | /llm-config/permissions | 站点角色权限配置 |
| 接入申请 | /llm-config/apply | 提交新模型接入申请 |

### 6.2 设计规范

- **风格**: 大气沉稳，适配管理后台整体风格
- **布局**: 响应式，支持宽屏自适应
- **组件**: 使用Ant Design 6.5.0
- **主题**: 深色主题 (`rgba(15, 23, 42, 0.35)`)

---

## 7. 技术实现

### 7.1 后端

- **模块**: `TenantLLMModule`
- **服务**: `TenantLLMConfigService`, `TenantLLMGatewayService`
- **控制器**: `TenantLLMController`
- **守卫**: `TenantScopeGuard` (复用现有租户隔离)

### 7.2 前端

- **页面**: `/apps/admin-web/app/llm-config/`
- **SDK更新**: 扩展 `@m5/types` 类型定义

---

## 8. 合规与安全

- API Key加密存储（AES-256）
- 调用链路完全隔离，无跨站点数据泄露
- 操作日志留存≥180天
- 权限最小化原则

---

## 9. 验收标准

- [ ] 单站点可独立配置多个LLM模型
- [ ] 跨站点数据完全隔离
- [ ] 管理后台支持多语言切换
- [ ] 调用量统计精确到日维度
- [ ] API响应时间<200ms

## 10. 需求卡（预备补齐）

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-LLM-01 | 多租户隔离配置 | P0 | 每条 LLM 配置必须绑定 tenantId，跨租户不可读不可写 |
| RQ-LLM-02 | 多模型接入管理 | P0 | 支持新增、编辑、删除多家模型供应商配置 |
| RQ-LLM-03 | API Key 安全存储 | P0 | API Key 仅加密存储与脱敏展示，明文不可回显 |
| RQ-LLM-04 | 配额与告警 | P0 | 支持月度额度、已用额度、阈值告警配置 |
| RQ-LLM-05 | 权限细分 | P1 | 管理员、运营、客服等角色具备差异化读写权限 |
| RQ-LLM-06 | 调用统计与日志 | P1 | 可按日/周/月查询调用量、token、费用、状态 |
| RQ-LLM-07 | 全球化适配 | P1 | 管理后台支持多语言、时区和货币维度展示 |
| RQ-LLM-08 | 接入申请流转 | P1 | 新模型接入支持申请、审批、拒绝、暂停等状态流转 |

## 11. 验收卡（自动化可映射）

| AC | 场景 | 前置 | 预期 |
|:---|:-----|:-----|:-----|
| AC-LLM-01 | 租户A创建配置 | 已带 tenantA 上下文登录 | 配置创建成功且仅 tenantA 可见 |
| AC-LLM-02 | 租户B访问租户A配置 | 已知 tenantA 配置 ID | 返回无权限或不存在 |
| AC-LLM-03 | 新增 OpenAI/Claude/DeepSeek 配置 | 管理员具备 llm:write 权限 | 配置保存成功并展示供应商字段 |
| AC-LLM-04 | 查看配置详情 | 已存在 API Key | 页面仅展示脱敏值，不返回明文 |
| AC-LLM-05 | 设置额度阈值 | 配置存在 | 可保存 quotaLimit 与告警阈值 |
| AC-LLM-06 | 查询统计页 | 已有调用记录 | 展示调用次数、token、费用与状态维度 |
| AC-LLM-07 | 提交接入申请 | 配置状态为 draft/pending 前置可满足 | 状态进入 pending 或 approved 流程 |
| AC-LLM-08 | 无 llm:approve 权限执行审批 | 当前用户为普通运营 | 审批被拒绝并记录审计日志 |

## 12. 不在本次预备稿范围

- 模型效果自动 A/B 评估
- Prompt 工程市场与模板商店
- 跨云厂商自动灾备切换
- 账单自动代扣与财务对账
