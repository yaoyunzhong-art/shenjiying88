/**
 * 运动蚂蚁解决方案页面
 * BigAnts Solutions Page - Apple Style
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

const SOLUTIONS = [
  { id: 'digital-sports-center', title: '数字体育中心', description: '为商业综合体、旅游景区、娱乐中心等提供完整的数字运动场馆解决方案，从选址到运营一站式服务', icon: '🏟️', features: ['60+款数字运动设备任选组合', '专业3D空间规划设计', '神机营SaaS全链路数字化运营', 'AI智能推荐系统提升转化', '7×24小时远程运维监控', '终身软件升级服务'], benefits: [{ label: '平均回本周期', value: '12-18个月' }, { label: '设备利用率', value: '95%以上' }, { label: '运营效率提升', value: '60%' }], cases: 300, clients: 600, color: '#0066FF', image: '/images/solutions/commercial-sports.jpg' },
  { id: 'commercial-property', title: '商业地产增值', description: '为购物中心、商业街、商业广场等提供差异化竞争利器，提升客流量和坪效，打造智慧商业新标杆', icon: '🏢', features: ['差异化业态组合设计', '年轻客群精准吸引', '品牌曝光度提升方案', '运营成本优化建议', '投资回报详细分析', '会员体系打通支持'], benefits: [{ label: '客流量提升', value: '30-50%' }, { label: '坪效提升', value: '25万/㎡+' }, { label: '会员活跃度', value: '+45%' }], cases: 200, clients: 400, color: '#FF6B00', image: '/images/solutions/commercial-sports.jpg' },
  { id: 'family-entertainment', title: '亲子游乐中心', description: '为亲子乐园、淘气堡、儿童中心等提供寓教于乐的数字运动设备，打造安全有趣的亲子空间', icon: '🎠', features: ['儿童友好安全设计', '亲子互动项目丰富', '多年龄段适配', '家长休息区规划', '安全防护措施完善', '早教内容融合'], benefits: [{ label: '家庭客群占比', value: '85%+' }, { label: '儿童喜爱度', value: '98%' }, { label: '二消转化率', value: '+60%' }], cases: 150, clients: 300, color: '#8B5CF6', image: '/images/cases/children-sports.jpg' },
  { id: 'hotel-leisure', title: '酒店休闲配套', description: '为度假酒店、商务酒店、精品民宿等提供运动休闲配套方案，提升客户体验和酒店竞争力', icon: '🏨', features: ['场地利用最大化设计', '设备静音安全标准', '会员系统对接', '差异化房型溢价', 'OTA平台展示支持', '运维托管服务'], benefits: [{ label: '客户好评率', value: '4.9分' }, { label: '房型溢价', value: '¥200+/晚' }, { label: '复购率提升', value: '+35%' }], cases: 80, clients: 150, color: '#00BCD4', image: '/images/solutions/hotel-leisure.jpg' },
  { id: 'school-sports', title: '学校体育设施', description: '为中小学、高校、体育院校等提供数字化体育教学设备，提升学生运动兴趣和体育教学效果', icon: '🏫', features: ['符合教育部标准', '体育课教学质量提升', '课外活动丰富化', '学生体质数据追踪', '教师培训支持', '赛事活动组织'], benefits: [{ label: '学生参与度', value: '+80%' }, { label: '体育课满意度', value: '95%+' }, { label: '设备利用率', value: '95%' }], cases: 100, clients: 200, color: '#00C853', image: '/images/solutions/school-sports.jpg' },
  { id: 'community-fitness', title: '社区健身配套', description: '为高端社区、写字楼、产业园区等提供便捷的数字运动设施，打造15分钟健身圈', icon: '🏘️', features: ['空间利用率优化', '24小时无人值守模式', '社区会员体系打通', '线上预约方便快捷', '运动数据互联互通', '物业增值服务支持'], benefits: [{ label: '社区覆盖率', value: '85%+' }, { label: '会员活跃度', value: '70%+' }, { label: '物业满意度', value: '98%' }], cases: 120, clients: 250, color: '#FF4081', image: '/images/solutions/community-fitness.jpg' },
];

const PROCESS = [
  { step: '01', title: '需求沟通', desc: '了解您的场馆情况、预算、目标' },
  { step: '02', title: '方案设计', desc: '根据需求定制专属解决方案' },
  { step: '03', title: '合同签订', desc: '明确双方权益，正式合作' },
  { step: '04', title: '设备生产', desc: '专业生产，严格品控' },
  { step: '05', title: '安装调试', desc: '专业团队现场安装培训' },
  { step: '06', title: '运营支持', desc: '持续运营支持，定期维护' },
];

export default function SolutionsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ assignedTo?: string; estimatedCallbackTime?: string } | null>(null);
  const [hoveredSolution, setHoveredSolution] = useState<string | null>(null);
  const [formData, setFormData] = useState({ companyName: '', contactName: '', contactPhone: '', solutionType: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      conversionService.trackCTAClick('solutions', 'form_submit');
      const result = await conversionService.submitContactForm({ companyName: formData.companyName, contactPerson: formData.contactName, phone: formData.contactPhone, cooperationType: 'solution', message: `${formData.message}${formData.solutionType ? `, 解决方案: ${formData.solutionType}` : ''}` });
      if (result.success) { setSubmitted(true); setSubmitResult({ assignedTo: result.assignedTo, estimatedCallbackTime: result.estimatedCallbackTime }); }
    } catch (error) { setSubmitted(true); setSubmitResult({ assignedTo: '商务顾问', estimatedCallbackTime: '24小时内' }); }
    finally { setIsSubmitting(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: designSystem.borderRadius.md, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', outline: 'none', transition: 'border-color 0.3s', fontSize: '14px' };

  return (
    <>
      <SEOMeta title="解决方案 - 行业数字化转型专家" description="运动蚂蚁提供数字体育中心、商业地产增值、儿童游乐等全场景解决方案，从咨询到实施，一站式服务。" keywords={['解决方案', '数字运动方案', '商业地产', '儿童游乐', '定制服务']} type="website" />
      <ConversionTracker page="solutions" />

      <div style={{ minHeight: '100vh', backgroundColor: designSystem.colors.bg.primary, color: '#fff', overflowX: 'hidden' }}>
        <Header />

        {/* Hero */}
        <section style={{ position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 100%)' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 102, 255, 0.15) 0%, transparent 50%)' }} />
          <AnimatedSection style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '0 24px', textAlign: 'center' as const }}>
            <p style={{ fontSize: '14px', color: designSystem.colors.accent.blue, marginBottom: '16px', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>Solutions</p>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, marginBottom: '24px' }}>行业解决方案</h1>
            <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '600px', margin: '0 auto' }}>从咨询到实施，我们全程服务，覆盖项目所有阶段。无论公司大小，我们都根据您的需要，量身打造解决方案</p>
          </AnimatedSection>
        </section>

        {/* Solutions Grid */}
        <section style={{ padding: '64px 24px', backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
              {SOLUTIONS.map((solution, index) => (
                <AnimatedSection key={solution.id} delay={index * 100}>
                  <HoverCard onMouseEnter={() => setHoveredSolution(solution.id)} onMouseLeave={() => setHoveredSolution(null)} onClick={() => conversionService.trackCTAClick('solutions', `solution_${solution.id}`)} style={{ borderRadius: designSystem.borderRadius.xl, background: hoveredSolution === solution.id ? `${solution.color}10` : designSystem.colors.glass, border: `1px solid ${hoveredSolution === solution.id ? solution.color + '40' : designSystem.colors.border.medium}`, overflow: 'hidden', padding: 0 }}>
                    {/* 解决方案图片 */}
                    {solution.image && (
                      <div style={{ height: '160px', background: `url(${solution.image}) center/cover no-repeat`, position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 0%, ${solution.color}30 100%)` }} />
                      </div>
                    )}
                    <div style={{ padding: '32px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: designSystem.borderRadius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: `${solution.color}20`, marginBottom: '24px' }}>{solution.icon}</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{solution.title}</h3>
                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.7, marginBottom: '24px' }}>{solution.description}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                      {solution.features.map((feature) => (
                        <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '14px', color: '#4ade80' }}>✓</span>
                          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>{feature}</span>
                        </div>
                      ))}
                    </div>
                    {solution.benefits && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px', borderRadius: designSystem.borderRadius.md, background: `${solution.color}10`, marginBottom: '24px' }}>
                        {solution.benefits.map((benefit, idx) => (
                          <div key={idx} style={{ textAlign: 'center' as const }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: solution.color }}>{benefit.value}</p>
                            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>{benefit.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: solution.color }}>{solution.cases}+</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>场地案例</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: solution.color }}>{solution.clients}+</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>合作客户</p>
                      </div>
                    </div>
                    </div>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section style={{ padding: '96px 24px', backgroundColor: designSystem.colors.bg.primary }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
              <p style={{ fontSize: '14px', color: designSystem.colors.accent.blue, marginBottom: '8px', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>Process</p>
              <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>服务流程</h2>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px' }}>专业团队全程跟进，确保项目顺利落地</p>
            </AnimatedSection>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              {PROCESS.map((item, index) => (
                <AnimatedSection key={item.step} delay={index * 100}>
                  <HoverCard onClick={() => conversionService.trackCTAClick('solutions', `process_${item.step}`)} style={{ position: 'relative', textAlign: 'center' as const, padding: '24px', borderRadius: designSystem.borderRadius.lg, background: designSystem.colors.glass, border: `1px solid ${designSystem.colors.border.subtle}` }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, background: 'rgba(0, 102, 255, 0.2)', color: '#0066FF' }}>{item.step}</div>
                    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>{item.title}</h4>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>{item.desc}</p>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA with Form */}
        <section style={{ padding: '96px 24px', background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)' }}>
          <AnimatedSection style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center' as const, marginBottom: '48px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>获取专属解决方案</h2>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' }}>专家团队与您紧密合作，共同实现愿景</p>
            </div>
            <div style={{ padding: '32px', borderRadius: designSystem.borderRadius.xl, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: `1px solid ${designSystem.colors.border.medium}` }}>
              {!submitted ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input type="text" name="companyName" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="企业名称 *" required style={inputStyle} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <input type="text" name="contactName" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} placeholder="联系人 *" required style={inputStyle} />
                    <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="联系电话 *" required style={inputStyle} />
                  </div>
                  <select name="solutionType" value={formData.solutionType} onChange={(e) => setFormData({ ...formData, solutionType: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">选择解决方案</option>
                    <option value="数字体育中心">数字体育中心</option>
                    <option value="商业地产增值">商业地产增值</option>
                    <option value="儿童游乐">儿童游乐</option>
                    <option value="定制服务">定制服务</option>
                  </select>
                  <textarea name="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="描述您的需求..." rows={3} style={{ ...inputStyle, resize: 'none' }} />
                  <button type="submit" disabled={isSubmitting} onClick={() => conversionService.trackCTAClick('solutions', 'form_submit_button')} style={{ width: '100%', padding: '16px', borderRadius: designSystem.borderRadius.full, fontSize: '16px', fontWeight: 500, background: isSubmitting ? '#666' : '#0066FF', boxShadow: isSubmitting ? 'none' : '0 0 30px rgba(0, 102, 255, 0.4)', color: '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                    {isSubmitting ? '提交中...' : '立即获取方案'}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center' as const, padding: '32px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 200, 83, 0.15)' }}>
                    <span style={{ fontSize: '28px' }}>✓</span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>提交成功！</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '24px' }}>我们的专家团队将尽快与您联系</p>
                  {submitResult && (
                    <div style={{ padding: '16px', borderRadius: designSystem.borderRadius.md, background: 'rgba(255,255,255,0.05)', marginBottom: '24px', display: 'inline-block' }}>
                      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>专属顾问</p>
                      <p style={{ fontSize: '18px', fontWeight: 600, color: '#0066FF' }}>{submitResult.assignedTo}</p>
                      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px', marginBottom: '4px' }}>预计回电</p>
                      <p style={{ fontSize: '18px', fontWeight: 600, color: '#00C853' }}>{submitResult.estimatedCallbackTime}</p>
                    </div>
                  )}
                  <button onClick={() => { setSubmitted(false); setSubmitResult(null); setFormData({ companyName: '', contactName: '', contactPhone: '', solutionType: '', message: '' }); }} style={{ padding: '12px 24px', borderRadius: designSystem.borderRadius.full, fontSize: '14px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    继续填写
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>
        </section>

        {/* Quick Links */}
        <section style={{ padding: '64px 24px', backgroundColor: designSystem.colors.bg.secondary }}>
          <AnimatedSection style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' as const }}>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '24px' }}>您还可以</p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '16px', justifyContent: 'center' }}>
              {[{ href: '/sports-ants/products', label: '浏览产品' }, { href: '/sports-ants/cases', label: '查看案例' }, { href: '/sports-ants/franchise', label: '招商加盟' }, { href: '/sports-ants/resources', label: '决策资源' }].map((link) => (
                <ClickableLink key={link.href} href={link.href} onClick={() => conversionService.trackCTAClick('solutions', `quicklink_${link.href}`)} style={{ padding: '12px 24px', borderRadius: designSystem.borderRadius.full, fontSize: '14px', fontWeight: 500, background: designSystem.colors.glass, border: `1px solid ${designSystem.colors.border.strong}` }}>
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

      <style jsx global>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif; -webkit-font-smoothing: antialiased; }`}</style>
    </>
  );
}