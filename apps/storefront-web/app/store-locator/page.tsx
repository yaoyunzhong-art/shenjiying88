'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { storeLocatorService, type StoreLocator } from '../../lib/store-locator-service';
import {
  STATUS_INFO,
  getCityButtonStyle,
  getStoreCardStyle,
  getStatusBadgeStyle,
  getFeatureChipStyle,
  getContactActionButtonStyle,
  getActionButtonRowStyle,
  getBottomNavItemStyle,
  filterStoreByKeyword,
} from '../../lib/store-locator-style';

export default function StoreLocatorPage() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreLocator[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    fetchStores();
  }, [selectedCity]);

  async function fetchStores() {
    setLoading(true);
    try {
      const result = await storeLocatorService.searchStores({
        city: selectedCity || undefined,
      });

      if (result.success && result.data) {
        setStores(result.data.stores);
        if (result.data.cities) {
          setCities(result.data.cities);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchStores();
  }

  const filteredStores = useMemo(
    () => filterStoreByKeyword(stores, keyword),
    [stores, keyword]
  );

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: 80 }}>
      {/* 头部搜索 */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '16px',
        }}
      >
        {/* Logo区域 */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
            门店搜索
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            查找离您最近的门店
          </p>
        </div>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索门店名称或地址..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                borderRadius: 12,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#f8fafc',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18,
              }}
            >
              🔍
            </span>
          </div>
        </form>

        {/* 城市筛选 */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => setSelectedCity('')}
            style={getCityButtonStyle(!selectedCity)}
          >
            全部城市
          </button>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              style={getCityButtonStyle(selectedCity === city)}
            >
              {city}
            </button>
          ))}
        </div>
      </header>

      {/* 门店列表 */}
      <section style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>加载中...</div>
        ) : filteredStores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
            <div style={{ fontSize: 15, color: '#94a3b8' }}>暂无门店数据</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filteredStores.map((store) => {
              return (
                <Link
                  key={store.id}
                  href={`/store-locator/${store.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <article style={getStoreCardStyle()}>
                    {/* 门店图片 */}
                    <div
                      style={{
                        position: 'relative',
                        height: 140,
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      }}
                    >
                      {store.imageUrl && (
                        <Image
                          src={store.imageUrl}
                          alt={store.storeName}
                          fill
                          style={{ objectFit: 'cover', opacity: 0.7 }}
                        />
                      )}
                      {/* 状态标签 */}
                      <div style={getStatusBadgeStyle(store.status, 'sm')}>
                        {STATUS_INFO[store.status].text}
                      </div>
                    </div>

                    {/* 门店信息 */}
                    <div style={{ padding: 16 }}>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#f8fafc',
                          margin: '0 0 8px',
                        }}
                      >
                        {store.storeName}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 14, color: '#64748b' }}>📍</span>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>
                          {store.city} {store.district} {store.address}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 14, color: '#64748b' }}>🕐</span>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>{store.businessHours}</span>
                      </div>

                      {/* 特色标签 */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {store.features.map((feature) => (
                          <span key={feature} style={getFeatureChipStyle('compact')}>
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* 底部操作 */}
                      <div style={getActionButtonRowStyle()}>
                        <a
                          href={`tel:${store.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          style={getContactActionButtonStyle('call', 'sm')}
                        >
                          📞 电话
                        </a>
                        <a
                          href={`https://maps.apple.com/?q=${encodeURIComponent(store.address)}`}
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={getContactActionButtonStyle('navigate', 'sm')}
                        >
                          🗺️ 导航
                        </a>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 底部导航 */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '12px 0',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        {[
          { icon: '🏠', label: '首页', href: '/' },
          { icon: '🔍', label: '门店', href: '/store-locator', active: true },
          { icon: '🎫', label: '卡券', href: '/coupons' },
          { icon: '👤', label: '我的', href: '/member-center' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={getBottomNavItemStyle(Boolean(item.active))}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 11 }}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
