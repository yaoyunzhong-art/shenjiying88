# DR-015 · Multi-Device Sync (DeviceManager + LWW)

## 状态
已接受 (2026-06-26, Pulse-88)

## 背景
用户多设备登录 (iPhone/iPad/Web),需要设备清单 + 远程登出 + 状态合并。

## 决策
1. **DeviceManager** — 设备清单管理
   - `registerCurrentDevice()` UUID 分配 + sessionId 颁发
   - `importDevices()` 服务器返回其他设备清单
   - `listDevices()` 按 lastActiveAt 降序
2. **远程登出** — `remoteLogout(deviceId)` + `onRemoteLogout(handler)`
   - 服务器推送 `invalidate_session` 事件
   - 本地清除 session,lastActiveAt 标记为已登出
   - 拒绝远程登出当前设备 (本地自己登出走 logout)
3. **状态合并** — `recordFieldWrite` + `mergeAll`
   - 每个字段独立 LWW 合并
   - 保留 losers 审计 (合规 + 用户回滚)
4. **WebSocket 联动** — handleRemoteLogout 通过 WS 接收事件

## 后果
- ✅ A 设备登出 B 设备的会话 (远端设备立即失效)
- ✅ 多设备购物车/待办合并,按最新写入胜出
- ✅ 设备清单 UI 可视化 (ProfileScreen)
- ⚠️ 当前 in-memory,V2 持久化到 WatermelonDB
- ⚠️ WebSocket 断线期间 remoteLogout 事件丢失,V2 需 ACK 重试

## 替代方案
- 仅当前设备 (无多设备): 用户体验差
- 强协同 CRDT (Y.js): 移动端购物车过度
- 选择: DeviceManager + 简化 LWW
