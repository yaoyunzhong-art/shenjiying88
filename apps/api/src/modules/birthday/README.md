# Birthday 生日趴引擎

> WP-15 生日营销引擎，管理生日方案、倒计时、礼物领取追踪

## 功能
- 生日方案创建与管理 (Standard / Premium / VIP)
- 生日倒计时与预览
- 礼物领取与核销追踪
- 成员生日统计分析

## API
- POST /birthday/plans — 创建生日方案
- GET /birthday/plans — 方案列表
- GET /birthday/plans/:id — 方案详情
- POST /birthday/plans/:id/trigger — 触发方案
- POST /birthday/plans/:id/claim — 领取奖励
- POST /birthday/plans/:id/track — 追踪核销
- GET /birthday/stats — 统计概览
- GET /birthday/stats/:memberId — 成员统计
- GET /birthday/countdown/:memberId — 生日倒计时
- GET /birthday/preview/:memberId — 生日预览
- POST /birthday/effects/preload/:memberId — 预加载特效
