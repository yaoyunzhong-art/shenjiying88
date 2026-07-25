'use client';
/**
 * 服务项目详情页 — V23 Phase 1
 * 路由: /store/[slug]/services/[id]
 * 角色: 🛒 C端消费者视角
 *
 * 功能:
 *   - 项目图片轮播 + 文字介绍
 *   - 价格 + 时长 + 适用人群
 *   - "立即预约"按钮 → 跳转预约页
 *   - 相关推荐（AI推荐其他项目）
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Tag,
  Rating,
  Skeleton,
  EmptyState,
  Carousel,
  type CarouselSlide,
} from '@m5/ui';

export const dynamic = 'force-dynamic';

// ============================================================
// 类型
// ============================================================

interface ServiceDetail {
  id: string;
  name: string;
  images: string[];
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  duration: number; // 分钟
  category: string;
  tags: string[];
  suitableFor: string[];
  highlights: string[];
  bookingCount: number;
  rating: number;
  reviewCount: number;
  storeSlug: string;
  storeName: string;
}

// ============================================================
// Mock 数据
// ============================================================

const MOCK_SERVICE_DETAILS: Record<string, ServiceDetail> = {
  'svc-1': {
    id: 'svc-1', name: '经典街机通玩',
    images: [
      'https://picsum.photos/seed/arcade1/800/500',
      'https://picsum.photos/seed/arcade2/800/500',
      'https://picsum.photos/seed/arcade3/800/500',
    ],
    description: '百余台经典街机，从拳皇98到街霸2，重温童年记忆。',
    longDescription: '神机营经典街机通玩区拥有超过100台复古街机和现代电玩设备。从经典的拳皇98、街霸2、合金弹头，到最新的太鼓达人、舞萌等音乐节奏游戏，应有尽有。所有设备定期维护保养，保证最佳手感体验。不限时畅玩模式，让你沉浸在游戏世界中。',
    price: 68, originalPrice: 88, duration: 60, category: '街机',
    tags: ['热推', '经典', '不限时'],
    suitableFor: ['街机爱好者', '怀旧玩家', '朋友聚会', '亲子娱乐'],
    highlights: ['100+台设备', '经典街机手感', '定期维护保养', '不限时畅玩'],
    bookingCount: 12890, rating: 4.9, reviewCount: 2340,
    storeSlug: 'flagship-beijing', storeName: '神机营电竞乐园 · 北京旗舰店',
  },
  'svc-2': {
    id: 'svc-2', name: 'VR沉浸体验',
    images: [
      'https://picsum.photos/seed/vr1/800/500',
      'https://picsum.photos/seed/vr2/800/500',
      'https://picsum.photos/seed/vr3/800/500',
    ],
    description: '最新PS VR2、Quest 3设备，身临其境的沉浸式体验。',
    longDescription: '配备最新一代VR设备，包括PS VR2和Meta Quest 3，提供超过50款精选VR游戏和体验项目。从惊险刺激的过山车，到沉浸式密室逃脱，再到健身拳击训练，各种类型一应俱全。专业工作人员全程指导，即使第一次体验也能快速上手。',
    price: 98, originalPrice: 128, duration: 45, category: 'VR',
    tags: ['科技', '新品', '沉浸'],
    suitableFor: ['科技爱好者', '家庭娱乐', '情侣约会', '学生党'],
    highlights: ['最新PS VR2 & Quest 3', '50+游戏选择', '专业指导', '私密独立空间'],
    bookingCount: 8921, rating: 4.7, reviewCount: 1520,
    storeSlug: 'flagship-beijing', storeName: '神机营电竞乐园 · 北京旗舰店',
  },
  'svc-3': {
    id: 'svc-3', name: '台球畅打',
    images: [
      'https://picsum.photos/seed/pool1/800/500',
      'https://picsum.photos/seed/pool2/800/500',
    ],
    description: '专业级台球桌，舒适击球环境，适合休闲和竞技。',
    longDescription: '配备6张专业比赛级台球桌，采用国际标准尺寸和顶级台呢。独立灯光设计确保每个角度都有最佳照度。提供中式八球、美式九球等多种玩法。配有专业记分系统和休息区，无论休闲娱乐还是竞技比赛，都能享受极致体验。',
    price: 48, duration: 60, category: '台球',
    tags: ['经典', '社交', '竞技'],
    suitableFor: ['台球爱好者', '朋友切磋', '商务休闲', '比赛训练'],
    highlights: ['专业比赛级球桌', '中式&美式可选', '独立灯光系统', '休息区配套'],
    bookingCount: 5678, rating: 4.6, reviewCount: 890,
    storeSlug: 'flagship-beijing', storeName: '神机营电竞乐园 · 北京旗舰店',
  },
  'svc-4': {
    id: 'svc-4', name: '卡丁车竞速',
    images: [
      'https://picsum.photos/seed/kart1/800/500',
      'https://picsum.photos/seed/kart2/800/500',
      'https://picsum.photos/seed/kart3/800/500',
    ],
    description: '室内专业卡丁车赛道，感受速度与激情的碰撞。',
    longDescription: '神机营室内卡丁车赛道全长200米，含10个弯道，采用意大利进口电动卡丁车。支持竞速模式和计时模式，实时排名系统让你与朋友一较高下。配备全套安全装备和赛前培训，新手也能安心享受驾驶乐趣。',
    price: 128, originalPrice: 168, duration: 30, category: '卡丁车',
    tags: ['刺激', '人气', '竞速'],
    suitableFor: ['速度爱好者', '竞技玩家', '团队PK', '生日派对'],
    highlights: ['进口电动卡丁车', '200m专业赛道', '实时排名系统', '全套安全装备'],
    bookingCount: 4320, rating: 4.8, reviewCount: 678,
    storeSlug: 'flagship-beijing', storeName: '神机营电竞乐园 · 北京旗舰店',
  },
  'svc-5': {
    id: 'svc-5', name: '桌游派对',
    images: [
      'https://picsum.photos/seed/boardgame1/800/500',
      'https://picsum.photos/seed/boardgame2/800/500',
    ],
    description: '上百种精选桌游，专业DM带你玩转策略与社交。',
    longDescription: '神机营桌游区拥有超过200款正版桌游，涵盖策略、推理、卡牌、跑团等全品类。专业游戏主持人（DM）可以带您体验最热门的跑团冒险。舒适宽敞的游戏空间，私密包间可选，是北京最受欢迎的桌游聚会地之一。',
    price: 38, duration: 120, category: '桌游',
    tags: ['休闲', '社交', '长时'],
    suitableFor: ['桌游爱好者', '公司团建', '周末聚会', '新手入门'],
    highlights: ['200+正版桌游', '专业DM带跑团', '私密包间可选', '饮品小食供应'],
    bookingCount: 3456, rating: 4.5, reviewCount: 567,
    storeSlug: 'flagship-beijing', storeName: '神机营电竞乐园 · 北京旗舰店',
  },
  'svc-6': {
    id: 'svc-6', name: '模拟射击体验',
    images: [
      'https://picsum.photos/seed/shooting1/800/500',
      'https://picsum.photos/seed/shooting2/800/500',
    ],
    description: '高仿真射击模拟器，真实后坐力反馈，沉浸式军事体验。',
    longDescription: '采用军用级模拟器技术，配备真实力反馈枪械装备，提供多种射击场景——从战术突入到狙击训练。专业教官现场指导，适合零基础体验者。支持多人联机对抗，是公司团建和团队竞技的热门项目。',
    price: 88, duration: 30, category: '模拟机',
    tags: ['刺激', '竞技', '团建'],
    suitableFor: ['射击爱好者', '军事迷', '公司团建', '团队对抗'],
    highlights: ['军用级模拟器', '真实力反馈', '多人联机', '专业教官指导'],
    bookingCount: 2123, rating: 4.7, reviewCount: 345,
    storeSlug: 'flagship-beijing', storeName: '神机营电竞乐园 · 北京旗舰店',
  },
};

// 相关推荐映射
const RECOMMENDATION_MAP: Record<string, string[]> = {
  'svc-1': ['svc-3', 'svc-6', 'svc-5'],
  'svc-2': ['svc-4', 'svc-6', 'svc-1'],
  'svc-3': ['svc-1', 'svc-5', 'svc-4'],
  'svc-4': ['svc-2', 'svc-6', 'svc-3'],
  'svc-5': ['svc-3', 'svc-1', 'svc-2'],
  'svc-6': ['svc-4', 'svc-1', 'svc-2'],
};

// ============================================================
// 组件
// ============================================================

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    // 模拟 API 加载: GET /api/storefront/store/:slug/services/:id
    const timer = setTimeout(() => {
      setService(MOCK_SERVICE_DETAILS[id] ?? null);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  // 图片轮播
  useEffect(() => {
    if (!service || service.images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % service.images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [service]);

  const handleBook = () => {
    router.push(`/store/${slug}/book?serviceId=${id}`);
  };

  // ---- 加载中 ----
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a' }}>
        <div style={{ height: 280, background: '#1e293b' }}>
          <Skeleton style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
          <div style={{ height: 200, marginBottom: 12, borderRadius: 12, background: '#1e293b' }}>
            <Skeleton style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </main>
    );
  }

  // ---- 不存在 ----
  if (!service) {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          title="项目不存在"
          description="未找到该项目信息"
          action={
            <Link href={`/store/${slug}`} style={{ textDecoration: 'none' }}>
              <Button variant="primary">返回门店首页</Button>
            </Link>
          }
        />
      </main>
    );
  }

  const recommendations = (RECOMMENDATION_MAP[id] ?? []).map((recId) => MOCK_SERVICE_DETAILS[recId]).filter(Boolean);

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: 120 }}>
      {/* ===== 图片轮播 ===== */}
      <section style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
        <div style={{
          width: '100%', height: '100%',
          background: `url(${service.images[currentImage]}) center/cover no-repeat`,
          transition: 'background-image 0.5s ease',
        }} />

        {/* 返回 */}
        <Link href={`/store/${slug}`} style={{
          position: 'absolute', top: 16, left: 16,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', fontSize: 20, color: '#f8fafc', zIndex: 10,
        }}>
          ←
        </Link>

        {/* 图片指示点 */}
        {service.images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {service.images.map((_, i) => (
              <div key={i} style={{
                width: i === currentImage ? 20 : 6, height: 6, borderRadius: 3,
                background: i === currentImage ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        )}

        {/* 渐变遮罩 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(transparent, #0f172a)',
        }} />
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>

        {/* ===== 基本信息 ===== */}
        <section style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>
                {service.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Rating value={service.rating} interactive={false} />
                <span style={{ fontSize: 14, color: '#fbbf24', fontWeight: 600 }}>{service.rating}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>({service.reviewCount}条评价)</span>
                <span style={{ fontSize: 12, color: '#475569' }}>|</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{service.bookingCount}次预约</span>
              </div>
            </div>
          </div>

          {/* 标签 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {service.tags.map((t) => (
              <Tag key={t} style={{
                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 8, color: '#fbbf24', fontSize: 11, padding: '3px 10px',
              }}>
                {t}
              </Tag>
            ))}
            <Tag style={{
              background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 8, color: '#a5b4fc', fontSize: 11, padding: '3px 10px',
            }}>
              {service.duration}分钟
            </Tag>
            <Tag style={{
              background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 8, color: '#34d399', fontSize: 11, padding: '3px 10px',
            }}>
              {service.category}
            </Tag>
          </div>

          {/* 简短描述 */}
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px' }}>
            {service.description}
          </p>

          {/* 价格卡片 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 16, borderRadius: 14,
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1a2744 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: 20,
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>体验价格</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24' }}>¥{service.price}</span>
                {service.originalPrice && (
                  <span style={{ fontSize: 14, color: '#64748b', textDecoration: 'line-through' }}>
                    ¥{service.originalPrice}
                  </span>
                )}
                <span style={{ fontSize: 13, color: '#94a3b8' }}>/{service.duration}分钟</span>
              </div>
            </div>
            <Button
              onClick={handleBook}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: 15,
                padding: '12px 28px', borderRadius: 12, height: 'auto',
              }}
            >
              立即预约
            </Button>
          </div>
        </section>

        {/* ===== 详细信息 ===== */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', margin: '0 0 12px' }}>
            📖 项目详情
          </h2>
          <div style={{
            padding: 16, borderRadius: 14,
            background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.08)',
          }}>
            <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8, margin: 0 }}>
              {service.longDescription}
            </p>
          </div>
        </section>

        {/* ===== 亮点 ===== */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', margin: '0 0 12px' }}>
            ✨ 项目亮点
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {service.highlights.map((h, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 10,
                background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.08)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>{h}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 适用人群 ===== */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', margin: '0 0 12px' }}>
            👥 适用人群
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {service.suitableFor.map((s, i) => (
              <Tag key={i} style={{
                background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 20, color: '#34d399', fontSize: 13, padding: '6px 14px',
              }}>
                {s}
              </Tag>
            ))}
          </div>
        </section>

        {/* ===== 相关推荐 ===== */}
        {recommendations.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', margin: '0 0 12px' }}>
              🤖 AI 智能推荐
            </h2>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/store/${slug}/services/${rec.id}`}
                  style={{ textDecoration: 'none', flexShrink: 0, width: 200, scrollSnapAlign: 'start' }}
                >
                  <div style={{
                    borderRadius: 14, overflow: 'hidden',
                    background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.08)',
                  }}>
                    <div style={{
                      width: '100%', height: 120,
                      background: `url(${rec.images[0]}) center/cover no-repeat`,
                    }} />
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                        {rec.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Rating value={rec.rating} interactive={false} />
                        <span style={{ fontSize: 11, color: '#fbbf24' }}>{rec.rating}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
                        ¥{rec.price}
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>/{rec.duration}分</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ===== 底部固定预约栏 ===== */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(15, 23, 42, 0.97)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        zIndex: 100,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>体验价格</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24' }}>¥{service.price}</span>
            {service.originalPrice && (
              <span style={{ fontSize: 12, color: '#64748b', textDecoration: 'line-through' }}>
                ¥{service.originalPrice}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={handleBook}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none', color: '#fff', fontWeight: 700, fontSize: 16,
            padding: '14px 32px', borderRadius: 14, height: 'auto',
          }}
        >
          立即预约
        </Button>
      </div>
    </main>
  );
}
