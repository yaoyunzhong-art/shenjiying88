/**
 * 运动蚂蚁官网SEO元标签组件
 * BigAnts SEOMeta Component
 */

'use client';

import React from 'react';

interface SEOMetaProps {
  title: string;
  description: string;
  keywords?: string | string[];
  type?: string;
  image?: string;
  url?: string;
  canonical?: string;
}

export default function SEOMeta({
  title,
  description,
  keywords,
  type = 'website',
  image = 'https://www.bigants.net/og-image.jpg',
  url,
  canonical,
}: SEOMetaProps) {
  const fullTitle = title.includes('运动蚂蚁') ? title : `${title} - 运动蚂蚁 BigAnts`;
  const keywordsContent = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  const pageUrl = url || canonical || 'https://www.bigants.net';

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywordsContent && <meta name="keywords" content={keywordsContent} />}
      <link rel="canonical" href={canonical || pageUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="运动蚂蚁 BigAnts" />
      <meta property="og:locale" content="zh_CN" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@bigants" />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="运动蚂蚁 BigAnts" />
    </>
  );
}

// 品牌JSON-LD结构化数据

/**
 * 安全地将对象渲染为 JSON-LD 结构化数据<script>标签。
 * 使用 JSON.stringify + HTML 实体编码防止 XSS。
 * 所有外部调用应传入固定/硬编码数据对象。
 */
export function SafeJSONLD({ data }: { data: Record<string, unknown> }) {
  // JSON.stringify 自动转义特殊字符, 额外对 < > 做 Unicode 转义确保 XSS 安全
  const safeJsonLd = JSON.stringify(data)
    .replace(/</g, '<')
    .replace(/>/g, '>');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd }}
    />
  );
}

export function BigAntsOrganizationJSONLD() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '运动蚂蚁 BigAnts',
    url: 'https://www.bigants.net',
    logo: 'https://www.bigants.net/logo.png',
    description: '运动蚂蚁是专业的数字运动设备企业，集研发、生产、销售、服务于一体',
    address: {
      '@type': 'PostalAddress',
      addressLocality: '广州',
      addressCountry: 'CN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '400-888-8888',
      contactType: 'customer service',
    },
  };

  return <SafeJSONLD data={schema} />;
}
