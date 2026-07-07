# 专家 E2 · 李安全

## 元信息
- **编号**: E2
- **姓名**: 李安全
- **领域**: 信息安全
- **初始级别**: Observer
- **入职日期**: 2026-06-25
- **联系方式**: 待补充

## 关注的产品域
- security

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
- 主绑: Phase-31 多租户隔离
- 副绑: Phase-35/36 收银/会员安全

## 关注的关键问题
- (由 李安全 自行补充 3-5 个最关心的产品/业务问题)

---

> 本档案基于 V5.1 编制自动生成,生成日期: 2026-06-25
> 由 `scripts/gen-experts.py` 脚本生成
## 专业洞察 (E2 · 李安全)
**领域**: 安全合规

### 关键洞察
1. **积分/券防刷多维检测**: 仅基于核销量的防刷规则会被正常促销误判。必须加入核销时间分布+设备指纹+用户注册时间+跨商户关联分析四维检测。
2. **API网关注入IP**: 后端所有服务必须自动记录客户端IP。缺失IP的操作记录标记为"可疑"。
3. **敏感数据AES-256**: 会员手机号/身份证/银行账户必须字段级AES-256加密。加密密钥必须定期轮换。

### 关注问题
- LYT Webhook签名验证机制
- 多租户数据泄漏的自动化检测
- 盲盒概率实时审计

### 开发赋能建议
- 所有涉及用户数据的API必须审计日志
- 配置项增加合理性校验（偏差>50%告警）
- SQL注入防护是P0

---

## R21监督组赋能学习记录 (2026-07-07)

### 学习来源
- [patterns-anti-patterns.md](../docs/knowledge/patterns-anti-patterns.md) — 13条AM + 10条PP
- [evolution-log.md](../docs/knowledge/evolution-log.md) — 自进化记录
- [r19-compliance-report-mechanism.md](../docs/operations/r19-compliance-report-mechanism.md) — Compliance报告机制
- [r17-pre-access-checklist.md](../docs/operations/r17-pre-access-checklist.md) — 47项前置准入

### 网络文献研究
- OWASP Top 10 (2026趋势): SQL注入仍为P0, XSS/CSRF/CORS配置检查为P1, SSRF关注度上升
- API安全最佳实践: 统一JWT认证、AES-256敏感字段加密、速率限制(逐用户+逐IP)、请求验签(HMAC-SHA256)

### 讨论产出
**与E6刘合规讨论: C端推送个人信息保护**
- 推送模块安全风险:
  1. PushService发送前无deviceToken绑定关系校验(可通过任意deviceToken推送)
  2. 推送内容(body/alert)无XSS过滤
  3. pushToiOS方法返回true模拟成功(无真实APNs鉴权)
- 建议: 推送前增加deviceToken持有者校验、增加推送内容安全扫描

**与E36卫审计讨论: 盲盒引擎合规安全**
- 盲盒模块安全风险:
  1. 概率引擎使用内存Math.random() — 无法保证公平性,可被调试修改
  2. drawSingle/drawBatch10无AuthGuard验证(控制器直接调用)
  3. 无速率限制 — 可被批量刷API(cost++攻击)
- 建议: 概率计算改用 Redis Lua 服务端执行、增加 AuthGuard + RateLimiter

### 代码审查发现 (安全专项)
1. ❌ `blindbox.controller.ts` 所有API端点无AuthGuard装饰器 — 任何人都可调用
2. ❌ `blindbox.service.ts` drawSingle无额度检查 — 可无限抽取
3. ❌ `push.service.ts` APNsService的pushToiOS方法始终返回true — 无真实APNs鉴权/超时处理
4. ❌ `push.service.ts` PushNotificationScheduler的setTimeout无清理 — OOM风险
5. ❌ `audit/audit.service.ts` detectAnomalies()中使用内存Map分析 — 大规模时OOM

### R17前置准入审核
- 47项完整审核通过
- 重点关注: CHK-17 TLS+AES-256(现有AuditService无加密), CHK-19(暴力破解防护无审计日志联动)
- 建议补充: CHK-50 审计日志哈希链完整性检查

### 安全关注问题新增
1. 盲盒API端点缺少AuthGuard认证
2. 推送无deviceToken绑定校验
3. 概率引擎非Web安全(内存可篡改)
4. 无API速率限制

## 学习笔记 (2026-07-07 技术组专家赋能)

### 多租户隔离安全评估 (AD-0008, 与E1陈架构联合讨论)

**发现的关键安全风险**:
1. **🔴 RLS行级安全缺失**: 当前Prisma连接未配置RLS策略，SQL注入可跨租户越权(this is P0)
2. **🔴 Gateway层tenant_id校验缺失**: traffic-governance.guard未强制校验 → 恶意请求可传入任意tenant_id
3. **🔴 盲盒模块内存Map无tenant_id**: userId:planId作为key → 不同租户相同userId冲突
4. **🟡 审计日志完整性检查**: request-audit.interceptor需确认是否完整记录tenant_id/brand_id/store_id三级上下文
5. **🟡 Redis key无tenant前缀**: 需增加 `t:{tenantId}:` 前缀

**三层纵深防御建议**:
| 层 | 实现 | 当前状态 |
|----|------|----------|
| L3 业务层 | Service入口强制校验tenant_id | ❌ 未实现 |
| L2 数据层 | RLS+表级tenant_id | ❌ 未实现(Prisma无RLS) |
| L1 网络层 | API Gateway校验+OAuth scopes | 🟡 部分实现 |

**联合结论**: Phase-31优先级提升至P0(安全基线，非功能优化)

### 代码审计发现的架构问题

**通知模块(notification.service.ts)**:
1. `simulateSend`是mock → 生产无真实推送(P0)
2. 内存Map持久化缺失→重启丢失(P1)
3. EventBus订阅无背压处理→消息堆积OOM(P1)

**推送模块(push.service.ts)**:
1. APNsService无重试机制→推送丢失(P1)
2. PushNotificationScheduler使用setTimeout→重启丢失定时任务(P1)
3. WebSocket无HTTP轮询降级(P1)

**盲盒模块(blindbox.service.ts)**:
1. 全内存Map无持久化→重启丢失所有库存(P0)
2. 无概率审计日志→无法追溯概率执行(P1)
3. `executeDraw`递归无保护→可能栈溢出(P1)

### 安全研究要点 (2026趋势)
**SaaS多租户数据隔离安全**:
1. Row-Level Security (RLS) + tenant_id是单实例SaaS标配
2. 密钥管理: 每个租户独立加密密钥(AES-256 per tenant key)
3. 审计: 所有跨租户操作强制审计日志+告警
4. 趋势: Zero-Trust Architecture for SaaS (Google BeyondCorp模型)

**API网关注入与安全审计**:
1. 必须使用X-Forwarded-For + X-Real-IP双重校验客户端IP
2. 缺失IP的操作标记为"可疑"(E2原有洞察)
3. API限流: 租户级+应用级双维度
4. 签名鉴权: HMAC-SHA256防重放攻击

