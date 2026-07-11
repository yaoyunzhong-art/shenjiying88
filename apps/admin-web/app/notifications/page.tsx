'use client';

/**
 * 门店通知管理 - Store Notifications
 * 角色: 👔店长 / 📢营销
 * 功能: 通知列表、公告管理、系统消息、推送记录
 */

import { useState, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

type NotifType = 'announcement' | 'system' | 'alert' | 'task' | 'approval';
type NotifPriority = 'urgent' | 'high' | 'medium' | 'low';
type NotifStatus = 'unread' | 'read' | 'archived';

interface Notification { id: string; title: string; content: string; type: NotifType; priority: NotifPriority; status: NotifStatus; sender: string; createdAt: string; readAt: string | null; actionUrl: string; category: string; }

const NT: Record<NotifType, { l: string; v: 'success'|'warning'|'danger'|'info'|'neutral' }> = {
  announcement: { l: '公告', v: 'success' }, system: { l: '系统', v: 'neutral' },
  alert: { l: '告警', v: 'danger' }, task: { l: '任务', v: 'warning' }, approval: { l: '审批', v: 'info' },
};
const NP: Record<NotifPriority, { l: string; v: 'danger'|'warning'|'neutral' }> = {
  urgent: { l: '紧急', v: 'danger' }, high: { l: '高', v: 'warning' }, medium: { l: '中', v: 'neutral' }, low: { l: '低', v: 'neutral' },
};
const NS: Record<NotifStatus, { l: string; v: 'success'|'neutral'|'warning' }> = {
  unread: { l: '未读', v: 'success' }, read: { l: '已读', v: 'neutral' }, archived: { l: '已归档', v: 'warning' },
};

const notifications: Notification[] = [
  ...Array.from({length:28}, (_,i) => ({
    id: `NOTIF-${String(i+1).padStart(3,'0')}`,
    title: ['系统升级通知','设备故障告警','库存预警','新员工入职通知','审批待处理','促销活动提醒','交接班提醒','安全巡检通知','会员活动通知','月度报表已生成','薪资发放通知','设备保养提醒','门店卫生检查通知','新游戏上线通知','重要通知:营业时间调整','会员等级调整通知','消防检查通知','用电安全提醒','团建活动通知','供应商结算通知'][i%20]!,
    content: `这是${['系统升级通知','设备故障告警','库存预警','新员工入职通知','审批待处理','促销活动提醒','交接班提醒','安全巡检通知','会员活动通知','月度报表已生成'][i%10]}的详细内容，请及时查看处理。`,
    type: (['announcement','alert','alert','task','approval','announcement','task','alert','announcement','system','system','task','alert','announcement','announcement','system','alert','alert','announcement','system'] as NotifType[])[i%20]!,
    priority: (['urgent','high','medium','low'] as NotifPriority[])[i%4]!,
    status: (i < 8 ? 'unread' : i < 18 ? 'read' : 'archived') as NotifStatus,
    sender: ['系统','店长','运营中心','后台','管理员'][i%5]!,
    createdAt: new Date(Date.now()-i*3600000).toISOString(),
    readAt: i >= 8 ? new Date(Date.now()-i*3600000+3600000).toISOString() : null,
    actionUrl: ['/stores/staff','/stores/devices','/stores/inventory','/stores/orders','/approvals'][i%5]!,
    category: ['运营','设备','库存','人事','财务','营销','安全'][i%7]!,
  })),
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`;
  return d.toLocaleDateString('zh-CN');
}

function buildColumns(): DataTableColumn<Notification>[] {
  return [
    { key: 'status', title: '', width: '40px', sortable: true, sortValue: i => i.status,
      render: i => i.status === 'unread' ? <span style={{display:'inline-block',width:8,height:8,borderRadius:4,background:'#3b82f6'}} /> : null },
    { key: 'title', title: '标题', dataKey:'title', sortable:true,
      render: i => <span style={{color:i.status==='unread'?'#f1f5f9':'#94a3b8',fontWeight:i.status==='unread'?700:400}}>{i.title}</span> },
    { key: 'type', title: '类型', sortable:true, sortValue:i=>i.type, render: i => <StatusBadge label={NT[i.type].l} variant={NT[i.type].v} size="sm" /> },
    { key: 'priority', title: '优先级', sortable:true, sortValue:i=>i.priority, render: i => <StatusBadge label={NP[i.priority].l} variant={NP[i.priority].v} size="sm" /> },
    { key: 'sender', title: '发送人', dataKey:'sender', sortable:true },
    { key: 'createdAt', title: '时间', sortable:true, sortValue:i=>i.createdAt, render: i => <span style={{color:'#94a3b8'}}>{formatTime(i.createdAt)}</span> },
    { key: 'category', title: '分类', dataKey:'category', sortable:true },
  ];
}

export default function NotificationsPage() {
  const notifs = useMemo(()=>notifications,[]);
  const stats = useMemo(()=>({
    total:notifs.length, unread:notifs.filter(n=>n.status==='unread').length,
    alerts:notifs.filter(n=>n.type==='alert').length,
    urgent:notifs.filter(n=>n.priority==='urgent').length,
  }),[notifs]);

  const searchFields=useMemo<(keyof Notification)[]>(()=>['title','content','sender','category'],[]);
  const {searchTerm,setSearchTerm,filteredItems}=useSearchFilter(notifs,searchFields);
  const [typeFilter,setTypeFilter]=useState<string>('ALL');
  const typeFiltered=useMemo(()=>typeFilter==='ALL'?filteredItems:filteredItems.filter(n=>n.type===typeFilter),[filteredItems,typeFilter]);
  const [sortConfig,setSortConfig]=useState<DataTableSortConfig|null>(null);
  const columns=useMemo(()=>buildColumns(),[]);
  const sorted=useSortedItems(typeFiltered,columns,sortConfig);
  const pagination=usePagination({initialPageSize:10});
  const pageItems=pagination.paginate(sorted);

  return (
    <main style={{maxWidth:960,margin:'0 auto',padding:32}}>
      <PageShell title="🔔 通知中心" subtitle={`${stats.unread}条未读 · 共${stats.total}条`}>
        <div style={{display:'grid',gap:14,gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>总通知</div><div style={{marginTop:6,fontSize:28,fontWeight:700}}>{stats.total}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>未读</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#3b82f6'}}>{stats.unread}</div><div style={{marginTop:4,fontSize:12,color:'#94a3b8'}}>需阅读</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>紧急</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#ef4444'}}>{stats.urgent}</div></div>
          <div style={card}><div style={{fontSize:13,color:'#cbd5e1'}}>告警</div><div style={{marginTop:6,fontSize:28,fontWeight:700,color:'#eab308'}}>{stats.alerts}</div></div>
        </div>

        <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索通知标题/内容/发送人..." />
        <div style={{marginTop:12}}><Tabs items={[
          {key:'ALL',label:'全部',count:filteredItems.length},
          ...(['announcement','alert','system','task','approval'] as NotifType[]).map(t=>({key:t,label:NT[t].l,count:filteredItems.filter(n=>n.type===t).length})),
        ]} activeKey={typeFilter} onChange={setTypeFilter} variant="pills" size="sm" /></div>

        <DataTable title={`通知 (${sorted.length})`} columns={columns} items={pageItems} rowKey={i=>i.id}
          sort={sortConfig} onSortChange={setSortConfig} striped compact />
        <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length}
          onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </PageShell>
    </main>
  );
}

const card: React.CSSProperties={borderRadius:16,padding:18,background:'rgba(15,23,42,0.38)',border:'1px solid rgba(148,163,184,0.18)'};
