'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HR_STATUS_MAP, type HrEmployeeStatus, type HrSnapshotDelivery } from './hr-data'

export default function HrClient({
  snapshot,
}: {
  snapshot: HrSnapshotDelivery
}) {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [department, setDepartment] = useState<string>('all')
  const [status, setStatus] = useState<HrEmployeeStatus | 'all'>('all')
  const [isRefreshing, startRefresh] = useTransition()

  const loweredKeyword = keyword.trim().toLowerCase()

  const filteredEmployees = useMemo(
    () =>
      snapshot.employees.filter((item) => {
        const matchesDepartment = department === 'all' || item.department === department
        const matchesStatus = status === 'all' || item.status === status
        const matchesKeyword =
          !loweredKeyword ||
          item.name.toLowerCase().includes(loweredKeyword) ||
          item.position.toLowerCase().includes(loweredKeyword) ||
          item.department.toLowerCase().includes(loweredKeyword) ||
          item.phone.includes(loweredKeyword) ||
          item.email.toLowerCase().includes(loweredKeyword)

        return matchesDepartment && matchesStatus && matchesKeyword
      }),
    [snapshot.employees, department, status, loweredKeyword]
  )

  const topDepartment = useMemo(() => {
    const sortedDepartments = Object.entries(snapshot.stats.departmentCounts).sort((left, right) => right[1] - left[1])
    return sortedDepartments[0]?.[0] ?? '—'
  }, [snapshot.stats.departmentCounts])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR 管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            员工档案 · 部门筛选 · Delivery {snapshot.deliveryMode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          {snapshot.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">员工总数</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.totalEmployees}</p>
          <p className="text-xs text-gray-400">在职 {snapshot.stats.active}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">试用人数</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.probation}</p>
          <p className="text-xs text-gray-400">离职 {snapshot.stats.resigned}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">部门数量</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.departments.length}</p>
          <p className="text-xs text-gray-400">覆盖组织单元</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">人员最多部门</p>
          <p className="mt-1 text-2xl font-bold">{topDepartment}</p>
          <p className="text-xs text-gray-400">按当前快照统计</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm font-medium text-gray-700">部门分布</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {snapshot.departments.map((item) => (
            <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {item} {snapshot.stats.departmentCounts[item] ?? 0}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索姓名、岗位、部门、手机号、邮箱"
          className="min-w-[260px] rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">全部部门</option>
          {snapshot.departments.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as HrEmployeeStatus | 'all')}
          className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">全部状态</option>
          {Object.entries(HR_STATUS_MAP).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">员工</th>
              <th className="px-4 py-3">部门</th>
              <th className="px-4 py-3">岗位</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">联系方式</th>
              <th className="px-4 py-3">入职时间</th>
              <th className="px-4 py-3">最近更新</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  当前筛选条件下没有 HR 员工数据
                </td>
              </tr>
            ) : (
              filteredEmployees.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.id}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.department}</td>
                  <td className="px-4 py-3 text-gray-600">{item.position}</td>
                  <td className={`px-4 py-3 ${HR_STATUS_MAP[item.status].tone}`}>
                    {HR_STATUS_MAP[item.status].label}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.phone}
                    <div className="text-xs text-gray-400">{item.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.joinDate}</td>
                  <td className="px-4 py-3 text-gray-600">{item.updatedAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
