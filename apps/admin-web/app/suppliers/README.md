# suppliers — 供应商管理模块

> 多租户零售平台供应商全生命周期管理
> 角色视角: 👤采购管理 / 📊供应链 / 👔店长

**路径**: `apps/admin-web/app/suppliers/`

---

## 模块概述

供应商管理模块负责平台供应商的全生命周期管理，涵盖供应商信息录入、审核、评级、状态流转、合作监控等核心功能。支持多市场（中国大陆 / 美国）、多品类供应商管理，提供信用评级体系、不良率监控、合作时长追踪等分析能力。

---

## 核心功能

| 功能 | 说明 |
|------|------|
| **供应商列表** | 按名称/编码/联系人/分类多维搜索，支持状态/分类筛选、分页 |
| **供应商详情** | 完整信息查看（工商信息、联系信息、合作数据、信用评级） |
| **供应商表单** | 创建/编辑供应商信息，含字段验证、重复编码检测 |
| **状态流转** | pending_audit → active / blacklisted → paused → active → blacklisted |
| **信用评级体系** | AAA / AA / A / B / C 五级信用评分 |
| **统计概览** | 供应商总数、合作统计、总订单数、总金额、平均评分 |
| **不良率监控** | 缺陷率追踪，自动标记高风险供应商（defectRate > 10% → 黑名单） |
| **多市场支持** | cn-mainland（中国大陆）/ us-default（美国）双市场 |
| **品类分类** | 原材料、包装耗材、设备、物流配送、服务、其他 |
| **搜索过滤** | 支持名称/编码/联系人/电话/邮箱/分类/地址多字段搜索 |

---

## 目录结构

```
suppliers/
├── [id]/                       # 供应商详情页
│   ├── loading.tsx             # 骨架屏加载态
│   ├── page.test.tsx           # React Testing Library 组件测试
│   └── page.tsx                # 供应商完整详情（编辑/状态流转/基本信息）
├── form/                       # 供应商创建/编辑表单页
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── loading.tsx                 # 页面级加载态
├── not-found.tsx               # 404 页面
├── error.tsx                   # ErrorBoundary 兜底
├── page.tsx                    # 供应商列表主页（门店视角）
├── page.test.ts                # Node Test 页面测试
├── page.test.tsx               # React Testing Library 组件测试
├── suppliers-data.ts           # 核心数据类型 + Mock 数据 + 数据函数
├── suppliers.service.test.ts   # Service 层单元测试（Node Test: 7组 50+ 用例）
└── README.md                   # 本文件
```

---

## 核心数据模型

### SupplierItem

```typescript
interface SupplierItem {
  id: string                    // 供应商 ID
  code: string                  // 供应商编码（如 SUP-001）
  name: string                  // 供应商名称
  contactPerson: string         // 联系人
  contactPhone: string          // 联系电话
  email: string                 // 邮箱
  category: SupplierCategory    // 品类: raw_material | packaging | equipment | logistics | service | others
  status: SupplierStatus        // 状态: active | paused | blacklisted | pending_audit
  creditRating: SupplierCredit  // 信用评级: AAA | AA | A | B | C
  cooperationMonths: number     // 合作时长（月）
  totalOrders: number           // 累积订单数
  totalAmount: number           // 累积交易总额
  defectRate: number            // 不良率（0-100）
  avgDeliveryDays: number       // 平均发货天数
  address: string               // 地址
  marketCode: string            // 市场代码: cn-mainland / us-default
  createdBy: string             // 创建人
  createdAt: string             // 创建时间
  lastOrderAt: string           // 最近订单日期
}
```

### SupplierFormValues

```typescript
interface SupplierFormValues {
  name: string          // 供应商名称（2-50字符）
  code: string          // 编码（3-20字符，字母/数字/下划线/连字符）
  category: string      // 品类
  status: string        // 状态（创建默认为 pending_audit）
  contactPerson: string // 联系人
  contactPhone: string  // 联系电话（手机或固话格式）
  email: string         // 邮箱
  address: string       // 地址（≥5字符）
  creditRating: string  // 信用评级（创建默认为 B）
}
```

### 状态枚举

```typescript
type SupplierStatus = 'active' | 'paused' | 'blacklisted' | 'pending_audit';

const SUPPLIER_STATUS_MAP: Record<SupplierStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  active:        { label: '合作中', variant: 'success' },
  paused:        { label: '暂停合作', variant: 'warning' },
  blacklisted:   { label: '黑名单', variant: 'danger' },
  pending_audit: { label: '待审核', variant: 'info' },
};
```

### 状态流转

```
pending_audit ──→ active ──→ paused ──→ active
     │                ↓
     └──→ blacklisted (direct)
```

### 信用评级体系

| 评级 | 颜色 | 典型特征 |
|------|------|----------|
| AAA | `#22c55e` | defectRate ≤ 0.3%，合作稳定 |
| AA | `#34d399` | defectRate ≤ 0.6%，良好 |
| A | `#facc15` | 一般水平 |
| B | `#fb923c` | 需改进 |
| C | `#ef4444` | defectRate 高，如黑名单供应商 |

### 品类映射

```typescript
const SUPPLIER_CATEGORY_MAP: Record<SupplierCategory, string> = {
  raw_material: '原材料',
  packaging:    '包装耗材',
  equipment:    '设备',
  logistics:    '物流配送',
  service:      '服务',
  others:       '其他',
};
```

---

## API 端点

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/suppliers` | 获取供应商列表 |
| GET | `/api/suppliers/{id}` | 供应商详情 |
| POST | `/api/suppliers` | 创建供应商 |
| PUT | `/api/suppliers/{id}` | 更新供应商信息 |
| PATCH | `/api/suppliers/{id}/status` | 状态变更 |
| GET | `/api/suppliers/stats` | 供应商统计数据 |
| GET | `/api/suppliers/{id}/orders` | 供应商关联订单 |

---

## 依赖关系

| 依赖 | 用途 |
|------|------|
| `@m5/ui` | PageShell, StatCard, StatusBadge, Tabs, DataTable, FormField, DetailShell, InfoRow 等 UI 组件 |
| `@m5/sdk` | API 客户端 |
| `apps/admin-web/app/components` | 通用组件（use-detail-actions, detail-workspace-registry） |
| `apps/admin-web/app/bootstrap` | 应用引导、租户上下文 |

---

## 使用示例

### 查询供应商

```typescript
// 按 ID 查询
const supplier = getSupplierById('sp-001')
// → { id: 'sp-001', name: '绿源食品有限公司', code: 'SUP-001', ... }

// 不存在的 ID
getSupplierById('non-existent')  // → undefined
```

### 统计计算

```typescript
const stats = computeSupplierStats(MOCK_SUPPLIERS)
// → {
//   total: 16,
//   active: 11,
//   paused: 2,
//   pendingAudit: 2,
//   blacklisted: 1,
//   totalOrders: 1642,
//   totalAmount: 48578000,
//   avgDefectRate: 1.7,
//   avgDeliveryDays: 4.6,
//   topCategory: 'raw_material',
// }
```

### 格式化金额

```typescript
formatCurrency(4_500_000)   // → "450.0万"
formatCurrency(45_000)      // → "4.50万"
formatCurrency(500)         // → "500"
formatCurrency(0)           // → "0"
```

### 表单验证

```typescript
validateForm({
  name: '',
  code: 'SUP-001',
  contactPerson: '',
  contactPhone: 'invalid',
  email: 'bad',
  address: '',
})
// → [
//   { field: 'name', message: '供应商名称不能为空' },
//   { field: 'contactPerson', message: '联系人不能为空' },
//   { field: 'contactPhone', message: '请输入有效的联系电话（手机号或固话）' },
//   { field: 'email', message: '邮箱格式不正确' },
//   { field: 'address', message: '地址不能为空' },
// ]
```

### 状态筛选组合

```typescript
// 活跃的原材料供应商
MOCK_SUPPLIERS.filter(s => s.status === 'active' && s.category === 'raw_material')
// → 绿源食品、鲜生活食材配送、华北粮油批发市场、欧风烘焙原料进口

// 暂停合作的设备供应商
MOCK_SUPPLIERS.filter(s => s.status === 'paused' && s.category === 'equipment')
// → 锦华设备制造厂
```

### 合作排序

```typescript
// 累积交易额 TOP 3
[...MOCK_SUPPLIERS].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 3)
// → 1. Global Trade Logistics (15.8M)
// → 2. 海龙物流集团 (7.2M)
// → 3. 欧风烘焙原料进口 (4.5M)

// 不良率最高
[...MOCK_SUPPLIERS].sort((a, b) => b.defectRate - a.defectRate)[0]
// → 源广达食材供应链 (12.3%)
```

---

## 测试说明

### 测试文件

| 文件 | 类型 | 覆盖范围 |
|------|------|----------|
| `suppliers.service.test.ts` | Node Test (node:test) | **7 组 50+ 测试用例** — 核心业务逻辑全覆盖 |
| `page.test.ts` | Node Test | 页面级列表功能、搜索筛选、分页 |
| `page.test.tsx` | React Testing Library | 列表页 UI 测试 |
| `[id]/page.test.tsx` | React Testing Library | 详情页渲染与交互测试 |
| `form/page.test.tsx` | React Testing Library | 表单页渲染与验证测试 |

### 测试分组（suppliers.service.test.ts）

| 组 | 覆盖 | 用例数 |
|----|------|--------|
| 信息查询 | getSupplierById、唯一性、枚举有效性 | 7 |
| 等级评估 | 信用评级映射、不良率关联 | 5 |
| 合作状态 | 各状态数据一致性、状态映射 | 6 |
| 统计计算 | computeSupplierStats 完整覆盖 | 10 |
| 类别与映射 | 枚举完整性、搜索/列字段 | 4 |
| 历史记录 | 合作时长、订单排行、市场分组 | 6 |
| 边界条件 | 0值处理、单价/数量极端、格式函数 | 6 |

### 运行测试

```bash
# 运行 Service 层测试（核心）
node --test apps/admin-web/app/suppliers/suppliers.service.test.ts

# 运行页面级 Node Test
node --test apps/admin-web/app/suppliers/page.test.ts

# 运行所有供应商测试
find apps/admin-web/app/suppliers -name '*.test.ts' -o -name '*.test.tsx' | xargs node --test
```

### 测试覆盖

- ✅ getSupplierById 正常/不存在/空字符串
- ✅ computeSupplierStats 正常/空数组/全字段计算
- ✅ 所有状态/品类/信用枚举完整性
- ✅ 状态流转一致性（paused无新订单、pending_audit零数据）
- ✅ 不良率与信用评级关联（黑名单 → C级）
- ✅ 市场份额统计（中美双市场）
- ✅ 排序算法（交易额/不良率/合作时长）
- ✅ 格式函数（万级/小金额/零值）

---

## 安全基线 (Security Baseline)

- ✅ **输入验证** — 名称长度、编码格式、手机号格式、邮箱格式、地址长度
- ✅ **编码唯一性检查** — 创建时检测 `code` 重复，如 SUP-001 已存在则拒绝
- ✅ **状态流转校验** — 只允许合法状态转换（如 pending_audit → active，不可直接跳转）
- ✅ **首次错误聚焦** — 表单验证失败时自动聚焦到第一个错误字段
- ✅ **提交防重** — submitting 状态下禁用重复提交
- ✅ **边界三态覆盖** — loading / error / not-found 每页面全覆盖

---

## 注意事项

1. **编码规范**: 供应商编码格式为 `SUP-XXX` 或 `SUP-XXXX`，创建后不可修改
2. **信用评级自动降级**: 不良率 > 10% 时系统自动触发黑名单警告
3. **暂停合作**: paused 状态供应商不产生新订单，但保留历史记录
4. **待审核流程**: 新创建的供应商默认 `pending_audit` 状态，需管理员审核通过后变为 `active`
5. **金额格式化**: 使用 `formatCurrency` 自动转换为"万"单位显示，底层存储使用完整数值
6. **多市场**: 编码规则按市场区分（如 us-default 市场使用不同编码体系）
7. **关联模块**: 与 `orders`（采购订单）、`finance/payouts`（供应商付款）模块深度联动
