# 专家 E36 · 卫审计

## 元信息
- **编号**: E36
- **姓名**: 卫审计
- **领域**: 第三方审计
- **初始级别**: Observer
- **入职日期**: 2026-06-25
- **联系方式**: 待补充

## 关注的产品域
- finance

## 当前活跃度
- 最近 30 天提交反馈: 0 条
- 投票次数: 0
- 采纳率: 0%

## 反馈日志 (按日期倒序)
| 日期 | 类型 | 内容摘要 | 采纳状态 |
|---|---|---|---|
| (暂无) | | | |

## 投票记录
| RFC 编号 | 投票 | 级别 | 理由 | 日期 |
|---|---|---|---|---|
| (暂无) | | | | |

## 升级事件
- (无)

## 关联 Phase
- 主绑: Phase-20 合规审计
- 副绑: Phase-38 财务审计

## 关注的关键问题
- (由 卫审计 自行补充 3-5 个最关心的产品/业务问题)

---

> 本档案基于 V5.1 编制自动生成,生成日期: 2026-06-25
> 由 `scripts/gen-experts.py` 脚本生成
# E36 卫审计 · 审计合规专家洞察

> 创建: 2026-07-07 · 持续开发第3批
> 专家: E36 卫审计 (第三方审计 · Observer)
> 领域: 审计合规 · 操作追溯 · 分账对账

---

## 1. 🎯 关注领域

- 分账状态完整日志
- API 调用审计 (IP追溯)
- 操作可追溯性 (谁/何时/做了什么)
- 审计 Dashboard
- 10年归档合规

---

## 2. 💡 核心洞察

### 洞察 1: 分账状态日志 = 审计生命线

**观点**: 没有完整分账状态日志的SaaS平台，审计时等于「裸奔」。

**必须记录的分账状态链**:
```
订单创建 → 支付完成 → 分账预计算 → 分账执行 → 分账确认
                                        ↕
                                  分账失败 → 重试 → 人工介入
```

**每条日志必须包含**:
- `trace_id`: 全局唯一追踪ID（贯穿订单→分账全链路）
- `actor`: 操作主体（系统/收银员/管理员/API）
- `action`: 操作类型（分账/调账/退回/冲正）
- `before_state`, `after_state`: 变更前后完整状态JSON
- `timestamp`: 精确到毫秒
- `checksum`: 前一条日志哈希（哈希链防篡改）

**实践**:
- 分账日志独立库存储（不混入业务表）
- 写入即不可变（append-only，无UPDATE）
- 写入延迟 < 5ms（异步队列+批量写入）

---

### 洞察 2: API 网关注入 IP 审计

**观点**: 所有API调用必须具备调用端IP记录，这是审计追溯的基础设施。

**审计字段注入**:
```
请求头 X-Real-IP:        客户端真实IP（网关注入，禁止客户端覆盖）
请求头 X-Forwarded-For:  链路IP列表
请求头 X-Call-Trace-Id:  调用链追踪ID
日志字段: service_id | api_path | user_id | ip | timestamp | latency
```

**审计规则**:
- 所有管理API（P0）→ 强制日志
- 业务API（P1）→ 按采样率记录（默认10%）
- 敏感API（财务/会员/权限）→ 100%记录
- 异常API（4xx/5xx）→ 100%记录+告警

**实践**:
- API Gateway层注入审计字段（Nginx + Lua）
- 日志聚合到ClickHouse（支持10年×亿级查询）
- 审计Dashboard提供IP、用户、API的三维交叉查询

---

### 洞察 3: 审计Dashboard = 监管的眼睛

**观点**: 审计Dashboard不是给开发者看的，是给「非技术监管者」看的。必须一目了然。

**Dashboard核心视图**:

**视图1: 操作追溯**
- 搜索框: 订单号/用户ID/IP/时间段
- 结果: 时间线形式展示操作链（谁→何时→做了什么→结果）
- 点击展开: 请求体/响应体/前后状态JSON

**视图2: 异常告警**
- 🔴 异常操作: 高频失败/非工作时间操作/越权访问
- 🟡 风险操作: 批量调账/数据导出/权限变更
- 🔵 审计盲区: 日志丢失/trace_id断裂/timeout记录

**视图3: 合规报表**
- 自动生成月度审计报告（PDF + 哈希签名）
- 合规评分（操作追溯率/IP追溯率/日志完整性）
- 10年归档状态（最近归档日/下个归档日/故障恢复验证）

---

### 洞察 4: 10年归档策略

**观点**: 合规归档不是「丢到一个S3桶里」，而是可恢复可验证。

**归档架构**:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ ClickHouse   │────▶│ 年度快照    │────▶│ 冷存储归档   │
│ (热数据180天) │     │ (JSONL+HASH) │     │ (S3 Glacier) │
└─────────────┘     └─────────────┘     └─────────────┘
```
- 热数据: ClickHouse, 180天在线查询
- 温数据: 年度快照, 压缩JSONL + SHA256哈希链
- 冷数据: S3 Glacier Deep Archive, 10年保存
- 故障恢复: 每年一次全量恢复演练（恢复目标 < 4小时）
- 哈希验证: 归档时生成根哈希，恢复时逐条验证完整性

---

## 3. 📋 审计合规 KPI

| KPI | 目标 | 优先级 |
|-----|------|--------|
| 操作追溯覆盖率 | 100% (P0) / 90% (P1) | P0 |
| IP追溯率 | ≥99.9% | P0 |
| 日志写入延迟(P95) | < 50ms | P1 |
| 10年数据恢复时间 | < 4h | P2 |
| 审计Dashboard Uptime | 99.9% | P0 |

---

---

## 5. 📖 学习记录 (2026-07-07 · 监督组赋能)

### 学习来源
- [patterns-anti-patterns.md](../docs/knowledge/patterns-anti-patterns.md) — 13条AM + 10条PP
- [evolution-log.md](../docs/knowledge/evolution-log.md) — 自进化记录
- [r19-compliance-report-mechanism.md](../docs/operations/r19-compliance-report-mechanism.md) — Compliance报告机制
- [r17-pre-access-checklist.md](../docs/operations/r17-pre-access-checklist.md) — 47项前置准入

### 网络文献研究
- SaaS审计日志最佳实践: 审计日志必须包含trace_id、actor、action、before/after_state、timestamp、checksum哈希链
- API审计技术方案: API网关注入X-Real-IP/X-Forwarded-For/X-Call-Trace-Id → ClickHouse聚合

### 讨论产出
**与E38沈监管讨论: 盲盒引擎合规清单**
- 盲盒概率引擎缺失: 无概率公示API、无购买限额、无实名校验、无冷静期退款、无月度上限
- 审计日志缺失: 概率变更无审计记录、哈希链禁止防篡改未实现
- 建议: 盲盒引擎所有配置操作必须记录审计日志, 日志使用哈希链防篡改

### 代码审查发现
1. ✅ AuditService 已实现完善的审计字段 (traceId/actorType/ipAddress/riskLevel)
2. ❌ 审计日志内存Map存储 → 生产需切 DB (违反审计10年保存要求)
3. ❌ 缺少审计日志哈希链防篡改机制
4. ❌ 盲盒概率变更无任何审计日志
5. ❌ 无分账日志的checksum哈希链（E36自己提出的洞察未落地）

### 参与R17审核
- 前置准入47项完整审核通过
- 建议补充: CHK-48 盲盒概率Lua原子操作检查、CHK-50 审计日志哈希链完善度检查

### 关注问题新增
1. 审计日志哈希链: 现有只记录日志, 无防篡改验证(写入后可修改)
2. 盲盒引擎: 所有概率变更必须走审计流程, 记录actorId+前后概率+timestamp
3. 推送审计: C端推送频率/内容变更必须记录审计日志

---

## 4. 🔗 关联

- [E2 李安全](../experts/E2-li-security.md) · 安全审计协同
- [E10 郑财务](../experts/E10-zheng-finance.md) · 财务分账协同
- [E38 沈监管](../experts/E38-shen-regulator.md) · 盲盒合规协同
- [.trae/specs/phase-20-compliance/](../../.trae/specs/phase-20-compliance/) · Phase-20 合规审计
- [patterns/audit-log-hash-chain.md](../../.trae/specs/phase-20-compliance/patterns/audit-log-hash-chain.md) · 审计日志哈希链
- [docs/compliance/blindbox-engine-p0-audit-checklist.md](../docs/compliance/blindbox-engine-p0-audit-checklist.md) · 盲盒引擎P0审计清单
