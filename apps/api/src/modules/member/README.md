# 会员模块 (Member)

## 用途
全量会员管理：持久化会员档案、LYT 标准快照、跨租户查询、休眠检测、P36 阶段扩展、Store-A 门店侧会员操作。覆盖会员配置、积分调整、等级调整、审批记录。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET /members` | 会员基础 CRUD |
| `GET /members/persistent` | 持久化会员列表 |
| `GET /members/persistent/:memberId` | 会员档案详情 |
| `GET /members/persistent/snapshots` | LYT 标准会员快照 |
| `GET /members/config` | 会员配置 |
| `GET /members/dormancy` | 活跃/休眠检测 |

## 测试位置
`apps/api/src/modules/member/` — **32** 个测试文件：控制器单测 (`.spec.ts`)、服务单测 (`.test.ts`)、DTO/Entity 测试、E2E (`.e2e.test.ts`)、角色权限测试、休眠检测测试、跨租户测试、模拟器测试。
