'use client';

/**
 * SEO元标签组件
 * 自动生成页面所需的完整SEO元标签
 */

import { useEffect, useState } from 'react';

interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product' | 'business';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  locale?: 'zh_CN' | 'en_US';
  alternates?: Record<string, string>;
}

const DEFAULT_META = {
  siteName: '神机营',
  defaultTitle: '神机营 - 智能科技解决方案专家',
  defaultDescription: '神机营是专业的智能科技服务平台，提供EPC+O全流程服务、数字运动、招商加盟等多元化解决方案。',
  defaultOgImage: '/og-default.jpg',
  twitterSite: '@shenjiying',
};

const LOCALE_MAP: Record<string, string> = {
  'zh_CN': 'zh_CN',
  'en_US': 'en_US',
};

/**
 * SEO元标签组件
 */
export default function SEOMeta({
  title,
  description,
  keywords,
  ogImage,
  canonical,
  noindex = false,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  locale = 'zh_CN',
  alternates,
}: SEOMetaProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const pageTitle = title ? `${title} | ${DEFAULT_META.siteName}` : DEFAULT_META.defaultTitle;
  const pageDescription = description || DEFAULT_META.defaultDescription;
  const pageOgImage = ogImage || DEFAULT_META.defaultOgImage;
  const pageKeywords = keywords?.join(', ') || '';

  return (
    <>
      {/* 基础Meta */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {pageKeywords && <meta name="keywords" content={pageKeywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={DEFAULT_META.siteName} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageOgImage} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={LOCALE_MAP[locale]} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={DEFAULT_META.twitterSite} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageOgImage} />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Alternates */}
      {alternates && Object.entries(alternates).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </>
  );
}

/**
 * JSON-LD结构化数据注入组件
 */
export function JSONLD({ data }: { data: Record<string, unknown> }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * 组织结构化数据
 */
export function OrganizationJSONLD() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '神机营',
    alternateName: 'Shenjiying',
    url: 'https://www.shenjiying.com',
    logo: 'https://www.shenjiying.com/logo.png',
    description: '神机营是专业的智能科技服务平台',
    foundingDate: '2020',
    founder: {
      '@type': 'Person',
      name: '神机营创始人',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+86-400-888-8888',
      contactType: 'customer service',
      availableLanguage: ['Chinese', 'English'],
    },
    sameAs: [
      'https://www.linkedin.com/company/shenjiying',
      'https://weibo.com/shenjiying',
      'https://www.douyin.com/shenjiying',
    ],
  };

  return <JSONLD data={data} />;
}

/**
 * LocalBusiness结构化数据
 */
export function LocalBusinessJSONLD({
  name,
  address,
  phone,
  openingHours,
  geo,
}: {
  name?: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  phone?: string;
  openingHours?: string;
  geo?: { latitude: number; longitude: number };
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: name || '神机营',
    image: 'https://www.shenjiying.com/og-default.jpg',
    address: {
      '@type': 'PostalAddress',
      ...address,
    },
    ...(phone && { telephone: phone }),
    ...(openingHours && { openingHoursSpecification: openingHours }),
    ...(geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    }),
    priceRange: '¥¥¥',
    servesCuisine: 'Business Services',
  };

  return <JSONLD data={data} />;
}

/**
 * BreadcrumbList结构化数据
 */
export function BreadcrumbJSONLD({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JSONLD data={data} />;
}

/**
 * FAQPage结构化数据
 */
export function FAQJSONLD({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <JSONLD data={data} />;
}
