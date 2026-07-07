# Phase-21 · Tasks (T51-T64)

| T# | 任务 | Pulse | 状态 |
|---|---|---|---|
| T51 | RN 项目初始化 | 84 | pending |
| T52 | 路由 + 导航 | 84 | pending |
| T53 | 状态管理 (Zustand) | 84 | pending |
| T54 | 网络层 (Axios) | 84 | pending |
| T55 | 本地存储 (WatermelonDB) | 85 | pending |
| T56 | 离线队列 | 85 | pending |
| T57 | 冲突解决 (CRDT) | 86 | pending |
| T58 | 同步引擎 | 86 | pending |
| T59 | 推送集成 (FCM/APNs) | 87 | pending |
| T60 | 业务事件订阅 | 87 | pending |
| T61 | 实时聊天 (WebSocket) | 87 | pending |
| T62 | 设备清单 + 远程登出 | 88 | pending |
| T63 | 状态合并 | 88 | pending |
| T64 | Phase-21 Retro + Phase-22 | 89 | done |

---

## T51 · RN 项目初始化 (Pulse-84)
- 验收: iOS + Android 双端可运行 hello world
- 风险: CocoaPods / Gradle 配置
- Owner: E22

## T52 · 路由 + 导航 (Pulse-84)
- React Navigation 6 (Stack + Tab + Drawer)
- 验收: 5 页面跳转流程

## T53 · 状态管理 (Pulse-84)
- Zustand + persist middleware
- 验收: 状态跨页面共享 + 持久化

## T54 · 网络层 (Pulse-84)
- Axios + 拦截器 (auth/refresh/logging)
- React Query + 离线 cache
- 验收: 401 自动 refresh + 离线读取 cache

## T55 · 本地存储 (Pulse-85)
- WatermelonDB (SQLite + observable)
- 验收: 3 张表 CRUD + observable query

## T56 · 离线队列 (Pulse-85)
- 写操作 → AsyncStorage queue
- 在线 → 自动 flush + 顺序保证
- 验收: 离线写 10 条,在线后全部同步

## T57 · 冲突解决 (Pulse-86)
- 简化 CRDT: LWW (last-write-wins) + 向量时钟
- 验收: 双客户端同时改,合并无丢失

## T58 · 同步引擎 (Pulse-86)
- delta sync: lastSyncVersion → 当前
- 验收: 1000 条数据,增量同步 < 1s

## T59 · 推送集成 (Pulse-87)
- FCM (Android) + APNs (iOS)
- 验收: 推送 token 注册 + 接收

## T60 · 业务事件订阅 (Pulse-87)
- WebSocket 订阅订单/营销事件
- 验收: 实时收到订单创建通知

## T61 · 实时聊天 (Pulse-87)
- WebSocket + 消息持久化
- 验收: 双客户端消息互通

## T62 · 设备清单 + 远程登出 (Pulse-88)
- 设备列表 (model/OS/lastActive)
- 远程登出指定设备
- 验收: A 设备登出 B 设备的会话

## T63 · 状态合并 (Pulse-88)
- LWW + 操作日志
- 验收: 多设备购物车合并

## T64 · Phase-21 Retro + Phase-22 (Pulse-89)
- lessons-learned/phase-21.md
- 3 decision-records
- Phase-22 spec/tasks
