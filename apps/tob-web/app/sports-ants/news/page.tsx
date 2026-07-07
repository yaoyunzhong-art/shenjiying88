/**
 * 运动蚂蚁新闻资讯中心
 * BigAnts News & Press Center
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import ConversionTracker from '../components/ConversionTracker';
import { conversionService } from '../lib/conversion-service';
import { BigAntsColors, BigAntsRadius, BigAntsShadows, BigAntsSpacing, BigAntsFonts, BigAntsTransitions } from '../lib/bigants-design';

// 新闻分类
const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'news', label: '品牌动态' },
  { id: 'industry', label: '行业资讯' },
  { id: 'media', label: '媒体报道' },
  { id: 'award', label: '荣誉奖项' },
];

// 新闻数据
const NEWS_DATA = [
  {
    id: 'news-001',
    category: 'news',
    categoryLabel: '品牌动态',
    title: '运动蚂蚁与万达达成全国战略合作',
    summary: '运动蚂蚁与万达集团签署全国战略合作协议，将在50+万达广场部署数字运动场馆，打造新型消费体验空间。',
    date: '2024-11-28',
    image: '/images/news/partnership.jpg',
    featured: true,
  },
  {
    id: 'news-002',
    category: 'award',
    categoryLabel: '荣誉奖项',
    title: '运动蚂蚁荣获"年度最具创新力企业"称号',
    summary: '在第五届中国数字体育产业峰会上，运动蚂蚁凭借其在数字运动领域的创新实践，荣获年度最具创新力企业称号。',
    date: '2024-12-15',
    image: '/images/news/award-ceremony.jpg',
    featured: true,
  },
  {
    id: 'news-003',
    category: 'news',
    categoryLabel: '品牌动态',
    title: '运动蚂蚁发布2024年度旗舰产品',
    summary: '运动蚂蚁在第84届中国教育装备展示会上发布了全新VR滑雪模拟器、智慧棒球等5款旗舰产品，引领行业创新。',
    date: '2024-10-20',
    image: '/images/news/product-launch.jpg',
    featured: false,
  },
  {
    id: 'news-004',
    category: 'industry',
    categoryLabel: '行业资讯',
    title: '数字体育产业迎来爆发式增长，市场规模突破千亿',
    summary: '随着技术的进步和消费升级，数字体育产业正迎来快速发展期。预计到2025年，市场规模将突破千亿元。',
    date: '2024-09-15',
    image: '/images/news/market-growth.jpg',
    featured: false,
  },
  {
    id: 'news-005',
    category: 'media',
    categoryLabel: '媒体报道',
    title: '新华网专题报道：运动蚂蚁引领数字运动新潮流',
    summary: '新华网财经频道深度报道运动蚂蚁在数字体育领域的创新实践，肯定其对行业发展的推动作用。',
    date: '2024-08-22',
    image: '/images/news/media-coverage.jpg',
    featured: false,
  },
  {
    id: 'news-006',
    category: 'industry',
    categoryLabel: '行业资讯',
    title: '政策利好！数字体育产业获国家重点支持',
    summary: '国务院发布《体育产业发展"十四五"规划》，明确提出支持数字体育产业创新发展，为行业带来新机遇。',
    date: '2024-07-10',
    image: '/images/news/policy-support.jpg',
    featured: false,
  },
  {
    id: 'news-007',
    category: 'news',
    categoryLabel: '品牌动态',
    title: '运动蚂蚁完成B轮融资，估值超20亿',
    summary: '运动蚂蚁宣布完成B轮融资，由知名投资机构领投，估值超过20亿元人民币，将用于技术研发和市场拓展。',
    date: '2024-06-18',
    image: '/images/news/funding-round.jpg',
    featured: false,
  },
  {
    id: 'news-008',
    category: 'award',
    categoryLabel: '荣誉奖项',
    title: '运动蚂蚁斩获"最佳数字体育解决方案"大奖',
    summary: '在2024亚洲体育科技展览会上，运动蚂蚁凭借其创新的数字运动解决方案，荣获最佳数字体育解决方案大奖。',
    date: '2024-05-25',
    image: '/images/news/award-ceremony.jpg',
    featured: false,
  },
  {
    id: 'news-009',
    category: 'news',
    categoryLabel: '品牌动态',
    title: '运动蚂蚁与华润万象城达成战略合作',
    summary: '运动蚂蚁与华润万象城签署战略合作协议，将在30+万象城部署数字运动体验区，打造智慧商业新标杆。',
    date: '2024-04-15',
    image: '/images/news/partnership.jpg',
    featured: false,
  },
  {
    id: 'news-010',
    category: 'industry',
    categoryLabel: '行业资讯',
    title: '数字运动馆成为商业综合体标配',
    summary: '随着消费升级，数字运动馆已成为商业综合体吸引年轻消费者的标配设施，客流量提升效果显著。',
    date: '2024-03-20',
    image: '/images/news/market-growth.jpg',
    featured: false,
  },
  {
    id: 'news-011',
    category: 'media',
    categoryLabel: '媒体报道',
    title: '央视财经聚焦运动蚂蚁：数字运动产业新风口',
    summary: '央视财经频道《创业英雄会》栏目专题报道运动蚂蚁创新模式，探讨数字运动产业发展趋势。',
    date: '2024-02-28',
    image: '/images/news/media-coverage.jpg',
    featured: false,
  },
  {
    id: 'news-012',
    category: 'news',
    categoryLabel: '品牌动态',
    title: '运动蚂蚁启动海外市场拓展计划',
    summary: '运动蚂蚁宣布启动全球化战略，将于年内进入东南亚、中东、欧洲等20+国家和地区市场。',
    date: '2024-01-15',
    image: '/images/news/funding-round.jpg',
    featured: false,
  },
];

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredNews = activeCategory === 'all'
    ? NEWS_DATA
    : NEWS_DATA.filter(news => news.category === activeCategory);

  const featuredNews = NEWS_DATA.filter(news => news.featured);

  // 追踪分类切换
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    conversionService.trackCTAClick('news', `category_${categoryId}`);
  };

  // 追踪新闻点击
  const handleNewsClick = (newsId: string) => {
    conversionService.trackCTAClick('news', `news_${newsId}`);
  };

  return (
    <>
      <SEOMeta
        title="新闻资讯 - 运动蚂蚁品牌动态与行业资讯"
        description="了解运动蚂蚁最新品牌动态、行业资讯、媒体报道和荣誉奖项。数字运动行业资讯一网打尽。"
        keywords={['运动蚂蚁', '新闻资讯', '品牌动态', '行业资讯', '媒体报道', '荣誉奖项', '数字运动']}
        type="website"
      />

      <ConversionTracker page="news" />

      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Header />

        {/* Hero Section */}
        <section
          style={{
            paddingTop: '100px',
            paddingBottom: '60px',
            background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontFamily: BigAntsFonts.display,
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '12px',
            }}
          >
            新闻资讯中心
          </h1>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            了解运动蚂蚁最新动态与行业资讯
          </p>
        </section>

        {/* Featured News */}
        {activeCategory === 'all' && (
          <section style={{ padding: '40px 24px', background: '#FFFFFF' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h2
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1A1A2E',
                  marginBottom: '24px',
                }}
              >
                热门资讯
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                  gap: '24px',
                }}
              >
                {featuredNews.map((news) => (
                  <Link
                    key={news.id}
                    href={`/sports-ants/news/${news.id}`}
                    style={{
                      position: 'relative',
                      borderRadius: BigAntsRadius.xl,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: BigAntsShadows.md,
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                    <div
                      style={{
                        height: '280px',
                        backgroundImage: `url(${news.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '24px',
                        background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: BigAntsColors.primary,
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: BigAntsRadius.sm,
                          marginBottom: '8px',
                        }}
                      >
                        {news.categoryLabel}
                      </span>
                      <h3
                        style={{
                          fontFamily: BigAntsFonts.chinese,
                          fontSize: '18px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          lineHeight: 1.4,
                        }}
                      >
                        {news.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: BigAntsFonts.chinese,
                          fontSize: '14px',
                          color: 'rgba(255, 255, 255, 0.8)',
                          marginTop: '8px',
                        }}
                      >
                        {news.date}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Category Tabs */}
        <section style={{ padding: '0 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '16px 0' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '8px 20px',
                    background: activeCategory === cat.id ? BigAntsColors.primary : 'transparent',
                    color: activeCategory === cat.id ? '#FFFFFF' : '#666666',
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: BigAntsRadius.full,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: `all ${BigAntsTransitions.fast}`,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* News List */}
        <section style={{ padding: '40px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '24px',
              }}
            >
              {filteredNews.map((news) => (
                <Link
                  key={news.id}
                  href={`/sports-ants/news/${news.id}`}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: BigAntsRadius.xl,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: BigAntsShadows.sm,
                    transition: `all ${BigAntsTransitions.normal}`,
                    textDecoration: 'none',
                    display: 'block',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = BigAntsShadows.lg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = BigAntsShadows.sm;
                  }}
                >
                  <div
                    style={{
                      height: '200px',
                      backgroundImage: `url(${news.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          background: `${BigAntsColors.primary}15`,
                          color: BigAntsColors.primary,
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: BigAntsRadius.sm,
                        }}
                      >
                        {news.categoryLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#999999',
                        }}
                      >
                        {news.date}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#1A1A2E',
                        lineHeight: 1.5,
                        marginBottom: '12px',
                      }}
                    >
                      {news.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '14px',
                        color: '#666666',
                        lineHeight: 1.6,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {news.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <FloatingContact />
        <Footer />
      </div>
    </>
  );
}
