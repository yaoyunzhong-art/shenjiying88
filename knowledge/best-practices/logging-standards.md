# Best Practice · Logging Standards (日志规范)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🟡 P1
> 来源: NestJS Logger + Phase-15+ 实战

---

## 1. 🎯 目标

统一日志格式,确保:
- ✅ 结构化 JSON (便于 ELK / Loki 检索)
- ✅ 必须含 tenantId / userId / requestId
- ✅ 日志级别明确 (debug / info / warn / error)
- ✅ 敏感信息脱敏 (密码 / token / 卡号)

---

## 2. 📐 日志级别

| 级别 | 用途 | 示例 |
|---|---|---|
| debug | 调试信息 (生产默认关闭) | SQL 查询 / 缓存命中 |
| info | 业务流程节点 | 用户注册 / 订单创建 |
| warn | 异常但可恢复 | 重试 / 软上限触发 / fallback |
| error | 错误 (需介入) | 异常抛出 / DB 故障 |
| fatal | 致命 (服务不可用) | OOM / 配置错误 |

---

## 3. ✅ 结构化日志格式

```typescript
// apps/api/src/common/logger/structured.logger.ts
@Injectable()
export class StructuredLogger {
  log(context: Record<string, any>, message: string) {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      service: 'shenjiying-api',
      version: process.env.APP_VERSION,
      requestId: this.requestContext.getRequestId(),
      tenantId: this.requestContext.getTenantId(),
      userId: this.requestContext.getUserId(),
      ...context,
      message,
    }))
  }

  error(context: Record<string, any>, message: string) {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      service: 'shenjiying-api',
      requestId: this.requestContext.getRequestId(),
      ...context,
      message,
    }))
  }
}
```

---

## 4. ✅ 敏感信息脱敏

```typescript
// ❌ 反例: 明文记录密码
this.logger.log({ password: dto.password }, 'user login')

// ✅ 正确: 脱敏
this.logger.log({
  email: dto.email,
  password: '***',  // 或不输出
  loginMethod: 'password',
}, 'user login')

// 通用脱敏工具
export function maskSensitive(obj: any): any {
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'creditCard']
  const masked = { ...obj }
  for (const key of sensitiveKeys) {
    if (masked[key]) masked[key] = '***'
  }
  return masked
}
```

---

## 5. ✅ 必须含字段

```typescript
// 每个日志必须含:
{
  timestamp: '2026-06-26T10:00:00.000Z',
  level: 'info',
  service: 'shenjiying-api',
  requestId: 'req-uuid-xxx',        // 链路追踪 ID
  tenantId: 'tenant-uuid-xxx',      // 多租户隔离
  userId: 'user-uuid-xxx',          // 操作用户
  // ... 业务 context
  message: 'human-readable message',
}
```

---

## 6. ✅ 日志检索最佳实践

```
# 错误日志
level:error AND tenantId:tenant-A

# 慢查询
durationMs:>1000 AND service:api

# 某租户全量操作
tenantId:tenant-A AND requestId:req-uuid-xxx
```

---

## 7. ❌ 反模式

- ❌ 自由文本日志 ('注册失败了')
- ❌ 打印整个对象 (含敏感字段)
- ❌ 多行日志 (栈追踪可用 stack 字段)
- ❌ console.log (生产无 context)

---

## 8. 🔗 关联

- [error-handling.md](./error-handling.md) · 错误处理
- [monitoring-observability.md](./monitoring-observability.md) · 监控
