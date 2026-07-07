/**
 * 运动蚂蚁官网 - 转化追踪组件
 * 用于追踪用户在网站上的行为
 */

'use client';

import { useEffect } from 'react';
import { conversionService, ConversionSource } from '../lib/conversion-service';

interface ConversionTrackerProps {
  page: ConversionSource;
}

/**
 * 页面浏览追踪组件
 * 在页面加载时自动发送页面浏览事件
 */
export default function ConversionTracker({ page }: ConversionTrackerProps) {
  useEffect(() => {
    // 追踪页面浏览
    conversionService.trackPageView(page);
  }, [page]);

  return null;
}

/**
 * CTA点击追踪钩子
 */
export function useCTATracking(page: ConversionSource) {
  const trackCTAClick = (ctaType: string) => {
    conversionService.trackCTAClick(page, ctaType);
  };

  const trackPhoneClick = (phoneNumber: string) => {
    conversionService.trackPhoneClick(phoneNumber);
  };

  const trackWechatClick = (wechatId: string) => {
    conversionService.trackWechatClick(wechatId);
  };

  return {
    trackCTAClick,
    trackPhoneClick,
    trackWechatClick,
  };
}

/**
 * 转化漏斗分析Hook
 * 用于分析用户在页面上的行为路径
 */
export function useFunnelAnalysis(page: ConversionSource) {
  useEffect(() => {
    const handleScroll = () => {
      // 滚动深度追踪
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

      // 发送滚动深度事件
      if (scrollPercent % 25 === 0) {
        // 每25%发送一次
        console.log(`[Funnel] Page: ${page}, Scroll: ${scrollPercent}%`);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page]);
}
