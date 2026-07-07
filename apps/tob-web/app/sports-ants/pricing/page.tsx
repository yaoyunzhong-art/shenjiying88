/**
 * 运动蚂蚁定价套餐页面
 * BigAnts Pricing Page - Apple Style
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import ExitIntentPopup from '../components/ExitIntentPopup';
import ConversionTracker from '../components/ConversionTracker';
import { conversionService } from '../lib/conversion-service';

// 设计系统
const designSystem = {
  colors: {
    bg: { primary: '#000000', secondary: '#050505' },
    text: { primary: '#ffffff', secondary: 'rgba(255, 255, 255, 0.7)', muted: 'rgba(255, 255, 255, 0.4)' },
    accent: { blue: '#0066FF', green: '#00C853', orange: '#FF6B00', purple: '#8B5CF6' },
    border: { subtle: 'rgba(255, 255, 255, 0.06)', medium: 'rgba(255, 255, 255, 0.08)', strong: 'rgba(255, 255, 255, 0.1)' },
    glass: 'rgba(255, 255, 255, 0.03)',
  },
  borderRadius: { md: '16px', lg: '24px', xl: '32px', full: '9999px' },
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
};

function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { const entry = entries[0]; if (entry?.isIntersecting) setIsVisible(true); }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedSection({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} style={{ ...style, opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms` }}>
      {children}
    </div>
  );
}

function HoverCard({ children, style = {}, onClick, onMouseEnter, onMouseLeave }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div onMouseEnter={() => { setIsHovered(true); onMouseEnter?.(); }} onMouseLeave={() => { setIsHovered(false); onMouseLeave?.(); }} onClick={onClick} style={{ ...style, transform: isHovered ? 'translateY(-8px)' : 'translateY(0)', boxShadow: isHovered ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.2)', transition: designSystem.transition, cursor: 'pointer' }}>
      {children}
    </div>
  );
}

function ClickableLink({ href, children, style = {}, onClick }: { href: string; children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Link href={href} onClick={onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ ...style, transform: isHovered ? 'scale(1.05)' : 'scale(1)', transition: designSystem.transition, textDecoration: 'none', display: 'inline-block' }}>
      {children}
    </Link>
  );
}

const PRICING_TIERS = [
  { id: 'starter', name: '体验版', tagline: '适合初创门店，快速验证模式', price: '¥2,980', unit: '/年起', features: ['数字运动产品 3 套', '基础活动模板 10 个', '门店管理系统 1 套', '会员管理功能', '月活跃用户 500 人', '数据统计分析', '微信小程序接入', '技术客服支持'], notIncluded: ['定制开发服务', '专属运营经理', 'API接口开放'], isPopular: false },
  { id: 'standard', name: '标准版', tagline: '适合成长型门店，规模化运营', price: '¥9,800', unit: '/年起', originalPrice: '¥14,800', features: ['数字运动产品 10 套', '高级活动模板 50 个', '门店管理系统 3 套', '会员管理系统', '月活跃用户 2,000 人', '完整数据分析报表', '微信/支付宝小程序', '营销工具包', '专属运营经理', '7×12小时技术支持'], notIncluded: ['源码交付', '私有化部署'], isPopular: true },
  { id: 'enterprise', name: '企业版', tagline: '适合大型连锁，品牌化运营', price: '定制报价', unit: '', features: ['数字运动产品不限量', '全部活动模板', '多门店管理系统', '会员管理系统', '无限活跃用户', 'BI商业智能分析', '全渠道小程序接入', '高级营销工具', '1V1专属服务团队', '7×24小时技术支持', '源码交付', '私有化部署'], notIncluded: [], isPopular: false },
];

const FAQ_ITEMS = [
  { q: '套餐费用包含哪些内容？', a: '套餐费用包含软件授权、基础技术支持、常规功能更新。具体包含内容请参考各套餐明细。' },
  { q: '如何选择适合我的套餐？', a: '您可以根据门店数量、预计活跃用户数、功能需求来选择。初创门店建议从体验版开始，成长期门店推荐标准版，连锁品牌建议企业版。' },
  { q: '可以升级套餐吗？', a: '可以随时升级套餐，费用按剩余服务期折算。我们提供灵活的服务方案。' },
  { q: '是否有定制开发服务？', a: '企业版用户可享受定制开发服务，标准版和体验版用户可单独购买定制服务。' },
];

const ROI_METRICS = [
  { label: '预估月营收', value: '¥15万', color: '#0066FF' },
  { label: '预估月利润', value: '¥4.5万', color: '#00C853' },
  { label: '回本周期', value: '11个月', color: '#FF6B00' },
  { label: '年化回报率', value: '108%', color: '#8B5CF6' },
];

export default function PricingPage() {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);
  const [hoveredFAQ, setHoveredFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({ companyName: '', contactName: '', contactPhone: '', storeCount: '', message: '' });

  const handleGetQuote = (tierId: string) => { conversionService.trackCTAClick('pricing', `get_quote_${tierId}`); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      conversionService.trackCTAClick('pricing', 'modal_submit');
      await conversionService.submitContactForm({ companyName: formData.companyName, contactPerson: formData.contactName, phone: formData.contactPhone, cooperationType: 'direct', message: `定制报价咨询 - 门店数量: ${formData.storeCount}, 留言: ${formData.message}` });
      setSubmitted(true);
    } catch (error) { setSubmitted(true); }
    finally { setIsSubmitting(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: designSystem.borderRadius.md, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', outline: 'none', fontSize: '14px' };

  return (
    <>
      <SEOMeta title="定价套餐 - 运动蚂蚁数字运动解决方案" description="运动蚂蚁提供灵活的定价方案，满足不同规模门店的需求。从初创门店到大型连锁，总有适合您的解决方案。" keywords={['定价', '套餐', '收费', '价格', '运动蚂蚁']} type="website" />
      <ConversionTracker page="pricing" />

      <div style={{ minHeight: '100vh', backgroundColor: designSystem.colors.bg.primary, color: '#fff', overflowX: 'hidden' }}>
        <Header />

        {/* Hero */}
        <section style={{ position: 'relative', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/images/pricing/pricing-plans.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 102, 255, 0.15) 0%, transparent 50%)' }} />
          <AnimatedSection style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '0 24px', textAlign: 'center' as const }}>
            <p style={{ fontSize: '14px', color: designSystem.colors.accent.blue, marginBottom: '16px', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>Pricing</p>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, marginBottom: '24px' }}>灵活的定价方案</h1>
            <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '500px', margin: '0 auto' }}>根据您的业务规模和发展阶段，选择最合适的解决方案</p>
          </AnimatedSection>
        </section>

        {/* Pricing Cards */}
        <section style={{ padding: '64px 24px', backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {PRICING_TIERS.map((tier, index) => (
                <AnimatedSection key={tier.id} delay={index * 100}>
                  <HoverCard onMouseEnter={() => setHoveredTier(tier.id)} onMouseLeave={() => setHoveredTier(null)} onClick={() => handleGetQuote(tier.id)} style={{ position: 'relative', padding: '32px', borderRadius: designSystem.borderRadius.xl, background: hoveredTier === tier.id ? tier.isPopular ? 'linear-gradient(180deg, rgba(0, 102, 255, 0.25) 0%, rgba(0, 102, 255, 0.1) 100%)' : 'rgba(255, 255, 255, 0.08)' : tier.isPopular ? 'linear-gradient(180deg, rgba(0, 102, 255, 0.15) 0%, rgba(0, 102, 255, 0.05) 100%)' : designSystem.colors.glass, border: tier.isPopular ? '1px solid rgba(0, 102, 255, 0.3)' : `1px solid ${designSystem.colors.border.medium}`, marginTop: tier.isPopular ? '-16px' : 0, marginBottom: tier.isPopular ? '-16px' : 0 }}>
                    {tier.isPopular && (
                      <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '6px 16px', borderRadius: designSystem.borderRadius.full, fontSize: '12px', fontWeight: 600, background: '#FF6B35', color: '#fff' }}>
                        最受欢迎
                      </div>
                    )}
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{tier.name}</h3>
                      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>{tier.tagline}</p>
                    </div>
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 700, color: tier.isPopular ? '#0066FF' : '#fff' }}>{tier.price}</span>
                        {tier.originalPrice && <span style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.3)', textDecoration: 'line-through' }}>{tier.originalPrice}</span>}
                      </div>
                      {tier.unit && <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.3)', marginTop: '4px' }}>{tier.unit}</p>}
                    </div>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                      {tier.features.map((feature, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <span style={{ fontSize: '14px', color: '#4ade80', marginTop: '2px' }}>✓</span>
                          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={(e) => { e.stopPropagation(); handleGetQuote(tier.id); }} style={{ width: '100%', padding: '12px', borderRadius: designSystem.borderRadius.full, fontSize: '14px', fontWeight: 500, background: tier.isPopular ? '#0066FF' : 'transparent', border: tier.isPopular ? 'none' : '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s' }}>
                      {tier.id === 'enterprise' ? '咨询定制' : '获取方案'}
                    </button>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Calculator */}
        <section style={{ padding: '64px 24px', backgroundColor: designSystem.colors.bg.primary }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '48px' }}>
              <p style={{ fontSize: '14px', color: designSystem.colors.accent.green, marginBottom: '8px', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>ROI Calculator</p>
              <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>投资回报计算</h2>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.4)' }}>输入您的预算，测算回本周期</p>
            </AnimatedSection>

            <AnimatedSection>
              <div style={{ padding: '32px', borderRadius: designSystem.borderRadius.xl, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: `1px solid ${designSystem.colors.border.medium}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px' }}>投资预算（万元）</label>
                      <input type="range" min="10" max="500" defaultValue="50" onChange={(e) => conversionService.trackCTAClick('pricing', `roi_budget_${e.target.value}`)} style={{ width: '100%' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                        <span>10万</span>
                        <span style={{ color: '#0066FF', fontWeight: 500 }}>50万</span>
                        <span>500万</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px' }}>场地面积（㎡）</label>
                      <input type="range" min="50" max="1000" defaultValue="200" onChange={(e) => conversionService.trackCTAClick('pricing', `roi_area_${e.target.value}`)} style={{ width: '100%' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                        <span>50㎡</span>
                        <span style={{ color: '#0066FF', fontWeight: 500 }}>200㎡</span>
                        <span>1000㎡</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px' }}>场地类型</label>
                      <select onChange={(e) => conversionService.trackCTAClick('pricing', `roi_type_${e.target.value}`)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="mall">商业综合体</option>
                        <option value="community">社区底商</option>
                        <option value="tourism">文旅景区</option>
                        <option value="school">学校/培训机构</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      {ROI_METRICS.map((item) => (
                        <HoverCard key={item.label} onClick={() => conversionService.trackCTAClick('pricing', `roi_metric_${item.label}`)} style={{ padding: '16px', borderRadius: designSystem.borderRadius.lg, background: designSystem.colors.glass, textAlign: 'center' as const }}>
                          <p style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', color: item.color }}>{item.value}</p>
                          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>{item.label}</p>
                        </HoverCard>
                      ))}
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', marginTop: '16px' }}>* 以上数据为基于行业平均水平的估算</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '64px 24px', backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '48px' }}>
              <p style={{ fontSize: '14px', color: designSystem.colors.accent.blue, marginBottom: '8px', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>FAQ</p>
              <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>常见问题</h2>
            </AnimatedSection>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {FAQ_ITEMS.map((item, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <HoverCard onMouseEnter={() => setHoveredFAQ(index)} onMouseLeave={() => setHoveredFAQ(null)} onClick={() => { conversionService.trackCTAClick('pricing', `faq_${index}`); setHoveredFAQ(hoveredFAQ === index ? null : index); }} style={{ padding: '24px', borderRadius: designSystem.borderRadius.lg, background: hoveredFAQ === index ? 'rgba(0, 102, 255, 0.1)' : designSystem.colors.glass, border: `1px solid ${hoveredFAQ === index ? 'rgba(0, 102, 255, 0.3)' : designSystem.colors.border.subtle}` }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>Q: {item.q}</h3>
                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.7 }}>{item.a}</p>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '96px 24px', background: 'linear-gradient(180deg, #000 0%, #111 100%)' }}>
          <AnimatedSection style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' as const }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>不知道选哪个方案？</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '32px' }}>我们的专业顾问可以帮您分析最适合的选择</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <ClickableLink href="/sports-ants/contact" onClick={() => conversionService.trackCTAClick('pricing', 'cta_consult')} style={{ padding: '16px 40px', borderRadius: designSystem.borderRadius.full, fontSize: '16px', fontWeight: 500, background: '#0066FF', boxShadow: '0 0 30px rgba(0, 102, 255, 0.4)', color: '#fff' }}>
                立即咨询
              </ClickableLink>
              <ClickableLink href="/sports-ants/cases" onClick={() => conversionService.trackCTAClick('pricing', 'cta_cases')} style={{ padding: '16px 40px', borderRadius: designSystem.borderRadius.full, fontSize: '16px', fontWeight: 500, background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}>
                查看案例
              </ClickableLink>
            </div>
          </AnimatedSection>
        </section>

        <Footer />
        <FloatingContact />
        <ExitIntentPopup delaySeconds={15} />

        {/* Contact Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0, 0, 0, 0.8)' }} onClick={() => !isSubmitting && !submitted && setShowModal(false)}>
            <div style={{ width: '100%', maxWidth: '450px', padding: '32px', borderRadius: designSystem.borderRadius.xl, background: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)' }} onClick={(e) => e.stopPropagation()}>
              {submitted ? (
                <div style={{ textAlign: 'center' as const, padding: '32px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 200, 83, 0.15)' }}>
                    <span style={{ fontSize: '28px' }}>✓</span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>提交成功！</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '24px' }}>我们的顾问将在1小时内联系您</p>
                  <button onClick={() => setShowModal(false)} style={{ padding: '12px 24px', borderRadius: designSystem.borderRadius.full, fontSize: '14px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    关闭
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '24px', textAlign: 'center' as const }}>获取详细方案</h3>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input type="text" placeholder="公司名称 *" required value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} style={inputStyle} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <input type="text" placeholder="联系人 *" required value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} style={inputStyle} />
                      <input type="tel" placeholder="手机号 *" required value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} style={inputStyle} />
                    </div>
                    <select value={formData.storeCount} onChange={(e) => setFormData({ ...formData, storeCount: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">门店数量</option>
                      <option value="1-3">1-3家</option>
                      <option value="4-10">4-10家</option>
                      <option value="11-50">11-50家</option>
                      <option value="50+">50家以上</option>
                    </select>
                    <textarea placeholder="留言（选填）" rows={3} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} style={{ ...inputStyle, resize: 'none' }} />
                    <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                      <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: designSystem.borderRadius.full, fontSize: '14px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        取消
                      </button>
                      <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '12px', borderRadius: designSystem.borderRadius.full, fontSize: '14px', fontWeight: 500, background: '#0066FF', border: 'none', color: '#fff', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1 }}>
                        {isSubmitting ? '提交中...' : '立即提交'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif; -webkit-font-smoothing: antialiased; }`}</style>
    </>
  );
}