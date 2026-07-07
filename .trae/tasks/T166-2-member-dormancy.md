# T166-2 · Member 休眠状态机任务卡

## 元信息
- **T-NN**: T166-2 (T166 拆分 3 子任务之二)
- **Phase**: 36
- **标题**: member.dormancy.ts + 状态机 + cron 检测
- **优先级**: 🟢 P1 (高, 大飞哥 D4 决策要求休眠判定)
- **估时**: 0.5d (4h)
- **创建日期**: 2026-06-27
- **派发人**: 🦞 龙虾哥
- **执行人**: 🌲 树哥trae
- **状态**: 🟡 派发中
- **依赖**: ✅ T166-1 MemberConfigService 已就位 (8 字段 + dormantDays/churnedDays)

---

## 1. 现状盘点

### ✅ 已就位
- `apps/api/src/modules/member/member-config.ts`: `lifecycle.dormantDays = 90` + `churnedDays = 180`
- `MemberStatus` 枚举: ACTIVE / FROZEN / EXPIRED / BLACKLISTED
- `member.service.ts`: getMember / updateMember 接口已就位
- `member-profile.lifecycleStage` 字段已存在 (prospect/newly-paid/repeat-paid/vip-active)

### ❌ 待建 (T166-2 真正待办)
- 状态机: ACTIVE → DORMANT → CHURNED → (REACTIVATE → ACTIVE)
- `member-dormancy.service.ts`: 状态转换 + cron 检测 + 通知
- `member-dormancy.controller.ts`: 管理接口 (manual dormancy wakeup)
- `member-dormancy.test.ts`: 8+ 测试断言

---

## 2. 验收标准 (AC · 8 项)

### AC-1: 状态枚举定义
- [ ] `MemberLifecycleStage` enum: ACTIVE / DORMANT / CHURNED
- [ ] 与 `MemberStatus` 区分: `MemberStatus` 是账户状态, `MemberLifecycleStage` 是活跃度
- [ ] 持久化字段 `lifecycleStage` + `lifecycleStageChangedAt`

### AC-2: 状态转换规则
- [ ] ACTIVE → DORMANT: `now - lastActiveAt >= dormantDays` (默认 90)
- [ ] DORMANT → CHURNED: `now - lastActiveAt >= churnedDays` (默认 180)
- [ ] *→ ACTIVE: 任何活跃行为触发 (下单/登录/积分变动)
- [ ] 非法转换抛 400 (DR-36 决策 1 风格)

### AC-3: 配置可调
- [ ] `MemberConfigService.getLifecycle()` 返回 `{ dormantDays, churnedDays }`
- [ ] 状态转换使用最新配置, 热更新后下次 cron 立即生效
- [ ] 反模式库 v4 防御: 不硬编码 dormantDays=90

### AC-4: cron 检测
- [ ] `MemberDormancyCron` 每小时跑一次 (`@Cron(CronExpression.EVERY_HOUR)`)
- [ ] 扫描所有 ACTIVE 会员, 检测应转入 DORMANT
- [ ] 扫描所有 DORMANT 会员, 检测应转入 CHURNED
- [ ] 状态变更 emit 事件 (可后续接 SSE)

### AC-5: 反模式库 v4 命中 (2 文件)
- [ ] [cron-job-pitfall.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/cron-job-pitfall.md): cron 重入 / 锁
- [ ] [async-try-catch-pattern.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/async-try-catch-pattern.md): 批量操作错误处理

### AC-6: 测试覆盖 (≥ 8 断言)
- [ ] `member-dormancy.test.ts` 新建
- [ ] 默认值断言 (8 字段)
- [ ] 状态转换断言 (ACTIVE→DORMANT/DORMANT→CHURNED)
- [ ] 配置变更后阈值变更断言
- [ ] 唤醒断言 (*→ACTIVE)
- [ ] 非法转换抛 400 断言

### AC-7: 唤醒机制
- [ ] `reactivate(memberId, tenantId)` 任意状态 → ACTIVE
- [ ] 重置 `lastActiveAt = now` + `lifecycleStageChangedAt = now`
- [ ] 记录 `lifecycleHistory[]` (审计追踪)

### AC-8: race-safe commit
- [ ] commit 前跑 `bash scripts/race-safe-commit.sh "T166-2 Member 休眠状态机"`
- [ ] commit message 含 `Phase-36 step 2: T166-2 Member 休眠状态机`

---

## 3. 实施步骤 (3 步)

### Step 1: member-dormancy.service.ts 后端 (2h)

```typescript
// apps/api/src/modules/member/member-dormancy.service.ts

export enum MemberLifecycleStage {
  Active = 'ACTIVE',
  Dormant = 'DORMANT',
  Churned = 'CHURNED'
}

export interface MemberLifecycleHistoryEntry {
  from: MemberLifecycleStage
  to: MemberLifecycleStage
  at: string
  reason: string
}

@Injectable()
export class MemberDormancyService {
  constructor(
    private readonly memberService: MemberService,
    private readonly configService: MemberConfigService,
    private readonly logger: Logger
  ) {}

  /**
   * cron 入口: 扫描所有会员并推进 lifecycleStage
   */
  async scanAndPromote(): Promise<{ dormant: number; churned: number }> {
    const { dormantDays, churnedDays } = this.configService.getLifecycle()
    const now = Date.now()
    const dormantThreshold = now - dormantDays * 86400_000
    const churnedThreshold = now - churnedDays * 86400_000

    let dormantCount = 0
    let churnedCount = 0

    const allMembers = this.memberService.listAll()
    for (const m of allMembers) {
      const last = m.lastActiveAt ? new Date(m.lastActiveAt).getTime() : new Date(m.registeredAt).getTime()
      const current = m.lifecycleStage ?? MemberLifecycleStage.Active

      if (current === MemberLifecycleStage.Active && last < dormantThreshold) {
        this.transition(m, MemberLifecycleStage.Dormant, `inactive for ${dormantDays} days`)
        dormantCount++
      } else if (current === MemberLifecycleStage.Dormant && last < churnedThreshold) {
        this.transition(m, MemberLifecycleStage.Churned, `inactive for ${churnedDays} days`)
        churnedCount++
      }
    }

    this.logger.log(`Dormancy scan: ${dormantCount}→DORMANT, ${churnedCount}→CHURNED`)
    return { dormant: dormantCount, churned: churnedCount }
  }

  /**
   * 唤醒: 任意状态 → ACTIVE
   */
  reactivate(memberId: string, tenantId: string, reason = 'manual'): MemberProfile {
    const m = this.memberService.getById(memberId, tenantId)
    if (!m) throw new NotFoundException(`member ${memberId} not found`)
    this.transition(m, MemberLifecycleStage.Active, reason)
    m.lastActiveAt = new Date().toISOString()
    return m
  }

  private transition(m: MemberProfile, to: MemberLifecycleStage, reason: string): void {
    const from = m.lifecycleStage ?? MemberLifecycleStage.Active
    if (from === to) return
    // 防御: CHURNED → ACTIVE 只能通过 reactivate (允许)
    // ACTIVE → CHURNED 非法跳级
    if (from === MemberLifecycleStage.Active && to === MemberLifecycleStage.Churned) {
      throw new BadRequestException('cannot skip DORMANT stage')
    }
    m.lifecycleStage = to
    m.lifecycleStageChangedAt = new Date().toISOString()
    m.lifecycleHistory = m.lifecycleHistory ?? []
    m.lifecycleHistory.push({ from, to, at: m.lifecycleStageChangedAt, reason })
    this.logger.log(`Member ${m.memberId} ${from}→${to} reason=${reason}`)
  }
}
```

### Step 2: cron 调度 + controller (1h)

```typescript
// apps/api/src/modules/member/member-dormancy.cron.ts
@Injectable()
export class MemberDormancyCron {
  constructor(private readonly dormancy: MemberDormancyService) {}
  
  @Cron(CronExpression.EVERY_HOUR)
  async hourlyScan() {
    const result = await this.dormancy.scanAndPromote()
    // emit metrics
  }
}

// apps/api/src/modules/member/member-dormancy.controller.ts
@Controller('api/member/dormancy')
@UseGuards(TenantGuard)
export class MemberDormancyController {
  @Post(':memberId/reactivate') async reactivate(...) { ... }
  @Get('stats') async stats() { ... }
  @Post('scan') async manualScan() { ... }  // admin-only
}
```

### Step 3: 测试 + commit (1h)

```typescript
// apps/api/src/modules/member/member-dormancy.test.ts
describe('MemberDormancyService', () => {
  test('ACTIVE→DORMANT after dormantDays', async () => { ... })
  test('DORMANT→CHURNED after churnedDays', async () => { ... })
  test('ACTIVE→CHURNED illegal skip throws 400', async () => { ... })
  test('config update: dormantDays=10 then next scan uses new threshold', async () => { ... })
  test('reactivate any→ACTIVE resets lastActiveAt', async () => { ... })
  test('reactivate records lifecycleHistory entry', async () => { ... })
  test('CHURNED→ACTIVE allowed only via reactivate', async () => { ... })
  test('scan returns counts { dormant, churned }', async () => { ... })
})
```

---

## 4. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| cron 重入 (上轮未跑完下轮触发) | 中 | 中 | 用 Redis 锁 (in-memory 锁 Phase-46 真实部署) |
| 批量更新慢 (10万会员) | 中 | 中 | 分批 1000/批, 每批 await |
| 配置变更瞬间不一致 | 低 | 中 | 每次扫描前读最新配置 |
| 误判 ACTIVE→CHURNED | 低 | 高 | 防御: 跳级抛 400, 必须经过 DORMANT |

---

## 5. 上下游依赖

### 上游 (✅ 已就位)
- T166-1 MemberConfigService: dormantDays / churnedDays 配置
- member.service: getById / listAll / updateMember

### 下游
- T167 库存: 休眠会员不下发推荐
- T168 财务: 流失会员触发召回营销
- T169 报表: 休眠率/流失率 KPI

---

## 6. 提交格式

```
🛡️ R-06 race-safe auto-commit

Phase-36 step 2: T166-2 Member 休眠状态机
- apps/api/src/modules/member/member-dormancy.service.ts (状态机 + 扫描 + 唤醒)
- apps/api/src/modules/member/member-dormancy.cron.ts (每小时 cron)
- apps/api/src/modules/member/member-dormancy.controller.ts (admin 接口)
- apps/api/src/modules/member/member-dormancy.test.ts (8 断言)
- 静态扫描: TenantGuard + ConfigService + lifecycleStage 命中
- 反模式库 v4: cron-job-pitfall + async-try-catch
- R-06 防御: race-safe + HEARTBEAT.record
```

---

> 🦞 **"T166-2 = 生命周期自动维护 = 数据资产保鲜 = D4 落地"**