import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';

interface Article {
  id: string;
  title: string;
  category: string;
  tags: string[];
  views: number;
  updatedAt: string;
  bookmarked: boolean;
  content: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  articleCount: number;
}

const mockCategories: Category[] = [
  { id: 'cat-1', name: '会员服务', icon: '👤', articleCount: 24 },
  { id: 'cat-2', name: '收银操作', icon: '💰', articleCount: 18 },
  { id: 'cat-3', name: '设备问题', icon: '🖥️', articleCount: 15 },
  { id: 'cat-4', name: '营销活动', icon: '🎯', articleCount: 12 },
  { id: 'cat-5', name: '退货退款', icon: '↩️', articleCount: 20 },
  { id: 'cat-6', name: '系统操作', icon: '⚙️', articleCount: 16 },
];

const mockArticles: Article[] = [
  {
    id: 'art-001',
    title: '会员积分规则详解',
    category: '会员服务',
    tags: ['积分', '规则', '会员'],
    views: 1256,
    updatedAt: '2024-01-10',
    bookmarked: true,
    content: '会员积分规则详解...',
  },
  {
    id: 'art-002',
    title: 'POS机常见故障排查',
    category: '设备问题',
    tags: ['POS', '故障', '排查'],
    views: 892,
    updatedAt: '2024-01-12',
    bookmarked: false,
    content: 'POS机常见故障排查...',
  },
  {
    id: 'art-003',
    title: '优惠券核销流程',
    category: '营销活动',
    tags: ['优惠券', '核销', '营销'],
    views: 654,
    updatedAt: '2024-01-08',
    bookmarked: true,
    content: '优惠券核销流程...',
  },
  {
    id: 'art-004',
    title: '退款操作规范',
    category: '退货退款',
    tags: ['退款', '规范', '流程'],
    views: 1103,
    updatedAt: '2024-01-14',
    bookmarked: false,
    content: '退款操作规范...',
  },
  {
    id: 'art-005',
    title: '收银找零处理',
    category: '收银操作',
    tags: ['收银', '找零', '现金'],
    views: 445,
    updatedAt: '2024-01-05',
    bookmarked: false,
    content: '收银找零处理...',
  },
  {
    id: 'art-006',
    title: '会员等级权益说明',
    category: '会员服务',
    tags: ['会员', '等级', '权益'],
    views: 789,
    updatedAt: '2024-01-11',
    bookmarked: true,
    content: '会员等级权益说明...',
  },
];

export function KnowledgeBaseScreen() {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      searchText === '' ||
      article.title.toLowerCase().includes(searchText.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()));

    const matchesCategory = activeCategory === null || article.category === activeCategory;
    const matchesBookmark = !showBookmarks || article.bookmarked;

    return matchesSearch && matchesCategory && matchesBookmark;
  });

  const toggleBookmark = (id: string) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id ? { ...article, bookmarked: !article.bookmarked } : article
      )
    );
  };

  const handleArticlePress = (article: Article) => {
    console.log('Open article:', article.id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>知识库</Text>
        <Text style={styles.headerSubtitle}>客服知识中心</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索问题/关键词"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity
          style={[styles.bookmarkFilter, showBookmarks && styles.bookmarkFilterActive]}
          onPress={() => setShowBookmarks(!showBookmarks)}
        >
          <Text style={styles.bookmarkIcon}>🔖</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, activeCategory === null && styles.categoryChipActive]}
            onPress={() => setActiveCategory(null)}
          >
            <Text style={styles.categoryChipIcon}>📚</Text>
            <Text style={[styles.categoryChipText, activeCategory === null && styles.categoryChipTextActive]}>
              全部
            </Text>
          </TouchableOpacity>
          {mockCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, activeCategory === cat.name && styles.categoryChipActive]}
              onPress={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
            >
              <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryChipText,
                  activeCategory === cat.name && styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{mockArticles.length}</Text>
          <Text style={styles.quickStatLabel}>篇文档</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>
            {articles.filter((a) => a.bookmarked).length}
          </Text>
          <Text style={styles.quickStatLabel}>收藏</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>6</Text>
          <Text style={styles.quickStatLabel}>分类</Text>
        </View>
      </View>

      {/* Articles List */}
      <ScrollView style={styles.articleList} showsVerticalScrollIndicator={false}>
        {filteredArticles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => handleArticlePress(article)}
          >
            {/* Category Badge */}
            <View style={styles.articleCategory}>
              <Text style={styles.articleCategoryText}>{article.category}</Text>
            </View>

            {/* Title */}
            <Text style={styles.articleTitle}>{article.title}</Text>

            {/* Tags */}
            <View style={styles.articleTags}>
              {article.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.articleFooter}>
              <View style={styles.articleMeta}>
                <Text style={styles.articleViews}>👁️ {article.views}</Text>
                <Text style={styles.articleDate}>更新于 {article.updatedAt}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleBookmark(article.id)}>
                <Text style={styles.bookmarkIconLarge}>
                  {article.bookmarked ? '🔖' : '📑'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {filteredArticles.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>未找到相关文档</Text>
            <Text style={styles.emptyHint}>尝试其他关键词或分类</Text>
          </View>
        )}

        {/* Hot Articles Section */}
        {!showBookmarks && activeCategory === null && searchText === '' && (
          <View style={styles.hotSection}>
            <Text style={styles.sectionTitle}>🔥 热门文章</Text>
            {mockArticles
              .sort((a, b) => b.views - a.views)
              .slice(0, 3)
              .map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.hotArticleItem}
                  onPress={() => handleArticlePress(article)}
                >
                  <Text style={styles.hotArticleTitle}>{article.title}</Text>
                  <Text style={styles.hotArticleViews}>{article.views} 阅读</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionText}>意见反馈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>新建文档</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionText}>联系管理员</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6EE7B7',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookmarkFilter: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookmarkFilterActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  bookmarkIcon: {
    fontSize: 20,
  },
  categoriesWrapper: {
    paddingBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  articleList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  articleCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  articleCategoryText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  articleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#64748B',
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  articleViews: {
    fontSize: 12,
    color: '#64748B',
  },
  articleDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bookmarkIconLarge: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyHint: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  hotSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  hotArticleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  hotArticleTitle: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  hotArticleViews: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  actionIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#64748B',
  },
});
