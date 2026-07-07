# 🔄 演进日志 Evolution Log

> **记录: 技术组专家学习与赋能 (E1陈架构/E2李安全/E3王硬件/E44周CTO)**
> **日期: 2026-07-07 01:33 CST**
> **执行人: 🦞龙虾哥**

---

## 一、学前知识回顾

### 1.1 架构决策(AD)关键要点

| 编号 | 标题 | 核心结论 | 偏离状态 |
|:----:|------|----------|:--------:|
| AD-0001 | M5总母机定位 | 唯一总控，LYT适配 | ✅ 已对齐 |
| AD-0005 | WebSocket+HTTP双通道 | WS>10s断→HTTP轮询5s/次 | 🔴 AD-DEV-02 未实现 |
| AD-0008 | 多租户隔离 | 共享表+tenant_id逻辑隔离 | 🟡 AD-DEV-08 部分实现 |
| AD-0011 | 边缘服务器策略 | NUC/Mac Mini + CRDT | 🔴 AD-DEV-03 未部署 |
| AD-0018 | 盲盒Redis Lua | Lua脚本保证原子性 | 🔴 AD-DEV-06 未实现 |
| AD-0017 | 积分通胀预警 | 实时计算+熔断 | 🟡 AD-DEV-05 未实现 |

### 1.2 反模式关注 (AM)

| 编号 | 标题 | 当前缓解状态 |
|:----:|------|:------------:|
| AM-006 | 知识库空壳 | ⚠️ 本次学习激活E1/E2/E3/E44 |
| AM-007 | 模拟优化不落地 | ⚠️ 45条仅0条实现 |
| AM-008 | C端约束不开发 | ⚠️ 推送分级/频率管控均为0 |
| AM-011 | 专家卡片数据失同步 | ⚠️ 本次同步 |

---

## 二、E1(陈架构)+E2(李安全) 联合讨论: AD-0008 多租户隔离方案的安全性评估

### 讨论结论

**架构角度 (E1 陈架构)**:
1. **共享表+tenant_id 方案当前足够**: 在团队<20人、单实例PG场景下，独立DB或独立Schema运维成本太高。当前方案可接受。
2. **但需确保全覆盖索引**: tenant_id 必须出现在所有表索引中，否则全表扫描会导致性能雪崩。目前尚未审计所有表的索引覆盖情况。
3. **Redis key 注入tenant_id**: 当前盲盒模块(Map存储)和通知模块(Map+Cache)尚未实现tenant_id前缀隔离。⚠️ 需补充。
4. **MQ队列隔离**: 当前RabbitMQ模块未实现租户队列独立。Phase-31 需补充。

**安全角度 (E2 李安全)**:
1. **RLS行级安全缺失**: 当前Prisma连接未配置RLS策略。所有表直接暴露，SQL注入可跨租户。此为 **P0安全漏洞**。
2. **Gateway层tenant_id校验**: 当前traffic-governance.guard未强制校验tenant_id。建议增加中间件层自动注入+校验。
3. **审计日志缺失tenant_id**: 当前request-audit.interceptor已实现，但需确认是否记录了完整的tenant_id/brand_id/store_id三级上下文。
4. **Key风险**: 盲盒模块使用 `userId:planId` 作为Map key，未包含tenant_id。多租户下不同租户的相同userId会冲突。

**联合建议**:
1. **Phase-31 优先级提升至P0**: 多租户隔离是安全基线，非功能性优化。
2. **三层防御必须在Phase-31实现**: Gateway校验→业务层二次校验→RLS兜底。
3. **Redis/MQ 租户隔离同时完成**: 避免出现中间件层数据泄漏。

---

## 三、E3(王硬件)+E44(周CTO) 联合讨论: 边缘服务器部署策略的技术可行性

### 讨论结论

**硬件角度 (E3 王硬件)**:
1. **NUC/Mac Mini方案可行**: 单门店QPS<100，NUC i5足矣。Mac Mini可选（单价较高但生态好）。
2. **离线运营最关键**: ESP32需支持离线排队+本地缓存。current盲盒/通知模块全部依赖内存Map，边缘部署时需改为本地SQLite或嵌入式PG。
3. **OTA升级必须增量**: 当前esp32-firmware未实现，需建立delta升级机制(bsdiff/hdiffpatch)，防止全量升级消耗带宽和停机时间。
4. **时间同步**: 离线模式下ESP32+边缘服务器需NTP同步。CRDT合并依赖时间戳排序。

**CTO角度 (E44 周技术总监)**:
1. **先SaaS后边缘**: 当前M5尚未稳定运行，边缘服务器是额外复杂度。建议先完成Phase-44开放API和Phase-31多租户，再推进Phase-30边缘部署。
2. **模块化单体即可**: 当前<20人团队不需要拆微服务。边缘服务器只是M5的离线子集，在模块内部做好 `OnlineProvider/OfflineProvider` 切换。
3. **边缘与云端的数据冲突策略**: CRDT+LWW需要明确定义冲突解决策略——推荐"最后写入者胜(LWW)"，但需记录冲突日志供人工审核。
4. **成本收益分析**: 单门店NUC约3000元+ESP32约80元，100门店约38万硬件投入。建议先在旗舰店试点3店，验证后再铺开。

**联合建议**:
1. 边缘服务器列为Phase-30（非当前P0）
2. 先在旗舰店试点3店，周期2个月
3. 优先完成多租户隔离和WebSocket双通道后再推进

---

## 四、P0修复任务可行性评估 (基于TASKS_STATUS.md)

### 4.1 盲盒引擎Redis Lua原子操作 (AD-0018)

**技术建议**:
1. 当前blindbox.service.ts使用内存Map存储计划/库存/记录，完全没有持久化和并发安全。
2. **迁移到Redis Lua脚本**: 方案如下:
   - `BLINDBOX:{planId}:stock` → 按tier:prize的库存Hash
   - `BLINDBOX:{planId}:pity:{userId}` → 保底计数器
   - `BLINDBOX:{planId}:records:{userId}` → 抽取历史List/ZSet
   - Lua脚本 `draw.lua`: 参数(planId, userId, tierIds[], pityCount)
     1. 检查plan状态(Hash)
     2. 检查各tier库存
     3. 按概率选奖(GETRAND的替代方案: 预计算权重数组)
     4. 扣库存(逐级)
     5. 更新保底计数器
     6. 记录抽取历史
     7. 返回结果
3. **关键问题**: 内存Map无持久化→重启丢失所有数据。必须优先迁移。
4. **与AD-0008关系**: 盲盒Redis key需增加tenant_id前缀。
5. **难度评估**: 中(2-3天) | **优先级: P0**
6. **风险**: 无Redis读写超时处理，应增加重试+降级(回退DB操作)

### 4.2 C端推送分级 (AM-008相关)

**架构建议**:
1. 当前push.service.ts已实现:
   - APNsService (iOS推送)
   - WebSocketService (WebSocket连接管理)
   - PushNotificationScheduler (定时推送)
2. **缺失的分级功能**:
   - **P0级**: 订单通知/门闸事件(实时)
   - **P1级**: 营销推送(可延迟)
   - **P2级**: 个性化推荐(批量)
3. **建议方案**:
   - 在push服务增加 `PushPriority` 队列
   - P0直连APNs/WebSocket
   - P1走EventBus异步(已支持)
   - P2走定时调度(已有PushNotificationScheduler)
4. **频率管控缺失**: 缺少每个用户每天的推送次数限制。建议实现:
   - Redis INCR + EXPIRE 限制 channel/user/day 级别的推送量
   - 营销推送(P1)不超过3条/天/用户
   - 实时推送(P0)不超过20条/天/用户
5. **通知模块问题**: notification.service.ts的 `simulateSend` 只是mock实现，未对接真实邮件/短信/推送provider。生产环境需替换。
6. **难度评估**: 中(3-5天) | **优先级: P0**
7. **WebSocket双通道(AD-0005)**: 当前push模块的WebSocketService有reconnect机制，但缺少HTTP轮询降级。需增加fallback polling模块。

---

## 五、事中开发监督: 安全漏洞与架构问题记录

### 5.1 盲盒模块安全漏洞

| ID | 严重度 | 描述 | 位置 |
|:--:|:------:|------|:----:|
| SEC-01 | 🔴P0 | 内存Map无持久化→重启丢失所有盲盒计划和库存 | blindbox.service.ts L31-33 |
| SEC-02 | 🔴P0 | 无tenant_id隔离→多租户数据泄漏 | blindbox.service.ts 全Map无前缀 |
| SEC-03 | 🟡P1 | 无概率审计日志→无法追溯概率执行 | blindbox.service.ts executeDraw |
| SEC-04 | 🟡P1 | `executeDraw` 递归重试(库存为0时) → 可能栈溢出 | blindbox.service.ts L102 |
| SEC-05 | 🟢P2 | 未校验userId合法性 | blindbox.controller.ts draw接口 |

### 5.2 通知模块架构问题

| ID | 严重度 | 描述 | 位置 |
|:--:|:------:|------|:----:|
| ARC-01 | 🔴P0 | `simulateSend` 是mock→生产无真实推送 | notification.service.ts L237 |
| ARC-02 | 🟡P1 | template/dispatch全内存Map→重启丢失 | notification.service.ts L21-22 |
| ARC-03 | 🟡P1 | 推送分级未实现→P0/P1/P2无区分 | notification.service.ts |
| ARC-04 | 🟢P2 | 频率管控未实现 | notification.service.ts |
| ARC-05 | 🟡P1 | EventBus订阅未做背压处理→消息堆积可能OOM | notification.service.ts onModuleInit |
| ARC-06 | 🟢P2 | `recipient.includes('fail')` 的模拟失败逻辑应在生产移除 | notification.service.ts simulateSend |

### 5.3 Push模块架构问题

| ID | 严重度 | 描述 | 位置 |
|:--:|:------:|------|:----:|
| ARC-07 | 🟡P1 | WebSocket无HTTP轮询降级→AD-0005偏离 | push.service.ts WebSocketService |
| ARC-08 | 🟡P1 | APNsService无重试机制→推送丢失 | push.service.ts pushToiOS |
| ARC-09 | 🟢P2 | PushNotificationScheduler在内存setTimeout→服务重启丢失所有定时任务 | push.service.ts schedulePush |

---

## 六、事后审计: blindbox/notification/push 模块改进建议

### 6.1 Blindbox 模块改进建议

1. **立即迁移到Redis (P0)**:
   - 库存+计划存储到Redis Hash
   - 抽取逻辑使用Lua脚本保证原子性 (AD-0018)
   - 增加tenant_id前缀(如 `t:{tid}:blindbox:{planId}:stock`)
   - 增加超时处理和降级(Redis不可用时回退DB)

2. **概率审计 (P1)**:
   - 每执行一次draw，写入审计日志(用户ID/时间/概率/结果/种子)
   - 审计日志用于后续合规检查

3. **递归保护 (P1)**:
   - `executeDraw` 库存为0时的递归调用改成循环(最多重试5次)
   - 避免因大量奖品库存为0时无限递归

4. **并发安全 (P0)**:
   - 当前所有Map操作非线程安全(没有锁，没有Redis)
   - 高并发drawBatch10在for循环中逐个执行，事务不完整

5. **保底逻辑修复 (P1)**:
   - `selectTier` 中 `isPityTriggered && lastHighTierWin > 0` 逻辑有误:
     当 `lastHighTierWin=0` (从未中过高档)时，即使触发保底也不给高档，这是bug。
   - 应改为 `isPityTriggered` 即强制高等级

### 6.2 Notification 模块改进建议

1. **持久化 (P0)**:
   - 当前template/dispatch使用内存Map+cache写入(可选的Optional)
   - 生产必须使用数据库持久化(Prisma表: notification_templates + notification_dispatches)

2. **真实Provider接入 (P0)**:
   - 移除 `simulateSend` mock，接入真实邮件/SMS/Push provider
   - 邮件: AWS SES / SendGrid / 阿里邮件推送
   - 短信: Twilio / 阿里云短信
   - 推送: APNs / FCM / 极光

3. **推送分级 (P1)**:
   - 增加PushChannel策略:
     P0 → direct(同步)
     P1 → async(EventBus)
     P2 → batch(定时批处理)

4. **重试策略 (P1)**:
   - 当前 `retryDispatch` 只尝试一次，无退避
   - 建议: 指数退避(1s→2s→4s→8s→max 5次)

5. **审计日志 (P1)**:
   - 所有dispatch操作记录到audit模块
   - 满足ER-0019(卫审计)要求

### 6.3 Push 模块改进建议

1. **HTTP轮询降级 (P0, AD-0005)**:
   - WebSocket断开>10s→切HTTP轮询(5s/次)
   - push模块增加HttpPollingService
   - WebSocket恢复后自动切回

2. **APNs重试 (P1)**:
   - 发送失败后指数退避重试
   - 记录失败原因到PushRecord

3. **定时任务持久化 (P1)**:
   - PushNotificationScheduler的setTimeout改为数据库存储+后台Worker
   - 服务重启后能从DB恢复未执行的任务

4. **推送优先级队列 (P1)**:
   - 高优先级(实时通知)使用直接推送
   - 低优先级(营销推送)使用Queue + 频率管控

---

## 七、修改记录

| 日期 | 修改人 | 内容 |
|:----:|:------:|------|
| 2026-07-07 01:33 | 🦞龙虾哥 | 技术组专家学习与赋能全流程输出: 知识回顾、架构+安全讨论、硬件+CTO讨论、P0任务评估、代码审计 |
