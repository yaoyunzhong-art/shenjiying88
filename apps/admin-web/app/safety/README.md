# 安全配置管理模块 (Safety)

> 神机营体育 — admin-web 安全事件与隐患追踪快照页

## 定位

Safety 模块为管理员提供**安全事件、隐患与整改跟踪**的统一视图。采用快照（snapshot）交付模式，以只读面板呈现安全记录概况，不涉及 CRUD 操作，贴合「数据可观测」而非「数据管理」的设计理念。

## 路由

| 路径 | 文件 | 说明 |
|------|------|------|
| `/safety` | `page.tsx` | 安全记录概览页（Server Component） |

## 核心功能

- **统计看板** — 待处理、调查中、已解决、已关闭四类状态计数
- **严重等级分类** — low / medium / high / critical 四级标签体系
- **来源证据透出** — 页面顶部展示 deliveryMode、sourceLabel、refreshPath 等元信息
- **权限管控** — 通过 `<AdminPermissionGate>` 接入 admin 权限体系，需 `safety:read` 权限

### 路由辅助文件

| 文件 | 功能 |
|------|------|
| `loading.tsx` | Streaming SSR Suspense 骨架屏 |
| `error.tsx` | 客户端错误边界，支持重试 |
| `not-found.tsx` | 404 兜底页 |

## 技术栈

- Next.js App Router (Server Component / Client Component 混合)
- TypeScript 严格类型
- React Suspense + Streaming SSR
- 权限门禁模式 (`AdminPermissionGate`)

## 关键设计决策

1. **快照交付（snapshot delivery）** — 数据不直接来自实时 API，而是经过 `loadSafetySnapshot()` 聚合后的一次性快照，减少后端压力
2. **纯展示层** — 不包含创建、编辑、删除功能，所有安全记录由外部流程维护
3. **Server Component 主导** — 页面为 `async function` SSR，数据在服务端完成加载
4. **权限与 UI 分离** — 权限门禁作为包装组件，不侵入业务逻辑层

## 结构

```
safety/
├── page.tsx          # 安全记录概览页（SSR）
├── safety-data.ts    # 数据类型、状态映射、mock 数据工厂
├── loading.tsx       # Suspense 骨架屏
├── error.tsx         # 错误边界
├── not-found.tsx     # 404 兜底
└── page.test.tsx     # 页面测试
```

## 测试入口

- `page.test.tsx` — 页面渲染、数据加载、权限门禁验证

## 维护者

- 模块归属: Shenjiying Admin Team
- 权限审批: Admin Permission Gate (`safety:read`)
