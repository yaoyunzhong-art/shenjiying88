'use client';

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Button, Card, Tag, Tabs, Heading, Text, Paragraph,
  Space, Spinner, Result, useToast, ToastContainer, Badge,
} from '@m5/ui'

interface PackageItem {
  id: string; name: string; price: number; originalPrice: number
  items: string[]; description: string; category: 'solo' | 'family' | 'team' | 'limited'
  badge?: string
}

const MOCK_PACKAGES: PackageItem[] = [
  { id: 'pkg-s1', name: '单人畅玩票', price: 99, originalPrice: 129, items: ['数字篮球', 'VR对战', '电竞区'], description: '单人2小时畅玩', category: 'solo' },
  { id: 'pkg-s2', name: '单人尊享', price: 198, originalPrice: 259, items: ['全部项目', '1张盲盒券', '饮品1杯'], description: '单人全天畅玩', category: 'solo' },
  { id: 'pkg-f1', name: '亲子欢乐套票', price: 199, originalPrice: 299, items: ['亲子运动会', 'VR体验', '手工DIY'], description: '1大1小，90分钟', category: 'family' },
  { id: 'pkg-f2', name: '亲子全家福', price: 388, originalPrice: 499, items: ['全部亲子项目', '生日派对折扣券', '成长纪念册'], description: '2大1小，3小时', category: 'family' },
  { id: 'pkg-t1', name: '团建基础包', price: 1299, originalPrice: 1699, items: ['3个趣味项目', '2个对抗项目', '专属裁判', 'AI直播'], description: '10-20人，3小时', category: 'team' },
  { id: 'pkg-t2', name: '团建豪华包', price: 2999, originalPrice: 3699, items: ['5个趣味项目', '3个对抗项目', '专属裁判团', '团建纪念盲盒', 'AI直播'], description: '20-50人，4小时', category: 'team' },
  { id: 'pkg-l1', name: '暑期狂欢特惠', price: 79, originalPrice: 159, items: ['指定3个项目', '饮品1杯'], description: '暑期限定', category: 'limited', badge: '限时5折' },
  { id: 'pkg-l2', name: '深夜嗨玩票', price: 69, originalPrice: 99, items: ['电竞区', 'VR体验', '桌游'], description: '晚8点后入场', category: 'limited', badge: '晚间特惠' },
]

const CATEGORY_LABEL: Record<string, string> = { solo: '单人', family: '亲子', team: '团体', limited: '限时' }

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'solo', label: '单人票' },
  { key: 'family', label: '亲子票' },
  { key: 'team', label: '团体票' },
  { key: 'limited', label: '限时特惠' },
]

export default function PackagesPage() {
  const params = useParams()
  const slug = (params?.slug as string) ?? 'beijing-chaoyang'

  const [activeTab, setActiveTab] = useState('all')
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [buying, setBuying] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const { toast, toasts, dismiss } = useToast()

  const filtered = activeTab === 'all' ? MOCK_PACKAGES : MOCK_PACKAGES.filter(p => p.category === activeTab)
  const currentPkg = MOCK_PACKAGES.find(p => p.id === selectedPkg)

  const handleBuy = async () => {
    setBuying(true); await new Promise(r => setTimeout(r, 800))
    setBuying(false); setPurchased(true)
    toast('购买成功！', { variant: 'success' })
  }

  if (purchased) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 40 }}>
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        <Result status="success" title="购买成功！" subTitle={`${currentPkg?.name} × ${quantity}`}
          extra={<Space direction="vertical" size="middle">
            <div style={{ background: '#f0f0f0', padding: 24, borderRadius: 12, textAlign: 'center' }}>
              <Text weight="bold">🎫 到店核销二维码</Text>
              <div style={{ width: 200, height: 200, margin: '16px auto', background: '#fff', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text color="muted">QR Code</Text>
              </div>
            </div>
            <Button variant="primary" onClick={() => window.location.href = `/store/${slug}`}>返回门店首页</Button>
          </Space>} />
      </div>
    )
  }

  const tabItems = TABS.map(tab => ({
    key: tab.key, label: tab.label,
    children: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginTop: 20 }}>
        {filtered.map(pkg => {
          const isSel = selectedPkg === pkg.id
          const discount = Math.round((1 - pkg.price / pkg.originalPrice) * 100)
          return (
            <div key={pkg.id} onClick={() => { setSelectedPkg(pkg.id); setQuantity(1); setPurchased(false); }} style={{ cursor: 'pointer' }}><Card
              style={{ border: isSel ? '2px solid #1677ff' : undefined, position: 'relative', overflow: 'hidden' }}>
              <div style={{ padding: 20 }}>
                {pkg.badge && <Badge variant="danger" style={{ position: 'absolute', top: 12, right: 12 }}>{pkg.badge}</Badge>}
                <Space direction="vertical" >
                  <Tag>{CATEGORY_LABEL[pkg.category] ?? pkg.category}</Tag>
                  <Heading level={3}>{pkg.name}</Heading>
                  <Paragraph>{pkg.description}</Paragraph>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {pkg.items.map(item => <Tag key={item} variant="default">{item}</Tag>)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <Text weight="bold" color="primary">¥{pkg.price}</Text>
                    <Text color="muted" style={{ textDecoration: 'line-through' }}>¥{pkg.originalPrice}</Text>
                    {discount > 0 && <Badge variant="success">省{discount}%</Badge>}
                  </div>
                </Space>
              </div>
            </Card>
            </div>
          )
        })}
      </div>
    ),
  }))

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 80 }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <Heading level={1}>套餐门票</Heading>
      <Paragraph>查看并购买适合您的套餐，到店出示核销码即可入场体验。</Paragraph>
      <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />

      {selectedPkg && currentPkg && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #eee', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
          <Space direction="horizontal"  align="center">
            <Text weight="bold">{currentPkg.name}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button variant="ghost" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</Button>
              <Text weight="bold">{quantity}</Text>
              <Button variant="ghost" onClick={() => setQuantity(quantity + 1)}>+</Button>
            </div>
          </Space>
          <Button variant="primary" loading={buying} onClick={handleBuy}>立即购买 ¥{currentPkg.price * quantity}</Button>
        </div>
      )}
    </div>
  )
}
