'use client';

/**
 * 品牌运营管理 - Brand Operations
 * 角色: 🏢总部管理 / 📢营销
 * 功能: 品牌列表、品牌详情、品牌活动、品牌分析
 */

import { useState, useMemo, useEffect } from 'react';

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Brands - 神机营' }

import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

type BrandStatus = 'active'|'inactive'|'pending';
type BrandCategory = 'game'|'food'|'merchandise'|'service'|'entertainment';

interface Brand { id:string; name:string; code:string; category:BrandCategory; status:BrandStatus; stores:number; revenue:number; margin:number; contractStart:string; contractEnd:string; contact:string; phone:string; description:string; products:number; rating:number; }

const BC: Record<BrandCategory,string> = { game:'游戏', food:'餐饮', merchandise:'商品', service:'服务', entertainment:'娱乐' };
const BS: Record<BrandStatus,{l:string;v:'success'|'danger'|'warning'}> = { active:{l:'合作中',v:'success'}, inactive:{l:'已终止',v:'danger'}, pending:{l:'洽谈中',v:'warning'} };
function fm(a:number):string{return`¥${a.toLocaleString('zh-CN',{minimumFractionDigits:2})}`;}

const brands: Brand[] = [
  { id:'B1', name:'SEGA', code:'SEGA-001', category:'game', status:'active', stores:8, revenue:456000, margin:62, contractStart:'2025-01-01', contractEnd:'2027-12-31', contact:'田中先生', phone:'+81-3-1234-5678', description:'日本知名游戏品牌', products:12, rating:4.8 },
  { id:'B2', name:'太鼓达人', code:'TAIKO-001', category:'game', status:'active', stores:6, revenue:320000, margin:58, contractStart:'2025-03-01', contractEnd:'2027-02-28', contact:'铃木', phone:'+81-3-8765-4321', description:'太鼓达人音乐游戏', products:8, rating:4.6 },
  { id:'B3', name:'孩之宝', code:'HASBRO-001', category:'merchandise', status:'active', stores:5, revenue:285000, margin:55, contractStart:'2025-06-01', contractEnd:'2028-05-31', contact:'王经理', phone:'021-8888-1111', description:'玩具品牌', products:20, rating:4.3 },
  { id:'B4', name:'美泰', code:'MATTEL-001', category:'merchandise', status:'active', stores:4, revenue:198000, margin:52, contractStart:'2025-04-01', contractEnd:'2027-03-31', contact:'李总', phone:'021-8888-2222', description:'芭比娃娃等知名品牌', products:15, rating:4.1 },
  { id:'B5', name:'可口可乐', code:'COKE-001', category:'food', status:'active', stores:12, revenue:680000, margin:48, contractStart:'2025-01-01', contractEnd:'2028-12-31', contact:'刘经理', phone:'010-8888-3333', description:'全球饮品品牌', products:6, rating:4.9 },
  { id:'B6', name:'乐事', code:'LAY-001', category:'food', status:'active', stores:10, revenue:240000, margin:42, contractStart:'2025-02-01', contractEnd:'2027-01-31', contact:'陈总', phone:'010-8888-4444', description:'休闲零食', products:4, rating:4.0 },
  { id:'B7', name:'索尼PlayStation', code:'PS-001', category:'entertainment', status:'pending', stores:2, revenue:0, margin:0, contractStart:'2026-08-01', contractEnd:'2029-07-31', contact:'佐藤', phone:'+81-3-9999-8888', description:'合作洽谈中', products:5, rating:0 },
  { id:'B8', name:'VR设备', code:'VR-001', category:'entertainment', status:'active', stores:3, revenue:156000, margin:65, contractStart:'2025-09-01', contractEnd:'2027-08-31', contact:'王总', phone:'0755-8888-5555', description:'VR体验设备', products:3, rating:4.5 },
  { id:'B9', name:'清洁服务商', code:'CLEAN-001', category:'service', status:'active', stores:12, revenue:96000, margin:38, contractStart:'2025-01-01', contractEnd:'2026-12-31', contact:'赵主管', phone:'010-8888-6666', description:'专业清洁服务', products:0, rating:4.2 },
  { id:'B10', name:'设备维护商', code:'MAINT-001', category:'service', status:'active', stores:10, revenue:120000, margin:45, contractStart:'2025-03-01', contractEnd:'2027-02-28', contact:'刘工', phone:'0755-8888-7777', description:'设备维修维护', products:0, rating:3.8 },
  { id:'B11', name:'元祖食品', code:'GANSO-001', category:'food', status:'inactive', stores:0, revenue:0, margin:0, contractStart:'2024-06-01', contractEnd:'2025-05-31', contact:'周经理', phone:'021-8888-9999', description:'已终止合作', products:0, rating:0 },
  { id:'B12', name:'优衣库', code:'UNIQLO-001', category:'merchandise', status:'pending', stores:1, revenue:0, margin:0, contractStart:'2026-09-01', contractEnd:'2028-08-31', contact:'日方代表', phone:'—', description:'洽谈中', products:0, rating:0 },
];

function buildColumns(): DataTableColumn<Brand>[] {
  return [
    {key:'name',title:'品牌名称',dataKey:'name',sortable:true,render:i=><span style={{color:'#93c5fd',fontWeight:600}}>{i.name}</span>},
    {key:'category',title:'品类',sortable:true,sortValue:i=>i.category,render:i=>BC[i.category]},
    {key:'status',title:'合作状态',sortable:true,sortValue:i=>i.status,render:i=><StatusBadge label={BS[i.status].l} variant={BS[i.status].v} size="sm" dot />},
    {key:'stores',title:'门店',dataKey:'stores',sortable:true,align:'right'},
    {key:'revenue',title:'营收',dataKey:'revenue',sortable:true,align:'right',render:i=><span style={{color:'#22c55e',fontWeight:600}}>{fm(i.revenue)}</span>},
    {key:'margin',title:'毛利率',dataKey:'margin',sortable:true,align:'right',render:i=><span style={{color:i.margin>55?'#22c55e':i.margin>40?'#eab308':'#ef4444'}}>{i.margin}%</span>},
    {key:'rating',title:'评分',dataKey:'rating',sortable:true,align:'right',render:i=><span>{i.rating>0?'⭐'.repeat(Math.round(i.rating)):'—'}</span>},
    {key:'contact',title:'联系人',dataKey:'contact',sortable:true},
    {key:'contractEnd',title:'合同到期',dataKey:'contractEnd',sortable:true,render:i=>{const days=Math.ceil((new Date(i.contractEnd).getTime()-Date.now())/86400000);return<span style={{color:days<90?'#ef4444':days<180?'#eab308':'#94a3b8'}}>{i.contractEnd}</span>;}},
  ];
}

export default function BrandsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Brand[] | null>(null);

  useEffect(() => {
    try {
      setData(brands);
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>加载中...</div></main>;
  if (error) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#ef4444', textAlign: 'center', padding: 64 }}>数据获取失败: {error}</div></main>;
  if (!data || data.length === 0) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>暂无数据</div></main>;

  const stats = useMemo(()=>({
    total:brands.length,active:brands.filter(b=>b.status==='active').length,
    pending:brands.filter(b=>b.status==='pending').length,
    revenue:brands.reduce((s,b)=>s+b.revenue,0),
    avgMargin:Math.round(brands.filter(b=>b.margin>0).reduce((s,b)=>s+b.margin,0)/Math.max(brands.filter(b=>b.margin>0).length,1)),
    stores:brands.reduce((s,b)=>s+b.stores,0),
  }),[]);

  const searchFields=useMemo<(keyof Brand)[]>(()=>['name','code','category','contact','description'],[]);
  const {searchTerm,setSearchTerm,filteredItems}=useSearchFilter(brands,searchFields);
  const [statusFilter,setStatusFilter]=useState<string>('ALL');
  const [catFilter,setCatFilter]=useState<string>('ALL');
  const catFiltered=useMemo(()=>catFilter==='ALL'?filteredItems:filteredItems.filter(b=>b.category===catFilter),[filteredItems,catFilter]);
  const statusFiltered=useMemo(()=>statusFilter==='ALL'?catFiltered:catFiltered.filter(b=>b.status===statusFilter),[catFiltered,statusFilter]);
  const [sortConfig,setSortConfig]=useState<DataTableSortConfig|null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=useSortedItems(statusFiltered,columns,sortConfig);
  const pagination=usePagination({initialPageSize:15});
  const pageItems=pagination.paginate(sorted);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="品牌运营管理" subtitle={`${stats.total}个品牌 · 年营收${fm(stats.revenue)} · ${stats.stores}家门店`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>品牌总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>合作中: {stats.active} · 洽谈: {stats.pending}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总营收</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#22c55e'}}>{fm(stats.revenue)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>平均毛利率: {stats.avgMargin}%</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>品牌分布</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{(Object.keys(BC) as BrandCategory[]).map(c=>brands.filter(b=>b.category===c).length).reduce((s,c)=>s+c,0)}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>{(Object.keys(BC) as BrandCategory[]).filter(c=>brands.filter(b=>b.category===c).length>0).map(c=>`${BC[c]}:${brands.filter(b=>b.category===c).length}`).join(' · ')}</div></div>
        </div>

        <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索品牌名称/编码/联系人..." />
        <div style={{marginTop:12,display:'flex',gap:16,flexWrap:'wrap'}}>
          <div><div style={{fontSize:12,color:'#94a3b8',marginBottom:6}}>品类</div><Tabs items={[{key:'ALL',label:'全部',count:filteredItems.length},...(Object.keys(BC) as BrandCategory[]).map(c=>({key:c,label:BC[c],count:filteredItems.filter(b=>b.category===c).length}))]} activeKey={catFilter} onChange={setCatFilter} variant="pills" size="sm" /></div>
          <div><div style={{fontSize:12,color:'#94a3b8',marginBottom:6}}>状态</div><Tabs items={[{key:'ALL',label:'全部',count:catFiltered.length},...(['active','inactive','pending'] as BrandStatus[]).map(s=>({key:s,label:BS[s].l,count:catFiltered.filter(b=>b.status===s).length}))]} activeKey={statusFilter} onChange={setStatusFilter} variant="pills" size="sm" /></div>
        </div>
        <DataTable title={`品牌 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
        <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const th: React.CSSProperties={textAlign:'left',padding:'10px 14px',color:'#94a3b8',fontSize:12,borderBottom:'1px solid rgba(148,163,184,0.18)'};
const td: React.CSSProperties={padding:'10px 14px',color:'#e2e8f0',fontSize:13,borderBottom:'1px solid rgba(148,163,184,0.1)'};
