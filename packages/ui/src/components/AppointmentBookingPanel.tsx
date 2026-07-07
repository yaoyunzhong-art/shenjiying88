'use client';

import React, { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

// ---- 类型定义 ----

/** 预约状态 */
export type AppointmentStatus =
  | 'pending'       // 待确认
  | 'confirmed'     // 已确认
  | 'in_progress'   // 进行中
  | 'completed'     // 已完成
  | 'cancelled'     // 已取消
  | 'no_show';      // 未到场

/** 服务项目 */
export interface ServiceItem {
  /** 服务ID */
  id: string;
  /** 服务名称 */
  name: string;
  /** 服务时长(分钟) */
  duration: number;
  /** 服务价格 */
  price: number;
  /** 是否可用 */
  available: boolean;
  /** 服务分类 */
  category?: string;
  /** 服务描述 */
  description?: string;
}

/** 可预约时段 */
export interface TimeSlot {
  /** 开始时间 ISO */
  startTime: string;
  /** 结束时间 ISO */
  endTime: string;
  /** 是否可预约 */
  available: boolean;
  /** 时段标签 */
  label?: string;
}

/** 预约记录 */
export interface Appointment {
  /** 预约ID */
  id: string;
  /** 会员ID */
  memberId: string;
  /** 会员姓名 */
  memberName: string;
  /** 会员联系方式 */
  memberPhone?: string;
  /** 预约服务 */
  service: ServiceItem;
  /** 预约日期 YYYY-MM-DD */
  date: string;
  /** 开始时间 HH:mm */
  startTime: string;
  /** 结束时间 HH:mm */
  endTime: string;
  /** 预约状态 */
  status: AppointmentStatus;
  /** 备注 */
  notes?: string;
  /** 创建时间 */
  createdAt: string;
  /** 最后更新时间 */
  updatedAt?: string;
}

/** 预约面板Props */
export interface AppointmentBookingPanelProps {
  /** 服务列表 */
  services: ServiceItem[];
  /** 当前日期 YYYY-MM-DD */
  currentDate: string;
  /** 可用时段 */
  availableSlots?: TimeSlot[];
  /** 今日预约列表 */
  todayAppointments?: Appointment[];
  /** 预约回调 */
  onBook?: (params: BookingParams) => Promise<boolean>;
  /** 取消预约回调 */
  onCancel?: (appointmentId: string) => Promise<boolean>;
  /** 确认到场回调 */
  onConfirmArrival?: (appointmentId: string) => void;
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 标题 */
  title?: string;
  /** 自定义空状态 */
  emptyState?: ReactNode;
  /** 自定义类名 */
  className?: string;
}

/** 预约参数 */
export interface BookingParams {
  /** 会员ID */
  memberId: string;
  /** 会员姓名 */
  memberName: string;
  /** 会员电话 */
  memberPhone?: string;
  /** 服务ID */
  serviceId: string;
  /** 预约日期 YYYY-MM-DD */
  date: string;
  /** 开始时间 HH:mm */
  startTime: string;
  /** 结束时间 HH:mm */
  endTime: string;
  /** 备注 */
  notes?: string;
}

/** 状态映射 */
const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '未到场',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: '#faad14',
  confirmed: '#1890ff',
  in_progress: '#52c41a',
  completed: '#8c8c8c',
  cancelled: '#ff4d4f',
  no_show: '#722ed1',
};

// ---- 组件 ----

export function AppointmentBookingPanel({
  services,
  currentDate,
  availableSlots = [],
  todayAppointments = [],
  onBook,
  onCancel,
  onConfirmArrival,
  loading = false,
  error,
  title = '预约管理',
  emptyState,
  className,
}: AppointmentBookingPanelProps) {
  // Tab: today / book
  const [activeTab, setActiveTab] = useState<'today' | 'book'>('today');

  // 预约表单状态 (book tab)
  const [selectedService, setSelectedService] = useState<string>('');
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookSuccess, setBookSuccess] = useState(false);

  // 当前选中服务详情
  const selectedServiceDetail = useMemo(
    () => services.find((s) => s.id === selectedService),
    [services, selectedService],
  );

  // 筛选可用时段
  const availableTimeSlots = useMemo(
    () => availableSlots.filter((s) => s.available),
    [availableSlots],
  );

  // 今日预约统计
  const stats = useMemo(() => {
    const total = todayAppointments.length;
    const confirmed = todayAppointments.filter((a) => a.status === 'confirmed').length;
    const inProgress = todayAppointments.filter((a) => a.status === 'in_progress').length;
    const completed = todayAppointments.filter((a) => a.status === 'completed').length;
    const cancelled = todayAppointments.filter((a) => a.status === 'cancelled').length;
    return { total, confirmed, inProgress, completed, cancelled };
  }, [todayAppointments]);

  // 提交预约
  const handleSubmit = useCallback(async () => {
    if (!selectedService || !memberName.trim() || !selectedSlot) {
      setSubmitError('请填写完整信息');
      return;
    }

    if (!onBook) {
      setSubmitError('预约功能不可用');
      return;
    }

    const slot = availableSlots.find((s) => s.startTime === selectedSlot);
    if (!slot) {
      setSubmitError('所选时段无效');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const params: BookingParams = {
        memberId: `guest_${Date.now()}`,
        memberName: memberName.trim(),
        memberPhone: memberPhone.trim() || undefined,
        serviceId: selectedService,
        date: currentDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        notes: notes.trim() || undefined,
      };

      const success = await onBook(params);
      if (success) {
        setBookSuccess(true);
        // 重置表单
        setSelectedService('');
        setMemberName('');
        setMemberPhone('');
        setSelectedSlot('');
        setNotes('');
      } else {
        setSubmitError('预约提交失败，请重试');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '预约失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [selectedService, memberName, memberPhone, selectedSlot, notes, onBook, currentDate, availableSlots]);

  // 取消预约
  const handleCancel = useCallback(
    async (appointmentId: string) => {
      if (!onCancel) return;
      try {
        await onCancel(appointmentId);
      } catch {
        // handled by parent
      }
    },
    [onCancel],
  );

  // 渲染预约状态标签
  const renderStatusBadge = (status: AppointmentStatus) => {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          color: '#fff',
          backgroundColor: STATUS_COLORS[status],
        }}
      >
        {STATUS_LABELS[status]}
      </span>
    );
  };

  // 渲染今日预约
  const renderTodayAppointments = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
          加载中...
        </div>
      );
    }

    if (todayAppointments.length === 0) {
      return (
        emptyState || (
          <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📅</div>
            <div>今日暂无预约</div>
          </div>
        )
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {todayAppointments.map((apt) => {
          const isActive = apt.status === 'confirmed' || apt.status === 'in_progress';
          return (
            <div
              key={apt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                backgroundColor: apt.status === 'cancelled' ? '#fafafa' : '#fff',
                opacity: apt.status === 'cancelled' ? 0.7 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {apt.memberName}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                  {apt.service.name} · {apt.startTime}-{apt.endTime}
                </div>
                {apt.notes && (
                  <div style={{ fontSize: 12, color: '#999' }}>
                    📝 {apt.notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {renderStatusBadge(apt.status)}
                {isActive && onCancel && (
                  <button
                    onClick={() => handleCancel(apt.id)}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid #ff4d4f',
                      borderRadius: 4,
                      backgroundColor: '#fff',
                      color: '#ff4d4f',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    取消
                  </button>
                )}
                {apt.status === 'confirmed' && onConfirmArrival && (
                  <button
                    onClick={() => onConfirmArrival(apt.id)}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid #52c41a',
                      borderRadius: 4,
                      backgroundColor: '#52c41a',
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    签到
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Tab 切换
  const tabs = (
    <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f0f0f0', marginBottom: 16 }}>
      <button
        onClick={() => setActiveTab('today')}
        style={{
          padding: '8px 20px',
          border: 'none',
          background: 'none',
          fontSize: 14,
          fontWeight: activeTab === 'today' ? 600 : 400,
          color: activeTab === 'today' ? '#1890ff' : '#666',
          cursor: 'pointer',
          borderBottom: activeTab === 'today' ? '2px solid #1890ff' : '2px solid transparent',
          marginBottom: -2,
        }}
      >
        今日预约 {stats.total > 0 && `(${stats.total})`}
      </button>
      <button
        onClick={() => setActiveTab('book')}
        style={{
          padding: '8px 20px',
          border: 'none',
          background: 'none',
          fontSize: 14,
          fontWeight: activeTab === 'book' ? 600 : 400,
          color: activeTab === 'book' ? '#1890ff' : '#666',
          cursor: 'pointer',
          borderBottom: activeTab === 'book' ? '2px solid #1890ff' : '2px solid transparent',
          marginBottom: -2,
        }}
      >
        新建预约
      </button>
    </div>
  );

  // 顶部统计
  const statsBar = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        marginBottom: 16,
      }}
    >
      {[
        { label: '总预约', value: stats.total, color: '#1890ff' },
        { label: '待服务', value: stats.confirmed + stats.inProgress, color: '#52c41a' },
        { label: '已完成', value: stats.completed, color: '#8c8c8c' },
        { label: '已取消', value: stats.cancelled, color: '#ff4d4f' },
      ].map((item) => (
        <div
          key={item.label}
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: `${item.color}0f`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>
            {item.value}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );

  // 预约表单
  const bookingForm = (
    <div>
      {error && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 6,
            color: '#ff4d4f',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {bookSuccess ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>预约成功</div>
          <button
            onClick={() => setBookSuccess(false)}
            style={{
              padding: '8px 24px',
              border: '1px solid #1890ff',
              borderRadius: 6,
              backgroundColor: '#fff',
              color: '#1890ff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            继续预约
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 选择服务 */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>
              服务项目 *
            </label>
            <select
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                setSelectedSlot('');
              }}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: '#fff',
              }}
            >
              <option value="">请选择服务</option>
              {services
                .filter((s) => s.available)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration}分钟 / ¥{s.price})
                  </option>
                ))}
            </select>
            {selectedServiceDetail && (
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                {selectedServiceDetail.description || `${selectedServiceDetail.category || '通用'} · ${selectedServiceDetail.duration}分钟`}
              </div>
            )}
          </div>

          {/* 会员姓名 */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>
              会员姓名 *
            </label>
            <input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="请输入会员姓名"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 会员电话 */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>
              联系电话
            </label>
            <input
              value={memberPhone}
              onChange={(e) => setMemberPhone(e.target.value)}
              placeholder="选填"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 可用时段 */}
          {selectedService && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>
                预约时段 *
              </label>
              {availableTimeSlots.length === 0 ? (
                <div style={{ fontSize: 13, color: '#999', padding: '8px 0' }}>
                  今日暂无可用时段
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {availableTimeSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      onClick={() => setSelectedSlot(slot.startTime)}
                      disabled={submitting}
                      style={{
                        padding: '6px 14px',
                        border: `1px solid ${selectedSlot === slot.startTime ? '#1890ff' : '#d9d9d9'}`,
                        borderRadius: 6,
                        backgroundColor: selectedSlot === slot.startTime ? '#e6f7ff' : '#fff',
                        color: selectedSlot === slot.startTime ? '#1890ff' : '#333',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {slot.startTime}-{slot.endTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 备注 */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>
              备注
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="选填"
              rows={2}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 提交错误 */}
          {submitError && (
            <div style={{ fontSize: 13, color: '#ff4d4f' }}>⚠️ {submitError}</div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '10px 0',
              border: 'none',
              borderRadius: 6,
              backgroundColor: submitting ? '#bae7ff' : '#1890ff',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '提交中...' : '确认预约'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={className}
      style={{
        borderRadius: 12,
        border: '1px solid #e8e8e8',
        padding: 20,
        backgroundColor: '#fff',
        maxWidth: 520,
      }}
    >
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 16,
          fontWeight: 600,
          color: '#1a1a1a',
        }}
      >
        {title}
      </h3>

      {tabs}

      {activeTab === 'today' && (
        <>
          {statsBar}
          {renderTodayAppointments()}
        </>
      )}

      {activeTab === 'book' && bookingForm}
    </div>
  );
}
