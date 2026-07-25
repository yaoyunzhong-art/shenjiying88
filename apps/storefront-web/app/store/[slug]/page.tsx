'use client';

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Button, Card, Badge, Tabs, Tag, Rating,
  Heading, Text, Paragraph, Space, FormField, Select,
} from '@m5/ui'

interface StoreData {
  name: string; address: string; rating: number; reviewCount: number
  hours: string; phone: string; description: string; tags: string[]
  images: string[]
}

interface ServiceItem {
  id: string; name: string; price: number; duration: string; category: string; rating: number
}

interface Review {
  id: string; userName: string; rating: number; content: string; date: string
}

const MOCK_STORE: StoreData = {
  name: '神机营 · 北京朝阳店',
  address: '朝阳区建国路88号 SOHO现代城B1',
  rating: 4.8, reviewCount: 2356,
  hours: '周一至周日 10:00 - 22:00', phone: '400-888-8888',
  images: [],
  description: '神机营体育北京旗舰店，3000㎡综合运动潮玩空间。',
  tags: ['数字运动', '电竞', '亲子', '团建', 'VR'],
}

const MOCK_SERVICES: ServiceItem[] = [
  { id: 'svc-001', name: '数字篮球挑战赛', price: 89, duration: '60分钟', category: 'sports', rating: 4.9 },
  { id: 'svc-002', name: 'VR沉浸式对战', price: 128, duration: '45分钟', category: 'vr', rating: 4.7 },
  { id: 'svc-003', name: '亲子趣味运动会', price: 199, duration: '90分钟', category: 'family', rating: 4.8 },
  { id: 'svc-004', name: '电竞对战区', price: 59, duration: '120分钟', category: 'esports', rating: 4.6 },
  { id: 'svc-005', name: '团建定制方案', price: 299, duration: '3小时', category: 'team', rating: 4.9 },
  { id: 'svc-006', name: '生日派对包场', price: 599, duration: '3小时', category: 'birthday', rating: 4.8 },
]

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', userName: '运动达人小王', rating: 5, content: '环境超棒，VR对战特别刺激', date: '2026-07-20' },
  { id: 'r2', userName: '亲子妈妈团', rating: 5, content: '孩子玩疯了，工作人员也很有耐心', date: '2026-07-19' },
  { id: 'r3', userName: '团建组织者', rating: 4, content: '团建方案很灵活，建议停车位再多点', date: '2026-07-18' },
]

const CATEGORIES = [
  { key: 'all', label: '全部' }, { key: 'sports', label: '运动竞技' }, { key: 'vr', label: 'VR/AR' },
  { key: 'esports', label: '电竞' }, { key: 'family', label: '亲子' }, { key: 'team', label: '团建' }, { key: 'birthday', label: '生日趴' },
]

function KpiBox({ value, label }: { value: string; label: string }) {
  return <div style={{ padding: 16, background: '#f8f8f8', borderRadius: 8, textAlign: 'center' }}>
    <Text weight="bold" color="primary">{value}</Text><br /><Text color="muted">{label}</Text>
  </div>
}

export default function StoreHomePage() {
  const params = useParams()
  const slug = (params?.slug as string) ?? 'beijing-chaoyang'
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t) }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Text color="muted">加载中…</Text></div>

  const filtered = activeCategory === 'all' ? MOCK_SERVICES : MOCK_SERVICES.filter(s => s.category === activeCategory)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 80px' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: '40px 24px', marginBottom: 24, color: '#fff' }}>
        <Heading level={1}>{MOCK_STORE.name}</Heading>
        <Space direction="horizontal" size="middle" style={{ marginTop: 8 }}>
          <Rating value={MOCK_STORE.rating} interactive={false} />
          <Text>({MOCK_STORE.reviewCount}条)</Text>
          <Badge variant="default">{MOCK_STORE.hours}</Badge>
        </Space>
        <Space direction="horizontal" size="small" style={{ marginTop: 8 }}>
          {MOCK_STORE.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
        </Space>
      </div>

      {/* CTA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <Button variant="primary" onClick={() => window.location.href = `/store/${slug}/book`}>📅 预约体验</Button>
        <Button variant="secondary" onClick={() => window.location.href = `/store/${slug}/packages`}>🎫 查看套餐</Button>
        <Button variant="ghost" onClick={() => window.open(`https://uri.amap.com/navigation?to=116.4074,39.9042`, '_blank')}>🗺️ 门店导航</Button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KpiBox value="1,200" label="日均客流 · 人次" />
        <KpiBox value="98%" label="好评率 · 满意" />
        <KpiBox value="12" label="热门项目 · 个" />
        <KpiBox value="15K" label="会员数 · 人" />
      </div>

      {/* Services */}
      <Heading level={2} style={{ marginBottom: 16 }}>服务项目</Heading>
      <Tabs activeKey={activeCategory} onChange={setActiveCategory} items={CATEGORIES.map(c => ({
        key: c.key, label: c.label,
        children: (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
            {filtered.map(s => (
              <Card key={s.id}>
                <div style={{ padding: 16, cursor: 'pointer' }} onClick={() => window.location.href = `/store/${slug}/services/${s.id}`}>
                  <Space direction="vertical" size="small">
                    <Heading level={3}>{s.name}</Heading>
                    <Space direction="horizontal" size="small">
                      <Rating value={s.rating} interactive={false} />
                      <Text color="muted">{s.duration}</Text>
                    </Space>
                    <Text weight="bold" color="primary">¥{s.price}</Text>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        ),
      }))} />

      {/* Activities */}
      <Heading level={2} style={{ marginTop: 32, marginBottom: 16 }}>近期活动</Heading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { title: '周末篮球擂台赛', date: '7/27 14:00' },
          { title: '亲子欢乐周末', date: '7/28 10:00' },
          { title: '企业团建开放日', date: '7/30' },
        ].map(a => (
          <Card key={a.title}>
            <div style={{ padding: 16 }}>
              <Heading level={4}>{a.title}</Heading>
              <Text color="muted">{a.date}</Text>
            </div>
          </Card>
        ))}
      </div>

      {/* Reviews */}
      <Heading level={2} style={{ marginTop: 32, marginBottom: 16 }}>客户评价</Heading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {MOCK_REVIEWS.map(r => (
          <Card key={r.id}>
            <div style={{ padding: 16 }}>
              <Space direction="vertical" size="small">
                <Space direction="horizontal" size="small">
                  <Text weight="bold">{r.userName}</Text>
                  <Rating value={r.rating} interactive={false} />
                </Space>
                <Paragraph>{r.content}</Paragraph>
                <Text color="muted">{r.date}</Text>
              </Space>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
