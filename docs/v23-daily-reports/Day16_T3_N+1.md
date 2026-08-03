# Day16 T3: N+1 查询修复报告

**日期**: 2026-07-26
**范围**: `apps/api/src/modules/member/member.service.ts`
**问题行**: L2557 (原) → L2637 (修复后)

---

## 问题定位

`listPersistentProfiles` 方法中存在经典的 N+1 查询问题：

```typescript
// 修复前 — 每个 profile 触发 3 次独立 DB 查询
for (const memberProfile of profiles) {
  const user = memberProfile.userId
    ? await this.prisma.user.findUnique({ where: { id: memberProfile.userId } })  // N 次
    : null
  const snapshot = await this.findSnapshotByMemberProfileId(...)  // N 次
  const extension = await this.findMemberProfileExtension(...)  // N 次
}
```

- profiles 上限 100 条
- 每条 3 次 DB 查询 → **最坏 300 次额外查询**（+1 次初始查询）
- 应优化为 **4 次查询**（1 次 profiles + 1 次 users + 1 次 snapshots + 1 次 extensions）

---

## 修复方案

### 1. 扩展 `getMemberProfileExtensionModel` 类型签名

添加 `findMany` 支持，使批量查询可用。

### 2. 新增批量查询方法

- **`batchFindSnapshotsByProfileIds()`** — 一次 `findMany` 查询所有 snapshot，按 `memberProfileId` 分组，取 `updatedAtFromSource desc` 最新的一条。
- **`batchFindMemberProfileExtensions()`** — 一次 `findMany` 查询所有 extension，生成 `Map<memberProfileId, extension>`。

### 3. 批量加载 user

直接使用 `this.prisma.user.findMany({ where: { id: { in: userIds } } })` 批量获取。

### 4. 重写 `listPersistentProfiles`

修复后的方法流程：

```typescript
// 1. 查询 profiles (1 次 DB)
const profiles = await this.prisma.memberProfile.findMany(...)

// 2. 批量预加载 user (1 次 DB)
const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } })

// 3. 批量预加载 snapshots (1 次 DB) 
const snapshotMap = await this.batchFindSnapshotsByProfileIds(profileIds, tenantContext)

// 4. 批量预加载 extensions (1 次 DB)
const extensionMap = await this.batchFindMemberProfileExtensions(profileIds)

// 5. 内存组装 — 无 DB 调用
for (const memberProfile of profiles) {
  const user = userMap.get(memberProfile.userId)
  const snapshot = snapshotMap.get(memberProfile.id)
  const extension = extensionMap.get(memberProfile.id)
  results.push(this.hydratePersistentProfile({ memberProfile, user, tenantContext, snapshot, extension }))
}
```

---

## 验证结果

```bash
$ npx tsc --noEmit
# 0 TypeScript 错误
```

- TypeScript 编译通过
- 查询次数从 **1 + 3N** 降至 **4 次**（N ≤ 100）
- 单个 profile 查询方法（`findSnapshotByMemberProfileId`、`findMemberProfileExtension`）保持不变，不影响其他调用点
- 逻辑语义完全一致：snapshot 取最新一条、extension 取 `memberProfileId` 匹配
