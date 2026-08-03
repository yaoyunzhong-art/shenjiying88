import { loadStockOperationsSnapshot, OS, OT } from './stock-operations-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatAmount(amount: number) {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

export default async function StockOperationsPage() {
  const snapshot = await loadStockOperationsSnapshot()
  const pendingCount = snapshot.operations.filter((item) => item.status === 'draft' || item.status === 'pending_approval').length
  const completedCount = snapshot.operations.filter((item) => item.status === 'completed').length
  const inCount = snapshot.operations.filter((item) => item.type.includes('in')).length
  const outCount = snapshot.operations.filter((item) => item.type.includes('out')).length
  const totalCost = snapshot.operations.reduce((sum, item) => sum + item.totalCost, 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">库存操作中心</h1>
          <p className="mt-1 text-sm text-slate-500">入库、出库、调拨、退货的结构化快照页</p>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">操作单总数</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{snapshot.operations.length}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">待处理</div>
            <div className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">入库 / 出库</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {inCount} / {outCount}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">库存变动金额</div>
            <div className="mt-2 text-2xl font-bold text-green-600">{formatAmount(totalCost)}</div>
          </div>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">操作单快照</h2>
            <div className="text-sm text-slate-500">已完成 {completedCount} 单</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">单号</th>
                  <th className="py-2 pr-4">日期</th>
                  <th className="py-2 pr-4">类型</th>
                  <th className="py-2 pr-4">状态</th>
                  <th className="py-2 pr-4">仓库</th>
                  <th className="py-2 pr-4">数量</th>
                  <th className="py-2 pr-4">金额</th>
                  <th className="py-2 pr-4">创建人</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.operations.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium text-slate-900">{item.refNo}</td>
                    <td className="py-2 pr-4">{item.date}</td>
                    <td className="py-2 pr-4">{OT[item.type]}</td>
                    <td className="py-2 pr-4">{OS[item.status]}</td>
                    <td className="py-2 pr-4">{item.warehouse}</td>
                    <td className="py-2 pr-4">{item.totalQty}</td>
                    <td className="py-2 pr-4 text-green-600">{formatAmount(item.totalCost)}</td>
                    <td className="py-2 pr-4">{item.creator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
    </div>
  )
}
