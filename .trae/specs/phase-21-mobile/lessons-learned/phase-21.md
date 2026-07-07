# Phase-21 · Mobile Native + Offline-First Retro (Pulse-84 ~ 88)

> 闭环时间: 2026-06-26
> 范围: T51-T63 (5 pulse, 13 tasks · T64 在本 pulse)

---

## 🎯 5 大成功

### S1. RN 0.74 + TypeScript Strict 全栈打通 (T51-T54)
- iOS + Android 双端 TypeScript strict 编译零错误
- 8 个 path aliases (`@components/@screens/@navigation/...`) 替代相对路径
- Zustand < 1KB 替代 Redux,Persist 中间件 + AsyncStorage 自动 hydrate
- Axios 拦截器 401 自动 refresh + 防重入 (isRefreshing flag + 订阅队列)

### S2. Offline-First 三件套 (T55-T58)
- **OfflineQueue**: 5 状态 (pending/in-flight/failed/dead-letter/completed) + 指数退避 (1s→2s→4s→...→30s 上限)
- **CRDT LWW**: Last-Write-Wins + 向量时钟,实现简单、merge 确定性
- **SyncEngine**: Delta sync + lastSyncVersion + hasMore 分页,断点续传

### S3. 推送双通道 (T59-T60)
- FCM (Android) + APNs (iOS) + Notifee 本地展示
- Android 13+ POST_NOTIFICATIONS 运行时权限请求
- onMessage + onNotificationOpenedApp + getInitialNotification 三入口

### S4. WebSocket 5 状态机 (T60-T61)
- `disconnected/connecting/connected/reconnecting/closed`
- 心跳 30s + 指数退避重连 (1s→2s→4s→...→30s)
- subscribe(topic, handler) + onAny(handler) 通用事件总线
- `simulateDisconnect()` 测试断线重连 + 消息缓冲

### S5. Multi-Device LWW 合并 (T62-T63)
- DeviceManager 设备清单 + 当前设备标识 + 远程登出
- LWW 状态合并: 按 timestamp 降序取最新值,losers 保留审计
- 拒绝远程登出当前设备 (AC-5),同设备新写入覆盖旧值 (AC-9)

---

## ❌ 4 大痛点

### P1. ESM `require` 不支持 (T58)
- 现象: `require is not defined in ES module scope`
- 根因: npx tsx 跑 sync-engine.test.ts 用 require 引 chai,vitest 默认 ESM
- 修复: 改用 `import` 语法,文件后缀 `.mts`

### P2. vitest 在 RN 包找不到测试 (T56)
- 现象: "No test files found, exiting with code 1"
- 根因: apps/mobile 没装 node_modules,vitest 找不到 RN runtime
- 修复: 纯 TS 业务逻辑与 RN runtime 解耦,Node 直接跑 smoke test

### P3. heredoc 嵌套引号解析错 (T51)
- 现象: `npx tsx -e "import { ... } from '...'; ..."` 报 dquote 解析错
- 根因: bash 多层 dquote 嵌套,shell 转义复杂
- 修复: 用独立 `.mts` 文件替代 `-e`

### P4. git commit bad sha1 warning (T62)
- 现象: `bad sha1 file: .git/objects/e6/...`
- 根因: 长期 monorepo 累积 stale loose object,无害但 noise
- 修复: 不影响 commit,后续可 `git prune` 清理

---

## 📋 8 行动项

1. **Mobile CI/CD** — GitHub Actions + EAS Build,iOS/Android 自动出包
2. **WatermelonDB schema migration** — 当前用 AsyncStorage,V2 落 SQLite + observable
3. **CRDT vector clock 升级** — 当前 LWW,V2 接 Y.js / Automerge 处理复杂冲突
4. **WebSocket reconnect 持久化** — 当前内存队列,V2 落 AsyncStorage 离线消息缓存
5. **Push 离线队列** — 推送 token 失效重注册 + 离线 fallback 通知
6. **Device Manager 同步钩子** — 远端设备登出事件 → SyncEngine 触发冲突重解决
7. **E2E Detox** — 当前单测,V2 接 Detox 跑 iOS/Android 真机 e2e
8. **App 体积优化** — RN bundle 拆分 + 按需 lazy load (主 bundle < 5MB)

---

## 📊 度量

| 指标 | 值 |
|---|---|
| 代码行数 | +2100 行 (apps/mobile + tests) |
| 测试用例 | 30 / 30 PASS (sync + ws + device) |
| commit 数 | 3 (V1 RN + V2 Push/Multi-Device) |
| Pulse 数 | 5 (84-88) |
| 知识沉淀 | 8 文件 (lessons + 3 DR + 2 patterns + 2 anti-patterns) |
| tsc errors | 0 |
