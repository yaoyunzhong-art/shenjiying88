/**
 * 运动蚂蚁新闻详情页
 * BigAnts News Detail Page
 */

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SEOMeta from '../../components/seo/SEOMeta';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import FloatingContact from '../../components/FloatingContact';
import { BigAntsColors, BigAntsRadius, BigAntsSpacing, BigAntsFonts } from '../../lib/bigants-design';

// 模拟新闻数据（实际项目中应从API获取）
const NEWS_DETAILS: Record<string, {
  category: string;
  categoryLabel: string;
  title: string;
  date: string;
  source: string;
  author: string;
  image: string;
  content: string[];
  relatedNews: Array<{ id: string; title: string; date: string }>;
}> = {
  'news-001': {
    category: 'news',
    categoryLabel: '品牌动态',
    title: '运动蚂蚁与万达达成全国战略合作',
    date: '2024-11-28',
    source: '运动蚂蚁官方',
    author: '市场部',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop',
    content: [
      '2024年11月28日，运动蚂蚁与万达集团在北京签署全国战略合作协议，标志着双方合作进入全新阶段。根据协议，运动蚂蚁将在全国50余家万达广场部署数字运动场馆，打造新型消费体验空间。',
      '此次合作是运动蚂蚁继与华润万象城、龙湖天街等商业地产巨头达成合作后，再次牵手行业领军企业。万达集团作为全球领先的商业地产运营商，对合作伙伴的选择有着严格的标准。运动蚂蚁凭借其在数字运动领域的技术优势、运营经验和品牌影响力，成功获得万达集团的认可。',
      '"我们很高兴能与万达集团达成战略合作，"运动蚂蚁CEO表示，"数字运动作为一种新兴的消费业态，正在成为商业综合体吸引年轻客流、提升消费体验的重要手段。我们相信，通过与万达集团的深度合作，能够为消费者带来更多样化、更有趣的运动体验。"',
      '根据规划，首批合作门店将于2025年春节前在北京、上海、深圳等城市开业，届时消费者可以在万达广场体验到包括超级网球、模拟棒球、VR滑雪在内的60余款数字运动项目。',
    ],
    relatedNews: [
      { id: 'news-002', title: '运动蚂蚁荣获"年度最具创新力企业"称号', date: '2024-12-15' },
      { id: 'news-003', title: '运动蚂蚁发布2024年度旗舰产品', date: '2024-10-20' },
    ],
  },
  'news-002': {
    category: 'award',
    categoryLabel: '荣誉奖项',
    title: '运动蚂蚁荣获"年度最具创新力企业"称号',
    date: '2024-12-15',
    source: '第五届中国数字体育产业峰会',
    author: '组委会',
    image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1200&h=600&fit=crop',
    content: [
      '2024年12月15日，第五届中国数字体育产业峰会在北京国际会议中心隆重举行。运动蚂蚁受邀参会，并凭借其在数字运动领域的创新实践，荣获"年度最具创新力企业"称号。',
      '中国数字体育产业峰会是由中国体育用品业联合会主办的行业顶级盛会，汇聚了国内外数字体育领域的顶尖企业和专家。本届峰会以"科技赋能体育，创新引领未来"为主题，探讨数字体育产业的发展趋势和创新路径。',
      '经过专家评审团的严格评审，运动蚂蚁从数百家参评企业中脱颖而出，获此殊荣。评审团对运动蚂蚁在产品创新、技术研发、商业模式等方面的表现给予了高度评价。',
      '"这个奖项是对运动蚂蚁过去几年努力的肯定，"运动蚂蚁CTO表示，"我们将以此为动力，继续加大研发投入，推动数字体育产业的创新发展。"',
    ],
    relatedNews: [
      { id: 'news-001', title: '运动蚂蚁与万达达成全国战略合作', date: '2024-11-28' },
      { id: 'news-004', title: '数字体育产业迎来爆发式增长', date: '2024-09-15' },
    ],
  },
  'news-003': {
    category: 'news',
    categoryLabel: '品牌动态',
    title: '运动蚂蚁发布2024年度旗舰产品',
    date: '2024-10-20',
    source: '第84届中国教育装备展示会',
    author: '产品部',
    image: 'https://images.unsplash.com/photo-1637858868799-7f26a0640ebd?w=1200&h=600&fit=crop',
    content: [
      '2024年10月20日，运动蚂蚁在第84届中国教育装备展示会上发布了全新VR滑雪模拟器、智慧棒球等5款旗舰产品，向与会观众展示了数字运动领域的前沿技术和创新理念。',
      '本次发布的新品包括：全新VR滑雪模拟器，采用最新的6DoF追踪技术和自研运动算法，带来更真实的滑雪体验；智慧棒球系统，配备AI投球手和智能计分系统，可满足从初学者到专业选手的训练需求；以及三款面向儿童市场的寓教于乐类产品。',
      '"我们始终坚持以用户需求为导向的产品研发理念，"运动蚂蚁产品总监介绍，"这次发布的新品，不仅在技术上有所突破，更重要的是针对不同用户群体的使用场景进行了深度优化。"',
      '展会期间，运动蚂蚁展台吸引了大量观众排队体验，现场签单金额超过预期200%，充分展现了市场对运动蚂蚁产品的认可。',
    ],
    relatedNews: [
      { id: 'news-001', title: '运动蚂蚁与万达达成全国战略合作', date: '2024-11-28' },
      { id: 'news-005', title: '新华网专题报道：运动蚂蚁引领数字运动新潮流', date: '2024-08-22' },
    ],
  },
  'news-004': {
    category: 'industry',
    categoryLabel: '行业资讯',
    title: '数字体育产业迎来爆发式增长，市场规模突破千亿',
    date: '2024-09-15',
    source: '艾瑞咨询',
    author: '研究中心',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop',
    content: [
      '近日，艾瑞咨询发布《2024年中国数字体育产业发展报告》，数据显示我国数字体育产业已进入快速发展期，市场规模突破千亿元，预计到2025年将达到1500亿元。',
      '报告指出，随着技术的进步和消费升级，数字体育正成为体育产业的新增长点。特别是在商业综合体、旅游景区、社区等场景，数字运动设备的需求快速增长。',
      '数字体育产业的快速发展得益于几个关键因素：一是VR/AR、人工智能等技术的成熟，为数字运动提供了技术支撑；二是年轻消费群体对新鲜、互动、有趣的运动体验需求增加；三是政策和资本的双重推动。',
      '业内人士分析，数字体育产业将在未来5年保持高速增长态势，具有广阔的发展前景。',
    ],
    relatedNews: [
      { id: 'news-006', title: '政策利好！数字体育产业获国家重点支持', date: '2024-07-10' },
      { id: 'news-003', title: '运动蚂蚁发布2024年度旗舰产品', date: '2024-10-20' },
    ],
  },
  'news-005': {
    category: 'media',
    categoryLabel: '媒体报道',
    title: '新华网专题报道：运动蚂蚁引领数字运动新潮流',
    date: '2024-08-22',
    source: '新华网',
    author: '财经频道',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop',
    content: [
      '近日，新华网财经频道发表专题报道《数字运动：体育产业的新赛道》，深度剖析运动蚂蚁等行业领军企业在数字体育领域的创新实践，肯定其对行业发展的推动作用。',
      '报道指出，运动蚂蚁通过将传统运动与数字技术深度融合，创造出全新的运动体验方式。这种创新不仅满足了年轻消费者对个性化、互动化运动体验的需求，也为传统体育产业的转型升级提供了可借鉴的路径。',
      '报道还关注了运动蚂蚁的商业模式创新。运动蚂蚁采用"EPC+O"一站式服务模式，从项目规划、方案设计、设备供应到运营支持，为客户提供全流程服务，大大降低了项目风险和运营成本。',
      '文章最后指出，以运动蚂蚁为代表的数字体育企业正在引领一个新兴产业的发展，这不仅是一个商业机会，更是对传统体育消费方式的革新。',
    ],
    relatedNews: [
      { id: 'news-002', title: '运动蚂蚁荣获"年度最具创新力企业"称号', date: '2024-12-15' },
      { id: 'news-004', title: '数字体育产业迎来爆发式增长', date: '2024-09-15' },
    ],
  },
  'news-006': {
    category: 'industry',
    categoryLabel: '行业资讯',
    title: '政策利好！数字体育产业获国家重点支持',
    date: '2024-07-10',
    source: '国务院',
    author: '政策研究室',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop',
    content: [
      '国务院近日发布《体育产业发展"十四五"规划》，明确提出要推动体育产业数字化转型，支持数字体育产业创新发展。这为数字体育产业带来了重磅政策利好。',
      '规划提出，要加快数字技术在体育产业的应用，推动体育产品和服务数字化、智能化升级。重点支持虚拟现实、人工智能等新技术在体育领域的应用，培育壮大数字体育等新业态。',
      '此外，规划还鼓励建设一批数字体育产业示范基地，培育一批具有国际竞争力的数字体育企业。这为运动蚂蚁等行业领军企业提供了广阔的发展空间。',
      '业内人士认为，政策的出台将进一步加速数字体育产业的整合和发展，为具备技术优势和规模效应的企业带来更大的发展机遇。',
    ],
    relatedNews: [
      { id: 'news-004', title: '数字体育产业迎来爆发式增长', date: '2024-09-15' },
      { id: 'news-005', title: '新华网专题报道：运动蚂蚁引领数字运动新潮流', date: '2024-08-22' },
    ],
  },
};

export default function NewsDetailPage() {
  const params = useParams();
  const newsId = params.id as string;
  const news = NEWS_DETAILS[newsId];

  if (!news) {
    return (
      <>
        <SEOMeta title="新闻详情 - 运动蚂蚁" description="运动蚂蚁新闻资讯" />
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
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>文章不存在</h1>
          <Link
            href="/sports-ants/news"
            style={{
              color: BigAntsColors.primary,
              textDecoration: 'underline',
            }}
          >
            返回新闻列表
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOMeta
        title={`${news.title} - 运动蚂蚁`}
        description={news.content[0] || '运动蚂蚁新闻详情'}
        keywords={[news.categoryLabel, '运动蚂蚁', '数字运动']}
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
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#666666' }}>
              <Link href="/sports-ants" style={{ color: '#666666', textDecoration: 'none' }}>首页</Link>
              <span>/</span>
              <Link href="/sports-ants/news" style={{ color: '#666666', textDecoration: 'none' }}>新闻资讯</Link>
              <span>/</span>
              <span style={{ color: BigAntsColors.primary }}>{news.categoryLabel}</span>
            </div>
          </div>
        </div>

        {/* Article */}
        <article style={{ padding: '40px 24px 80px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Category & Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <span
                style={{
                  padding: '4px 12px',
                  background: `${BigAntsColors.primary}15`,
                  color: BigAntsColors.primary,
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '4px',
                }}
              >
                {news.categoryLabel}
              </span>
              <span style={{ fontSize: '14px', color: '#666666' }}>
                {news.date}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: '#1A1A2E',
                lineHeight: 1.3,
                marginBottom: '24px',
              }}
            >
              {news.title}
            </h1>

            {/* Meta */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                paddingBottom: '24px',
                borderBottom: '1px solid #E2E8F0',
                marginBottom: '32px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#666666' }}>
                来源：{news.source}
              </span>
              <span style={{ fontSize: '14px', color: '#666666' }}>
                作者：{news.author}
              </span>
            </div>

            {/* Featured Image */}
            <div
              style={{
                width: '100%',
                height: '400px',
                borderRadius: BigAntsRadius.lg,
                overflow: 'hidden',
                marginBottom: '40px',
              }}
            >
              <img
                src={news.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop'}
                alt={news.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            {/* Content */}
            <div
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '16px',
                lineHeight: 1.8,
                color: '#333333',
              }}
            >
              {news.content.map((paragraph, index) => (
                <p
                  key={index}
                  style={{
                    marginBottom: '24px',
                    textIndent: '2em',
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Share */}
            <div
              style={{
                marginTop: '48px',
                paddingTop: '32px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#666666' }}>分享到：</span>
              {['微信', '微博', '朋友圈'].map((platform) => (
                <button
                  key={platform}
                  style={{
                    padding: '8px 16px',
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#666666',
                    cursor: 'pointer',
                  }}
                >
                  {platform}
                </button>
              ))}
            </div>

            {/* Related News */}
            <div
              style={{
                marginTop: '48px',
                padding: '32px',
                background: '#F8FAFC',
                borderRadius: BigAntsRadius.lg,
              }}
            >
              <h3
                style={{
                  fontFamily: BigAntsFonts.display,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1A1A2E',
                  marginBottom: '20px',
                }}
              >
                相关阅读
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {news.relatedNews.map((item) => (
                  <Link
                    key={item.id}
                    href={`/sports-ants/news/${item.id}`}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1A1A2E',
                        marginBottom: '4px',
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999999' }}>{item.date}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Back Button */}
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Link
                href="/sports-ants/news"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 32px',
                  background: BigAntsColors.primary,
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: BigAntsRadius.full,
                  textDecoration: 'none',
                }}
              >
                ← 返回新闻列表
              </Link>
            </div>
          </div>
        </article>

        <FloatingContact />
        <Footer />
      </div>
    </>
  );
}
