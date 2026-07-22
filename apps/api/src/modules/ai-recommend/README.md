# AI 推荐引擎模块 (ai-recommend)

## 模块概述

AI 推荐引擎模块是 shenjiying88 平台的智能推荐子系统，为游戏、产品、活动、优惠券和 SVIP 会员五大场景提供个性化推荐能力。支持热门推荐、协同过滤、内容推荐和混合推荐四种策略，基于用户画像、物品评分和交互行为数据生成精准推荐结果。

## 核心功能

- **多类型推荐**：支持 `game`（游戏）、`product`（产品）、`activity`（活动）、`coupon`（优惠券）、`svip`（SVIP 会员）五种推荐项类型。
- **多种推荐策略**：
  - **热门推荐**：基于物品交互次数排序，适合冷启动和匿名用户。
  - **协同过滤**：基于用户相似度，推荐相似用户喜欢的物品。
  - **内容推荐**：基于物品内容相似度，推荐与用户历史偏好相似的物品。
  - **混合推荐**：多策略加权组合，兼顾准确性与多样性。
- **用户画像管理**：用户画像的创建、更新与查询，支持多维度标签与偏好。
- **物品评分系统**：物品评分录入和推荐源管理。
- **交互记录与转化追踪**：记录用户交互（浏览/点击/购买/游玩），追踪推荐转化效果。
- **自定义推荐策略**：支持动态创建和调整推荐策略，权重因子可配。
- **批量推荐生成**：支持按用户画像批量生成推荐结果，适用于运营场景。
- **跨模块合约（Contract）**：定义稳定的对外公开接口，供 ai-insight、ai-rule-engine、campaign 等模块消费。
- **多租户隔离**：所有 API 通过 `TenantGuard` 实现租户级数据隔离。

## 目录结构

```
ai-recommend/
├── README.md                              # 本文件
├── ai-recommend.module.ts                 # NestJS 模块定义
├── ai-recommend.controller.ts             # REST API 控制器
├── ai-recommend.service.ts                # 核心推荐引擎服务
├── ai-recommend.entity.ts                 # 实体/类型定义
├── ai-recommend.dto.ts                    # 请求/响应 DTO
├── ai-recommend.contract.ts               # 跨模块合约类型
├── ai-recommend.controller.spec.ts        # 控制器单元测试
├── ai-recommend.controller.test.ts        # 控制器集成测试
├── ai-recommend.service.spec.ts           # 服务单元测试
├── ai-recommend.service.test.ts           # 服务集成测试
├── ai-recommend.dto.test.ts               # DTO 验证测试
├── ai-recommend.entity.test.ts            # 实体测试
├── ai-recommend.module.test.ts            # 模块注入测试
├── ai-recommend.e2e.test.ts               # E2E 测试
├── ai-recommend.ringbeam.test.ts          # 圈梁测试
├── ai-recommend.role.test.ts              # 角色测试
├── ai-recommend.role-scenario.test.ts     # 角色场景测试
├── ai-recommend.role-extended.test.ts     # 角色扩展测试
├── ai-recommend.test.ts                   # 综合测试
└── ai-recommend.contract.test.ts          # 合约测试
```

## 使用方法

### 获取推荐

```bash
# 热门推荐
GET /api/ai-recommend/recommendations/popular?storeId=store-001&type=game&limit=10

# 个性化推荐
GET /api/ai-recommend/recommendations/personalized?memberId=m001&storeId=store-001&limit=10

# 协同过滤推荐
GET /api/ai-recommend/recommendations/collaborative?memberId=m001&limit=10

# 混合推荐
GET /api/ai-recommend/recommendations/hybrid?memberId=m001&storeId=store-001&limit=10
```

### 用户画像管理

```bash
# 创建用户画像
POST /api/ai-recommend/profiles
Content-Type: application/json

{
  "userId": "m001",
  "storeId": "store-001",
  "age": 8,
  "gender": "male",
  "preferredTypes": ["game", "activity"],
  "interests": ["射击", "竞速"],
  "visitFrequency": "weekly"
}

# 更新用户画像
PATCH /api/ai-recommend/profiles/m001
Content-Type: application/json

{
  "interests": ["射击", "竞速", "音乐"],
  "visitFrequency": "daily"
}

# 获取用户画像
GET /api/ai-recommend/profiles/m001
```

### 物品评分与交互

```bash
# 录入物品评分
POST /api/ai-recommend/item-scores
Content-Type: application/json

{
  "itemId": "game-001",
  "itemType": "game",
  "score": 85,
  "source": "manual"
}

# 记录交互
POST /api/ai-recommend/interactions
Content-Type: application/json

{
  "memberId": "m001",
  "itemId": "game-001",
  "itemType": "game",
  "interactionType": "play",
  "source": "recommendation",
  "recommendationId": "rec-001"
}
```

### 推荐策略管理

```bash
# 创建推荐策略
POST /api/ai-recommend/strategies
Content-Type: application/json

{
  "name": "会员专属混合推荐",
  "description": "基于协同过滤和内容的混合推荐",
  "targetType": "game",
  "config": {
    "weights": [
      { "factor": "collaborativeScore", "weight": 0.6 },
      { "factor": "contentScore", "weight": 0.4 }
    ],
    "minScore": 20,
    "maxResults": 20
  }
}

# 获取推荐策略
GET /api/ai-recommend/strategies
```

### 批量推荐生成

```bash
POST /api/ai-recommend/generate
Content-Type: application/json

{
  "memberIds": ["m001", "m002"],
  "storeIds": ["store-001"],
  "types": ["game", "activity"],
  "strategyId": "strategy-popularity-v1",
  "limit": 10
}
```

## 依赖说明

| 依赖 | 用途 |
|------|------|
| `@nestjs/common` | NestJS 核心装饰器 |
| `@nestjs/core` | NestJS 运行时 |
| `class-validator` | DTO 请求参数校验 |
| `class-transformer` | DTO 类型转换 |
| `vitest` | 测试框架（`describe`, `it`, `expect`） |
| `reflect-metadata` | 装饰器元数据反射 |
| 租户守卫 (`agent/tenant.guard`) | 多租户隔离 |

