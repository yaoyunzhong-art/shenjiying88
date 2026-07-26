# 公告管理 — Announcements

## 用途概述

公告管理是 Admin Web 后台的核心功能模块，面向 **系统管理员** 和 **运营主管**，提供公告的**发布、编辑、归档、删除、搜索、筛选与状态流转**能力。支持多分类（系统通知、促销活动、运营管理、紧急通知、制度政策）与优先级标注。

**角色视角:** 👔 系统管理员 / 📢 运营主管  
**权限控制:** `foundation.governance.read`

## 文件结构

```
announcements/
├── page.tsx                         # 公告列表页（完整 CRUD + 搜索筛选 + 分页）
├── page.test.tsx                    # L1+ 增强测试（正例/反例/边界）
├── error.tsx                        # 错误边界组件
├── loading.tsx                      # 加载态骨架屏
├── not-found.tsx                    # 404 页面
├── [id]/
│   ├── page.tsx                     # 公告详情页（编辑/状态流转/删除）
│   ├── page.test.tsx                # 详情页测试
│   └── loading.tsx                  # 详情加载态
```

## 核心数据模型

### Announcement

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 公告 ID |
| `title` | `string` | 公告标题（max 100 字符） |
| `category` | `AnnouncementCategory` | system / promotion / operation / emergency / policy |
| `status` | `AnnouncementStatus` | draft / published / archived |
| `priority` | `AnnouncementPriority` | high / normal / low |
| `summary` | `string` | 摘要（max 200 字符） |
| `content` | `string` | 正文内容 |
| `author` | `string` | 作者名 |
| `publishedAt` | `string` | 发布时间 |
| `readCount` | `number` | 阅读数 |
| `createdAt` | `string` | 创建时间 |
| `updatedAt` | `string` | 最后修改时间 |

### 状态流转图

```
  ┌───────┐   发布   ┌───────────┐   归档   ┌─────────┐
  │ Draft │ ──────→ │ Published │ ──────→ │ Archived │
  └───────┘         └───────────┘         └─────────┘
       ↑                                     │
       └───────── 可编辑 ────────────────────┘
```

## 核心功能

### 列表页（`page.tsx`）

- **统计卡片：** 公告总数、已发布、草稿、紧急数量、总阅读量
- **分类标签栏：** 全部 / 系统通知 / 维护公告 / 版本更新 / 活动通知（带分类计数）
- **搜索/筛选：** 标题+摘要搜索、分类下拉、状态下拉、排序（创建/发布时间/标题）、升降序
- **表格列表：** 标题、类型、优先级（颜色标签）、状态（Badge）、作者、阅读量、时间、操作按钮
- **操作列：** 编辑 / 发布（草稿→已发布）/ 归档（已发布→已归档）/ 删除（带确认弹窗）
- **新建表单：** 标题、类型、优先级、状态（草稿/立即发布）、摘要、内容（带校验）

### 详情页（`[id]/page.tsx`）

- 查看公告正文、元信息（类型、优先级、作者、阅读量、时间线）
- 状态流转按钮（草稿→发布 / 发布→归档）
- 行内编辑模式（标题、摘要、内容）
- 删除确认弹窗
- 详情操作栏（复制/导出/分享）

## 使用示例

### 示例 1：页面组件接入

```tsx
// 在 Next.js App Router 中加载公告管理列表页
// app/announcements/page.tsx
import AnnouncementsPage from './page'

export default function Page() {
  return <AnnouncementsPage />
}

// 页面内通过 AdminPermissionGate 控制权限
// AdminPermissionGate 组件会自动拦截无权限访问
```

### 示例 2：纯函数调用 — 筛选与统计

```typescript
import { filterAnnouncements, computeStats, validateForm, addAnnouncement } from './page'

// 按搜索词 + 分类 + 状态筛选
const results = filterAnnouncements(
  allAnnouncements,
  '系统升级',    // 搜索词
  'system',       // 分类筛选
  'published',    // 状态筛选
)

// 统计快照
const stats = computeStats(allAnnouncements)
// → { total: 11, published: 6, draft: 3, archived: 2, highPriority: 3, totalReads: 81420 }

// 表单校验
const errors = validateForm({ title: '', category: 'system', priority: 'high', summary: '', content: '' })
// → { title: '公告标题不能为空', summary: '公告摘要不能为空', content: '公告内容不能为空' }

// 新建公告
const updated = addAnnouncement(currentList, formData)
```

## 依赖关系

```
announcements/
├── @m5/ui              — UI 组件库（PageShell, SubmitButton, StatusBadge, WorkspaceBreadcrumb 等）
├── AdminPermissionGate  — 管理员权限栅栏（requiredPermission: foundation.governance.read）
├── useDetailActions     — 详情操作 hook（复制/导出/分享）
├── detail-workspace-registry — 标准面包屑与关闭链接构建器
└── (无后端 API 依赖，当前使用客户端 Mock 数据)
```

## 测试命令

```bash
# 在 apps/admin-web 目录下执行

# 运行全部测试（全量）
pnpm test

# 仅运行公告管理模块测试
node --import tsx --import ./.test-setup.mjs --test app/announcements/page.test.tsx
node --import tsx --import ./.test-setup.mjs --test app/announcements/\[id\]/page.test.tsx

# 使用 Vitest 运行（如已配置 vitest.config）
npx vitest run app/announcements/
```

## 维护者

- **维护者:** Admin Web 前端团队
- **最后修改:** 2026-07-26

## 交叉引用

- [Admin Web 入口](../../README.md) — Admin Web 应用文档
- [AdminPermissionGate](../components/admin-permission-gate.tsx) — 权限栅栏组件
- [useDetailActions](../components/use-detail-actions.ts) — 详情操作 Hook
- [detail-workspace-registry](../components/detail-workspace-registry.ts) — 详情页注册表
