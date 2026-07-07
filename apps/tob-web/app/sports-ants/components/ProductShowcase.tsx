/**
 * 运动蚂蚁产品展示区域
 * BigAnts Product Showcase
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsShadows, BigAntsTransitions } from '../lib/bigants-design';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
}

interface ProductShowcaseProps {
  products: Product[];
}

export default function ProductShowcase({ products }: ProductShowcaseProps) {
  return (
    <section
      style={{
        background: BigAntsColors.white,
        padding: `${BigAntsSpacing['4xl']} 0`,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: `0 ${BigAntsSpacing.lg}`,
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: BigAntsSpacing['3xl'] }}>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              fontWeight: 600,
              color: BigAntsColors.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: BigAntsSpacing.md,
            }}
          >
            明星产品
          </p>
          <h2
            style={{
              fontFamily: BigAntsFonts.display,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              color: BigAntsColors.textPrimary,
              marginBottom: BigAntsSpacing.md,
            }}
          >
            热门产品精选
          </h2>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '18px',
              color: BigAntsColors.textSecondary,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            60+款数字运动设备，满足各类场馆差异化需求
          </p>
        </div>

        {/* Products Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: BigAntsSpacing.xl,
            marginBottom: BigAntsSpacing['2xl'],
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                background: BigAntsColors.white,
                borderRadius: BigAntsRadius.xl,
                overflow: 'hidden',
                boxShadow: BigAntsShadows.md,
                transition: `all ${BigAntsTransitions.normal}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = BigAntsShadows.xl;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = BigAntsShadows.md;
              }}
            >
              {/* Product Image Placeholder */}
              <div
                style={{
                  height: '200px',
                  background: `linear-gradient(135deg, ${BigAntsColors.bgGray} 0%, ${BigAntsColors.bgLight} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    fontSize: '64px',
                    opacity: 0.5,
                  }}
                >
                  🎮
                </div>
                {/* Category Badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    padding: '4px 12px',
                    background: BigAntsColors.primary,
                    color: BigAntsColors.white,
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: BigAntsRadius.full,
                  }}
                >
                  {product.category}
                </span>
              </div>

              {/* Product Info */}
              <div style={{ padding: BigAntsSpacing.lg }}>
                <h3
                  style={{
                    fontFamily: BigAntsFonts.display,
                    fontSize: '20px',
                    fontWeight: 700,
                    color: BigAntsColors.textPrimary,
                    marginBottom: BigAntsSpacing.sm,
                  }}
                >
                  {product.name}
                </h3>
                <p
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    color: BigAntsColors.textSecondary,
                    lineHeight: 1.6,
                    marginBottom: BigAntsSpacing.md,
                  }}
                >
                  {product.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: BigAntsSpacing.md }}>
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '2px 10px',
                        background: BigAntsColors.bgGray,
                        color: BigAntsColors.textTertiary,
                        fontSize: '12px',
                        borderRadius: BigAntsRadius.sm,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: BigAntsSpacing.sm }}>
                  <Link
                    href={`/sports-ants/products?id=${product.id}`}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: BigAntsColors.bgGray,
                      color: BigAntsColors.textPrimary,
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.md,
                      textAlign: 'center',
                      textDecoration: 'none',
                      transition: `all ${BigAntsTransitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = BigAntsColors.primary;
                      e.currentTarget.style.color = BigAntsColors.white;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = BigAntsColors.bgGray;
                      e.currentTarget.style.color = BigAntsColors.textPrimary;
                    }}
                  >
                    查看详情
                  </Link>
                  <Link
                    href={`/sports-ants/contact?product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}`}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: BigAntsColors.primary,
                      color: BigAntsColors.white,
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.md,
                      textAlign: 'center',
                      textDecoration: 'none',
                      transition: `all ${BigAntsTransitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = BigAntsColors.primaryDark;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = BigAntsColors.primary;
                    }}
                  >
                    获取报价
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/sports-ants/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 32px',
              background: 'transparent',
              color: BigAntsColors.primary,
              fontFamily: BigAntsFonts.chinese,
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: BigAntsRadius.full,
              textDecoration: 'none',
              border: `2px solid ${BigAntsColors.primary}`,
              transition: `all ${BigAntsTransitions.normal}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = BigAntsColors.primary;
              e.currentTarget.style.color = BigAntsColors.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = BigAntsColors.primary;
            }}
          >
            查看全部产品 →
          </Link>
        </div>
      </div>
    </section>
  );
}
