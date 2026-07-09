/**
 * training-center-data.ts — 培训中心 Mock 数据
 */

import type {
  TrainingDailyMetrics,
  TrainingSession,
  PendingCertification,
  TrainingNeed,
} from '@m5/ui';

// ---- 培训运营指标 ----

export const MOCK_DAILY_METRICS: TrainingDailyMetrics = {
  totalSessions: 6,
  totalAttendees: 87,
  avgCompletionRate: 92,
  avgRating: 4.6,
  sessionsTrend: 2,
  attendeesTrend: 5,
  completionTrend: 1,
  ratingTrend: 0.1,
};

// ---- 今日培训课程 ----

export const MOCK_TODAY_SESSIONS: TrainingSession[] = [
  {
    id: 'ts-001',
    title: '新机台操作规范培训',
    coach: '陈教练',
    type: 'skill',
    date: '2026-07-09',
    time: '09:00-10:30',
    enrolled: 18,
    capacity: 20,
    status: 'in_progress',
  },
  {
    id: 'ts-002',
    title: '消防安全月度演练',
    coach: '李教练',
    type: 'safety',
    date: '2026-07-09',
    time: '10:45-11:30',
    enrolled: 30,
    capacity: 30,
    status: 'scheduled',
  },
  {
    id: 'ts-003',
    title: '会员卡销售话术特训',
    coach: '王教练',
    type: 'sales',
    date: '2026-07-09',
    time: '14:00-15:30',
    enrolled: 12,
    capacity: 15,
    status: 'scheduled',
  },
  {
    id: 'ts-004',
    title: '客户投诉处理技巧',
    coach: '张教练',
    type: 'service',
    date: '2026-07-09',
    time: '16:00-17:00',
    enrolled: 8,
    capacity: 12,
    status: 'scheduled',
  },
  {
    id: 'ts-005',
    title: '储备店长管理能力提升',
    coach: '赵教练',
    type: 'leadership',
    date: '2026-07-09',
    time: '19:00-21:00',
    enrolled: 5,
    capacity: 8,
    status: 'scheduled',
  },
];

// ---- 待认证学员 ----

export const MOCK_PENDING_CERTIFICATIONS: PendingCertification[] = [
  {
    id: 'cert-001',
    memberName: '刘小明',
    skillName: '模拟赛车中级操作',
    progress: 75,
    assignedCoach: '陈教练',
    deadline: '2026-07-20',
  },
  {
    id: 'cert-002',
    memberName: '赵丽华',
    skillName: 'VR 设备维护认证',
    progress: 45,
    assignedCoach: '李教练',
    deadline: '2026-07-25',
  },
  {
    id: 'cert-003',
    memberName: '孙浩宇',
    skillName: '射击射箭安全督导',
    progress: 90,
    assignedCoach: '王教练',
    deadline: '2026-07-15',
  },
  {
    id: 'cert-004',
    memberName: '周雅琴',
    skillName: '保龄球设备调试',
    progress: 30,
    assignedCoach: '赵教练',
    deadline: '2026-08-01',
  },
];

// ---- 设备培训需求 ----

export const MOCK_TRAINING_NEEDS: TrainingNeed[] = [
  { deviceModel: '模拟赛車 R9', count: 4, priority: 'high' },
  { deviceModel: 'VR 头显 Pro', count: 8, priority: 'high' },
  { deviceModel: '电子飞镖靶', count: 3, priority: 'medium' },
  { deviceModel: '保龄球回球系统', count: 2, priority: 'medium' },
  { deviceModel: '篮球机 2026', count: 5, priority: 'low' },
];
