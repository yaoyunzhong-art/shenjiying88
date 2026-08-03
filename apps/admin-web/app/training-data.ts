/**
 * training-data.ts — Training management mock data for admin-web
 *
 * 培训管理数据模型：课程名、讲师、参训人数、日期、时长、状态、类型
 */

export type TrainingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TrainingType = 'pre_job' | 'skill_upgrade' | 'safety' | 'management';

export interface TrainingItem {
  id: string;
  courseName: string;
  instructor: string;
  attendeeCount: number;
  date: string;
  durationMinutes: number;
  status: TrainingStatus;
  type: TrainingType;
  description?: string;
  location?: string;
}

export const TRAINING_STATUS_MAP: Record<TrainingStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  scheduled: { label: '已安排', variant: 'info' },
  in_progress: { label: '进行中', variant: 'warning' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
};

export const TRAINING_TYPE_MAP: Record<TrainingType, { label: string }> = {
  pre_job: { label: '岗前培训' },
  skill_upgrade: { label: '技能提升' },
  safety: { label: '安全培训' },
  management: { label: '管理培训' },
};

export const TRAINING_STATUSES: TrainingStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
export const TRAINING_TYPES: TrainingType[] = ['pre_job', 'skill_upgrade', 'safety', 'management'];

/** Tab filter keys for the page */
export type TrainingTabKey = 'ALL' | 'in_progress' | 'completed';

export const TRAINING_TABS: { key: TrainingTabKey; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

/** Compute overview statistics from training items */
export interface TrainingStats {
  total: number;
  thisQuarter: number;
  totalAttendees: number;
}

export function computeTrainingStats(items: TrainingItem[]): TrainingStats {
  const now = new Date();
  const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const qStart = new Date(now.getFullYear(), qStartMonth, 1);

  let thisQuarter = 0;
  let totalAttendees = 0;

  for (const item of items) {
    totalAttendees += item.attendeeCount;
    const itemDate = new Date(item.date);
    if (itemDate >= qStart) {
      thisQuarter++;
    }
  }

  return {
    total: items.length,
    thisQuarter,
    totalAttendees,
  };
}

/** Filter helpers (mirrors page component logic) */
export function filterByTab(items: TrainingItem[], tab: TrainingTabKey): TrainingItem[] {
  if (tab === 'ALL') return items;
  return items.filter((item) => item.status === tab);
}

export function searchTrainings(items: TrainingItem[], keyword: string): TrainingItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter(
    (item) =>
      item.courseName.toLowerCase().includes(lower) ||
      item.instructor.toLowerCase().includes(lower)
  );
}

export const MOCK_TRAININGS: TrainingItem[] = [
  {
    id: 'tr-001',
    courseName: '新员工入职安全培训',
    instructor: '王建国',
    attendeeCount: 24,
    date: '2026-07-15',
    durationMinutes: 120,
    status: 'completed',
    type: 'safety',
    description: '入职员工必须参加的基础安全培训，涵盖消防安全、用电安全等',
    location: '三楼培训室',
  },
  {
    id: 'tr-002',
    courseName: '收银系统操作规范',
    instructor: '李美丽',
    attendeeCount: 18,
    date: '2026-07-18',
    durationMinutes: 90,
    status: 'in_progress',
    type: 'pre_job',
    description: '新收银员岗前实操培训，包括系统操作、退换货流程',
    location: '收银台实训区',
  },
  {
    id: 'tr-003',
    courseName: '门店管理领导力工作坊',
    instructor: '陈志远',
    attendeeCount: 12,
    date: '2026-07-20',
    durationMinutes: 180,
    status: 'scheduled',
    type: 'management',
    description: '面向店长及储备店长的管理能力提升课程',
    location: '总部会议室A',
  },
  {
    id: 'tr-004',
    courseName: '食品安全与卫生管理',
    instructor: '赵晓燕',
    attendeeCount: 30,
    date: '2026-07-12',
    durationMinutes: 150,
    status: 'completed',
    type: 'safety',
    description: '食品区员工必须参加的食品安全专项培训',
    location: '二楼培训厅',
  },
  {
    id: 'tr-005',
    courseName: '销售技巧与客户服务',
    instructor: '孙明辉',
    attendeeCount: 20,
    date: '2026-07-10',
    durationMinutes: 120,
    status: 'completed',
    type: 'skill_upgrade',
    description: '提升一线员工销售转化率和客户满意度',
    location: '一楼培训厅',
  },
  {
    id: 'tr-006',
    courseName: 'ERP 系统升级培训',
    instructor: '周文强',
    attendeeCount: 15,
    date: '2026-07-22',
    durationMinutes: 240,
    status: 'scheduled',
    type: 'skill_upgrade',
    description: 'ERP V3.0 升级功能说明及新模块操作培训',
    location: '总部培训中心',
  },
  {
    id: 'tr-007',
    courseName: '消防应急演练',
    instructor: '张队长',
    attendeeCount: 45,
    date: '2026-06-30',
    durationMinutes: 60,
    status: 'completed',
    type: 'safety',
    description: '全店消防疏散演练及灭火器使用实操',
    location: '门店外围广场',
  },
];
