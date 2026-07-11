// @ts-nocheck
'use client';

/**
 * 门店设备巡检 - Device Inspection Page
 * 角色: 🔧安监管理 / 🎮导玩员
 * 功能: 巡检计划、巡检记录、异常上报、设备台账
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

type InspStatus = 'pending' | 'passed' | 'failed' | 'warn';
type InspType = 'daily' | 'weekly' | 'monthly' | 'seasonal';

interface InspItem { id: string; date: string; device: string; location: string; type: InspType; inspector?: string; status: InspStatus; items: string[]; score: number; note: string; nextDate: string; }

const STATUS_MAP: Record<InspStatus,{l:string;v:'success'|'danger'|'warning'|'neutral'}> = { pending:{l:'待检查',v:'neutral'}, passed:{l:'通过',v:'success'}, failed:{l:'不通过',v:'danger'}, warn:{l:'需整改',v:'warning'} };
const TYPE_LABELS: Record<InspType,string> = { daily:'日检', weekly:'周检', monthly:'月检', seasonal:'季检' };
const CHECK_ITEMS = ['外观完好','运行正常','无异常噪音','散热正常','线路整齐','安全标识清晰','紧急停止可用','接地正常','清洁度','润滑状态'];

const devices = ['拳皇街机','赛车模拟器','投篮机','VR体验','娃娃机大','娃娃机小','跳舞机','射击狩猎','音乐鼓','保龄球','桌上冰球','飞镖机','扭蛋机','儿童乐园','抓鱼机'];
const locations = ['A区','B区','C区','D区','大厅','入口','二楼夹层'];

function generateInspects(): InspItem[] {
  const items: InspItem[] = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - Math.floor(Math.random()*30)*86400000);
    const itemCount = 3+Math.floor(Math.random()*8);
    const checkedItems = CHECK_ITEMS.slice(0, itemCount);
    const failedItems = Math.floor(Math.random()*3);
    const passedCount = checkedItems.length - failedItems;
    items.push({
      id: `INSP-${String(i+1).padStart(3,'0')}`,
      date: d.toISOString().split('T')[0],
      device: devices[Math.floor(Math.random()*devices.length)]!!,
      location: locations[Math.floor(Math.random()*locations.length)]!!,
      type: (['daily','daily','daily','daily','weekly','monthly','seasonal'] as InspType[])[Math.floor(Math.random()*7)]!!,
      inspector: ['张三','李四','王五','赵六','设备供应商'][Math.floor(Math.random()*5)]!!,
      status: failedItems > 1 ? 'failed' : failedItems > 0 ? 'warn' : 'passed',
      items: checkedItems,
      score: Math.round((passedCount/checkedItems.length)*100),
      note: failedItems > 1 ? `发现${failedItems}项不合格` : '',
      nextDate: new Date(d.getTime()+7*86400000).toISOString().split('T')[0],
    });
  }
  return items.sort((a,b)=>b.date.localeCompare(a.date));
}

const ALL_INSPECTS = generateInspects();

function buildColumns(): DataTableColumn<InspItem>[] {
  return [
    { key: 'date', title: '日期', dataKey: 'date', sortable: true },
    { key: 'device', title: '设备', dataKey: 'device', sortable: true },
    { key: 'location', title: '位置', dataKey: 'location', sortable: true },
    { key: 'type', title: '类型', sortable: true, sortValue: i=>i.type, render: i=>TYPE_LABELS[i.type]! },
    { key: 'inspector', title: '检查人', dataKey: 'inspector', sortable: true },
    { key: 'score', title: '评分', dataKey: 'score', sortable: true, align: 'right', render: i => <span style={{color:i.score>=90?'#22c55e':i.score>=70?'#eab308':'#ef4444',fontWeight:600}}>{i.score}%</span> },
    { key: 'status', title: '结果', sortable: true, sortValue: i=>i.status, render: i => <StatusBadge label={STATUS_MAP[i.status].l} variant={STATUS_MAP[i.status]!.v} size="sm" dot /> },
    { key: 'nextDate', title: '下次检查', dataKey: 'nextDate', sortable: true },
  ];
}

export default function DeviceInspectionPage() {
  const inspects = useMemo(() => ALL_INSPECTS, []);
  const [tab, setTab] = useState<'overview'|'records'>('records');

  const stats = useMemo(() => ({
    total: inspects.length, passed: inspects.filter(i=>i.status==='passed').length,
    failed: inspects.filter(i=>i.status==='failed').length, warn: inspects.filter(i=>i.status==='warn').length,
    avgScore: Math.round(inspects.reduce((s,i)=>s+i.score,0)/inspects.length),
    pending: inspects.filter(i=>i.status==='pending').length,
  }), [inspects]);

  const searchFields = useMemo<(keyof InspItem)[]>(()=>['device','location','inspector','note'],[]);
  const {searchTerm,setSearchTerm,filteredItems}=useSearchFilter(inspects,searchFields);
  const [statusFilter,setStatusFilter]=useState<string>('ALL');
  const statusFiltered=useMemo(()=>statusFilter==='ALL'?filteredItems:filteredItems.filter(i=>i.status===statusFilter),[filteredItems,statusFilter]);
  const [sortConfig,setSortConfig]=useState<DataTableSortConfig|null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=useSortedItems(statusFiltered,columns,sortConfig);
  const pagination=usePagination({initialPageSize:15});
  const pageItems=pagination.paginate(sorted);

  return (
    <main style={{maxWidth:1200,margin:'0 auto',padding:32}}>
      <PageShell title="设备巡检" subtitle="巡检计划·记录·异常上报">
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>巡检总数</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div><div style={{marginTop:4,fontSize:12,color:'#22c55e'}}>通过率: {((stats.passed/stats.total)*100).toFixed(0)}%</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>不通过</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{stats.failed}</div><div style={{marginTop:4,fontSize:12,color:'#fca5a5'}}>需整改: {stats.warn}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>平均评分</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:stats.avgScore>=90?'#22c55e':'#eab308'}}>{stats.avgScore}%</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>良好水平</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>待检查</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{stats.pending}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>需尽快安排</div></div>
        </div>

        <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索设备/位置/检查人..." />
        <div style={{marginTop:12}}><Tabs items={[
          {key:'ALL',label:'全部',count:filteredItems.length},
          ...(['passed','failed','warn','pending'] as InspStatus[]).map(s=>({key:s,label: STATUS_MAP[s]!.l,count:filteredItems.filter(i=>i.status===s).length})),
        ]} activeKey={statusFilter} onChange={setStatusFilter} variant="pills" size="sm" /></div>

        <div style={{marginTop:16,display:'flex',gap:10}}>
          <button style={btnStyle('#3b82f6','#93c5fd')}>➕ 新建巡检</button>
          <button style={btnStyle('#22c55e','#86efac')}>📥 导出报表</button>
        </div>

        <DataTable title={`巡检记录 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id} sort={sortConfig} onSortChange={setSortConfig} striped compact />
        <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
const btnStyle=(bg:string,color:string):React.CSSProperties=>({borderRadius:10,padding:'10px 18px',background:`${bg}22`,color,border:'none',cursor:'pointer',fontSize:14,fontWeight:600});
