// announcement-service.ts · 公告管理数据服务
// 为 tob-web 门店管理后台提供公告 CRUD

export type AnnouncementStatus = 'draft' | 'published' | 'archived';
export type AnnouncementCategory = 'system' | 'promotion' | 'operation' | 'emergency' | 'training';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  priority: AnnouncementPriority;
  author: string;
  publishedAt: string;
  readCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: AnnouncementCategory;
  status?: AnnouncementStatus;
}

export interface AnnouncementListResponse {
  success: boolean;
  data?: {
    items: Announcement[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: { code: string; message: string };
}

export interface AnnouncementDetailResponse {
  success: boolean;
  data?: Announcement;
  error?: { code: string; message: string };
}

class AnnouncementService {
  async listAnnouncements(query: AnnouncementListQuery = {}): Promise<AnnouncementListResponse> {
    try {
      const { page = 1, pageSize = 10, keyword, category, status } = query;
      let filtered = [...MOCK_ANNOUNCEMENTS];

      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.title.toLowerCase().includes(kw) ||
            a.summary.toLowerCase().includes(kw) ||
            a.author.toLowerCase().includes(kw)
        );
      }
      if (category) filtered = filtered.filter((a) => a.category === category);
      if (status) filtered = filtered.filter((a) => a.status === status);

      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return { success: true, data: { items, total, page, pageSize } };
    } catch {
      return { success: false, error: { code: 'FETCH_ERROR', message: '获取公告列表失败' } };
    }
  }

  async getAnnouncement(id: string): Promise<AnnouncementDetailResponse> {
    try {
      const item = MOCK_ANNOUNCEMENTS.find((a) => a.id === id);
      if (!item) return { success: false, error: { code: 'NOT_FOUND', message: '公告不存在' } };
      return { success: true, data: item };
    } catch {
      return { success: false, error: { code: 'FETCH_ERROR', message: '获取公告详情失败' } };
    }
  }

  async updateStatus(
    id: string,
    status: AnnouncementStatus
  ): Promise<{ success: boolean; data?: Announcement; error?: { code: string; message: string } }> {
    try {
      const item = MOCK_ANNOUNCEMENTS.find((a) => a.id === id);
      if (!item) return { success: false, error: { code: 'NOT_FOUND', message: '公告不存在' } };
      item.status = status;
      if (status === 'published') item.publishedAt = new Date().toISOString();
      return { success: true, data: { ...item } };
    } catch {
      return { success: false, error: { code: 'UPDATE_ERROR', message: '更新状态失败' } };
    }
  }
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_001',
    title: '夏季巡检通知',
    content: '各门店请在7月15日前完成夏季设备巡检，重点检查空调、制冷设备运行状况。',
    summary: '各门店请在7月15日前完成夏季设备巡检',
    category: 'operation',
    status: 'published',
    priority: 'high',
    author: '运营部',
    publishedAt: '2026-07-01T08:00:00Z',
    readCount: 2340,
    createdAt: '2026-06-28T10:00:00Z',
    updatedAt: '2026-07-01T08:00:00Z',
  },
  {
    id: 'ann_002',
    title: '第三季度促销活动方案',
    content: '第三季度全场满300减50活动开启，各门店提前备货并布置活动物料。',
    summary: '第三季度全场满300减50活动开启',
    category: 'promotion',
    status: 'published',
    priority: 'normal',
    author: '市场部',
    publishedAt: '2026-07-02T09:00:00Z',
    readCount: 1876,
    createdAt: '2026-06-30T14:00:00Z',
    updatedAt: '2026-07-02T09:00:00Z',
  },
  {
    id: 'ann_003',
    title: '新入职店长培训安排',
    content: '7月10日举办新入职店长培训，请全体新任店长准时参加。',
    summary: '7月10日举办新入职店长培训',
    category: 'training',
    status: 'published',
    priority: 'normal',
    author: '人事部',
    publishedAt: '2026-07-03T10:00:00Z',
    readCount: 892,
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-07-03T10:00:00Z',
  },
  {
    id: 'ann_004',
    title: 'POS系统更新计划',
    content: 'POS系统将于7月8日凌晨进行版本更新，更新期间暂停收银服务。',
    summary: 'POS系统将于7月8日凌晨进行版本更新',
    category: 'system',
    status: 'draft',
    priority: 'urgent',
    author: '技术部',
    publishedAt: '',
    readCount: 0,
    createdAt: '2026-07-04T16:00:00Z',
    updatedAt: '2026-07-04T16:00:00Z',
  },
  {
    id: 'ann_005',
    title: '消防安全复查通知',
    content: '上月检查中存在消防隐患的门店请于7月12日前完成整改复查。',
    summary: '存在消防隐患的门店请于7月12日前完成整改复查',
    category: 'emergency',
    status: 'published',
    priority: 'urgent',
    author: '安全部',
    publishedAt: '2026-07-05T08:30:00Z',
    readCount: 4521,
    createdAt: '2026-07-04T09:00:00Z',
    updatedAt: '2026-07-05T08:30:00Z',
  },
  {
    id: 'ann_006',
    title: '库存盘点调整通知',
    content: '季度盘点时间调整为7月20日-22日，请各门店做好准备。',
    summary: '季度盘点时间调整为7月20日-22日',
    category: 'operation',
    status: 'draft',
    priority: 'low',
    author: '仓管部',
    publishedAt: '',
    readCount: 0,
    createdAt: '2026-07-06T11:00:00Z',
    updatedAt: '2026-07-06T11:00:00Z',
  },
  {
    id: 'ann_007',
    title: '年中优秀门店评选结果',
    content: '恭喜深圳南山旗舰店、北京朝阳店获得上半年优秀门店称号。',
    summary: '恭喜深圳南山旗舰店、北京朝阳店获得上半年优秀门店称号',
    category: 'operation',
    status: 'archived',
    priority: 'normal',
    author: '运营部',
    publishedAt: '2026-06-15T09:00:00Z',
    readCount: 6780,
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-06-15T09:00:00Z',
  },
];

export const announcementService = new AnnouncementService();
