# Phase-21 · 移动原生 + 离线 (Spec)

> 启动: Pulse-84 (2026-06-27)
> 闭环: Pulse-89 (2026-07-02)
> Owner: E7 孙体验 + E22 郑移动

## 0. 概述
React Native + 离线优先 (offline-first) + 推送通知 + 设备同步。

## 1. 目标
1. iOS + Android 双端原生体验
2. 离线模式: 无网络可浏览 + 排队写入
3. 推送通知: 业务事件实时触达
4. 设备同步: 多设备登录 + 状态合并

## 2. 范围 (T51-T64, 14 tasks)

### Phase 1 · RN Foundation (Pulse-84, T51-T54)
- T51 RN 项目初始化 (iOS/Android)
- T52 路由 + 导航 (React Navigation 6)
- T53 状态管理 (Zustand + 持久化)
- T54 网络层 (Axios + 拦截器 + 重试)

### Phase 2 · Offline-First (Pulse-85-86, T55-T58)
- T55 本地存储 (AsyncStorage + WatermelonDB)
- T56 离线队列 (写操作排队 + 在线 flush)
- T57 冲突解决 (CRDT 简化版)
- T58 同步引擎 (delta sync + 版本号)

### Phase 3 · Push & Realtime (Pulse-87, T59-T61)
- T59 推送集成 (FCM + APNs)
- T60 业务事件订阅 (订单/营销)
- T61 实时聊天 (WebSocket)

### Phase 4 · Multi-Device (Pulse-88, T62-T63)
- T62 设备清单 + 远程登出
- T63 状态合并 (last-write-wins + 操作日志)

### Phase 5 · Retro + Phase-22 (Pulse-89, T64)
- T64 Phase-21 Retro + Phase-22 启动

## 3. 技术栈
- React Native 0.74
- TypeScript strict
- WatermelonDB (本地 DB)
- Axios + React Query
- React Navigation 6
- Zustand (状态)
- FCM / APNs (推送)

## 4. 验收
- e2e 测试 ≥50 个
- 离线模式可用
- 推送延迟 < 5s
- 多设备状态一致性 ≥99%

## 5. 不在范围
- iPad 适配 (V2)
- Watch 适配 (远期)
- AR 功能 (远期)
