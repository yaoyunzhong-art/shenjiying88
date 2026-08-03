import { MOCK_TRAININGS, computeTrainingStats } from '../training-data'

export interface TrainingPageShellSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'training-page-fallback'
  totalRecords: number
  totalAttendees: number
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadTrainingPageSnapshot(): Promise<TrainingPageShellSnapshot> {
  const stats = computeTrainingStats(MOCK_TRAININGS)

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'training-page-fallback',
    totalRecords: MOCK_TRAININGS.length,
    totalAttendees: stats.totalAttendees,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadTrainingPageSnapshot -> training-legacy shell bridge',
    businessDataSource: 'legacy training page retains local mock dataset, filtering and pagination workflow',
    refreshPath: 'loadTrainingPageSnapshot()',
    note: '当前页面仍以内联 mock 培训列表与筛选交互为主，本轮完成 E54 壳层化、来源态证据透出与结构固证。',
  }
}
