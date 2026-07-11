'use client';

/**
 * 帮助中心-常见问题页面 - FAQ Page
 * 角色: 🛒 前台消费者视角
 * 功能: 分类Tab展示、搜索过滤、展开折叠问答
 */

import React, { useState, useMemo, useCallback } from 'react';

// ================================================================
// Types
// ================================================================

type FaqCategory = 'account' | 'payment' | 'booking' | 'member' | 'device' | 'other';

interface FaqCategoryMeta {
  id: FaqCategory;
  label: string;
  icon: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  tags: string[];
  hot?: boolean;
  updatedAt: string;
}

// ================================================================
// Mock Data
// ================================================================

const CATEGORIES: FaqCategoryMeta[] = [
  { id: 'account', label: '账号问题', icon: '👤' },
  { id: 'payment', label: '支付问题', icon: '💳' },
  { id: 'booking',  label: '预约问题', icon: '📅' },
  { id: 'member',  label: '会员问题', icon: '⭐' },
  { id: 'device',  label: '设备问题', icon: '🕹️' },
  { id: 'other',   label: '其他问题', icon: '💬' },
];

const FAQ_DATA: FaqItem[] = [
  // 账号问题 (account)
  { id: 'a1', category: 'account', question: '如何注册账号？', answer: '打开 Shenjiying App 或门店小程序，点击注册。你可以使用手机号快速注册，也可以使用微信一键登录。注册时需要填写手机号并获取短信验证码验证。注册完成后即可开始预约场地和购买套餐。', tags: ['注册', '账号', '登录'], hot: true, updatedAt: '2026-06-01' },
  { id: 'a2', category: 'account', question: '忘记密码怎么办？', answer: '在登录页面点击忘记密码，输入已注册的手机号，获取短信验证码后即可重置密码。如果手机号已更换无法接收验证码，请联系在线客服，提供身份信息后协助重置。建议设置便于记忆但安全性高的密码。', tags: ['密码', '找回', '登录'], updatedAt: '2026-05-20' },
  { id: 'a3', category: 'account', question: '如何修改个人资料？', answer: '登录后进入个人中心页面，点击编辑按钮即可修改头像、昵称、性别等信息。手机号如需更换，需通过原手机号验证后修改。如果原手机号无法使用，请联系客服提供身份证明材料进行换绑。', tags: ['资料', '修改', '个人中心'], updatedAt: '2026-06-05' },
  { id: 'a4', category: 'account', question: '一个手机号可以绑定多个账号吗？', answer: '一个手机号只能绑定一个账号。如果需要更换绑定，可以在账号安全设置中解绑当前账号，再重新绑定新的手机号。注意解绑后原账号仍然存在，只是登录方式需要切换为账号密码登录。', tags: ['绑定', '手机号', '账号'], updatedAt: '2026-04-10' },
  { id: 'a5', category: 'account', question: '账号被封禁了怎么办？', answer: '账号因违规操作（如恶意刷单、虚假评价等）可能被临时或永久封禁。请联系客服了解具体原因，按照指引进行申诉。申诉通过后会自动解封。多次违规可能导致永久封禁且不可申诉。', tags: ['封禁', '申诉', '违规'], hot: true, updatedAt: '2026-06-10' },
  { id: 'a6', category: 'account', question: '如何注销账号？', answer: '在设置页面选择账号注销，阅读注销须知后确认操作。注销后所有数据（包括积分、余额、预约记录等）将被清除且不可恢复，请谨慎操作。提交申请后有7天冷静期，期间可取消注销。', tags: ['注销', '删除', '账号'], updatedAt: '2026-05-15' },

  // 支付问题 (payment)
  { id: 'p1', category: 'payment', question: '支持哪些支付方式？', answer: '目前支持微信支付、支付宝、银行卡（储蓄卡/信用卡）三种支付方式。部分门店还支持门店储值卡和会员余额支付。在线支付时默认使用已绑定的支付方式，也可以在结算页面切换。', tags: ['支付', '方式'], hot: true, updatedAt: '2026-06-08' },
  { id: 'p2', category: 'payment', question: '支付失败怎么办？', answer: '请先检查网络连接是否正常、账户余额是否充足、支付密码是否正确。如多次失败，尝试更换支付方式或联系发卡行。系统不会重复扣款，如果已扣款但订单未生成，我们会自动退款。', tags: ['支付失败', '扣款', '网络'], updatedAt: '2026-05-25' },
  { id: 'p3', category: 'payment', question: '如何申请退款？', answer: '在订单详情页点击申请退款，选择退款原因后提交。预约订单请在预约时间前至少2小时申请，过时可能产生手续费。非预约消费的退款请联系门店工作人员处理。预计3-7个工作日到账。', tags: ['退款', '取消', '订单'], hot: true, updatedAt: '2026-06-12' },
  { id: 'p4', category: 'payment', question: '退款多久到账？', answer: '微信支付和支付宝退款通常在1-3个工作日原路返回。银行卡退款可能需要3-7个工作日，具体取决于发卡行处理速度。如超过7个工作日未到账，请联系客服并提供退款单号查询。', tags: ['退款', '到账', '时效'], updatedAt: '2026-06-03' },
  { id: 'p5', category: 'payment', question: '如何使用优惠券？', answer: '在结算页面选择使用优惠券，系统会自动列出你账户中可用的优惠券。每笔订单只能使用一张优惠券，不可叠加使用。优惠券有有效期和使用门槛，请在有效期内使用。部分优惠券仅限特定商品或门店。', tags: ['优惠券', '折扣', '结算'], updatedAt: '2026-06-06' },
  { id: 'p6', category: 'payment', question: '充值余额可以提现吗？', answer: '会员充值余额可以申请提现，但会收取一定的手续费（提现金额的2%）。提现金额将在3个工作日内退回原支付方式。赠送金额不可提现。提现申请提交后不可撤销。', tags: ['提现', '余额', '充值'], updatedAt: '2026-05-30' },

  // 预约问题 (booking)
  { id: 'b1', category: 'booking', question: '如何预约场地？', answer: '进入场地预约页面，选择日期→选择场地类型→选择时间段→确认信息→提交预约。预约成功后会收到短信和站内通知。到店后向工作人员出示预约码即可入场体验。', tags: ['预约', '场地', '流程'], hot: true, updatedAt: '2026-06-11' },
  { id: 'b2', category: 'booking', question: '可以提前多久预约？', answer: '支持提前预约14天内的时段。每天凌晨0点更新最新可预约日期。热门时段（周末晚上、节假日）建议提前预约以免被抢订。每个账号单日最多预约3个时段。', tags: ['提前', '预约', '时间'], updatedAt: '2026-06-02' },
  { id: 'b3', category: 'booking', question: '如何取消预约？', answer: '在我的预约页面找到对应预约记录，点击取消预约。免费取消时限为预约时间前2小时，超出时限将扣除部分费用（预约金额的20%）。频繁取消预约可能会影响信用评分。', tags: ['取消', '预约', '退款'], updatedAt: '2026-06-07' },
  { id: 'b4', category: 'booking', question: '预约后可以改时间吗？', answer: '目前不支持直接修改预约时间。如需改期，请先取消原有预约，重新预约新的时段。注意取消可能产生手续费，建议确认好时间后再预约。', tags: ['改期', '修改', '预约'], updatedAt: '2026-05-28' },
  { id: 'b5', category: 'booking', question: '预约未到店会怎么样？', answer: '预约时间到达后15分钟未到店将自动取消预约，并按预约金额的50%收取爽约费用。频繁爽约（连续3次）可能会被限制预约权限30天，请合理安排时间。', tags: ['爽约', '不到店', '罚款'], hot: true, updatedAt: '2026-06-09' },
  { id: 'b6', category: 'booking', question: '可以帮别人预约吗？', answer: '可以。预约时填写实际到店人的姓名和电话即可。预约成功后该联系人会收到确认短信和预约码。到店时由实际到店人出示预约码入场。', tags: ['代预约', '他人', '联系人'], updatedAt: '2026-05-22' },

  // 会员问题 (member)
  { id: 'm1', category: 'member', question: '会员等级有哪些？', answer: '会员等级从低到高：普通会员 → 铜卡会员 → 银卡会员 → 黄金会员 → 钻石会员。消费金额和积分决定会员等级。每次到店消费均可累积积分，积分越多等级越高。', tags: ['等级', '会员', '升级'], hot: true, updatedAt: '2026-06-08' },
  { id: 'm2', category: 'member', question: '如何升级会员等级？', answer: '通过消费积累积分即可升级。每消费1元获得1积分。达到对应等级所需积分后自动升级。生日当月消费享双倍积分。钻石会员享1.5倍积分加速。不同等级所需积分：铜卡500、银卡2000、黄金8000、钻石25000。', tags: ['升级', '积分', '消费'], updatedAt: '2026-06-04' },
  { id: 'm3', category: 'member', question: '会员有什么权益？', answer: '不同等级享有不同权益。普通级享基础折扣和新品体验权。铜卡以上享优先预约权和生日礼包。银卡以上送定制生日派对折扣。黄金以上享专属客服和VIP通道。钻石享全场8折（部分商品除外）、免费饮品、专属活动邀请等。', tags: ['权益', '优惠', '特权'], hot: true, updatedAt: '2026-06-10' },
  { id: 'm4', category: 'member', question: '积分会过期吗？', answer: '积分有效期为一年（自获取之日起计算）。到期未使用的积分将自动清零。会员升级后积分不会清零，继续累积。建议定期查看积分余额，在过期前使用积分兑换礼品或抵扣消费。', tags: ['积分', '过期', '有效期'], updatedAt: '2026-05-18' },
  { id: 'm5', category: 'member', question: '如何查询积分？', answer: '登录后在个人中心→我的积分页面查看积分余额和积分明细。同时可以看到即将过期的积分提醒。积分每笔变动都有详细记录，包括获取来源和使用去向。', tags: ['积分', '查询', '明细'], updatedAt: '2026-05-26' },
  { id: 'm6', category: 'member', question: '会员等级会降级吗？', answer: '钻石和黄金会员每季度考核一次，若当季消费未达到保级标准将降级。银卡及以下等级不会降级。保级标准：钻石会员每季度消费不少于2000元，黄金会员每季度消费不少于1000元。', tags: ['降级', '保级', '考核'], updatedAt: '2026-06-01' },

  // 设备问题 (device)
  { id: 'd1', category: 'device', question: '设备出现故障怎么办？', answer: '请立即通知现场工作人员，或在App中扫码报修。工作人员会在5分钟内到场处理。因设备故障导致的损失可申请补偿（退还故障时段费用或赠送体验券）。工作人员到场前请勿自行处理以免造成更大损坏。', tags: ['故障', '报修', '设备'], updatedAt: '2026-06-06' },
  { id: 'd2', category: 'device', question: 'VR设备需要自备吗？', answer: '不需要。门店提供完整的VR体验设备（头显、手柄等），到店后由工作人员协助佩戴和调试。个人如需使用自带设备需提前联系确认兼容性。VR体验区有专人指导新手操作，零基础也能轻松上手。', tags: ['VR', '设备', '自备'], updatedAt: '2026-05-24' },
  { id: 'd3', category: 'device', question: '设备有使用时间限制吗？', answer: '每次预约最小单位为1小时。高峰期（周末和节假日18:00-22:00）每台设备最多连续预约3小时。非高峰时段无限制。预约时段包含调试准备时间，建议提前5分钟到场。', tags: ['时长', '限制', '使用'], updatedAt: '2026-06-03' },
  { id: 'd4', category: 'device', question: '电竞区的电脑配置如何？', answer: '电竞区配备 RTX 4070 以上显卡、32GB DDR5 内存、Intel i7 以上CPU、240Hz 刷新率显示器、Cherry MX机械键盘和高精度游戏鼠标。每台电脑已预装主流游戏平台（Steam、Epic等），可登录个人账号游玩。', tags: ['电竞', '配置', '电脑'], hot: true, updatedAt: '2026-06-12' },
  { id: 'd5', category: 'device', question: '可以在设备上安装个人软件吗？', answer: '为保障系统安全和体验一致性，门店设备不可安装第三方软件。如因工作或学习需要安装特定软件，请提前联系门店协商。部分门店提供专用电脑供有需求的会员使用。', tags: ['安装', '软件', '限制'], updatedAt: '2026-05-30' },
  { id: 'd6', category: 'device', question: '设备被他人占用怎么办？', answer: '所有设备采用预约制，预约时段内只有预约者可以使用。如遇占用问题，请通知工作人员协调处理。工作人员会核对预约信息，确保您的权益不受影响。请勿与占用人直接发生冲突。', tags: ['占用', '纠纷', '协调'], updatedAt: '2026-05-20' },

  // 其他问题 (other)
  { id: 'o1', category: 'other', question: '门店营业时间是多少？', answer: '大多数门店营业时间为 10:00-23:00（周末延长至00:00）。各门店营业时间略有不同，建议在门店详情页查看具体时间。节假日营业时间可能会有调整，请关注App公告。', tags: ['营业时间', '时间', '门店'], hot: true, updatedAt: '2026-06-05' },
  { id: 'o2', category: 'other', question: '停车场是否免费？', answer: '大部分门店提供免费停车2小时服务，超时按商场标准收费。具体停车政策以门店实际情况为准。停车场入口位置和收费标准可查看门店详情页。建议绿色出行，使用公共交通。', tags: ['停车', '免费', '门店'], updatedAt: '2026-05-28' },
  { id: 'o3', category: 'other', question: '可以提供发票吗？', answer: '可以。完成消费后在订单详情页点击申请发票。电子发票将在24小时内发送到预留邮箱。纸质发票可到门店前台打印。发票抬头需填写正确的公司名称和税号，一旦开具不可修改。', tags: ['发票', '报销', '订单'], updatedAt: '2026-06-02' },
  { id: 'o4', category: 'other', question: '未成年人可以进入吗？', answer: '部分区域（如射击区、VR恐怖体验区）限制18岁以下未成年人进入。其他区域未成年人需有监护人陪同。具体入场规则以门店规定为准。建议携带有效身份证件以备查验。', tags: ['未成年人', '限制', '入场'], updatedAt: '2026-06-07' },
  { id: 'o5', category: 'other', question: '门店可以办生日派对吗？', answer: '可以。部分门店提供生日派对套餐，包含场地布置、定制蛋糕和畅玩券。套餐价格视人数和项目而定，请提前至少3天联系门店预约。生日当天到店的会员可获得免费生日小礼品一份。', tags: ['生日', '派对', '活动'], updatedAt: '2026-06-09' },
  { id: 'o6', category: 'other', question: '丢东西了怎么办？', answer: '到门店前台询问失物招领处，或联系客服查询。部分门店可通过监控协助寻找。贵重物品建议随身携带。门店对遗失物品仅提供协助查找服务，不承担保管责任。失物保留30天，逾期将处理。', tags: ['失物', '遗失', '找回'], updatedAt: '2026-05-23' },
];

// ================================================================
// Styles
// ================================================================

const styles = {
  container: {
    maxWidth: 960,
    margin: '0 auto' as const,
    padding: '32px 20px',
    color: '#e2e8f0',
  },
  header: {
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
  },
  searchWrap: {
    position: 'relative' as const,
    marginBottom: 24,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 16,
    pointerEvents: 'none' as const,
  },
  searchInput: {
    width: '100%',
    borderRadius: 12,
    padding: '12px 14px 12px 42px',
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15,23,42,0.35)',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  searchCount: {
    position: 'absolute' as const,
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 11,
    color: '#64748b',
  },
  tabRow: {
    display: 'flex' as const,
    gap: 6,
    flexWrap: 'wrap' as const,
    marginBottom: 20,
  },
  tabChip: (active: boolean): React.CSSProperties => ({
    padding: '7px 16px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: active ? '1.5px solid #3b82f6' : '1px solid rgba(148,163,184,0.1)',
    background: active ? 'rgba(59,130,246,0.1)' : 'rgba(15,23,42,0.25)',
    color: active ? '#60a5fa' : '#94a3b8',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
    userSelect: 'none' as const,
  }),
  tabCount: (active: boolean): React.CSSProperties => ({
    fontSize: 11,
    marginLeft: 4,
    color: active ? '#60a5fa' : '#64748b',
    fontWeight: 600,
  }),
  faqList: {
    display: 'grid' as const,
    gap: 8,
  },
  faqItem: {
    borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(15,23,42,0.25)',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  faqQuestion: (expanded: boolean): React.CSSProperties => ({
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: '14px 18px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderBottom: expanded ? '1px solid rgba(148,163,184,0.06)' : 'none',
  }),
  faqQLeft: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  faqQText: {
    fontWeight: 600,
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 1.4,
  },
  faqHotBadge: {
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 4,
    background: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    fontWeight: 700,
    flexShrink: 0,
  },
  faqArrow: (expanded: boolean): React.CSSProperties => ({
    fontSize: 12,
    color: '#64748b',
    flexShrink: 0,
    transition: 'transform 0.2s',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
  }),
  faqAnswer: {
    padding: '0 18px 14px',
  },
  faqAnswerText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 1.7,
    margin: '8px 0',
  },
  faqTags: {
    display: 'flex' as const,
    gap: 4,
    flexWrap: 'wrap' as const,
    marginTop: 8,
  },
  faqTag: {
    padding: '2px 8px',
    borderRadius: 4,
    background: 'rgba(59,130,246,0.08)',
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  faqUpdated: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
  },
  hotSection: {
    marginBottom: 24,
    padding: '16px 18px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.06))',
    border: '1px solid rgba(239,68,68,0.12)',
  },
  hotTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#f87171',
    marginBottom: 10,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  hotList: {
    display: 'flex' as const,
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  hotItem: {
    padding: '5px 12px',
    borderRadius: 16,
    background: 'rgba(239,68,68,0.08)',
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '64px 20px',
    color: '#64748b',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 12,
    color: '#475569',
  },
  resultInfo: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
    paddingLeft: 2,
  },
  bottomBox: {
    marginTop: 32,
    textAlign: 'center' as const,
    padding: '20px',
    borderRadius: 12,
    background: 'rgba(15,23,42,0.25)',
    border: '1px solid rgba(148,163,184,0.08)',
  },
  bottomText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  bottomSub: {
    fontSize: 12,
    color: '#64748b',
  },
  highlight: {
    color: '#60a5fa',
    fontWeight: 600,
  },
  highlightGold: {
    color: '#f59e0b',
    fontWeight: 600,
  },
};

// ================================================================
// Component
// ================================================================

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allData = useMemo(() => FAQ_DATA, []);

  const hotQuestions = useMemo(() => allData.filter(f => f.hot), [allData]);

  const filtered = useMemo(() => {
    let list = allData;
    if (activeCategory !== 'all') {
      list = list.filter(f => f.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        f =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          f.tags.some(t => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allData, activeCategory, search]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const handleHotClick = useCallback((category: FaqCategory, id: string) => {
    setActiveCategory(category);
    setSearch('');
    setExpandedId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getCategoryLabel = useCallback((cat: FaqCategory): string => {
    return CATEGORIES.find(c => c.id === cat)?.label || cat;
  }, []);

  const getCategoryIcon = useCallback((cat: FaqCategory): string => {
    return CATEGORIES.find(c => c.id === cat)?.icon || '💬';
  }, []);

  return (
    <main style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          ❓ 常见问题
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>
            （共 {allData.length} 条）
          </span>
        </h1>
        <p style={styles.headerSub}>搜索问题关键词，或按分类浏览</p>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          style={styles.searchInput}
          placeholder="搜索问题（关键词、问题内容、分类）..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <span style={styles.searchCount}>{filtered.length} 条结果</span>
        )}
      </div>

      {/* Hot Questions */}
      {!search && activeCategory === 'all' && (
        <div style={styles.hotSection}>
          <div style={styles.hotTitle}>🔥 热门问题</div>
          <div style={styles.hotList}>
            {hotQuestions.map(f => (
              <span
                key={f.id}
                style={styles.hotItem}
                onClick={() => handleHotClick(f.category, f.id)}
              >
                {f.question}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div style={styles.tabRow}>
        <div
          style={styles.tabChip(activeCategory === 'all')}
          onClick={() => { setActiveCategory('all'); setExpandedId(null); }}
        >
          🏠 全部
          <span style={styles.tabCount(activeCategory === 'all')}>{allData.length}</span>
        </div>
        {CATEGORIES.map(cat => {
          const count = allData.filter(f => f.category === cat.id).length;
          return (
            <div
              key={cat.id}
              style={styles.tabChip(activeCategory === cat.id)}
              onClick={() => { setActiveCategory(cat.id); setExpandedId(null); }}
            >
              {cat.icon} {cat.label}
              <span style={styles.tabCount(activeCategory === cat.id)}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Result info */}
      {activeCategory !== 'all' && (
        <div style={styles.resultInfo}>
          {getCategoryLabel(activeCategory)} · 共 {filtered.length} 条问题
        </div>
      )}

      {/* FAQ List */}
      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔍</div>
          <div style={styles.emptyText}>没有找到相关问题</div>
          <div style={styles.emptyHint}>试试其他关键词，或切换到其他分类</div>
        </div>
      ) : (
        <div style={styles.faqList}>
          {filtered.map(f => (
            <div
              key={f.id}
              style={{
                ...styles.faqItem,
                borderColor: expandedId === f.id ? 'rgba(59,130,246,0.25)' : 'rgba(148,163,184,0.08)',
              }}
            >
              <div
                style={styles.faqQuestion(expandedId === f.id)}
                onClick={() => toggleExpand(f.id)}
              >
                <div style={styles.faqQLeft}>
                  {f.hot && <span style={styles.faqHotBadge}>HOT</span>}
                  <span style={styles.faqQText}>
                    {getCategoryIcon(f.category)} {f.question}
                  </span>
                </div>
                <span style={styles.faqArrow(expandedId === f.id)}>▼</span>
              </div>
              {expandedId === f.id && (
                <div style={styles.faqAnswer}>
                  <p style={styles.faqAnswerText}>{f.answer}</p>
                  <div style={styles.faqTags}>
                    {f.tags.map(t => (
                      <span
                        key={t}
                        style={styles.faqTag}
                        onClick={e => {
                          e.stopPropagation();
                          setSearch(t);
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div style={styles.faqUpdated}>更新于 {f.updatedAt}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom hint */}
      <div style={styles.bottomBox}>
        <div style={styles.bottomText}>没找到答案？</div>
        <div style={styles.bottomSub}>
          联系在线客服（<span style={styles.highlight}>09:00 - 23:00</span>）
          或拨打客服电话 <span style={styles.highlightGold}>400-888-0000</span>
        </div>
      </div>
    </main>
  );
}
