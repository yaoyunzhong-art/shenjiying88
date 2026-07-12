# 🚨 dispatch-378-P0-TREE (retry #3: 90min+ no commits)

> 升级: 连续3次验收脉冲零commit (pulse#389→#390→#391)
> 首次派出: pulse#390 06:33 | 本次派出: pulse#391 07:03
> 生存时间: 90min+ → **P0需人工干预**

---

## 🔴 问题: admin-web suppliers 4个真实test失败

**测试文件**: `apps/admin-web/app/suppliers/page.test.tsx`
**源码文件**: `apps/admin-web/app/suppliers/page.tsx`

### 失败用例 (逐行分析)

| 用例 | 行号 | 断言 | 🔍 page.tsx现状 |
|------|------|------|----------------|
| `应包含 supplier detail modal` | L154 | `src.includes('modal') \|\| src.includes('detail')` | ❌ page.tsx**无modal/detail功能** |

> 对单个供应商点击查看详情的弹窗。page.tsx只有表格展示，没有<b>点击行弹出详情modal</b>功能

| `应包含 audit trail info` | L178 | `src.includes('audit') \|\| src.includes('updatedAt')` | ❌ page.tsx没有审计信息 |
> 每个供应商记录需要有`audit`或`updatedAt`字段展示审计流水

| `应包含 bulk selection` | L142 | `src.includes('checkbox') \|\| src.includes('selectAll')` | ❌ page.tsx没有批量选择 |
> 表格行前面需要加入checkbox列，支持全选、批量操作

| `应包含 notes/remarks` | L170 | `src.includes('remark') \|\| src.includes('note')` | ❌ page.tsx的Supplier接口有`notes`字段但未在UI展示 |
> 表格列需增加notes列或详情弹窗展示备注

### 当前page.tsx已实现
- ✅ DataTable展示9列: name/code/category/status/rating/totalOrders/totalAmount/deliveryDays/contact
- ✅ 搜索过滤(SearchFilterInput)
- ✅ 状态Tab过滤
- ✅ 排序/分页
- ✅ 4个统计卡片

### 修复方案 (直接加源码里)

```tsx
// 1. 在buildColumns()最后加一列: notes
{key:'notes',title:'备注',dataKey:'notes',sortable:false,render:i=>i.notes?.length>10?i.notes.slice(0,10)+'…':i.notes||'-'}

// 2. 在component中加state: selectedSupplier, 加modal
const [selected,setSelected]=useState<Supplier|null>(null);

// 3. DataTable加onRowClick
items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig}
onRowClick={i=>setSelected(i)}  // <-- 新增

// 4. 表格列第一列加checkbox
// 在buildColumns返回数组最前面加:
{key:'_select',title:<input type="checkbox" onChange={e=>{/* selectAll */}}/>,render:i=><input type="checkbox"/>}

// 5. 加Detail Modal (在Pagination之后):
{selected && (
  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={()=>setSelected(null)}>
    <div style={{background:'#1e293b',borderRadius:16,padding:24,maxWidth:500,width:'100%',border:'1px solid rgba(148,163,184,0.18)'}} onClick={e=>e.stopPropagation()}>
      <h3>{selected.name}</h3>
      <p>编码: {selected.code} | 分类: {SC[selected.category]}</p>
      <p>联系人: {selected.contact} | 电话: {selected.phone}</p>
      <p>地址: {selected.address}</p>
      <p>备注: {selected.notes}</p>
      <p>最后更新: {selected.lastOrder}</p>
      <button onClick={()=>setSelected(null)} style={{marginTop:12,padding:'8px 16px',background:'#3b82f6',border:'none',borderRadius:8,color:'#fff',cursor:'pointer'}}>关闭</button>
    </div>
  </div>
)}
```

---

## ⏱️ 执行时限

- **30分钟内必须提交** → 下个脉冲(pulse#392 07:33)验收
- 若零commit → **P0升级为🔥FIRE(现场火灾)** 触发人工介入

## 验收标准

1. `pnpm test` 在 admin-web 中 suppliers 所有4条新增测试通过
2. TSC 不产生新的错误 (保持14/14)
3. 只修改 `apps/admin-web/app/suppliers/page.tsx`
