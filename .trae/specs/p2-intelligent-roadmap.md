# P2 智能化路线图整合 · 业务深度版

> **创建**: 2026-06-28 02:10 CST · Part 21 启动
> **创建人**: 🦞 龙虾哥 (P1 收官 → P2 启动)
> **签发人**: 🧑‍✈️ 大飞哥 (确认业务深度路线)
> **状态**: 🟡 启动 (P2 业务深度优先)
> **总估时**: 4 phase × 1d = **4 天** (P2 智能化)

---

## 决议 (大飞哥 02:10 CST 拍板)

> "P2 走业务深度, AI 客服 + 营销 + 分析 + 开放API 是 SaaS 差异化护城河"

v4.0 master-plan 早期定义的 **技术深度 (异常检测/自愈/i18n/开放API)** 路线降级为 P2.5 备选 (后置), 当前 P2 阶段优先业务深度。

---

## P2 业务深度 4 phase 完整链

```
Phase-41 智能客服 (T171, 1d)
    ↓  依赖: 会员 (P1.2) + 知识库
Phase-42 智能营销 (T172, 1d)
    ↓  依赖: AI 客服 + 会员画像
Phase-43 数据分析 (T173, 1d)
    ↓  依赖: 报表 (P1.5)
Phase-44 开放 API (T174, 1d)
    ↓  依赖: 收银台 + 会员
    └→ P2 业务深耕 100% 收官
```

---

## Phase-41 智能客服 · T171

### 目标
- AI 自动回答 (7×24): 基于知识库的 FAQ 引擎
- 人工接管: 复杂问题转人工坐席
- 多轮对话: 5 轮上下文窗口
- 多 Provider: OpenAI / DeepSeek / Anthropic (可切换)
- 多租户: 每个租户独立客服

### 5 AC
- [ ] AI 会话引擎 (GPT/DeepSeek 多 Provider)
- [ ] 意图识别 + FAQ 知识库
- [ ] 多轮对话上下文管理 (5 轮)
- [ ] 人工坐席无缝接管 (置信度阈值 < 0.7)
- [ ] E2E + KPI (首次响应 < 2s)

### V3 决策锁 (2026-06-27 22:25)
- D1 Provider: OpenAI 优先 (海外兼容) + DeepSeek (国内降本)
- D2 向量库: pgvector (Postgres 内置) → Pinecone (V2 海外)
- D3 接管: 置信度 < 0.7 自动转人工
- D4 多语言: V1 仅中文 → V2 中英
- D5 知识库: FAQ + 操作指南 + 业务规则 (3 类)

### 反模式 v4 (T171 新增候选)
- `ai-provider-fallback-pattern`: 主 provider 失败自动降级到备用
- `prompt-injection-pattern`: 用户输入注入防御
- `context-window-overflow`: 5 轮窗口防 OOM

---

## Phase-42 智能营销 · T172

### 目标
- 用户画像: RFM 模型 + 标签体系
- 自动化营销: 触发规则引擎
- A/B 测试: 流量分配 + 效果追踪
- 优惠券精准发放: 基于画像触发
- ROI 报表: 实时归因

### 5 AC
- [ ] 用户画像 + 标签体系 (RFM 5 维)
- [ ] 营销规则引擎 (触发器 + 条件)
- [ ] A/B 测试 + 效果追踪 (灰度发布)
- [ ] 优惠券精准发放
- [ ] E2E + ROI 报表

### V3 决策锁
- D1 RFM: 自研 (5 维) → SaaS 神策 (V2)
- D2 A/B: 50/50 平分 → 灰度发布 (V2)
- D3 优惠券: 风控规则 (金额 + 频次)
- D4 触达: 实时触发 + 定时任务
- D5 归因: last non-direct click (V1) → multi-touch (V2)

### 反模式 v4 (T172 新增候选)
- `ab-test-bias-pattern`: 灰度偏差 + 用户分层
- `coupon-abuse-pattern`: 风控 + 防刷
- `attribution-window`: 归因窗口 7/14/30 天

---

## Phase-43 数据分析 · T173

### 目标
- OLAP 引擎: 多维分析 (ClickHouse)
- 用户行为漏斗: 5 步漏斗 + 转化率
- 留存分析: Cohort (日/周/月)
- 实时大屏: 自定义看板 + ECharts
- 性能基准: p95 < 3s

### 5 AC
- [ ] OLAP 引擎 + 多维分析 (ClickHouse)
- [ ] 用户行为漏斗 (5 步)
- [ ] 留存分析 (Cohort 日/周/月)
- [ ] 实时大屏 + 自定义看板
- [ ] E2E + 性能基准 (p95 < 3s)

### V3 决策锁
- D1 OLAP: ClickHouse (V1) + Doris (V2 multi-tenant)
- D2 CDC: 准实时 5min (V1) → 实时 (V2)
- D3 Cohort: 日/周/月 三档
- D4 大屏: ECharts 优先 (与报表统一)
- D5 权限: 角色 + 租户 + 自定义 (RBAC + ABAC)

### 反模式 v4 (T173 新增候选)
- `olap-aggregation-pattern`: 预聚合 + 物化视图
- `cohort-join-pattern`: 大表 Join 性能
- `dashboard-cache-pattern`: 看板缓存 5min

---

## Phase-44 开放 API · T174

### 目标
- OpenAPI 3.0: 自动生成 SDK (TS/Java/Python)
- API Key: 管理 + 限流 (滑动窗口)
- Webhook: 事件订阅 + HMAC 签名
- 开发者门户: 文档 + 沙箱
- 沙箱环境: 隔离 Mock 数据

### 5 AC
- [ ] OpenAPI 3.0 规范 + 自动生成 SDK
- [ ] API Key 管理 + 限流 (滑动窗口 100 req/min)
- [ ] Webhook 事件订阅 + HMAC-SHA256
- [ ] 开发者门户 + 文档
- [ ] E2E + 沙箱环境

### V3 决策锁
- D1 鉴权: API Key (V1) + OAuth 2.0 (V2)
- D2 限流: 滑动窗口 (V1) + 令牌桶 (V2)
- D3 Webhook 签名: HMAC-SHA256
- D4 重试: 指数退避 + 最大 5 次
- D5 沙箱: 隔离 Mock 数据 (mock-sandbox 模式)

### 反模式 v4 (T174 新增候选)
- `api-versioning-pattern`: URL 版本 + Header 版本双轨
- `rate-limit-pattern`: 滑动窗口 vs 令牌桶
- `webhook-retry-pattern`: 指数退避 + 死信队列

---

## P2 vs P2.5 路线对比

| 维度 | P2 业务深度 (采纳) | P2.5 技术深度 (备选) |
|------|-------------------|----------------------|
| **核心** | AI/营销/分析/API | 异常/自愈/i18n/API |
| **价值** | 客户能感知的差异化 | 内部可靠性提升 |
| **目标用户** | 客户 + 业务方 | 运维 + SRE |
| **可商业化** | ✅ 直接变现 | ❌ 间接价值 |
| **估时** | 4d | 7d |
| **优先** | ⭐⭐⭐ 当前 | ⭐ P3 前置 |

**结论**: P2 业务深度优先, 技术深度作为 P2.5 后置 (或 P3 子项)

---

## 反模式 v4 增量 (P2 阶段目标: 32 → 36)

| Phase | 反模式 | 防 AP |
|-------|--------|-------|
| T171 | ai-provider-fallback-pattern | 3 |
| T171 | prompt-injection-pattern | 2 |
| T172 | ab-test-bias-pattern | 2 |
| T172 | coupon-abuse-pattern | 2 |
| T173 | olap-aggregation-pattern | 3 |
| T174 | api-versioning-pattern | 3 |
| T174 | rate-limit-pattern | 2 |
| T174 | webhook-retry-pattern | 2 |

**累计 32 → 36 (+4 关键反模式, +4 备选)**

---

## P2 启动清单 (Part 21)

- [ ] 同步 v4.0 master-plan 修正 (技术深度降级为 P2.5)
- [ ] HEARTBEAT Part 21 (P2 启动)
- [ ] T171 任务卡 V2 启动
- [ ] T171-spec v1 已存在, 检查是否需要 V2 强化
- [ ] Phase-41 模块占位 (推荐 api 命名 `apps/api/src/modules/ai-cs/`)

---

> 🦞 **"P2 业务深度 = AI 客服 + 营销 + 分析 + 开放API = SaaS 差异化护城河"**
> 🏆 **"P1 业务深耕 100% → P2 业务智能化 100% 接力 = SaaS v4.0 商业化完整闭环"**