/**
 * AnomalyFrequencyPage — 异常时序频率监控页面
 *
 * 功能:
 * - 使用 AnomalyFrequencyTimeline 组件展示门店/系统异常的时间分布
 * - 提供筛选维度（严重程度/时间范围）
 * - 支持刷新
 *
 * 使用场景:
 * - 店长/运维查看各时段异常趋势
 * - 导购员查看最近异常告警频率
 */
import { AnomalyFrequencyClient } from './anomaly-frequency-client';
import { loadAdminGovernanceReadModel } from '../bootstrap';

export default async function AnomalyFrequencyPage() {
  const governance = await loadAdminGovernanceReadModel();
  return <AnomalyFrequencyClient initialGovernance={governance} />;
}
