/**
 * member-upgrade-path — 会员升级路径页
 * 展示从青铜→白银→黄金→钻石的完整升级阶梯
 */
import { MemberUpgradePath, type UpgradeTierNode } from '@m5/ui';

const defaultTiers: UpgradeTierNode[] = [
  {
    key: 'bronze',
    name: '青铜会员',
    color: '#cd7f32',
    requiredValue: '注册即享',
    benefits: ['基础折扣 9.5折', '生日优惠券', '积分累积'],
  },
  {
    key: 'silver',
    name: '白银会员',
    color: '#9ca3af',
    requiredValue: '累计消费 ≥ ¥500',
    conditions: [
      { label: '累计消费 ¥500', met: true },
      { label: '注册满 30 天', met: true },
      { label: '绑定手机号', met: true },
    ],
    benefits: ['折扣升级 9折', '每月1张满减券', '生日双倍积分'],
  },
  {
    key: 'gold',
    name: '黄金会员',
    color: '#f59e0b',
    requiredValue: '累计消费 ≥ ¥2,000',
    conditions: [
      { label: '累计消费 ¥2,000', met: true },
      { label: '注册满 90 天', met: false },
      { label: '完成身份认证', met: true },
    ],
    benefits: ['折扣升级 8.5折', '每月2张满减券', '专属客服', '免运费'],
  },
  {
    key: 'diamond',
    name: '钻石会员',
    color: '#06b6d4',
    requiredValue: '累计消费 ≥ ¥10,000',
    conditions: [
      { label: '累计消费 ¥10,000', met: false },
      { label: '注册满 365 天', met: false },
    ],
    benefits: ['折扣升级 8折', '不限次免运费', '生日礼物', '新品优先体验'],
  },
];

export default function MemberUpgradePathPage() {
  return (
    <MemberUpgradePath
      tiers={defaultTiers}
      currentTierKey="silver"
      subtitle="当前门店 · 标准 VIP 等级体系"
    />
  );
}
