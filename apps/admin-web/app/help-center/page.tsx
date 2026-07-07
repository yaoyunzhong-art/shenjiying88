import type { Metadata } from 'next';
import { getHelpArticles } from './help-center-data';
import { HelpCenterClient } from './help-center-client';

export const metadata: Metadata = {
  title: '帮助中心 - M5 指挥台',
  description: '平台操作指南、常见问题和技术文档。按分类浏览或搜索关键词快速定位帮助文档。',
};

export default function HelpCenterPage() {
  const articles = getHelpArticles();
  return <HelpCenterClient articles={articles} />;
}
