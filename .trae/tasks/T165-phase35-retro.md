# T165 · Phase-35 收尾任务卡

## 元信息
- **T-NN**: T165
- **Phase**: 35 (收官)
- **标题**: Phase-35 E2E 完善 + retro 文档
- **优先级**: 🟢 P1 (低,T164 完成后启动)
- **估时**: 0.5d
- **派发人**: 🦞 龙虾哥
- **执行人**: 🌲 树哥trae

---

## 1. 任务目标

Phase-35 收银台收官:
- ✅ T164 SSE 事件流 (D1)
- 🟡 **T165 E2E 完善 + retro** (D2 上午)

---

## 2. 验收标准 (AC · 6 项)

### AC-1: E2E 完整覆盖
- [ ] `phase35-e2e-sse.ts` 8 断言全过 (T164 已就位)
- [ ] 补充 SSE 重连场景 (Last-Event-ID)
- [ ] 补充跨租户 SSE 隔离

### AC-2: HEARTBEAT 收尾
- [ ] HEARTBEAT.md 追加 Phase-35 收官事件
- [ ] 标记 Phase-35 100% 完成
- [ ] 列出 Phase-35 关键成果 (175/175 + 21/21 E2E)

### AC-3: Phase-35 retro 文档
- [ ] `.trae/learnings/2026-06-XX-phase35-retro.md` 创建
- [ ] 包含 5 大决策落地状态 (DR-36)
- [ ] 列出已避免的反模式
- [ ] 给 Phase-36 经验教训

### AC-4: 反模式库 v4 增补
- [ ] 写一个新反模式 `cashier-sse-edge-cases.md`
- [ ] SSE 长连接 + 心跳 + 断线重连场景

### AC-5: race-safe commit
- [ ] commit 前跑 race-safe-commit.sh
- [ ] commit message 含 `Phase-35 step 5: T165 E2E + retro`

### AC-6: Champion review
- [ ] E42 李事业部总经理 review 签字
- [ ] HEARTBEAT.md 追加 review 记录

---

## 3. 实施步骤 (3 步)

### Step 1: E2E 补充 (1.5h)

```typescript
// apps/api/scripts/phase35-e2e-sse.ts 新增断言

test('9) SSE 重连 Last-Event-ID', async () => {
  // 模拟客户端断开 → 重连带 Last-Event-ID
  // 验证重连后从上次位置继续
})

test('10) SSE 心跳 keepalive', async () => {
  // 验证每 30s 发送心跳帧
})

test('11) SSE 跨租户隔离', async () => {
  // tenant-A 订阅看不到 tenant-B 事件
})
```

### Step 2: Retro 文档 (1h)

```markdown
# Phase-35 收银台 Retro · 2026-06-XX

## 1. 成果
- 175/175 单元 + 集成测试 PASS
- 21/21 E2E + 8 SSE 断言 PASS
- DR-36 5 大决策全部落地
- T164 SSE 11 类事件 + 3 端点

## 2. 反模式避免
- 旧测试死代码 (175→163 修复)
- ESM cwd 必要性
- 状态机闭合 + 乐观锁

## 3. Phase-36 经验
- 派发前必做盘点
- T166-1 配置中心复用
- T166-2 休眠状态机扩展
EOF
```

### Step 3: HEARTBEAT + commit (0.5h)

```bash
bash scripts/race-safe-commit.sh "Phase-35 step 5: T165 E2E 完善 + retro"
```

---

## 4. 提交格式

```
🛡️ R-06 race-safe auto-commit

Phase-35 step 5: T165 E2E + retro
- apps/api/scripts/phase35-e2e-sse.ts (新增 3 断言: 重连/心跳/跨租户)
- .trae/learnings/2026-06-XX-phase35-retro.md
- knowledge/anti-patterns/v4/cashier-sse-edge-cases.md
- HEARTBEAT.md 收尾 + Champion review
- 静态扫描: 3/3 命中
- R-06 防御: race-safe + HEARTBEAT.record
```

---

> 🦞 **"T165 = Phase-35 收官 = 业务深耕第 1 步 100%"**