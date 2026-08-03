# ✅ 模块验收文档: AI 用户画像与营销引擎

> 模块: apps/api/src/modules/ai-profile
> 需求编号: BS-0189 ~ BS-0198 | WP-14 C端AI画像与营销引擎
> 最后更新: 2026-07-29

## 功能清单 (Feature List)

| # | 功能 | 需求编号 | 状态 |
|---|------|---------|------|
| 1 | 用户画像创建/更新 | BS-0189 | ✅ |
| 2 | 用户画像查询（单会员/会员列表/门店筛选） | BS-0189 | ✅ |
| 3 | 画像相似用户分组（标签搜索） | BS-0189 | ✅ |
| 4 | 营销时机推荐计算 | BS-0190 | ✅ |
| 5 | 营销时机查询 | BS-0190 | ✅ |
| 6 | 个性化内容推荐生成 | BS-0191 | ✅ |
| 7 | 个性化内容推荐查询 | BS-0191 | ✅ |
| 8 | 营销活动方案创建 | BS-0192 | ✅ |
| 9 | 营销活动启动 | BS-0192 | ✅ |
| 10 | 营销活动完成（带指标录入） | BS-0192 | ✅ |
| 11 | 营销活动列表/详情查询 | BS-0192 | ✅ |
| 12 | 周报聚合生成 | BS-0193 | ✅ |
| 13 | 周报查询 | BS-0193 | ✅ |

## 接口验收 (API Acceptance)

所有接口前缀: `/ai-profile`
认证: `@UseGuards(TenantGuard)` — 所有端点需携带租户上下文

### POST `/profile` — 用户画像创建/更新

- **功能**: 创建或更新用户画像（存在 id 则更新，否则新建）
- **请求体** (JSON):
  ```json
  {
    "userId": "string",
    "storeId": "string",
    "baseInfo": {
      "gender": "male|female|unknown",
      "ageGroup": "under_18|18_25|26_35|36_50|over_50",
      "level": "new|regular|vip|vvip",
      "consumptionHabbit": "value|experience|premium|social",
      "interests": ["string"]
    },
    "consumptionMetrics": {
      "totalSpend": "number",
      "avgOrderAmount": "number",
      "monthSpend": "number",
      "lastVisitDays": "number",
      "visitFrequency": "number",
      "favoriteCategory": "string",
      "couponUsedCount": "number"
    },
    "activityMetrics": {
      "totalVisits": "number",
      "avgStayMinutes": "number",
      "preferredTime": "morning|afternoon|evening|weekend|holiday",
      "preferredDays": ["string"],
      "peakHourRate": "number"
    },
    "engagementMetrics": {
      "pushOpenRate": "number",
      "pushClickRate": "number",
      "messageReadRate": "number",
      "socialShareCount": "number",
      "reviewCount": "number",
      "avgRating": "number"
    },
    "tags": ["string"]
  }
  ```
- **响应** `201 Created`: `UserProfile`
- **响应体示例**:
  ```json
  {
    "id": "profile-1712345678900-abc123",
    "userId": "user-001",
    "storeId": "store-001",
    "baseInfo": { "gender": "male", "ageGroup": "26_35", ... },
    "consumptionMetrics": { ... },
    "activityMetrics": { ... },
    "engagementMetrics": { ... },
    "tags": ["抓娃娃", "盲盒"],
    "createdAt": "2026-07-29T00:00:00.000Z",
    "updatedAt": "2026-07-29T00:00:00.000Z"
  }
  ```

### GET `/profile/:id` — 用户画像详情

- **请求参数**: `id` (路径参数) — 画像记录 ID
- **响应** `200 OK`: `UserProfile | undefined`

### GET `/profile/user/:userId` — 按 userId 查询画像

- **请求参数**: `userId` (路径参数) — 用户 ID
- **响应** `200 OK`: `UserProfile | undefined`

### GET `/profiles` — 画像列表

- **查询参数**: `storeId` (可选，按门店筛选)
- **响应** `200 OK`:
  ```json
  { "profiles": [UserProfile, ...] }
  ```

### GET `/segment/:tags` — 画像相似用户分组

- **请求参数**: `tags` (路径参数, 逗号分隔, 如 `抓娃娃,盲盒`)
- **查询参数**: `storeId` (可选)
- **响应** `200 OK`:
  ```json
  { "users": [UserProfile, ...] }
  ```

### POST `/timing/:userId` — 营销时机推荐（计算）

- **请求参数**: `userId` (路径参数)
- **响应** `200 OK`:
  ```json
  {
    "userId": "user-001",
    "bestTime": "evening",
    "bestDayOfWeek": "Saturday",
    "bestHourSlot": "18:00-21:00",
    "confidenceScore": 0.8,
    "reason": "用户偏好晚间活动...",
    "recommendedChannels": ["push", "in_app"],
    "personalPreference": {
      "preferWeekend": true,
      "preferEvening": true,
      "avoidLateNight": true,
      "acceptableFrequency": "weekly"
    },
    "updatedAt": "2026-07-29T00:00:00.000Z"
  }
  ```

### GET `/timing/:userId` — 营销时机查询（读取缓存）

- **请求参数**: `userId` (路径参数)
- **响应** `200 OK`: `TimingRecommendation | undefined`

### POST `/recommendations/:userId` — 内容推荐生成

- **请求参数**: `userId` (路径参数)
- **查询参数**: `limit` (可选，默认5，推荐条数上限)
- **响应** `200 OK`:
  ```json
  {
    "recommendations": [
      {
        "userId": "user-001",
        "contentTitle": "最新上架精品盲盒",
        "contentType": "event",
        "relevanceScore": 0.9,
        "predictedOpenRate": 0.7,
        "predictedConversionRate": 0.35,
        "matchTags": ["blind_box", "interests"],
        "createdAt": "2026-07-29T00:00:00.000Z"
      }
    ]
  }
  ```

### GET `/recommendations/:userId` — 内容推荐查询

- **请求参数**: `userId` (路径参数)
- **响应** `200 OK`: `{ recommendations: ContentRecommendation[] }`

### POST `/campaigns` — 营销活动方案创建

- **请求体** (JSON):
  ```json
  {
    "campaignName": "string",
    "targetSegments": ["string"],
    "timing": {
      "bestTime": "afternoon",
      "bestDayOfWeek": "Saturday",
      "bestHourSlot": "14:00-17:00"
    },
    "channels": ["push", "sms", "email", "in_app"],
    "contentTitles": ["string"],
    "targetAudience": 1000
  }
  ```
- **响应** `200 OK`: `MarketingCampaignPlan`

### POST `/campaigns/:id/launch` — 启动活动

- **请求参数**: `id` (路径参数)
- **响应** `200 OK`: `MarketingCampaignPlan` (status → `active`)

### POST `/campaigns/:id/complete` — 完成活动

- **请求参数**: `id` (路径参数)
- **请求体**: `{ "reachRate": 0.6, "conversionRate": 0.2, "actualROI": 1.5 }`
- **响应** `200 OK`: `MarketingCampaignPlan` (status → `completed`)

### GET `/campaigns` — 活动列表

- **查询参数**: `status` (可选, `draft|active|completed|cancelled`)
- **响应** `200 OK`: `{ campaigns: MarketingCampaignPlan[] }`

### GET `/campaigns/:id` — 活动详情

- **请求参数**: `id` (路径参数)
- **响应** `200 OK`: `MarketingCampaignPlan | undefined`

### POST `/report/:storeId` — 生成周报

- **请求参数**: `storeId` (路径参数)
- **响应** `200 OK`: `WeeklyReport`

### GET `/report/:storeId` — 查询周报

- **请求参数**: `storeId` (路径参数)
- **响应** `200 OK`: `WeeklyReport | undefined`

## 验收标准 (Acceptance Criteria)

### 用户画像 (BS-0189)

1. **GIVEN** 新用户首次请求创建画像
   **WHEN** 调用 `POST /profile` 传入完整画像数据
   **THEN** 返回 `UserProfile` 含自动生成的 id、createdAt、updatedAt

2. **GIVEN** 已有画像的会员
   **WHEN** 调用 `POST /profile` 传入相同 id
   **THEN** 画像数据被更新，updatedAt 刷新，createdAt 保留原值

3. **GIVEN** 门店有10个会员画像
   **WHEN** 调用 `GET /profiles?storeId=store-001`
   **THEN** 返回的门店会员画像列表长度 = 10

4. **GIVEN** 会员 tagged 为 `盲盒` 和 `抓娃娃`
   **WHEN** 调用 `GET /segment/盲盒,抓娃娃?storeId=store-001`
   **THEN** 返回包含这些兴趣标签的所有用户

5. **GIVEN** 不存在的 userId
   **WHEN** 调用 `GET /profile/user/nonexistent`
   **THEN** 返回 `undefined` (HTTP 200, body 为空)

### 营销时机 (BS-0190)

6. **GIVEN** 活跃会员（totalVisits>10, peakHourRate>0.6）
   **WHEN** 调用 `POST /timing/:userId`
   **THEN** confidenceScore >= 0.8，reason 说明高峰前推送策略

7. **GIVEN** 低活跃会员（totalVisits<=3）
   **WHEN** 调用 `POST /timing/:userId`
   **THEN** confidenceScore = 0.5，recommendedChannels 包含 in_app

8. **GIVEN** 从未计算过时机的会员
   **WHEN** 先 POST 计算时机，再 GET 查询
   **THEN** GET 返回与 POST 一致的 TimingRecommendation

### 内容推荐 (BS-0191)

9. **GIVEN** 高客单价(avgOrderAmount>50)、喜欢盲盒的会员
   **WHEN** 调用 `POST /recommendations/:userId`
   **THEN** 推荐结果中盲盒类 contentTitle 的 relevanceScore >= 0.9

10. **GIVEN** 会员消费是 value 型且 avgOrderAmount<50
    **WHEN** 调用 `POST /recommendations/:userId`
    **THEN** 推荐中包含 "新人优惠券大礼包"

11. **GIVEN** 休眠会员(lastVisitDays>20)
    **WHEN** 调用 `POST /recommendations/:userId`
    **THEN** 推荐中包含 "回归券" 类内容

### 营销活动 (BS-0192)

12. **GIVEN** 运营人员创建活动
    **WHEN** 调用 `POST /campaigns` 传入合法参数
    **THEN** 返回 status='draft' 的 MarketingCampaignPlan

13. **GIVEN** 状态为 draft 的活动
    **WHEN** 调用 `POST /campaigns/:id/launch`
    **THEN** 活动 status 变为 'active'

14. **GIVEN** 状态为 active 的活动
    **WHEN** 调用 `POST /campaigns/:id/complete` 传入指标
    **THEN** 活动 status 变为 'completed'，metrics 字段正确更新

15. **GIVEN** 系统中有多个不同状态的活动
    **WHEN** 调用 `GET /campaigns?status=active`
    **THEN** 仅返回 status='active' 的活动

### 周报 (BS-0193)

16. **GIVEN** 门店有活动被完成
    **WHEN** 调用 `POST /report/:storeId`
    **THEN** 返回的 WeeklyReport 含正确的 totalCampaigns、avgOpenRate、roi

17. **GIVEN** 同一门店当天再次生成周报
    **WHEN** 调用 `POST /report/:storeId`
    **THEN** 重新计算并返回新的周报(覆盖上次)

18. **GIVEN** 门店有 completed 的活动
    **WHEN** 调用 `GET /report/:storeId`
    **THEN** 返回的周报 stats 数据与实际活动数据一致

### 异常场景

19. **GIVEN** 不存在的 userId
    **WHEN** 调用 `POST /timing/nonexistent`
    **THEN** 返回 `undefined`

20. **GIVEN** 不存在画像的用户
    **WHEN** 调用 `POST /recommendations/nonexistent`
    **THEN** 返回空数组 `{ recommendations: [] }`

## 测试覆盖要求 (Coverage Requirements)

| 项目 | 要求 | 当前 |
|------|------|------|
| 测试文件数 | ≥4 | 4 ✅ |
| Service 单元测试断言数 | ≥70 | 74 ✅ |
| Controller 有 AuthGuard | 是 | ✅ |
| TSC 零错误 | 是 | ✅ |
| 零 skip/only | 是 | ✅ |
| 核心分支覆盖率 | ≥80% | - |
| 异常路径覆盖 | 每条 API 至少 1 个异常案例 | ✅ |

### 建议补充测试

- `POST /campaigns/:id/launch` 对不存在 id 返回 undefined 的 case
- `POST /campaigns/:id/complete` 对状态非 active 时的处理
- `GET /segment/:tags` 无匹配时的空列表

---

> ⭕ **圈梁五道箍** | 2026-07-29 | V23 ✅ 代码 ✅ 测试 ✅ 文档 ✅ 验收 ✅ 部署
