export type TrainingCourseStatus = 'planned' | 'ongoing' | 'completed'
export type TrainingDiagnosticStatus = 'stable' | 'watch' | 'risk'

export interface TrainingCourse {
  id: string
  name: string
  type: string
  trainer: string
  date: string
  duration: number
  status: TrainingCourseStatus
  attendees: number
  passRate: number
  room?: string
}

export interface TrainingDistributionItem {
  label: string
  count: number
  attendees: number
}

export interface TrainingDiagnostic {
  id: string
  title: string
  status: TrainingDiagnosticStatus
  detail: string
}

export interface TrainingSnapshotSummary {
  totalCourses: number
  completedCourses: number
  ongoingCourses: number
  plannedCourses: number
  averagePassRate: number
  totalAttendees: number
}

export interface TrainingSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-training-mock'
  storeId: string
  courses: TrainingCourse[]
  typeDistribution: TrainingDistributionItem[]
  trainerDistribution: TrainingDistributionItem[]
  summary: TrainingSnapshotSummary
  diagnostics: TrainingDiagnostic[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'CRS-001',
    name: '新员工入职培训',
    type: '入职',
    trainer: 'HR',
    date: '2026-07-15',
    duration: 4,
    status: 'planned',
    attendees: 5,
    passRate: 0,
    room: 'A培训室',
  },
  {
    id: 'CRS-002',
    name: '收银系统操作',
    type: '技能',
    trainer: '李四',
    date: '2026-07-10',
    duration: 3,
    status: 'completed',
    attendees: 8,
    passRate: 100,
    room: '电脑室',
  },
  {
    id: 'CRS-003',
    name: '安全消防演练',
    type: '安全',
    trainer: '消防队',
    date: '2026-07-20',
    duration: 2,
    status: 'planned',
    attendees: 15,
    passRate: 0,
    room: '室外',
  },
  {
    id: 'CRS-004',
    name: '客户服务技巧',
    type: '服务',
    trainer: '外部讲师',
    date: '2026-07-08',
    duration: 4,
    status: 'ongoing',
    attendees: 10,
    passRate: 60,
    room: 'B培训室',
  },
  {
    id: 'CRS-005',
    name: '设备操作指南',
    type: '技能',
    trainer: '王五',
    date: '2026-07-05',
    duration: 2,
    status: 'completed',
    attendees: 6,
    passRate: 83,
    room: '设备区',
  },
  {
    id: 'CRS-006',
    name: '产品知识更新',
    type: '产品',
    trainer: '总部',
    date: '2026-07-22',
    duration: 3,
    status: 'planned',
    attendees: 12,
    passRate: 0,
    room: 'A培训室',
  },
  {
    id: 'CRS-007',
    name: '应急处理流程',
    type: '安全',
    trainer: '张店长',
    date: '2026-07-12',
    duration: 2,
    status: 'completed',
    attendees: 8,
    passRate: 100,
    room: 'B培训室',
  },
  {
    id: 'CRS-008',
    name: '社交媒体营销',
    type: '营销',
    trainer: '市场部',
    date: '2026-07-18',
    duration: 4,
    status: 'planned',
    attendees: 6,
    passRate: 0,
    room: '会议室',
  },
  {
    id: 'CRS-009',
    name: '数据报表解读',
    type: '技能',
    trainer: '财务部',
    date: '2026-07-25',
    duration: 2,
    status: 'planned',
    attendees: 4,
    passRate: 0,
    room: '会议室',
  },
]

export function buildTrainingSummary(courses: TrainingCourse[]): TrainingSnapshotSummary {
  const completedCourses = courses.filter((course) => course.status === 'completed')

  return {
    totalCourses: courses.length,
    completedCourses: completedCourses.length,
    ongoingCourses: courses.filter((course) => course.status === 'ongoing').length,
    plannedCourses: courses.filter((course) => course.status === 'planned').length,
    averagePassRate: completedCourses.length
      ? Math.round(
          completedCourses.reduce((sum, course) => sum + course.passRate, 0) / completedCourses.length
        )
      : 0,
    totalAttendees: courses.reduce((sum, course) => sum + course.attendees, 0),
  }
}

export function buildTrainingDistribution(
  courses: TrainingCourse[],
  pickLabel: (course: TrainingCourse) => string
): TrainingDistributionItem[] {
  const grouped = new Map<string, { count: number; attendees: number }>()
  courses.forEach((course) => {
    const label = pickLabel(course)
    const current = grouped.get(label) ?? { count: 0, attendees: 0 }
    current.count += 1
    current.attendees += course.attendees
    grouped.set(label, current)
  })

  return Array.from(grouped.entries()).map(([label, value]) => ({
    label,
    count: value.count,
    attendees: value.attendees,
  }))
}

export function buildTrainingDiagnostics(storeId: string): TrainingDiagnostic[] {
  return [
    {
      id: 'source-transparency',
      title: '来源态已固化',
      status: 'stable',
      detail: `门店 ${storeId} 当前通过 server wrapper 下发培训 mock 快照，来源标签为 store-training-mock。`,
    },
    {
      id: 'trainer-watch',
      title: '讲师与签到链路待对接',
      status: 'watch',
      detail: '培训讲师、签到与考核分数仍来自本地样本，尚未接入真实培训台账。',
    },
    {
      id: 'write-path-risk',
      title: '创建培训仍为假写链路',
      status: 'risk',
      detail: '创建培训、考核记录与导出仍处于结构演示阶段，仅用于来源态透明化与回归固证。',
    },
  ]
}

export async function loadTrainingSnapshot(storeId: string): Promise<TrainingSnapshot> {
  const courses = TRAINING_COURSES.map((course) => ({ ...course }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-training-mock',
    storeId,
    courses,
    typeDistribution: buildTrainingDistribution(courses, (course) => course.type),
    trainerDistribution: buildTrainingDistribution(courses, (course) => course.trainer),
    summary: buildTrainingSummary(courses),
    diagnostics: buildTrainingDiagnostics(storeId),
    generatedAt: '2026-07-27T10:30:00.000Z',
    controlPlaneSource: 'loadTrainingSnapshot -> TRAINING_COURSES',
    businessDataSource: 'local training samples + derived diagnostics',
    refreshPath: 'TrainingPage -> loadTrainingSnapshot',
    note: '当前页面消费本地 training snapshot loader，仅用于来源态固证、交互演示与定向回归，不作为真实培训台账复签证据。',
    error: '门店培训控制面尚未接入实时上游，当前展示 mock 快照。',
  }
}
