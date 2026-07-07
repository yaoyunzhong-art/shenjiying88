// Recommended Product types
export interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  reason: string;
  matchScore: number;
  stock: number;
}

// Objection Case types
export type ObjectionType = 'price' | 'quality' | 'competitor' | 'need';

export interface ObjectionCase {
  id: string;
  type: ObjectionType;
  title: string;
  scenario: string;
  aiResponse: string;
  customerQuestion: string;
}

// Follow Up Task types
export interface FollowUpTask {
  id: string;
  customerId: string;
  customerName: string;
  content: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
}

// Sales Script types
export type ToneType = 'professional' | 'friendly' | 'urgent';

export interface SalesScript {
  id: string;
  productId: string;
  productName: string;
  scenario: string;
  tone: ToneType;
  content: string;
}

// MOCK Data
export const MOCK_RECOMMENDATIONS: RecommendedProduct[] = [
  {
    id: 'RP001',
    name: '智能运动手表Pro',
    price: 1299,
    imageUrl: '/images/watch-pro.jpg',
    category: '智能穿戴',
    reason: '根据用户浏览历史，推荐同价位高性价比款式',
    matchScore: 92,
    stock: 156,
  },
  {
    id: 'RP002',
    name: '无线降噪耳机',
    price: 899,
    imageUrl: '/images/earphones.jpg',
    category: '音频设备',
    reason: '与运动手表搭配购买享套餐优惠',
    matchScore: 88,
    stock: 234,
  },
  {
    id: 'RP003',
    name: '运动筋膜枪',
    price: 599,
    imageUrl: '/images/massage-gun.jpg',
    category: '运动器械',
    reason: '近期健身爱好者热搜商品',
    matchScore: 85,
    stock: 89,
  },
  {
    id: 'RP004',
    name: '瑜伽套装礼盒',
    price: 399,
    imageUrl: '/images/yoga-kit.jpg',
    category: '健身服饰',
    reason: '新用户首单专享满减优惠',
    matchScore: 78,
    stock: 312,
  },
  {
    id: 'RP005',
    name: '蛋白质营养粉',
    price: 268,
    imageUrl: '/images/protein.jpg',
    category: '营养保健',
    reason: '高评分商品，退货率低于2%',
    matchScore: 75,
    stock: 567,
  },
];

export const MOCK_OBJECTIONS: ObjectionCase[] = [
  {
    id: 'OC001',
    type: 'price',
    title: '价格太贵了',
    scenario: '客户认为商品价格超出预算',
    aiResponse: '我理解价格是重要的考虑因素。这款产品虽然单价稍高，但使用寿命比普通产品长3-5年，综合算下来每天成本反而更低。而且我们现在有分期付款选项，3期免息，每月只需支付约XXX元，不会造成资金压力。',
    customerQuestion: '便宜点可以吗？',
  },
  {
    id: 'OC002',
    type: 'quality',
    title: '担心质量问题',
    scenario: '客户对产品耐用性存在疑虑',
    aiResponse: '非常理解您的顾虑。我们提供2年官方质保，期间出现任何质量问题免费维修或更换。另外，这款产品经过10万次耐用性测试，返修率低于0.5%。您可以看看其他用户的评价，大多数都反馈质量非常可靠。',
    customerQuestion: '质量有保证吗？',
  },
  {
    id: 'OC003',
    type: 'competitor',
    title: '别家更便宜',
    scenario: '客户提及竞争对手价格更优',
    aiResponse: '感谢您提供这个信息。我帮您对比了一下，虽然他家价格略低，但我们的产品有以下优势：1）配置更高（具体说明）2）售后服务更完善（免费上门取件）3）用户口碑更好。当然，如果您有具体对比型号，我可以帮您详细分析。',
    customerQuestion: 'XX品牌比你们便宜...',
  },
  {
    id: 'OC004',
    type: 'need',
    title: '需要再考虑',
    scenario: '客户表示暂时不购买',
    aiResponse: '完全理解，购买确实需要慎重考虑。不过我想提醒您，这个优惠活动明天就要结束了，错过后恢复原价。如果您有什么顾虑，可以告诉我，我来帮您分析是否适合您的情况。或者我们可以先帮您保留这个优惠价格？',
    customerQuestion: '我再想想...',
  },
];

export const MOCK_FOLLOW_UPS: FollowUpTask[] = [
  {
    id: 'FU001',
    customerId: 'C001',
    customerName: '张女士',
    content: '跟进运动手表购买意向，确认尺码和颜色',
    dueDate: '2026-07-05T10:00:00Z',
    priority: 'high',
    status: 'pending',
  },
  {
    id: 'FU002',
    customerId: 'C002',
    customerName: '李先生',
    content: '发送产品规格对比表，解答技术问题',
    dueDate: '2026-07-04T14:00:00Z',
    priority: 'medium',
    status: 'pending',
  },
  {
    id: 'FU003',
    customerId: 'C003',
    customerName: '王女士',
    content: '确认订单配送时间，协调收货地址变更',
    dueDate: '2026-07-03T18:00:00Z',
    priority: 'low',
    status: 'completed',
  },
];

export const MOCK_SCRIPTS: SalesScript[] = [
  {
    id: 'SS001',
    productId: 'P001',
    productName: '智能运动手表Pro',
    scenario: '新客户首次咨询',
    tone: 'friendly',
    content: '您好！看到您对我们的运动手表感兴趣，非常高兴能为您服务。这款手表是今年的新款，支持心率监测、血氧检测GPS定位等功能，特别适合喜欢运动的朋友。请问您主要是跑步还是健身多一些呢？',
  },
  {
    id: 'SS002',
    productId: 'P001',
    productName: '智能运动手表Pro',
    scenario: '价格异议处理',
    tone: 'professional',
    content: '我理解您对价格的顾虑。这款手表虽然定位中高端，但功能非常全面。如果您按每天使用计算，每天的成本不到3块钱，却能帮助您科学管理运动强度和健康数据。而且我们提供24期免息分期，月供仅需54元。',
  },
  {
    id: 'SS003',
    productId: 'P002',
    productName: '无线降噪耳机',
    scenario: '促成交易',
    tone: 'urgent',
    content: '这个型号是我们店铺的爆款，目前库存只剩最后23台了。明天开始价格上涨100元。如果您现在下单，还可以获得价值89元的原装保护套。建议您尽快下单，以免错过优惠。',
  },
];
