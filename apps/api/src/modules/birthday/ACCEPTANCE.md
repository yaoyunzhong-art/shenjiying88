# ✅ 模块验收文档: 生日趴营销引擎

> 模块: apps/api/src/modules/birthday
> 需求编号: BS-0199 ~ BS-0206, BS-0287, BS-0292 | WP-15 生日趴引擎
> 最后更新: 2026-07-29

## 功能清单 (Feature List)

| # | 功能 | 需求编号 | 状态 |
|---|------|---------|------|
| 1 | 生日识别 — 近30天标记 | BS-0199 | ✅ |
| 2 | 会员是否近30天生日检查 | BS-0199 | ✅ |
| 3 | 创建生日方案 | BS-0200 | ✅ |
| 4 | 生日方案列表/详情查询 | BS-0200 | ✅ |
| 5 | 触发生日推送（发送奖励） | BS-0201 | ✅ |
| 6 | 领取奖励 | BS-0202 | ✅ |
| 7 | 消费追踪记录（含好友裂变） | BS-0203 | ✅ |
| 8 | 好友裂变统计 | BS-0204 | ✅ |
| 9 | 生日趴看板聚合数据 | BS-0205 | ✅ |
| 10 | 会员生日统计（复购追踪） | BS-0206 | ✅ |
| 11 | 生日特效倒计时 | BS-0287 | ✅ |
| 12 | 生日特效预览 | BS-0287 | ✅ |
| 13 | 入场特效预加载 | BS-0292 | ✅ |

## 接口验收 (API Acceptance)

所有接口前缀: `/birthday`
认证: `@UseGuards(TenantGuard)` — 所有端点需携带租户上下文

### POST `/plans` — 创建生日方案

- **功能**: 为会员创建生日营销方案，含优惠券/礼品/折扣设置
- **请求体** (JSON):
  ```json
  {
    "memberId": "string (required)",
    "birthday": "MM-DD (required, 格式严格)",
    "advanceDays": 3,
    "tier": "STANDARD|PREMIUM|VIP",
    "rewardType": "coupon|gift|discount",
    "rewardValue": 50,
    "allowFriends": false,
    "friendDiscount": 0.8
  }
  ```
- **校验规则**:
  - memberId 非空
  - birthday 严格 `MM-DD` 格式
  - advanceDays: 0~30
  - rewardValue > 0
  - friendDiscount: 当 allowFriends=true 时, 0~1
  - 同一会员不允许有多个进行中的方案(冲突检测)
- **响应** `201 Created`: `BirthdayPlan`
- **响应体示例**:
  ```json
  {
    "id": "plan-1712345678900-abc123",
    "memberId": "member-001",
    "birthday": "12-25",
    "planDate": "2026-12-22",
    "advanceDays": 3,
    "tier": "VIP",
    "rewardType": "coupon",
    "rewardValue": 100,
    "status": "pending",
    "isUpcoming": false,
    "allowFriends": true,
    "friendDiscount": 0.85,
    "createdAt": "2026-07-29T00:00:00.000Z",
    "updatedAt": "2026-07-29T00:00:00.000Z"
  }
  ```

### GET `/plans` — 生日方案列表

- **查询参数**:
  - `month` (可选, `YYYY-MM` 格式) — 按方案执行月份筛选
  - `status` (可选, `pending|active|completed|cancelled`)
- **响应** `200 OK`: `{ plans: BirthdayPlan[] }` (按 createdAt 倒序)

### GET `/plans/:id` — 方案详情

- **请求参数**: `id` (路径参数)
- **响应** `200 OK`: `BirthdayPlan`
- **错误**: 不存在抛出 `404 NotFoundException`

### POST `/plans/:id/trigger` — 触发生日推送

- **功能**: 向会员发送生日奖励（需要有 pending 方案）
- **请求参数**: `id` (路径参数)
- **限制**: 仅 `status='pending'` 可触发
- **响应** `200 OK`:
  ```json
  {
    "id": "reward-...",
    "planId": "plan-...",
    "type": "coupon",
    "value": 100,
    "sentAt": "2026-07-29T00:00:00.000Z",
    "createdAt": "2026-07-29T00:00:00.000Z"
  }
  ```
- **错误**: 状态非 pending → `400 BadRequestException`

### POST `/plans/:id/claim` — 领取奖励

- **功能**: 会员到店领取已发送的奖励
- **请求参数**: `id` (路径参数)
- **限制**: 仅 `status='active'` 可领取；奖励未被重复领取
- **响应** `200 OK`: `BirthdayReward` (含 `claimedAt`)
- **错误**: 状态非 active → `400`；奖励已领取 → `400`；无奖励记录 → `404`

### POST `/plans/:id/track` — 消费追踪记录

- **功能**: 记录生日到店的消费数据（含好友裂变）
- **请求参数**: `id` (路径参数)
- **请求体** (JSON):
  ```json
  {
    "friendInvited": 2,
    "totalSpend": 388.00,
    "returnVisitDays": 15
  }
  ```
- **校验**: totalSpend ≥ 0；friendInvited ≥ 0；returnVisitDays ≥ 0；allowFriends=false 时 friendInvited 必须=0
- **响应** `201 Created`: `BirthdayTracking`

### GET `/stats` — 生日趴看板

- **查询参数**: `month` (可选, 默认当前月 `YYYY-MM`)
- **响应** `200 OK`:
  ```json
  {
    "monthlyBirthdays": 5,
    "activePlans": 3,
    "conversionRate": 0.6667,
    "avgSpend": 256.00,
    "returnRate": 0.3333,
    "month": "2026-07",
    "updatedAt": "2026-07-29T00:00:00.000Z"
  }
  ```

### GET `/stats/:memberId` — 会员生日统计

- **请求参数**: `memberId` (路径参数)
- **响应** `200 OK`:
  ```json
  {
    "planCount": 2,
    "totalSpend": 500.00,
    "totalInvited": 3,
    "avgReturnVisitDays": 12.50,
    "lastBirthday": "2026-12-22"
  }
  ```

### GET `/countdown/:memberId` — 生日倒计时 (BS-0287)

- **请求参数**: `memberId` (路径参数)
- **查询参数**: `birthday` (必填, `MM-DD` 格式)
- **响应** `200 OK`:
  ```json
  {
    "success": true,
    "data": {
      "memberId": "member-001",
      "birthday": "12-25",
      "daysUntilBirthday": 149,
      "effectType": "upcoming",
      "effectLevel": 2,
      "effectName": "📅 生日即将到来",
      "effectDescription": "距离您的生日还有 149 天",
      "canPreview": true,
      "detail": { "days": 149, "hours": 12, "minutes": 30, "seconds": 0 },
      "birthdayDate": "2026-12-25",
      "previewUrl": "/birthday/preview/member-001?effect=upcoming"
    }
  }
  ```
- **特效层级**: past(1) < upcoming(2) < near(3) < tomorrow(4) < today(5)

### GET `/preview/:memberId` — 生日特效预览 (BS-0287)

- **请求参数**: `memberId` (路径参数)
- **查询参数**: `birthday` (必填, `MM-DD` 格式)
- **响应** `200 OK`:
  ```json
  {
    "success": true,
    "data": {
      "effectType": "today",
      "effectLevel": 5,
      "effectName": "🎉🎊 今天生日！",
      "effectDescription": "今天是您的生日！祝您生日快乐！🎂",
      "config": {
        "animation": "confetti",
        "duration": 5000,
        "sound": "birthday-song",
        "color": ["#FF6B6B", "#FFE66D", "#4ECDC4"],
        "balloons": true,
        "fireworks": true
      }
    }
  }
  ```

### POST `/effects/preload/:memberId` — 入场特效预加载 (BS-0292)

- **功能**: 会员生日当天入场时，预加载生日特效与奖励数据
- **请求参数**: `memberId` (路径参数)
- **响应** `200 OK`:
  ```json
  {
    "memberId": "member-001",
    "hasActivePlan": true,
    "effects": [
      {
        "type": "entrance_animation",
        "name": "生日入场动画",
        "data": {
          "animationKey": "birthday-entrance",
          "duration": 3000,
          "priority": 1
        }
      },
      {
        "type": "confetti_config",
        "name": "生日彩纸特效",
        "data": {
          "particleCount": 150,
          "colors": ["#FFD700", "#FF6B6B", "#4ECDC4"],
          "duration": 5000
        }
      },
      {
        "type": "reward_hint",
        "name": "生日奖励提示",
        "data": {
          "rewardType": "coupon",
          "rewardValue": 100,
          "allowFriends": true,
          "friendDiscount": 0.85
        }
      }
    ]
  }
  ```
- **无方案时**: `{ memberId, hasActivePlan: false, effects: [] }`

## 验收标准 (Acceptance Criteria)

### 生日方案创建 (BS-0199/BS-0200)

1. **GIVEN** 合法会员生日参数
   **WHEN** 调用 `POST /plans` 传入完整参数
   **THEN** 返回 201 Created，planDate = birthday - advanceDays，status='pending'

2. **GIVEN** memberId 为空
   **WHEN** 调用 `POST /plans`
   **THEN** 抛出 BadRequestException 提示 memberId 不能为空

3. **GIVEN** birthday 非 MM-DD 格式
   **WHEN** 调用 `POST /plans`
   **THEN** 抛出 BadRequestException

4. **GIVEN** advanceDays 超出 0~30 范围
   **WHEN** 调用 `POST /plans`
   **THEN** 抛出 BadRequestException

5. **GIVEN** rewardValue <= 0
   **WHEN** 调用 `POST /plans`
   **THEN** 抛出 BadRequestException

6. **GIVEN** 允许带好友但 friendDiscount 超出 0~1 范围
   **WHEN** 调用 `POST /plans`
   **THEN** 抛出 BadRequestException

7. **GIVEN** 会员已有 pending 或 active 方案
   **WHEN** 再次调用 `POST /plans` 创建新方案
   **THEN** 抛出 ConflictException

### 推送与领取 (BS-0201/BS-0202)

8. **GIVEN** 方案状态为 pending
   **WHEN** 调用 `POST /plans/:id/trigger`
   **THEN** 方案 status 变为 'active'，创建 BirthdayReward 含 sentAt

9. **GIVEN** 方案状态非 pending(如已完成)
   **WHEN** 调用 `POST /plans/:id/trigger`
   **THEN** 抛出 BadRequestException

10. **GIVEN** 方案状态为 active 且奖励未领取
    **WHEN** 调用 `POST /plans/:id/claim`
    **THEN** 奖励 marked claimedAt，方案 status 变为 'completed'

11. **GIVEN** 奖励已被领取
    **WHEN** 再次调用 `POST /plans/:id/claim`
    **THEN** 抛出 BadRequestException 提示奖励已被领取

12. **GIVEN** 不存在的方案 id
    **WHEN** 调用 `GET /plans/:nonexistent`
    **THEN** 抛出 NotFoundException

### 追踪与裂变 (BS-0203/BS-0204)

13. **GIVEN** 会员完成生日消费并带了2位好友
    **WHEN** 调用 `POST /plans/:id/track` 传入 friendInvited=2
    **THEN** 返回 BirthdayTracking 含该数据，好友统计更新

14. **GIVEN** 方案不允许带好友(allowFriends=false)
    **WHEN** 调用 `POST /plans/:id/track` 传入 friendInvited=1
    **THEN** 抛出 BadRequestException

15. **GIVEN** totalSpend 为负数
    **WHEN** 调用 `POST /plans/:id/track`
    **THEN** 抛出 BadRequestException

16. **GIVEN** 会员有多次生日追踪记录
    **WHEN** 调用 `GET /stats/:memberId`
    **THEN** 返回的 totalSpend 为所有追踪之和，avgReturnVisitDays 为均值

### 看板与统计 (BS-0205/BS-0206)

17. **GIVEN** 当月有5个生日方案，3个已推送，2个已领取奖励
    **WHEN** 调用 `GET /stats`
    **THEN** monthlyBirthdays=5，conversionRate=2/3≈0.6667

18. **GIVEN** 有消费追踪记录的会员
    **WHEN** 调用 `GET /stats`
    **THEN** avgSpend 为所有追踪记录消费总额/追踪数

19. **GIVEN** 有30天内复购的追踪记录
    **WHEN** 调用 `GET /stats`
    **THEN** returnRate = 30天内复购追踪数 / 总追踪数

### 倒计时与特效 (BS-0287/BS-0292)

20. **GIVEN** 生日在90天以内
    **WHEN** 调用 `GET /countdown/:memberId?birthday=MM-DD`
    **THEN** canPreview=true，previewUrl 非空，effectLevel 按剩余天数正确

21. **GIVEN** 生日在今天(剩余0天)
    **WHEN** 调用 `GET /preview/:memberId?birthday=today`
    **THEN** effectType='today', effectLevel=5，config 含 confetti 动画

22. **GIVEN** 无活跃方案的会员
    **WHEN** 调用 `POST /effects/preload/:memberId`
    **THEN** hasActivePlan=false，effects=[]

23. **GIVEN** VIP 等级会员有活跃方案
    **WHEN** 调用 `POST /effects/preload/:memberId`
    **THEN** effects 包含3项(入场动画、彩纸特效、奖励提示)，彩纸 particleCount=150

### 近30天生日的 isUpcoming 标记

24. **GIVEN** 会员生日在30天内
    **WHEN** 调用 `checkIsUpcoming`
    **THEN** 返回 true，创建方案时 isUpcoming=true

25. **GIVEN** 会员生日已过或超过30天
    **WHEN** 调用 `checkIsUpcoming`
    **THEN** 返回 false，创建方案时 isUpcoming=false

## 测试覆盖要求 (Coverage Requirements)

| 项目 | 要求 | 当前 |
|------|------|------|
| 测试文件数 | ≥5 | 6 ✅ |
| Service 单元测试断言数 | ≥80 | 89 ✅ |
| Countdown 服务测试 | 有 | ✅ |
| Controller 有 AuthGuard | 是 | ✅ |
| TSC 零错误 | 是 | ✅ |
| 零 skip/only | 是 | ✅ |
| 参数校验覆盖 | 所有 BadRequest 路径 | ✅ |
| 冲突检测覆盖 | 重复方案冲突 | ✅ |

### 核心测试覆盖

- **Service**: `birthday.service.spec.ts` / `birthday.service.boost.spec.ts` ✅
- **Countdown**: `birthday-countdown.service.spec.ts` / `birthday-countdown.test.ts` ✅
- **Controller**: `birthday.controller.ts` (有 `birthday.controller.metadata.test.ts`) ✅
- **BS-0292**: `birthday.bs0292.test.ts` ✅

### 建议补充测试

- `listPlans` 按月筛选的正确性(跨年场景)
- `markUpcomingBirthdays` 批量标记边界
- `getFriendStats` 无追踪时返回 {0, 0}
- `getDashboard` 当月无活动时的空数据表现
- `getPreview` 生日已过(past)的特效配置

---

> ⭕ **圈梁五道箍** | 2026-07-29 | V23 ✅ 代码 ✅ 测试 ✅ 文档 ✅ 验收 ✅ 部署
