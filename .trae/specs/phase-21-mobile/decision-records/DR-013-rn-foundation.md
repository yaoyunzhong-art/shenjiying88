# DR-013 · React Native + Zustand Foundation

## 状态
已接受 (2026-06-26, Pulse-84)

## 背景
移动端需要轻量状态管理 + 持久化 + 双端原生体验。

## 决策
1. **React Native 0.74** — 主流 LTS,新架构 (Fabric/TurboModules) 路径清晰
2. **Zustand + persist** — < 1KB,无 boilerplate,中间件支持 AsyncStorage
3. **AsyncStorage** — RN 官方持久化,kv 存储够用
4. **8 path aliases** — `@components/@screens/@navigation/@store/@network/@db/@utils`
5. **React Navigation 6** — Stack + Tab + Drawer 三合一
6. **React Query** — 30s staleTime + 离线 cache,服务端状态自动管理

## 后果
- ✅ Zustand < 1KB,比 Redux Toolkit (-15KB) 小一个数量级
- ✅ 5 字段 store (isAuthenticated/isHydrated/user/token/refreshToken) 跨页面零样板
- ✅ Axios 拦截器 401 自动 refresh + 防重入 (isRefreshing flag)
- ⚠️ RN 0.74 新架构 opt-in,V2 需评估 Fabric 升级
- ⚠️ AsyncStorage 容量限制 ~6MB,V2 大数据落 WatermelonDB

## 替代方案
- Redux Toolkit: 过度,boilerplate 多
- Recoil/Jotai: 原子化对小项目 OK,大状态树管理复杂
- 选择: Zustand + 显式 store slice
