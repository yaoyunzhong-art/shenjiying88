/**
 * 运动蚂蚁页面过渡动画
 * BigAnts Page Transition
 */

'use client';

import React, { useEffect, useState } from 'react';
import { BigAntsColors, BigAntsTransitions } from '../lib/bigants-design';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 延迟显示以触发进入动画
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 400ms ease-out, transform 400ms ease-out`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 滚动渐入动画组件
 * 适用于需要滚动进入视线的元素
 */
interface FadeInSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeInSection({ children, delay = 0, className }: FadeInSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div
      ref={setRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 500ms ease-out ${delay}ms, transform 500ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 数字滚动动画组件
 */
interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

export function CountUp({ end, duration = 2000, suffix = '', prefix = '' }: CountUpProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={setRef}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}