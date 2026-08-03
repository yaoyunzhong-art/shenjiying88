# 收银台模块 (Checkout)

## 模块概述

收银台模块是门店前端（storefront-web）消费者下单结算的核心流程页面，提供从购物车草稿加载、收件信息填写、配送方式选择、支付方式确认到订单提交的完整结算链路。该模块支持四种配送方式（标准配送、加急配送、门店自提）和四种支付方式（微信支付、支付宝、现金、会员卡），并集成优惠券验证、会员余额查询、积分抵扣等会员权益能力。

## 核心功能

| 功能 | 说明 |
|------|------|
| 购物车草稿管理 | 通过 `sessionStorage` 持久化结算草稿，支持从收银页带入商品，支持数量 ± 调整 |
| 收件信息表单 | 收件人姓名、手机号、邮箱、收货地址、城市的完整表单，含 11 位手机号格式验证 |
| 配送方式选择 | 标准配送（3-5天免运费门槛 ¥199）、加急配送（¥10）、门店自提（免运费） |
| 支付方式选择 | 微信支付、支付宝、现金、会员卡四种方式，卡片式选择器带图标描述 |
| 优惠券验证 | 输入优惠券码实时校验，通过 `validateStorefrontCoupon` 接口验证合法性 |
| 会员权益展示 | 根据手机号查询会员余额、积分数量和优惠券张数，实时联动显示 |
| 金额自动计算 | 商品小计、配送费、优惠减免、合计的实时四栏金额汇总 |
| 订单提交 | 调用 `startStorefrontCheckout` 创建订单，成功后跳转支付页 |
| 服务条款确认 | Checkbox 勾选同意服务条款和隐私政策，未同意无法提交 |
| 全量表单校验 | 提交前进行字段级非空、格式校验，错误提示定位到具体字段 |

## 技术依赖

| 依赖 | 版本/来源 | 用途 |
|------|-----------|------|
| React 18 | ^18.x.x | UI 框架与 Hooks（useState、useCallback、useMemo） |
| Next.js | ^14.x.x | App Router 路由与客户端导航 |
| @m5/ui | workspace | PageShell、FormField、Input、Select、Checkbox、Button 等 UI 组件库 |
| @m5/sdk | workspace | 会员注册、余额查询、结算等后端 API 调用 |
| TypeScript | ^5.x.x | 类型安全（CartItem、CheckoutFormData 类型定义） |
| sessionStorage | Web API | 结算草稿本地持久化 |

## API 接口清单

| 接口 | 方法 | 说明 |
|------|------|------|
| `POST /api/storefront/member/ensure-registered` | POST | 确保手机号已注册为会员，无则自动创建 |
| `GET /api/storefront/member/balance?memberId={id}` | GET | 查询会员余额、积分、优惠券数量 |
| `POST /api/storefront/checkout/start` | POST | 提交结算订单，创建支付流水 |
| `POST /api/storefront/coupon/validate` | POST | 校验优惠券码有效性并返回折扣金额 |
| `GET /api/storefront/member/info?phone={phone}` | GET | 根据手机号获取会员等级与权益信息 |
| `POST /api/storefront/payment/redirect` | POST | 跳转至第三方支付页面 |

## 目录结构

```
apps/storefront-web/app/checkout/
├── page.tsx              # 收银台主页面组件（表单 + 商品清单 + 金额摘要 + 订单提交）
├── loading.tsx           # 骨架屏加载态
├── page.test.tsx         # React Testing Library 组件测试
├── page.test.ts          # 单元测试
└── page.vitest.tsx       # Vitest 集成测试
```

## 使用说明

### 本地开发

```bash
# 进入 storefront-web 目录
cd apps/storefront-web

# 启动开发服务器
pnpm dev

# 访问收银台
# 浏览器打开 http://localhost:3000/checkout

# 测试流程：从收银页选择商品后跳转 /checkout 完成结算
```

### 路由与流程

1. 用户在收银页（`/cashier`）选择商品 → 结算草稿写入 `sessionStorage`
2. 跳转至 `/checkout` → 从草稿加载购物车商品
3. 填写收件信息、选择配送与支付方式 → 可选输入优惠券码
4. 确认金额明细 → 勾选服务条款 → 点击「确认支付」
5. 成功 → 跳转 `/h5/payment/{orderId}` 支付页

### 校验规则

- 手机号：11 位数字，以 `1` 开头
- 邮箱：基本 email 正则匹配（选填）
- 备注：不超过 200 字符
- 数量：1 ~ 99 件/商品
- 必填项未填时，提交后对应字段标红

## 安全注意事项

1. **支付安全**：前端仅提交订单请求，支付跳转应由后端返回的支付链接执行，禁止在前端拼接支付参数。
2. **金额防篡改**：最终金额 `total` 计算仅供展示，实际扣款金额以后端 `startStorefrontCheckout` 的响应值为准。
3. **优惠券校验**：前端显示折扣仅为预校验，实际优惠在服务端创建订单时再次验证，避免恶意篡改优惠金额。
4. **SessionStorage 隔离**：结算草稿以 `storefront.checkout.draft` 为 Key 存储在 `sessionStorage`，关闭 Tab 即销毁，不跨会话持久化。
5. **会员数据**：会员余额展示需后端验证 `memberId` 与当前会话是否匹配，禁止遍历手机号查询他人余额。
6. **XSS 防护**：用户输入的地址、备注等文本字段在渲染前需进行 HTML 转义，避免注入恶意脚本。
