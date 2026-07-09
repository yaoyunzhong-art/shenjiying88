/**
 * 会员充值页 — Member Recharge Page (Next.js App Router Page)
 * 角色视角: 🏪店长 / 🧑‍💼前台操作
 * 功能: 会员卡充值、套餐选择、支付方式选择、充值记录展示
 * 类型: D-角色操作界面 (前台操作面板)
 */
'use client';

import React, { useState, useCallback } from 'react';

import {
  PageShell,
  Card,
  InputNumber,
  Button,
  Statistic,
  StatTrend,
  StatusBadge,
  Modal,
} from '@m5/ui';

// ---- 类型 ----

type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card';

interface RechargePackage {
  id: string;
  name: string;
  amount: number;
  bonus: number;
  total: number;
  label?: string;
}

interface RechargeRecord {
  id: string;
  memberName: string;
  memberPhone: string;
  amount: number;
  bonus: number;
  paymentMethod: PaymentMethod;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  operator: string;
  createdAt: string;
}

// ---- Mock 数据 ----

const MOCK_PACKAGES: RechargePackage[] = [
  { id: 'p1', name: '小额充值', amount: 50, bonus: 5, total: 55 },
  { id: 'p2', name: '标准充值', amount: 100, bonus: 15, total: 115, label: '推荐' },
  { id: 'p3', name: '畅玩充值', amount: 200, bonus: 40, total: 240 },
  { id: 'p4', name: '尊享充值', amount: 500, bonus: 120, total: 620, label: '超值' },
];

const MOCK_RECORDS: RechargeRecord[] = [
  { id: 'R001', memberName: '张三', memberPhone: '138****1234', amount: 100, bonus: 15, paymentMethod: 'wechat', status: 'success', operator: '王店长', createdAt: '2026-07-09 14:30' },
  { id: 'R002', memberName: '李四', memberPhone: '139****5678', amount: 200, bonus: 40, paymentMethod: 'alipay', status: 'success', operator: '王店长', createdAt: '2026-07-09 15:00' },
  { id: 'R003', memberName: '王五', memberPhone: '136****9012', amount: 50, bonus: 5, paymentMethod: 'cash', status: 'pending', operator: '李前台', createdAt: '2026-07-09 15:30' },
  { id: 'R004', memberName: '赵六', memberPhone: '137****3456', amount: 500, bonus: 120, paymentMethod: 'card', status: 'success', operator: '王店长', createdAt: '2026-07-09 16:00' },
  { id: 'R005', memberName: '孙七', memberPhone: '158****7890', amount: 100, bonus: 15, paymentMethod: 'wechat', status: 'failed', operator: '李前台', createdAt: '2026-07-09 16:30' },
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  card: '银行卡',
};

// ---- 子组件 ----

function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
}) {
  return (
    <div className="flex gap-3 flex-wrap">
      {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
        <button
          key={method}
          type="button"
          onClick={() => onChange(method)}
          aria-pressed={value === method}
          className={`rounded-lg border-2 px-5 py-3 text-sm font-medium transition-colors ${
            value === method
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          {PAYMENT_METHOD_LABELS[method]}
        </button>
      ))}
    </div>
  );
}

// ---- 主组件 ----

export default function MemberRechargePage() {
  // 会员搜索
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<{ name: string; phone: string; balance: number } | null>(null);

  // 充值金额（自定义或套餐）
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');

  // 充值模式: 'package' | 'custom'
  const [rechargeMode, setRechargeMode] = useState<'package' | 'custom'>('package');

  // 对话框 & 提示消息
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 最近充值记录（取前5条）
  const recentRecords = MOCK_RECORDS.slice(0, 5);

  // 计算充值总额
  const activePackage = MOCK_PACKAGES.find((p) => p.id === selectedPackage);
  const rechargeAmount = rechargeMode === 'package'
    ? activePackage?.total ?? 0
    : customAmount;

  // 选择套餐
  const handleSelectPackage = useCallback((id: string) => {
    setSelectedPackage(id);
    setSelectedPackage(id);
  }, []);

  // 模拟搜索会员
  const handleSearchMember = useCallback(() => {
    if (memberQuery.trim()) {
      setSelectedMember({
        name: '测试会员',
        phone: memberQuery,
        balance: 268,
      });
    }
  }, [memberQuery]);

  // 确认充值
  const handleConfirmRecharge = useCallback(() => {
    if (!selectedMember) {
      setNotification({ type: 'error', message: '请先选择充值会员' });
      return;
    }
    if (rechargeAmount <= 0) {
      setNotification({ type: 'error', message: '充值金额必须大于 0' });
      return;
    }
    setShowConfirm(false);
    // 模拟充值成功
    setNotification({ type: 'success', message: `为 ${selectedMember.name} 充值 ¥${rechargeAmount} 成功！` });
  }, [selectedMember, rechargeAmount]);



  return (
    <PageShell
      title="会员充值"
      subtitle="为会员卡充值余额，支持套餐和自定义金额"
    >
      {/* 统计概览 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Statistic label="今日充值总额" value="1,235" prefix="¥" suffix={<StatTrend direction="up" value="+12.5%" />} />
        <Statistic label="今日充值笔数" value="18" suffix={<StatTrend direction="up" value="+8.3%" />} />
        <Statistic label="本月新增充值会员" value="56" suffix={<StatTrend direction="down" value="-3.2%" invert />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* 左侧: 充值操作区 */}
        <div className="lg:col-span-3 space-y-6">
          {/* Step 1: 选择会员 */}
          <Card title="1. 选择会员">
            <div className="flex items-center gap-3">
              <Input
                placeholder="输入会员手机号 / 卡号 / 姓名"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearchMember} variant="primary">
                查询
              </Button>
            </div>
            {selectedMember && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-sm font-medium">{selectedMember.name}</p>
                <p className="text-xs text-gray-500">{selectedMember.phone}</p>
                <p className="mt-1 text-sm">当前余额: <span className="font-bold text-green-600">¥{selectedMember.balance}</span></p>
              </div>
            )}
          </Card>

          {/* Step 2: 选择充值金额 */}
          <Card title="2. 选择充值金额">
            {/* 模式切换 */}
            <div className="mb-4 flex gap-2">
              <Button
                size="sm"
                variant={rechargeMode === 'package' ? 'primary' : 'ghost'}
                onClick={() => setRechargeMode('package')}
              >
                充值套餐
              </Button>
              <Button
                size="sm"
                variant={rechargeMode === 'custom' ? 'primary' : 'ghost'}
                onClick={() => setRechargeMode('custom')}
              >
                自定义金额
              </Button>
            </div>

            {rechargeMode === 'package' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MOCK_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-colors ${
                      selectedPackage === pkg.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800'
                    }`}
                  >
                    {pkg.label && (
                      <span className="absolute -top-2 right-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                        {pkg.label}
                      </span>
                    )}
                    <p className="text-lg font-bold">¥{pkg.amount}</p>
                    <p className="mt-1 text-xs text-gray-500">赠送 ¥{pkg.bonus}</p>
                    <p className="mt-1 text-sm font-medium text-green-600">实到 ¥{pkg.total}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="max-w-xs">
                <InputNumber
                  value={customAmount}
                  onChange={(v) => setCustomAmount(v ?? 0)}
                  min={1}
                  max={99999}
                  placeholder="输入充值金额"
                  prefix="¥"
                />
              </div>
            )}
          </Card>

          {/* Step 3: 支付方式 */}
          <Card title="3. 选择支付方式">
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </Card>

          {/* 确认充值 */}
          <div className="flex items-center justify-between rounded-xl border bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
            <div>
              <p className="text-sm text-gray-500">充值金额</p>
              <p className="text-2xl font-bold text-blue-600">¥{rechargeAmount}</p>
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={!selectedMember || rechargeAmount <= 0}
              onClick={() => setShowConfirm(true)}
            >
              确认充值
            </Button>
          </div>
        </div>

        {/* 右侧: 充值记录 */}
        <div className="lg:col-span-2">
          <Card title="最近充值记录">
            {recentRecords.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">暂无充值记录</p>
            ) : (
              <div className="space-y-2">
                {recentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm dark:border-gray-600"
                  >
                    <div>
                      <p className="font-medium">{record.memberName}</p>
                      <p className="text-xs text-gray-400">{record.memberPhone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+¥{record.amount}</p>
                      <StatusBadge
                        variant={record.status === 'success' ? 'success' : record.status === 'failed' ? 'error' : 'warning'}
                        label={record.status === 'success' ? '成功' : record.status === 'pending' ? '处理中' : record.status === 'failed' ? '失败' : '已退款'}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-center pt-2">
                  <Link
                    href="/member-recharge/records"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    查看全部记录 →
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 确认弹窗 */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="确认充值"
      >
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">会员</span>
            <span>{selectedMember?.name} ({selectedMember?.phone})</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">充值金额</span>
            <span className="font-bold text-blue-600">¥{rechargeAmount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">支付方式</span>
            <span>{PAYMENT_METHOD_LABELS[paymentMethod]}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowConfirm(false)}>取消</Button>
          <Button variant="primary" onClick={handleConfirmRecharge}>确认充值</Button>
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

// ---- 辅助组件 ----

function Input({ placeholder, value, onChange, className }: {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-500 ${className ?? ''}`}
    />
  );
}

// Next.js Link (lazy re-export to avoid import conflict)
function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const NextLink = require('next/link').default;
  return <NextLink href={href} className={className}>{children}</NextLink>;
}
