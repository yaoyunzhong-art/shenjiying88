// ---- 帮助中心数据类型 ----

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: HelpCategoryId;
  tags: string[];
  status: 'published' | 'draft';
  author: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  helpfulCount: number;
}

export interface HelpCategory {
  id: HelpCategoryId;
  name: string;
  icon: string;
  description: string;
  articleCount: number;
  order: number;
}

export interface HelpFaqItem {
  id: string;
  question: string;
  answer: string;
  category: HelpCategoryId;
  order: number;
  isPopular: boolean;
}

export type HelpCategoryId =
  | 'getting-started'
  | 'account-management'
  | 'market-operations'
  | 'brand-management'
  | 'store-operations'
  | 'finance-settlement'
  | 'security-compliance'
  | 'api-integration'
  | 'troubleshooting';

// ---- 类别数据 ----

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'getting-started', name: '快速入门', icon: '🚀', description: '平台概述、基础操作指引和快速上手教程', articleCount: 6, order: 1 },
  { id: 'account-management', name: '账户管理', icon: '👤', description: '账户注册、权限配置和团队管理', articleCount: 5, order: 2 },
  { id: 'market-operations', name: '市场运营', icon: '🌐', description: '市场创建、配置和日常运营管理', articleCount: 7, order: 3 },
  { id: 'brand-management', name: '品牌管理', icon: '🏷️', description: '品牌入驻、商品管理和品牌运营', articleCount: 6, order: 4 },
  { id: 'store-operations', name: '门店运营', icon: '🏪', description: '门店管理、库存管理和店员管理', articleCount: 8, order: 5 },
  { id: 'finance-settlement', name: '财务结算', icon: '💰', description: '账单管理、结算周期和财务报表', articleCount: 4, order: 6 },
  { id: 'security-compliance', name: '安全合规', icon: '🔒', description: '安全策略、审计日志和数据合规', articleCount: 5, order: 7 },
  { id: 'api-integration', name: 'API 集成', icon: '🔌', description: 'API 文档、SDK 使用和集成指南', articleCount: 4, order: 8 },
  { id: 'troubleshooting', name: '故障排查', icon: '🔧', description: '常见问题排查和错误处理指南', articleCount: 6, order: 9 },
];

// ---- 文章数据 ----

export function getHelpArticles(): HelpArticle[] {
  return [
    {
      id: 'a001',
      title: 'M5 平台概述',
      content: 'M5 指挥台是一个面向多租户、多市场的零售管理平台，支持品牌管理、门店运营、财务结算和数据分析等核心功能。本平台采用微服务架构，支持高可用部署和弹性扩展。',
      category: 'getting-started',
      tags: ['概述', '平台介绍', '架构'],
      status: 'published',
      author: '产品团队',
      createdAt: '2026-01-15 09:00:00',
      updatedAt: '2026-06-01 10:30:00',
      viewCount: 2847,
      helpfulCount: 235,
    },
    {
      id: 'a002',
      title: '快速开始：5 分钟完成平台入驻',
      content: '本指南帮助新用户快速完成平台入驻流程：1. 注册账户并验证邮箱；2. 填写企业信息并提交资质审核；3. 选择服务套餐并完成支付；4. 创建首个市场或门店。',
      category: 'getting-started',
      tags: ['入驻', '快速开始', '注册'],
      status: 'published',
      author: '产品团队',
      createdAt: '2026-01-20 10:00:00',
      updatedAt: '2026-05-15 14:00:00',
      viewCount: 1953,
      helpfulCount: 178,
    },
    {
      id: 'a003',
      title: '角色权限体系说明',
      content: 'M5 平台采用 RBAC（基于角色的访问控制）模型。主要角色包括：平台管理员、租户管理员、品牌经理、门店经理、导购员和收银员。每个角色具有预配置的权限集合，平台管理员可以自定义角色权限。',
      category: 'account-management',
      tags: ['权限', '角色', 'RBAC'],
      status: 'published',
      author: '安全团队',
      createdAt: '2026-02-01 11:00:00',
      updatedAt: '2026-06-10 09:00:00',
      viewCount: 1582,
      helpfulCount: 142,
    },
    {
      id: 'a004',
      title: '创建和管理团队',
      content: '支持创建多个团队并分配不同角色。团队管理功能包括：邀请成员、设置角色、管理权限组和团队活动日志。',
      category: 'account-management',
      tags: ['团队', '组织', '成员管理'],
      status: 'published',
      author: '产品团队',
      createdAt: '2026-02-10 14:00:00',
      updatedAt: '2026-05-20 16:00:00',
      viewCount: 1124,
      helpfulCount: 98,
    },
    {
      id: 'a005',
      title: '创建和配置新市场',
      content: '市场是跨门店的管理单元。创建市场步骤：1. 填写市场基本信息（名称、区域、时区、货币）；2. 配置市场参数（税务规则、定价策略）；3. 关联品牌和门店；4. 激活市场。',
      category: 'market-operations',
      tags: ['市场', '配置', '创建'],
      status: 'published',
      author: '运营团队',
      createdAt: '2026-02-15 10:00:00',
      updatedAt: '2026-06-05 11:00:00',
      viewCount: 2034,
      helpfulCount: 189,
    },
    {
      id: 'a006',
      title: '市场数据分析与报表',
      content: '市场提供多维度的数据分析功能，包括：销售趋势分析、客流分析、商品动销率、促销效果评估。支持自定义报表导出（CSV/Excel/PDF）。',
      category: 'market-operations',
      tags: ['分析', '报表', '数据'],
      status: 'published',
      author: '数据团队',
      createdAt: '2026-03-01 09:00:00',
      updatedAt: '2026-06-08 15:00:00',
      viewCount: 876,
      helpfulCount: 67,
    },
    {
      id: 'a007',
      title: '品牌入驻流程',
      content: '品牌入驻标准流程：1. 提交品牌资质材料；2. 品牌信息审核（3个工作日内）；3. 签署品牌合作协议；4. 品牌上线配置（商品目录、定价策略、营销模板）。',
      category: 'brand-management',
      tags: ['品牌', '入驻', '审核'],
      status: 'published',
      author: '运营团队',
      createdAt: '2026-02-20 11:00:00',
      updatedAt: '2026-05-25 10:00:00',
      viewCount: 1654,
      helpfulCount: 156,
    },
    {
      id: 'a008',
      title: '商品管理操作指南',
      content: '商品管理功能包括：商品创建与编辑、批量导入/导出、分类管理、价格管理、库存管理和商品上下架管理。支持 SKU 级别的精细化管控。',
      category: 'brand-management',
      tags: ['商品', 'SKU', '管理'],
      status: 'published',
      author: '产品团队',
      createdAt: '2026-03-05 14:00:00',
      updatedAt: '2026-06-12 08:00:00',
      viewCount: 1328,
      helpfulCount: 112,
    },
    {
      id: 'a009',
      title: '门店日常运营管理',
      content: '门店运营功能涵盖：营业状态管理、店员排班、库存盘点、订单处理、客户服务。支持 PAD 端和 PC 端双端管理。',
      category: 'store-operations',
      tags: ['门店', '运营', '排班'],
      status: 'published',
      author: '运营团队',
      createdAt: '2026-03-10 10:00:00',
      updatedAt: '2026-06-01 12:00:00',
      viewCount: 2467,
      helpfulCount: 234,
    },
    {
      id: 'a010',
      title: '库存管理操作指南',
      content: '库存管理支持：入库管理、出库管理、库存盘点、库存预警、调拨管理。支持按门店/仓库级别查看库存实时数据。',
      category: 'store-operations',
      tags: ['库存', '入库', '出库'],
      status: 'published',
      author: '运营团队',
      createdAt: '2026-03-15 09:00:00',
      updatedAt: '2026-05-30 16:00:00',
      viewCount: 1892,
      helpfulCount: 167,
    },
    {
      id: 'a011',
      title: '结算周期和账单管理',
      content: '结算周期支持 T+1、T+7、T+30 三种模式。账单管理功能包括：账单生成、对账确认、结算执行、账单查询和历史记录。',
      category: 'finance-settlement',
      tags: ['结算', '账单', '财务'],
      status: 'published',
      author: '财务团队',
      createdAt: '2026-03-20 11:00:00',
      updatedAt: '2026-06-02 14:00:00',
      viewCount: 1765,
      helpfulCount: 143,
    },
    {
      id: 'a012',
      title: '审计日志使用指南',
      content: '审计日志记录所有关键操作轨迹，包括：用户操作、系统配置变更、数据访问记录。支持按时间范围、操作类型、用户等多维度查询和导出。',
      category: 'security-compliance',
      tags: ['审计', '日志', '合规'],
      status: 'published',
      author: '安全团队',
      createdAt: '2026-04-01 10:00:00',
      updatedAt: '2026-06-10 09:00:00',
      viewCount: 1234,
      helpfulCount: 89,
    },
    {
      id: 'a013',
      title: 'API 认证和鉴权',
      content: 'API 采用 OAuth 2.0 + JWT 认证机制。调用 API 需要先获取 access_token，然后在请求头中携带 Bearer token。Token 有效期为 2 小时，过期需刷新。',
      category: 'api-integration',
      tags: ['API', '认证', 'OAuth'],
      status: 'published',
      author: '开发者关系团队',
      createdAt: '2026-04-05 14:00:00',
      updatedAt: '2026-06-03 11:00:00',
      viewCount: 3487,
      helpfulCount: 312,
    },
    {
      id: 'a014',
      title: '常见错误码及解决方法',
      content: '常见 API 错误码大全：400 - 请求参数错误；401 - 认证失败；403 - 权限不足；404 - 资源不存在；429 - 请求频率超限；500 - 服务端内部错误。详细处理方法见各章节。',
      category: 'troubleshooting',
      tags: ['错误码', '故障', '排查'],
      status: 'published',
      author: '开发者关系团队',
      createdAt: '2026-04-10 15:00:00',
      updatedAt: '2026-06-07 10:00:00',
      viewCount: 5621,
      helpfulCount: 498,
    },
    {
      id: 'a015',
      title: '安全最佳实践（建设中）',
      content: '平台安全最佳实践覆盖：密码策略建议、多因素认证配置、API 访问控制、数据传输加密和安全事件响应流程。',
      category: 'security-compliance',
      tags: ['安全', '最佳实践', 'MFA'],
      status: 'draft',
      author: '安全团队',
      createdAt: '2026-05-01 09:00:00',
      updatedAt: '2026-06-13 16:00:00',
      viewCount: 342,
      helpfulCount: 28,
    },
    {
      id: 'a016',
      title: '门店 PAD 端使用手册',
      content: 'PAD 端专为门店店员设计，支持：客流接待、商品查询、库存查看、开单收银、会员管理等核心功能。本手册详细说明各功能模块的使用方法。',
      category: 'store-operations',
      tags: ['PAD', '门店', '手册'],
      status: 'published',
      author: '产品团队',
      createdAt: '2026-04-15 10:00:00',
      updatedAt: '2026-06-05 14:00:00',
      viewCount: 2134,
      helpfulCount: 187,
    },
    {
      id: 'a017',
      title: '促销活动创建指南',
      content: '创建促销活动流程：1. 选择活动类型（折扣/优惠券/返现/赠品）；2. 设置活动规则和目标商品；3. 配置预算和名额限制；4. 提交审核并发布。',
      category: 'market-operations',
      tags: ['促销', '活动', '营销'],
      status: 'published',
      author: '运营团队',
      createdAt: '2026-04-20 11:00:00',
      updatedAt: '2026-06-10 08:00:00',
      viewCount: 1456,
      helpfulCount: 123,
    },
    {
      id: 'a018',
      title: 'Webhook 配置指南',
      content: 'Webhook 用于实时接收平台事件通知。配置步骤：1. 创建 Webhook 端点；2. 选择订阅事件类型；3. 配置签名密钥；4. 验证端点可达性。支持事件重试机制。',
      category: 'api-integration',
      tags: ['Webhook', '回调', '事件'],
      status: 'draft',
      author: '开发者关系团队',
      createdAt: '2026-05-10 14:00:00',
      updatedAt: '2026-06-12 09:00:00',
      viewCount: 567,
      helpfulCount: 45,
    },
  ];
}

// ---- FAQ 数据 ----

export function getHelpFaqs(): HelpFaqItem[] {
  return [
    { id: 'f001', question: '如何重置账户密码？', answer: '在登录页面点击"忘记密码"，输入注册邮箱接收重置链接。如未收到邮件，请检查垃圾箱或联系平台管理员。', category: 'account-management', order: 1, isPopular: true },
    { id: 'f002', question: '创建市场后多久可以激活？', answer: '市场创建完成后即可激活，但需要至少关联一个已入驻的品牌和一个门店才能正式上线运营。', category: 'market-operations', order: 2, isPopular: true },
    { id: 'f003', question: '品牌入驻审核需要多长时间？', answer: '品牌资质审核通常在 3 个工作日内完成。提交完整准确的资质材料可以加速审核流程。', category: 'brand-management', order: 3, isPopular: true },
    { id: 'f004', question: '如何添加新门店员工？', answer: '在门店管理模块选择"员工管理"，点击"添加员工"，输入员工信息并分配角色（导购员/收银员/仓库管理员等）。', category: 'store-operations', order: 4, isPopular: true },
    { id: 'f005', question: '结算账单在哪里查看？', answer: '在财务结算模块选择"账单管理"，可按结算周期、门店或日期范围筛选查看。账单支持导出和打印。', category: 'finance-settlement', order: 5, isPopular: true },
    { id: 'f006', question: 'API 调用频率限制是多少？', answer: '基础套餐 API 调用限制为 1000 次/分钟。企业套餐可根据需求申请提升至 10000 次/分钟。超额请求将返回 429 状态码。', category: 'api-integration', order: 6, isPopular: true },
    { id: 'f007', question: '审计日志保留多久？', answer: '平台默认保留 180 天的审计日志。如需更长的保留期限，可在安全合规模块申请配置。', category: 'security-compliance', order: 7, isPopular: false },
    { id: 'f008', question: '多门店如何批量管理商品？', answer: '支持通过批量导入功能（CSV/Excel）管理多门店商品。在商品管理模块选择"批量导入"，按模板填写后上传。', category: 'store-operations', order: 8, isPopular: false },
    { id: 'f009', question: '如何配置多因素认证（MFA）？', answer: '在账户安全设置中启用 MFA，支持两种方式：短信验证码和 TOTP 认证器应用。建议企业用户强制启用。', category: 'account-management', order: 9, isPopular: false },
    { id: 'f010', question: '迁移到新平台的数据如何导入？', answer: '支持通过数据迁移工具导入历史数据，包括商品信息、会员数据和订单记录。详情请联系技术支持获取迁移模板和操作文档。', category: 'troubleshooting', order: 10, isPopular: false },
  ];
}

// ---- 辅助函数 ----

export function getCategoryName(categoryId: HelpCategoryId): string {
  const cat = HELP_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.name ?? categoryId;
}

export function filterArticlesByCategory(articles: HelpArticle[], category: HelpCategoryId | 'ALL'): HelpArticle[] {
  if (category === 'ALL') return articles;
  return articles.filter((a) => a.category === category);
}

export function filterArticlesByStatus(articles: HelpArticle[], status: 'published' | 'draft' | 'ALL'): HelpArticle[] {
  if (status === 'ALL') return articles;
  return articles.filter((a) => a.status === status);
}

export function searchArticles(articles: HelpArticle[], query: string): HelpArticle[] {
  if (!query.trim()) return articles;
  const q = query.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.author.toLowerCase().includes(q)
  );
}

export function getFaqsByCategory(faqs: HelpFaqItem[], category: HelpCategoryId | 'ALL'): HelpFaqItem[] {
  if (category === 'ALL') return faqs;
  return faqs.filter((f) => f.category === category);
}

export function getPopularFaqs(faqs: HelpFaqItem[]): HelpFaqItem[] {
  return faqs.filter((f) => f.isPopular).sort((a, b) => a.order - b.order);
}

export function computeArticleStats(articles: HelpArticle[]) {
  return {
    total: articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    draft: articles.filter((a) => a.status === 'draft').length,
    totalViews: articles.reduce((sum, a) => sum + a.viewCount, 0),
    totalHelpful: articles.reduce((sum, a) => sum + a.helpfulCount, 0),
  };
}
