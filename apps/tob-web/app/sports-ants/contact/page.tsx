/**
 * 运动蚂蚁联系我们页面
 * BigAnts Contact Page - Apple Style
 */

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import ExitIntentPopup from '../components/ExitIntentPopup';
import { conversionService } from '../lib/conversion-service';
import ConversionTracker from '../components/ConversionTracker';

// 设计系统
const designSystem = {
  colors: {
    bg: { primary: '#000000', secondary: '#050505' },
    text: { primary: '#ffffff', secondary: 'rgba(255, 255, 255, 0.7)', muted: 'rgba(255, 255, 255, 0.4)' },
    accent: { blue: '#0066FF', green: '#00C853' },
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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedSection({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div ref={ref} style={{
      ...style,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function HoverCard({ children, style = {}, onClick, onMouseEnter, onMouseLeave }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div onMouseEnter={() => { setIsHovered(true); onMouseEnter?.(); }} onMouseLeave={() => { setIsHovered(false); onMouseLeave?.(); }} onClick={onClick} style={{
      ...style,
      transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
      boxShadow: isHovered ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
      transition: designSystem.transition,
      cursor: 'pointer',
    }}>
      {children}
    </div>
  );
}

function ClickableLink({ href, children, style = {}, onClick }: { href: string; children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={href} onClick={onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{
      ...style,
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      transition: designSystem.transition,
      textDecoration: 'none',
      display: 'inline-block',
    }}>
      {children}
    </Link>
  );
}

const COOPERATION_TYPES = [
  { value: 'direct', label: '直接购买设备' },
  { value: 'franchise', label: '特许加盟' },
  { value: 'joint', label: '合资联营' },
  { value: 'license', label: '品牌授权' },
  { value: 'epc', label: 'EPC+O项目' },
  { value: 'other', label: '其他合作' },
];

const SERVICE_CHANNELS = [
  { name: '商务热线', value: '400-888-8888', desc: '7×24小时服务', icon: '📞', color: '#0066FF' },
  { name: '企业微信', value: 'BigAnts888', desc: '添加好友咨询', icon: '💬', color: '#00C853' },
  { name: '商务邮箱', value: 'business@bigants.net', desc: '24小时内回复', icon: '📧', color: '#FF6B00' },
];

const FAQ_ITEMS = [
  { q: '投资数字运动馆需要多少钱？', a: '根据项目规模和合作模式不同，投资金额也有所差异：单台设备约5-15万，标准门店约30-80万，大型场馆约100-300万。' },
  { q: '场地需要多大面积？', a: '根据项目类型不同：单台设备约10-30㎡，标准门店约100-300㎡，大型场馆500㎡以上。' },
  { q: '设备多久回本？', a: '根据已运营数据，平均回本周期为12-18个月。实际回本时间取决于选址、运营能力、客流量等因素。' },
];

function ContactContent() {
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ assignedTo?: string; estimatedCallbackTime?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [hoveredFAQ, setHoveredFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({ companyName: '', contactPerson: '', phone: '', cooperationType: 'direct', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      conversionService.trackCTAClick('contact', 'form_submit');
      const result = await conversionService.submitContactForm(formData);
      if (result.success) {
        setSubmitted(true);
        setSubmitResult({ assignedTo: result.assignedTo, estimatedCallbackTime: result.estimatedCallbackTime });
      }
    } catch (error) {
      setSubmitted(true);
      setSubmitResult({ assignedTo: '商务顾问', estimatedCallbackTime: '24小时内' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChannelClick = (channelName: string) => conversionService.trackCTAClick('contact', `channel_${channelName}`);
  const handleFAQClick = (index: number) => { conversionService.trackCTAClick('contact', `faq_${index}`); setHoveredFAQ(hoveredFAQ === index ? null : index); };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: designSystem.borderRadius.md, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', outline: 'none', transition: 'border-color 0.3s', fontSize: '14px' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: designSystem.colors.bg.primary, color: '#fff', overflowX: 'hidden' }}>
      <Header />

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 102, 255, 0.15) 0%, transparent 50%)' }} />
        <AnimatedSection style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '0 24px', textAlign: 'center' as const }}>
          <p style={{ fontSize: '14px', color: designSystem.colors.accent.blue, marginBottom: '16px', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>Contact Us</p>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, marginBottom: '24px' }}>期待与您合作</h1>
          <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '500px', margin: '0 auto' }}>专业团队随时为您服务，无论您有任何问题，我们都会在第一时间为您解答</p>
        </AnimatedSection>
      </section>

      {/* Contact Cards */}
      <section style={{ padding: '64px 24px', backgroundColor: designSystem.colors.bg.secondary }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <AnimatedSection style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {SERVICE_CHANNELS.map((channel) => (
              <HoverCard key={channel.name} onClick={() => handleChannelClick(channel.name)} onMouseEnter={() => setHoveredChannel(channel.name)} onMouseLeave={() => setHoveredChannel(null)} style={{ padding: '24px', borderRadius: designSystem.borderRadius.lg, textAlign: 'center' as const, background: hoveredChannel === channel.name ? `${channel.color}15` : designSystem.colors.glass, border: `1px solid ${hoveredChannel === channel.name ? channel.color + '40' : designSystem.colors.border.medium}` }}>
                <div style={{ width: '56px', height: '56px', borderRadius: designSystem.borderRadius.md, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: `${channel.color}20` }}>{channel.icon}</div>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '8px' }}>{channel.name}</p>
                <p style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px', color: channel.color }}>{channel.value}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.3)' }}>{channel.desc}</p>
              </HoverCard>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* Form Section */}
      <section style={{ padding: '64px 24px', backgroundColor: designSystem.colors.bg.primary }}>
        <AnimatedSection style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ padding: '32px', borderRadius: designSystem.borderRadius.xl, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: `1px solid ${designSystem.colors.border.medium}` }}>
            {!submitted ? (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '8px', textAlign: 'center' as const }}>提交合作咨询</h2>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '32px', textAlign: 'center' as const }}>填写表单，专业团队将在24小时内与您联系</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                    <div>
                      <label style={labelStyle}>企业名称 <span style={{ color: '#ff6b6b' }}>*</span></label>
                      <input type="text" name="companyName" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required placeholder="请输入企业名称" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>联系人 <span style={{ color: '#ff6b6b' }}>*</span></label>
                      <input type="text" name="contactPerson" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} required placeholder="请输入联系人姓名" style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                    <div>
                      <label style={labelStyle}>联系电话 <span style={{ color: '#ff6b6b' }}>*</span></label>
                      <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required placeholder="请输入联系电话" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>合作类型</label>
                      <select name="cooperationType" value={formData.cooperationType} onChange={(e) => setFormData({ ...formData, cooperationType: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {COOPERATION_TYPES.map((type) => (<option key={type.value} value={type.value} style={{ background: '#1a1a1a' }}>{type.label}</option>))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>需求描述</label>
                    <textarea name="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4} placeholder="请详细描述您的合作需求..." style={{ ...inputStyle, resize: 'none' }} />
                  </div>

                  <button type="submit" disabled={isSubmitting} onClick={() => conversionService.trackCTAClick('contact', 'submit_button')} style={{ width: '100%', padding: '16px', borderRadius: designSystem.borderRadius.full, fontSize: '16px', fontWeight: 500, background: isSubmitting ? '#666' : designSystem.colors.accent.blue, boxShadow: isSubmitting ? 'none' : '0 0 30px rgba(0, 102, 255, 0.4)', color: '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
                    {isSubmitting ? '提交中...' : '提交咨询'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 200, 83, 0.15)' }}>
                  <span style={{ fontSize: '36px' }}>✅</span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>提交成功！</h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '24px' }}>感谢您的咨询，专业团队将尽快与您联系</p>
                {submitResult && (
                  <div style={{ padding: '16px', borderRadius: designSystem.borderRadius.md, background: 'rgba(255,255,255,0.05)', display: 'inline-block', marginBottom: '24px' }}>
                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>您的专属顾问</p>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: designSystem.colors.accent.blue }}>{submitResult.assignedTo}</p>
                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px', marginBottom: '4px' }}>预计回电时间</p>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: designSystem.colors.accent.green }}>{submitResult.estimatedCallbackTime}</p>
                  </div>
                )}
                <button onClick={() => { setSubmitted(false); setSubmitResult(null); setFormData({ companyName: '', contactPerson: '', phone: '', cooperationType: 'direct', message: '' }); }} style={{ padding: '12px 24px', borderRadius: designSystem.borderRadius.full, fontSize: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}>
                  继续填写
                </button>
              </div>
            )}
          </div>
        </AnimatedSection>
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
                <HoverCard onClick={() => handleFAQClick(index)} onMouseEnter={() => setHoveredFAQ(index)} onMouseLeave={() => setHoveredFAQ(null)} style={{ padding: '24px', borderRadius: designSystem.borderRadius.lg, background: hoveredFAQ === index ? 'rgba(0, 102, 255, 0.1)' : designSystem.colors.glass, border: `1px solid ${hoveredFAQ === index ? 'rgba(0, 102, 255, 0.3)' : designSystem.colors.border.subtle}` }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>{item.q}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.7 }}>{item.a}</p>
                </HoverCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section style={{ padding: '64px 24px', backgroundColor: designSystem.colors.bg.primary }}>
        <AnimatedSection style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' as const }}>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '24px' }}>您还可以</p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '16px', justifyContent: 'center' }}>
            {[
              { href: '/sports-ants/products', label: '浏览产品' },
              { href: '/sports-ants/franchise', label: '招商加盟' },
              { href: '/sports-ants/cases', label: '查看案例' },
              { href: '/sports-ants/resources', label: '决策资源' },
            ].map((link) => (
              <ClickableLink key={link.href} href={link.href} onClick={() => conversionService.trackCTAClick('contact', `quicklink_${link.href}`)} style={{ padding: '12px 24px', borderRadius: designSystem.borderRadius.full, fontSize: '14px', fontWeight: 500, background: designSystem.colors.glass, border: `1px solid ${designSystem.colors.border.strong}` }}>
                {link.label}
              </ClickableLink>
            ))}
          </div>
        </AnimatedSection>
      </section>

      <Footer />
      <FloatingContact />
      <ExitIntentPopup delaySeconds={15} />
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <SEOMeta title="联系我们 - 专业团队在线服务" description="联系运动蚂蚁商务团队，获取产品报价、投资方案、加盟政策等详细信息。7×24小时客服热线，企业微信在线咨询。" keywords={['联系我们', '运动蚂蚁', '商务合作', '客服热线', '咨询表单']} type="website" />
      <ConversionTracker page="contact" />
      <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</div></div>}>
        <ContactContent />
      </Suspense>
      <style jsx global>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif; -webkit-font-smoothing: antialiased; }`}</style>
    </>
  );
}