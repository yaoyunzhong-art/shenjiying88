# 🧠 40人专家团洞察 · E45: 跨模块E2E测试数据隔离模式

> 提炼自 Pulse-Nightly-17 (2026-07-17)
> 专家角色: 测试架构师 / QA负责人
> 适用场景: 大型monorepo跨模块E2E测试

---

## 核心问题

在Node `node:test` 框架中执行跨模块E2E测试时, 多个 describe 块共享同一内存存储(模拟数据库)容易产生状态污染, 导致看似无关的测试之间相互影响。

## 发现模式

### 症状
1. **P1正例** 修改了会员消费数据 → **B1边界** 断言失败(因会员`lastVisitDays`被修改为0)
2. **N2反例** 创建了审批采购单 → **B2边界** 按状态查找时找到错误对象
3. **早段测试** 累积分群`memberCount` → **后段测试** 断言 `memberCount=4` 实际为5

### 根因
1. **浅拷贝**: `const store = [...mockData]` 仅复制数组, 内部对象仍是引用共享
2. **模糊查找**: `find(o => o.status === 'X')` 没有唯一标识
3. **无状态重置**: 未在每个 describe 前重置到初始状态

---

## 解决方案

### 1. 深拷贝数据源
```typescript
// ❌ 错误: 引用共享
const membersStore: MemberProfile[] = [...mockMembers];

// ✅ 正确: 深度拷贝每个对象
const membersStore: MemberProfile[] = mockMembers.map(m => ({ ...m }));
```

### 2. 每个describe使用test.before重置
```typescript
describe('B1 边界测试', () => {
  test.before(() => {
    store.length = 0;
    store.push(...mockData.map(d => ({ ...d })));
    // 重置统计计数器
    items.forEach(i => { i.count = 0; });
  });
  // ... tests
});
```

### 3. 使用唯一标识符代替模糊查找
```typescript
// ❌ 错误: 依赖状态匹配
const po = ordersStore.find(o => o.status === 'partially_received');

// ✅ 正确: 使用具体标识符跨测试传递
let poNumber = '';
test('创建PO', () => {
  const result = createPO(...);
  poNumber = result.order!.poNumber;
});
test('后续操作', () => {
  const result = receivePO(poNumber, ...);
});
```

### 4. 防重检查优先级最高
```typescript
// ✅ 先检查防重, 再检查状态
if (order.paymentStatus === 'success') return { error: '已支付，请勿重复' };
if (order.status !== 'pending_payment') return { error: '状态不允许' };
```

---

## 在管理员看板中的体现

本模式已应用于:
- 链28(会员分群): `membersStore` 深拷贝 + `test.before` 重置
- 链29(采购审批): `poNumber` 具体标识符传递
- 链30(点餐财务): `processPayment` 防重优先检查

## 推广到全部 30 链

建议未来在链 01-27 中逐步引入 test.before 重置机制, 消除累计状态副作用。
