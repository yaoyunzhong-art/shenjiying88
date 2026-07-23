# PRD 摘要卡: WP-OPT-P0 P0 优化嵌入校验

> 版本: v1 · 2026-07-23
> 来源: 规划6-8 §6 WP-OPT-P0, BS-0263~BS-0272
> 基线: docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md

---

## 1. 概述

Sprint-2 阶段对三个已完工主包（WP-10A 积分盲盒、WP-12A 排队终端、WP-17A 异业联盟）以及 WP-13A 推送通知、api-gateway 模块，逐项检查 BS-0263~BS-0272 共 10 条 P0 优化项是否已被自然吸收。

## 2. 优化项总表

| BS | 优化项 | 关联模块 | 关联主包 | 自然吸收 | 补缺 |
|:--:|:-------|:---------|:--------:|:--------:|:----:|
| BS-0263 | WebSocket HTTP轮询降级 | queue/realtime | WP-12A | ❌ | ✅ 已补 |
| BS-0264 | 先更新DB再删缓存 | points | WP-10A | ❌ | ✅ 已补 |
| BS-0265 | 短信双通道自动切换 | notification | WP-13A(已完) | ❌ | ✅ 已补 |
| BS-0266 | SVIP到期P1推送 | push | WP-13A(已完) | ⚠️ 部分 | ✅ 已补 |
| BS-0267 | Redis Lua原子操作 | blindbox | WP-10A | ❌ | ✅ 已补 |
| BS-0268 | 积分通胀实时预警 | points | WP-10A | ✅ | — |
| BS-0269 | 分账报表加退货列 | alliance | WP-17A | ❌ | ✅ 已补 |
| BS-0270 | 跨商户关联分析 | alliance | WP-17A | ✅ | — |
| BS-0271 | API网关注入IP | gateway | — | ✅ | — |
| BS-0272 | 积分配置合理性校验 | points | WP-10A | ✅ | — |

## 3. 自然吸收项目（6 项）

### BS-0268 积分通胀实时预警 ✅
- **状态**: 已有实现 `InflationMonitor.alertIfHigh()` → points-risk.service.ts
- **实现方式**: `points.service.ts` 中 `transaction()` 方法内置通胀预检，在增量发放时检查通胀指数
- **测试**: points-risk.test.ts 含完整覆盖

### BS-0270 跨商户关联分析 ✅
- **状态**: 已有实现 `AnomalyDetectionService` + `UnlinkedOrderDetector`
- **实现方式**: alliance-settlement.service.ts 内含 anomaly detection 流程（频繁小额/异常时间/地点漂移）及跨商户未关联订单自动关联
- **测试**: alliance-settlement.test.ts 覆盖

### BS-0271 API网关注入IP ✅
- **状态**: 已有实现 `APIGateway.extractClientIp()` → gateway.service.ts
- **实现方式**: `authenticate()` 方法中读取 `X-Forwarded-For` / `X-Real-IP` 头注入到请求对象
- **测试**: gateway.service.spec.ts (extractClientIp 测试)

### BS-0272 积分配置合理性校验 ✅
- **状态**: 已有实现 `PointsConfigValidator` → points-atomic.service.ts
- **实现方式**: validateIssuanceRule / validateRedemptionRule / validateInflationParams 三项校验
- **测试**: points-atomic.test.ts 含完整覆盖

## 4. 补缺项目（6 项）

### BS-0263 WebSocket HTTP轮询降级
- **创建**: `apps/api/src/modules/realtime/realtime-polling-fallback.service.ts`
- **实现**: PollingFallbackService 提供 HTTP轮询降级适配器，当 WebSocket 不可用时可降级到短轮询/长轮询

### BS-0264 先更新DB再删缓存
- **修改**: `apps/api/src/modules/points/points-atomic.service.ts`
- **实现**: 在 incrementPointsAtomic/transferPointsAtomic 中写入数据后清除对应缓存项（先DB后Cache模式）

### BS-0265 短信双通道自动切换
- **修改**: `apps/api/src/modules/notification/notification.service.ts`
- **实现**: 引入 DualChannelRouter，发送 Sms/Email 时自动主备切换

### BS-0266 SVIP到期P1推送
- **修改**: `apps/api/src/modules/svip/svip.service.ts`
- **实现**: checkAndExpire() 加入 PushNotificationScheduler 到期通知

### BS-0267 Redis Lua原子操作
- **创建**: `apps/api/src/modules/blindbox/blindbox-lua.service.ts`
- **实现**: Redis Lua 脚本封装，模拟盲盒库存扣减的原子操作模式

### BS-0269 分账报表加退货列
- **修改**: `apps/api/src/modules/alliance/alliance-settlement.service.ts`
- **实现**: Settlement 增加 refundAmount / returnCount 字段及趋势统计

## 5. 验收条件

- 10 条 P0 优化项逐项有检查结论 ✅
- 已自然吸收的项目标记为 ✅
- 补缺代码 TSC + 测试全绿
- 工作区干净后 commit

## 6. 引用信息

```
6-8_refs: [BS-0263, BS-0264, BS-0265, BS-0266, BS-0267, BS-0268, BS-0269, BS-0270, BS-0271, BS-0272]
blocker_id: none
```
