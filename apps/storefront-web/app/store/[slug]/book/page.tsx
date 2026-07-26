'use client';

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Button, Card, Stepper, Select, FormField, Input, SubmitButton,
  Heading, Text, Space, Badge, ToastContainer, useToast, Result,
} from '@m5/ui'
import { track } from '../../analytics'
import ShareCTA from '../_components/share-cta'

interface ServiceOption { id: string; name: string; price: number; duration: string; category: string }
interface TimeSlot { time: string; available: boolean }
interface BookingResult {
  bookingId: string; status: string; qrCode: string; paymentUrl: string
  storeName: string; serviceName: string; date: string; timeSlot: string
  customerName: string; amount: number
  couponMatch?: { applied: boolean; couponName?: string; finalAmount: number; levelBonus: number }
}

const API_BASE = '/api/storefront'

export default function BookPage() {
  const params = useParams()
  const slug = (params?.slug as string) ?? 'beijing-chaoyang'
  const { toast, toasts, dismiss } = useToast()

  const [step, setStep] = useState(0)
  const [services, setServices] = useState<ServiceOption[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelPhone, setCancelPhone] = useState('')
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
  const [showManage, setShowManage] = useState(false)
  const [manageBookingId, setManageBookingId] = useState('')
  const [manageStatus, setManageStatus] = useState<any>(null)

  useEffect(() => {
    track('page_view', { storeSlug: slug })
    fetch(`${API_BASE}/store/${slug}/services`)
      .then(r => r.json())
      .then(d => { if (d.success) setServices(d.data.items) })
      .catch(() => {})
  }, [slug])

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!selectedService || !selectedDate) return
    setSlots([])
    fetch(`${API_BASE}/store/${slug}/services/${selectedService}/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSlots(d.data.slots) })
      .catch(() => {})
  }, [slug, selectedService, selectedDate])

  const service = services.find(s => s.id === selectedService)

  const handleSubmit = useCallback(async () => {
    if (!customerName || !customerPhone) { toast('请填写姓名和手机号', { variant: 'error' }); return }
    track('booking_submit', { storeSlug: slug, serviceId: selectedService, amount: service?.price ? service.price * 100 : 0 })
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug: slug, serviceId: selectedService, date: selectedDate, timeSlot: selectedSlot, customerName, customerPhone }),
      })
      const data = await res.json()
      if (data.success) {
        setBookingResult(data.data)
        track('booking_success', { storeSlug: slug, serviceId: selectedService, bookingId: data.data.bookingId, amount: data.data.amount })
        toast('预约成功！', { variant: 'success' })
      } else {
        toast(data.message || '预约失败', { variant: 'error' })
      }
    } catch { toast('网络错误，请重试', { variant: 'error' }) }
    finally { setSubmitting(false) }
  }, [customerName, customerPhone, slug, selectedService, selectedDate, selectedSlot, service, toast])

  const handleCancel = useCallback(async () => {
    if (!manageBookingId || !cancelPhone) { toast('请输入预约编号和手机号', { variant: 'error' }); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/bookings/${manageBookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: manageBookingId, storeSlug: slug, customerPhone: cancelPhone }),
      })
      const data = await res.json()
      if (data.success) { track('booking_cancel', { bookingId: manageBookingId }); toast('预约已取消', { variant: 'success' }); setManageStatus(null) }
      else { toast(data.message || '取消失败', { variant: 'error' }) }
    } catch { toast('网络错误', { variant: 'error' }) }
    finally { setSubmitting(false) }
  }, [manageBookingId, cancelPhone, slug, toast])

  const handleQuery = useCallback(async () => {
    if (!manageBookingId) { toast('请输入预约编号', { variant: 'error' }); return }
    try {
      const res = await fetch(`${API_BASE}/bookings/${manageBookingId}`)
      const data = await res.json()
      if (data.success) setManageStatus(data.data)
      else toast(data.message || '未找到预约', { variant: 'error' })
    } catch { toast('网络错误', { variant: 'error' }) }
  }, [manageBookingId, toast])

  // ── Manage Booking Overlay ──
  if (showManage) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        <Button variant="ghost" onClick={() => { setShowManage(false); setManageStatus(null) }}>← 返回预约</Button>
        <Heading level={2} style={{ marginTop: 16 }}>管理我的预约</Heading>
        <div style={{ marginTop: 16 }}>
          <Input placeholder="预约编号 (如 BK-xxx)" value={manageBookingId} onChange={(e: any) => setManageBookingId(e?.target?.value ?? '')} />
          <Button variant="primary" onClick={handleQuery} style={{ marginTop: 8 }}>查询预约</Button>
        </div>
        {manageStatus && (
          <Card style={{ marginTop: 16 }}>
            <div style={{ padding: 16 }}>
              <Space direction="vertical">
                <Text weight="bold">{manageStatus.storeName}</Text>
                <Text>{manageStatus.serviceName}</Text>
                <Text>📅 {manageStatus.date} {manageStatus.timeSlot}</Text>
                <Badge variant={manageStatus.status === 'confirmed' ? 'success' : manageStatus.status === 'cancelled' ? 'error' : 'warning'}>
                  {manageStatus.status === 'confirmed' ? '已确认' : manageStatus.status === 'cancelled' ? '已取消' : manageStatus.status === 'completed' ? '已核销' : manageStatus.status}
                </Badge>
                <Text>¥{(manageStatus.amount / 100).toFixed(2)}</Text>
              </Space>
              {manageStatus.status === 'confirmed' && (
                <div style={{ marginTop: 16 }}>
                  <Input placeholder="输入手机号以验证身份" value={cancelPhone} onChange={(e: any) => setCancelPhone(e?.target?.value ?? '')} />
                  <Button variant="danger" onClick={handleCancel} loading={submitting} style={{ marginTop: 8 }}>取消此预约</Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    )
  }

  // ── Booking Success ──
  if (bookingResult) {
    const ci = bookingResult.couponMatch
    const storeName = slug === 'beijing-chaoyang' ? '神机营 · 北京朝阳店' : '神机营 · 上海浦东店'
    const selService = services.find(s => s.id === selectedService)
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 40 }}>
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        {/* ShareCTA — 预约成功炫耀 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <ShareCTA
            storeSlug={slug} storeName={storeName}
            shareType="booking_success"
            shareText={`我在${storeName}预约了${selService?.name ?? ''}，快来一起玩！`}
          />
        </div>
        <Result status="success" title="预约成功！" subTitle={bookingResult.storeName}
          extra={<Space direction="vertical" size="middle">
            <div style={{ background: '#f0f0f0', padding: 24, borderRadius: 12, textAlign: 'center' }}>
              <Text weight="bold">🎫 到店核销二维码</Text>
              <div style={{ width: 200, margin: '16px auto', background: '#fff', border: '2px dashed #ccc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <Text color="muted">{bookingResult.qrCode}</Text>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(bookingResult.qrCode)}`} alt="核销码" style={{ width: 150, height: 150, marginTop: 8 }} />
              </div>
              <Text color="muted">到店时出示此码，门闸扫码入场</Text>
            </div>
            {ci?.applied && (
              <div style={{ background: '#fff3e0', padding: 16, borderRadius: 8, border: '1px solid #ff9800' }}>
                <Text weight="bold" color="primary">🎁 优惠券已应用</Text><br />
                <Text>{ci.couponName} · 实付 ¥{(ci.finalAmount / 100).toFixed(2)}</Text>
                {ci.levelBonus > 0 && <Text color="muted"> · 等级加成 -¥{(ci.levelBonus / 100).toFixed(2)}</Text>}
              </div>
            )}
            <div style={{ background: '#e8f5e9', padding: 16, borderRadius: 8 }}>
              <Text>📱 预约前2小时和30分钟将收到到店提醒</Text>
            </div>
            <Space direction="horizontal" size="middle">
              <Button variant="primary" onClick={() => window.location.href = `/store/${slug}`}>返回门店首页</Button>
              <Button variant="ghost" onClick={() => window.location.href = bookingResult.paymentUrl}>在线支付</Button>
            </Space>
          </Space>} />
      </div>
    )
  }

  const WEEKDAY = ['日','一','二','三','四','五','六']

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 80px' }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <Stepper steps={[
        { label: '选择项目', description: service?.name ?? '选择服务' },
        { label: '选择时段', description: selectedSlot ? `${selectedDate} ${selectedSlot}` : '' },
        { label: '确认预约', description: '填写信息' },
      ]} activeStep={step} onStepClick={(i) => { if (i < step) setStep(i) }} />
      <div style={{ padding: '24px 0' }}>
        {step === 0 && (<>
          <FormField label="选择服务项目">
            {services.length > 0 ? (
              <Select options={services.map(s => ({ value: s.id, label: `${s.name} · ¥${s.price} · ${s.duration}` }))}
                value={selectedService} onChange={(e: any) => { setSelectedService(e?.target?.value ?? e ?? ''); track('service_select', { serviceId: e?.target?.value ?? e }) }}
                placeholder="请选择服务" />
            ) : <Text color="muted">加载服务项目中…</Text>}
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
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12 }}>{WEEKDAY[new Date(date).getDay()]}</div><div style={{ fontWeight: 'bold' }}>{date.slice(5)}</div></div>
                </Button>
              ))}
            </div>
          </FormField>
          {selectedDate && slots.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <FormField label="选择时段">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                  {slots.map(slot => (
                    <Button key={slot.time} variant={selectedSlot === slot.time ? 'primary' : 'ghost'}
                      disabled={!slot.available} onClick={() => { if (slot.available) { setSelectedSlot(slot.time); track('slot_select') } }}
                      style={{ opacity: slot.available ? 1 : 0.4 }}>{slot.time}</Button>
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
                <Space direction="vertical">
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
                <SubmitButton variant="primary" loading={submitting} onClick={handleSubmit}>确认预约 · ¥{service?.price ?? 0}</SubmitButton>
              </div>
            </div>
          </Card>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button variant="ghost" onClick={() => { setShowManage(true); setManageStatus(null); setManageBookingId(''); setCancelPhone('') }}>📋 管理已有预约（查/退）</Button>
      </div>
    </div>
  )
}
