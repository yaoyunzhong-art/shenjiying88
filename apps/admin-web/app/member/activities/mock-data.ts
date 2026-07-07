/**
 * member/activities/mock-data.ts
 * 会员活动历史模拟数据集 (L1 占位)
 *
 * Pattern: 20 条、覆盖 4 种事件类型 × 3 种状态 × 3 个来源渠道
 */

export type ActivityEventType = 'POINTS_CHANGE' | 'LEVEL_UP' | 'COUPON_ISSUE' | 'PROFILE_UPDATE';
export type ActivityStatus = 'SUCCESS' | 'PENDING' | 'FAILED';
export type ActivityChannel = 'POS' | 'MINI_PROGRAM' | 'ADMIN';

export interface ActivityItem {
  id: string;
  memberName: string;
  memberPhone: string;
  eventType: ActivityEventType;
  status: ActivityStatus;
  channel: ActivityChannel;
  description: string;
  operator: string;
  occurredAt: string; // ISO
}

const EVENT_TYPE_MAP: Record<ActivityEventType, string> = {
  POINTS_CHANGE: '积分变动',
  LEVEL_UP: '等级变更',
  COUPON_ISSUE: '优惠券发放',
  PROFILE_UPDATE: '资料修改',
};

const STATUS_MAP: Record<ActivityStatus, string> = {
  SUCCESS: '成功',
  PENDING: '处理中',
  FAILED: '失败',
};

const CHANNEL_MAP: Record<ActivityChannel, string> = {
  POS: 'POS 收银',
  MINI_PROGRAM: '小程序',
  ADMIN: '后台管理',
};

export function getEventTypeLabel(type: ActivityEventType): string {
  return EVENT_TYPE_MAP[type] ?? type;
}

export function getStatusLabel(status: ActivityStatus): string {
  return STATUS_MAP[status] ?? status;
}

export function getChannelLabel(channel: ActivityChannel): string {
  return CHANNEL_MAP[channel] ?? channel;
}

const MEMBERS = [
  { name: '张三', phone: '138****1234' },
  { name: '李四', phone: '139****5678' },
  { name: '王五', phone: '137****9012' },
  { name: '赵六', phone: '136****3456' },
  { name: '钱七', phone: '135****7890' },
  { name: '孙八', phone: '134****2345' },
  { name: '周九', phone: '133****6789' },
  { name: '吴十', phone: '132****0123' },
];

const EVENT_TYPES: ActivityEventType[] = ['POINTS_CHANGE', 'LEVEL_UP', 'COUPON_ISSUE', 'PROFILE_UPDATE'];
const STATUSES: ActivityStatus[] = ['SUCCESS', 'PENDING', 'FAILED'];
const CHANNELS: ActivityChannel[] = ['POS', 'MINI_PROGRAM', 'ADMIN'];
const OPERATORS = ['系统自动', '管理员', '店长大飞', '导购小王', '收银员'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysBack));
  d.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return d.toISOString();
}

function buildDescription(type: ActivityEventType, memberName: string): string {
  switch (type) {
    case 'POINTS_CHANGE':
      return `${memberName} ${Math.random() > 0.5 ? '获得' : '消耗'} ${randomInt(10, 500)} 积分`;
    case 'LEVEL_UP':
      return `${memberName} 从 ${randomPick(['青铜', '白银', '黄金'])} 升级为 ${randomPick(['白银', '黄金', '铂金', '钻石'])}`;
    case 'COUPON_ISSUE':
      return `向 ${memberName} 发放「${randomInt(5, 50)} 元满减券」`;
    case 'PROFILE_UPDATE':
      return `${memberName} 更新了 ${randomPick(['手机号', '地址', '昵称', '生日'])}`;
  }
}

export const MOCK_ACTIVITIES: ActivityItem[] = Array.from({ length: 20 }, (_, i) => {
  const member = randomPick(MEMBERS);
  const eventType = randomPick(EVENT_TYPES);
  return {
    id: `ACT-${String(i + 1).padStart(4, '0')}`,
    memberName: member.name,
    memberPhone: member.phone,
    eventType,
    status: randomPick(STATUSES),
    channel: randomPick(CHANNELS),
    description: buildDescription(eventType, member.name),
    operator: randomPick(OPERATORS),
    occurredAt: randomDate(90),
  };
});

export function getActivityStats(items: ActivityItem[]) {
  const total = items.length;
  const success = items.filter((i) => i.status === 'SUCCESS').length;
  const pending = items.filter((i) => i.status === 'PENDING').length;
  const failed = items.filter((i) => i.status === 'FAILED').length;
  const uniqueMembers = new Set(items.map((i) => i.memberPhone)).size;
  return { total, success, pending, failed, uniqueMembers };
}

export function getUniqueChannels(items: ActivityItem[]): ActivityChannel[] {
  return Array.from(new Set(items.map((i) => i.channel))).sort() as ActivityChannel[];
}

export function getUniqueEventTypes(items: ActivityItem[]): ActivityEventType[] {
  return Array.from(new Set(items.map((i) => i.eventType))).sort();
}
