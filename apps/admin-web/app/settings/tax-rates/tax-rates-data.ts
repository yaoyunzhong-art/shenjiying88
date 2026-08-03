export interface TaxRatePreview {
  category: string
  taxRate: string
  taxType: string
  effectiveDate: string
  invoiceMode: string
}

export interface TaxRuleItem {
  key: string
  value: string
}

export interface TaxRatesSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'tax-rates-fallback'
  generatedAt: string
  rates: TaxRatePreview[]
  rules: TaxRuleItem[]
  coverageSummary: {
    categories: number
    invoiceModes: number
    preferentialRateCount: number
  }
  error?: string
}

export const DEFAULT_TAX_RATES: TaxRatePreview[] = [
  {
    category: '食品饮料',
    taxRate: '13%',
    taxType: '增值税',
    effectiveDate: '2026-01-01',
    invoiceMode: '普通发票',
  },
  {
    category: '日用品',
    taxRate: '13%',
    taxType: '增值税',
    effectiveDate: '2026-01-01',
    invoiceMode: '普通发票',
  },
  {
    category: '电子产品',
    taxRate: '13%',
    taxType: '增值税',
    effectiveDate: '2026-01-01',
    invoiceMode: '增值税专票',
  },
  {
    category: '服务费',
    taxRate: '6%',
    taxType: '增值税',
    effectiveDate: '2026-01-01',
    invoiceMode: '普通发票 / 专票',
  },
]

export const DEFAULT_TAX_RULES: TaxRuleItem[] = [
  { key: '计税方式', value: '价外税（不含税金额 x 税率）' },
  { key: '舍入方式', value: '四舍五入到分' },
  { key: '含税显示', value: '前台展示含税价格' },
  { key: '发票类型', value: '普通发票 / 增值税专用发票' },
]

function getLatestTaxTimestamp(rates: TaxRatePreview[]): string {
  return [...rates]
    .map((item) => item.effectiveDate)
    .sort((left, right) => left.localeCompare(right))
    .at(-1)
    ?.concat('T00:00:00.000Z') ?? '2026-01-01T00:00:00.000Z'
}

export async function loadTaxRatesSnapshot(): Promise<TaxRatesSnapshotDelivery> {
  const generatedAt = getLatestTaxTimestamp(DEFAULT_TAX_RATES)
  const invoiceModes = new Set(DEFAULT_TAX_RATES.map((item) => item.invoiceMode))

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'tax-rates-fallback',
    generatedAt,
    rates: [...DEFAULT_TAX_RATES],
    rules: [...DEFAULT_TAX_RULES],
    coverageSummary: {
      categories: DEFAULT_TAX_RATES.length,
      invoiceModes: invoiceModes.size,
      preferentialRateCount: DEFAULT_TAX_RATES.filter((item) => item.taxRate !== '13%').length,
    },
    error: '税率治理实时接口尚未接入，当前展示 fallback 样本，不可作为闭环复签证据。',
  }
}
