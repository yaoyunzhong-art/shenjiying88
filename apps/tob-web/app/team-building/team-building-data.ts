// Team Building Event types
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface TeamBuildingEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  participantCount: number;
  budget: number;
  status: EventStatus;
  description: string;
  highlights: string[];
}

// Event Report types
export interface EventReport {
  id: string;
  eventId: string;
  summary: string;
  achievements: string[];
  participationRate: number;
  budgetUsage: number;
  satisfactionScore: number;
  generatedAt: string;
  highlights: string[];
}

// Performance Record types
export interface PerformanceRecord {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  rank: number;
  participationScore: number;
  teamworkScore: number;
  leadershipScore: number;
  improvementRate: number;
  award?: string;
}

// MOCK Data
export const MOCK_EVENTS: TeamBuildingEvent[] = [
  {
    id: 'TB001',
    name: '春季户外拓展训练',
    date: '2026-04-15T08:00:00Z',
    location: '北京怀柔生存岛',
    participantCount: 45,
    budget: 35000,
    status: 'completed',
    description: '为期一天的户外拓展训练，包括团队破冰、高空断桥、信任背摔等项目',
    highlights: ['团队协作', '突破自我', '信任建设'],
  },
  {
    id: 'TB002',
    name: '年中团建狂欢夜',
    date: '2026-06-20T18:00:00Z',
    location: '北京工体某酒吧',
    participantCount: 68,
    budget: 25000,
    status: 'completed',
    description: '热闹的年中团建派对，包含团队游戏、才艺表演、抽奖环节',
    highlights: ['放松娱乐', '才艺展示', '团队融合'],
  },
  {
    id: 'TB003',
    name: '秋季运动会',
    date: '2026-10-10T09:00:00Z',
    location: '朝阳体育中心',
    participantCount: 82,
    budget: 45000,
    status: 'upcoming',
    description: '全员参与的秋季运动会，包含篮球、羽毛球、拔河等竞技项目',
    highlights: ['体育竞技', '健康生活', '部门对抗'],
  },
];

export const MOCK_REPORTS: EventReport[] = [
  {
    id: 'R001',
    eventId: 'TB001',
    summary: '本次春季户外拓展活动圆满成功。通过精心设计的团队建设项目，参训人员在信任沟通、问题解决、团队协作等方面均有显著提升。活动参与率达到98%，满意度评分4.8/5.0。',
    achievements: [
      '98%参与率，创历史新高',
      '满意度评分4.8/5.0',
      '发现3位潜在领导者',
      '部门间协作效率提升20%',
    ],
    participationRate: 98,
    budgetUsage: 89,
    satisfactionScore: 4.8,
    generatedAt: '2026-04-16T10:00:00Z',
    highlights: ['团队破冰', '高空挑战', '信任背摔'],
  },
  {
    id: 'R002',
    eventId: 'TB002',
    summary: '年中团建派对顺利进行。活动气氛热烈，通过多轮团队游戏和抽奖环节，有效增强了团队凝聚力。员工反馈积极，表示这类活动有助于放松身心、增进了解。',
    achievements: [
      '85%参与率',
      '满意度评分4.6/5.0',
      '15个精彩节目演出',
      '增进跨部门沟通30%',
    ],
    participationRate: 85,
    budgetUsage: 92,
    satisfactionScore: 4.6,
    generatedAt: '2026-06-21T14:00:00Z',
    highlights: ['团队游戏', '才艺表演', '幸运抽奖'],
  },
  {
    id: 'R003',
    eventId: 'TB003',
    summary: '秋季运动会即将举办，目前筹备工作进展顺利。预计将有82人参与，覆盖所有部门。运动会设置了多个竞技项目，旨在激发团队活力，弘扬体育精神。',
    achievements: [
      '预计参与率95%+',
      '覆盖5个竞技项目',
      '8支队伍参赛',
      '丰富奖品设置',
    ],
    participationRate: 0,
    budgetUsage: 0,
    satisfactionScore: 0,
    generatedAt: '2026-09-01T09:00:00Z',
    highlights: ['篮球赛', '羽毛球赛', '拔河比赛'],
  },
];

export const MOCK_PERFORMANCES: PerformanceRecord[] = [
  {
    id: 'P001',
    eventId: 'TB001',
    memberId: 'M001',
    memberName: '张明',
    rank: 1,
    participationScore: 95,
    teamworkScore: 92,
    leadershipScore: 90,
    improvementRate: 25,
    award: '最佳表现奖',
  },
  {
    id: 'P002',
    eventId: 'TB001',
    memberId: 'M002',
    memberName: '李华',
    rank: 2,
    participationScore: 92,
    teamworkScore: 95,
    leadershipScore: 85,
    improvementRate: 20,
    award: '最佳协作奖',
  },
  {
    id: 'P003',
    eventId: 'TB001',
    memberId: 'M003',
    memberName: '王芳',
    rank: 3,
    participationScore: 88,
    teamworkScore: 90,
    leadershipScore: 88,
    improvementRate: 18,
  },
  {
    id: 'P004',
    eventId: 'TB001',
    memberId: 'M004',
    memberName: '刘强',
    rank: 4,
    participationScore: 90,
    teamworkScore: 88,
    leadershipScore: 82,
    improvementRate: 15,
  },
  {
    id: 'P005',
    eventId: 'TB001',
    memberId: 'M005',
    memberName: '陈静',
    rank: 5,
    participationScore: 85,
    teamworkScore: 85,
    leadershipScore: 80,
    improvementRate: 22,
  },
];
