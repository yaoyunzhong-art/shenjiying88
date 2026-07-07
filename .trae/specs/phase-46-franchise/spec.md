# Phase-46 招商加盟 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:14 CST
> **Phase**: P3 商业化
> **预计**: 3 天

---

## 1. 业务目标

招商加盟是 SaaS 平台扩张核心:
- **加盟申请**: 在线提交资质审核
- **加盟商管理**: 加盟商分级/区域/合同
- **抽佣分成**: 营业额分成/管理费
- **培训认证**: 加盟商培训体系
- **物料供应**: 统一采购供应

依赖 Phase-45 订阅 + Phase-38 财务。

---

## 2. 数据模型

### Franchise (加盟商)
```typescript
interface Franchise {
  id: string
  tenantId: string              // 加盟商租户
  brandId: string
  level: 'A' | 'B' | 'C' | 'D'   // 加盟商分级
  region: string                 // 区域编码
  contractStart: string
  contractEnd: string
  commissionRate: number         // 抽佣比例 0-1
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
}
```

### FranchiseApplication (加盟申请)
```typescript
interface FranchiseApplication {
  id: string
  applicantName: string
  applicantPhone: string
  applicantEmail: string
  businessLicense: string        // 营业执照 URL
  desiredRegion: string
  investmentCapacity: number     // 投资能力(元)
  status: 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED'
  reviewerNotes?: string
}
```

### Commission (抽佣记录)
```typescript
interface Commission {
  id: string
  franchiseId: string
  period: string                 // YYYY-MM
  salesCents: number
  commissionCents: number
  status: 'PENDING' | 'PAID'
  paidAt?: string
}
```

---

## 3. 任务卡 (T176)

| T-NN | 标题 | 估时 |
|------|------|------|
| T176-1 | 加盟申请 + 审核流 | 1d |
| T176-2 | 加盟商分级 + 抽佣 | 1d |
| T176-3 | 加盟商门户 + 报表 | 1d |

**总计**: 3 天

---

## 4. Champion 督导
- E43 张区域总监 (区域加盟)
- E41 王集团董事长 (加盟战略)

---

## 5. 关键决策待定
1. **加盟等级**: 3 / 4 / 5 级?
2. **抽佣模式**: 固定比例 / 阶梯 / 累进?
3. **区域保护**: 同区域是否限制数量?
4. **合同期限**: 1 / 3 / 5 年?
5. **退出机制**: 提前退出违约金?

---

> 🦞 **"Phase-46 招商加盟 = P3 商业化第 2 步 = 规模扩张"**---

## V3 Decision Lock · 2026-06-27 22:32 CST

### D1 Franchise Mode: Regional exclusive (city-level)
- City exclusive: 1 franchisee per city (核心城市)
- Regional multi: 2-3 franchisees per region (非核心)
- Protect radius: 3km (no same-brand store within)

### D2 Franchise Fee: One-time ¥50k + annual ¥10k
- Initial: ¥50,000 (one-time)
- Annual: ¥10,000 (system + training)
- Refund: 80% if quit within 1 year

### D3 Royalty: Tiered (revenue share)
- Tier 1 (revenue < ¥100k/mo): 5%
- Tier 2 (¥100k-500k): 3%
- Tier 3 (> ¥500k): 2%
- Auto monthly settlement (T+5)

### D4 Exit: Bond ¥20k deductible
- Bond: ¥20,000 deposit
- Deductible: brand violation / quality issues
- Refund: full after 3 years good standing

### D5 Training: Online + offline hybrid
- Online: 40 video lessons + quizzes (asynchronous)
- Offline: 3-day bootcamp (HQ, mandatory)
- Certification: required before opening

---

> Phase-46 = Franchise = scale expansion channel