# Phase-47 品牌管理 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:16 CST
> **Phase**: P3 商业化
> **预计**: 3 天

---

## 1. 业务目标

品牌管理是 SaaS 平台品牌资产核心:
- **品牌矩阵**: 集团多品牌管理
- **品牌视觉**: Logo/VI/色彩/字体统一
- **品牌资产**: 商标/域名/版权管理
- **品牌授权**: 加盟商使用规范
- **品牌保护**: 侵权监测 + 维权

依赖 Phase-46 加盟。

---

## 2. 数据模型

### Brand (品牌)
```typescript
interface Brand {
  id: string
  name: string
  slogan?: string
  logoUrl: string
  viConfig: VIStyle             // VI 配置
  status: 'ACTIVE' | 'INACTIVE'
  foundedAt: string
  parentBrandId?: string        // 子品牌归属
}

interface VIStyle {
  primaryColor: string          // #RRGGBB
  secondaryColor: string
  fontFamily: string
  logoVariants: LogoVariant[]
}

interface LogoVariant {
  url: string
  size: 'SMALL' | 'MEDIUM' | 'LARGE'
  format: 'PNG' | 'SVG' | 'JPG'
}
```

### Trademark (商标)
```typescript
interface Trademark {
  id: string
  brandId: string
  registrationNumber: string
  type: 'LOGO' | 'NAME' | 'SLOGAN'
  registeredAt: string
  expiresAt: string
  jurisdiction: string           // 'CN' / 'US' / etc.
  status: 'PENDING' | 'REGISTERED' | 'EXPIRED' | 'DISPUTED'
}
```

### BrandUsage (品牌使用记录)
```typescript
interface BrandUsage {
  id: string
  brandId: string
  tenantId: string
  context: 'LOGO_DISPLAY' | 'MARKETING' | 'PRODUCT_PACKAGING'
  url?: string
  compliant: boolean
  reviewedBy?: string
}
```

---

## 3. 任务卡 (T177)

| T-NN | 标题 | 估时 |
|------|------|------|
| T177-1 | 品牌矩阵 + VI 系统 | 1d |
| T177-2 | 商标 + 版权管理 | 1d |
| T177-3 | 品牌授权 + 合规检查 | 1d |

**总计**: 3 天

---

## 4. Champion 督导
- E43 张区域总监 (区域品牌落地)
- E41 王集团董事长 (品牌战略)

---

## 5. 关键决策待定
1. **品牌数量**: 集团可管理几个品牌?
2. **子品牌**: 是否支持子品牌层级?
3. **VI 规范**: 严格统一 vs 灵活定制?
4. **商标类别**: 商标分类管理?
5. **品牌联名**: 是否支持品牌联名?

---

> 🦞 **"Phase-47 品牌管理 = P3 商业化第 3 步 = 品牌资产"**---

## V3 Decision Lock · 2026-06-27 22:32 CST

### D1 Brand Architecture: Master + Sub-brands
- Master brand: 神机营 (platform)
- Sub-brands: per industry vertical (5 in V1)
- Co-branding: partner logos (limited)

### D2 Visual Assets: CloudFront CDN + version control
- Storage: AWS S3 + CloudFront CDN
- Version: git LFS for source files, CDN for prod
- Approval: ops team reviews before publish

### D3 Consistency Check: AI vision + manual sampling
- AI: 10% random photos via CV (logo presence)
- Manual: monthly field audit (10 stores)
- Score: 0-100, < 80 triggers warning

### D4 Co-marketing: Contract management module
- Contract: standard template + legal review
- Approval: dual sign-off (brand + legal)
- Tracking: campaign ROI dashboard

### D5 Crisis PR: Sentiment monitoring
- Tool: 微博/小红书/抖音 sentiment API
- Alert: negative > 20% baseline
- Response: 2-hour SLA

---

> Phase-47 = Brand Management = consistency + IP protection