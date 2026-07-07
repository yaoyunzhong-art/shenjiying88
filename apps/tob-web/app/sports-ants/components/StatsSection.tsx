/**
 * 运动蚂蚁品牌数据统计区域
 * BigAnts Stats Section
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius } from '../lib/bigants-design';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

const STATS: StatItem[] = [
  { value: 2000, suffix: '+', label: '合作客户' },
  { value: 50, suffix: '+', label: '国家和地区' },
  { value: 500, suffix: '+', label: '场地案例' },
  { value: 100, suffix: '+', label: '专利认证' },
  { value: 60, suffix: '+', label: '创新产品' },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section
      style={{
        background: BigAntsColors.white,
        padding: `${BigAntsSpacing['2xl']} 0`,
        borderBottom: `1px solid ${BigAntsColors.bgGray}`,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: `0 ${BigAntsSpacing.lg}`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: BigAntsSpacing.xl,
            textAlign: 'center',
          }}
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: BigAntsSpacing.lg,
              }}
            >
              <p
                style={{
                  fontFamily: BigAntsFonts.mono,
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '8px',
                }}
              >
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </p>
              <p
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  color: BigAntsColors.textSecondary,
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
