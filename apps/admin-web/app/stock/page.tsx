'use client'

/**
 * 库存管理总览页 — Stock Overview
 *
 * 入口: 侧边栏「库存管理」
 * 功能: 查看库存总览、低库存预警、缺货、盘点
 *
 * 设计原则:
 * - 无 @m5/ui 依赖（满足任务约束）
 * - 4 统计卡片: 总库存 / 预警 / 缺货 / 盘点中
 * - 使用 Tailwind CSS class 与内联样式混合
 */

import { useState, useMemo, useCallback, useEffect } from 'react'

// ==================== 类型 ====================

export interface StockItem {
  id: string
  sku: string
  name: string
  unit: string
  category: string
  totalQty: number
  reservedQty: number
  availableQty: number
  lowStockThreshold: number
  unitPriceCents: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  lastUpdated: string
  warehouse: string
  version: number
}

export interface StockStats {
  totalItems: number
  totalQty: number
  warningCount: number
  outOfStockCount: number
  countingCount: number
  activeCount: number
  archivedCount: number
}

// ==================== 模拟数据 ====================

function generateMockStock(): StockItem[] {
  const names = [
    { name: '澳洲和牛 M9 西冷', category: '牛肉' },
    { name: '伊比利亚黑猪肋排', category: '猪肉' },
    { name: '北海道扇贝', category: '海鲜' },
    { name: '法国生蚝 N2', category: '海鲜' },
    { name: '新西兰帝王鲑', category: '海鲜' },
    { name: '松露油', category: '调味料' },
    { name: '藏红花', category: '调味料' },
    { name: '帕玛森芝士', category: '乳制品' },
    { name: '总统黄油', category: '乳制品' },
    { name: '无花果酱', category: '调味料' },
    { name: '加拿大龙虾', category: '海鲜' },
    { name: '西班牙火腿', category: '猪肉' },
    { name: '黑松露', category: '调味料' },
    { name: '意式香料面包', category: '烘焙' },
    { name: '整只烤鸭', category: '禽类' },
    { name: '安格斯牛腩', category: '牛肉' },
    { name: '深海鳕鱼', category: '海鲜' },
    { name: '有机鸡蛋（30枚）', category: '禽类' },
    { name: '冷冻薯条（10kg）', category: '冷冻' },
    { name: 'Mozzarella 芝士碎', category: '乳制品' },
    { name: '初榨橄榄油', category: '调味料' },
    { name: '蓝莓果酱', category: '调味料' },
    { name: '三文鱼刺身', category: '海鲜' },
    { name: '牛油果（箱装）', category: '果蔬' },
    { name: '圣女果（箱装）', category: '果蔬' },
  ]
  const warehouses = ['主仓库', '备用仓', '前厅', '冷冻库', '干货库']
  const units = ['kg', '箱', '袋', '瓶', '个', '条', '只', '盒']

  return names.map((n, i) => {
    const totalQty = Math.round(Math.random() * 200)
    const reservedQty = Math.round(totalQty * Math.random() * 0.4)
    const lowStockThreshold = 10 + Math.round(Math.random() * 30)
    const availableQty = totalQty - reservedQty
    const d = new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000)

    // 控制一些为低库存 / 缺货 / 盘点中
    let status: StockItem['status'] = 'ACTIVE'
    if (availableQty === 0) {
      status = 'INACTIVE'
    } else if (totalQty === 0) {
      status = 'ARCHIVED'
    }

    return {
      id: `STK-${String(i + 1).padStart(4, '0')}`,
      sku: `SKU-${String(10000 + i).slice(-5)}`,
      name: n.name,
      unit: units[Math.floor(Math.random() * units.length)],
      category: n.category,
      totalQty,
      reservedQty,
      availableQty,
      lowStockThreshold,
      unitPriceCents: Math.round((50 + Math.random() * 2000) * 100),
      status,
      lastUpdated: d.toISOString().split('T')[0],
      warehouse: warehouses[Math.floor(Math.random() * warehouses.length)],
      version: 1,
    }
  })
}

// ==================== 辅助函数 ====================

function formatPrice(cents: number): string {
  return `¥${(cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

// ==================== 主页面 ====================

export default function StockPage() {
  const [items] = useState<StockItem[]>(generateMockStock)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // 统计
  const stats: StockStats = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + i.totalQty, 0)
    const warningCount = items.filter(i => i.availableQty > 0 && i.availableQty <= i.lowStockThreshold).length
    const outOfStockCount = items.filter(i => i.availableQty === 0).length
    const countingCount = items.filter(i => i.status === 'ARCHIVED').length
    return {
      totalItems: items.length,
      totalQty,
      warningCount,
      outOfStockCount,
      countingCount,
      activeCount: items.filter(i => i.status === 'ACTIVE').length,
      archivedCount: items.filter(i => i.status === 'ARCHIVED').length,
    }
  }, [items])

  // 品类
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))].sort()
    return cats
  }, [items])

  // 筛选
  const filteredItems = useMemo(
    () => selectedCategory === 'ALL' ? items : items.filter(i => i.category === selectedCategory),
    [items, selectedCategory]
  )

  const handleItemAction = useCallback((item: StockItem) => {
    setSelectedItem(item)
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📦 库存总览</h1>
          <p className="text-sm text-gray-500 mt-1">查看仓库库存状况，及时处理低库存与缺货项</p>
        </div>
        <button
          onClick={() => showToast('success', '数据已刷新')}
          className="bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600 text-sm"
        >
          🔄 刷新
        </button>
      </div>

      {/* ====== 库存总览统计条 ====== */}
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          marginBottom: 20,
        }}
      >
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">总品项数</div>
          <div className="mt-1 text-2xl font-bold">{stats.totalItems}</div>
          <div className="mt-1 text-xs text-gray-400">总库存量: {stats.totalQty}</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 shadow-sm border border-amber-100">
          <div className="text-sm text-amber-600">⚠ 低库存预警</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.warningCount}</div>
          <div className="mt-1 text-xs text-amber-500">可用 &le; 阈值</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-100">
          <div className="text-sm text-red-600">✕ 缺货</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{stats.outOfStockCount}</div>
          <div className="mt-1 text-xs text-red-500">可用库存为 0</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-100">
          <div className="text-sm text-purple-600">📋 盘点中</div>
          <div className="mt-1 text-2xl font-bold text-purple-600">{stats.countingCount}</div>
          <div className="mt-1 text-xs text-purple-500">已归档/盘点</div>
        </div>
      </div>

      {/* 品类分类标签 */}
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">按品类筛选</div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCategory === 'ALL'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部 ({stats.totalItems})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat} ({items.filter(i => i.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* 库存列表 */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {selectedCategory !== 'ALL' ? `暂无 "${selectedCategory}" 类别的库存项` : '暂无库存数据'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2 text-left text-sm font-medium text-gray-600">SKU</th>
                <th className="border px-3 py-2 text-left text-sm font-medium text-gray-600">名称</th>
                <th className="border px-3 py-2 text-left text-sm font-medium text-gray-600">品类</th>
                <th className="border px-3 py-2 text-right text-sm font-medium text-gray-600">总量</th>
                <th className="border px-3 py-2 text-right text-sm font-medium text-gray-600">可用</th>
                <th className="border px-3 py-2 text-right text-sm font-medium text-gray-600">预留</th>
                <th className="border px-3 py-2 text-right text-sm font-medium text-gray-600">阈值</th>
                <th className="border px-3 py-2 text-right text-sm font-medium text-gray-600">单价</th>
                <th className="border px-3 py-2 text-center text-sm font-medium text-gray-600">状态</th>
                <th className="border px-3 py-2 text-center text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const isWarning = item.availableQty > 0 && item.availableQty <= item.lowStockThreshold
                const isOutOfStock = item.availableQty === 0
                return (
                  <tr
                    key={item.id}
                    className={
                      isOutOfStock ? 'bg-red-50' :
                      isWarning ? 'bg-amber-50' :
                      'hover:bg-gray-50'
                    }
                  >
                    <td className="border px-3 py-2 text-sm font-mono">{item.sku}</td>
                    <td className="border px-3 py-2 text-sm font-medium">{item.name}</td>
                    <td className="border px-3 py-2 text-sm">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="border px-3 py-2 text-sm text-right">{item.totalQty}</td>
                    <td className={`border px-3 py-2 text-sm text-right font-bold ${
                      isOutOfStock ? 'text-red-600' :
                      isWarning ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {item.availableQty}
                    </td>
                    <td className="border px-3 py-2 text-sm text-right">{item.reservedQty}</td>
                    <td className="border px-3 py-2 text-sm text-right text-gray-400">{item.lowStockThreshold}</td>
                    <td className="border px-3 py-2 text-sm text-right">{formatPrice(item.unitPriceCents)}</td>
                    <td className="border px-3 py-2 text-sm text-center">
                      <span className={
                        item.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs'
                          : item.status === 'ARCHIVED'
                            ? 'bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs'
                            : 'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs'
                      }>
                        {item.status === 'ACTIVE' ? '正常' : item.status === 'ARCHIVED' ? '已归档' : '停用'}
                      </span>
                    </td>
                    <td className="border px-3 py-2 text-sm text-center">
                      <button
                        onClick={() => handleItemAction(item)}
                        className="text-blue-500 hover:underline text-xs"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* 详情对话框 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">库存详情 · {selectedItem.sku}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">名称</span><span>{selectedItem.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">品类</span><span>{selectedItem.category}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">仓库</span><span>{selectedItem.warehouse}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">总库存</span><span>{selectedItem.totalQty} {selectedItem.unit}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">可用</span><span>{selectedItem.availableQty} {selectedItem.unit}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">预留</span><span>{selectedItem.reservedQty} {selectedItem.unit}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">低库存阈值</span><span>{selectedItem.lowStockThreshold}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">单价</span><span>{formatPrice(selectedItem.unitPriceCents)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">最近更新</span><span>{selectedItem.lastUpdated}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">版本</span><span>v{selectedItem.version}</span></div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
