# Phase-41 智能客服 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:05 CST (1h 冲刺)
> **创建人**: 🦞 龙虾哥 (后台 22h 大脑级)
> **Phase**: P2 智能化 (Phase-41~44, 4 phase)
> **预计**: 1 天

---

## 1. 业务目标

智能客服是 SaaS 平台服务升级核心:
- **AI 自动回答**: 基于知识库的 7×24 客服
- **人工接管**: 复杂问题转人工
- **会话管理**: 多轮对话 + 上下文保持
- **知识库**: FAQ + 业务规则 + 操作指南
- **多租户隔离**: 每个租户独立客服

依赖 Phase-36 会员 + Phase-39 报表。

---

## 2. 数据模型

### Conversation (会话)
```typescript
interface Conversation {
  id: string
  tenantId: string
  userId?: string                // 关联会员 (可选)
  channel: 'WEB' | 'WX' | 'PHONE'
  status: 'OPEN' | 'PENDING' | 'CLOSED'
  assignedAgentId?: string       // 人工坐席
  aiEnabled: boolean             // 是否启用 AI
  context: ConversationContext
  createdAt: string
  closedAt?: string
}

interface ConversationContext {
  messages: ChatMessage[]
  userInfo?: { name?: string; level?: string; totalSpent?: number }
  detectedIntent?: string
}

interface ChatMessage {
  id: string
  conversationId: string
  role: 'USER' | 'AI' | 'AGENT'
  content: string
  attachments?: string[]
  timestamp: string
}
```

### KnowledgeBase (知识库)
```typescript
interface KnowledgeDoc {
  id: string
  tenantId: string
  category: 'FAQ' | 'POLICY' | 'OPERATION' | 'BUSINESS'
  title: string
  content: string
  embedding?: number[]           // 向量 (可选)
  tags: string[]
  viewCount: number
  helpfulCount: number
  updatedAt: string
}
```

### AIAgent (AI 坐席)
```typescript
interface AIAgent {
  id: string
  tenantId: string
  name: string                   // 如 "小台"
  model: 'GPT-4' | 'GPT-3.5' | 'CLAUDE' | 'LOCAL'
  systemPrompt: string
  knowledgeBaseIds: string[]
  fallbackAgentId?: string       // AI 失败转人工
  enabled: boolean
}
```

---

## 3. 任务卡 (T171 · P2 智能化)

| T-NN | 标题 | 估时 | 依赖 |
|------|------|------|------|
| T171-1 | 会话引擎 + AI 集成 | 0.5d | - |
| T171-2 | 知识库管理 | 0.25d | - |
| T171-3 | 人工接管 + 工单 | 0.25d | T171-1 |

**总计**: 1 天

---

## 4. Champion 督导
- E44 周技术总监 (AI 模型选型)
- E19 王运营总监 (客服 KPI)

---

## 5. 关键决策待定 (Open Questions)
1. **AI 模型**: GPT-4 / Claude / 本地 LLaMA?
2. **知识库更新**: 自动挖掘 / 人工录入?
3. **会话超时**: 5 分钟 / 30 分钟 / 24 小时?
4. **多语言**: 仅中文 / 中英双语?
5. **人工接管阈值**: AI 置信度 < 0.7?

---

## V3 决策锁定 · 2026-06-27 22:25 CST

### D1 AI 模型选型: 多 Provider 适配 (DeepSeek + OpenAI + Claude)
- **主**: DeepSeek (中文优化 + 成本低 ¥1/M tokens)
- **备**: OpenAI GPT-4o (高质量兜底)
- **兜底**: Claude 3.5 (复杂推理)
- **架构**: `AIProviderFactory` 根据租户配置选择,失败自动切换

### D2 知识库更新: 人工录入 + AI 辅助挖掘
- **人工录入**: 运营人员维护 FAQ (主流程)
- **AI 挖掘**: 每周 cron 分析未匹配问题,推荐新 FAQ
- **审核流程**: AI 推荐 → 运营审核 → 入库
- **版本管理**: 知识库每次更新生成快照,支持回滚

### D3 会话超时: 5 分钟活跃 + 30 分钟归档 + 7 天清理
- **活跃窗口**: 5 分钟无新消息 → 状态置 PENDING
- **归档窗口**: 30 分钟无响应 → 状态置 CLOSED
- **数据保留**: 7 天后异步清理 (GDPR 合规)
- **唤醒机制**: 用户再次发起 → 创建新会话 (引用老上下文)

### D4 多语言: 仅中文 (V1) → 中英双语 (V2)
- **V1**: 仅中文 (95% 用户在大陆)
- **V2**: 中英双语 (海外租户)
- **架构**: i18n 字典 + 语言检测 (Accept-Language header)

### D5 人工接管阈值: 双触发 (置信度 < 0.7 OR 用户主动请求)
- **置信度触发**: AI 置信度 < 0.7 → 提示"转人工?"
- **用户触发**: 用户说"人工"/"客服" → 立即转
- **坐席分配**: 轮询 + 负载均衡 (每人最多 5 个并发会话)
- **上下文保留**: 完整 AI 对话历史同步给坐席

### D6 会话数据保留 (GDPR 合规)
- **7 天热数据**: Redis 缓存,实时访问
- **30 天冷数据**: PostgreSQL,合规审计
- **90 天后归档**: S3 冷存储,按需恢复
- **365 天后清理**: 自动化数据删除

### D7 监控与告警 (基于 SLO)
- **P99 响应时间**: < 2s (含 AI 模型调用)
- **AI 准确率**: 首次回答准确率 > 85%
- **人工接管率**: < 30% (过高说明 AI 不够好)
- **会话完成率**: > 70%
- **告警**: 准确率 < 75% OR P99 > 3s → oncall

### D8 关键技术栈
- **后端**: NestJS + Prisma + Redis
- **AI**: Vercel AI SDK (多 Provider 统一接口)
- **向量**: pgvector (PostgreSQL 扩展,降低运维成本)
- **前端**: React + SSE (流式输出) + WebSocket (双向)
- **监控**: Pino + OpenTelemetry + Grafana

---

## 现状盘点 (派发前必做)

预计增量 (基于现有架构):
- **新增文件**: 8 个
  - ai-cs.module.ts / ai-cs.controller.ts / ai-cs.service.ts
  - conversation.entity.ts / message.entity.ts
  - ai-provider.factory.ts / deepseek.adapter.ts / openai.adapter.ts
  - knowledge-base.service.ts / vector-search.service.ts
- **修改文件**: 3 个
  - prisma/schema.prisma (Conversation + Message + KnowledgeBase 3 表)
  - app.module.ts (注册 AiCsModule)
  - frontend/admin-web (AI 客服面板)
- **测试**: 25+ 断言
  - AI Provider 切换 (3 provider × 3 场景)
  - 知识库检索 (10 断言)
  - 上下文保持 (5 轮对话)
  - 人工接管 (置信度 + 用户请求)
  - GDPR 清理 (时间窗口)

---

## 风险与防御

### 风险 1: AI 模型延迟
- **防御**: SSE 流式输出 + 首 token < 500ms
- **兜底**: 超时 5s → 切换 Provider

### 风险 2: 知识库过时
- **防御**: 每周 AI 挖掘 + 运营审核
- **兜底**: 标注"知识截止 2026-06-01"

### 风险 3: AI 幻觉
- **防御**: RAG 检索增强 + 置信度阈值
- **兜底**: 置信度低 → 提示"转人工"

### 风险 4: 多租户数据隔离
- **防御**: knowledge_base.tenantId 强制 WHERE 过滤
- **兜底**: 单元测试覆盖跨租户查询

---

> 🦞 **"Phase-41 = AI 客服 = SaaS 平台服务升级核心 = 多 Provider + RAG + GDPR 合规"**

> 🦞 **"Phase-41 智能客服 = P2 智能化第 1 步"**