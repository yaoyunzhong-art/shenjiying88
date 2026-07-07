# Phase-36 派发 Brief · 2026-06-27 (V3 现状对齐版)

> **派发时间**: 2026-06-27 21:43 CST
> **派发人**: 🦞 龙虾哥 (后台 22h 大脑级)
> **执行人**: 🌲 树哥trae (前台 8h 双手)
> **目标**: Phase-36 会员管理 (T166-1 启动)
> **Champion 督导**: E42 李事业部总经理 + E19 王运营总监

---

## ⚠️ 重要调整 (V1 → V3 现状盘点)

经 🦞 派发前必做现状盘点(今日学习),**Phase-36 已 95% 就位**:

### ✅ 已完成 (22 文件 18641 行,397/397 PASS)
- ✅ `member.entity.ts` (284 行) - 5 档等级 + MEMBER_LEVEL_THRESHOLDS 已硬编码
- ✅ `member.service.ts` (2903 行) - Prisma 集成 + 业务全闭环
- ✅ `member.controller.ts` (300 行) - REST API
- ✅ 22 文件全 397/397 PASS

### ✅ D1 已实现 (Prisma line 291)
- ✅ `User.mobile @unique` 全局唯一 (DB 约束)
- ✅ Member 通过 userId → User 拿到 mobile

### 🟡 T166-1 真正待办 (D3 可配置 + D2 阈值迁入)
- ❌ 无 `member.config.ts` 配置中心
- ❌ 无 admin-web 配置界面
- ❌ 阈值硬编码,大飞哥要求可调

---

## 🚀 T166-1 任务派发

### T166-1 · Member 可配置中心 (0.5d / 4h)

**3 步实施**:

#### Step 1: 后端 member-config.ts (2h)
- 新建 `apps/api/src/modules/member/member-config.ts`
- `MemberConfig` interface (8 字段)
- `DEFAULT_MEMBER_CONFIG` 锁定默认值
- `MemberConfigService` 提供 get/update/getThreshold/getPointsRate

#### Step 2: admin-web 配置界面 (1.5h)
- 新建 `apps/admin-web/app/member/config/page.tsx`
- 表单:积分比例 + 等级阈值 + 休眠天数
- 保存调用 PATCH /api/member/config
- toast 反馈

#### Step 3: 测试 + commit (0.5h)
- `member-config.test.ts` ≥ 10 断言
- atomic commit + R-06 标记

**AC 验收**: 详见 [.trae/tasks/T166-1-member-config.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/.trae/tasks/T166-1-member-config.md) (8 AC)

---

## 🛡️ 红线纪律 (R-06 V2)

- ❌ `git reset --hard` 禁止
- ❌ `git commit --amend` 禁止
- ✅ 任何 commit 前必跑 `scripts/race-safe-commit.sh`
- ✅ HEARTBEAT.md 自动记录
- ✅ 任何 30 分钟卡住 → 升级 L2

---

## 📋 任务依赖图

```
T166-1 (Member 可配置) ──→ T166-2 (休眠 5 态)
                       └─→ T166-3 (跨租户)
                       └─→ T167 (自动升降级)
                       └─→ T168 (积分系统)
```

T166-1 是 Phase-36 的 **config 基础设施**,其他任务都依赖它。

---

## 📊 上下文背景

### Phase-36 业务背景

神机营 SaaS 已完成 P0 + Phase-35 收银台 100%。
Phase-36 会员管理 = SaaS 留存核心 = 业务深耕第 2 步。

### 关键依赖 (已就位 ✅)
- ✅ Phase-35 收银台 (订单 → 会员消费记录)
- ✅ Phase-31 多租户 (TenantGuard)
- ✅ Phase-33 EventStore (持久化)
- ✅ User.mobile @unique (D1)
- ✅ MemberLevel 5 档 + MEMBER_LEVEL_THRESHOLDS (D2)

---

## 🎯 T166-1 交付物 (🦞 验收清单)

- [ ] member-config.ts 创建 (8 字段 + service)
- [ ] admin-web 配置界面创建
- [ ] member-config.test.ts 10 断言全过
- [ ] atomic commit message 含 `🛡️ Phase-36 step 1: T166-1 Member 可配置中心`
- [ ] race-safe-commit.sh 已跑
- [ ] HEARTBEAT.md 无新增 R-06 Wipe
- [ ] 🦞 验收 (HEARTBEAT.md 追加)

---

## 📞 通信协议 (按 HANDSHAKE.md §3)

### 🌲 → 🦞 提交格式
```
🛡️ R-06 race-safe auto-commit

Phase-36 step 1: T166-1 Member 可配置中心
- apps/api/src/modules/member/member-config.ts (8 字段 + service)
- apps/admin-web/app/member/config/page.tsx (配置表单)
- apps/api/src/modules/member/member-config.test.ts (10 断言)
- 静态扫描: 3/3 grep token 命中
- 反模式库 v4: 2/2 命中
- R-06 防御: race-safe + HEARTBEAT.record
```

### 🚨 阻塞升级
任何 ≥30 分钟卡住立即升级 L2,不等。

### ✅ 验收
🦞 会在 HEARTBEAT.md 追加验收 + 准备 T166-2 任务卡。

---

> 🦞 **"T166-1 = 配置可调 = 后台运营灵活 = 大飞哥 D3 决策落地 = Phase-36 启动"**

派发完成:2026-06-27 21:43 CST
执行启动:🌲 树哥trae 接收后立即开始 Step 1