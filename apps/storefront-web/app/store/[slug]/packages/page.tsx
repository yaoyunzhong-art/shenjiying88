'use client';

/**
 * 套餐门票下单 — V23 Phase 1
 * 路由: /store/[slug]/packages
 * 角色: 🛒 C端消费者视角
 */

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  Card,
  Tag,
  Tabs,
  Typography,
  Space,
  Spinner,
  Result,
  useToast,
  ToastContainer,
  Badge,
} from '@m5/ui'

const { Heading, Text, Paragraph } = Typography

interface PackageItem {
  id: string
  name: string
  price: number
  originalPrice: number
  items: string[]
  description: string
  image: string
  category: 'solo' | 'family' | 'team' | 'limited'
  badge?: string
}

const MOCK_PACKAGES: PackageItem[] = [
  // 单人
  { id: 'pkg-s1', name: '单人畅玩票', price: 99, originalPrice: 129, items: ['数字篮球', 'VR对战', '电竞区'], description: '单人2小时畅玩，含3个项目', image: '', category: 'solo' },
  { id: 'pkg-s2', name: '单人尊享', price: 198, originalPrice: 259, items: ['全部项目', '1张盲盒券', '饮品1杯'], description: '单人全天畅玩，含盲盒抽奖', image: '', category: 'solo' },
  // 亲子
  { id: 'pkg-f1', name: '亲子欢乐套票', price: 199, originalPrice: 299, items: ['亲子运动会', 'VR体验', '手工DIY'], description: '1大1小，90分钟，含手工材料', image: '', category: 'family' },
  { id: 'pkg-f2', name: '亲子全家福', price: 388, originalPrice: 499, items: ['全部亲子项目', '生日派对折扣券', '成长纪念册'], description: '2大1小，3小时，含生日优惠', image: '', category: 'family' },
  // 团体
  { id: 'pkg-t1', name: '团建基础包', price: 1299, originalPrice: 1699, items: ['3个趣味项目', '2个对抗项目', '专属裁判', 'AI直播'], description: '10-20人，3小时团建方案', image: '', category: 'team' },
  { id: 'pkg-t2', name: '团建豪华包', price: 2999, originalPrice: 3699, items: ['5个趣味项目', '3个对抗项目', '专属裁判团', '团建纪念盲盒', 'AI直播'], description: '20-50人，4小时豪华团建', image: '', category: 'team' },
  // 限时
  { id: 'pkg-l1', name: '暑期狂欢特惠', price: 79, originalPrice: 159, items: ['指定3个项目', '饮品1杯'], description: '暑期限定，单人特惠票', image: '', category: 'limited', badge: '限时5折' },
  { id: 'pkg-l2', name: '深夜嗨玩票', price: 69, originalPrice: 99, items: ['电竞区', 'VR体验', '桌游'], description: '晚8点后入场，单人畅玩', image: '', category: 'limited', badge: '晚间特惠' },
]

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'solo', label: '单人票' },
  { key: 'family', label: '亲子票' },
  { key: 'team', label: '团体票' },
  { key: 'limited', label: '限时特惠' },
]

const CATEGORY_LABEL: Record<string, string> = {
  solo: '单人', family: '亲子', team: '团体', limited: '限时',
}

export default function PackagesPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug ?? 'beijing-chaoyang'

  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [buying, setBuying] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const { toast } = useToast()

  const filteredPackages = activeCategory === 'all'
    ? MOCK_PACKAGES
    : MOCK_PACKAGES.filter(p => p.category === activeCategory)

  const currentPkg = MOCK_PACKAGES.find(p => p.id === selectedPkg)

  const handleBuy = async () => {
    setBuying(true)
    await new Promise(r => setTimeout(r, 800))
    setBuying(false)
    setPurchased(true)
    toast({ variant: 'success', message: '购买成功！' })
  }

  if (purchased) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 40 }}>
        <Result
          status="success"
          title="购买成功！"
          description={`${currentPkg?.name} × ${quantity}`}
          extra={
            <Space direction="vertical" size="md" style={{ width: '100%' }}>
              <div style={{
                background: '#f0f0f0',
                padding: 24,
                borderRadius: 12,
                textAlign: 'center',
              }}>
                <Text size="large" weight="bold">🎫 到店核销二维码</Text>
                <div style={{
                  width: 200,
                  height: 200,
                  margin: '16px auto',
                  background: '#fff',
                  border: '2px dashed #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text color="gray">QR Code</Text>
                </div>
              </div>
              <Button variant="primary" size="large" block onClick={() => window.location.href = `/store/${slug}`}>
                返回门店首页
              </Button>
            </Space>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 80 }}>
      <ToastContainer />

      <Heading level={1}>套餐门票</Heading>
      <Paragraph>查看并购买适合您的套餐，到店出示核销码即可入场体验。</Paragraph>

      <Tabs
        items={CATEGORIES.map(c => ({
          key: c.key,
          label: c.label,
          children: (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
              marginTop: 20,
            }}>
              {filteredPackages.map(pkg => {
                const isSelected = selectedPkg === pkg.id
                const discount = Math.round((1 - pkg.price / pkg.originalPrice) * 100)

                return (
                  <Card
                    key={pkg.id}
                    hoverable
                    onClick={() => {
                      setSelectedPkg(pkg.id)
                      setQuantity(1)
                      setPurchased(false)
                    }}
                    style={{
                      border: isSelected ? '2px solid var(--primary)' : undefined,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: 20 }}>
                      {pkg.badge && (
                        <Badge variant="danger" style={{ position: 'absolute', top: 12, right: 12 }}>
                          {pkg.badge}
                        </Badge>
                      )}

                      <Space direction="vertical" size="sm">
                        <Tag>{CATEGORY_LABEL[pkg.category] ?? pkg.category}</Tag>
                        <Heading level={3}>{pkg.name}</Heading>
                        <Paragraph>{pkg.description}</Paragraph>

                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                          {pkg.items.map(item => (
                            <Tag key={item} variant="outline" size="small">{item}</Tag>
                          ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <Text size="large" weight="bold" color="primary">¥{pkg.price}</Text>
                          <Text color="gray" style={{ textDecoration: 'line-through' }}>¥{pkg.originalPrice}</Text>
                          {discount > 0 && (
                            <Badge variant="success">省{discount}%</Badge>
                          )}
                        </div>
                      </Space>
                    </div>
                  </Card>
                )
              })}
            </div>
          ),
        }))}
      />

      {selectedPkg && currentPkg && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #eee',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
        }}>
          <Space direction="horizontal" size="md" align="center">
            <Text weight="bold">{currentPkg.name}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                variant="tertiary"
                size="small"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </Button>
              <Text weight="bold">{quantity}</Text>
              <Button
                variant="tertiary"
                size="small"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </Space>
          <Button
            variant="primary"
            size="large"
            loading={buying}
            onClick={handleBuy}
          >
            立即购买 ¥{currentPkg.price * quantity}
          </Button>
        </div>
      )}
    </div>
  )
}
