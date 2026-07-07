# Phase-48 财务 SaaS Spec · V1 启动版

> **创建时间**: 2026-06-27 22:18 CST
> **Phase**: P3 商业化
> **预计**: 3 天

---

## 1. 业务目标

财务 SaaS 是集团财务管控核心:
- **总账管理**: 凭证/账簿/报表
- **应收应付**: AR/AP 管理
- **资金管理**: 银行账户/资金调拨
- **税务管理**: 增值税/企业所得税
- **审计支持**: 审计追踪 + 合规报表

依赖 Phase-38 财务对账 + Phase-45 订阅。

---

## 2. 数据模型

### LedgerEntry (总账分录)
```typescript
interface LedgerEntry {
  id: string
  tenantId: string
  journalId: string             // 凭证 ID
  accountCode: string            // 科目编码 1101/2202 etc.
  debitCents: number
  creditCents: number
  description: string
  postedAt: string
}
```

### Journal (凭证)
```typescript
interface Journal {
  id: string
  tenantId: string
  period: string                 // YYYY-MM
  type: 'MANUAL' | 'AUTO' | 'ADJUSTING'
  status: 'DRAFT' | 'POSTED' | 'REVERSED'
  entries: string[]              // LedgerEntry IDs
  totalDebitCents: number
  totalCreditCents: number       // 借贷必相等
  postedAt?: string
  postedBy?: string
}
```

### Account (会计科目)
```typescript
interface Account {
  code: string                   // '1101' 现金
  name: string                   // '库存现金'
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  parentCode?: string            // 上级科目
  normalBalance: 'DEBIT' | 'CREDIT'
  isActive: boolean
}
```

---

## 3. 任务卡 (T178)

| T-NN | 标题 | 估时 |
|------|------|------|
| T178-1 | 科目 + 凭证 | 1d |
| T178-2 | 应收应付 | 1d |
| T178-3 | 财务报表 + 税务 | 1d |

**总计**: 3 天

---

## 4. Champion 督导
- E41 王集团董事长 (集团财务)
- E42 李事业部总经理 (业务财务)

---

## 5. 关键决策待定
1. **会计准则**: 中国会计准则 / IFRS / US GAAP?
2. **多币种**: 是否支持多币种?
3. **税务对接**: 金税系统 / 航天信息?
4. **审计追踪**: 是否需要区块链?
5. **总账期间**: 月结 / 季结 / 灵活?

---

> 🦞 **"Phase-48 财务 SaaS = P3 商业化第 4 步 = 集团财务"**---

## V3 Decision Lock · 2026-06-27 22:32 CST

### D1 Accounting Standard: China GAAP (V1) → IFRS (V2 overseas)
- V1: China GAAP (中国会计准则)
- V2: IFRS (for overseas listing)
- Audit: Big-4 annually (PWC/Deloitte/EY/KPMG)

### D2 Tax System: 金税四期 + 用友/金蝶 integration
- 金税四期: government tax platform
- 用友/金蝶: ERP integration via API
- Auto-file: monthly VAT + annual corporate tax

### D3 Multi-currency: CNY only V1 → multi V2
- V1: CNY only
- V2: multi-currency (HKD/USD/EUR)
- FX rate: daily from PBOC

### D4 Audit Trail: Immutable log + 10-year retention
- Append-only log (PostgreSQL trigger)
- Hash chain (each entry references previous)
- Retention: 10 years (regulatory requirement)

### D5 Budget: Annual + quarterly + monthly
- Annual: strategic plan (board approval)
- Quarterly: re-forecast (CFO approval)
- Monthly: actual vs budget (variance report)

---

> Phase-48 = Finance SaaS = compliance + efficiency