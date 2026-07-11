'use client';

import React, { useMemo, useState, useCallback } from 'react';

import {
  PageShell,
  StatusBadge,
  DataTable,
  Pagination,
  SearchFilterInput,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  Card,
  Dialog,
  Button,
  EmptyState,
  Tag,
  Rating,
  Select,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型 ----

type ProductCategory = 'class' | 'equipment' | 'supplement' | 'apparel' | 'accessory';
type ProductStatus = 'on_sale' | 'out_of_stock' | 'discontinued' | 'coming_soon';

interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subCategory: string;
  description: string;
  price: number;
  originalPrice: number;
  stock: number;
  soldCount: number;
  rating: number;
  reviewCount: number;
  status: ProductStatus;
  tags: string[];
  image: string;
  specs: { label: string; value: string }[];
  createdAt: string;
  updatedAt: string;
}

interface ProductDetail extends Product {
  variants: { name: string; price: number; stock: number }[];
  relatedProducts: { id: string; name: string; price: number }[];
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  class: '课程',
  equipment: '器械',
  supplement: '营养补剂',
  apparel: '服饰',
  accessory: '配件',
};

const SUBCATEGORIES: Record<ProductCategory, string[]> = {
  class: ['瑜伽', '力量训练', '有氧', '普拉提', '康复'],
  equipment: ['哑铃', '杠铃', '拉力器', '瑜伽垫', '健身球'],
  supplement: ['蛋白粉', '氨基酸', '维生素', '能量棒', '代餐'],
  apparel: ['运动上衣', '运动裤', '运动鞋', '泳装', '配件'],
  accessory: ['水壶', '毛巾', '手套', '护具', '背包'],
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  on_sale: '在售',
  out_of_stock: '缺货',
  discontinued: '已下架',
  coming_soon: '即将上架',
};

const STATUS_VARIANTS: Record<ProductStatus, 'success' | 'danger' | 'neutral' | 'warning'> = {
  on_sale: 'success',
  out_of_stock: 'danger',
  discontinued: 'neutral',
  coming_soon: 'warning',
};

// ---- Mock 数据 ----

const generateProducts = (count: number): Product[] => {
  const productNames: Record<ProductCategory, string[]> = {
    class: ['瑜伽初级课', 'HIIT 高强度间歇训练', '普拉提中级课', '力量训练基础', '有氧操课', '产后恢复课', '搏击操', '尊巴舞', '瑜伽高级课', '康复理疗课'],
    equipment: ['加厚瑜伽垫', '可调节哑铃套装', '弹力带套装', '健身球 65cm', '引体向上架', '壶铃 12kg', '泡沫轴', '跳绳专业款', '健腹轮', '阻力绳套装'],
    supplement: ['乳清蛋白粉 2磅', 'BCAA 支链氨基酸', '肌酸粉 500g', '左旋肉碱胶囊', '代餐奶昔', '维生素B族', '鱼油软胶囊', '蛋白棒 12支装', '电解质粉', '谷氨酰胺'],
    apparel: ['男士速干运动T恤', '女士瑜伽裤', '运动文胸', '跑步鞋 Pro', '连体泳衣', '运动短裤', '速干外套', '运动袜 3双装', '泳镜防雾', '运动帽'],
    accessory: ['运动水壶 750ml', '健身手套', '护膝护具', '运动毛巾套装', '运动背包 30L', '护腕绷带', '运动腰包', '手机臂包', '筋膜枪', '运动耳机'],
  };

  const products: Product[] = [];
  let id = 1;
  for (const category of Object.keys(productNames) as ProductCategory[]) {
    for (const name of productNames[category]) {
      const basePrice = category === 'class' ? 19900 + Math.floor(Math.random() * 40000) :
                        category === 'equipment' ? 9900 + Math.floor(Math.random() * 50000) :
                        category === 'supplement' ? 8900 + Math.floor(Math.random() * 30000) :
                        category === 'apparel' ? 8900 + Math.floor(Math.random() * 60000) :
                        2900 + Math.floor(Math.random() * 25000);
      const hasOriginalPrice = Math.random() > 0.6;
      const subCatgs = SUBCATEGORIES[category];
      const tags: string[] = [];
      if (Math.random() > 0.5) tags.push('热销');
      if (Math.random() > 0.7) tags.push('新品');
      if (Math.random() > 0.8) tags.push('限时折扣');
      if (Math.random() > 0.85) tags.push('会员专享');

      const statusRand = Math.random();
      const status: ProductStatus = statusRand < 0.7 ? 'on_sale' :
                                     statusRand < 0.85 ? 'out_of_stock' :
                                     statusRand < 0.95 ? 'discontinued' : 'coming_soon';

      products.push({
        id: `PROD-${String(id).padStart(4, '0')}`,
        name,
        category,
        subCategory: subCatgs[Math.floor(Math.random() * subCatgs.length)],
        description: `${name} - 适合各阶段健身爱好者，品质保证。`,
        price: hasOriginalPrice ? basePrice - Math.floor(basePrice * (Math.random() * 0.3 + 0.1)) : basePrice,
        originalPrice: hasOriginalPrice ? basePrice : basePrice,
        stock: status === 'out_of_stock' ? 0 : Math.floor(Math.random() * 200),
        soldCount: Math.floor(Math.random() * 500),
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 200),
        status,
        tags,
        image: 'https://via.placeholder.com/80',
        specs: [
          { label: '品牌', value: 'Shenjiying' },
          { label: '产地', value: '中国' },
          { label: '保质期', value: `${Math.floor(Math.random() * 24) + 12}个月` },
        ],
        createdAt: `2026-0${Math.floor(Math.random() * 5) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        updatedAt: `2026-06-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      });
      id++;
    }
  }
  return products;
};

const MOCK_PRODUCTS = generateProducts(50);

// ---- 工具函数 ----

function formatCurrency(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

function getDiscountPercent(original: number, current: number): number {
  if (original <= 0) return 0;
  return Math.round((1 - current / original) * 100);
}

// ---- 列定义 ----

const COLUMNS: DataTableColumn<Product>[] = [
  {
    key: 'name',
    header: '商品',
    render: (item) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            background: 'rgba(99,102,241,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {item.category === 'class' ? '🏋️' : item.category === 'equipment' ? '🔧' : item.category === 'supplement' ? '💊' : item.category === 'apparel' ? '👕' : '🎒'}
        </div>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            {item.tags.map((t) => (
              <Tag key={t} label={t} variant={t === '热销' ? 'danger' : t === '新品' ? 'success' : 'info'} size="xs" />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'category',
    header: '分类',
    render: (item) => (
      <div>
        <StatusBadge label={CATEGORY_LABELS[item.category]} variant="default" size="sm" />
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.subCategory}</div>
      </div>
    ),
  },
  {
    key: 'price',
    header: '价格',
    align: 'right',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>
          {formatCurrency(item.price)}
        </span>
        {item.originalPrice > item.price && (
          <div>
            <span style={{ fontSize: 11, color: '#64748b', textDecoration: 'line-through' }}>
              {formatCurrency(item.originalPrice)}
            </span>
            <span style={{ fontSize: 11, color: '#f87171', marginLeft: 4 }}>
              -{getDiscountPercent(item.originalPrice, item.price)}%
            </span>
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'stock',
    header: '库存',
    align: 'right',
    render: (item) => {
      const lowStock = item.stock > 0 && item.stock <= 10;
      return (
        <span style={{
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
          color: item.stock === 0 ? '#f87171' : lowStock ? '#fbbf24' : '#4ade80',
        }}>
          {item.stock === 0 ? '缺货' : item.stock}
        </span>
      );
    },
  },
  {
    key: 'rating',
    header: '评分',
    render: (item) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Rating value={item.rating} max={5} size="sm" readonly />
        <span style={{ fontSize: 12, color: '#94a3b8' }}>({item.reviewCount})</span>
      </div>
    ),
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge
        label={STATUS_LABELS[item.status]}
        variant={STATUS_VARIANTS[item.status]}
        size="sm"
      />
    ),
  },
  {
    key: 'soldCount',
    header: '销量',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>
        {item.soldCount.toLocaleString()}
      </span>
    ),
  },
];

// ---- 商品详情弹窗（模拟 CRUD） ----

function ProductDetailDialog({ productId, onClose }: { productId: string | null; onClose: () => void }) {
  const product = useMemo(() => {
    if (!productId) return null;
    return MOCK_PRODUCTS.find((p) => p.id === productId) ?? null;
  }, [productId]);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editStatus, setEditStatus] = useState<ProductStatus>('on_sale');
  const [saveMessage, setSaveMessage] = useState('');

  const openEdit = useCallback(() => {
    if (!product) return;
    setEditName(product.name);
    setEditPrice(product.price);
    setEditStock(product.stock);
    setEditStatus(product.status);
    setEditMode(true);
    setSaveMessage('');
  }, [product]);

  const handleSave = useCallback(() => {
    setSaveMessage('✅ 商品信息已成功更新！');
    setTimeout(() => {
      setEditMode(false);
      setSaveMessage('');
    }, 1500);
  }, []);

  if (!product) return null;

  return (
    <Dialog
      open={!!productId}
      onClose={onClose}
      title={editMode ? '编辑商品' : `商品详情 · ${product.name}`}
    >
      <div style={{ padding: '0 4px' }}>
        {saveMessage && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.2)',
            color: '#4ade80',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {saveMessage}
          </div>
        )}

        {editMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>商品名称</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(15,23,42,0.6)',
                  color: '#e2e8f0',
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>价格 (分)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: 'rgba(15,23,42,0.6)',
                    color: '#e2e8f0',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>库存</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: 'rgba(15,23,42,0.6)',
                    color: '#e2e8f0',
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>状态</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProductStatus)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(15,23,42,0.6)',
                  color: '#e2e8f0',
                  fontSize: 14,
                }}
              >
                <option value="on_sale">在售</option>
                <option value="out_of_stock">缺货</option>
                <option value="discontinued">已下架</option>
                <option value="coming_soon">即将上架</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="default" size="sm" onClick={() => setEditMode(false)}>取消</Button>
              <Button variant="primary" size="sm" onClick={handleSave}>保存修改</Button>
            </div>
          </div>
        ) : (
          <>
            {/* 基本信息 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                background: 'rgba(99,102,241,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                flexShrink: 0,
              }}>
                {product.category === 'class' ? '🏋️' : product.category === 'equipment' ? '🔧' : product.category === 'supplement' ? '💊' : product.category === 'apparel' ? '👕' : '🎒'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{product.name}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  <StatusBadge label={CATEGORY_LABELS[product.category]} variant="default" size="sm" />
                  <StatusBadge label={STATUS_LABELS[product.status]} variant={STATUS_VARIANTS[product.status]} size="sm" />
                  {product.tags.map((t) => (
                    <Tag key={t} label={t} variant={t === '热销' ? 'danger' : t === '新品' ? 'success' : 'info'} size="xs" />
                  ))}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa' }}>
                  {formatCurrency(product.price)}
                  {product.originalPrice > product.price && (
                    <span style={{ fontSize: 14, color: '#64748b', textDecoration: 'line-through', marginLeft: 8, fontWeight: 400 }}>
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 评分与销售 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ borderRadius: 8, background: 'rgba(30,41,59,0.4)', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>评分</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Rating value={product.rating} max={5} size="sm" readonly />
                  <span style={{ fontSize: 13, color: '#e2e8f0' }}>{product.rating}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{product.reviewCount} 条评价</div>
              </div>
              <div style={{ borderRadius: 8, background: 'rgba(30,41,59,0.4)', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>总销量</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>{product.soldCount.toLocaleString()}</div>
              </div>
              <div style={{ borderRadius: 8, background: 'rgba(30,41,59,0.4)', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>库存</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: product.stock === 0 ? '#f87171' : '#e2e8f0' }}>
                  {product.stock === 0 ? '缺货' : product.stock}
                </div>
              </div>
            </div>

            {/* 描述 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                商品描述
              </div>
              <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>{product.description}</div>
            </div>

            {/* 规格 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                规格参数
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {product.specs.map((spec, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(30,41,59,0.3)' }}>
                    <span style={{ fontSize: 13, color: '#94a3b8', minWidth: 50 }}>{spec.label}</span>
                    <span style={{ fontSize: 13, color: '#e2e8f0' }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 时间信息 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 12 }}>
              <span>创建时间: {product.createdAt}</span>
              <span>最近更新: {product.updatedAt}</span>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 16 }}>
              <Button variant="default" size="sm" onClick={openEdit}>✏️ 编辑</Button>
              <Button variant={product.status === 'on_sale' ? 'danger' : 'primary'} size="sm">
                {product.status === 'on_sale' ? '下架' : '上架'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

// ---- 页面 ----

export default function ProductsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // 搜索
  const searched = useMemo(() => {
    if (!searchTerm.trim()) return MOCK_PRODUCTS;
    const lower = searchTerm.toLowerCase();
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        CATEGORY_LABELS[p.category].includes(lower) ||
        p.subCategory.includes(lower) ||
        p.tags.some((t) => t.includes(lower)),
    );
  }, [searchTerm]);

  // 分类过滤
  const categoryFiltered = useMemo(
    () => (categoryFilter === 'ALL' ? searched : searched.filter((p) => p.category === categoryFilter)),
    [searched, categoryFilter],
  );

  // 状态过滤
  const finalFiltered = useMemo(
    () => (statusFilter === 'ALL' ? categoryFiltered : categoryFiltered.filter((p) => p.status === statusFilter)),
    [categoryFiltered, statusFilter],
  );

  // 排序
  const sortedItems = useSortedItems(finalFiltered, COLUMNS, sortConfig);

  // 分页
  const pagination = usePagination(sortedItems.length, 12);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 12,
    pagination.page * 12,
  );

  const handleRowClick = useCallback((item: Product) => {
    setSelectedProduct(item.id);
  }, []);

  // 统计
  const stats = useMemo(() => {
    const onSale = MOCK_PRODUCTS.filter((p) => p.status === 'on_sale').length;
    const outOfStock = MOCK_PRODUCTS.filter((p) => p.status === 'out_of_stock').length;
    const totalStock = MOCK_PRODUCTS.reduce((s, p) => s + p.stock, 0);
    const avgRating = MOCK_PRODUCTS.reduce((s, p) => s + p.rating, 0) / MOCK_PRODUCTS.length;
    return { total: MOCK_PRODUCTS.length, onSale, outOfStock, totalStock, avgRating: Math.round(avgRating * 10) / 10 };
  }, []);

  return (
    <PageShell
      title="商品管理"
      description="管理门店所有在售商品，支持分类浏览、多维筛选、数据排序及商品编辑。"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" size="sm" onClick={() => alert('新建商品表单')}>➕ 新建商品</Button>
        </div>
      }
    >
      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 10,
        marginBottom: 20,
      }}>
        {[
          { label: '总商品', value: String(stats.total), color: '#60a5fa' },
          { label: '在售', value: String(stats.onSale), color: '#4ade80' },
          { label: '缺货', value: String(stats.outOfStock), color: '#f87171' },
          { label: '总库存', value: stats.totalStock.toLocaleString(), color: '#a78bfa' },
          { label: '平均评分', value: String(stats.avgRating), color: '#facc15' },
        ].map((s) => (
          <div key={s.label} style={{
            borderRadius: 12,
            padding: 14,
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.14)',
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 搜索 + 视图切换 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索商品名称、分类、标签..."
          />
        </div>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'table' | 'grid')}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.6)',
            color: '#e2e8f0',
            fontSize: 13,
          }}
        >
          <option value="table">列表视图</option>
          <option value="grid">网格视图</option>
        </select>
      </div>

      {/* 分类过滤 */}
      <div style={{ marginBottom: 8 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部分类', count: searched.length },
            ...(['class', 'equipment', 'supplement', 'apparel', 'accessory'] as const).map(
              (cat) => ({
                key: cat,
                label: CATEGORY_LABELS[cat],
                count: searched.filter((p) => p.category === cat).length,
              }),
            ),
          ]}
          activeKey={categoryFilter}
          onChange={(key) => setCategoryFilter(key as ProductCategory | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 状态过滤 */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部状态', count: categoryFiltered.length },
            { key: 'on_sale', label: '在售', count: categoryFiltered.filter((p) => p.status === 'on_sale').length },
            { key: 'out_of_stock', label: '缺货', count: categoryFiltered.filter((p) => p.status === 'out_of_stock').length },
            { key: 'discontinued', label: '已下架', count: categoryFiltered.filter((p) => p.status === 'discontinued').length },
            { key: 'coming_soon', label: '即将上架', count: categoryFiltered.filter((p) => p.status === 'coming_soon').length },
          ]}
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key as ProductStatus | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 内容区域 */}
      {viewMode === 'table' ? (
        <>
          {pageItems.length > 0 ? (
            <DataTable
              columns={COLUMNS}
              rows={pageItems}
              rowKey={(item) => item.id}
              sort={sortConfig}
              onSortChange={setSortConfig}
              onRowClick={handleRowClick}
            />
          ) : (
            <EmptyState
              title="暂无商品"
              description={searchTerm ? `未找到匹配 "${searchTerm}" 的商品` : '暂无商品记录'}
            />
          )}
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {pageItems.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p.id)}
              style={{
                borderRadius: 12,
                padding: 16,
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid rgba(148,163,184,0.14)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: '100%',
                height: 100,
                borderRadius: 8,
                background: 'rgba(99,102,241,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                marginBottom: 12,
              }}>
                {p.category === 'class' ? '🏋️' : p.category === 'equipment' ? '🔧' : p.category === 'supplement' ? '💊' : p.category === 'apparel' ? '👕' : '🎒'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                {CATEGORY_LABELS[p.category]} · {p.subCategory}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#60a5fa' }}>
                  {formatCurrency(p.price)}
                </span>
                <StatusBadge
                  label={STATUS_LABELS[p.status]}
                  variant={STATUS_VARIANTS[p.status]}
                  size="sm"
                />
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {p.tags.map((t) => (
                  <Tag key={t} label={t} variant={t === '热销' ? 'danger' : t === '新品' ? 'success' : 'info'} size="xs" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {sortedItems.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={sortedItems.length}
            onPageChange={pagination.setPage}
          />
        </div>
      )}

      {/* 商品详情弹窗 */}
      <ProductDetailDialog productId={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </PageShell>
  );
}
