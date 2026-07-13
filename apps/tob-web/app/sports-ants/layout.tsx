/**
 * 运动蚂蚁官网全局布局
 * BigAnts Global Layout
 * 包含AI智能客服组件
 */

import type { Metadata } from 'next';
import React from 'react';
import AICustomerService from './components/AICustomerService';

export const metadata: Metadata = {
  title: '运动蚂蚁 BigAnts | 数字运动潮玩一站式提供商',
  description:
    '运动蚂蚁是专业的数字运动设备企业，提供数字运动馆规划、设计、施工、运营一站式服务。',
  alternates: {
    canonical: 'https://www.bigants.net',
  },
  openGraph: {
    title: '运动蚂蚁 BigAnts | 数字运动潮玩一站式提供商',
    description:
      '运动蚂蚁是专业的数字运动设备企业，提供数字运动馆规划、设计、施工、运营一站式服务。',
    url: 'https://www.bigants.net',
    siteName: '运动蚂蚁 BigAnts',
    type: 'website',
    images: ['https://www.bigants.net/og-image.jpg'],
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '运动蚂蚁 BigAnts | 数字运动潮玩一站式提供商',
    description:
      '运动蚂蚁是专业的数字运动设备企业，提供数字运动馆规划、设计、施工、运营一站式服务。',
    images: ['https://www.bigants.net/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SportsAntsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AICustomerService />
    </>
  );
}
