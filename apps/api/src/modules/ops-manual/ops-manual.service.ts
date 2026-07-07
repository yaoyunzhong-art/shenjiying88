/**
 * ops-manual.service.ts - T129-2 运营手册生成器
 * 用途: 生成店长/导购/收银/客服角色运营手册，支持多格式导出
 */

export type Role = 'store_manager' | 'sales_staff' | 'cashier' | 'customer_service'
export type ManualFormat = 'markdown' | 'html' | 'pdf-json' | 'checklist'

export interface ManualSection {
  id: string
  title: string
  content: string
  order: number
  subsections?: ManualSection[]
  checkpoints?: string[]
  warnings?: string[]
}

export interface RoleManual {
  role: Role
  title: string
  version: string
  lastUpdated: Date
  sections: ManualSection[]
  totalPages: number
  estimatedReadTime: number
}

interface SearchResult {
  sectionId: string
  title: string
  matchedContent: string
}

interface SOPStep {
  step: number
  action: string
  script: string
  tips?: string
}

// ── 店长手册内容 ────────────────────────────────────────────────────────────

const STORE_MANAGER_SECTIONS: ManualSection[] = [
  {
    id: 'sm-overview',
    title: '门店运营概览',
    order: 1,
    content: '店长日常运营管理全攻略，包含日/周/月任务清单，确保门店高效运转。',
    checkpoints: ['晨会召开', '目标确认', '进度追踪', '夕会总结'],
    warnings: ['客流高峰前必须完成巡店'],
  },
  {
    id: 'sm-staff',
    title: '人员管理',
    order: 2,
    content: '排班、考勤、绩效管理全流程，提升团队效率。',
    subsections: [
      { id: 'sm-staff-scheduling', title: '排班管理', order: 1, content: '根据客流预测合理安排员工班次。' },
      { id: 'sm-staff-attendance', title: '考勤管理', order: 2, content: '记录员工出勤、请假、迟到情况。' },
      { id: 'sm-staff-performance', title: '绩效评估', order: 3, content: '设定KPI，定期评估员工表现。' },
    ],
    checkpoints: ['排班表提前一周发布', '考勤数据当日录入', '绩效面谈每月一次'],
    warnings: ['禁止代打卡', '排班需符合劳动法规定'],
  },
  {
    id: 'sm-finance',
    title: '财务管理',
    order: 3,
    content: '日报、对账、结算全流程管理，保障资金安全。',
    subsections: [
      { id: 'sm-finance-daily', title: '日报管理', order: 1, content: '每日销售数据汇总核对。' },
      { id: 'sm-finance-recon', title: '对账管理', order: 2, content: '支付宝、微信、现金等渠道对账。' },
      { id: 'sm-finance-settle', title: '结算管理', order: 3, content: '供应商货款结算、员工工资发放。' },
    ],
    checkpoints: ['日结必须当日完成', '长短款当日处理', '备用金每日清点'],
    warnings: ['发现假币立即上报', '收款码不得替换'],
  },
  {
    id: 'sm-inventory',
    title: '库存管理',
    order: 4,
    content: '订货、盘点、调拨全流程，降低库存损耗。',
    subsections: [
      { id: 'sm-inventory-order', title: '订货管理', order: 1, content: '根据销售数据和安全库存制定订货计划。' },
      { id: 'sm-inventory-check', title: '盘点管理', order: 2, content: '定期盘点，确保账实相符。' },
      { id: 'sm-inventory-transfer', title: '调拨管理', order: 3, content: '门店间库存调拨流程。' },
    ],
    checkpoints: ['周盘必须每周完成', '临期商品提前预警', '调拨需双方确认'],
    warnings: ['滞销品不得私自处理', '报损需附照片证据'],
  },
  {
    id: 'sm-marketing',
    title: '营销活动',
    order: 5,
    content: '促销、优惠券、赛事活动策划执行，提升销售业绩。',
    subsections: [
      { id: 'sm-marketing-promo', title: '促销活动', order: 1, content: '满减、折扣、买赠活动策划。' },
      { id: 'sm-marketing-coupon', title: '优惠券管理', order: 2, content: '优惠券发放、核销、统计分析。' },
      { id: 'sm-marketing-event', title: '赛事活动', order: 3, content: '配合总部赛事活动落地执行。' },
    ],
    checkpoints: ['活动物料提前到位', '员工熟悉活动规则', '活动效果当日复盘'],
    warnings: ['优惠券不得超权限发放', '活动解释权归总部'],
  },
  {
    id: 'sm-complaint',
    title: '客诉处理',
    order: 6,
    content: '客户投诉升级流程和应急响应机制，保护品牌声誉。',
    subsections: [
      { id: 'sm-complaint-record', title: '投诉记录', order: 1, content: '详细记录投诉内容、客户信息、诉求。' },
      { id: 'sm-complaint-escalate', title: '升级流程', order: 2, content: '按照权限分级，依次升级处理。' },
      { id: 'sm-complaint-followup', title: '回访跟进', order: 3, content: '处理完毕后48小时内回访客户。' },
    ],
    checkpoints: ['重大投诉立即上报', '24小时内给出初步答复', '回访率100%'],
    warnings: ['严禁敷衍客户', '不得承诺超出权限的补偿'],
  },
  {
    id: 'sm-dashboard',
    title: '数据看板',
    order: 7,
    content: '核心经营指标解读，支持决策分析。',
    subsections: [
      { id: 'sm-dashboard-sales', title: '销售指标', order: 1, content: '销售额、客单价、转化率分析。' },
      { id: 'sm-dashboard-inventory', title: '库存指标', order: 2, content: '周转率、库存深度、滞销占比。' },
      { id: 'sm-dashboard-staff', title: '人员指标', order: 3, content: '人效、坪效、排班饱和度。' },
    ],
    checkpoints: ['数据每日更新', '异常数据当日分析', '周报按时提交'],
    warnings: ['数据保密，不得外泄', '分析结论需有数据支撑'],
  },
]

// ── 导购手册内容 ────────────────────────────────────────────────────────────

const SALES_STAFF_SECTIONS: ManualSection[] = [
  {
    id: 'sf-product',
    title: '产品知识',
    order: 1,
    content: '产品分类、卖点提炼、销售话术全解析。',
    subsections: [
      { id: 'sf-product-category', title: '产品分类', order: 1, content: '按功能、价格、适用人群分类。' },
      { id: 'sf-product-usp', title: '卖点提炼', order: 2, content: '每个产品的核心卖点和差异化优势。' },
      { id: 'sf-product-script', title: '话术参考', order: 3, content: '不同场景下的产品介绍话术。' },
    ],
    checkpoints: ['熟练掌握TOP20产品知识', '每月更新产品手册', '新品上市前必须培训'],
    warnings: ['不得虚假宣传功效', '竞品对比需客观公正'],
  },
  {
    id: 'sf-selling',
    title: '销售技巧',
    order: 2,
    content: '顾客接待、需求挖掘、促成交易全流程。',
    subsections: [
      { id: 'sf-selling-reception', title: '顾客接待', order: 1, content: '热情迎宾，建立信任关系。' },
      { id: 'sf-selling-discovery', title: '需求挖掘', order: 2, content: '通过提问了解顾客真实需求。' },
      { id: 'sf-selling-close', title: '促成交易', order: 3, content: '识别购买信号，主动促成。' },
    ],
    checkpoints: ['微笑服务', '需求探询不少于3个问题', '离店客户必须登记'],
    warnings: ['不得强行推销', '不得歧视任何顾客'],
  },
  {
    id: 'sf-member',
    title: '会员运营',
    order: 3,
    content: '积分、等级、SVIP权益管理，提升复购率。',
    subsections: [
      { id: 'sf-member-points', title: '积分管理', order: 1, content: '积分获取规则、兑换流程。' },
      { id: 'sf-member-level', title: '等级权益', order: 2, content: '会员等级体系、升级条件。' },
      { id: 'sf-member-svip', title: 'SVIP特权', order: 3, content: '高端会员专属权益和服务。' },
    ],
    checkpoints: ['新客100%注册会员', '会员信息变更当日更新', 'SVIP生日专属祝福'],
    warnings: ['会员积分不得虚假录入', '会员权益不得超标准兑现'],
  },
  {
    id: 'sf-blindbox',
    title: '盲盒销售',
    order: 4,
    content: '盲盒奖池、概率公示、端盒策略，提升客单价。',
    subsections: [
      { id: 'sf-blindbox-prize', title: '奖池介绍', order: 1, content: '各系列盲盒奖品池配置。' },
      { id: 'sf-blindbox-prob', title: '概率公示', order: 2, content: '各奖项中奖概率说明。' },
      { id: 'sf-blindbox-strategy', title: '端盒策略', order: 3, content: '引导顾客端盒的话术和技巧。' },
    ],
    checkpoints: ['奖池海报上墙', '概率说明张口就来', '端盒转化率纳入考核'],
    warnings: ['必须明示概率', '禁止虚假宣传限量'],
  },
  {
    id: 'sf-event',
    title: '赛事参与',
    order: 5,
    content: '赛事报名、赛程安排、奖励兑换全流程。',
    subsections: [
      { id: 'sf-event-register', title: '报名引导', order: 1, content: '协助顾客完成赛事报名。' },
      { id: 'sf-event-schedule', title: '赛程通知', order: 2, content: '及时通知顾客赛事时间和地点。' },
      { id: 'sf-event-reward', title: '奖励兑换', order: 3, content: '赛事奖励领取和发放流程。' },
    ],
    checkpoints: ['赛事活动当天再次提醒', '奖励发放不过夜', '赛事故事积极分享'],
    warnings: ['不得代替顾客做参赛决定', '奖励不得截留'],
  },
  {
    id: 'sf-commission',
    title: '收入计算',
    order: 6,
    content: '提成比例、结算周期、收入明细查询。',
    subsections: [
      { id: 'sf-commission-rate', title: '提成比例', order: 1, content: '各类产品提成比例表。' },
      { id: 'sf-commission-cycle', title: '结算周期', order: 2, content: '月结、次月15日前发放。' },
      { id: 'sf-commission-query', title: '收入查询', order: 3, content: '通过系统查询个人收入明细。' },
    ],
    checkpoints: ['提成规则每月公示', '异议收入3日内反馈', '年终奖按时发放'],
    warnings: ['不得虚报业绩', '不得私单飞单'],
  },
]

// ── 收银手册内容 ────────────────────────────────────────────────────────────

const CASHIER_SECTIONS: ManualSection[] = [
  {
    id: 'cr-system',
    title: '收银系统',
    order: 1,
    content: '收银系统开关机、日结、周结操作指南。',
    subsections: [
      { id: 'cr-system-startup', title: '开机流程', order: 1, content: '每日开业前收银系统启动步骤。' },
      { id: 'cr-system-shutdown', title: '关机流程', order: 2, content: '每日营业后收银系统关闭步骤。' },
      { id: 'cr-system-daily', title: '日结操作', order: 3, content: '完成每日销售数据汇总。' },
      { id: 'cr-system-weekly', title: '周结操作', order: 4, content: '完成每周账务核对。' },
    ],
    checkpoints: ['开机前检查网络连接', '日结必须当日完成', '周结打印留存报表'],
    warnings: ['系统异常不得擅自重启', '交接班必须打印小票'],
  },
  {
    id: 'cr-payment',
    title: '收款方式',
    order: 2,
    content: '现金、支付宝、微信、PayPal、Stripe等收款操作。',
    subsections: [
      { id: 'cr-payment-cash', title: '现金收款', order: 1, content: '现金收款、找零、假币识别。' },
      { id: 'cr-payment-alipay', title: '支付宝', order: 2, content: '支付宝收款码和当面付操作。' },
      { id: 'cr-payment-wechat', title: '微信支付', order: 3, content: '微信收款码和扫码付操作。' },
      { id: 'cr-payment-paypal', title: 'PayPal', order: 4, content: 'PayPal跨境收款操作。' },
      { id: 'cr-payment-stripe', title: 'Stripe', order: 5, content: 'Stripe信用卡收款操作。' },
    ],
    checkpoints: ['二维码收款必须扫码确认', '异常订单立即查询', '跨境支付注意汇率'],
    warnings: ['收款码不得替换', '信用卡必须本人操作'],
  },
  {
    id: 'cr-offline',
    title: '离线收银',
    order: 3,
    content: '断网情况下的离线收银操作和数据同步。',
    subsections: [
      { id: 'cr-offline-operate', title: '离线操作', order: 1, content: '断网时收银系统使用方式。' },
      { id: 'cr-offline-sync', title: '数据同步', order: 2, content: '网络恢复后数据上传同步。' },
    ],
    checkpoints: ['离线模式启动有提示音', '离线小票必须单独存放', '网络恢复后30分钟内同步'],
    warnings: ['离线时长不得超过4小时', '离线数据丢失需上报'],
  },
  {
    id: 'cr-refund',
    title: '退款处理',
    order: 4,
    content: '原路退回、积分返还、退款进度查询。',
    subsections: [
      { id: 'cr-refund-original', title: '原路退回', order: 1, content: '支付宝、微信、银行卡退款。' },
      { id: 'cr-refund-points', title: '积分返还', order: 2, content: '退款时积分返还规则。' },
      { id: 'cr-refund-query', title: '进度查询', order: 3, content: '退款状态查询和顾客解释。' },
    ],
    checkpoints: ['退款必须核对原订单', '退款原因必须记录', '退款完成短信通知顾客'],
    warnings: ['退款权限不得超越', '大额退款需主管授权'],
  },
  {
    id: 'cr-promotion',
    title: '促销核销',
    order: 5,
    content: '优惠券、满减、会员折扣核销操作。',
    subsections: [
      { id: 'cr-promotion-coupon', title: '优惠券核销', order: 1, content: '优惠券扫码和手动核销。' },
      { id: 'cr-promotion-discount', title: '满减核销', order: 2, content: '满减活动叠加规则和操作。' },
      { id: 'cr-promotion-member', title: '会员折扣', order: 3, content: '会员价和等级折扣应用。' },
    ],
    checkpoints: ['核销前核对券的有效期', '满减必须达到门槛', '会员折扣需确认身份'],
    warnings: ['优惠券不得重复使用', '折扣不得叠加错误'],
  },
  {
    id: 'cr-reconciliation',
    title: '对账差错',
    order: 6,
    content: '长短款处理、差错排查、平账操作。',
    subsections: [
      { id: 'cr-recon-short', title: '短款处理', order: 1, content: '收款金额少于系统记录的处理。' },
      { id: 'cr-recon-over', title: '长款处理', order: 2, content: '收款金额多于系统记录的处理。' },
      { id: 'cr-recon-investigate', title: '差错排查', order: 3, content: '排查差异原因、追溯环节。' },
      { id: 'cr-recon-balance', title: '平账操作', order: 4, content: '经审批后的平账处理。' },
    ],
    checkpoints: ['长短款当日发现当日处理', '差异原因必须查明', '平账需经财务审批'],
    warnings: ['长短款不得隐瞒', '未经审批不得自行平账'],
  },
]

// ── 客服手册内容 ────────────────────────────────────────────────────────────

const CUSTOMER_SERVICE_SECTIONS: ManualSection[] = [
  {
    id: 'cs-faq',
    title: '常见问题',
    order: 1,
    content: 'FAQ分类索引，快速定位问题答案。',
    subsections: [
      { id: 'cs-faq-product', title: '产品类问题', order: 1, content: '产品功能、使用方法、注意事项。' },
      { id: 'cs-faq-order', title: '订单类问题', order: 2, content: '订单状态、修改取消、物流查询。' },
      { id: 'cs-faq-payment', title: '支付类问题', order: 3, content: '支付失败、退款进度、发票开具。' },
    ],
    checkpoints: ['FAQ每周更新', '高频问题置顶展示', '复杂问题及时升级'],
    warnings: ['回答必须准确，不得猜测', '涉及钱款问题必须慎重'],
  },
  {
    id: 'cs-member',
    title: '会员问题',
    order: 2,
    content: '积分查询、等级权益、会员特权解答。',
    subsections: [
      { id: 'cs-member-points', title: '积分查询', order: 1, content: '积分余额、积分明细、积分即将过期提醒。' },
      { id: 'cs-member-level', title: '等级权益', order: 2, content: '等级升级条件、当前等级特权。' },
      { id: 'cs-member-benefit', title: 'SVIP权益', order: 3, content: '高端会员专属权益和使用方法。' },
    ],
    checkpoints: ['积分明细可在线查询', '等级变化主动告知', 'SVIP生日祝福按时发送'],
    warnings: ['积分不得随意修改', '等级评定必须符合规则'],
  },
  {
    id: 'cs-order',
    title: '订单问题',
    order: 3,
    content: '订单状态、修改取消、物流异常处理。',
    subsections: [
      { id: 'cs-order-status', title: '状态查询', order: 1, content: '订单各状态含义和预计时间。' },
      { id: 'cs-order-modify', title: '修改取消', order: 2, content: '订单修改和取消的规则和流程。' },
      { id: 'cs-order-logistics', title: '物流异常', order: 3, content: '物流延迟、丢件、拒收处理。' },
    ],
    checkpoints: ['订单状态2小时内更新', '取消订单当日处理', '物流投诉24小时内响应'],
    warnings: ['已发货订单不得擅自取消', '退款金额必须精确计算'],
  },
  {
    id: 'cs-complaint',
    title: '投诉处理',
    order: 4,
    content: '投诉记录、升级流程、回访跟进。',
    subsections: [
      { id: 'cs-complaint-record', title: '记录标准', order: 1, content: '投诉内容记录模板和要素。' },
      { id: 'cs-complaint-escalate', title: '升级标准', order: 2, content: '什么情况需要升级处理。' },
      { id: 'cs-complaint-followup', title: '回访标准', order: 3, content: '回访时间、回访话术、回访记录。' },
    ],
    checkpoints: ['投诉30分钟内首次响应', '重大投诉2小时内升级', '回访率100%'],
    warnings: ['不得与顾客争吵', '不得承诺无法兑现的处理方案'],
  },
  {
    id: 'cs-refund',
    title: '退款跟进',
    order: 5,
    content: '退款进度查询、催促处理、退款失败排查。',
    subsections: [
      { id: 'cs-refund-progress', title: '进度查询', order: 1, content: '各渠道退款到账时间说明。' },
      { id: 'cs-refund-remind', title: '催促处理', order: 2, content: '超时未到账的催促流程。' },
      { id: 'cs-refund-fail', title: '失败排查', order: 3, content: '退款失败的常见原因和解决方案。' },
    ],
    checkpoints: ['退款进度可实时查询', '超时3日主动跟进', '失败退款重新发起'],
    warnings: ['不得私自承诺到账时间', '退款必须原路返回'],
  },
  {
    id: 'cs-script',
    title: '话术模板',
    order: 6,
    content: '迎宾、解答、安抚、挽留标准话术。',
    subsections: [
      { id: 'cs-script-welcome', title: '迎宾话术', order: 1, content: '接起电话或消息的第一句话。' },
      { id: 'cs-script-answer', title: '解答话术', order: 2, content: '常见问题的标准回答。' },
      { id: 'cs-script-appease', title: '安抚话术', order: 3, content: '顾客情绪激动时的应对。' },
      { id: 'cs-script-retention', title: '挽留话术', order: 4, content: '顾客要放弃或转会员时的挽留。' },
    ],
    checkpoints: ['语速适中、语气亲切', '禁止打断顾客', '挂机前确认问题已解决'],
    warnings: ['不得使用忌语', '不得态度冷漠'],
  },
]

// ── SOP 步骤数据 ─────────────────────────────────────────────────────────────

const SOP_DATA: Record<string, SOPStep[]> = {
  'sm-overview': [
    { step: 1, action: '晨会召开', script: '各位同事早上好，今天我们的销售目标是XX，加油！', tips: '简短有力，营造氛围' },
    { step: 2, action: '目标确认', script: '今日目标已分解到个人，请确认各自目标。', tips: '确保每位员工清楚目标' },
    { step: 3, action: '进度追踪', script: '各位同事，目前进度XX%，还有XX需要完成。', tips: '每小时播报一次' },
    { step: 4, action: '夕会总结', script: '今日目标完成情况XX%，明天重点关注XX。', tips: '总结经验，激励团队' },
  ],
  'sf-selling-reception': [
    { step: 1, action: '微笑迎宾', script: '您好，欢迎光临！请问有什么可以帮您？', tips: '表情自然，眼神接触' },
    { step: 2, action: '需求探询', script: '请问您是为自己选购还是送人呢？', tips: '了解顾客真实需求' },
    { step: 3, action: '产品推荐', script: '根据您的需求，我推荐这款产品，它的特点是...', tips: '突出差异化卖点' },
    { step: 4, action: '促成交易', script: '这款产品今天刚好有活动，非常划算，要不要帮您包起来？', tips: '识别购买信号' },
  ],
  'cr-system-daily': [
    { step: 1, action: '关闭交易', script: '系统提示：是否进行日结？', tips: '确认当日所有交易完成' },
    { step: 2, action: '核对流水', script: '请核对系统流水与实际收款是否一致。', tips: '逐笔核对' },
    { step: 3, action: '差异处理', script: '如有差异，请填写差异报告单。', tips: '长短款当日处理' },
    { step: 4, action: '打印报表', script: '日结完成，请打印日报表并签字。', tips: '留存备查' },
  ],
  'cs-script-welcome': [
    { step: 1, action: '问候客户', script: '您好，很高兴为您服务，请问有什么可以帮您？', tips: '语气热情专业' },
    { step: 2, action: '确认身份', script: '请问您是会员吗？方便提供一下手机号码吗？', tips: '快速查询会员信息' },
    { step: 3, action: '问题确认', script: '好的，我这边看到您的问题是...对吗？', tips: '确保理解准确' },
    { step: 4, action: '开始处理', script: '我这边马上为您处理，请稍等。', tips: '给顾客预期时间' },
  ],
}

// ── OpsManualService ─────────────────────────────────────────────────────────

export class OpsManualService {
  // ── 手册生成 ──────────────────────────────────────────────────────────────

  /** 生成角色运营手册 */
  generateManual(role: Role): RoleManual {
    switch (role) {
      case 'store_manager':
        return this.generateStoreManagerManual()
      case 'sales_staff':
        return this.generateSalesStaffManual()
      case 'cashier':
        return this.generateCashierManual()
      case 'customer_service':
        return this.generateCustomerServiceManual()
    }
  }

  /** 获取手册元信息 */
  getManualInfo(role: Role): { title: string; version: string; sections: number; estimatedReadTime: number } {
    const manual = this.generateManual(role)
    return {
      title: manual.title,
      version: manual.version,
      sections: manual.sections.length,
      estimatedReadTime: manual.estimatedReadTime,
    }
  }

  // ── 店长手册 ─────────────────────────────────────────────────────────────

  generateStoreManagerManual(): RoleManual {
    const sections = STORE_MANAGER_SECTIONS.map(s => ({ ...s, checkpoints: [...(s.checkpoints ?? [])], warnings: [...(s.warnings ?? [])] }))
    const totalContent = sections.map(s => s.content).join('')
    const totalPages = Math.max(7, Math.ceil(totalContent.length / 500))

    return {
      role: 'store_manager',
      title: '店长运营手册',
      version: '1.0.0',
      lastUpdated: new Date(),
      sections,
      totalPages,
      estimatedReadTime: Math.ceil(totalContent.length / 400),
    }
  }

  // ── 导购手册 ─────────────────────────────────────────────────────────────

  generateSalesStaffManual(): RoleManual {
    const sections = SALES_STAFF_SECTIONS.map(s => ({ ...s, checkpoints: [...(s.checkpoints ?? [])], warnings: [...(s.warnings ?? [])] }))
    const totalContent = sections.map(s => s.content).join('')
    const totalPages = Math.max(6, Math.ceil(totalContent.length / 500))

    return {
      role: 'sales_staff',
      title: '导购运营手册',
      version: '1.0.0',
      lastUpdated: new Date(),
      sections,
      totalPages,
      estimatedReadTime: Math.ceil(totalContent.length / 400),
    }
  }

  // ── 收银手册 ─────────────────────────────────────────────────────────────

  generateCashierManual(): RoleManual {
    const sections = CASHIER_SECTIONS.map(s => ({ ...s, checkpoints: [...(s.checkpoints ?? [])], warnings: [...(s.warnings ?? [])] }))
    const totalContent = sections.map(s => s.content).join('')
    const totalPages = Math.max(6, Math.ceil(totalContent.length / 500))

    return {
      role: 'cashier',
      title: '收银运营手册',
      version: '1.0.0',
      lastUpdated: new Date(),
      sections,
      totalPages,
      estimatedReadTime: Math.ceil(totalContent.length / 400),
    }
  }

  // ── 客服手册 ─────────────────────────────────────────────────────────────

  generateCustomerServiceManual(): RoleManual {
    const sections = CUSTOMER_SERVICE_SECTIONS.map(s => ({ ...s, checkpoints: [...(s.checkpoints ?? [])], warnings: [...(s.warnings ?? [])] }))
    const totalContent = sections.map(s => s.content).join('')
    const totalPages = Math.max(6, Math.ceil(totalContent.length / 500))

    return {
      role: 'customer_service',
      title: '客服运营手册',
      version: '1.0.0',
      lastUpdated: new Date(),
      sections,
      totalPages,
      estimatedReadTime: Math.ceil(totalContent.length / 400),
    }
  }

  // ── 格式化导出 ───────────────────────────────────────────────────────────

  /** 导出为 Markdown */
  exportMarkdown(manual: RoleManual): string {
    const lines: string[] = []
    lines.push(`# ${manual.title}`)
    lines.push('')
    lines.push(`**版本**: ${manual.version}  |  **更新时间**: ${manual.lastUpdated.toISOString().split('T')[0]}  |  **预计阅读**: ${manual.estimatedReadTime}分钟`)
    lines.push('')
    lines.push('---')
    lines.push('')

    for (const section of manual.sections) {
      lines.push(`## ${section.order}. ${section.title}`)
      lines.push('')
      lines.push(section.content)
      lines.push('')

      if (section.checkpoints && section.checkpoints.length > 0) {
        lines.push('**关键检查点**:')
        for (const cp of section.checkpoints) {
          lines.push(`- [ ] ${cp}`)
        }
        lines.push('')
      }

      if (section.warnings && section.warnings.length > 0) {
        lines.push('**⚠️ 风险警示**:')
        for (const w of section.warnings) {
          lines.push(`- ${w}`)
        }
        lines.push('')
      }

      if (section.subsections && section.subsections.length > 0) {
        lines.push('### 子章节')
        lines.push('')
        for (const sub of section.subsections) {
          lines.push(`#### ${sub.order}. ${sub.title}`)
          lines.push('')
          lines.push(sub.content)
          lines.push('')
        }
      }

      lines.push('---')
      lines.push('')
    }

    return lines.join('\n')
  }

  /** 导出为 HTML */
  exportHTML(manual: RoleManual): string {
    const sectionsHtml = manual.sections.map(section => {
      let html = `    <section class="manual-section">
      <h2>${section.order}. ${this.escapeHtml(section.title)}</h2>
      <p>${this.escapeHtml(section.content)}</p>
`

      if (section.checkpoints && section.checkpoints.length > 0) {
        html += `      <div class="checkpoints">
        <h3>关键检查点</h3>
        <ul>
`
        for (const cp of section.checkpoints) {
          html += `          <li><input type="checkbox"> ${this.escapeHtml(cp)}</li>\n`
        }
        html += `        </ul>
      </div>
`
      }

      if (section.warnings && section.warnings.length > 0) {
        html += `      <div class="warnings">
        <h3>⚠️ 风险警示</h3>
        <ul>
`
        for (const w of section.warnings) {
          html += `          <li>${this.escapeHtml(w)}</li>\n`
        }
        html += `        </ul>
      </div>
`
      }

      if (section.subsections && section.subsections.length > 0) {
        html += `      <div class="subsections">
`
        for (const sub of section.subsections) {
          html += `        <div class="subsection">
          <h3>${sub.order}. ${this.escapeHtml(sub.title)}</h3>
          <p>${this.escapeHtml(sub.content)}</p>
        </div>
`
        }
        html += `      </div>
`
      }

      html += `    </section>
`
      return html
    }).join('\n')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(manual.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #007bff; margin-top: 30px; }
    h3 { color: #666; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .manual-section { margin-bottom: 40px; border-left: 3px solid #007bff; padding-left: 20px; }
    .checkpoints { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .warnings { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .subsection { background: #f1f3f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(manual.title)}</h1>
  <div class="meta">版本: ${manual.version} | 更新时间: ${manual.lastUpdated.toISOString().split('T')[0]} | 预计阅读: ${manual.estimatedReadTime}分钟</div>
  <hr>
${sectionsHtml}
</body>
</html>`
  }

  /** 导出为检查清单 */
  exportChecklist(manual: RoleManual): string {
    const lines: string[] = []
    lines.push(`# ${manual.title} - 检查清单`)
    lines.push('')
    lines.push(`版本: ${manual.version}  |  更新: ${manual.lastUpdated.toISOString().split('T')[0]}`)
    lines.push('')

    let totalCheckpoints = 0

    for (const section of manual.sections) {
      lines.push(`## ${section.order}. ${section.title}`)
      lines.push('')

      if (section.checkpoints && section.checkpoints.length > 0) {
        for (const cp of section.checkpoints) {
          lines.push(`[ ] ${cp}`)
          totalCheckpoints++
        }
      }

      if (section.warnings && section.warnings.length > 0) {
        lines.push('')
        lines.push(`**⚠️ 警示**:`)
        for (const w of section.warnings) {
          lines.push(`⚠️ ${w}`)
        }
      }

      if (section.subsections && section.subsections.length > 0) {
        lines.push('')
        for (const sub of section.subsections) {
          lines.push(`### ${section.order}.${sub.order} ${sub.title}`)
          lines.push(sub.content)
          lines.push('')
        }
      }

      lines.push('')
    }

    lines.push('---')
    lines.push(`**总计: ${totalCheckpoints} 个检查点**`)
    return lines.join('\n')
  }

  /** 导出为 PDF JSON（供后端 PDF 服务使用）*/
  exportPDFJSON(manual: RoleManual): string {
    const pdfJson = {
      title: manual.title,
      version: manual.version,
      lastUpdated: manual.lastUpdated.toISOString(),
      metadata: {
        totalPages: manual.totalPages,
        estimatedReadTime: manual.estimatedReadTime,
        role: manual.role,
      },
      sections: manual.sections.map(section => ({
        id: section.id,
        order: section.order,
        title: section.title,
        content: section.content,
        checkpoints: section.checkpoints ?? [],
        warnings: section.warnings ?? [],
        subsections: section.subsections?.map(sub => ({
          id: sub.id,
          order: sub.order,
          title: sub.title,
          content: sub.content,
        })) ?? [],
      })),
    }
    return JSON.stringify(pdfJson, null, 2)
  }

  // ── 搜索 ─────────────────────────────────────────────────────────────────

  /** 搜索手册内容 */
  searchManual(role: Role, keyword: string): SearchResult[] {
    const manual = this.generateManual(role)
    const results: SearchResult[] = []
    const lowerKeyword = keyword.toLowerCase()

    for (const section of manual.sections) {
      const content = section.content.toLowerCase()
      if (content.includes(lowerKeyword)) {
        const index = content.indexOf(lowerKeyword)
        const start = Math.max(0, index - 20)
        const end = Math.min(content.length, index + keyword.length + 20)
        results.push({
          sectionId: section.id,
          title: section.title,
          matchedContent: '...' + section.content.slice(start, end) + '...',
        })
      }

      if (section.subsections) {
        for (const sub of section.subsections) {
          if (sub.content.toLowerCase().includes(lowerKeyword)) {
            const index = sub.content.toLowerCase().indexOf(lowerKeyword)
            const start = Math.max(0, index - 20)
            const end = Math.min(sub.content.length, index + keyword.length + 20)
            results.push({
              sectionId: sub.id,
              title: `${section.title} > ${sub.title}`,
              matchedContent: '...' + sub.content.slice(start, end) + '...',
            })
          }
        }
      }
    }

    return results
  }

  /** 获取 SOP 步骤（用于话术推荐）*/
  getSOP(role: Role, sectionId: string): SOPStep[] {
    const manual = this.generateManual(role)

    // 先在 SOP_DATA 中查找
    if (SOP_DATA[sectionId]) {
      return SOP_DATA[sectionId]
    }

    // 找不到则根据 sectionId 匹配
    for (const section of manual.sections) {
      if (section.id === sectionId) {
        return this.generateSOPFromSection(section)
      }
      if (section.subsections) {
        for (const sub of section.subsections) {
          if (sub.id === sectionId) {
            return this.generateSOPFromSection(sub)
          }
        }
      }
    }

    return []
  }

  // ── 私有辅助方法 ─────────────────────────────────────────────────────────

  private generateSOPFromSection(section: ManualSection): SOPStep[] {
    const checkpoints = section.checkpoints ?? []
    if (checkpoints.length === 0) {
      return []
    }
    return checkpoints.map((cp, idx) => ({
      step: idx + 1,
      action: cp,
      script: `请完成: ${cp}`,
      tips: `标准操作步骤 ${idx + 1}`,
    }))
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
}
