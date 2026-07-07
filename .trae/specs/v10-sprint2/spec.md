# 神机营 SaaS · V10 Sprint 2 Spec (Day 16-30)

> **项目代号**: V10 Sprint 2 (Sprint 1 完成后增量)
> **生效**: 2026-06-28 (Sprint 1 Done 后)
> **上游**: V10 Sprint 1 + Phase 87-93 完成
> **下游**: 5 个新 Phase (94-98)
> **派工人**: 大飞哥 (产品决策人)
> **执行**: 🦞 龙虾哥 (后台) + 🐜 树哥 (前台)
> **覆盖**: 2026-06-29 ~ 2026-07-13 (Day 16-30, 2 周)

---

## 一、Sprint 2 范围

### 1.1 目标

在 Sprint 1 完成的 7 个 Phase 基础上,增加 5 个**业务增值能力**:

| Phase | 名称 | 后台 | 前台 | 工期 |
|-------|------|------|------|------|
| 94 | 智能分析 (LLM 报表洞察) | 6 文件 + 20 tests | 3 文件 + 12 tests | Day 16-18 |
| 95 | 第三方集成 (飞书/钉钉/企微) | 7 文件 + 25 tests | 4 文件 + 18 tests | Day 19-21 |
| 96 | 高级 SaaS (自定义 domain + SSO) | 8 文件 + 30 tests | 3 文件 + 15 tests | Day 22-25 |
| 97 | 联邦学习 (跨租户模型训练) | 5 文件 + 18 tests | 2 文件 + 8 tests | Day 26-28 |
| 98 | 边缘计算 (CDN 缓存层) | 4 文件 + 15 tests | 1 文件 + 5 tests | Day 29-30 |

**总计**: 30 后台文件 + 108 tests + 13 前台文件 + 58 tests = **166 tests**

### 1.2 Sprint 2 vs Sprint 1

| 维度 | Sprint 1 | Sprint 2 |
|------|----------|----------|
| 焦点 | 多租户核心能力 (6 V9 需求) | 业务增值能力 |
| 复杂度 | 中 (新模块) | 高 (跨系统集成) |
| 集成 | 内部模块 | 第三方服务 |
| 风险 | 低 (内部接口) | 中 (外部 API 兼容) |
| SLA | 内定 (p95<500ms) | 外定 (依赖第三方) |

---

## 二、Phase 94: 智能分析 (LLM 报表洞察)

### 2.1 目标

在 Phase 91 报表基础上,增加 **AI 自动洞察**:LLM 读取报表数据 → 生成自然语言结论 + 行动建议。

### 2.2 后台 6 文件

```
apps/api/src/modules/insight/
├── insight.entity.ts        # InsightReport + InsightSource + InsightStatus
├── insight.dto.ts           # GenerateInsightDto + InsightResponseDto
├── insight.service.ts       # 调用 LLM (复用 Phase 87 AI 配置) + 缓存 + 模板
├── insight.controller.ts    # POST /insight/generate + GET /insight/:id
├── insight.prompt.ts        # 5 报表模板 (sales/inventory/finance/marketing/customer)
└── insight.service.test.ts  # 20 tests
```

**关键设计**:
- 复用 Phase 87 `AiModelConfigService.getDecryptedApiKey()` 拿 LLM 凭证
- 提示词模板按租户 industry 字段定制 (餐饮/零售/服务)
- 输出 markdown,前端直接渲染
- 缓存 24h 防 LLM 调用泛滥

### 2.3 前台 3 文件

```
packages/ui/src/insight/
├── InsightPanel.tsx         # 渲染 markdown 报告
├── InsightTrigger.tsx       # 报表详情页 "AI 洞察" 按钮
└── useInsight.ts            # POST /insight/generate + 流式显示
```

### 2.4 验收

- LLM 调用 p95 < 3s (含缓存)
- 5 报表模板 100% 覆盖
- 缓存命中后 p95 < 100ms

---

## 三、Phase 95: 第三方集成 (Webhook)

### 3.1 目标

支持飞书 / 钉钉 / 企微 3 大办公平台的**双向集成**:
- 出: 系统事件 (license 过期/灰度晋级/告警) → 推送到 IM
- 入: IM 指令 (审批/查询) → 触发系统动作

### 3.2 后台 7 文件

```
apps/api/src/modules/webhook/
├── webhook.entity.ts        # WebhookEndpoint + WebhookDelivery + WebhookStatus
├── webhook.dto.ts           # CreateWebhookDto + WebhookEvent enum
├── webhook.service.ts       # 3 平台适配器 + HMAC 签名 + 重试 (指数退避)
├── webhook.controller.ts    # 12 endpoints
├── webhook.platforms.ts     # feishu/dingtalk/wecom 适配器
├── webhook.eventbus.ts      # 内部事件总线 (NestJS EventEmitter)
└── webhook.service.test.ts  # 25 tests
```

**事件类型**:
- `license.expired` (Phase 88)
- `canary.promoted` / `canary.rolled_back` (Phase 92)
- `monitoring.alert.fired` (Phase 93)
- `insight.generated` (Phase 94)

### 3.3 前台 4 文件

```
packages/ui/src/webhook-config/
├── WebhookList.tsx          # 配置列表
├── WebhookForm.tsx          # 创建/编辑
├── WebhookDeliveryLog.tsx   # 投递日志 + 重试
└── useWebhook.ts            # CRUD + 测试发送
```

### 3.4 验收

- 3 平台适配器 100% 通过测试
- HMAC 签名用 `timingSafeEqual` (Phase 89 同款)
- 投递失败 3 次后入 dead-letter

---

## 四、Phase 96: 高级 SaaS (Custom Domain + SSO)

### 4.1 目标

支持企业级客户需求:
- **自定义域名**: `acme.shenjiying88.com` 指向租户
- **SSO 单点登录**: SAML 2.0 + OIDC 双协议

### 4.2 后台 8 文件

```
apps/api/src/modules/saas-advanced/
├── custom-domain.entity.ts  # DomainMapping + DomainStatus + SSL 状态
├── custom-domain.service.ts # DNS 校验 (TXT 记录) + SSL 申请 (Let's Encrypt)
├── sso.entity.ts            # SsoConfig + SsoProvider (saml/oidc)
├── sso.service.ts           # SAML 2.0 (passport-saml) + OIDC (openid-client)
├── sso.controller.ts        # /sso/login/:tenantId + /sso/callback + /sso/metadata
├── custom-domain.controller.ts # 8 endpoints
├── custom-domain.middleware.ts # Host → tenantId 解析
└── (combined tests)         # 30 tests
```

### 4.3 前台 3 文件

```
packages/ui/src/saas-advanced/
├── CustomDomainPanel.tsx    # DNS 配置向导
├── SsoConfigPanel.tsx       # SAML/OIDC 配置 + 测试登录
└── useAdvancedSaas.ts
```

### 4.4 验收

- DNS TXT 校验 < 60s
- SAML AuthnRequest 签名符合规范
- 自定义域名 SSL 自动续期

---

## 五、Phase 97: 联邦学习 (跨租户模型训练)

### 5.1 目标

允许多租户**联合训练共享模型**,而不暴露原始数据 (隐私计算)。

### 5.2 后台 5 文件

```
apps/api/src/modules/federated/
├── federated.entity.ts      # FederatedRound + Participant + AggregationMethod
├── federated.service.ts     # FedAvg 算法 + 差分隐私 (DP-SGD)
├── federated.controller.ts  # /federated/rounds + /federated/participate
├── federated.privacy.ts     # 噪声注入 + 梯度裁剪
└── federated.service.test.ts # 18 tests
```

**安全约束**:
- 每个参与者只能看到聚合梯度,不能反推原始数据
- DP-SGD: 噪声 scale = sensitivity * sqrt(2*ln(1.25/δ)) / ε
- 至少 3 个参与者才能开始一轮

### 5.3 前台 2 文件

```
packages/ui/src/federated/
├── FederatedDashboard.tsx   # 训练进度 + 参与方列表
└── useFederated.ts
```

### 5.4 验收

- 3 租户聚合 p95 < 5s
- 隐私预算 ε ≤ 1.0 (强隐私)
- 模型准确率 ≥ 单租户模型的 95%

---

## 六、Phase 98: 边缘计算 (CDN 缓存层)

### 6.1 目标

在 API 网关层加 CDN 缓存,降低 p95 延迟和源站压力。

### 6.2 后台 4 文件

```
apps/api/src/modules/cdn-cache/
├── cache-key.ts             # 基于 tenant + path + query 哈希
├── cache.service.ts         # LRU + TTL + 失效广播
├── cache.middleware.ts      # Cache-Control 头解析
└── cache.service.test.ts    # 15 tests
```

**策略**:
- 静态资源 (OpenAPI 文档/Swagger UI): 24h
- 报表查询 (Phase 91): 5min
- 配置查询 (Phase 90): 30s
- 实时数据 (Phase 92 灰度): 不缓存

### 6.3 前台 1 文件

```
packages/ui/src/cdn-monitor/
└── CacheHitRate.tsx         # 命中率仪表盘 (admin 可见)
```

### 6.4 验收

- 报表查询 p95 从 4ms → 1ms (5x 提升)
- 命中率 ≥ 80%
- 缓存失效广播 < 5s

---

## 七、Day 16-30 时间表

| Day | 龙虾哥 (后台) | 树哥 (前台) |
|-----|---------------|-------------|
| 16 | Phase 94 entity + service | InsightPanel UI |
| 17 | Phase 94 LLM 集成 + prompt 模板 | InsightTrigger + useInsight |
| 18 | Phase 94 tests + 验收 | Phase 94 UI tests |
| 19 | Phase 95 entity + 3 适配器 | WebhookList + WebhookForm |
| 20 | Phase 95 HMAC + 重试 + dead-letter | WebhookDeliveryLog |
| 21 | Phase 95 tests + 验收 | Phase 95 UI tests |
| 22 | Phase 96 custom-domain + DNS 校验 | CustomDomainPanel |
| 23 | Phase 96 SSO SAML 2.0 | SsoConfigPanel |
| 24 | Phase 96 SSO OIDC + middleware | Phase 96 UI tests |
| 25 | Phase 96 tests + 验收 | Phase 96 集成 |
| 26 | Phase 97 FedAvg + DP-SGD | FederatedDashboard |
| 27 | Phase 97 隐私预算 + 聚合 | useFederated + tests |
| 28 | Phase 97 tests + 验收 | Phase 97 集成 |
| 29 | Phase 98 cache service + middleware | CacheHitRate |
| 30 | Phase 98 tests + Sprint 2 验收 | Phase 98 集成 |

---

## 八、关键技术决策

### 8.1 Phase 94 LLM 选择

- 默认用 Phase 87 配置的 `preset-deepseek` (性价比)
- 支持租户自定义 LLM (Phase 87 已支持)
- 流式输出用 Server-Sent Events (复用 Phase 23 AI Agent 经验)

### 8.2 Phase 95 平台适配器

用策略模式 + 适配器接口:
```typescript
interface WebhookPlatform {
  format(event: WebhookEvent): unknown  // 各平台消息格式
  sign(payload: string, secret: string): string  // 各平台签名算法
  verify(req: Request): boolean
}
```

### 8.3 Phase 96 自定义域名

- **DNS 校验**: 用户添加 CNAME + TXT 记录 (含校验 token)
- **SSL**: Let's Encrypt via `acme-client` + 自动续期 cron (60 天前)
- **多租户隔离**: 通过 Host header 反查 tenantId

### 8.4 Phase 97 联邦学习

- **聚合算法**: FedAvg (McMahan 2017)
- **隐私机制**: DP-SGD (Abadi 2016), ε=1.0, δ=1e-5
- **参与方**: ≥ 3 个同行业租户才能开一轮

### 8.5 Phase 98 缓存策略

- **CloudFlare/阿里云 CDN**: 双供应商,故障自动切换
- **缓存键**: `sha256(tenantId + path + sortedQuery)`
- **失效广播**: Redis Pub/Sub 多节点

---

## 九、Sprint 2 验收 (Day 30)

| 指标 | 目标 |
|------|------|
| Phase 94-98 全部完成 | ✅ |
| 后台 30 文件 | ✅ |
| 前台 13 文件 | ✅ |
| 后台 108 tests | ✅ |
| 前台 58 tests | ✅ |
| 累计 Sprint 1+2 tests | 368 PASS |
| OWASP 审计 | 持续 PASS |
| 性能回归 | p95 < Sprint 1 baseline |

---

## 十、风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| LLM API 不稳定 | Phase 94 洞察失败 | 重试 3 次 + 缓存 24h |
| IM 平台 API 变更 | Phase 95 投递失败 | 适配器抽象 + 监控 |
| SAML 元数据过期 | Phase 96 SSO 失败 | 启动时刷新 + 6h cron |
| 联邦学习算力 | Phase 97 慢 | 异步任务 + 进度回调 |
| CDN 缓存穿透 | Phase 98 击穿源站 | stale-while-revalidate |

---

> 🦞🐜 **"Sprint 2 = V10 增值 5 件套 = 从 SaaS 平台到 AI 中台"**
> 📊 **"30 文件 + 166 tests + 5 Phase = Day 30 完成"**
> 🏛️ **"V8 宪法 19 条 + Sprint 1 经验复用 = 风险可控"**
