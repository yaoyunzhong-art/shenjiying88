'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { storeLocatorService, type StoreLocator } from '../../../lib/store-locator-service';
import {
  STATUS_INFO,
  getStoreCardStyle,
  getStatusBadgeStyle,
  getFeatureChipStyle,
  getContactActionButtonStyle,
  getBottomActionBarStyle,
} from '../../../lib/store-locator-style';

export default function StoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const [store, setStore] = useState<StoreLocator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStore();
  }, [storeId]);

  async function fetchStore() {
    setLoading(true);
    try {
      const result = await storeLocatorService.getStore(storeId);
      if (result.success && result.data) {
        setStore(result.data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ color: '#64748b', fontSize: 14 }}>加载中...</div>
      </main>
    );
  }

  if (!store) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
          <p style={{ color: '#64748b', marginBottom: 16 }}>门店不存在</p>
          <Link
            href="/store-locator"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(102, 126, 234, 0.2)',
              color: '#a5b4fc',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            返回门店列表
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: 100 }}>
      {/* 头部图片 */}
      <header style={{ position: 'relative', height: 280 }}>
        {store.imageUrl ? (
          <Image
            src={store.imageUrl}
            alt={store.storeName}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            }}
          />
        )}

        {/* 渐变遮罩 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 1), transparent)',
          }}
        />

        {/* 返回按钮 */}
        <Link
          href="/store-locator"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontSize: 18,
            color: '#f8fafc',
          }}
        >
          ←
        </Link>

        {/* 状态标签 */}
        <div style={getStatusBadgeStyle(store.status, 'md')}>
          {STATUS_INFO[store.status].text}
        </div>

        {/* 门店名称 */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
            {store.storeName}
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            {store.city} {store.district}
          </p>
        </div>
      </header>

      {/* 门店信息 */}
      <section style={{ padding: 20 }}>
        {/* 基础信息卡片 */}
        <div style={{ ...getStoreCardStyle(), padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
            基本信息
          </h2>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>门店地址</div>
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>{store.address}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🕐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>营业时间</div>
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>{store.businessHours}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18 }}>📞</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>联系电话</div>
              <a
                href={`tel:${store.phone}`}
                style={{ fontSize: 14, color: '#60a5fa', textDecoration: 'none' }}
              >
                {store.phone}
              </a>
            </div>
          </div>
        </div>

        {/* 特色服务 */}
        <div style={{ ...getStoreCardStyle(), padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
            特色服务
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {store.features.map((feature) => (
              <span key={feature} style={getFeatureChipStyle('comfortable')}>
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* 门店图片 */}
        <div style={{ ...getStoreCardStyle(), padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
            门店环境
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  borderRadius: 12,
                  background: 'rgba(15, 23, 42, 0.8)',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={`https://picsum.photos/seed/${store.id}-${i}/200/200`}
                  alt={`门店环境 ${i}`}
                  width={200}
                  height={200}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部操作栏 */}
      <div style={getBottomActionBarStyle()}>
        <a
          href={`tel:${store.phone}`}
          style={getContactActionButtonStyle('call', 'md')}
        >
          📞 电话咨询
        </a>
        <a
          href={`https://maps.apple.com/?q=${encodeURIComponent(store.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={getContactActionButtonStyle('navigate-primary', 'md')}
        >
          🗺️ 导航到店
        </a>
      </div>
    </main>
  );
}
