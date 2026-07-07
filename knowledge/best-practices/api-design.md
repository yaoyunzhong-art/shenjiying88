# Best Practice · API Design (API 设计规范)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🟡 P1
> 来源: RESTful + NestJS + 神机营多 app

---

## 1. 🎯 目标

RESTful API 一致性:
- ✅ URL 命名规范
- ✅ HTTP 方法语义
- ✅ 状态码准确
- ✅ 请求 / 响应格式统一
- ✅ 错误响应一致

---

## 2. 📐 URL 命名

```
✅ 正确:
GET    /api/v1/members                 # 列表
GET    /api/v1/members/:id             # 详情
POST   /api/v1/members                 # 创建
PATCH  /api/v1/members/:id             # 部分更新
PUT    /api/v1/members/:id             # 完整替换
DELETE /api/v1/members/:id             # 删除
POST   /api/v1/members/:id/avatar      # 子资源操作
GET    /api/v1/members/:id/orders      # 关联资源

❌ 反例:
GET /api/v1/getMember?id=xxx           # 动词在 URL
GET /api/v1/members/getById/:id        # 动词冗余
POST /api/v1/createMember              # 动词冗余
POST /api/v1/members/delete/:id        # 应该用 DELETE
```

**命名规则**:
- 名词复数 (members, orders, coupons)
- 全部小写 + kebab-case
- 不含动词 (动词是 HTTP method)
- 不含版本 (版本在 URL prefix `/api/v1/`)

---

## 3. 📐 HTTP 方法语义

| Method | 幂等 | 安全 | 用途 |
|---|---|---|---|
| GET | ✅ | ✅ | 查询 |
| POST | ❌ | ❌ | 创建 / 复杂操作 |
| PUT | ✅ | ❌ | 完整替换 |
| PATCH | ❌ | ❌ | 部分更新 |
| DELETE | ✅ | ❌ | 删除 |

---

## 4. 📐 HTTP 状态码

| 状态码 | 含义 | 何时用 |
|---|---|---|
| 200 | OK | GET / PATCH / PUT 成功 |
| 201 | Created | POST 创建成功 |
| 204 | No Content | DELETE 成功 |
| 400 | Bad Request | 参数校验失败 |
| 401 | Unauthorized | 未登录 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源已存在 / 状态冲突 |
| 422 | Unprocessable Entity | 业务规则失败 |
| 429 | Too Many Requests | 限流触发 |
| 500 | Internal Server Error | 系统错误 |
| 502 | Bad Gateway | 上游服务故障 |
| 503 | Service Unavailable | 服务不可用 |

---

## 5. 📐 请求 / 响应格式

### 5.1 请求

```json
POST /api/v1/members
Content-Type: application/json
Idempotency-Key: uuid-xxx

{
  "email": "user@example.com",
  "name": "张三",
  "phone": "+86 138 0000 0000"
}
```

### 5.2 响应 (成功)

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "uuid-xxx",
    "email": "user@example.com",
    "name": "张三",
    "createdAt": "2026-06-26T10:00:00.000Z"
  },
  "meta": {
    "requestId": "req-uuid-xxx",
    "timestamp": "2026-06-26T10:00:00.000Z"
  }
}
```

### 5.3 响应 (错误)

```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "参数验证失败",
    "details": [
      { "field": "email", "message": "邮箱格式不正确" }
    ]
  },
  "meta": {
    "requestId": "req-uuid-xxx",
    "timestamp": "2026-06-26T10:00:00.000Z"
  }
}
```

### 5.4 列表分页

```json
GET /api/v1/members?page=1&pageSize=20&status=active

{
  "success": true,
  "data": [
    { "id": "uuid-1", ... },
    { "id": "uuid-2", ... }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 6. 📐 DTO 校验 (class-validator)

```typescript
import { IsEmail, IsString, Length, IsOptional } from 'class-validator'

export class CreateMemberDto {
  @IsEmail()
  email: string

  @IsString()
  @Length(2, 50)
  name: string

  @IsOptional()
  @IsString()
  @Matches(/^\+?\d{10,15}$/)
  phone?: string
}
```

---

## 7. 📐 版本管理

- URL 路径版本:`/api/v1/`, `/api/v2/` ✅ (推荐)
- Header 版本:`Api-Version: 2` ⚠️ (复杂)
- 无版本 (持续演进):❌ (不推荐)

**破坏性变更必须升版本**:
- 删除字段
- 修改字段类型
- 修改必填 → 选填 (反之)

---

## 8. 🔗 关联

- [error-handling.md](./error-handling.md) · 错误格式
- [multi-tenant-isolation.md](./multi-tenant-isolation.md) · 多租户 API
- [throttling-pattern.md](../patterns/throttling-pattern.md) · API 限流
