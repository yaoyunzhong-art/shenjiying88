'use client';

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  Card,
  Stepper,
  Select,
  FormField,
  Input,
  SubmitButton,
  Heading,
  Text,
  Space,
  ToastContainer,
  useToast,
  Result,
} from '@m5/ui'

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
  const params = useParams()
  const slug = (params?.slug as string) ?? 'beijing-chaoyang'
  const { toast, toasts, dismiss } = useToast()

  const [step, setStep] = useState(0)
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [bookingResult, setBookingResult] = useState<{ id: string } | null>(null)

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const slots: TimeSlot[] = Array.from({ length: 26 }, (_, i) => {
    const hour = 9 + Math.floor(i / 2)
    const min = i % 2 === 0 ? '00' : '30'
    return { time: `${String(hour).padStart(2, '0')}:${min}`, available: Math.random() > 0.35 }
  })

  const handleSubmit = useCallback(() => {
    if (!customerName || !customerPhone) { toast('请填写姓名和手机号', { variant: 'error' }); return }
    setBookingResult({ id: 'BK' + Date.now().toString(36).toUpperCase() })
    toast('预约成功！', { variant: 'success' })
  }, [customerName, customerPhone, toast])

  if (bookingResult) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 40 }}>
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        <Result status="success" title="预约成功！" subTitle={`预约编号: ${bookingResult.id}`}
          extra={<Space direction="vertical" size="middle"><div style={{ background: '#f0f0f0', padding: 24, borderRadius: 12, textAlign: 'center' }}>
            <Text weight="bold">🎫 到店核销二维码</Text>
            <div style={{ width: 200, height: 200, margin: '16px auto', background: '#fff', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text color="muted">QR Code</Text>
            </div>
            <Text color="muted">到店时出示此码，门闸扫码入场</Text>
          </div>
          <Button variant="primary" onClick={() => window.location.href = `/store/${slug}`}>返回门店首页</Button>
          </Space>} />
      </div>
    )
  }

  const service = MOCK_SERVICES.find(s => s.id === selectedService)
  const WEEKDAY = ['日','一','二','三','四','五','六']

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <Stepper steps={[
        { label: '选择项目', description: service?.name ?? '选择您想体验的服务' },
        { label: '选择时段', description: selectedSlot ? `${selectedDate} ${selectedSlot}` : '选择日期和时段' },
        { label: '确认预约', description: '填写信息并确认' },
      ]} activeStep={step} onStepClick={(i) => { if (i < step) setStep(i) }} />

      <div style={{ padding: '24px 0' }}>
        {step === 0 && (<>
          <FormField label="选择服务项目">
            <Select options={MOCK_SERVICES.map(s => ({ value: s.id, label: `${s.name} · ¥${s.price} · ${s.duration}` }))}
              value={selectedService}
              onChange={(e: any) => setSelectedService(e?.target?.value ?? e ?? '')}
              placeholder="请选择您想体验的服务" />
          </FormField>
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button variant="primary" disabled={!selectedService} onClick={() => setStep(1)}>下一步：选择时段 →</Button>
          </div>
        </>)}

        {step === 1 && (<>
          <FormField label="选择日期">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {dates.map((date) => (
                <Button key={date} variant={selectedDate === date ? 'primary' : 'ghost'} onClick={() => setSelectedDate(date)}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12 }}>{WEEKDAY[new Date(date).getDay()]}</div>
                    <div style={{ fontWeight: 'bold' }}>{date.slice(5)}</div>
                  </div>
                </Button>
              ))}
            </div>
          </FormField>
          {selectedDate && (
            <div style={{ marginTop: 16 }}>
              <FormField label="选择时段">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                  {slots.map(slot => (
                    <Button key={slot.time} variant={selectedSlot === slot.time ? 'primary' : 'ghost'}
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedSlot(slot.time)}
                      style={{ opacity: slot.available ? 1 : 0.4 }}>
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </FormField>
            </div>
          )}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => setStep(0)}>← 返回选项目</Button>
            <Button variant="primary" disabled={!selectedSlot} onClick={() => setStep(2)}>下一步：确认预约 →</Button>
          </div>
        </>)}

        {step === 2 && (
          <Card>
            <div style={{ padding: 24 }}>
              <Heading level={3}>确认预约信息</Heading>
              <div style={{ background: '#f8f8f8', borderRadius: 8, padding: 16, marginTop: 16 }}>
                <Space direction="vertical" >
                  <Text>🏬 神机营 · {slug === 'beijing-chaoyang' ? '北京朝阳店' : slug}</Text>
                  <Text>🎯 {service?.name}</Text>
                  <Text>📅 {selectedDate} {selectedSlot}</Text>
                  <Text weight="bold" color="primary">¥{service?.price ?? 0}</Text>
                </Space>
              </div>
              <div style={{ marginTop: 24 }}>
                <Input placeholder="请输入您的姓名" value={customerName} onChange={(e: any) => setCustomerName(e?.target?.value ?? '')} />
                <Input placeholder="请输入手机号（用于到店提醒）" value={customerPhone} onChange={(e: any) => setCustomerPhone(e?.target?.value ?? '')} style={{ marginTop: 16 }} />
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="ghost" onClick={() => setStep(1)}>← 返回选时段</Button>
                <SubmitButton variant="primary" onClick={handleSubmit}>确认预约 · ¥{service?.price ?? 0}</SubmitButton>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
