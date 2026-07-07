/**
 * 运动蚂蚁企业控制台页面
 * BigAnts Enterprise Console
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import ConversionTracker from '../components/ConversionTracker';
import { BigAntsColors, BigAntsRadius, BigAntsShadows, BigAntsSpacing, BigAntsTransitions, BigAntsFonts } from '../lib/bigants-design';

// 模拟门店数据
const mockStores = [
  { id: '1', name: '北京朝阳店', address: '北京市朝阳区建国路88号', status: 'active', members: 156, monthlyActive: 1248 },
  { id: '2', name: '上海浦东店', address: '上海市浦东新区世纪大道100号', status: 'active', members: 203, monthlyActive: 1650 },
  { id: '3', name: '深圳南山店', address: '深圳市南山区科技园南区', status: 'active', members: 178, monthlyActive: 1420 },
  { id: '4', name: '广州天河店', address: '广州市天河区天河路383号', status: 'inactive', members: 0, monthlyActive: 0 },
];

// 模拟员工数据
const mockEmployees = [
  { id: '1', name: '张伟', phone: '138****1234', role: '店长', store: '北京朝阳店', status: 'active', joinDate: '2023-03-15' },
  { id: '2', name: '李娜', phone: '139****5678', role: '店员', store: '北京朝阳店', status: 'active', joinDate: '2023-06-20' },
  { id: '3', name: '王强', phone: '136****9012', role: '店长', store: '上海浦东店', status: 'active', joinDate: '2023-01-10' },
  { id: '4', name: '刘洋', phone: '137****3456', role: '店员', store: '上海浦东店', status: 'active', joinDate: '2023-08-05' },
  { id: '5', name: '陈静', phone: '135****7890', role: '店长', store: '深圳南山店', status: 'active', joinDate: '2023-02-28' },
  { id: '6', name: '赵磊', phone: '133****2345', role: '店员', store: '深圳南山店', status: 'inactive', joinDate: '2023-05-12' },
];

type TabType = 'dashboard' | 'stores' | 'employees' | 'finance' | 'marketing';

export default function ConsolePage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'stores':
        return <StoresContent stores={mockStores} />;
      case 'employees':
        return <EmployeesContent employees={mockEmployees} />;
      case 'finance':
        return <FinanceContent />;
      case 'marketing':
        return <MarketingContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <>
      <SEOMeta
        title="企业控制台 - 运动蚂蚁"
        description="管理您的门店、员工、营销活动"
      />

      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Header />

        {/* Page Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
            padding: `${BigAntsSpacing['2xl']} 0`,
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: `0 ${BigAntsSpacing.lg}` }}>
            <h1
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '28px',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: BigAntsSpacing.xs,
              }}
            >
              企业控制台
            </h1>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              欢迎回来，管理您的数字运动业务
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            position: 'sticky',
            top: '64px',
            zIndex: 100,
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: `0 ${BigAntsSpacing.lg}` }}>
            <div style={{ display: 'flex', gap: BigAntsSpacing.lg }}>
              {[
                { id: 'dashboard', label: '数据概览', icon: '📊' },
                { id: 'stores', label: '门店管理', icon: '🏪' },
                { id: 'employees', label: '员工管理', icon: '👥' },
                { id: 'finance', label: '财务对账', icon: '💰' },
                { id: 'marketing', label: '营销活动', icon: '📢' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 0',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? `2px solid ${BigAntsColors.primary}` : '2px solid transparent',
                    color: activeTab === tab.id ? BigAntsColors.primary : '#666666',
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: `all ${BigAntsTransitions.fast}`,
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: `${BigAntsSpacing.xl} ${BigAntsSpacing.lg}` }}>
          {renderTabContent()}
        </div>

        <FloatingContact />
        <Footer />
        <ConversionTracker page="console" />
      </div>
    </>
  );
}

// Dashboard Content
function DashboardContent() {
  const stats = [
    { label: '总门店数', value: '4', unit: '家', trend: '+2' },
    { label: '总会员数', value: '537', unit: '人', trend: '+12%' },
    { label: '月活跃用户', value: '4,318', unit: '人', trend: '+8%' },
    { label: '本月收入', value: '¥128,500', unit: '', trend: '+15%' },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: BigAntsSpacing.lg,
          marginBottom: BigAntsSpacing['2xl'],
        }}
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              padding: BigAntsSpacing.lg,
              background: '#FFFFFF',
              borderRadius: BigAntsRadius.lg,
              boxShadow: BigAntsShadows.sm,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: BigAntsSpacing.sm,
              }}
            >
              <span
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  color: '#666666',
                }}
              >
                {stat.label}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: '#07C160',
                  fontWeight: 600,
                }}
              >
                {stat.trend}
              </span>
            </div>
            <div
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '28px',
                fontWeight: 700,
                color: '#1A1A2E',
              }}
            >
              {stat.value}
              <span style={{ fontSize: '14px', color: '#999999', fontWeight: 400 }}>
                {stat.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div
        style={{
          padding: BigAntsSpacing.xl,
          background: '#FFFFFF',
          borderRadius: BigAntsRadius.lg,
          boxShadow: BigAntsShadows.sm,
        }}
      >
        <h3
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '16px',
            fontWeight: 700,
            color: '#1A1A2E',
            marginBottom: BigAntsSpacing.lg,
          }}
        >
          最近活动
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: BigAntsSpacing.md }}>
          {[
            { time: '今天 14:32', action: '新会员注册', detail: '王五 加入了 北京朝阳店' },
            { time: '今天 11:20', action: '活动参与', detail: '"周末减脂挑战" 参与人数 +15' },
            { time: '昨天 18:45', action: '订单完成', detail: '订单 #20240125 完成支付 ¥299' },
            { time: '昨天 10:15', action: '门店新增', detail: '广州天河店 已暂停运营' },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: BigAntsSpacing.md,
                padding: `${BigAntsSpacing.md} 0`,
                borderBottom: index < 3 ? '1px solid #F1F5F9' : 'none',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: BigAntsColors.primary,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    color: '#1A1A2E',
                    fontWeight: 600,
                  }}
                >
                  {item.action}
                </div>
                <div
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '13px',
                    color: '#666666',
                  }}
                >
                  {item.detail}
                </div>
              </div>
              <span
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '12px',
                  color: '#999999',
                }}
              >
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stores Content
function StoresContent({ stores }: { stores: typeof mockStores }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: BigAntsSpacing.xl,
        }}
      >
        <h2
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '18px',
            fontWeight: 700,
            color: '#1A1A2E',
          }}
        >
          门店列表 ({stores.length})
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            background: BigAntsColors.primary,
            color: '#FFFFFF',
            fontFamily: BigAntsFonts.chinese,
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: BigAntsRadius.md,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          + 添加门店
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: BigAntsSpacing.lg,
        }}
      >
        {stores.map((store) => (
          <div
            key={store.id}
            style={{
              padding: BigAntsSpacing.lg,
              background: '#FFFFFF',
              borderRadius: BigAntsRadius.lg,
              boxShadow: BigAntsShadows.sm,
              border: store.status === 'inactive' ? '1px dashed #CBD5E1' : '1px solid transparent',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: BigAntsSpacing.md,
              }}
            >
              <div>
                <h4
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1A1A2E',
                    marginBottom: '4px',
                  }}
                >
                  {store.name}
                </h4>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    background: store.status === 'active' ? '#07C16020' : '#CBD5E120',
                    color: store.status === 'active' ? '#07C160' : '#94A3B8',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: BigAntsRadius.sm,
                  }}
                >
                  {store.status === 'active' ? '营业中' : '已停业'}
                </span>
              </div>
              <span style={{ fontSize: '20px' }}>🏪</span>
            </div>

            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '13px',
                color: '#666666',
                marginBottom: BigAntsSpacing.md,
              }}
            >
              {store.address}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: BigAntsSpacing.sm,
                padding: BigAntsSpacing.md,
                background: '#F8FAFC',
                borderRadius: BigAntsRadius.md,
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: '#999999', marginBottom: '2px' }}>会员数</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A2E' }}>{store.members}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#999999', marginBottom: '2px' }}>月活跃</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A2E' }}>{store.monthlyActive}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: BigAntsSpacing.sm, marginTop: BigAntsSpacing.md }}>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#F1F5F9',
                  color: '#1A1A2E',
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: BigAntsRadius.md,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                编辑
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#F1F5F9',
                  color: '#1A1A2E',
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: BigAntsRadius.md,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                查看详情
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Store Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: BigAntsRadius.xl,
              padding: BigAntsSpacing['2xl'],
              maxWidth: '480px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '18px',
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: BigAntsSpacing.xl,
              }}
            >
              添加门店
            </h3>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                color: '#666666',
                textAlign: 'center',
                padding: BigAntsSpacing.xl,
              }}
            >
              门店添加功能开发中，请联系客服协助
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: BigAntsColors.primary,
                color: '#FFFFFF',
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.md,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Employees Content
function EmployeesContent({ employees }: { employees: typeof mockEmployees }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: BigAntsSpacing.xl,
        }}
      >
        <h2
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '18px',
            fontWeight: 700,
            color: '#1A1A2E',
          }}
        >
          员工列表 ({employees.length})
        </h2>
        <button
          style={{
            padding: '10px 20px',
            background: BigAntsColors.primary,
            color: '#FFFFFF',
            fontFamily: BigAntsFonts.chinese,
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: BigAntsRadius.md,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          + 添加员工
        </button>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: BigAntsRadius.lg,
          boxShadow: BigAntsShadows.sm,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: BigAntsFonts.chinese, fontSize: '13px', fontWeight: 600, color: '#666666' }}>姓名</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: BigAntsFonts.chinese, fontSize: '13px', fontWeight: 600, color: '#666666' }}>手机</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: BigAntsFonts.chinese, fontSize: '13px', fontWeight: 600, color: '#666666' }}>角色</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: BigAntsFonts.chinese, fontSize: '13px', fontWeight: 600, color: '#666666' }}>门店</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: BigAntsFonts.chinese, fontSize: '13px', fontWeight: 600, color: '#666666' }}>入职日期</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: BigAntsFonts.chinese, fontSize: '13px', fontWeight: 600, color: '#666666' }}>状态</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: BigAntsFonts.chinese, fontSize: '13px', fontWeight: 600, color: '#666666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontFamily: BigAntsFonts.chinese, fontSize: '14px', color: '#1A1A2E', fontWeight: 600 }}>
                  {employee.name}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: BigAntsFonts.chinese, fontSize: '14px', color: '#666666' }}>
                  {employee.phone}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: BigAntsFonts.chinese, fontSize: '14px', color: '#666666' }}>
                  {employee.role}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: BigAntsFonts.chinese, fontSize: '14px', color: '#666666' }}>
                  {employee.store}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: BigAntsFonts.chinese, fontSize: '14px', color: '#666666' }}>
                  {employee.joinDate}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: employee.status === 'active' ? '#07C16020' : '#CBD5E120',
                      color: employee.status === 'active' ? '#07C160' : '#94A3B8',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.sm,
                    }}
                  >
                    {employee.status === 'active' ? '在职' : '离职'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    style={{
                      padding: '4px 12px',
                      background: 'transparent',
                      color: BigAntsColors.primary,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.sm,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Finance Content (P1)
function FinanceContent() {
  return (
    <div
      style={{
        padding: BigAntsSpacing['3xl'],
        background: '#FFFFFF',
        borderRadius: BigAntsRadius.lg,
        boxShadow: BigAntsShadows.sm,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '64px', marginBottom: BigAntsSpacing.lg }}>💰</div>
      <h3
        style={{
          fontFamily: BigAntsFonts.chinese,
          fontSize: '20px',
          fontWeight: 700,
          color: '#1A1A2E',
          marginBottom: BigAntsSpacing.sm,
        }}
      >
        财务对账模块
      </h3>
      <p
        style={{
          fontFamily: BigAntsFonts.chinese,
          fontSize: '14px',
          color: '#666666',
          marginBottom: BigAntsSpacing.xl,
        }}
      >
        财务对账功能开发中，即将上线
      </p>
      <Link
        href="/sports-ants/contact?type=finance"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: BigAntsColors.primary,
          color: '#FFFFFF',
          fontFamily: BigAntsFonts.chinese,
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: BigAntsRadius.md,
          textDecoration: 'none',
        }}
      >
        咨询开通
      </Link>
    </div>
  );
}

// Marketing Content (P1)
function MarketingContent() {
  return (
    <div
      style={{
        padding: BigAntsSpacing['3xl'],
        background: '#FFFFFF',
        borderRadius: BigAntsRadius.lg,
        boxShadow: BigAntsShadows.sm,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '64px', marginBottom: BigAntsSpacing.lg }}>📢</div>
      <h3
        style={{
          fontFamily: BigAntsFonts.chinese,
          fontSize: '20px',
          fontWeight: 700,
          color: '#1A1A2E',
          marginBottom: BigAntsSpacing.sm,
        }}
      >
        营销活动模块
      </h3>
      <p
        style={{
          fontFamily: BigAntsFonts.chinese,
          fontSize: '14px',
          color: '#666666',
          marginBottom: BigAntsSpacing.xl,
        }}
      >
        营销活动管理功能开发中，即将上线
      </p>
      <Link
        href="/sports-ants/contact?type=marketing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: BigAntsColors.primary,
          color: '#FFFFFF',
          fontFamily: BigAntsFonts.chinese,
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: BigAntsRadius.md,
          textDecoration: 'none',
        }}
      >
        咨询开通
      </Link>
    </div>
  );
}
