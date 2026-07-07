/**
 * H5联系客服页面 - Contact Page (H5端)
 * Phase-FP T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 功能: 联系客服、常见问题、在线留言
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  getMainContainerStyle,
  getCardStyle,
  getEmptyStateStyle,
  H5Header,
  H5NavBar,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_TEXT_MUTED,
  COLOR_ACCENT,
  COLOR_ACCENT_BG,
  COLOR_ACCENT_BORDER,
} from '../h5-style';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  { id: 'f1', question: '如何成为会员？', answer: '在门店消费满100元即可免费注册成为会员，享受积分返利等权益。' },
  { id: 'f2', question: '积分有什么用途？', answer: '积分可在积分商城兑换优惠券、礼品等，每100积分可抵扣1元。' },
  { id: 'f3', question: '优惠券如何使用？', answer: '在结算时选择可用优惠券，系统会自动抵扣相应金额。' },
  { id: 'f4', question: '如何申请退款？', answer: '请前往订单详情页申请退款，或联系门店工作人员协助处理。' },
  { id: 'f5', question: '会员卡丢失怎么办？', answer: '可凭注册手机号到门店补办会员卡，原卡积分会自动转移。' },
];

export default function H5ContactPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setSubmitted(true);
      setMessage('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <main style={getMainContainerStyle()}>
      {/* 头部 */}
      <H5Header title="联系客服" marginBottom={8}>
        <p style={{ fontSize: 13, color: COLOR_TEXT_SECONDARY }}>7x24小时为您提供服务</p>
      </H5Header>

      {/* 联系方式 */}
      <section style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {/* 热线电话 */}
          <div style={{ ...getCardStyle({ padding: 20 }), textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📞</div>
            <div style={{ fontSize: 13, color: COLOR_TEXT_SECONDARY, marginBottom: 4 }}>客服热线</div>
            <a href="tel:400-888-8888" style={{ fontSize: 16, fontWeight: 600, color: '#3b82f6', textDecoration: 'none' }}>
              400-888-8888
            </a>
            <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED, marginTop: 4 }}>工作时间 9:00-21:00</div>
          </div>

          {/* 在线客服 */}
          <div style={{ ...getCardStyle({ padding: 20 }), textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 13, color: COLOR_TEXT_SECONDARY, marginBottom: 4 }}>在线客服</div>
            <button
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#10b981',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              立即咨询
            </button>
            <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED, marginTop: 4 }}>平均响应 5分钟内</div>
          </div>

          {/* 邮箱 */}
          <div style={{ ...getCardStyle({ padding: 20 }), textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📧</div>
            <div style={{ fontSize: 13, color: COLOR_TEXT_SECONDARY, marginBottom: 4 }}>邮箱</div>
            <a href="mailto:service@shenjiying.com" style={{ fontSize: 14, fontWeight: 600, color: '#8b5cf6', textDecoration: 'none' }}>
              service@shenjiying.com
            </a>
          </div>

          {/* 微信 */}
          <div style={{ ...getCardStyle({ padding: 20 }), textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💕</div>
            <div style={{ fontSize: 13, color: COLOR_TEXT_SECONDARY, marginBottom: 4 }}>微信公众号</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>神机营</div>
            <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED, marginTop: 4 }}>公众号搜索</div>
          </div>
        </div>

        {/* 常见问题 */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: COLOR_TEXT_PRIMARY, marginBottom: 12 }}>常见问题</h2>
          <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden' }}>
            {FAQS.map((faq, idx) => (
              <div key={faq.id}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  style={{
                    width: '100%',
                    padding: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    borderBottom: idx < FAQS.length - 1 ? '1px solid rgba(148,163,184,0.08)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 14, color: '#e2e8f0', textAlign: 'left' }}>{faq.question}</span>
                  <span style={{ fontSize: 14, color: COLOR_TEXT_MUTED, transform: expandedFaq === faq.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                </button>
                {expandedFaq === faq.id && (
                  <div style={{ padding: '0 14px 14px', fontSize: 13, color: COLOR_TEXT_SECONDARY, lineHeight: 1.6 }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 在线留言 */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: COLOR_TEXT_PRIMARY, marginBottom: 12 }}>在线留言</h2>
          <form onSubmit={handleSubmit}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="请输入您的问题或建议..."
              rows={4}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(148,163,184,0.2)',
                color: COLOR_TEXT_PRIMARY,
                fontSize: 14,
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 12,
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                background: COLOR_ACCENT_BG,
                border: COLOR_ACCENT_BORDER,
                color: COLOR_ACCENT,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              提交留言
            </button>
            {submitted && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#4ade80', fontSize: 13, textAlign: 'center' }}>
                ✓ 留言已提交，我们将在24小时内回复
              </div>
            )}
          </form>
        </div>
      </section>

      <H5NavBar activeKey="me" />
    </main>
  );
}
