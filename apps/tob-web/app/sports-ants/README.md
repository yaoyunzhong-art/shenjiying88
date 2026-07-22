# Sports Ants — 品牌门户站

> 神机营 Sports Ants（竞技蚂蚁）品牌官网，面向门店加盟商、终端消费者提供品牌展示、产品服务、加盟合作、新闻资讯等功能的企业级门户站点。作为独立品牌站内嵌于 B2B 运营门户 `tob-web` 中。

## 技术栈

| 类别       | 技术                        |
| ---------- | --------------------------- |
| 框架       | Next.js 15 (App Router)     |
| 语言       | TypeScript 5.8              |
| UI         | React 18 + 内联样式          |
| SEO        | 自定义 robots.txt + sitemap.xml |
| 测试       | Node Test Runner + Testing Library |
| 包管理     | pnpm workspace (monorepo)   |

## 页面路由

```
/sports-ants                   → 首页/品牌介绍
/sports-ants/about             → 关于我们
/sports-ants/products          → 产品服务
/sports-ants/solutions         → 解决方案
/sports-ants/cases             → 客户案例
/sports-ants/news              → 新闻资讯
/sports-ants/ai                → AI 能力
/sports-ants/contact           → 联系我们
/sports-ants/register          → 加盟注册
/sports-ants/login             → 登录
/sports-ants/forgot-password   → 忘记密码
/sports-ants/console           → 管理控制台
/sports-ants/help              → 帮助中心
/sports-ants/pricing           → 定价方案
/sports-ants/terms             → 服务条款
/sports-ants/privacy           → 隐私政策
/sports-ants/epc               → EPC（工程采购建设）
/sports-ants/franchise         → 招商加盟
/sports-ants/resources         → 资源中心
```

## 目录结构

```
app/sports-ants/
├── layout.tsx              # 品牌站布局
├── page.tsx                # 首页
├── page.test.ts            # 首页测试
├── robots.ts               # 搜索引擎爬虫配置
├── sitemap.ts              # 站点地图
├── about/                  # 关于我们
├── ai/                     # AI 能力展示
├── cases/                  # 客户案例
├── components/             # 品牌站共享组件
├── console/                # 管理控制台
├── contact/                # 联系我们
├── epc/                    # EPC 服务
├── forgot-password/        # 忘记密码
├── franchise/              # 招商加盟
├── help/                   # 帮助中心
├── lib/                    # 工具库
├── login/                  # 登录
├── news/                   # 新闻资讯
├── pricing/                # 定价方案
├── privacy/                # 隐私政策
├── products/               # 产品服务
├── register/               # 注册
├── resources/              # 资源中心
├── solutions/              # 解决方案
└── terms/                  # 服务条款
```

## 开发命令

```bash
# 开发模式（在 monorepo 根目录）
pnpm dev

# TypeScript 类型检查
pnpm --filter @m5/tob-web typecheck

# 运行测试
pnpm --filter @m5/tob-web test
```

## 设计说明

- 作为 `@m5/tob-web`（Next.js 15 App Router）的子路由，共享全局布局配置
- 通过 `layout.tsx` 设置品牌站专属布局与样式
- SEO 配置通过 `robots.ts` 和 `sitemap.ts` 实现搜索引擎友好
- 所有页面组件位于对应路由文件夹下，包含独立的测试文件
