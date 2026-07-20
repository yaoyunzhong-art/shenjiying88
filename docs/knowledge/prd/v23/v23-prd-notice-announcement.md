# 🗺️ PRD: 公告通知管理模块

> 状态: 🟢 已交付
> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅ TSC✅ PRD补写
> 关联Phase: V23
> 产出: `apps/api/src/modules/notice/`

---

## 1. 业务背景

企业运营过程中，管理方需要向门店、品牌或全体租户发送各类公告通知：系统升级通知、节假日安排、政策变更、重要提醒等。现有 `notification` 模块专注于消息模板 + 多渠道推送（Email/SMS/Push），但缺少面向公告场景的独立管理模块。

**现有基础**:
- `notification` 模块——消息模板定义 + 多渠道分发（通知渠道层）
- `push` 模块——设备推送/消息推送能力

**本次新增**: `notice` 模块，专注公告的 CRUD + 发布/下架/归档 + 已读追踪。

**业务收益**:
- 管理方可快速编写、发布公告，支持定时发布
- 公告按范围（系统/租户/品牌/门店）精准投放
- 已读追踪：了解公告触达情况，支持标记已读
- 置顶+排序：重要公告优先展示
- 发布审核流程：草稿→发布→归档的生命周期管理

---

## 2. 需求卡

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-NOT-01 | 创建公告（草稿） | P0 | 填写标题/内容/范围/作者等信息，返回 code（NOT- 开头）和 status=draft |
| RQ-NOT-02 | 发布公告（draft → published） | P0 | 仅草稿可发布，发布后记录 publishAt |
| RQ-NOT-03 | 归档公告（published → archived） | P0 | 仅已发布可归档，归档后记录 archivedAt |
| RQ-NOT-04 | 公告列表（支持筛选） | P1 | 按范围/状态/优先级/关键词/作者筛选，分页 |
| RQ-NOT-05 | 公告详情 | P1 | 查看公告完整内容 |
| RQ-NOT-06 | 更新公告（草稿态可编辑） | P1 | 标题/内容/范围/优先级等可修改 |
| RQ-NOT-07 | 删除公告（逻辑删除） | P1 | 已删除不可访问，列表默认排除 |
| RQ-NOT-08 | 标记已读 | P1 | 用户标记已读后 readCount+1，记录 readBy |
| RQ-NOT-09 | 已发布公告列表 | P2 | 仅返回 published 状态公告，内置置顶+时间排序 |
| RQ-NOT-10 | 已读状态查询 | P2 | 查询详情时返回当前用户是否已读 |

---

## 3. 验收卡

| AC | 场景 | 前置 | 预期 |
|:---|:-----|:-----|:-----|
| AC-NOT-01 | 创建公告草稿 | 填写完整信息 | 返回 code（NOT 开头），status=draft，readCount=0 |
| AC-NOT-02 | 发布公告 | 草稿公告 | status=published，publishedAt 不为空 |
| AC-NOT-03 | 归档公告 | 已发布公告 | status=archived，archivedAt 不为空 |
| AC-NOT-04 | 列表查询：按状态筛选 | 有 3 条不同状态公告 | 各筛选条件返回正确结果 |
| AC-NOT-05 | 列表查询：关键词搜索 | 标题含关键词 | 匹配到正确公告 |
| AC-NOT-06 | 列表查询：分页 | 有 25 条公告 | page=2, pageSize=10 返回第 11-20 条 |
| AC-NOT-07 | 公告详情 | 公告 id 正确 | 返回完整内容 |
| AC-NOT-08 | 公告详情：不存在 | 错误 id | 返回 null |
| AC-NOT-09 | 更新公告 | 草稿公告 | 标题/内容更新成功 |
| AC-NOT-10 | 删除公告（逻辑删除） | 草稿公告 | 列表不再展示，状态变为 deleted |
| AC-NOT-11 | 标记已读 | 公告已存在 | readCount 递增，readBy 含用户 id |
| AC-NOT-12 | 重复标记已读 | 用户已读该公告 | readCount 不变 |
| AC-NOT-13 | 已发布列表：排序 | 置顶 2 条 + 普通 3 条 | 置顶排在前面，同置顶按时间倒序 |
| AC-NOT-14 | 异常：非草稿不可发布 | status=published | 抛出错误 |
| AC-NOT-15 | 异常：非已发布不可归档 | status=draft | 抛出错误 |
| AC-NOT-16 | 10 条路由元数据注册 | — | 10 个端点全部注册 |

---

## 4. 数据模型

### Notice (公告通知)

```typescript
interface Notice {
  id: string
  code: string               // 公告编码 NOT-20260721-001
  title: string              // 标题（最多200字）
  content: string            // 正文（支持 Markdown，最多50000字）
  summary?: string           // 摘要（简短描述，最多500字）
  coverUrl?: string          // 封面图 URL
  scope: NoticeScope         // 范围
  priority: NoticePriority   // 优先级
  status: NoticeStatus       // 状态
  authorId: string
  authorName: string
  tenantId?: string          // 租户隔离
  brandId?: string
  storeId?: string
  scheduledAt?: string       // 定时发布
  publishedAt?: string       // 实际发布时间
  expireAt?: string           // 过期时间
  archivedAt?: string
  stickyOrder: number        // 置顶排序（数字越大越靠前）
  readBy: string[]           // 已读用户
  readCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
}
```

### NoticeScope (4 种范围)

| 编码 | 说明 |
|:-----|:-----|
| SYSTEM | 系统级公告（全平台可见） |
| TENANT | 租户级公告 |
| BRAND | 品牌级公告 |
| STORE | 门店级公告 |

### NoticePriority (4 级优先级)

| 编码 | 说明 |
|:-----|:-----|
| LOW | 低 |
| NORMAL | 普通 |
| HIGH | 高 |
| URGENT | 紧急 |

### NoticeStatus (4 种状态流转)

```
Draft ──publish──→ Published ──archive──→ Archived
  │                    │
  └──delete──→ Deleted └──delete──→ Deleted
(Draft/Published 不可逆) (已归档不可恢复)
```

---

## 5. API 端点

| 方法 | 路径 | 请求 | 响应 | 说明 |
|:----|:-----|:-----|:-----|:-----|
| POST | `/notices` | `{ title, content, scope, authorId, authorName, ... }` | `NoticeContract` | 创建公告草稿 |
| GET | `/notices` | `?scope&status&priority&authorId&keyword&page&pageSize` | `{ items, total }` | 公告列表（含筛选分页） |
| GET | `/notices/published` | `?scope&priority&page&pageSize` | `{ items, total }` | 已发布公告列表（内置排序） |
| GET | `/notices/:id` | `?userId` | `NoticeContract \| null` | 公告详情（含当前用户已读状态） |
| PATCH | `/notices/:id` | `{ title?, content?, scope?, ... }` | `NoticeContract` | 更新公告 |
| DELETE | `/notices/:id` | — | `{ id, code }` | 逻辑删除公告 |
| POST | `/notices/:id/publish` | — | `NoticeContract` | 发布公告 |
| POST | `/notices/:id/archive` | — | `NoticeContract` | 归档公告 |
| POST | `/notices/:id/read` | `{ userId, userName }` | `NoticeContract` | 标记已读 |

---

## 6. 接口草图

```typescript
// Controller
@Controller('notices')
@UseGuards(TenantGuard)
export class NoticeController {
  @Post('/')
  create(@Body() body: CreateNoticeDto): NoticeContract

  @Get('/')
  list(@Query() query: ListNoticeQueryDto): { items: NoticeListItemContract[]; total: number }

  @Get('published')
  listPublished(@Query() query: ListNoticeQueryDto): { items: NoticeListItemContract[]; total: number }

  @Get(':id')
  getById(@Param('id') id: string, @Query('userId') userId?: string): NoticeContract | null

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateNoticeDto): NoticeContract

  @Delete(':id')
  delete(@Param('id') id: string): { id: string; code: string }

  @Post(':id/publish')
  publish(@Param('id') id: string): NoticeContract

  @Post(':id/archive')
  archive(@Param('id') id: string): NoticeContract

  @Post(':id/read')
  markRead(@Param('id') id: string, @Body() body: MarkReadDto): NoticeContract
}
```

---

## 7. 不在范围

- 不涉及多渠道推送（用现有的 `notification` 模块做联动）
- 不包含公告审批流程（本次仅单步发布）
- 不含前端管理面板展示
- 不包含系统自动生成公告（如节假日自动通知）
- 不做附件/文件上传（coverUrl 使用外部 URL）

---

## 8. 影响面

| 端 | 影响范围 | 说明 |
|:---|:---------|:-----|
| ✅ API | `notice/` 模块 | 全新模块 7 个文件 |
| ✅ API | 实体 `notice.entity.ts` | 类型定义 + 状态/范围/优先级枚举 + factory |
| ✅ API | 合约 `notice.contract.ts` | 安全合约 + Mapper（含已读状态） |
| ✅ API | DTO `notice.dto.ts` | 请求/响应 DTO（class-validator 校验） |
| ✅ API | Service `notice.service.ts` | 业务逻辑（CRUD + 发布/归档/已读 + 列表） |
| ✅ API | Controller `notice.controller.ts` | 9 个端点 |
| ✅ API | Module `notice.module.ts` | NestJS Module 注册 |
| ✅ API | `app.module.ts` | 导入 NoticeModule |
| ❌ admin-web | 无 | 暂不涉及前端 |
| ❌ storefront | 无 | 暂不涉及前端 |

---

## 9. 验证方式

| 项 | 方法 | 说明 |
|:---|:-----|:-----|
| 单元测试 | `vitest run src/modules/notice/` | controller test + service test |
| 路由元数据 | `notice.controller.test.ts` | 10 个路由验证 |
| TSC | `tsc --noEmit` | 零错误 |
| 完整生命周期 | 创建→发布→归档 | 3 步状态流转验证 |
| 已读追踪 | 2 次 markRead | readCount 递增 + 重复标记不变 |
| 列表排序 | 置顶 + 普通公告 | stickyOrder 排序正确 |
