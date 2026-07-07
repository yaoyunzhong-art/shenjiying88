/**
 * 运动蚂蚁TOB官网 - 神机营SaaS场景融合体系
 * BigAnts Shenjiying SaaS Integration
 * 
 * 定义神机营SaaS系统与官网各业务场景的深度融合，
 * 实现"认知系统+实体产品+专属服务"三位一体模式。
 */

// SaaS功能模块
export type SaaSFeatureId = 
  | 'site-selection'      // 智能选址系统
  | 'space-planning'       // 3D空间规划
  | 'operations-dashboard'  // 运营数据看板
  | 'member-marketing'     // 会员营销系统
  | 'equipment-monitor'     // IoT设备监控
  | 'content-update'        // 云端内容更新
  | 'multi-store'          // 多门店管理
  | 'roi-calculator'       // ROI计算器
  | 'customer-profile'      // 客户画像
  | 'ai-recommendation';   // AI智能推荐

// SaaS功能详情
export interface SaaSFeature {
  id: SaaSFeatureId;
  name: string;           // 功能名称
  icon: string;           // 功能图标
  description: string;    // 功能描述
  benefits: string[];     // 核心价值
  demoUrl?: string;       // 演示地址
}

// 业务场景
export type BusinessScenario = 
  | 'product'            // 产品介绍
  | 'epc'               // EPC服务
  | 'franchise'          // 招商加盟
  | 'cases'             // 案例中心
  | 'solutions'          // 解决方案
  | 'homepage'          // 首页
  | 'contact';           // 联系我们

// SaaS功能与业务场景的融合配置
export interface SaaSScenarioMapping {
  scenario: BusinessScenario;         // 业务场景
  features: {
    featureId: SaaSFeatureId;        // 功能ID
    title: string;                   // 展示标题
    description: string;             // 融合描述
    highlight: string;                // 高亮卖点
    position: 'main' | 'sidebar' | 'cta'; // 展示位置
  }[];
}

// 神机营SaaS功能完整数据
export const SAAS_FEATURES: Record<SaaSFeatureId, SaaSFeature> = {
  'site-selection': {
    id: 'site-selection',
    name: '智能选址系统',
    icon: '📍',
    description: '基于GIS地理信息系统和人流大数据分析，智能评估门店位置的商业潜力',
    benefits: [
      'AI大数据分析，精准评估位置潜力',
      '竞品分布热力图，识别市场空白',
      '目标客群画像匹配度分析',
      '投资回报周期预测',
    ],
    demoUrl: '/demo/site-selection',
  },
  'space-planning': {
    id: 'space-planning',
    name: '3D空间规划工具',
    icon: '📐',
    description: '专业3D设计工具，快速生成门店空间布局和效果图',
    benefits: [
      '拖拽式布局设计，所见即所得',
      '自动计算设备摆放最优解',
      '多风格模板库，一键应用',
      '实时导出工程图纸',
    ],
    demoUrl: '/demo/space-planning',
  },
  'operations-dashboard': {
    id: 'operations-dashboard',
    name: '运营数据看板',
    icon: '📊',
    description: '实时监测门店运营数据，图形化展示关键指标',
    benefits: [
      '实时客流统计与分析',
      '设备使用率热力图',
      '营收数据自动汇总',
      '异常预警即时推送',
    ],
    demoUrl: '/demo/operations-dashboard',
  },
  'member-marketing': {
    id: 'member-marketing',
    name: '会员营销系统',
    icon: '🎯',
    description: '完整的会员管理体系，支持多种营销玩法提升复购',
    benefits: [
      '会员分级权益体系',
      '积分商城兑换系统',
      '裂变分销推广工具',
      '精准营销推送',
    ],
    demoUrl: '/demo/member-marketing',
  },
  'equipment-monitor': {
    id: 'equipment-monitor',
    name: 'IoT设备监控',
    icon: '🔗',
    description: '物联网远程监控设备状态，故障预警自动派单',
    benefits: [
      '设备运行状态实时监测',
      '故障预警提前感知',
      '远程诊断减少停机',
      '配件库存智能管理',
    ],
    demoUrl: '/demo/equipment-monitor',
  },
  'content-update': {
    id: 'content-update',
    name: '云端内容更新',
    icon: '☁️',
    description: '游戏内容云端更新，持续保持新鲜感',
    benefits: [
      '每周更新热门游戏',
      '节日主题活动推送',
      '跨店联动竞技玩法',
      '玩家数据云端同步',
    ],
    demoUrl: '/demo/content-update',
  },
  'multi-store': {
    id: 'multi-store',
    name: '多门店管理',
    icon: '🏪',
    description: '一个后台管理所有门店，省时省力',
    benefits: [
      '门店分级分组管理',
      '运营数据汇总对比',
      '标准化运营流程下发',
      '权限精细化控制',
    ],
    demoUrl: '/demo/multi-store',
  },
  'roi-calculator': {
    id: 'roi-calculator',
    name: 'ROI计算器',
    icon: '🧮',
    description: '输入基本信息，智能测算投资回报周期和盈利模型',
    benefits: [
      '个性化投资方案测算',
      '回本周期预测分析',
      '盈利模型多场景对比',
      '敏感性分析工具',
    ],
    demoUrl: '/demo/roi-calculator',
  },
  'customer-profile': {
    id: 'customer-profile',
    name: '客户画像系统',
    icon: '👤',
    description: '深度分析客户消费行为，精准识别高价值客户',
    benefits: [
      '消费行为特征分析',
      '高价值客户识别',
      '精准营销转化追踪',
      '客户生命周期管理',
    ],
    demoUrl: '/demo/customer-profile',
  },
  'ai-recommendation': {
    id: 'ai-recommendation',
    name: 'AI智能推荐',
    icon: '🤖',
    description: '基于用户行为智能推荐内容和产品，提升转化率',
    benefits: [
      '千人千面内容推送',
      '智能匹配解决方案',
      '实时意图识别',
      '转化漏斗优化',
    ],
    demoUrl: '/demo/ai-recommendation',
  },
};

// 业务场景与SaaS功能融合映射
export const SAAS_SCENARIO_MAPPINGS: SaaSScenarioMapping[] = [
  {
    scenario: 'homepage',
    features: [
      {
        featureId: 'ai-recommendation',
        title: 'AI智能推荐',
        description: '根据您的需求智能推荐最适合的解决方案',
        highlight: '精准匹配，降低选择成本',
        position: 'main',
      },
      {
        featureId: 'roi-calculator',
        title: '投资回报计算器',
        description: '输入您的预算和场地信息，快速测算回本周期',
        highlight: '3分钟获取专属方案',
        position: 'cta',
      },
    ],
  },
  {
    scenario: 'product',
    features: [
      {
        featureId: 'equipment-monitor',
        title: 'IoT设备监控',
        description: '所有设备均接入神机营SaaS系统，远程监控、故障预警',
        highlight: '降低80%故障停机时间',
        position: 'main',
      },
      {
        featureId: 'content-update',
        title: '云端内容更新',
        description: '设备内容持续更新，保持新鲜感，吸引回头客',
        highlight: '每周更新，永久免费',
        position: 'main',
      },
      {
        featureId: 'ai-recommendation',
        title: 'AI智能选型',
        description: '根据您的场地和预算，AI推荐最适合的产品组合',
        highlight: '避免选型错误的投资浪费',
        position: 'sidebar',
      },
    ],
  },
  {
    scenario: 'epc',
    features: [
      {
        featureId: 'site-selection',
        title: '智能选址系统',
        description: 'EPC服务第一步，AI大数据评估最佳位置',
        highlight: '选址准确率提升90%',
        position: 'main',
      },
      {
        featureId: 'space-planning',
        title: '3D空间规划',
        description: '专业团队+3D工具，快速生成最优空间方案',
        highlight: '7天出具完整方案',
        position: 'main',
      },
      {
        featureId: 'operations-dashboard',
        title: '运营数据看板',
        description: '开业后持续提供数据化运营支持',
        highlight: '让每一分投入都可量化',
        position: 'sidebar',
      },
      {
        featureId: 'roi-calculator',
        title: 'ROI计算器',
        description: '在方案阶段就帮您算清投入产出',
        highlight: '明明白白投资',
        position: 'cta',
      },
    ],
  },
  {
    scenario: 'franchise',
    features: [
      {
        featureId: 'multi-store',
        title: '多门店管理',
        description: '无论您开多少家店，一个后台全部搞定',
        highlight: '规模化扩张的管理利器',
        position: 'main',
      },
      {
        featureId: 'operations-dashboard',
        title: '运营数据看板',
        description: '实时掌握各门店经营状况，及时发现问题',
        highlight: '随时随地，了然于胸',
        position: 'main',
      },
      {
        featureId: 'roi-calculator',
        title: '投资回报计算器',
        description: '三种合作模式对比，找到最适合您的方案',
        highlight: '智能对比，科学决策',
        position: 'main',
      },
      {
        featureId: 'member-marketing',
        title: '会员营销系统',
        description: '完整的会员体系，提升复购率和客单价',
        highlight: '让客户成为回头客',
        position: 'sidebar',
      },
    ],
  },
  {
    scenario: 'cases',
    features: [
      {
        featureId: 'operations-dashboard',
        title: '真实运营数据',
        description: '每个案例都配备可量化的运营数据',
        highlight: '数据来源可追溯',
        position: 'main',
      },
      {
        featureId: 'site-selection',
        title: '选址背景分析',
        description: '了解标杆案例是如何选址的',
        highlight: '成功可复制',
        position: 'sidebar',
      },
      {
        featureId: 'customer-profile',
        title: '客户画像分析',
        description: '分析案例项目的目标客群特征',
        highlight: '精准定位您的客户',
        position: 'sidebar',
      },
    ],
  },
  {
    scenario: 'solutions',
    features: [
      {
        featureId: 'ai-recommendation',
        title: '智能方案匹配',
        description: '基于您的具体情况，AI推荐最合适的解决方案',
        highlight: '100%匹配度的专属方案',
        position: 'main',
      },
      {
        featureId: 'roi-calculator',
        title: 'ROI计算器',
        description: '输入您的实际数据，获取专属投资回报分析',
        highlight: '让决策有数据支撑',
        position: 'cta',
      },
      {
        featureId: 'customer-profile',
        title: '客户画像工具',
        description: '帮助您分析目标客户特征，制定精准营销策略',
        highlight: '知己知彼，百战不殆',
        position: 'sidebar',
      },
    ],
  },
  {
    scenario: 'contact',
    features: [
      {
        featureId: 'ai-recommendation',
        title: '需求智能分析',
        description: 'AI分析您的需求，快速匹配合适的顾问和服务',
        highlight: '平均30秒极速响应',
        position: 'main',
      },
      {
        featureId: 'roi-calculator',
        title: '预约ROI诊断',
        description: '预约免费的一对一投资回报诊断服务',
        highlight: '专业顾问，深度分析',
        position: 'cta',
      },
    ],
  },
];

// 辅助函数：根据场景获取融合配置
export function getSaaSMappingsByScenario(scenario: BusinessScenario) {
  return SAAS_SCENARIO_MAPPINGS.find(m => m.scenario === scenario);
}

// 辅助函数：获取功能详情
export function getSaaSFeatureById(id: SaaSFeatureId) {
  return SAAS_FEATURES[id];
}

// 辅助函数：获取所有功能列表
export function getAllSaaSFeatures() {
  return Object.values(SAAS_FEATURES);
}

// 辅助函数：按场景获取功能列表
export function getSaaSFeaturesByScenario(scenario: BusinessScenario) {
  const mapping = getSaaSMappingsByScenario(scenario);
  if (!mapping) return [];
  return mapping.features.map(f => ({
    ...f,
    feature: SAAS_FEATURES[f.featureId],
  }));
}
