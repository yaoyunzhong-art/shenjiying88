#!/usr/bin/env python3
"""Insert 3 new panels into feedback/page.tsx before the 热点反馈词云 section."""

filepath = "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/storefront-web/app/feedback/page.tsx"

with open(filepath, "r") as f:
    content = f.read()

anchor = "            {/* 热点反馈词云 */}"

new_panels = """            {/* 各门店反馈处理时效对比 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#065f46' }}>🏪 各门店反馈处理时效对比 (TOP5)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { store: '旗舰店', avgTime: '0.8h', resolve: 95, volume: 42, color: '#059669' },
                  { store: '商场店', avgTime: '1.5h', resolve: 88, volume: 36, color: '#3b82f6' },
                  { store: '社区店', avgTime: '2.2h', resolve: 76, volume: 28, color: '#f59e0b' },
                  { store: '街边店', avgTime: '3.5h', resolve: 62, volume: 18, color: '#f97316' },
                  { store: '校园店', avgTime: '4.1h', resolve: 55, volume: 12, color: '#ef4444' },
                ].map(function(st, i) {
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13 }}>#{i + 1}</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{st.store}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, color: '#6b7280' }}>
                        <span>平均 <span style={{ fontWeight: 600, color: '#dc2626' }}>{st.avgTime}</span></span>
                        <span>解决率 <span style={{ fontWeight: 600, color: st.color }}>{st.resolve}%</span></span>
                        <span>{st.volume}条</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'space-around' }}>
                {[
                  { label: '标杆门店', value: '旗舰店', detail: '0.8h 平均时效', color: '#059669' },
                  { label: '需提升', value: '校园店', detail: '4.1h 需优化', color: '#ef4444' },
                  { label: '平均时效', value: '2.4h', detail: '5店综合', color: '#6b7280' },
                ].map(function(s, i) {
                  return (
                    <div key={i} style={{ textAlign: 'center', padding: '6px 12px', borderRadius: 6, background: '#f9fafb', flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 反馈处理员工效率榜 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fefce8', border: '1px solid #fde68a' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>👨‍💼 反馈处理员工效率榜 (按处理量)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { name: '张经理', role: '店长', resolved: 86, pending: 3, satisfaction: 0.97, emoji: '🥇' },
                  { name: '李主管', role: '客服主管', resolved: 72, pending: 5, satisfaction: 0.95, emoji: '🥈' },
                  { name: '王专员', role: '客服专员', resolved: 58, pending: 8, satisfaction: 0.92, emoji: '🥉' },
                  { name: '赵助理', role: '客服专员', resolved: 45, pending: 12, satisfaction: 0.88, emoji: '⭐' },
                  { name: '陈顾问', role: '投诉专员', resolved: 38, pending: 2, satisfaction: 0.96, emoji: '⭐' },
                ].map(function(staff, i) {
                  return (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{staff.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: '#374151' }}>{staff.name}</div>
                          <div style={{ fontSize: 10, color: '#6b7280' }}>{staff.role}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, color: '#6b7280', alignItems: 'center' }}>
                        <span>已处理 <span style={{ fontWeight: 700, color: '#059669' }}>{staff.resolved}</span></span>
                        <span>待处理 <span style={{ fontWeight: 700, color: staff.pending > 5 ? '#dc2626' : '#f59e0b' }}>{staff.pending}</span></span>
                        <span style={{ padding: '2px 8px', borderRadius: 4, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>
                          {Math.round(staff.satisfaction * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 10, justifyContent: 'center', fontSize: 10, color: '#6b7280' }}>
                <span>🏆 团队本月总处理量: {86 + 72 + 58 + 45 + 38}条</span>
                <span>⭐ 平均满意度: {Math.round((0.97 + 0.95 + 0.92 + 0.88 + 0.96) / 5 * 100)}%</span>
              </div>
            </div>

            {/* 反馈自动分类统计 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#5b21b6' }}>🤖 反馈自动分类统计</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                {[
                  { tag: '设备/技术', count: 85, pct: 32, trend: 'up', icon: '🔧', color: '#7c3aed' },
                  { tag: '服务质量', count: 62, pct: 23, trend: 'down', icon: '🙋', color: '#059669' },
                  { tag: '价格/套餐', count: 48, pct: 18, trend: 'stable', icon: '💰', color: '#d97706' },
                  { tag: '环境/卫生', count: 38, pct: 14, trend: 'up', icon: '🧹', color: '#3b82f6' },
                  { tag: '其他', count: 35, pct: 13, trend: 'stable', icon: '📌', color: '#6b7280' },
                ].map(function(cat, i) {
                  return (
                    <div key={i} style={{ padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <div style={{ fontSize: 22 }}>{cat.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 2 }}>{cat.tag}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: cat.color, marginTop: 2 }}>{cat.count}<span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>条</span></div>
                      <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
                        <div style={{ width: cat.pct + '%', height: '100%', borderRadius: 3, background: cat.color }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{cat.pct}% · {cat.trend === 'up' ? '↑ 增长' : cat.trend === 'down' ? '↓ 下降' : '→ 持平'}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#f9fafb', fontSize: 11, color: '#6b7280' }}>
                📊 分类准确率 <span style={{ fontWeight: 600, color: '#059669' }}>92%</span> · 需人工复核 <span style={{ fontWeight: 600, color: '#f59e0b' }}>8%</span>
                · 本月自动分类总数 <span style={{ fontWeight: 600, color: '#374151' }}>{85 + 62 + 48 + 38 + 35}条</span>
              </div>
            </div>

"""

if anchor in content:
    content = content.replace(anchor, new_panels + anchor)
    with open(filepath, "w") as f:
        f.write(content)
    print("OK: Inserted 3 new panels before 热点反馈词云")
else:
    print("ERROR: anchor not found!")
    # find something close
    idx = content.find("热点反馈词云")
    if idx >= 0:
        print(f"Found '热点反馈词云' at index {idx}")
        print(repr(content[idx-30:idx+30]))
