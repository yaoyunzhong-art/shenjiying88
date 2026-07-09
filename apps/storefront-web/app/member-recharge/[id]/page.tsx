/**
 * 充值详情页 — Recharge Detail Page (Next.js App Router Page)
 * 角色视角: 🏪店长 / 🧑‍💼前台操作
 * 功能: 查看单笔充值详细记录、状态流转、编辑备注、退款操作
 * 类型: B-页面创建 (详情页，含编辑/删除/状态流转)
 */
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';

import {
  PageShell,
  Card,
  Button,
  StatusBadge,
  Statistic,
  Modal,
  DetailActionBar,
  Timeline,
  DescriptionList,
} from '@m5/ui';

// ---- 类型 ----

type RechargeStatus = 'success' | 'pending' | 'failed' | 'refunded' | 'cancelled';

interface RechargeDetail {
  id: string;
  memberName: string;
  memberPhone: string;
  memberLevel: string;
  amount: number;
  bonus: number;
  total: number;
  beforeBalance: number;
  afterBalance: number;
  paymentMethod: string;
  status: RechargeStatus;
  operator: string;
  createdAt: string;
  updatedAt: string;
  remark: string;
  packageName?: string;
  transactionId: string;
}

// ---- Mock 数据 ----

function getMockDetail(id: string): RechargeDetail {
  return {
    id,
    memberName: '张三',
    memberPhone: '138****1234',
    memberLevel: '黄金会员',
    amount: 200,
    bonus: 40,
    total: 240,
    beforeBalance: 560,
    afterBalance: 800,
    paymentMethod: '微信支付',
    status: 'success',
    operator: '王店长',
    createdAt: '2026-07-09 14:30:00',
    updatedAt: '2026-07-09 14:30:15',
    remark: '畅玩套餐充值活动',
    packageName: '畅玩充值',
    transactionId: 'TXN' + id.padStart(8, '0'),
  };
}

const STATUS_LABELS: Record<RechargeStatus, string> = {
  success: '充值成功',
  pending: '处理中',
  failed: '充值失败',
  refunded: '已退款',
  cancelled: '已取消',
};

const STATUS_VARIANTS: Record<RechargeStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  success: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'info',
  cancelled: 'default',
};

const TIMELINE_ITEMS: Record<string, Array<{ time: string; title: string; description: string; active: boolean; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }>> = {
  success: [
    { time: '2026-07-09 14:30:00', title: '发起充值', description: '前台操作员发起充值申请', active: true, variant: 'info' },
    { time: '2026-07-09 14:30:05', title: '支付成功', description: '微信支付扣款成功 ¥200', active: true, variant: 'success' },
    { time: '2026-07-09 14:30:10', title: '到账处理', description: '系统充值 ¥200 + 赠送 ¥40', active: true, variant: 'success' },
    { time: '2026-07-09 14:30:15', title: '充值完成', description: '余额 ¥560 → ¥800', active: true, variant: 'success' },
  ],
  pending: [
    { time: '2026-07-09 14:30:00', title: '发起充值', description: '前台操作员发起充值申请', active: true, variant: 'info' },
    { time: '2026-07-09 14:30:05', title: '支付处理中', description: '等待支付渠道确认', active: true, variant: 'warning' },
    { time: '—', title: '到账处理', description: '等待支付确认', active: false, variant: 'default' },
    { time: '—', title: '充值完成', description: '等待前置步骤', active: false, variant: 'default' },
  ],
  failed: [
    { time: '2026-07-09 14:30:00', title: '发起充值', description: '前台操作员发起充值申请', active: true, variant: 'info' },
    { time: '2026-07-09 14:30:05', title: '支付失败', description: '余额不足 / 支付渠道错误', active: true, variant: 'error' },
    { time: '—', title: '到账处理', description: '已终止', active: false, variant: 'default' },
    { time: '—', title: '充值完成', description: '已终止', active: false, variant: 'default' },
  ],
  refunded: [
    { time: '2026-07-09 14:30:00', title: '发起充值', description: '前台操作员发起充值申请', active: true, variant: 'info' },
    { time: '2026-07-09 14:30:05', title: '支付成功', description: '微信支付扣款成功 ¥200', active: true, variant: 'success' },
    { time: '2026-07-09 14:30:10', title: '到账处理', description: '¥200 已到账', active: true, variant: 'success' },
    { time: '2026-07-10 09:00:00', title: '已退款', description: '管理员发起退款，¥200 原路返回', active: true, variant: 'info' },
  ],
  cancelled: [
    { time: '2026-07-09 14:30:00', title: '发起充值', description: '前台操作员发起充值申请', active: true, variant: 'info' },
    { time: '2026-07-09 14:30:05', title: '已取消', description: '操作员手动取消该笔充值', active: true, variant: 'default' },
  ],
};

// ---- 主组件 ----

export default function RechargeDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<RechargeDetail>(() => getMockDetail(params?.id ?? 'R001'));
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [editRemark, setEditRemark] = useState(detail.remark);
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const timelineItems = TIMELINE_ITEMS[detail.status] ?? [];

  // ---- 操作处理 ----

  const handleRefund = () => {
    if (!refundReason.trim()) {
      setNotification({ type: 'error', message: '请输入退款原因' });
      return;
    }
    setDetail((prev) => ({ ...prev, status: 'refunded', updatedAt: new Date().toLocaleString('zh-CN') }));
    setShowRefundModal(false);
    setRefundReason('');
    setNotification({ type: 'success', message: `充值单 ${detail.id} 已成功退款 ¥${detail.amount}` });
  };

  const handleDelete = () => {
    setShowDeleteModal(false);
    setNotification({ type: 'success', message: `充值单 ${detail.id} 已删除` });
  };

  const handleSaveRemark = () => {
    setDetail((prev) => ({ ...prev, remark: editRemark }));
    setIsEditingRemark(false);
    setNotification({ type: 'success', message: '备注已更新' });
  };

  // ---- 构建 DetailActionBar actions ---
  const actionBarActions: Array<{ key: string; label: string; onClick: () => void; variant?: 'default' | 'primary' | 'danger' }> = [];

  if (detail.status === 'success') {
    actionBarActions.push({ key: 'refund', label: '申请退款', onClick: () => setShowRefundModal(true), variant: 'danger' });
  }
  if (detail.status === 'pending') {
    actionBarActions.push({ key: 'cancel', label: '取消充值', onClick: () => {
      setDetail((prev) => ({ ...prev, status: 'cancelled', updatedAt: new Date().toLocaleString('zh-CN') }));
      setNotification({ type: 'success', message: '充值单已取消' });
    }});
  }
  actionBarActions.push({ key: 'delete', label: '删除记录', onClick: () => setShowDeleteModal(true) });

  return (
    <PageShell
      title={`充值详情 — ${detail.id}`}
      subtitle={`会员 ${detail.memberName} · ${detail.memberLevel}`}
    >
      {/* 顶部状态和操作栏 */}
      <DetailActionBar
        caption={`${STATUS_LABELS[detail.status]} · 更新于 ${detail.updatedAt}`}
        actions={actionBarActions}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧：基本信息 + 金额 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 金额概览 */}
          <Card title="金额概览">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Statistic label="充值金额" value={detail.amount} prefix="¥" />
              <Statistic label="赠送金额" value={detail.bonus} prefix="¥" />
              <Statistic label="到账总额" value={detail.total} prefix="¥" />
              <Statistic label="当前余额" value={detail.afterBalance} prefix="¥" />
            </div>
          </Card>

          {/* 基本信息 */}
          <Card title="基本信息">
            <DescriptionList
              items={[
                { label: '充值单号', value: detail.id },
                { label: '交易流水号', value: detail.transactionId },
                { label: '会员姓名', value: detail.memberName },
                { label: '会员手机', value: detail.memberPhone },
                { label: '会员等级', value: detail.memberLevel },
                { label: '充值套餐', value: detail.packageName ?? '自定义金额' },
                { label: '支付方式', value: detail.paymentMethod },
                { label: '操作员', value: detail.operator },
                { label: '创建时间', value: detail.createdAt },
              ]}
            />
          </Card>

          {/* 状态流转时间线 */}
          <Card title="状态流转">
            <Timeline items={timelineItems.map((item, idx) => ({
              key: `step-${idx}`,
              heading: item.title,
              subtitle: item.time,
              content: item.description,
              variant: item.variant,
              pending: !item.active,
            }))} />
          </Card>
        </div>

        {/* 右侧：备注 + 操作面板 */}
        <div className="space-y-6">
          {/* 备注 */}
          <Card title="备注">
            {isEditingRemark ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-blue-400 dark:border-gray-600 dark:bg-gray-800"
                  rows={4}
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditRemark(detail.remark); setIsEditingRemark(false); }}>取消</Button>
                  <Button size="sm" variant="primary" onClick={handleSaveRemark}>保存</Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{detail.remark || '暂无备注'}</p>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => setIsEditingRemark(true)}>编辑备注</Button>
              </div>
            )}
          </Card>

          {/* 余额变化 */}
          <Card title="余额变化">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xs text-gray-400">充值前</p>
                <p className="text-lg font-bold text-gray-600">¥{detail.beforeBalance}</p>
              </div>
              <div className="text-2xl text-gray-300">→</div>
              <div className="text-center">
                <p className="text-xs text-gray-400">充值后</p>
                <p className="text-lg font-bold text-green-600">¥{detail.afterBalance}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">增加</p>
                <p className="text-lg font-bold text-blue-600">+¥{detail.total}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 关闭栏 */}
      <div className="mt-6 flex items-center justify-between rounded-lg border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
        <div className="flex items-center gap-3 text-sm">
          <StatusBadge variant={STATUS_VARIANTS[detail.status]} label={STATUS_LABELS[detail.status]} size="sm" />
          <span className="text-gray-400">更新于 {detail.updatedAt}</span>
        </div>
        <a
          href="/member-recharge"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
        >
          ← 返回充值列表
        </a>
      </div>

      {/* 退款弹窗 */}
      <Modal
        open={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        title="确认退款"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            退款金额 <strong>¥{detail.amount}</strong> 将原路返回至 {detail.paymentMethod}，赠送金额 <strong>¥{detail.bonus}</strong> 将回收。
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">退款原因 *</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-blue-400 dark:border-gray-600 dark:bg-gray-800"
              rows={3}
              placeholder="请输入退款原因"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowRefundModal(false)}>取消</Button>
          <Button variant="danger" onClick={handleRefund}>确认退款</Button>
        </div>
      </Modal>

      {/* 删除弹窗 */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          确定要删除充值单 <strong>{detail.id}</strong> 吗？此操作不可恢复。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>取消</Button>
          <Button variant="danger" onClick={handleDelete}>确认删除</Button>
        </div>
      </Modal>

      {/* 通知提示 */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-5 py-3 text-sm font-medium shadow-lg transition-all ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-3 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </PageShell>
  );
}
