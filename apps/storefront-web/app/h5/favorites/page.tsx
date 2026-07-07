/**
 * H5收藏页面 - Favorites Page (H5端)
 * Phase-FP T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 功能: 查看收藏的商品/门店
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { favoritesService, type FavoriteProduct, type FavoriteStore } from '../../../lib/favorites-service';
import {
  getMainContainerStyle,
  getCardStyle,
  getToggleChipStyle,
  getEmptyStateStyle,
  getEmptyStateEmojiStyle,
  H5Header,
  H5NavBar,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_TEXT_MUTED,
  COLOR_ACCENT,
} from '../h5-style';

export default function H5FavoritesPage() {
  const [tab, setTab] = useState<'products' | 'stores'>('products');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [stores, setStores] = useState<FavoriteStore[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    setLoading(true);
    const result = await favoritesService.getFavorites();
    if (result.success && result.data) {
      setProducts(result.data.products);
      setStores(result.data.stores);
    }
    setLoading(false);
  }

  return (
    <main style={getMainContainerStyle()}>
      {/* 头部 */}
      <H5Header title="我的收藏" marginBottom={16}>
        {/* Tab切换 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'products', label: '商品', count: products.length },
            { key: 'stores', label: '门店', count: stores.length },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as 'products' | 'stores')}
              style={getToggleChipStyle(tab === item.key, { flex: 1 })}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </H5Header>

      {/* 内容 */}
      <section style={{ padding: 16 }}>
        {tab === 'products' ? (
          // 商品收藏
          products.length === 0 ? (
            <div style={getEmptyStateStyle()}>
              <div style={getEmptyStateEmojiStyle()}>❤️</div>
              <div>暂无收藏商品</div>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                style={{
                  ...getCardStyle({ display: 'flex', gap: 12 }),
                  marginBottom: 12,
                }}
              >
                {/* 商品图 */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    flexShrink: 0,
                  }}
                />
                {/* 商品信息 */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLOR_TEXT_PRIMARY, marginBottom: 4 }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: COLOR_TEXT_MUTED, marginBottom: 6 }}>{product.storeName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#f59e0b' }}>¥{product.price}</span>
                    {product.originalPrice && (
                      <span style={{ fontSize: 12, color: COLOR_TEXT_MUTED, textDecoration: 'line-through' }}>¥{product.originalPrice}</span>
                    )}
                  </div>
                </div>
                {/* 操作 */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                  <button
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: 'rgba(99,102,241,0.2)',
                      border: '1px solid rgba(99,102,241,0.4)',
                      color: COLOR_ACCENT,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    加入购物车
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          // 门店收藏
          stores.length === 0 ? (
            <div style={getEmptyStateStyle()}>
              <div style={getEmptyStateEmojiStyle()}>🏪</div>
              <div>暂无收藏门店</div>
            </div>
          ) : (
            stores.map((store) => (
              <Link
                key={store.id}
                href={`/store-locator/${store.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={getCardStyle()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: COLOR_TEXT_PRIMARY }}>{store.name}</div>
                    <span style={{ fontSize: 18 }}>›</span>
                  </div>
                  <div style={{ fontSize: 13, color: COLOR_TEXT_SECONDARY, marginBottom: 8 }}>📍 {store.district} {store.address}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {store.features.map((f) => (
                      <span
                        key={f}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'rgba(99,102,241,0.1)',
                          color: COLOR_ACCENT,
                          fontSize: 11,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))
          )
        )}
      </section>

      <H5NavBar activeKey="me" />
    </main>
  );
}
