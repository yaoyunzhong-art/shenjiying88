# 专家 E1 · 陈架构

## 元信息
- **编号**: E1
- **姓名**: 陈架构
- **领域**: 系统架构
- **初始级别**: Observer
- **当前级别**: ⭐⭐⭐ Approver (权重 1.0/票) — R7 用户直批 2026-06-26
- **入职日期**: 2026-06-25
- **联系方式**: 待补充

## 关注的产品域
- backend

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
- 主绑: Phase-15/16 多租户
- 副绑: Phase-32/33 重连持久化

## 关注的关键问题
- (由 陈架构 自行补充 3-5 个最关心的产品/业务问题)

---

> 本档案基于 V5.1 编制自动生成,生成日期: 2026-06-25
> 由 `scripts/gen-experts.py` 脚本生成
## 专业洞察 (E1 · 陈架构)
**领域**: 系统架构

### 关键洞察
1. **WebSocket+HTTP轮询双通道**: 弱网环境下纯WebSocket不可靠，>10秒断开→自动切HTTP轮询(5秒1次)，恢复后切回。这是经过V5.1 SIM-01验证的可靠方案。
2. **库存一致性**: 跨店积分查询优先读Redis→未命中查主库，但并发写Redis会导致脏数据。先更新DB再删除缓存(Cache-aside)是最稳定的缓存一致性方案。
3. **边缘+云端混合架构**: 每门店NUC/Mac Mini边缘服务器处理离线运营，LWW CRDT恢复后合并。适合网络不可靠的室内游乐场场景。

### 关注问题
- 多租户数据隔离与性能平衡
- M5与LYT API版本兼容性
- 灾备三层的可行性验证

### 开发赋能建议
- 所有新模块必须先定义 `ILYTAdapter` 接口再开发
- WebSocket必须设计降级通道
- 数据层必须预留冷热分离

## 学习笔记 (2026-07-07 技术组专家赋能)

### 架构知识回顾

**AD-0008 多租户隔离方案安全性评估 (与E2李安全联合)**
1. 共享表+tenant_id方案当前足够（团队<20人），但必须确保全覆盖索引
2. Redis key 必须注入tenant_id前缀（如 `t:{tid}:blindbox:{planId}`）
3. MQ队列需租户隔离（防一租户消息影响其他）
4. Gateway层缺tenant_id校验→需增加中间件自动注入
5. 盲盒模块使用 `userId:planId` 为key，缺tenant_id→多租户下冲突

**WebSocket+HTTP轮询双通道 (AD-0005) 现状评估**
1. Push模块已实现WebSocketService有reconnect机制
2. **HTTP轮询降级未实现**→AD-DEV-02偏离高
3. 需实现HttpPollingService: WS断开>10s切5s/次轮询，恢复后切回

**边缘服务器策略 (AD-0011) 与E44讨论**
1. 当前盲盒/通知模块全内存Map→边缘部署需改为SQLite/嵌入式PG
2. 建议先SaaS后边缘（Phase-30），旗舰店试点3店
3. 模块内做好 OnlineProvider/OfflineProvider 切换模式

### 网络研究要点

**多租户SaaS架构 最佳实践 (2026趋势)**
1. 共享表+tenant_id+RLS是SaaS主流方案（独立DB/Citus分片为大规模方案）
2. 推荐Google Spanner/SaaS Tenant Isolation White Paper模式
3. 关键: tenant_id全覆盖索引+PgBouncer连接池隔离
4. 趋势: Database per Tenant仅用于高合规场景(金融/医疗)

**WebSocket降级HTTP轮询方案**
1. 主流: WS主通道+SSE降级+HTTP polling兜底三通道
2. 业界参考: SignalR(MS)、Socket.IO降级模式
3. 推荐实现: ws-reconnect + exponential backoff + http-poll(as fallback)
4. HTTP轮询间隔不宜太短(5s合理)，避免雪崩

### P0任务技术评估 (2026-07-07)

**盲盒引擎Redis Lua原子操作 (AD-0018)**
- 当前Service内存Map无持久化→P0风险
- 迁移方案: BlndboxLuaScript + Redis Hash存储库存，Lua保证原子性
- 需增加tenant_id前缀
- 递归重试保护: 库存为0最多重试5次

**C端推送分级 (AM-008)**
- 需增加P0直连/P1异步/P2批量三级
- 频率管控: Redis INCR+EXPIRE限制channle/user/day级别
- WebSocket双通道为前置依赖

