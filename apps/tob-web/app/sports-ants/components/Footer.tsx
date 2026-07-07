/**
 * 运动蚂蚁官网页脚
 * BigAnts Footer
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsTransitions } from '../lib/bigants-design';

const FOOTER_LINKS = {
  产品中心: [
    { id: 'simulation', label: '模拟运动系列', href: '/sports-ants/products?category=simulation' },
    { id: 'shooting', label: '射击系列', href: '/sports-ants/products?category=shooting' },
    { id: 'vr-ar', label: 'VR/AR系列', href: '/sports-ants/products?category=vr-ar' },
    { id: 'entertainment', label: '大型游戏设备', href: '/sports-ants/products?category=entertainment' },
  ],
  服务支持: [
    { id: 'epc', label: 'EPC+O服务', href: '/sports-ants/epc' },
    { id: 'solutions', label: '解决方案', href: '/sports-ants/solutions' },
    { id: 'custom', label: '定制服务', href: '/sports-ants/solutions?type=custom' },
    { id: 'support', label: '售后服务', href: '/sports-ants/contact' },
  ],
  解决方案: [
    { id: 'digital-center', label: '数字体育中心', href: '/sports-ants/solutions?type=digital-center' },
    { id: 'commercial', label: '商业地产增值', href: '/sports-ants/solutions?type=commercial' },
    { id: 'children', label: '儿童游乐方案', href: '/sports-ants/solutions?type=children' },
    { id: 'custom', label: '定制服务', href: '/sports-ants/solutions?type=custom' },
  ],
  招商加盟: [
    { id: 'franchise', label: '特许加盟', href: '/sports-ants/franchise?mode=franchise' },
    { id: 'joint', label: '合资联营', href: '/sports-ants/franchise?mode=joint' },
    { id: 'license', label: '品牌授权', href: '/sports-ants/franchise?mode=license' },
    { id: 'investment', label: '投资回报', href: '/sports-ants/franchise#roi' },
  ],
  关于我们: [
    { id: 'about', label: '公司介绍', href: '/sports-ants/about' },
    { id: 'cases', label: '案例中心', href: '/sports-ants/cases' },
    { id: 'contact', label: '联系我们', href: '/sports-ants/contact' },
    { id: 'jobs', label: '加入我们', href: '/sports-ants/about#jobs' },
  ],
};

const SOCIAL_LINKS = [
  { name: '微信', icon: '💬', id: 'wechat' },
  { name: '微博', icon: '📱', id: 'weibo' },
  { name: '抖音', icon: '🎵', id: 'douyin' },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: BigAntsColors.bgDark,
        color: BigAntsColors.white,
        paddingTop: BigAntsSpacing['3xl'],
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: `0 ${BigAntsSpacing.lg}`,
        }}
      >
        {/* Main Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: BigAntsSpacing['2xl'],
            paddingBottom: BigAntsSpacing['3xl'],
          }}
        >
          {/* Brand Column */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: BigAntsSpacing.lg,
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: BigAntsRadius.md,
                  background: BigAntsColors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                🐜
              </div>
              <div>
                <span
                  style={{
                    fontFamily: BigAntsFonts.display,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: BigAntsColors.white,
                  }}
                >
                  运动蚂蚁
                </span>
              </div>
            </div>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.8,
                marginBottom: BigAntsSpacing.lg,
                maxWidth: '280px',
              }}
            >
              运动蚂蚁是专业的数字运动设备企业，集研发、生产、销售、服务于一体，致力于把最优质的、最健康的、最有趣的数字体验带给每一个人。
            </p>
            {/* Social Links */}
            <div style={{ display: 'flex', gap: BigAntsSpacing.md }}>
              {SOCIAL_LINKS.map((social) => (
                <div
                  key={social.id}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: BigAntsRadius.full,
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: `background ${BigAntsTransitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = BigAntsColors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  {social.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: BigAntsColors.white,
                  marginBottom: BigAntsSpacing.lg,
                  letterSpacing: '0.02em',
                }}
              >
                {title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {links.map((link) => (
                  <li key={link.id} style={{ marginBottom: BigAntsSpacing.sm }}>
                    <Link
                      href={link.href}
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        textDecoration: 'none',
                        transition: `color ${BigAntsTransitions.fast}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = BigAntsColors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Column */}
          <div>
            <h4
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                fontWeight: 600,
                color: BigAntsColors.white,
                marginBottom: BigAntsSpacing.lg,
              }}
            >
              联系我们
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: BigAntsSpacing.md }}>
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginBottom: '4px',
                  }}
                >
                  商务热线
                </div>
                <a
                  href="tel:400-888-8888"
                  style={{
                    fontFamily: BigAntsFonts.mono,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: BigAntsColors.white,
                    textDecoration: 'none',
                  }}
                >
                  400-888-8888
                </a>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginBottom: '4px',
                  }}
                >
                  邮箱地址
                </div>
                <a
                  href="mailto:business@bigants.net"
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                  }}
                >
                  business@bigants.net
                </a>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginBottom: '4px',
                  }}
                >
                  公司地址
                </div>
                <span
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  广州市番禺区钟村街道
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: BigAntsSpacing.xl,
            paddingBottom: BigAntsSpacing.xl,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: BigAntsSpacing.md,
          }}
        >
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.4)',
              margin: 0,
            }}
          >
            © 2024 运动蚂蚁 BigAnts. 保留所有权利.
          </p>
          <div style={{ display: 'flex', gap: BigAntsSpacing.lg }}>
            {['隐私政策', '服务条款', '京ICP备xxxx号'].map((item, idx) => (
              <span
                key={item}
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  cursor: idx < 2 ? 'pointer' : 'default',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
