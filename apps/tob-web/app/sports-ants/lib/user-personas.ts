/**
 * 运动蚂蚁TOB官网 - 八类目标人群数据
 * BigAnts Eight Target User Personas
 * 
 * 定义运动蚂蚁官网的八类核心目标客户群体，
 * 为每个人群定制专属的解决方案、转化路径和内容呈现。
 */

// 目标人群类型
export type UserPersonaId = 
  | 'chain-investor'      // 连锁品牌投资者
  | 'commercial-property'  // 商业地产开发商
  | 'first-time-entrepreneur' // 初次创业者
  | 'government-project'    // 政府/文旅项目
  | 'traditional-entertainment' // 传统娱乐转型
  | 'family-venue'         // 亲子业态投资者
  | 'hospitality'          // 酒店/民宿业者
  | 'overseas-market';     // 海外市场进入者

// 人群痛点
export interface PersonaPainPoint {
  title: string;        // 痛点标题
  description: string;  // 痛点描述
  priority: 'high' | 'medium' | 'low'; // 优先级
}

// 人群触发词（用于AI识别）
export interface PersonaTrigger {
  keyword: string;      // 触发关键词
  weight: number;       // 权重 (1-10)
}

// 解决方案关联
export interface PersonaSolution {
  title: string;        // 方案标题
  description: string;  // 方案描述
  features: string[];   // 核心功能点
  saasFeature?: string; // 关联的SaaS功能
}

// 八类目标人群完整数据
export const USER_PERSONAS: Record<UserPersonaId, {
  id: UserPersonaId;
  name: string;                    // 人群名称
  subtitle: string;                // 人群副标题
  icon: string;                    // 图标
  color: string;                   // 主题色
  description: string;             // 人群描述
  painPoints: PersonaPainPoint[];   // 痛点列表
  triggers: PersonaTrigger[];       // 触发词
  solutions: PersonaSolution[];     // 解决方案
  targetBudget: string;            // 目标预算范围
  targetTimeline: string;          // 计划时间
  conversionStage: 'awareness' | 'consideration' | 'decision'; // 转化阶段
}> = {
  'chain-investor': {
    id: 'chain-investor',
    name: '连锁品牌投资者',
    subtitle: '规模化复制的数字化运动场馆',
    icon: '🏢',
    color: '#0066FF',
    description: '拥有多个商业综合体或连锁品牌，希望通过数字运动场馆实现规模化扩张和统一管理',
    painPoints: [
      {
        title: '选址扩张慢',
        description: '人工选址效率低，难以快速筛选优质点位，错过黄金位置',
        priority: 'high',
      },
      {
        title: '统一管理难',
        description: '多门店运营数据分散，无法实时掌握各店经营状况',
        priority: 'high',
      },
      {
        title: '内容更新慢',
        description: '设备游戏内容更新不及时，导致客户流失到竞品',
        priority: 'medium',
      },
      {
        title: '人员培训成本高',
        description: '每开新店都需要大量培训投入，时间长见效慢',
        priority: 'medium',
      },
    ],
    triggers: [
      { keyword: '连锁', weight: 9 },
      { keyword: '扩张', weight: 8 },
      { keyword: '复制', weight: 7 },
      { keyword: '多店', weight: 8 },
      { keyword: '管理', weight: 6 },
      { keyword: '选址', weight: 7 },
    ],
    solutions: [
      {
        title: 'EPC+O全流程服务',
        description: '从选址评估到开业运营的一站式服务，支持快速复制',
        features: ['智能选址系统', '标准化开店流程', '统一培训体系'],
        saasFeature: '选址评估系统',
      },
      {
        title: '神机营SaaS多门店管理',
        description: '一个后台管理所有门店，实时数据看板，远程运维监控',
        features: ['多门店数据汇总', '远程设备监控', '统一内容更新'],
        saasFeature: '多门店管理后台',
      },
    ],
    targetBudget: '100万-500万',
    targetTimeline: '3-6个月开业',
    conversionStage: 'consideration',
  },

  'commercial-property': {
    id: 'commercial-property',
    name: '商业地产开发商',
    subtitle: '差异化竞争的吸客利器',
    icon: '🏬',
    color: '#FF6B00',
    description: '购物中心、商业街、商场等商业地产，希望通过数字运动项目提升客流量和坪效',
    painPoints: [
      {
        title: '客流量下降',
        description: '电商冲击严重，线下客流持续减少，急需差异化业态吸引人群',
        priority: 'high',
      },
      {
        title: '坪效提升难',
        description: '传统业态坪效有限，希望引入高坪效业态提升整体收益',
        priority: 'high',
      },
      {
        title: '品牌差异化弱',
        description: '同质化严重，难以形成独特的品牌记忆点',
        priority: 'medium',
      },
      {
        title: '亲子客群流失',
        description: '家庭客群消费频次下降，需要吸引年轻家庭的特色业态',
        priority: 'medium',
      },
    ],
    triggers: [
      { keyword: '商场', weight: 9 },
      { keyword: '购物中心', weight: 8 },
      { keyword: '客流', weight: 8 },
      { keyword: '坪效', weight: 9 },
      { keyword: '差异化', weight: 7 },
      { keyword: '亲子', weight: 6 },
    ],
    solutions: [
      {
        title: '数字运动馆定制方案',
        description: '根据商场定位和客群特征，定制数字运动体验区',
        features: ['精准客群匹配', '网红打卡点打造', '活动营销联动'],
        saasFeature: '3D空间规划工具',
      },
      {
        title: '数据追踪与分析',
        description: '实时监测客流数据，量化数字运动区对整体的引流效果',
        features: ['客流统计分析', '消费行为追踪', '投资回报测算'],
        saasFeature: '客流分析系统',
      },
    ],
    targetBudget: '50万-200万',
    targetTimeline: '1-3个月',
    conversionStage: 'decision',
  },

  'first-time-entrepreneur': {
    id: 'first-time-entrepreneur',
    name: '初次创业者',
    subtitle: '从0到1的全程创业支持',
    icon: '🚀',
    color: '#00C853',
    description: '初次创业或首次接触数字运动行业，需要全程指导和低门槛入门',
    painPoints: [
      {
        title: '行业经验不足',
        description: '对数字运动行业了解有限，难以判断项目可行性',
        priority: 'high',
      },
      {
        title: '投资风险担忧',
        description: '担心投入后回本周期长，资金压力大',
        priority: 'high',
      },
      {
        title: '选址运营迷茫',
        description: '不知道如何选址、装修、运营，从何下手',
        priority: 'high',
      },
      {
        title: '资金周转紧张',
        description: '希望控制初期投入，降低创业风险',
        priority: 'medium',
      },
    ],
    triggers: [
      { keyword: '创业', weight: 9 },
      { keyword: '首次', weight: 8 },
      { keyword: '没有经验', weight: 9 },
      { keyword: '担心风险', weight: 8 },
      { keyword: '门槛', weight: 7 },
      { keyword: '回本', weight: 7 },
    ],
    solutions: [
      {
        title: '小投入快回本方案',
        description: '多种灵活套餐选择，首付即可启动，降低创业门槛',
        features: ['灵活付款方案', '最低首付40%', '托管运营服务'],
        saasFeature: '投资回报计算器',
      },
      {
        title: '全程创业扶持',
        description: '从选址评估到开业培训，手把手指导创业每一步',
        features: ['专业选址指导', '装修设计支持', '运营培训课程'],
        saasFeature: '选址评估系统',
      },
    ],
    targetBudget: '15万-50万',
    targetTimeline: '1-2个月开业',
    conversionStage: 'awareness',
  },

  'government-project': {
    id: 'government-project',
    name: '政府/文旅项目',
    subtitle: 'EPC+O全模式承接能力',
    icon: '🏛️',
    color: '#8B5CF6',
    description: '政府公共体育设施、文旅景区、智慧城市等大型项目，需要招投标承接能力',
    painPoints: [
      {
        title: '合规要求复杂',
        description: '政府项目资质要求高，审批流程繁琐',
        priority: 'high',
      },
      {
        title: '运营能力要求',
        description: '后期运营需要专业团队持续支持',
        priority: 'high',
      },
      {
        title: '资金安排特殊',
        description: '政府项目资金安排和结算有特殊要求',
        priority: 'medium',
      },
      {
        title: '品牌本地化',
        description: '需要在当地有服务能力或合作伙伴',
        priority: 'low',
      },
    ],
    triggers: [
      { keyword: '政府', weight: 9 },
      { keyword: '文旅', weight: 8 },
      { keyword: '招标', weight: 9 },
      { keyword: '投标', weight: 9 },
      { keyword: '智慧城市', weight: 7 },
      { keyword: '公共体育', weight: 8 },
    ],
    solutions: [
      {
        title: 'EPC+O全流程服务',
        description: '设计-采购-施工+运营全模式承接，满足政府项目全需求',
        features: ['EPC总包资质', '运营管理方案', '合规手续支持'],
        saasFeature: '项目管理系统',
      },
      {
        title: '标杆案例支撑',
        description: '已成功承接多个政府大型项目，提供完整案例参考',
        features: ['政府项目案例', '资质证书齐全', '本地服务网络'],
        saasFeature: '案例库',
      },
    ],
    targetBudget: '200万以上',
    targetTimeline: '6-12个月',
    conversionStage: 'awareness',
  },

  'traditional-entertainment': {
    id: 'traditional-entertainment',
    name: '传统娱乐转型',
    subtitle: '数字化升级的完整方案',
    icon: '🔄',
    color: '#FFB800',
    description: '传统游戏厅、游乐园、电玩城等，希望转型升级数字运动项目',
    painPoints: [
      {
        title: '业态同质化',
        description: '传统娱乐项目同质化严重，客户审美疲劳',
        priority: 'high',
      },
      {
        title: '竞争压力大',
        description: '新业态不断涌现，传统娱乐客流被分流',
        priority: 'high',
      },
      {
        title: '升级改造成本高',
        description: '担心改造投入大、周期长、影响正常营业',
        priority: 'medium',
      },
      {
        title: '内容更新慢',
        description: '传统设备内容单一，难以吸引年轻客群',
        priority: 'medium',
      },
    ],
    triggers: [
      { keyword: '转型', weight: 9 },
      { keyword: '升级', weight: 8 },
      { keyword: '传统', weight: 7 },
      { keyword: '改造', weight: 7 },
      { keyword: '游戏厅', weight: 6 },
      { keyword: '游乐园', weight: 6 },
    ],
    solutions: [
      {
        title: '渐进式升级方案',
        description: '可以根据现有条件分阶段改造，降低一次性投入压力',
        features: ['分期改造', '平滑过渡', '快速迭代'],
        saasFeature: '设备IoT监控系统',
      },
      {
        title: '数字运动内容矩阵',
        description: '60+款数字运动设备，持续更新的游戏内容，吸引年轻客群',
        features: ['新品持续更新', '会员体系联动', '线上线下融合'],
        saasFeature: '云端内容更新系统',
      },
    ],
    targetBudget: '30万-100万',
    targetTimeline: '1-3个月',
    conversionStage: 'consideration',
  },

  'family-venue': {
    id: 'family-venue',
    name: '亲子业态投资者',
    subtitle: '寓教于乐的亲子运动空间',
    icon: '👨‍👩‍👧‍👦',
    color: '#FF69B4',
    description: '亲子乐园、淘气堡、儿童中心等，面向亲子客群的投资者',
    painPoints: [
      {
        title: '同质化严重',
        description: '亲子业态同质化高，难以形成差异化竞争优势',
        priority: 'high',
      },
      {
        title: '安全要求高',
        description: '儿童安全是第一位，家长对安全性要求极高',
        priority: 'high',
      },
      {
        title: '内容更新慢',
        description: '孩子容易对单一内容失去兴趣，需要持续更新',
        priority: 'medium',
      },
      {
        title: '家长陪同无聊',
        description: '孩子玩耍时家长无事可做，缺乏家长互动内容',
        priority: 'low',
      },
    ],
    triggers: [
      { keyword: '亲子', weight: 9 },
      { keyword: '儿童', weight: 8 },
      { keyword: '乐园', weight: 7 },
      { keyword: '淘气堡', weight: 7 },
      { keyword: '安全', weight: 7 },
      { keyword: '寓教于乐', weight: 8 },
    ],
    solutions: [
      {
        title: '亲子数字运动方案',
        description: '专为亲子客群设计的数字运动设备，安全有趣，家长孩子都能玩',
        features: ['儿童安全设计', '亲子互动游戏', '成长数据记录'],
        saasFeature: '亲子互动系统',
      },
      {
        title: '早教内容融合',
        description: '将运动与早教结合，在游戏中促进儿童身心发展',
        features: ['运动能力培养', '认知发展追踪', '成长报告生成'],
        saasFeature: '儿童成长档案',
      },
    ],
    targetBudget: '20万-80万',
    targetTimeline: '1-2个月',
    conversionStage: 'consideration',
  },

  'hospitality': {
    id: 'hospitality',
    name: '酒店/民宿业者',
    subtitle: '增值服务提升入住体验',
    icon: '🏨',
    color: '#00BCD4',
    description: '度假酒店、精品民宿、公寓等，希望通过数字运动提升增值服务和客户体验',
    painPoints: [
      {
        title: '增值服务单一',
        description: '住宿以外的服务同质化严重，缺乏特色体验',
        priority: 'high',
      },
      {
        title: '客单价提升难',
        description: '房间收入有限，希望通过增值服务提升客单价',
        priority: 'medium',
      },
      {
        title: '淡季客流不足',
        description: '非旺季时期入住率低，需要吸引本地客群',
        priority: 'medium',
      },
      {
        title: '空间利用效率低',
        description: '公共空间利用不充分，浪费资源',
        priority: 'low',
      },
    ],
    triggers: [
      { keyword: '酒店', weight: 9 },
      { keyword: '民宿', weight: 8 },
      { keyword: '公寓', weight: 7 },
      { keyword: '增值服务', weight: 8 },
      { keyword: '入住体验', weight: 7 },
      { keyword: '特色', weight: 6 },
    ],
    solutions: [
      {
        title: '小型数字运动方案',
        description: '针对酒店公共区域的小型数字运动设备，不占空间吸引眼球',
        features: ['占地面积小', '安装便捷', '吸引眼球'],
        saasFeature: '空间规划工具',
      },
      {
        title: '会员联动系统',
        description: '与酒店会员系统联动，打造住客专属体验，提升复购率',
        features: ['会员积分打通', '住客专属优惠', '数据沉淀分析'],
        saasFeature: '会员管理系统',
      },
    ],
    targetBudget: '5万-30万',
    targetTimeline: '2-4周',
    conversionStage: 'decision',
  },

  'overseas-market': {
    id: 'overseas-market',
    name: '海外市场进入者',
    subtitle: '全球化品牌的本地化支持',
    icon: '🌏',
    color: '#607D8B',
    description: '希望将数字运动项目引入海外市场的品牌或投资者',
    painPoints: [
      {
        title: '本地化困难',
        description: '不了解当地市场需求和消费者偏好',
        priority: 'high',
      },
      {
        title: '供应链不稳定',
        description: '设备出口和配件供应可能有障碍',
        priority: 'high',
      },
      {
        title: '售后服务难',
        description: '海外售后服务难以保障，影响口碑',
        priority: 'medium',
      },
      {
        title: '合规要求不明',
        description: '各国法规标准不同，难以确定要求',
        priority: 'medium',
      },
    ],
    triggers: [
      { keyword: '海外', weight: 9 },
      { keyword: '出口', weight: 8 },
      { keyword: '国外', weight: 8 },
      { keyword: '国际市场', weight: 7 },
      { keyword: '全球', weight: 6 },
      { keyword: '跨国', weight: 6 },
    ],
    solutions: [
      {
        title: '品牌授权合作',
        description: '使用运动蚂蚁品牌，共享品牌影响力和运营支持体系',
        features: ['品牌授权', '运营培训', '本地化指导'],
        saasFeature: '多语言支持系统',
      },
      {
        title: '全球服务网络',
        description: '覆盖50+国家和地区的服务网络，就近提供支持',
        features: ['本地服务网点', '远程技术支持', '配件优先供应'],
        saasFeature: '全球服务网络',
      },
    ],
    targetBudget: '50万-500万',
    targetTimeline: '3-6个月',
    conversionStage: 'awareness',
  },
};

// 辅助函数：根据人群ID获取人群数据
export function getPersonaById(id: UserPersonaId) {
  return USER_PERSONAS[id];
}

// 辅助函数：根据关键词匹配人群
export function matchPersonaByKeywords(keywords: string[]): UserPersonaId[] {
  const scores: Record<UserPersonaId, number> = {
    'chain-investor': 0,
    'commercial-property': 0,
    'first-time-entrepreneur': 0,
    'government-project': 0,
    'traditional-entertainment': 0,
    'family-venue': 0,
    'hospitality': 0,
    'overseas-market': 0,
  };

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    for (const [personaId, persona] of Object.entries(USER_PERSONAS)) {
      for (const trigger of persona.triggers) {
        if (lowerKeyword.includes(trigger.keyword.toLowerCase())) {
          scores[personaId as UserPersonaId] += trigger.weight;
        }
      }
    }
  }

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id as UserPersonaId);
}

// 辅助函数：获取所有人群列表（用于筛选器）
export function getAllPersonas() {
  return Object.values(USER_PERSONAS);
}

// 辅助函数：根据转化阶段获取人群
export function getPersonasByStage(stage: 'awareness' | 'consideration' | 'decision') {
  return Object.values(USER_PERSONAS).filter(p => p.conversionStage === stage);
}
