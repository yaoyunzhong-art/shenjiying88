'use client';

/**
 * 在线预约系统 — V23 Phase 1
 * 路由: /store/[slug]/book
 * 角色: 🛒 C端消费者视角
 * 3步完成: 选项目 → 选时段 → 确认支付
 */

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  Card,
  Steps,
  Stepper,
  Select,
  FormField,
  Input,
  SubmitButton,
  Rating,
  Typography,
  Space,
  ToastContainer,
  useToast,
  Result,
} from '@m5/ui'

const { Heading, Text } = Typography

interface ServiceOption { id: string; name: string; price: number; duration: string }
interface TimeSlot { time: string; available: boolean }

const MOCK_SERVICES: ServiceOption[] = [
  { id: 'svc-001', name: '数字篮球挑战赛', price: 89, duration: '60分钟' },
  { id: 'svc-002', name: 'VR沉浸式对战', price: 128, duration: '45分钟' },
  { id: 'svc-003', name: '亲子趣味运动会', price: 199, duration: '90分钟' },
  { id: 'svc-004', name: '电竞对战区', price: 59, duration: '120分钟' },
  { id: 'svc-005', name: '团建定制方案', price: 299, duration: '3小时' },
  { id: 'svc-006', name: '生日派对包场', price: 599, duration: '3小时' },
]

export default function BookPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug ?? 'beijing-chaoyang'
  const { toast } = useToast()

  const [step, setStep] = useState(0)
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [bookingResult, setBookingResult] = useState<{ id: string } | null>(null)

  // ====== Slot calculation ======
  const today = new Date().toISOString().split('T')[0]
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const slots: TimeSlot[] = Array.from({ length: 26 }, (_, i) => {
    const hour = 9 + Math.floor(i / 2)
    const min = i % 2 === 0 ? '00' : '30'
    return {
      time: `${String(hour).padStart(2, '0')}:${min}`,
      available: Math.random() > 0.35, // random ~65% available
    }
  })

  const handleSubmit = useCallback(async () => {
    if (!customerName || !customerPhone) {
      toast({ variant: 'error', message: '请填写姓名和手机号' })
      return
    }
    setBookingResult({ id: 'BK' + Date.now().toString(36).toUpperCase() })
    toast({ variant: 'success', message: '预约成功！' })
  }, [customerName, customerPhone, toast])

  if (bookingResult) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 40 }}>
        <Result
          status="success"
          title="预约成功！"
          description={`预约编号: ${bookingResult.id}`}
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
                <Text size="small" color="gray">到店时出示此码，门闸扫码入场</Text>
              </div>
              <Button
                variant="primary"
                size="large"
                block
                onClick={() => window.location.href = `/store/${slug}`}
              >
                返回门店首页
              </Button>
            </Space>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>
      <ToastContainer />

      <Stepper
        steps={[
          { label: '选择项目', description: selectedService ? MOCK_SERVICES.find(s => s.id === selectedService)?.name : '选择您想体验的服务' },
          { label: '选择时段', description: selectedSlot ? `${selectedDate} ${selectedSlot}` : '选择日期和时段' },
          { label: '确认预约', description: '填写信息并确认' },
        ]}
        activeStep={step}
        onStepClick={(i) => { if (i < step) setStep(i) }}
      />

      <div style={{ padding: '24px 0' }}>
        {/* ====== Step 0: 选项目 ====== */}
        {step === 0 && (
          <>
            <Select
              label="选择服务项目"
              options={MOCK_SERVICES.map(s => ({
                value: s.id,
                label: `${s.name} · ¥${s.price} · ${s.duration}`,
              }))}
              value={selectedService}
              onChange={(e: any) => setSelectedService(e.target?.value ?? (typeof e === 'string' ? e : ''))}
              placeholder="请选择您想体验的服务"
            />
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Button
                variant="primary"
                size="large"
                disabled={!selectedService}
                onClick={() => setStep(1)}
              >
                下一步：选择时段 →
              </Button>
            </div>
          </>
        )}

        {/* ====== Step 1: 选时段 ====== */}
        {step === 1 && (
          <>
            <FormField label="选择日期">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {dates.map((date, i) => (
                  <Button
                    key={date}
                    variant={selectedDate === date ? 'primary' : 'tertiary'}
                    size="small"
                    onClick={() => setSelectedDate(date)}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12 }}>
                        {['日', '一', '二', '三', '四', '五', '六'][new Date(date).getDay()]}
                      </div>
                      <div style={{ fontWeight: 'bold' }}>{date.slice(5)}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </FormField>

            {selectedDate && (
              <FormField label="选择时段" style={{ marginTop: 16 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  maxHeight: 400,
                  overflowY: 'auto',
                }}>
                  {slots.map(slot => (
                    <Button
                      key={slot.time}
                      variant={selectedSlot === slot.time ? 'primary' : slot.available ? 'tertiary' : 'tertiary'}
                      size="small"
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedSlot(slot.time)}
                      style={{ opacity: slot.available ? 1 : 0.4 }}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </FormField>
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="tertiary" onClick={() => setStep(0)}>← 返回选项目</Button>
              <Button
                variant="primary"
                size="large"
                disabled={!selectedSlot}
                onClick={() => setStep(2)}
              >
                下一步：确认预约 →
              </Button>
            </div>
          </>
        )}

        {/* ====== Step 2: 确认 ====== */}
        {step === 2 && (
          <Card>
            <div style={{ padding: 24 }}>
              <Heading level={3}>确认预约信息</Heading>

              <div style={{ background: '#f8f8f8', borderRadius: 8, padding: 16, marginTop: 16 }}>
                <Space direction="vertical" size="sm">
                  <Text>🏬 {slug === 'beijing-chaoyang' ? '神机营 · 北京朝阳店' : slug}</Text>
                  <Text>🎯 {MOCK_SERVICES.find(s => s.id === selectedService)?.name}</Text>
                  <Text>📅 {selectedDate} {selectedSlot}</Text>
                  <Text weight="bold" size="large" color="primary">
                    ¥{MOCK_SERVICES.find(s => s.id === selectedService)?.price ?? 0}
                  </Text>
                </Space>
              </div>

              <div style={{ marginTop: 24 }}>
                <Input
                  label="姓名"
                  placeholder="请输入您的姓名"
                  value={customerName}
                  onChange={(e: any) => setCustomerName(e.target?.value ?? '')}
                />
                <Input
                  label="手机号"
                  placeholder="请输入手机号（用于到店提醒）"
                  value={customerPhone}
                  onChange={(e: any) => setCustomerPhone(e.target?.value ?? '')}
                  style={{ marginTop: 16 }}
                />
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="tertiary" onClick={() => setStep(1)}>← 返回选时段</Button>
                <SubmitButton
                  variant="primary"
                  size="large"
                  loading={false}
                  onClick={handleSubmit}
                >
                  确认预约 · ¥{MOCK_SERVICES.find(s => s.id === selectedService)?.price ?? 0}
                </SubmitButton>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
