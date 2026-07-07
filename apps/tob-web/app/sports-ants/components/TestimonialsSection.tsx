/**
 * 用户评价组件
 * Testimonials Section
 */

'use client';

import React from 'react';
import { BigAntsColors, BigAntsRadius, BigAntsShadows, BigAntsSpacing, BigAntsFonts, BigAntsTransitions } from '../lib/bigants-design';

interface Testimonial {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  tags: string[];
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: '王建国',
    title: '总经理',
    company: '万达宝贝王',
    avatar: '👨‍💼',
    content: '运动蚂蚁的设备品质非常出色，我们的门店引进后，日均客流量提升了40%。专业的运营团队全程支持，从选址到运营都有保障。选择运动蚂蚁是我们最正确的决定。',
    rating: 5,
    tags: ['客流量提升40%', '专业运营支持', '品质可靠'],
  },
  {
    id: 't2',
    name: '李美华',
    title: '创始人',
    company: '乐动空间',
    avatar: '👩‍🏫',
    content: '作为连续创业者，我最看重的是合作伙伴的可靠性。运动蚂蚁不仅产品过硬，售后服务也非常到位。设备运行2年来几乎零故障，这让我们能够专注于提升用户体验。',
    rating: 5,
    tags: ['零故障', '售后到位', '值得信赖'],
  },
  {
    id: 't3',
    name: '张伟',
    title: '运营总监',
    company: '华润五彩城',
    avatar: '👨‍💻',
    content: '运动蚂蚁的数字化管理系统让门店运营效率大幅提升。实时数据看板让我能够随时掌握运营状况，营销活动的效果也可以量化评估。这种数据驱动的运营方式非常先进。',
    rating: 5,
    tags: ['数字化管理', '效率提升', '数据驱动'],
  },
  {
    id: 't4',
    name: '陈静',
    title: '项目负责人',
    company: '龙湖天街',
    avatar: '👩‍🔬',
    content: '我们商场引进运动蚂蚁后，成为了周边社区居民的首选运动目的地。设备的可玩性很强，男女老少都喜欢。这种寓教于乐的体验式消费模式非常符合当下的消费趋势。',
    rating: 5,
    tags: ['寓教于乐', '全年龄适用', '消费趋势'],
  },
  {
    id: 't5',
    name: '刘强',
    title: 'CEO',
    company: '几何健身房',
    avatar: '👨‍🎓',
    content: '运动蚂蚁的EPC+O服务让我们省心太多。从场馆设计、设备选型到施工安装，全程不用操心。专业的团队做专业的事，现在我们的门店已经成为区域标杆。',
    rating: 5,
    tags: ['EPC+O服务', '省心', '区域标杆'],
  },
  {
    id: 't6',
    name: '周晓燕',
    title: '市场总监',
    company: '银泰百货',
    avatar: '👩‍💼',
    content: '运动蚂蚁的营销工具非常实用，帮我策划的几次活动都取得了很好的效果。会员系统也很完善，用户粘性很高。数字化运营让我们的业绩稳步增长。',
    rating: 5,
    tags: ['营销工具', '会员系统', '业绩增长'],
  },
];

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  maxDisplay?: number;
}

export default function TestimonialsSection({
  title = '客户真实评价',
  subtitle = '来自全国各地合作伙伴的认可与支持',
  maxDisplay = 6,
}: TestimonialsSectionProps) {
  return (
    <section
      style={{
        padding: `${BigAntsSpacing['4xl']} 24px`,
        background: '#F8FAFC',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: BigAntsSpacing['2xl'] }}>
          <h2
            style={{
              fontFamily: BigAntsFonts.display,
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 700,
              color: '#1A1A2E',
              marginBottom: BigAntsSpacing.md,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '16px',
              color: '#666666',
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: BigAntsSpacing.lg,
          }}
        >
          {TESTIMONIALS.slice(0, maxDisplay).map((testimonial) => (
            <div
              key={testimonial.id}
              style={{
                padding: BigAntsSpacing.xl,
                background: '#FFFFFF',
                borderRadius: BigAntsRadius.xl,
                boxShadow: BigAntsShadows.sm,
                transition: `all ${BigAntsTransitions.normal}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = BigAntsShadows.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = BigAntsShadows.sm;
              }}
            >
              {/* Stars */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: BigAntsSpacing.md }}>
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <span key={i} style={{ color: '#FFB800', fontSize: '18px' }}>
                    ★
                  </span>
                ))}
              </div>

              {/* Content */}
              <p
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '15px',
                  color: '#333333',
                  lineHeight: 1.8,
                  marginBottom: BigAntsSpacing.lg,
                }}
              >
                "{testimonial.content}"
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: BigAntsSpacing.lg }}>
                {testimonial.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 12px',
                      background: `${BigAntsColors.primary}10`,
                      color: BigAntsColors.primary,
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.full,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: BigAntsSpacing.md }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#1A1A2E',
                    }}
                  >
                    {testimonial.name}
                  </div>
                  <div
                    style={{
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '13px',
                      color: '#666666',
                    }}
                  >
                    {testimonial.title} · {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: BigAntsSpacing['2xl'],
            marginTop: BigAntsSpacing['2xl'],
            paddingTop: BigAntsSpacing['2xl'],
            borderTop: '1px solid #E2E8F0',
            flexWrap: 'wrap',
          }}
        >
          {[
            { icon: '🏆', label: '500+合作伙伴' },
            { icon: '📍', label: '覆盖50+城市' },
            { icon: '👥', label: '服务1000万+用户' },
            { icon: '⭐', label: '4.9分满意度' },
          ].map((badge) => (
            <div
              key={badge.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '24px' }}>{badge.icon}</span>
              <span
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#666666',
                }}
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
