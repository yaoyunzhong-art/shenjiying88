/**
 * 运动蚂蚁帮助中心页面
 * BigAnts Help Center
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

// 常见问题分类
const FAQ_CATEGORIES = [
  {
    id: 'product',
    title: '产品使用',
    icon: '🎮',
    questions: [
      {
        q: '设备开机后显示黑屏怎么办？',
        a: '请检查以下步骤：1. 确认电源线连接正常；2. 检查显示器信号线是否插紧；3. 长按电源键10秒重启设备；4. 如仍未解决，请联系售后客服。',
      },
      {
        q: '如何进行设备日常维护？',
        a: '日常维护包括：1. 每天使用软布擦拭设备外壳；2. 每周清理一次传感器镜头；3. 每月检查各连接线是否松动；4. 定期更新系统软件以获取最新功能。',
      },
      {
        q: '设备出现故障代码如何处理？',
        a: '不同故障代码代表不同问题：E001表示传感器异常，E002表示网络连接失败，E003表示存储满。请记录故障代码并联系技术支持，我们将提供详细解决方案。',
      },
      {
        q: '如何切换不同的运动项目？',
        a: '在主界面点击"切换项目"按钮，选择您想体验的运动项目即可。支持的项目包括：超级网球、模拟棒球、VR滑雪、枪王之王等60+款运动项目。',
      },
    ],
  },
  {
    id: 'business',
    title: '商务合作',
    icon: '🤝',
    questions: [
      {
        q: '加盟运动蚂蚁需要哪些条件？',
        a: '加盟条件包括：1. 具有独立法人资格的企业或个人；2. 具备合适的经营场地（商业综合体、景区、社区等）；3. 有一定的资金实力；4. 认同运动蚂蚁品牌理念。',
      },
      {
        q: '设备采购后多久能投入使用？',
        a: '标准流程：设备发货后3-5个工作日送达，专业工程师上门安装调试1-2天，全程培训1天。通常情况下，设备到货后5-7个工作日即可正式运营。',
      },
      {
        q: '提供哪些售后服务支持？',
        a: '我们提供全方位的售后服务：1. 2年整机质保；2. 7×24小时远程技术支持；3. 每年2次免费上门保养；4. 备件库覆盖全国主要城市，48小时响应。',
      },
      {
        q: '如何申请成为区域代理商？',
        a: '请拨打400-888-8888联系商务团队，或通过官网提交合作意向表。我们的商务经理将在1个工作日内与您联系，了解您的资源和意向后提供定制化合作方案。',
      },
    ],
  },
  {
    id: 'technical',
    title: '技术运维',
    icon: '⚙️',
    questions: [
      {
        q: '设备需要连接网络吗？',
        a: '是的，设备需要连接网络以实现：在线排名、积分同步、软件更新、远程诊断等功能。建议使用有线网络以保证稳定性，最低带宽要求为10Mbps。',
      },
      {
        q: '如何进行系统软件更新？',
        a: '系统会在空闲时段自动检测并下载更新。您也可以手动检查更新：进入设置菜单 → 系统信息 → 检查更新。更新过程中请勿关机，以免造成系统损坏。',
      },
      {
        q: '数据存储容量有多大？',
        a: '设备内置500GB SSD固态硬盘，可存储约10万条运动记录。如需扩展存储，可外接USB存储设备或开通云端存储服务（需单独订阅）。',
      },
      {
        q: '支持哪些支付方式？',
        a: '设备支持微信支付、支付宝、会员卡、投币等多种支付方式。如需开通特定支付接口，请联系运维团队进行配置。',
      },
    ],
  },
  {
    id: 'account',
    title: '账户管理',
    icon: '👤',
    questions: [
      {
        q: '如何注册企业账户？',
        a: '访问运动蚂蚁官网，点击右上角"注册"，填写公司信息、联系人、手机号，设置密码后完成注册。注册成功后可享受更多企业用户专属功能和服务。',
      },
      {
        q: '忘记登录密码怎么办？',
        a: '在登录页面点击"忘记密码"，输入注册手机号，接收验证码后即可重置密码。如手机号已停用，请联系客服人工验证身份后协助找回。',
      },
      {
        q: '如何修改账户信息？',
        a: '登录后进入"控制台 → 账户设置"，可以修改公司信息、联系人、密码等。如需修改手机号，请联系客服协助完成。',
      },
      {
        q: '多门店如何统一管理？',
        a: '企业版用户可在控制台使用"多门店管理"功能，统一管理所有门店的设备、会员、财务数据。支持设置子账户分配不同门店权限。',
      },
    ],
  },
];

// 操作指南
const GUIDES = [
  {
    title: '新机安装指南',
    description: '从开箱到运营的完整安装流程',
    icon: '📦',
    href: '#installation',
    duration: '15分钟',
  },
  {
    title: '日常使用教程',
    description: '设备开关机、日常运营要点',
    icon: '▶️',
    href: '#daily-use',
    duration: '10分钟',
  },
  {
    title: '故障排查手册',
    description: '常见问题与自主解决方案',
    icon: '🔧',
    href: '#troubleshooting',
    duration: '20分钟',
  },
  {
    title: '营销活动配置',
    description: '如何设置优惠活动吸引用户',
    icon: '📢',
    href: '#marketing',
    duration: '10分钟',
  },
  {
    title: '数据报表解读',
    description: '运营数据的分析与应用',
    icon: '📊',
    href: '#analytics',
    duration: '15分钟',
  },
  {
    title: '会员系统使用',
    description: '会员开通、套餐设置、积分管理',
    icon: '💳',
    href: '#membership',
    duration: '12分钟',
  },
];

// 视频教程
const VIDEO_TUTORIALS = [
  {
    title: '超级网球 - 快速上手',
    thumbnail: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=225&fit=crop',
    duration: '5:32',
    views: '12.5万',
  },
  {
    title: 'VR滑雪 - 全沉浸体验',
    thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=225&fit=crop',
    duration: '8:15',
    views: '8.3万',
  },
  {
    title: '设备日常维护保养',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=225&fit=crop',
    duration: '6:48',
    views: '5.7万',
  },
];

export default function HelpPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('product');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // 追踪分类展开
  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    conversionService.trackCTAClick('help', `category_${categoryId}`);
  };

  // 追踪问题展开
  const handleQuestionClick = (questionKey: string) => {
    const newExpanded = expandedQuestion === questionKey ? null : questionKey;
    setExpandedQuestion(newExpanded);
    if (newExpanded) {
      conversionService.trackCTAClick('help', `question_${questionKey}`);
    }
  };

  // 追踪联系方式点击
  const handleContactClick = (type: string) => {
    conversionService.trackCTAClick('help', `contact_${type}`);
  };

  return (
    <>
      <SEOMeta
        title="帮助中心 - 运动蚂蚁"
        description="运动蚂蚁帮助中心，提供产品使用指南、常见问题解答、操作视频教程等服务支持。"
        keywords={['帮助中心', '常见问题', 'FAQ', '用户指南', '操作教程', '故障排查']}
        type="website"
      />

      <ConversionTracker page="help" />

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
            帮助中心
          </h1>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '24px',
            }}
          >
            遇到问题？这里有您需要的答案
          </p>

          {/* Search */}
          <div
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              padding: '0 24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                background: '#FFFFFF',
                borderRadius: BigAntsRadius.full,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              }}
            >
              <span style={{ fontSize: '20px', color: '#999999' }}>🔍</span>
              <input
                type="text"
                placeholder="搜索您遇到的问题..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '15px',
                }}
              />
              <button
                style={{
                  padding: '8px 20px',
                  background: BigAntsColors.primary,
                  color: '#FFFFFF',
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: BigAntsRadius.full,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                搜索
              </button>
            </div>
          </div>
        </section>

        {/* Quick Access */}
        <section style={{ padding: '40px 24px', background: '#FFFFFF' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '20px',
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: '24px',
              }}
            >
              快速入口
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {GUIDES.map((guide) => (
                <a
                  key={guide.title}
                  href={guide.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    background: '#F8FAFC',
                    borderRadius: BigAntsRadius.lg,
                    textDecoration: 'none',
                    transition: `all ${BigAntsTransitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${BigAntsColors.primary}10`;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={{ fontSize: '32px' }}>{guide.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#1A1A2E',
                        marginBottom: '4px',
                      }}
                    >
                      {guide.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '13px',
                        color: '#666666',
                        marginBottom: '4px',
                      }}
                    >
                      {guide.description}
                    </p>
                    <span
                      style={{
                        fontSize: '12px',
                        color: BigAntsColors.primary,
                        fontWeight: 600,
                      }}
                    >
                      ⏱ {guide.duration}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Video Tutorials */}
        <section style={{ padding: '40px 24px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1A1A2E',
                }}
              >
                视频教程
              </h2>
              <Link
                href="/sports-ants/videos"
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  color: BigAntsColors.primary,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                查看全部 →
              </Link>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {VIDEO_TUTORIALS.map((video, index) => (
                <div
                  key={index}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: BigAntsRadius.xl,
                    overflow: 'hidden',
                    boxShadow: BigAntsShadows.sm,
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      height: '180px',
                      backgroundImage: `url(${video.thumbnail})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        padding: '4px 8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: BigAntsRadius.sm,
                      }}
                    >
                      {video.duration}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        <span style={{ fontSize: '24px', color: BigAntsColors.primary, marginLeft: '4px' }}>▶</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#1A1A2E',
                        marginBottom: '8px',
                      }}
                    >
                      {video.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#999999',
                      }}
                    >
                      👁 {video.views}播放
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '60px 24px', background: '#FFFFFF' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '24px',
                fontWeight: 700,
                color: '#1A1A2E',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              常见问题
            </h2>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                color: '#666666',
                textAlign: 'center',
                marginBottom: '40px',
              }}
            >
              点击问题查看详细解答
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {FAQ_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  style={{
                    background: '#F8FAFC',
                    borderRadius: BigAntsRadius.xl,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '20px 24px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>{category.icon}</span>
                    <span
                      style={{
                        flex: 1,
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#1A1A2E',
                      }}
                    >
                      {category.title}
                    </span>
                    <span
                      style={{
                        fontSize: '20px',
                        color: '#999999',
                        transition: `transform ${BigAntsTransitions.fast}`,
                        transform: expandedCategory === category.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {expandedCategory === category.id && (
                    <div
                      style={{
                        padding: '0 24px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      {category.questions.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            background: '#FFFFFF',
                            borderRadius: BigAntsRadius.lg,
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            onClick={() => setExpandedQuestion(expandedQuestion === `${category.id}-${index}` ? null : `${category.id}-${index}`)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '16px 20px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '18px',
                                color: BigAntsColors.primary,
                              }}
                            >
                              Q
                            </span>
                            <span
                              style={{
                                flex: 1,
                                fontFamily: BigAntsFonts.chinese,
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#1A1A2E',
                              }}
                            >
                              {item.q}
                            </span>
                            <span
                              style={{
                                fontSize: '14px',
                                color: '#999999',
                              }}
                            >
                              {expandedQuestion === `${category.id}-${index}` ? '−' : '+'}
                            </span>
                          </button>
                          {expandedQuestion === `${category.id}-${index}` && (
                            <div
                              style={{
                                padding: '0 20px 16px 50px',
                                fontFamily: BigAntsFonts.chinese,
                                fontSize: '14px',
                                color: '#666666',
                                lineHeight: 1.7,
                              }}
                            >
                              {item.a}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section
          style={{
            padding: '60px 24px',
            background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '24px',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '12px',
              }}
            >
              没有找到答案？
            </h2>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '15px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '24px',
              }}
            >
              我们的客服团队随时为您提供帮助
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link
                href="/sports-ants/contact"
                style={{
                  padding: '14px 32px',
                  background: '#FFFFFF',
                  color: BigAntsColors.primary,
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '15px',
                  fontWeight: 700,
                  borderRadius: BigAntsRadius.full,
                  textDecoration: 'none',
                }}
              >
                在线咨询
              </Link>
              <a
                href="tel:400-888-8888"
                style={{
                  padding: '14px 32px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: BigAntsRadius.full,
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                📞 400-888-8888
              </a>
            </div>
          </div>
        </section>

        <FloatingContact />
        <Footer />
      </div>
    </>
  );
}
