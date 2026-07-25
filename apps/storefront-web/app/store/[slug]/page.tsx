'use client';

/**
 * 门店首页 — V23 Phase 1
 * 路由: /store/[slug]
 * 角色: 🛒 C端消费者视角
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  Card,
  StatCard,
  Badge,
  Tabs,
  Tag,
  Carousel,
  Rating,
  ImagePreview,
  Typography,
  Space,
  LoadingSkeleton,
  EmptyState,
  SectionHeader,
} from '@m5/ui'

const { Heading, Text, Paragraph } = Typography

interface StoreData {
  name: string
  address: string
  rating: number
  reviewCount: number
  hours: string
  phone: string
  images: string[]
  description: string
  tags: string[]
}

interface ServiceItem {
  id: string
  name: string
  price: number
  duration: string
  image: string
  category: string
  rating: number
}

interface Activity {
  id: string
  title: string
  type: 'event' | 'tournament' | 'team' | 'birthday'
  date: string
  status: 'upcoming' | 'ongoing'
}

interface Review {
  id: string
  userName: string
  rating: number
  content: string
  images: string[]
  date: string
}

const MOCK_STORE: StoreData = {
  name: '神机营 · 北京朝阳店',
  address: '朝阳区建国路88号 SOHO现代城B1',
  rating: 4.8,
  reviewCount: 2356,
  hours: '周一至周日 10:00 - 22:00',
  phone: '400-888-8888',
  images: [
    '/store-default-1.jpg',
    '/store-default-2.jpg',
    '/store-default-3.jpg',
  ],
  description: '神机营体育北京旗舰店，3000㎡综合运动潮玩空间，涵盖数字运动、电竞、VR/AR、亲子互动、团建赛事等多元体验。',
  tags: ['数字运动', '电竞', '亲子', '团建', 'VR'],
}

const MOCK_SERVICES: ServiceItem[] = [
  { id: 'svc-001', name: '数字篮球挑战赛', price: 89, duration: '60分钟', image: '', category: 'sports', rating: 4.9 },
  { id: 'svc-002', name: 'VR沉浸式对战', price: 128, duration: '45分钟', image: '', category: 'vr', rating: 4.7 },
  { id: 'svc-003', name: '亲子趣味运动会', price: 199, duration: '90分钟', image: '', category: 'family', rating: 4.8 },
  { id: 'svc-004', name: '电竞对战区', price: 59, duration: '120分钟', image: '', category: 'esports', rating: 4.6 },
  { id: 'svc-005', name: '团建定制方案', price: 299, duration: '3小时', image: '', category: 'team', rating: 4.9 },
  { id: 'svc-006', name: '生日派对包场', price: 599, duration: '3小时', image: '', category: 'birthday', rating: 4.8 },
]

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', userName: '运动达人小王', rating: 5, content: '环境超棒，教练很专业！VR对战特别刺激，下次带朋友一起来。', images: [], date: '2026-07-20' },
  { id: 'r2', userName: '亲子妈妈团', rating: 5, content: '孩子玩疯了，亲子运动会设计得很用心，工作人员也很有耐心。', images: [], date: '2026-07-19' },
  { id: 'r3', userName: '团建组织者', rating: 4, content: '团建方案很灵活，定制化程度高。唯一建议是停车位再多点就好了。', images: [], date: '2026-07-18' },
]

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'sports', label: '运动竞技' },
  { key: 'vr', label: 'VR/AR' },
  { key: 'esports', label: '电竞' },
  { key: 'family', label: '亲子' },
  { key: 'team', label: '团建' },
  { key: 'birthday', label: '生日趴' },
]

export default function StoreHomePage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug ?? 'beijing-chaoyang'
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingSkeleton />

  const filteredServices = activeCategory === 'all'
    ? MOCK_SERVICES
    : MOCK_SERVICES.filter(s => s.category === activeCategory)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 80 }}>
      {/* ====== 英雄区 ====== */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <ImagePreview
          images={MOCK_STORE.images.map((url, i) => ({
            src: url,
            alt: `${MOCK_STORE.name}-${i + 1}`,
            width: 1200,
            height: 400,
          }))}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '32px 24px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
        }}>
          <Heading level={1} color="white">{MOCK_STORE.name}</Heading>
          <Space direction="row" size="md" style={{ marginTop: 8 }}>
            <Rating value={MOCK_STORE.rating} readOnly />
            <Text color="white">({MOCK_STORE.reviewCount}条评价)</Text>
            <Badge variant="outline">{MOCK_STORE.hours}</Badge>
          </Space>
          <Space direction="row" size="sm" style={{ marginTop: 8 }}>
            {MOCK_STORE.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        </div>
      </div>

      {/* ====== 快捷操作栏 ====== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 32,
      }}>
        <Button
          size="large"
          variant="primary"
          onClick={() => window.location.href = `/store/${slug}/book`}
        >
          📅 预约体验
        </Button>
        <Button
          size="large"
          variant="secondary"
          onClick={() => window.location.href = `/store/${slug}/packages`}
        >
          🎫 查看套餐
        </Button>
        <Button
          size="large"
          variant="tertiary"
          onClick={() => window.open(`https://uri.amap.com/navigation?to=116.4074,39.9042`, '_blank')}
        >
          🗺️ 门店导航
        </Button>
      </div>

      {/* ====== KPI 条 ====== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 32,
      }}>
        <StatCard title="日均客流" value="1,200" subtitle="人次" />
        <StatCard title="好评率" value="98%" subtitle="满意" />
        <StatCard title="热门项目" value="12" subtitle="个" />
        <StatCard title="会员数" value="15K" subtitle="人" />
      </div>

      {/* ====== 服务项目 ====== */}
      <SectionHeader title="服务项目" />
      <Tabs
        items={CATEGORIES.map(c => ({
          key: c.key,
          label: c.label,
          children: (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
              marginTop: 16,
            }}>
              {filteredServices.map(service => (
                <Card
                  key={service.id}
                  hoverable
                  onClick={() => window.location.href = `/store/${slug}/services/${service.id}`}
                >
                  <div style={{ padding: 16 }}>
                    <Space direction="vertical" size="sm">
                      <Heading level={3}>{service.name}</Heading>
                      <Space direction="row" size="sm">
                        <Rating value={service.rating} readOnly size="small" />
                        <Text size="small" color="gray">{service.duration}</Text>
                      </Space>
                      <Text weight="bold" size="large" color="primary">
                        ¥{service.price}
                      </Text>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          ),
        }))}
      />

      {/* ====== 活动日历 ====== */}
      <SectionHeader title="近期活动" style={{ marginTop: 32 }} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {[
          { title: '周末篮球擂台赛', type: 'tournament', date: '7/27 14:00', status: 'upcoming' },
          { title: '亲子欢乐周末', type: 'event', date: '7/28 10:00', status: 'upcoming' },
          { title: '企业团建开放日', type: 'team', date: '7/30', status: 'ongoing' },
        ].map(activity => (
          <Card key={activity.title}>
            <div style={{ padding: 16 }}>
              <Badge variant={activity.status === 'ongoing' ? 'success' : 'info'}>
                {activity.status === 'ongoing' ? '进行中' : '即将开始'}
              </Badge>
              <Heading level={4} style={{ marginTop: 8 }}>{activity.title}</Heading>
              <Text size="small" color="gray">{activity.date}</Text>
            </div>
          </Card>
        ))}
      </div>

      {/* ====== 评价墙 ====== */}
      <SectionHeader title="客户评价" style={{ marginTop: 32 }} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {MOCK_REVIEWS.map(review => (
          <Card key={review.id}>
            <div style={{ padding: 16 }}>
              <Space direction="vertical" size="sm">
                <Space direction="row" size="sm">
                  <Text weight="bold">{review.userName}</Text>
                  <Rating value={review.rating} readOnly size="small" />
                </Space>
                <Paragraph>{review.content}</Paragraph>
                <Text size="small" color="gray">{review.date}</Text>
              </Space>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
