/**
 * 门店详情页 — Store Detail Page (Next.js App Router Page)
 * 角色视角: 👔区域经理 / 👨‍💼运营
 * 功能: 门店详情查看、编辑、状态变更、删除
 * 类型: B-详情页 (含编辑/删除/状态流转)
 */
'use client';

import React, { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  DetailShell,
  InfoRow,
  StatusBadge,
  Button,
  DetailActionBar,
  DetailClosureBar,
  DescriptionList,
  EmptyState,
  useToast,
  ConfirmDialog,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
} from '@m5/ui';

// ---- 类型 ----

type StoreStatus = 'active' | 'inactive' | 'maintenance';
type StoreType = 'flagship' | 'standard' | 'community' | 'popup';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
}

interface Store {
  id: string;
  name: string;
  code: string;
  type: StoreType;
  address: string;
  city: string;
  district: string;
  phone: string;
  managerName: string;
  managerPhone: string;
  status: StoreStatus;
  staffCount: number;
  areaSqm: number;
  monthlyRevenue: number;
  monthlyTarget: number;
  monthlyOrders: number;
  openingDate: string;
  businessHours: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  staff: StaffMember[];
}

const STATUS_LABELS: Record<StoreStatus, string> = {
  active: '营业中',
  inactive: '已停业',
  maintenance: '维护中',
};

const STATUS_VARIANTS: Record<StoreStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  maintenance: 'warning',
};

const TYPE_LABELS: Record<StoreType, string> = {
  flagship: '旗舰店',
  standard: '标准店',
  community: '社区店',
  popup: '快闪店',
};

const STATUS_TRANSITIONS: Record<StoreStatus, StoreStatus[]> = {
  active: ['maintenance', 'inactive'],
  inactive: ['active'],
  maintenance: ['active', 'inactive'],
};

// ---- Mock 数据 ----

function generateMockStore(id: string): Store {
  const storeMap: Record<string, Store> = {
    's-001': {
      id: 's-001',
      name: '深圳南山旗舰店',
      code: 'SZ-NS-001',
      type: 'flagship',
      address: '深圳市南山区科技南路18号',
      city: '深圳市',
      district: '南山区',
      phone: '0755-88886666',
      managerName: '张伟强',
      managerPhone: '13800138001',
      status: 'active',
      staffCount: 18,
      areaSqm: 580,
      monthlyRevenue: 1850000,
      monthlyTarget: 2000000,
      monthlyOrders: 420,
      openingDate: '2021-03-15',
      businessHours: '09:00-22:00',
      description: '深圳南山旗舰店为品牌在华南地区最大的形象店，位于科技园核心商圈，毗邻多家头部科技企业总部，客群以商务白领及科技从业者为主。',
      createdAt: '2021-03-01T08:00:00Z',
      updatedAt: '2026-06-28T14:30:00Z',
      staff: [
        { id: 'emp-001', name: '张伟强', role: '店长', phone: '13800138001' },
        { id: 'emp-002', name: '李敏', role: '副店长', phone: '13800138002' },
        { id: 'emp-003', name: '王浩', role: '导购员', phone: '13800138003' },
        { id: 'emp-004', name: '陈雪', role: '收银员', phone: '13800138004' },
      ],
    },
    's-002': {
      id: 's-002',
      name: '北京朝阳标准店',
      code: 'BJ-CY-001',
      type: 'standard',
      address: '北京市朝阳区建国路88号',
      city: '北京市',
      district: '朝阳区',
      phone: '010-88889999',
      managerName: '刘建国',
      managerPhone: '13900139001',
      status: 'active',
      staffCount: 10,
      areaSqm: 320,
      monthlyRevenue: 980000,
      monthlyTarget: 1000000,
      monthlyOrders: 260,
      openingDate: '2022-06-01',
      businessHours: '10:00-21:30',
      description: '北京朝阳标准店位于CBD核心区域，周边商业配套成熟，客群以商务人士及中高端消费群体为主。',
      createdAt: '2022-05-20T08:00:00Z',
      updatedAt: '2026-06-27T10:15:00Z',
      staff: [
        { id: 'emp-005', name: '刘建国', role: '店长', phone: '13900139001' },
        { id: 'emp-006', name: '赵丽', role: '导购员', phone: '13900139002' },
      ],
    },
    's-003': {
      id: 's-003',
      name: '上海浦东社区店',
      code: 'SH-PD-001',
      type: 'community',
      address: '上海市浦东新区张杨路500号',
      city: '上海市',
      district: '浦东新区',
      phone: '021-66667777',
      managerName: '周明',
      managerPhone: '13700137001',
      status: 'maintenance',
      staffCount: 5,
      areaSqm: 150,
      monthlyRevenue: 350000,
      monthlyTarget: 400000,
      monthlyOrders: 95,
      openingDate: '2023-09-10',
      businessHours: '09:30-21:00',
      description: '上海浦东社区店服务于周边住宅小区居民，以社区便利零售和会员服务为核心卖点。',
      createdAt: '2023-09-01T08:00:00Z',
      updatedAt: '2026-06-26T09:00:00Z',
      staff: [
        { id: 'emp-007', name: '周明', role: '店长', phone: '13700137001' },
      ],
    },
  };

  return storeMap[id] || {
    id,
    name: `门店 ${id}`,
    code: `STORE-${id}`,
    type: 'standard',
    address: '示例地址',
    city: '深圳市',
    district: '南山区',
    phone: '0755-88880000',
    managerName: '管理员',
    managerPhone: '13800000000',
    status: 'active',
    staffCount: 8,
    areaSqm: 200,
    monthlyRevenue: 600000,
    monthlyTarget: 800000,
    monthlyOrders: 180,
    openingDate: '2024-01-01',
    businessHours: '09:00-22:00',
    description: '默认门店描述信息。',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2026-06-29T10:00:00Z',
    staff: [
      { id: 'emp-default', name: '管理员', role: '店长', phone: '13800000000' },
    ],
  };
}

// ---- 组件 ----

/** 营收达成率指示器 */
function RevenueIndicator({
  revenue,
  target,
}: {
  revenue: number;
  target: number;
}) {
  const rate = target > 0 ? Math.round((revenue / target) * 100) : 0;
  const color =
    rate >= 100 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600';
  const barColor =
    rate >= 100 ? 'bg-green-500' : rate >= 80 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">营收达成率</span>
        <span className={`font-semibold ${color}`}>{rate}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}

/** 金额格式化 */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

// ---- 主页面 ----

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [store, setStore] = useState<Store>(() => generateMockStore(id));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = useCallback(
    (newStatus: StoreStatus) => {
      if (newStatus === store.status) return;

      const transitionKey = `${store.status} -> ${newStatus}`;
      const transitionLabels: Record<string, string> = {
        'active -> maintenance': '维护中',
        'active -> inactive': '停业关闭',
        'maintenance -> active': '恢复营业',
        'maintenance -> inactive': '停业关闭',
        'inactive -> active': '重新开业',
      };

      setStore((prev) => ({
        ...prev,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }));

      toast.success(
        `门店状态已变更为「${STATUS_LABELS[newStatus]}」(${transitionLabels[transitionKey] || newStatus})`,
      );
    },
    [store.status, toast],
  );

  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    // 模拟删除请求
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      toast.success('门店已成功删除');
      router.push('/stores');
    }, 800);
  }, [router, toast]);

  const handleEdit = useCallback(() => {
    toast.info('跳转编辑页面');
    router.push(`/stores/${id}/edit`);
  }, [id, router, toast]);

  // ---- 基本信息 ----

  const basicInfoItems: DescriptionItem[] = [
    { label: '门店名称', value: store.name },
    { label: '门店编码', value: store.code },
    { label: '门店类型', value: TYPE_LABELS[store.type] },
    { label: '所在城市', value: `${store.city} ${store.district}` },
    { label: '详细地址', value: store.address },
    { label: '联系电话', value: store.phone },
    { label: '营业时间', value: store.businessHours },
    { label: '开业日期', value: store.openingDate },
    { label: '门店面积', value: `${store.areaSqm} ㎡` },
    { label: '门店状态', value: <StatusBadge label={STATUS_LABELS[store.status]} variant={STATUS_VARIANTS[store.status]} /> },
  ];

  // ---- 经营数据 ----

  const businessInfoItems: DescriptionItem[] = [
    { label: '月度营收', value: formatCurrency(store.monthlyRevenue) },
    { label: '月度目标', value: formatCurrency(store.monthlyTarget) },
    { label: '本月订单数', value: `${store.monthlyOrders} 单` },
    { label: '员工人数', value: `${store.staffCount} 人` },
    {
      label: '营收达成',
      value: <RevenueIndicator revenue={store.monthlyRevenue} target={store.monthlyTarget} />,
    },
  ];

  // ---- 负责人信息 ----

  const managerItems: DescriptionItem[] = [
    { label: '门店店长', value: store.managerName },
    { label: '店长电话', value: store.managerPhone },
  ];

  // ---- 状态流转定义 ----

  const currentStatusIndex = ['active', 'inactive', 'maintenance'].indexOf(store.status);

  const detailActions: DetailShellAction[] = [
    { key: 'edit', label: '编辑门店', onClick: handleEdit, variant: 'primary' },
    {
      key: 'delete',
      label: '删除门店',
      onClick: () => setShowDeleteConfirm(true),
      variant: 'danger',
    },
  ];

  const actionBarActions: DetailActionBarAction[] = STATUS_TRANSITIONS[store.status]?.map((nextStatus) => ({
    key: `transition-${nextStatus}`,
    label: `变更为「${STATUS_LABELS[nextStatus]}」`,
    onClick: () => handleStatusChange(nextStatus),
    variant: nextStatus === 'inactive' ? 'danger' : 'default',
  })) ?? [];

  const closureLinks: DetailClosureLink[] = [
    { key: 'back-to-stores', title: '返回门店列表', subtitle: '查看所有门店', href: '/stores' },
    { key: 'view-reports', title: '查看门店报表', subtitle: '经营数据分析', href: '/reports' },
  ];

  return (
    <>
      <DetailShell
        title={store.name}
        subtitle={`编码: ${store.code} | ${store.city}${store.district}`}
        // status badge removed — DetailShell doesn't natively render status
        actions={detailActions}
        breadcrumbs={[
          { label: '首页', href: '/dashboard' },
          { label: '门店管理', href: '/stores' },
          { label: store.name, href: `/stores/${store.id}` },
        ]}
      >
        {/* 基本信息 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">基本信息</h3>
          <DescriptionList items={basicInfoItems} columns={3} />
        </div>

        {/* 经营数据 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">经营数据</h3>
          <DescriptionList items={businessInfoItems} columns={3} />
        </div>

        {/* 负责人信息 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">负责人信息</h3>
          <DescriptionList items={managerItems} columns={2} />
        </div>

        {/* 门店描述 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">门店简介</h3>
          <p className="text-sm leading-relaxed text-gray-600">{store.description}</p>
        </div>

        {/* 员工列表 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            员工列表
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({store.staff.length} 人)
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    姓名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    角色
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    联系电话
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {store.staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {member.role}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {member.phone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DetailShell>

      {/* 底部操作栏 */}
      <DetailActionBar actions={actionBarActions} />

      {/* 导航链接 */}
      <DetailClosureBar links={closureLinks} />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="确认删除门店"
        message={`确定要删除「${store.name}」吗？删除后无法恢复。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        loading={isDeleting}
        variant="danger"
      />
    </>
  );
}
