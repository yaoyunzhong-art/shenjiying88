import type { Metadata } from 'next'

import { loadAnomalyFrequencySnapshot } from './anomaly-frequency-data'
import AnomalyFrequencyClient from './anomaly-frequency-client'

export const metadata: Metadata = {
  title: '异常时序频率 - M5 指挥台',
  description:
    '门店/系统异常的时间分布监控。支持按严重程度（严重/警告/提示）和时间范围（24h/7d/30d）筛选，跟踪异常趋势和平均响应时长。',
  openGraph: {
    title: '异常时序频率 | 异常趋势监控',
    description: '门店/系统异常的时间分布监控，支持严重程度和时间范围筛选',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnomalyFrequencyPage() {
  const snapshot = await loadAnomalyFrequencySnapshot()
  return <AnomalyFrequencyClient snapshot={snapshot} />
}
