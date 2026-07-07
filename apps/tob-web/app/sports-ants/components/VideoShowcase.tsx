/**
 * 运动蚂蚁视频展示组件
 * BigAnts Video Showcase Component
 *
 * 支持品牌故事视频、客户案例视频、产品演示视频
 */

'use client';

import React, { useState } from 'react';
import { BigAntsColors, BigAntsRadius, BigAntsFonts, BigAntsSpacing, BigAntsTransitions } from '../lib/bigants-design';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  category: 'brand' | 'case' | 'product' | 'tutorial';
  views?: number;
}

interface VideoShowcaseProps {
  videos: VideoItem[];
  title?: string;
  subtitle?: string;
  maxDisplay?: number;
  onVideoClick?: (video: VideoItem) => void;
}

export default function VideoShowcase({
  videos,
  title = '视频中心',
  subtitle = '了解更多运动蚂蚁',
  maxDisplay = 6,
  onVideoClick,
}: VideoShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: '全部' },
    { id: 'brand', name: '品牌故事' },
    { id: 'case', name: '客户案例' },
    { id: 'product', name: '产品演示' },
    { id: 'tutorial', name: '操作指南' },
  ];

  const filteredVideos = selectedCategory === 'all'
    ? videos
    : videos.filter(v => v.category === selectedCategory);

  const displayVideos = filteredVideos.slice(0, maxDisplay);

  const handleVideoClick = (video: VideoItem) => {
    onVideoClick?.(video);
    // 触发视频播放事件
    window.open(`#video-${video.id}`, '_blank');
  };

  return (
    <div style={{ padding: `${BigAntsSpacing['4xl']} 0`, background: '#FFFFFF' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: `0 ${BigAntsSpacing.lg}` }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: BigAntsSpacing['2xl'] }}>
          <h2
            style={{
              fontFamily: BigAntsFonts.display,
              fontSize: '32px',
              fontWeight: 700,
              color: '#1A1A2E',
              marginBottom: BigAntsSpacing.sm,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '16px',
              color: '#666666',
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: BigAntsSpacing.sm,
            marginBottom: BigAntsSpacing['2xl'],
            flexWrap: 'wrap',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '10px 24px',
                background: selectedCategory === cat.id ? BigAntsColors.primary : '#F1F5F9',
                color: selectedCategory === cat.id ? '#FFFFFF' : '#666666',
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.full,
                border: 'none',
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: BigAntsSpacing.lg,
          }}
        >
          {displayVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => handleVideoClick(video)}
              onMouseEnter={() => setHoveredVideo(video.id)}
              onMouseLeave={() => setHoveredVideo(null)}
              style={{
                background: '#FFFFFF',
                borderRadius: BigAntsRadius.xl,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid #F1F5F9',
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.normal}`,
                transform: hoveredVideo === video.id ? 'translateY(-4px)' : 'none',
              }}
            >
              {/* Video Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  height: '200px',
                  background: `linear-gradient(135deg, #1A1A2E 0%, ${BigAntsColors.primary} 100%)`,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: hoveredVideo === video.id ? 0.7 : 1,
                    transition: `opacity ${BigAntsTransitions.fast}`,
                  }}
                />

                {/* Play Button Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: hoveredVideo === video.id ? 1 : 0.8,
                    transition: `opacity ${BigAntsTransitions.fast}`,
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.95)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '24px',
                        color: BigAntsColors.primary,
                        marginLeft: '4px',
                      }}
                    >
                      ▶
                    </span>
                  </div>
                </div>

                {/* Duration Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    padding: '4px 8px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '4px',
                  }}
                >
                  {video.duration}
                </div>

                {/* Category Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '4px 10px',
                    background: BigAntsColors.primary,
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                  }}
                >
                  {categories.find(c => c.id === video.category)?.name || video.category}
                </div>
              </div>

              {/* Video Info */}
              <div style={{ padding: BigAntsSpacing.lg }}>
                <h3
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1A1A2E',
                    marginBottom: BigAntsSpacing.sm,
                    lineHeight: 1.4,
                  }}
                >
                  {video.title}
                </h3>
                <p
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '13px',
                    color: '#666666',
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {video.description}
                </p>

                {/* Video Meta */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: BigAntsSpacing.md,
                    paddingTop: BigAntsSpacing.md,
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  {video.views && (
                    <span
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '12px',
                        color: '#999999',
                      }}
                    >
                      👁 {video.views.toLocaleString()} 次观看
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '12px',
                      color: BigAntsColors.primary,
                      fontWeight: 600,
                    }}
                  >
                    观看视频 →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View More */}
        {filteredVideos.length > maxDisplay && (
          <div style={{ textAlign: 'center', marginTop: BigAntsSpacing['2xl'] }}>
            <button
              style={{
                padding: '12px 32px',
                background: '#F1F5F9',
                color: '#1A1A2E',
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.full,
                border: 'none',
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E2E8F0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F1F5F9';
              }}
            >
              查看更多视频 ({filteredVideos.length - maxDisplay} 个)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
