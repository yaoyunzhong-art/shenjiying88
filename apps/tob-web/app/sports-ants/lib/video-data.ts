/**
 * 运动蚂蚁视频数据中心
 * BigAnts Video Data Center
 *
 * 包含品牌故事、客户案例、产品演示、操作指南等视频内容
 */

// 视频分类
export type VideoCategory = 'brand' | 'case' | 'product' | 'tutorial';

// 视频项接口
export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  category: VideoCategory;
  views: number;
  publishDate: string;
  tags: string[];
}

// 品牌故事视频
export const BRAND_VIDEOS: VideoItem[] = [
  {
    id: 'brand-001',
    title: '运动蚂蚁品牌介绍',
    description: '了解运动蚂蚁如何用数字科技重新定义运动体验，为商业综合体、旅游景区等提供创新的数字运动解决方案。',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
    duration: '3:30',
    category: 'brand',
    views: 125800,
    publishDate: '2024-12-01',
    tags: ['品牌故事', '企业介绍', '数字运动'],
  },
  {
    id: 'brand-002',
    title: '数字运动行业趋势解读',
    description: '深度解析数字体育产业的发展趋势、市场规模以及运动蚂蚁的战略布局。',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop',
    duration: '8:45',
    category: 'brand',
    views: 89600,
    publishDate: '2024-11-15',
    tags: ['行业趋势', '市场分析', '数字体育'],
  },
  {
    id: 'brand-003',
    title: '运动蚂蚁工厂探秘',
    description: '走进运动蚂蚁研发生产基地，了解数字运动设备的研发、制造全过程。',
    thumbnail: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&h=450&fit=crop',
    duration: '5:20',
    category: 'brand',
    views: 67800,
    publishDate: '2024-10-28',
    tags: ['工厂探秘', '研发制造', '生产流程'],
  },
];

// 客户案例视频
export const CASE_VIDEOS: VideoItem[] = [
  {
    id: 'case-001',
    title: '万达广场数字运动馆案例',
    description: '北京万达广场引入运动蚂蚁数字运动设备，打造区域标杆门店，月均客流量提升40%以上。',
    thumbnail: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=450&fit=crop',
    duration: '4:15',
    category: 'case',
    views: 156700,
    publishDate: '2024-11-20',
    tags: ['万达广场', '商业综合体', '成功案例'],
  },
  {
    id: 'case-002',
    title: '华润万象城数字运动升级方案',
    description: '深圳华润万象城数字运动项目从规划到运营全流程实录，12个月回本周期。',
    thumbnail: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=450&fit=crop',
    duration: '6:30',
    category: 'case',
    views: 89400,
    publishDate: '2024-11-05',
    tags: ['华润万象城', '升级改造', '运营实录'],
  },
  {
    id: 'case-003',
    title: '新城吾悦广场亲子运动馆案例',
    description: '全国新城吾悦广场引入VR滑雪、激光迷宫等设备，亲子客流提升40%。',
    thumbnail: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&h=450&fit=crop',
    duration: '3:50',
    category: 'case',
    views: 72300,
    publishDate: '2024-10-15',
    tags: ['新城吾悦', '亲子场馆', '儿童游乐'],
  },
  {
    id: 'case-004',
    title: '三线城市加盟商创业故事',
    description: '来自湖南长沙的加盟商张总分享如何从小城市起步，8个月实现回本。',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop',
    duration: '7:20',
    category: 'case',
    views: 45600,
    publishDate: '2024-09-28',
    tags: ['加盟创业', '小城市', '投资回报'],
  },
];

// 产品演示视频
export const PRODUCT_VIDEOS: VideoItem[] = [
  {
    id: 'product-001',
    title: '超级网球产品演示',
    description: '详细展示超级网球的核心功能、AI对战系统、多关卡设计等核心卖点。',
    thumbnail: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=450&fit=crop',
    duration: '2:45',
    category: 'product',
    views: 89200,
    publishDate: '2024-12-10',
    tags: ['超级网球', '产品演示', 'AI对战'],
  },
  {
    id: 'product-002',
    title: 'VR滑雪真实体验',
    description: '沉浸式VR滑雪体验现场录制，带您感受雪山美景和极速下滑的刺激。',
    thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=450&fit=crop',
    duration: '3:20',
    category: 'product',
    views: 134500,
    publishDate: '2024-12-05',
    tags: ['VR滑雪', '产品演示', '沉浸体验'],
  },
  {
    id: 'product-003',
    title: '飞行模拟器专业评测',
    description: '六轴运动平台民航级驾驶舱全面评测，真实还原飞行体验。',
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop',
    duration: '5:10',
    category: 'product',
    views: 76800,
    publishDate: '2024-11-25',
    tags: ['飞行模拟器', '产品评测', '专业级'],
  },
  {
    id: 'product-004',
    title: '枪王之王射击游戏演示',
    description: '8关闯关射击游戏真实试玩，多种武器选择，礼品彩票奖励机制。',
    thumbnail: 'https://images.unsplash.com/photo-1517736996303-4af8f4fb9918?w=800&h=450&fit=crop',
    duration: '4:05',
    category: 'product',
    views: 54300,
    publishDate: '2024-11-10',
    tags: ['枪王之王', '射击游戏', '闯关'],
  },
];

// 操作指南视频
export const TUTORIAL_VIDEOS: VideoItem[] = [
  {
    id: 'tutorial-001',
    title: '场馆选址与规划指南',
    description: '专业团队教您如何根据场地条件、客群特征进行场馆选址和方案规划。',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=450&fit=crop',
    duration: '12:30',
    category: 'tutorial',
    views: 45600,
    publishDate: '2024-10-20',
    tags: ['选址规划', '教程', '新手必看'],
  },
  {
    id: 'tutorial-002',
    title: '设备安装调试教程',
    description: '运动蚂蚁工程师详细演示设备安装、调试的全过程，确保最佳运行状态。',
    thumbnail: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=450&fit=crop',
    duration: '15:45',
    category: 'tutorial',
    views: 32400,
    publishDate: '2024-10-05',
    tags: ['安装调试', '教程', '技术培训'],
  },
  {
    id: 'tutorial-003',
    title: '运营管理后台使用指南',
    description: '详细介绍场馆运营管理后台的数据分析、会员管理、营销活动等功能。',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
    duration: '18:20',
    category: 'tutorial',
    views: 28900,
    publishDate: '2024-09-15',
    tags: ['运营管理', '后台教程', '数据分析'],
  },
  {
    id: 'tutorial-004',
    title: '会员营销活动策划方案',
    description: '如何利用节日营销、会员日等活动提升客流量和会员复购率。',
    thumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=450&fit=crop',
    duration: '10:15',
    category: 'tutorial',
    views: 21300,
    publishDate: '2024-09-01',
    tags: ['营销策划', '会员运营', '活动方案'],
  },
];

// 所有视频汇总
export const ALL_VIDEOS: VideoItem[] = [
  ...BRAND_VIDEOS,
  ...CASE_VIDEOS,
  ...PRODUCT_VIDEOS,
  ...TUTORIAL_VIDEOS,
];

// 获取推荐视频
export function getRecommendedVideos(category?: VideoCategory, limit: number = 4): VideoItem[] {
  const videos = category ? ALL_VIDEOS.filter(v => v.category === category) : ALL_VIDEOS;
  return videos.sort((a, b) => b.views - a.views).slice(0, limit);
}

// 获取热门视频
export function getHotVideos(limit: number = 6): VideoItem[] {
  return ALL_VIDEOS.sort((a, b) => b.views - a.views).slice(0, limit);
}

// 视频分类统计数据
export const VIDEO_STATS = {
  totalVideos: ALL_VIDEOS.length,
  totalViews: ALL_VIDEOS.reduce((sum, v) => sum + v.views, 0),
  categories: {
    brand: BRAND_VIDEOS.length,
    case: CASE_VIDEOS.length,
    product: PRODUCT_VIDEOS.length,
    tutorial: TUTORIAL_VIDEOS.length,
  },
};
