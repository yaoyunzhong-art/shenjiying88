export type TournamentStatus = 'upcoming' | 'registration' | 'ongoing' | 'finished';

export interface Tournament {
  tournamentId: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  levelName: string;
  status: TournamentStatus;
  startTime: string;
  endTime: string;
  prizePool: number;
  participantCount: number;
  maxParticipants: number;
  description: string;
  rules: string;
  progressStages?: { stage: string; qualified: number; total: number }[];
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  handicap?: number;
  lastUpdated: string;
}

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    tournamentId: 'T001',
    name: '日常练习赛',
    level: 1,
    levelName: 'L1 日常赛',
    status: 'ongoing',
    startTime: '2026-07-02T09:00:00Z',
    endTime: '2026-07-02T18:00:00Z',
    prizePool: 1000,
    participantCount: 48,
    maxParticipants: 100,
    description: '每日举办的日常练习赛事，适合新手入门',
    rules: '采用单轮比杆赛制，按差点计算净杆成绩',
  },
  {
    tournamentId: 'T002',
    name: '周末会员赛',
    level: 2,
    levelName: 'L2 周赛',
    status: 'registration',
    startTime: '2026-07-05T10:00:00Z',
    endTime: '2026-07-05T18:00:00Z',
    prizePool: 5000,
    participantCount: 72,
    maxParticipants: 80,
    description: '每周举办的会员赛事，丰厚奖品等您拿',
    rules: '采用18洞比杆赛，按总杆计算排名',
  },
  {
    tournamentId: 'T003',
    name: '月度精英赛',
    level: 3,
    levelName: 'L3 月赛',
    status: 'upcoming',
    startTime: '2026-07-15T08:00:00Z',
    endTime: '2026-07-15T17:00:00Z',
    prizePool: 20000,
    participantCount: 0,
    maxParticipants: 120,
    description: '每月举办一次的高水平赛事，汇聚各路高手',
    rules: '两轮比杆赛，取前36洞总杆排名',
  },
  {
    tournamentId: 'T004',
    name: '广州城市赛',
    level: 4,
    levelName: 'L4 城市赛',
    status: 'upcoming',
    startTime: '2026-07-20T07:00:00Z',
    endTime: '2026-07-21T18:00:00Z',
    prizePool: 100000,
    participantCount: 200,
    maxParticipants: 200,
    description: '城市级赛事，晋级全国赛的必经之路',
    rules: '两轮比杆赛，前30名晋级全国赛',
    progressStages: [
      { stage: '海选', qualified: 80, total: 200 },
      { stage: '晋级赛', qualified: 30, total: 80 },
    ],
  },
  {
    tournamentId: 'T005',
    name: '全国锦标赛',
    level: 5,
    levelName: 'L5 全国赛',
    status: 'upcoming',
    startTime: '2026-08-01T07:00:00Z',
    endTime: '2026-08-03T18:00:00Z',
    prizePool: 500000,
    participantCount: 64,
    maxParticipants: 64,
    description: '全国最高水平业余赛事，代表最高荣誉',
    rules: '三轮比杆赛，淘汰制',
    progressStages: [
      { stage: '小组赛', qualified: 32, total: 64 },
      { stage: '淘汰赛', qualified: 16, total: 32 },
      { stage: '决赛', qualified: 1, total: 16 },
    ],
  },
  {
    tournamentId: 'T006',
    name: '亚太锦标赛',
    level: 6,
    levelName: 'L6 锦标赛',
    status: 'upcoming',
    startTime: '2026-09-15T06:00:00Z',
    endTime: '2026-09-18T20:00:00Z',
    prizePool: 2000000,
    participantCount: 32,
    maxParticipants: 32,
    description: '亚太地区顶级赛事，邀请制参赛',
    rules: '四轮比杆赛',
    progressStages: [
      { stage: '小组赛', qualified: 16, total: 32 },
      { stage: '决赛轮', qualified: 8, total: 16 },
    ],
  },
  {
    tournamentId: 'T007',
    name: '世界杯',
    level: 7,
    levelName: 'L7 世界杯',
    status: 'upcoming',
    startTime: '2026-10-10T06:00:00Z',
    endTime: '2026-10-13T20:00:00Z',
    prizePool: 10000000,
    participantCount: 0,
    maxParticipants: 0,
    description: '世界最高级别业余高尔夫赛事，各国精英汇聚',
    rules: '国家对抗赛 + 个人比杆赛',
    progressStages: [
      { stage: '小组赛', qualified: 16, total: 32 },
      { stage: '淘汰赛', qualified: 4, total: 16 },
      { stage: '冠军赛', qualified: 1, total: 4 },
    ],
  },
];

export const MOCK_LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  T001: [
    { rank: 1, playerId: 'P001', playerName: '张伟', score: 68, handicap: 5, lastUpdated: '2026-07-02T12:30:00Z' },
    { rank: 2, playerId: 'P002', playerName: '李明', score: 70, handicap: 8, lastUpdated: '2026-07-02T12:30:00Z' },
    { rank: 3, playerId: 'P003', playerName: '王芳', score: 71, handicap: 3, lastUpdated: '2026-07-02T12:30:00Z' },
    { rank: 4, playerId: 'P004', playerName: '刘强', score: 72, handicap: 12, lastUpdated: '2026-07-02T12:30:00Z' },
    { rank: 5, playerId: 'P005', playerName: '陈静', score: 73, handicap: 6, lastUpdated: '2026-07-02T12:30:00Z' },
    { rank: 6, playerId: 'P006', playerName: '赵磊', score: 74, handicap: 10, lastUpdated: '2026-07-02T12:30:00Z' },
    { rank: 7, playerId: 'P007', playerName: '孙鹏', score: 75, handicap: 15, lastUpdated: '2026-07-02T12:30:00Z' },
    { rank: 8, playerId: 'P008', playerName: '周婷', score: 76, handicap: 7, lastUpdated: '2026-07-02T12:30:00Z' },
  ],
  T002: [
    { rank: 1, playerId: 'P011', playerName: '吴浩', score: 67, handicap: 4, lastUpdated: '2026-07-01T18:00:00Z' },
    { rank: 2, playerId: 'P012', playerName: '郑伟', score: 69, handicap: 9, lastUpdated: '2026-07-01T18:00:00Z' },
    { rank: 3, playerId: 'P013', playerName: '冯雪', score: 70, handicap: 5, lastUpdated: '2026-07-01T18:00:00Z' },
    { rank: 4, playerId: 'P014', playerName: '陈晨', score: 72, handicap: 11, lastUpdated: '2026-07-01T18:00:00Z' },
    { rank: 5, playerId: 'P015', playerName: '林峰', score: 73, handicap: 8, lastUpdated: '2026-07-01T18:00:00Z' },
  ],
};

export function getStatusLabel(status: TournamentStatus): string {
  const labels: Record<TournamentStatus, string> = {
    upcoming: '未开始',
    registration: '报名中',
    ongoing: '进行中',
    finished: '已结束',
  };
  return labels[status];
}

export function getStatusColor(status: TournamentStatus): string {
  const colors: Record<TournamentStatus, string> = {
    upcoming: '#94a3b8',
    registration: '#22c55e',
    ongoing: '#3b82f6',
    finished: '#64748b',
  };
  return colors[status];
}

export function getTimeUntilStart(startTime: string): string {
  const now = new Date();
  const start = new Date(startTime);
  const diff = start.getTime() - now.getTime();

  if (diff <= 0) return '已开赛';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}天${hours}小时后`;
  if (hours > 0) return `${hours}小时${minutes}分钟后`;
  return `${minutes}分钟后`;
}

export function formatDatetime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const LEVEL_TABS = [
  { level: 1, label: '日常赛(L1)', name: '日常赛' },
  { level: 2, label: '周赛(L2)', name: '周赛' },
  { level: 3, label: '月赛(L3)', name: '月赛' },
  { level: 4, label: '城市赛(L4)', name: '城市赛' },
  { level: 5, label: '全国赛(L5)', name: '全国赛' },
  { level: 6, label: '锦标赛(L6)', name: '锦标赛' },
  { level: 7, label: '世界杯(L7)', name: '世界杯' },
] as const;
