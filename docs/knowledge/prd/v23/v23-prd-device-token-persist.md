# V23-PRD-04: 设备令牌持久化 — Device Token Persist

> 版本: v1.0 · 签发人: 树哥
> 日期: 2026-07-21 · 状态: 🟢 已签发
> 圈梁: G4-C1

- **名称**: 设备令牌持久化
- **用途**: 实现设备令牌的数据库持久化存储与自动续期机制，解决应用重启后设备令牌丢失导致推送失败的问题
- **输出**: `src/modules/device/device-token.service.ts` + `migrations/*-device-token.ts`
- **圈梁状态**: 代码✅ 测试✅ 审计✅ PRD新建
- **日期**: 2026-07-21
- **作用**: G4-C1 设备管理合规

## 完成定义

1. DeviceToken Entity 包含 token、deviceId、expiresAt、platform 字段
2. 自动续期逻辑覆盖 token 过期前 7 天刷新
3. 单元测试覆盖 CRUD + 续期边界场景
