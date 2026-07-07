/**
 * 品牌官网布局 - Brand Website Layout
 * 苹果风格全站布局
 */

import type { Metadata } from 'next';
import Header from './components/Header';
import Footer from './components/Footer';
import FixedCTA from './components/FixedCTA';
import './styles/globals.css';

export const metadata: Metadata = {
  title: '神机营 - 企业级全链路服务品牌',
  description: '神机营专注为企业客户提供产品供应链、EPC+O全流程服务、数字运动潮玩馆一站式解决方案，助力合作伙伴实现商业增长。',
  keywords: '企业服务, 供应链, EPC, 数字运动, 招商加盟, 神机营',
  openGraph: {
    title: '神机营 - 企业级全链路服务品牌',
    description: '连接你我，共创商业未来',
    type: 'website',
  },
};

export default function BrandWebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, paddingTop: '64px' }}>
        {children}
      </main>
      <Footer />
      <FixedCTA />
    </div>
  );
}
