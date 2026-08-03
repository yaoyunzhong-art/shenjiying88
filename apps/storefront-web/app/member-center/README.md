# 会员中心模块 (Member Center)

## 模块概述

会员中心模块是门店前端（storefront-web）面向消费者的核心会员管理入口，提供会员信息展示、积分余额查询、等级权益浏览、最近订单追踪以及快捷功能导航等一站式会员服务。该模块采用 React 18 + Next.js App Router 架构，运行在「申继英-黑工」多租户 SDK 之上，支持钻石/黄金/银卡/铜卡/普通五级会员体系的沉浸式展示。

## 核心功能

| 功能 | 说明 |
|------|------|
| 会员信息展示 | 显示昵称、头像、等级徽章、手机号、关联门店等个人资料 |
| 等级晋升看板 | 进度条显示距离下一等级还差多少，支持 5 级会员体系（普通→铜卡→银卡→黄金→钻石） |
| 积分与余额 | 实时展示会员积分总额和账户余额，支持积分充值跳转 |
| 会员权益展示 | 根据等级动态展示积分倍率、生日礼遇、专属折扣等权益卡片 |
| 最近订单列表 | 通过 SDK 调用后端 API 拉取最近 5 条消费记录，展示订单号、金额、状态 |
| 快捷功能菜单 | 提供「我的订单」「优惠券」「会员卡」「收藏」「门店」等功能入口及底部 Tab 导航 |
| 无感登录校验 | 启动时自动校验本地 Token，未登录自动跳转至登录页 |
| 安全退出 | 清除本地存储的 Token 和缓存，实现安全退出 |

## 技术依赖

| 依赖 | 版本/来源 | 用途 |
|------|-----------|------|
| React 18 | ^18.x.x | UI 框架 |
| Next.js | ^14.x.x | App Router 路由与 SSR |
| Ant Design | ^5.x.x | Card、Button、Tag、Progress、Statistic 等组件库 |
| @ant-design/icons | ^5.x.x | 图标体系（GiftOutlined、CreditCardOutlined 等） |
| @m5/sdk | workspace | 会员认证客户端 `createBusinessClient`、订单 API |
| TypeScript | ^5.x.x | 类型安全 |

## API 接口清单

| 接口 | 方法 | 说明 |
|------|------|------|
| `GET /api/auth/member/profile` | GET | 获取当前登录会员的完整个人信息（昵称、等级、积分等） |
| `GET /api/auth/member/info` | GET | 获取本地缓存的会员基本信息 |
| `GET /api/orders/list?memberId={id}&limit=5` | GET | 获取会员最近 N 条订单记录 |
| `POST /api/auth/member/logout` | POST | 服务端登出操作（可选） |
| `GET /api/member/balance` | GET | 查询会员账户余额 |

## 目录结构

```
apps/storefront-web/app/member-center/
├── page.tsx              # 会员中心主页面组件（含会员信息、权益、订单、快捷功能）
├── loading.tsx           # 骨架屏加载态
├── page.test.tsx         # React Testing Library 组件测试
├── page.test.ts          # 单元测试
└── __tests__/
    └── page.vitest.tsx   # Vitest 集成测试
```

## 使用说明

### 本地开发

```bash
# 进入 storefront-web 目录
cd apps/storefront-web

# 启动开发服务器
pnpm dev

# 访问会员中心
# 浏览器打开 http://localhost:3000/member-center
```

### 路由说明

- `/member-center` — 会员中心主页
- `/member-login` — 会员登录页（未登录跳转）
- `/orders` — 我的订单
- `/member-card` — 会员卡/优惠券
- `/favorites` — 我的收藏
- `/stores` — 关联门店

### 会员等级对照

| 等级 | 条件（积分） | 积分倍率 | 折扣 | 生日礼遇 |
|------|-------------|---------|------|---------|
| 🥇 钻石会员 | ≥ 50,000 | 3x | 15% | 高端礼品+双倍积分 |
| 🥇 黄金会员 | 10,000 ~ 49,999 | 2x | 10% | 精致礼品+双倍积分 |
| 🥈 银卡会员 | 2,000 ~ 9,999 | 1.5x | 8% | 优惠券+积分 |
| 🥉 铜卡会员 | ≤ 1,999 | 1.2x | 5% | 优惠券 |
| ⚪ 普通会员 | — | 1x | 0% | 积分 |

## 安全注意事项

1. **Token 安全**：会员 Token 存储在 `localStorage`，禁止在 URL 参数中传递 Token，避免 CSRF 攻击。
2. **权限校验**：前端所有敏感操作（如积分充值）均需二次确认，后端需验证 `member_access_token` 有效性及过期时间。
3. **数据脱敏**：手机号在前端展示时应做中间四位掩码处理（`138****1234`），会员 ID 不对外暴露。
4. **订单数据**：拉取订单列表时后端应校验 `memberId` 与当前登录会员是否匹配，防止越权访问他人订单。
5. **退出机制**：登出时务必清除 `localStorage` 中的 `member_access_token`、`member_refresh_token` 和 `member_info` 三项，避免 Token 残留。
6. **本地存储**：会员信息缓存于 `localStorage`，用户登出或修改密码后应及时清理过期缓存。
