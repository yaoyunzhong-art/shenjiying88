# V23 PRD: 推送与频控 P0 (WP-13A)

> **来源**: `docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md §5`
> **工作包**: WP-13A
> **BS 范围**: BS-0168 ~ BS-0184
> **优先级**: P0
> **负责人**: 树哥

---

## 1. 概述

本 PRD 定义推送模块 WP-13A 的分级管理、免打扰时段、频控限制以及邮件/短信双通道能力，为 C 端推送和 AI 营销引擎（WP-08B / WP-14）提供基础设施。

## 2. 推送分级 (P0~P3)

| 级别 | 名称 | 关闭能力 | 描述 |
|:--:|:--|:--:|:--|
| **P0** | 紧急告警 | 🔒 不可关闭 | 安全告警、服务中断、系统故障 |
| **P1** | 重要通知 | 🉑 可关闭 | 订单状态、结算结果、身份验证 |
| **P2** | 一般推送 | 🉑 可关闭 | 通用信息通知 |
| **P3** | 营销推送 | 🎮 一键关闭 | 促销活动、优惠券、新品推荐 |

### 2.1 关键逻辑

- **P0** 强制推送：跳过 DND、频控、用户偏好检查
- **P1** 受 DND + 频控限制
- **P2** 受 DND + 频控限制
- **P3** 受 DND + 频控限制 + 用户偏好标记 `push_marketing_enabled` 检查

### 2.2 枚举定义

在 `apps/api/src/modules/push/push-priority.enum.ts` 中定义 `PushBusinessPriority`:
- `P0` / `P1` / `P2` / `P3`

辅助函数:
- `isPushPriorityMandatory(priority)` — P0 返回 true，其他返回 false
- `toPushPriority(priority)` — 映射到 `'high'|'normal'|'low'` 技术优先级

## 3. 免打扰时段 (DND)

### 3.1 默认配置

| 配置项 | 默认值 | 说明 |
|:--|:--:|:--|
| enabled | true | 是否启用免打扰 |
| startTime | 22:00 | 每日免打扰起始时间 |
| endTime | 08:00 | 每日免打扰结束时间 |
| bypassBelow | P0 | 免打扰时允许推送的最低级 |

### 3.2 实现

位于 `apps/api/src/modules/push/dnd-config.ts`:
- `DndConfigService` — 管理租户级 DND 配置
- 支持跨天时段（22:00 ~ 08:00）
- P0 推送始终不受 DND 限制

### 3.3 REST 端点

| 方法 | 路径 | 说明 |
|:--|:--|:--|
| GET | `/push/dnd/:tenantId` | 获取免打扰配置 |
| PATCH | `/push/dnd/:tenantId` | 更新免打扰配置 |
| GET | `/push/dnd/:tenantId/check` | 检查当前是否在免打扰时段 |

## 4. 频控限制

### 4.1 默认配置

| 配置项 | 默认值 | 说明 |
|:--|:--:|:--|
| dailyMax | 50 | 每日最大推送次数 |
| weeklyMax | 200 | 每周最大推送次数 |
| perMinuteMax | 10 | 每分钟最大推送频率 |
| cooldownSeconds | 5 | 降级等待秒数 |

### 4.2 实现

位于 `apps/api/src/modules/push/dnd-config.ts`:
- `FrequencyCapService` — 管理租户级频控配置
- 基于内存计数器（生产需改为 Redis + Lua）
- 隔离不同租户/会员的计数器

### 4.3 REST 端点

| 方法 | 路径 | 说明 |
|:--|:--|:--|
| GET | `/push/frequency-cap/:tenantId` | 获取频控配置 |
| PATCH | `/push/frequency-cap/:tenantId` | 更新频控配置 |
| GET | `/push/frequency-cap/:tenantId/status/:memberId` | 查询频控状态（不递增） |
| POST | `/push/frequency-cap/:tenantId/check/:memberId` | 检查并递增频控计数器 |

## 5. 邮件 + 短信双通道

### 5.1 架构

```
push.client → DualChannelRouter.router
                    ├── primary channel (email)
                    └── fallback channel (sms)
```

- **主通道 (Primary)**: 邮件 (`EmailPushChannel`)
- **备用通道 (Fallback)**: 短信 (`SmsPushChannel`)
- 主通道发送失败时自动降级到备用通道

### 5.2 接口定义

位于 `apps/api/src/modules/push/channels/`:
- `PushChannel` 接口 — `send()`, `healthCheck()`
- `EmailPushChannel` — 邮件推送（模拟骨架）
- `SmsPushChannel` — 短信推送（模拟骨架）
- `DualChannelRouter` — 双通道主备路由

### 5.3 生产部署配置

**邮件通道**（环境变量）:
```env
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your@email.com
MAIL_PASS=your-password
MAIL_FROM=noreply@shenjiying.com
```

**短信通道**（环境变量）:
```env
SMS_PROVIDER=aliyun
SMS_ACCESS_KEY_ID=xxx
SMS_ACCESS_KEY_SECRET=xxx
SMS_SIGN_NAME=深机营
SMS_TEMPLATE_CODE=SMS_xxxxx
```

### 5.4 REST 端点

| 方法 | 路径 | 说明 |
|:--|:--|:--|
| GET | `/push/channels/health` | 获取双通道健康状态 |
| POST | `/push/channels/email` | 发送邮件推送 |
| POST | `/push/channels/sms` | 发送短信推送 |
| POST | `/push/channels/send-dual` | 双通道发送（主备切换） |

## 6. 推送分级守卫

位于 `apps/api/src/modules/push/push-priority.guard.ts`:
- `PushPriorityGuard` — 统一检查推送是否应被执行
- 检查链: P0 强制 → DND → 频控 → P3 偏好设置

### 6.1 分级检查端点

| 方法 | 路径 | 说明 |
|:--|:--|:--|
| POST | `/push/priority/check` | 预览推送是否会被拦截 |
| GET | `/push/priority/levels` | 获取推送分级定义 |

## 7. 文件清单

```
apps/api/src/modules/push/
├── push-priority.enum.ts        # P0~P3 枚举定义 (NEW)
├── push-priority.enum.test.ts   # 分级枚举测试 (NEW)
├── push-priority.guard.ts       # 推送分级守卫 (NEW)
├── push-priority.guard.test.ts  # 守卫测试 (NEW)
├── dnd-config.ts                # 免打扰 + 频控配置 (NEW)
├── dnd-config.test.ts           # DND/频控测试 (NEW)
├── channels/
│   ├── push-channel.interface.ts # 通道接口定义 (NEW)
│   ├── email-channel.ts          # 邮件通道 (NEW)
│   ├── sms-channel.ts            # 短信通道 (NEW)
│   ├── dual-channel-router.ts    # 双通道主备路由 (NEW)
│   ├── index.ts                  # 统一导出 (NEW)
│   └── channels.test.ts          # 通道测试 (NEW)
├── push.module.ts                # 模块注册 (UPDATED)
└── push.controller.ts            # 新增端点 (UPDATED)
```

## 8. BS 映射

| BS | 描述 | 实现文件 |
|:--|:--|:--|
| BS-0168 | 推送分级定义 | push-priority.enum.ts |
| BS-0169 | P0 紧急推送 | push-priority.guard.ts |
| BS-0170 | P3 一键关闭 | push-priority.enum.ts / push-priority.guard.ts |
| BS-0173 | 免打扰时段 | dnd-config.ts |
| BS-0176 | 每日频控 | dnd-config.ts |
| BS-0179 | 每周频控 | dnd-config.ts |
| BS-0183 | 邮件通道 | channels/email-channel.ts |
| BS-0184 | 短信通道 | channels/sms-channel.ts |
