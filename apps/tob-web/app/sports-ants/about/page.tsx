/**
 * 运动蚂蚁关于我们页面
 * BigAnts About Page - Apple Style Redesign
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    bg: { primary: '#000000', secondary: '#050505', tertiary: '#0a0a0a' },
    text: { primary: '#ffffff', secondary: 'rgba(255, 255, 255, 0.7)', muted: 'rgba(255, 255, 255, 0.4)' },
    accent: { blue: '#0066FF', green: '#00C853', purple: '#8B5CF6', orange: '#FF6B00' },
    border: { subtle: 'rgba(255, 255, 255, 0.06)', medium: 'rgba(255, 255, 255, 0.08)', strong: 'rgba(255, 255, 255, 0.15)' },
    glass: 'rgba(255, 255, 255, 0.03)',
  },
  borderRadius: { sm: '12px', md: '16px', lg: '24px', xl: '32px', full: '9999px' },
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
};

// 滚动动画Hook
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedSection({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function HoverCard({ children, style = {}, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        ...style,
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
        transition: designSystem.transition,
        cursor: 'pointer',
      }}
    >
      {children}
    </div>
  );
}

function ClickableLink({ href, children, style = {}, onClick }: { href: string; children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...style,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: designSystem.transition,
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {children}
    </Link>
  );
}

const TIMELINE = [
  { year: '2015', event: '广州蚂蚁运动有限公司成立', icon: '🏢' },
  { year: '2016', event: '推出首款数字运动设备，进军商业娱乐市场', icon: '💡' },
  { year: '2017', event: '完成数字运动馆1.0版本，获得首轮千万级融资', icon: '🚀' },
  { year: '2018', event: '产品线扩展至20+款，建立华南地区销售网络', icon: '📈' },
  { year: '2019', event: '完成60+款产品研发，建立全国销售网络', icon: '🌐' },
  { year: '2020', event: '疫情下逆势增长，推出无人值守解决方案', icon: '⛰️' },
  { year: '2021', event: '数字化转型，开启智能制造新篇章', icon: '⚡' },
  { year: '2022', event: '神机营SaaS系统上线，AI赋能全链路运营', icon: '🤖' },
  { year: '2023', event: '全球业务拓展，覆盖50+国家和地区', icon: '🌍' },
  { year: '2024', event: '品牌升级为"运动蚂蚁"，开启新征程', icon: '🎯' },
];

const STATS = [
  { value: '2015', label: '成立年份' },
  { value: '60+', label: '款产品' },
  { value: '2000+', label: '合作伙伴' },
  { value: '50+', label: '国家地区' },
  { value: '100+', label: '项专利' },
  { value: '18', label: '月平均回本' },
  { value: '500+', label: '场地案例' },
  { value: '99%', label: '客户满意度' },
];

const VALUES = [
  { title: '让运动更有趣', description: '用数字科技重新定义运动体验，让每个人都能享受运动的乐趣，从儿童到老人，从新手到专业运动员。', icon: '🎯', color: '#0066FF' },
  { title: '技术创新驱动', description: '60+项专利技术，自主研发控制系统，持续引领行业发展。核心团队来自华为、腾讯等知名企业。', icon: '💡', color: '#FF6B00' },
  { title: '客户成功至上', description: '成功帮助2000+合作伙伴实现商业价值是我们的核心使命。提供从选址到运营的全流程支持。', icon: '🏆', color: '#00C853' },
  { title: '开放合作共赢', description: '与产业链伙伴开放合作，共同推动数字运动产业繁荣。已与万达、华润等建立战略合作关系。', icon: '🤝', color: '#8B5CF6' },
  { title: '品质第一', description: '源头厂商品控，自研自产。2年质保、7×24小时响应、48小时到场维修，品质服务双保障。', icon: '🛡️', color: '#FF4081' },
  { title: '终身学习', description: '持续更新100+款运动内容，定期推送新游戏新活动。终身软件升级，让设备永不过时。', icon: '📚', color: '#00BCD4' },
];

const TEAM = [
  { name: '陈志远', position: '创始人兼CEO', bio: '深耕体育娱乐设备行业15年，专注数字运动技术创新，曾任职于多家知名体育企业', avatar: '👨‍💼', image: '/images/about/team-meeting.jpg' },
  { name: '李明辉', position: '技术总监CTO', bio: '前华为高级工程师，主导研发60+款创新产品，拥有20+项技术专利', avatar: '👨‍🔬', image: '/images/about/rd-lab.jpg' },
  { name: '王晓燕', position: '运营总监COO', bio: '10年连锁运营管理经验，服务500+合作伙伴，精通数字化运营体系', avatar: '👩‍💼', image: '/images/about/office-culture.jpg' },
  { name: '张海涛', position: '设计总监', bio: '国际知名设计大奖获得者，负责产品工业设计，追求极致的用户体验', avatar: '👨‍🎨', image: '/images/about/factory.jpg' },
  { name: '刘建国', position: '销售总监', bio: '15年B2B销售经验，建立覆盖全国的销售服务网络，年销售额突破5亿', avatar: '👨‍💻', image: '/images/about/team-meeting.jpg' },
  { name: '陈思思', position: '客户服务总监', bio: '负责客户服务体系建设，主导神机营SaaS客户成功模块，满意度达99%', avatar: '👩‍🔧', image: '/images/about/office-culture.jpg' },
  { name: '王强', position: '生产总监', bio: '20年制造业经验，打造智能化生产线，日产能达50+台设备', avatar: '👨‍🏭', image: '/images/about/factory.jpg' },
  { name: '张文静', position: '市场总监', bio: '负责品牌营销与市场推广，策划多场行业峰会，品牌影响力提升300%', avatar: '👩‍📢', image: '/images/about/award-ceremony.jpg' },
];

const PARTNERS = [
  { name: '万达集团', icon: '🏬' }, { name: '华润万象城', icon: '🏢' }, { name: '新城吾悦广场', icon: '🏙️' },
  { name: '龙湖天街', icon: '🌆' }, { name: '大悦城', icon: '🏗️' }, { name: '永旺梦乐城', icon: '🛒' },
  { name: '银泰百货', icon: '🏬' }, { name: '印力中心', icon: '🏗️' }, { name: '宝龙广场', icon: '🏢' },
  { name: '世纪金源', icon: '🏛️' }, { name: '红星美凯龙', icon: '🛍️' }, { name: '居然之家', icon: '🏠' },
];

export default function AboutPage() {
  const handleCTAClick = (location: string) => {
    conversionService.trackCTAClick('about', location);
  };

  const styles = {
    page: { minHeight: '100vh', backgroundColor: designSystem.colors.bg.primary, color: designSystem.colors.text.primary, overflowX: 'hidden' as const },
    section: { padding: '80px 24px' },
    container: { maxWidth: '1200px', margin: '0 auto' },
    sectionTitle: { fontSize: '14px', color: designSystem.colors.accent.blue, letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '12px', fontWeight: 500 },
    sectionHeading: { fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: designSystem.colors.text.primary },
  };

  return (
    <>
      <SEOMeta
        title="关于我们 - 运动蚂蚁品牌故事"
        description="运动蚂蚁是广州蚂蚁运动有限公司核心品牌，是一家集商用数字体育娱乐设备的研发、生产、销售和服务于一体的数字运动企业。"
        keywords={['运动蚂蚁', '关于我们', '品牌故事', '发展历程']}
        type="website"
      />

      <ConversionTracker page="about" />

      <div style={styles.page}>
        <Header />

        {/* Hero */}
        <section style={{ position: 'relative', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 100%)' }}>
          {/* 背景图片 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/images/about/team-meeting.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            filter: 'blur(3px)',
          }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 102, 255, 0.12) 0%, transparent 60%)' }} />

          <AnimatedSection style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '0 24px', textAlign: 'center' as const }}>
            <p style={{ fontSize: '14px', color: designSystem.colors.accent.blue, marginBottom: '16px', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>About Us</p>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.02em' }}>让运动更有趣</h1>
            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.8 }}>
              运动蚂蚁是专业的数字运动设备企业，集研发、生产、销售、服务于一体，
              <br style={{ display: 'block' }} />
              为您提供数字运动馆规划、设计、施工、运营一站式服务
            </p>
          </AnimatedSection>
        </section>

        {/* Stats */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={styles.container}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
              {STATS.map((stat, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <HoverCard onClick={() => handleCTAClick(`stat_${index}`)} style={{ textAlign: 'center', padding: '24px', borderRadius: designSystem.borderRadius.lg, background: designSystem.colors.glass, border: `1px solid ${designSystem.colors.border.subtle}` }}>
                    <p style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, color: designSystem.colors.text.primary, marginBottom: '8px' }}>{stat.value}</p>
                    <p style={{ fontSize: '14px', color: designSystem.colors.text.muted }}>{stat.label}</p>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.primary }}>
          <div style={{ ...styles.container, maxWidth: '1000px' }}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
              <p style={styles.sectionTitle}>Our Values</p>
              <h2 style={styles.sectionHeading}>核心价值观</h2>
            </AnimatedSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {VALUES.map((value, index) => (
                <AnimatedSection key={value.title} delay={index * 100}>
                  <HoverCard onClick={() => handleCTAClick(`value_${index}`)} style={{ padding: '32px', borderRadius: designSystem.borderRadius.xl, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: `1px solid ${designSystem.colors.border.medium}` }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: designSystem.borderRadius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: `${value.color}20`, marginBottom: '24px' }}>{value.icon}</div>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: designSystem.colors.text.primary, marginBottom: '12px' }}>{value.title}</h3>
                    <p style={{ fontSize: '14px', color: designSystem.colors.text.muted, lineHeight: 1.7 }}>{value.description}</p>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={{ ...styles.container, maxWidth: '900px' }}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
              <p style={styles.sectionTitle}>Journey</p>
              <h2 style={styles.sectionHeading}>发展历程</h2>
            </AnimatedSection>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: 0, bottom: 0, width: '1px', background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)', transform: 'translateX(-50%)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {TIMELINE.map((item, index) => (
                  <AnimatedSection key={item.year} delay={index * 100}>
                    <HoverCard onClick={() => handleCTAClick(`timeline_${index}`)} style={{ position: 'relative', paddingLeft: '48px' }}>
                      <div style={{ position: 'absolute', left: '16px', top: '20px', width: '12px', height: '12px', borderRadius: '50%', background: '#0066FF', transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(0, 102, 255, 0.5)', zIndex: 10 }} />
                      <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: designSystem.borderRadius.full, fontSize: '14px', fontWeight: 600, background: 'rgba(0, 102, 255, 0.15)', color: '#0066FF', marginBottom: '12px' }}>{item.year}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{item.icon}</span>
                        <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)' }}>{item.event}</p>
                      </div>
                    </HoverCard>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.primary }}>
          <div style={styles.container}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '48px' }}>
              <p style={styles.sectionTitle}>Leadership</p>
              <h2 style={styles.sectionHeading}>核心团队</h2>
            </AnimatedSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              {TEAM.map((member, index) => (
                <AnimatedSection key={member.name} delay={index * 100}>
                  <HoverCard onClick={() => handleCTAClick(`team_${index}`)} style={{ padding: '24px', borderRadius: designSystem.borderRadius.lg, background: designSystem.colors.glass, border: `1px solid ${designSystem.colors.border.subtle}`, textAlign: 'center' as const }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', background: `url(${member.image}) center/cover no-repeat`, backgroundColor: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
                      {!member.image && member.avatar}
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: designSystem.colors.text.primary, marginBottom: '4px' }}>{member.name}</h3>
                    <p style={{ fontSize: '14px', marginBottom: '12px', color: designSystem.colors.accent.blue }}>{member.position}</p>
                    <p style={{ fontSize: '12px', color: designSystem.colors.text.muted, lineHeight: 1.6 }}>{member.bio}</p>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={{ ...styles.container, maxWidth: '900px' }}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '48px' }}>
              <p style={styles.sectionTitle}>Partners</p>
              <h2 style={styles.sectionHeading}>信任我们的伙伴</h2>
              <p style={{ fontSize: '16px', color: designSystem.colors.text.muted, marginTop: '16px' }}>2000+合作伙伴的共同选择</p>
            </AnimatedSection>

            <AnimatedSection>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '16px', justifyContent: 'center' }}>
                {PARTNERS.map((partner, index) => (
                  <HoverCard key={partner.name} onClick={() => handleCTAClick(`partner_${index}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderRadius: designSystem.borderRadius.full, background: designSystem.colors.glass, border: `1px solid ${designSystem.colors.border.medium}` }}>
                    <span style={{ fontSize: '24px' }}>{partner.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)' }}>{partner.name}</span>
                  </HoverCard>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '128px 24px', background: 'linear-gradient(180deg, #000 0%, #111 100%)' }}>
          <AnimatedSection style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' as const }}>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: designSystem.colors.text.primary, marginBottom: '24px' }}>期待与您合作</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '48px' }}>无论您是首次创业还是规模化扩张，运动蚂蚁都能为您提供最合适的解决方案</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <ClickableLink href="/sports-ants/contact" onClick={() => handleCTAClick('cta_consult')} style={{ padding: '16px 40px', borderRadius: designSystem.borderRadius.full, fontSize: '16px', fontWeight: 500, background: '#0066FF', boxShadow: '0 0 40px rgba(0, 102, 255, 0.4)', color: '#fff' }}>
                立即咨询
              </ClickableLink>
              <ClickableLink href="/sports-ants/products" onClick={() => handleCTAClick('cta_products')} style={{ padding: '16px 40px', borderRadius: designSystem.borderRadius.full, fontSize: '16px', fontWeight: 500, background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}>
                浏览产品
              </ClickableLink>
            </div>
          </AnimatedSection>
        </section>

        <Footer />

        <FloatingContact />
        <ExitIntentPopup delaySeconds={15} />
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif; -webkit-font-smoothing: antialiased; }
      `}</style>
    </>
  );
}