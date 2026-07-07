/**
 * 运动蚂蚁产品详情页
 * BigAnts Product Detail Page
 */

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SEOMeta from '../../components/seo/SEOMeta';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import FloatingContact from '../../components/FloatingContact';
import ExitIntentPopup from '../../components/ExitIntentPopup';
import ProductCTA from '../../components/ProductCTA';
import { BigAntsColors, BigAntsRadius, BigAntsSpacing, BigAntsFonts } from '../../lib/bigants-design';

// 产品详细数据
const PRODUCTS_DETAIL: Record<string, {
  name: string;
  category: string;
  categoryName: string;
  shortDesc: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
  scenarios: string[];
  targetAudience: string[];
  pricing: string;
  images: string[];
  cases: Array<{ name: string; location: string; result: string }>;
}> = {
  'super-tennis': {
    name: '超级网球',
    category: 'simulation',
    categoryName: '模拟运动',
    shortDesc: '利用发球机与软件画面营造出真实比赛场景，实现玩家与AI的实时对抗',
    description: '超级网球是运动蚂蚁自主研发的高端数字运动设备，通过高速发球机配合沉浸式软件画面，为玩家带来真实的网球体验。系统内置AI智能对手，从初学者到专业选手都能找到合适的挑战难度。',
    features: [
      'AI智能对战：自研AI算法，模拟真实对手，从新手到高手都能找到匹配难度',
      '多关卡设计：10+个难度关卡，从入门到专业逐级挑战',
      '真实击球感：高速发球机配合精准感应器，还原真实击球体验',
      '数据记录分析：实时记录击球速度、角度、得分等数据，生成成长报告',
      '多人联机PK：支持2-4人联机对战，竞技更有趣',
      '云端内容更新：游戏内容定期更新，保持新鲜感',
    ],
    specs: {
      '适用人数': '1-4人',
      '单次时长': '15-30分钟',
      '设备尺寸': '8m × 4m × 3m',
      '功率': '3.5kW',
      '电压': '220V/50Hz',
      '网络': '有线网络/无线WiFi',
      '屏幕尺寸': '65寸×3',
      '重量': '约500kg',
    },
    scenarios: ['商业综合体', '健身房', '体育场馆', '社区活动中心'],
    targetAudience: ['网球爱好者', '运动达人', '亲子家庭', '年轻群体'],
    pricing: '¥150,000-280,000',
    images: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&h=600&fit=crop',
    ],
    cases: [
      { name: '万达广场北京店', location: '北京', result: '月均体验人次 1200+，会员复购率 75%' },
      { name: '华润万象城深圳店', location: '深圳', result: '季度营收提升 42%，客户满意度 98%' },
    ],
  },
  'baseball': {
    name: '模拟棒球',
    category: 'simulation',
    categoryName: '模拟运动',
    shortDesc: '高度还原棒球比赛场景，击球手、投手、守备员多角色体验',
    description: '模拟棒球采用先进的动作捕捉技术和高速感应系统，真实还原棒球击球体验。玩家可以体验击球手、投手、守备员等多种角色，感受棒球的魅力。',
    features: [
      '多角色体验：击球手、投手、守备员三种角色自由切换',
      'AI投球手：智能识别击球手水平，自动调整投球难度和速度',
      '真实场景模拟：高清球场画面，真实投球轨迹',
      '专业计分系统：自动记录本垒打数量、击球率等数据',
      '团队竞技模式：支持分组对战，增加社交乐趣',
    ],
    specs: {
      '适用人数': '1-6人',
      '单次时长': '20-40分钟',
      '设备尺寸': '10m × 5m × 3.5m',
      '功率': '4.2kW',
      '电压': '220V/50Hz',
    },
    scenarios: ['商业综合体', '体育主题场馆', '青少年培训中心'],
    targetAudience: ['棒球爱好者', '亲子家庭', '青少年群体'],
    pricing: '¥180,000-320,000',
    images: [
      'https://images.unsplash.com/photo-1529768167801-9173d94c2e42?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop',
    ],
    cases: [
      { name: '新城吾悦广场', location: '全国', result: '亲子客流提升 40%' },
    ],
  },
  'vr-skiing': {
    name: 'VR滑雪',
    category: 'vr-ar',
    categoryName: 'VR/AR系列',
    shortDesc: '沉浸式VR滑雪体验，雪山美景，极速下滑，躲避障碍',
    description: 'VR滑雪采用最新的6DoF追踪技术和自研运动算法，配合专业滑雪板设备，带来真实的滑雪体验。360度全景画面，让玩家仿佛置身真实雪场。',
    features: [
      '全沉浸式VR体验：360°全景画面，如临真实雪场',
      '真实体感模拟：配合滑雪板设备，真实还原滑雪感受',
      'AI智能陪练：实时语音指导，纠正滑雪姿势',
      '多人联机模式：与朋友一起竞技，更有乐趣',
      '安全刺激：无需担心摔倒受伤，随时享受滑雪乐趣',
    ],
    specs: {
      '适用人数': '1-2人',
      '单次时长': '10-15分钟',
      '设备尺寸': '5m × 4m × 2.5m',
      '功率': '3.0kW',
      '电压': '220V/50Hz',
    },
    scenarios: ['滑雪场', '商业综合体', '文旅景区', '亲子乐园'],
    targetAudience: ['滑雪爱好者', '亲子家庭', '年轻群体', '旅游人群'],
    pricing: '¥200,000-350,000',
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&h=600&fit=crop',
    ],
    cases: [
      { name: '万达文旅城', location: '广州', result: '高峰期排队体验，月均客流提升 60%' },
    ],
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const product = PRODUCTS_DETAIL[productId];

  if (!product) {
    return (
      <>
        <SEOMeta title="产品详情 - 运动蚂蚁" description="运动蚂蚁产品详情" />
        <Header />
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '100px 24px',
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>产品不存在</h1>
          <Link
            href="/sports-ants/products"
            style={{
              color: BigAntsColors.primary,
              textDecoration: 'underline',
            }}
          >
            返回产品列表
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOMeta
        title={`${product.name} - 运动蚂蚁`}
        description={product.shortDesc}
        keywords={[product.name, product.categoryName, '数字运动设备']}
      />

      <div className="min-h-screen bg-white">
        <Header />

        {/* Breadcrumb */}
        <div
          style={{
            paddingTop: '100px',
            paddingBottom: '20px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#666666' }}>
              <Link href="/sports-ants" style={{ color: '#666666', textDecoration: 'none' }}>首页</Link>
              <span>/</span>
              <Link href="/sports-ants/products" style={{ color: '#666666', textDecoration: 'none' }}>产品中心</Link>
              <span>/</span>
              <span style={{ color: BigAntsColors.primary }}>{product.name}</span>
            </div>
          </div>
        </div>

        {/* Product Hero */}
        <section style={{ padding: '40px 24px', background: '#FFFFFF' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
              {/* Image */}
              <div>
                <div
                  style={{
                    width: '100%',
                    height: '400px',
                    borderRadius: BigAntsRadius.xl,
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)`,
                  }}
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                {/* Thumbnails */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  {product.images.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '80px',
                        height: '60px',
                        borderRadius: BigAntsRadius.md,
                        overflow: 'hidden',
                        border: idx === 0 ? `2px solid ${BigAntsColors.primary}` : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: `${BigAntsColors.primary}15`,
                    color: BigAntsColors.primary,
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    marginBottom: '16px',
                  }}
                >
                  {product.categoryName}
                </span>
                <h1
                  style={{
                    fontFamily: BigAntsFonts.display,
                    fontSize: '36px',
                    fontWeight: 700,
                    color: '#1A1A2E',
                    marginBottom: '16px',
                  }}
                >
                  {product.name}
                </h1>
                <p
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '16px',
                    color: '#666666',
                    lineHeight: 1.8,
                    marginBottom: '24px',
                  }}
                >
                  {product.description}
                </p>

                {/* Price */}
                <div
                  style={{
                    padding: '20px',
                    background: '#F8FAFC',
                    borderRadius: BigAntsRadius.lg,
                    marginBottom: '24px',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#666666' }}>参考价格</span>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: BigAntsColors.primary, marginTop: '4px' }}>
                    {product.pricing}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link
                    href={`/sports-ants/contact?product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.categoryName)}`}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      background: BigAntsColors.primary,
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.lg,
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    获取详细报价
                  </Link>
                  <Link
                    href="/sports-ants/cases"
                    style={{
                      padding: '14px 24px',
                      background: '#F1F5F9',
                      color: '#1A1A2E',
                      fontSize: '15px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.lg,
                      textDecoration: 'none',
                    }}
                  >
                    查看案例
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '60px 24px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '28px',
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: '40px',
                textAlign: 'center',
              }}
            >
              核心功能特点
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {product.features.map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '24px',
                    background: '#FFFFFF',
                    borderRadius: BigAntsRadius.xl,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `${BigAntsColors.primary}15`,
                      color: BigAntsColors.primary,
                      fontSize: '18px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <p
                    style={{
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      color: '#333333',
                      lineHeight: 1.7,
                    }}
                  >
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Specs */}
        <section style={{ padding: '60px 24px', background: '#FFFFFF' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '28px',
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: '40px',
                textAlign: 'center',
              }}
            >
              产品规格参数
            </h2>
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: '#F8FAFC',
                borderRadius: BigAntsRadius.xl,
                overflow: 'hidden',
              }}
            >
              {Object.entries(product.specs).map(([key, value], idx) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    padding: '16px 24px',
                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                    borderBottom: idx < Object.entries(product.specs).length - 1 ? '1px solid #E2E8F0' : 'none',
                  }}
                >
                  <span style={{ flex: '0 0 150px', fontSize: '14px', color: '#666666' }}>{key}</span>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#1A1A2E' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cases */}
        <section style={{ padding: '60px 24px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '28px',
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: '40px',
                textAlign: 'center',
              }}
            >
              客户案例
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {product.cases.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '24px',
                    background: '#FFFFFF',
                    borderRadius: BigAntsRadius.xl,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '32px' }}>🏢</span>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A2E' }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: '#666666' }}>{c.location}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#333333', lineHeight: 1.7 }}>
                    {c.result}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '60px 24px', background: '#FFFFFF' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <ProductCTA productName={product.name} productCategory={product.categoryName} />
          </div>
        </section>

        <FloatingContact />
        <ExitIntentPopup delaySeconds={10} />
        <Footer />
      </div>
    </>
  );
}
