# DR-014 · Offline-First 策略 (Queue + LWW CRDT)

## 状态
已接受 (2026-06-26, Pulse-85-86)

## 背景
移动端网络不稳定,需要离线可浏览 + 排队写入 + 合并冲突。

## 决策
1. **OfflineQueue** — 5 状态 (pending/in-flight/failed/dead-letter/completed)
   - FIFO + 顺序保证
   - 指数退避 1s→2s→4s→...→30s 上限
   - dead-letter 队列手动 review
2. **LWW CRDT** — Last-Write-Wins + 时间戳
   - `recordFieldWrite(field, deviceId, value, timestamp)`
   - 同设备新写入覆盖旧值 (避免历史污染)
   - mergeAll 按 timestamp 降序取最新
3. **SyncEngine** — Delta sync
   - `lastSyncVersion` 持久化,断点续传
   - `hasMore` 分页直到拉完
4. **冲突解决** — LWW + 审计日志 (losers 保留),不自动覆盖

## 后果
- ✅ 离线写 10 条,在线后全部同步,无丢失
- ✅ 多设备同时改同字段,确定性合并 (timestamp 大者胜)
- ✅ dead-letter 隔离失败写入,避免无限重试
- ⚠️ LWW 不适合频繁协同编辑 (V2 升级 Y.js/Automerge)
- ⚠️ 时间戳依赖客户端时钟,NTP 漂移可能造成 merge 不确定

## 替代方案
- OT (Operational Transform): Google Docs 同款,实现复杂
- CRDT (Y.js/Automerge): 强协同,V2 升级路径
- 选择: LWW (V1) → Y.js (V2 复杂协同场景)
