# @m5/admin-web — 管理后台前端

> 多租户零售管理后台，面向品牌运营、租户管理员、门店经理等角色，提供统一的管理控制台。
>
> 基于 **Next.js 15** (App Router) + **TypeScript 5.8** + **React 18** + **Ant Design 6** 构建，
> 属于 M5 神机营 SaaS 多租户零售平台的管理终端。

---

## 定位

admin-web 是神机营 SaaS 平台的**管理后台前端应用**，运营方与门店管理人员通过该终端完成门店管理、数据分析、告警监控、用户管理、审批流程等全部运营操作。

---

## 核心功能清单

| 功能域 | 说明 |
|--------|------|
| 门店运营管理 | 门店信息管理、每日运营、设备巡检、店长工作台 |
| 智能告警与监控 | 基础告警面板、关联概览、告警视图、告警趋势分析 |
| AI 决策引擎 | AI 决策面板（规则链/解释/分布/时间线/效果看板）、AI Agent 面板（聊天/思考/工具调用） |
| 用户与权限 | 用户管理、租户配置、SSO 配置、审批流程 |
| 会员管理 | 会员分群、RFM 分析、生命周期预测、流失预测、升级路径 |
| 财务与报表 | 财务经理仪表盘、门店对比、销售预测、利润分析、对账差异面板 |
| 库存与采购 | 库存管理面板、采购订单、门店调拨 |
| 营销管理 | 促销活动、定价推荐、内容生成、AB 测试对比 |
| 客户服务 | 客服工作台、会话面板、客服仪表盘 |
| 数据智能 | 智能洞察、需求预测、趋势分析、实验优化 |
| 设备管理 | 故障预测、设备状态、设备巡检 |
| 培训管理 | 培训经理仪表盘、质量巡检 |
| 审计与合规 | 决策审计追踪、配置版本比较、运行治理 |

---

## 关键文件说明

```
apps/admin-web/
├── app/                    # Next.js App Router 页面与路由
│   ├── admin/              # 管理后台路由组
│   ├── agents/             # AI Agent 相关页面
│   ├── alerts/             # 告警管理相关页面
│   ├── analytics/          # 数据分析页面
│   ├── api/                # Next.js API Route
│   ├── approvals/          # 审批流程
│   ├── bootstrap.ts        # 应用启动引导
│   └── ...                 # 其他功能路由组
├── app/__e2e__/            # E2E 测试
├── types/                  # 类型定义
├── next.config.mjs         # Next.js 配置
├── next.config.performance.js  # 性能优化配置
├── .test-setup.mjs         # 测试环境配置
├── Dockerfile              # 容器化 Docker 配置
├── package.json            # 包信息 (@m5/admin-web)
└── tsconfig.json           # TypeScript 配置
```

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript 5.8 |
| UI | Ant Design 6 + @ant-design/icons |
| 组件库 | @m5/ui (workspace) |
| 领域层 | @m5/domain / @m5/sdk / @m5/types |
| 测试 | Node Test Runner + @testing-library/react |
| 构建 | pnpm workspace (monorepo) |

---

## 开发命令

```bash
pnpm dev           # 启动开发服务器
pnpm build         # 生产构建
pnpm start         # 生产模式启动
pnpm lint          # ESLint 检查
pnpm typecheck     # TypeScript 类型检查
pnpm test          # 运行测试
```

---

## Owner

- **维护团队**: 神机营前端组 (M5 FE Team)
- **Owner**: yaoyunzhong
