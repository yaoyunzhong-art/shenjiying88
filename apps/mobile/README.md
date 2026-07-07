# 神机营 SaaS 移动端 (Phase-21)

> React Native 0.74 + Offline-First + Push + Multi-Device

## 🚀 启动

```bash
# 1. 安装依赖 (首次)
cd apps/mobile
npm install
# 或 pnpm install

# 2. iOS (仅 macOS)
cd ios && pod install && cd ..
npm run ios

# 3. Android
npm run android

# 4. Metro 单独启动
npm run start
```

## 📁 目录结构

```
apps/mobile/
├── App.tsx              # 根组件
├── index.js             # RN entry
├── app.json             # app metadata
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── src/
    ├── navigation/      # React Navigation
    ├── screens/         # 业务页面
    ├── components/      # 通用组件
    ├── store/           # Zustand stores
    ├── network/         # API + Axios + Push
    ├── db/              # WatermelonDB schema
    ├── sync/            # 离线队列 + 同步引擎
    └── utils/           # 工具函数
```

## 🎯 核心能力

- **T51 项目初始化**: RN 0.74 + TS strict + monorepo support
- **T52 路由**: React Navigation 6 (Stack + Tab + Drawer)
- **T53 状态**: Zustand + persist (AsyncStorage)
- **T54 网络**: Axios + 拦截器 (auth/refresh/logging) + React Query
- **T55-T58 Offline-First**: WatermelonDB + 离线队列 + CRDT + 同步引擎
- **T59-T61 Push & Realtime**: FCM/APNs + 业务事件订阅 + WebSocket 聊天
- **T62-T63 Multi-Device**: 设备清单 + 状态合并

## 🔧 技术栈

| 类别 | 选型 | 理由 |
|---|---|---|
| 框架 | React Native 0.74 | 成熟稳定 |
| 语言 | TypeScript strict | 类型安全 |
| 路由 | React Navigation 6 | 业界标准 |
| 状态 | Zustand | 轻量 (< 1KB) |
| 缓存 | React Query | 离线友好 |
| 本地 DB | WatermelonDB | observable + SQLite |
| 网络 | Axios | 拦截器机制 |
| 推送 | FCM/APNs + Notifee | 双端原生 |
| 实时 | WebSocket | 低延迟 |

## 📋 Owner

- E7 孙体验 (UX)
- E22 郑移动 (Mobile)

## 📊 Phase-21 进度

- Pulse-84 (T51-T54) · RN Foundation
- Pulse-85 (T55-T56) · Offline-First I
- Pulse-86 (T57-T58) · Offline-First II
- Pulse-87 (T59-T61) · Push & Realtime
- Pulse-88 (T62-T63) · Multi-Device
- Pulse-89 (T64) · Retro + Phase-22

详见 `/.trae/specs/phase-21-mobile/tasks.md`