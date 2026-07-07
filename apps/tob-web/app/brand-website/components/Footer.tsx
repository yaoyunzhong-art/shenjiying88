/**
 * 苹果风格页脚 - Apple Footer
 * 包含联系方式、快速链接、版权信息
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { AppleColors, AppleFonts, AppleSpacing, AppleFontSizes } from '../lib/apple-design';

const FOOTER_LINKS = {
  业务线: [
    { id: 'products', label: '产品销售合作', href: '/brand-website/products' },
    { id: 'epc', label: 'EPC+O全流程服务', href: '/brand-website/epc' },
    { id: 'digital-sports', label: '数字运动潮玩馆', href: '/brand-website/digital-sports' },
    { id: 'franchise', label: '招商加盟合作', href: '/brand-website/franchise' },
  ],
  合作支持: [
    { id: 'supply-chain', label: '供应链合作', href: '/brand-website/supply-chain' },
    { id: 'brand-license', label: '品牌授权合作', href: '/brand-website/supply-chain' },
    { id: 'service', label: '全链路服务', href: '/brand-website/service' },
    { id: 'contact', label: '联系我们', href: '/brand-website/contact' },
  ],
  关于我们: [
    { id: 'about', label: '公司介绍', href: '/brand-website/about' },
    { id: 'advantages', label: '核心优势', href: '/brand-website#advantages' },
    { id: 'cases', label: '客户案例', href: '/brand-website#cases' },
    { id: 'news', label: '新闻资讯', href: '/brand-website/news' },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        background: AppleColors.primary,
        color: AppleColors.bgWhite,
        padding: `${AppleSpacing.sectionLg} 0 ${AppleSpacing.xl}`,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `0 ${AppleSpacing.lg}`,
        }}
      >
        {/* Main Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: AppleSpacing.xxl,
            marginBottom: AppleSpacing.section,
          }}
        >
          {/* Brand Column */}
          <div>
            <h3
              style={{
                fontFamily: AppleFonts.display,
                fontSize: '24px',
                fontWeight: 600,
                marginBottom: AppleSpacing.md,
                letterSpacing: '-0.02em',
              }}
            >
              神机营
            </h3>
            <p
              style={{
                fontFamily: AppleFonts.text,
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.6,
                marginBottom: AppleSpacing.lg,
              }}
            >
              面向企业客户的全链路服务品牌，专注供应链、EPC+O、数字运动三大核心业务，为合作伙伴提供一站式解决方案。
            </p>
            {/* Social Links */}
            <div style={{ display: 'flex', gap: AppleSpacing.md }}>
              {['微博', '微信', '抖音'].map((social) => (
                <span
                  key={social}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  {social[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4
                style={{
                  fontFamily: AppleFonts.text,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: AppleSpacing.lg,
                }}
              >
                {title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {links.map((link) => (
                  <li key={link.id} style={{ marginBottom: AppleSpacing.sm }}>
                    <Link
                      href={link.href}
                      style={{
                        fontFamily: AppleFonts.text,
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = AppleColors.bgWhite;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
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
                fontFamily: AppleFonts.text,
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: AppleSpacing.lg,
              }}
            >
              联系我们
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: AppleSpacing.md }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
                  商务热线
                </div>
                <a
                  href="tel:400-888-8888"
                  style={{
                    fontFamily: AppleFonts.text,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: AppleColors.bgWhite,
                    textDecoration: 'none',
                  }}
                >
                  400-888-8888
                </a>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
                  邮箱地址
                </div>
                <a
                  href="mailto:business@shenjiying.com"
                  style={{
                    fontFamily: AppleFonts.text,
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                  }}
                >
                  business@shenjiying.com
                </a>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
                  企业微信
                </div>
                <span style={{ fontFamily: AppleFonts.text, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  神机营商业合作
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: AppleSpacing.xl,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: AppleSpacing.md,
          }}
        >
          <p
            style={{
              fontFamily: AppleFonts.text,
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.4)',
              margin: 0,
            }}
          >
            © 2024 神机营 SaaS. 保留所有权利.
          </p>
          <div style={{ display: 'flex', gap: AppleSpacing.lg }}>
            {['隐私政策', '服务条款', '京ICP备12345678号'].map((item, idx) => (
              <span
                key={item}
                style={{
                  fontFamily: AppleFonts.text,
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
