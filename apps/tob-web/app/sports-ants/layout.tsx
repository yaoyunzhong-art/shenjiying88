/**
 * 运动蚂蚁官网全局布局
 * BigAnts Global Layout
 * 包含AI智能客服组件
 */

'use client';

import React from 'react';
import AICustomerService from './components/AICustomerService';

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
