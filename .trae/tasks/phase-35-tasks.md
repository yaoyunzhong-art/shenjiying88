# T164 · SSE 订单事件流任务卡

## 元信息
- **T-NN**: T164
- **Phase**: 35
- **标题**: SSE 订单事件流 (业务事件接入 AgentService → SSE → 收银终端)
- **优先级**: 🟡 P1 (高)
- **估时**: 0.5 天 (4h)
- **创建日期**: 2026-06-27
- **派发人**: 🦞 龙虾哥
- **执行人**: 🌲 树哥trae (前台 8h 双手)

## 依赖
- ✅ Phase-30 SSE 集成层 (HTTP SSE 端点)
- ✅ Phase-33 EventStore 持久化 (Postgres changefeed)
- ✅ T162 收银 REST API (订单端点)
- ✅ T163 SSE 事件流 (5 类事件基础)
- ✅ Phase-34 view-model 强制 tenantId (租户隔离)

## 验收标准 (AC · 8 项)

### AC-1: 业务事件 emit (3 事件)
- [ ] AgentService `runStream` 中,订单状态变化时 emit `order.created` / `order.paid` / `order.cancelled`
- [ ] 事件 payload 包含 `tenantId`, `orderId`, `status`, `timestamp`, `amount`
- [ ] 事件 emit 失败不阻塞业务流(异步 emit + retry)

### AC-2: SSE 端点订阅
- [ ] 新增 SSE 端点 `GET /api/orders/events` (Phase-30 SSE 模式)
- [ ] 端点必须 `x-tenant-id` header,缺失返回 401
- [ ] 端点支持 `?orderId=xxx` 过滤(只推该订单事件)

### AC-3: 收银终端订阅
- [ ] 收银台前端 `apps/web/app/cashier/orders/[id]/page.tsx` 自动订阅 `/api/orders/events`
- [ ] 收银员 B 在 tenant-A 终端 1 创建订单, 收银员 A 在 tenant-A 终端 2 立即看到
- [ ] 收银员 C 在 tenant-B 终端 3 看不到 tenant-A 订单(租户隔离)

### AC-4: EventStore 持久化 (复用 R-33)
- [ ] 业务事件写入 EventStore (Phase-33)
- [ ] EventStore 包含 `tenantId`, `orderId`, `eventType`, `payload`, `timestamp`
- [ ] 可回放: 重启 SSE 服务后,从 EventStore 恢复最新事件

### AC-5: 静态扫描 (grep token)
- [ ] `grep -q 'order.created' apps/api/src/modules/cashier/cashier.sse.ts` 命中
- [ ] `grep -q 'tenantId' apps/api/src/modules/cashier/cashier.sse.ts` 命中
- [ ] `grep -q 'EventStore' apps/api/src/modules/cashier/cashier.sse.ts` 命中

### AC-6: E2E 测试 (5 断言)
- [ ] `scripts/phase35-e2e-cashier.ts` 中含 SSE 订单事件流测试
- [ ] 断言 1: 订单创建 → SSE 收到 `order.created` 事件
- [ ] 断言 2: 多终端订阅 → 所有终端都收到事件
- [ ] 断言 3: 跨租户隔离 → tenant-B 收不到 tenant-A 事件
- [ ] 断言 4: EventStore 持久化 → 重启后从持久化恢复
- [ ] 断言 5: 收银员 B 取消订单 → 收银员 A 立即看到 `order.cancelled`

### AC-7: 反模式库 v4 命中
- [ ] `tsx-decorator-pitfall`: SSE 控制器装饰器用 `pnpm build` 编译后再 E2E
- [ ] `async-try-catch-pattern`: 业务事件 emit 用局部 try-catch + Error 传播
- [ ] `residual-pending-state`: 订单状态机闭合,PENDING 30min 自动 TIMEOUT

### AC-8: race-safe commit
- [ ] commit 前跑 `bash scripts/race-safe-commit.sh "T164 SSE 订单事件流"`
- [ ] commit message 含 `Phase-35 step 7: T164 SSE 订单事件流`
- [ ] R-06 强化标记: `🛡️ R-06 race-safe`

---

## 实施步骤 (4 步)

### Step 1: 业务事件 emit (1.5h)
- 文件: `apps/api/src/modules/agent/agent.service.ts`
- 修改: `runStream` 中,工具调用后 emit 业务事件
- 工具: `events/business-event.emitter.ts` (新增)
- 关键: `EventEmitter2` 异步 emit + 重试

### Step 2: SSE 端点订阅 (1h)
- 文件: `apps/api/src/modules/cashier/cashier.sse.ts` (新增)
- 端点: `GET /api/orders/events` `@Sse()`
- 守卫: `TenantGuard` 强制租户隔离
- 关键: `Subject` + `merge` 多事件流

### Step 3: EventStore 集成 (0.5h)
- 复用 Phase-33 `EventStoreService`
- 在 `business-event.emitter.ts` 中写入 EventStore
- 关键: 事务一致性(订单状态 + 事件)

### Step 4: 前端订阅 + E2E (1h)
- 文件: `apps/web/app/cashier/orders/[id]/page.tsx`
- 工具: `useOrderEvents(orderId)` hook (复用 Phase-30 SDK)
- E2E: `scripts/phase35-e2e-cashier.ts` 添加 T164 测试

---

## 实施细节

### 业务事件 emit 模板
```typescript
// apps/api/src/modules/cashier/events/business-event.emitter.ts
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';

export type BusinessEvent =
  | { type: 'order.created'; tenantId: string; orderId: string; amount: number; createdAt: string }
  | { type: 'order.paid'; tenantId: string; orderId: string; paidAt: string; idempotencyKey: string }
  | { type: 'order.cancelled'; tenantId: string; orderId: string; cancelledBy: string; reason: string }
  | { type: 'order.timeout'; tenantId: string; orderId: string; timeoutAt: string }
  | { type: 'order.refunded'; tenantId: string; orderId: string; refundedAt: string; amount: number };

@Injectable()
export class BusinessEventEmitter {
  private readonly logger = new Logger(BusinessEventEmitter.name);

  constructor(private readonly emitter: EventEmitter2) {}

  async emit(event: BusinessEvent): Promise<void> {
    try {
      this.emitter.emit('business', event);
      // 同步写 EventStore
      await this.eventStore.append(event);
    } catch (e) {
      this.logger.error({ event, err: e }, '业务事件 emit 失败 (异步重试)');
      // 异步重试,不阻塞业务流
      setTimeout(() => this.emit(event).catch(() => {}), 1000);
    }
  }
}
```

### SSE 端点模板
```typescript
// apps/api/src/modules/cashier/cashier.sse.ts
import { Controller, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import { Observable, Subject, merge } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { TenantGuard } from '../agent/tenant.guard';
import { BusinessEventEmitter, BusinessEvent } from './events/business-event.emitter';

@Controller('api/orders')
@UseGuards(TenantGuard)
export class CashierSseController {
  private eventSubject = new Subject<MessageEvent>();

  constructor(private readonly emitter: BusinessEventEmitter) {
    // 订阅业务事件
    this.emitter.on('business', (event: BusinessEvent) => {
      this.eventSubject.next({ data: event });
    });
  }

  @Sse('events')
  events(@Query() query: { orderId?: string }, @Req() req: any): Observable<MessageEvent> {
    return this.eventSubject.asObservable().pipe(
      filter(event => {
        const data = event.data as BusinessEvent;
        // 租户隔离
        if (data.tenantId !== req.tenantId) return false;
        // 订单过滤
        if (query.orderId && 'orderId' in data && data.orderId !== query.orderId) return false;
        return true;
      }),
      map(event => ({ data: event.data, id: `evt-${Date.now()}`, type: 'business' }))
    );
  }
}
```

### 前端订阅 hook
```typescript
// apps/web/lib/hooks/useOrderEvents.ts
import { useEffect, useState } from 'react';
import { useSSE } from '@shenjiying/sdk';

export function useOrderEvents(orderId: string) {
  const [events, setEvents] = useState<BusinessEvent[]>([]);

  useEffect(() => {
    const sse = useSSE(`/api/orders/events?orderId=${orderId}`);
    sse.on('message', (event) => {
      setEvents(prev => [...prev, JSON.parse(event.data)]);
    });
    return () => sse.close();
  }, [orderId]);

  return events;
}
```

---

## 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| SSE 端点拒绝跨租户 | 中 | 高 | TenantGuard + 静态扫描验证 tenantId 过滤 |
| EventStore 写入失败 | 低 | 中 | 异步重试 + 业务流不阻塞 |
| 前端 hook 重连风暴 | 中 | 中 | 复用 Phase-32 指数退避 (1s/2s/4s) |
| 业务事件 emit 失败 | 低 | 高 | try-catch + 异步重试 + 告警 |

---

## 上游产出 (给后续 task)

- T165 收尾: E2E + retro 引用 T164 的事件流测试

---

## 反模式库 v4 自检 (跑前必做)

```bash
# 在 commit 前跑反模式自检
grep -r --include="*.ts" -l "process\.exit" apps/api/src/modules/cashier/ | head -5
# 期望: 空 (无 process.exit 滥用)

grep -r --include="*.ts" -l "TODO\|FIXME" apps/api/src/modules/cashier/ | head -5
# 期望: < 3 个 (TODO 累积 < 阈值)
```

---

## 提交格式

```
🛡️ R-06 race-safe auto-commit

Phase-35 step 7: T164 SSE 订单事件流
- BusinessEventEmitter (events/business-event.emitter.ts)
- CashierSseController (cashier.sse.ts)
- useOrderEvents hook (apps/web/lib/hooks/)
- E2E 5 断言 (scripts/phase35-e2e-cashier.ts)
- 反模式库 v4 命中: 3/4 (ts-decorator, async-try, pending-state)
- 静态扫描: 3/3 grep token 命中
- R-06 防御: race-safe auto-commit + HEARTBEAT.record
```

---

> 🦞 **"T164 = 业务事件流 + SSE 收银台协同 + 租户隔离 + 反模式库 v4 = Phase-35 收银台 业务闭环"**