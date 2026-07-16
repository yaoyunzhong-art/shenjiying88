#!/usr/bin/env python3
"""Insert 3 new panels into insights/page.tsx before the 脚注 section."""

filepath = "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/storefront-web/app/insights/page.tsx"

with open(filepath, "r") as f:
    content = f.read()

anchor = "      {/* 脚注 */}"

new_panels = """      {/* 会员来源渠道分布 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>📱 会员来源渠道分布</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { channel: '扫码注册', pct: 38, count: 216, color: '#60a5fa', icon: '📱', trend: 'up' },
            { channel: '老客推荐', pct: 28, count: 160, color: '#34d399', icon: '🤝', trend: 'up' },
            { channel: '线上广告', pct: 18, count: 102, color: '#fbbf24', icon: '📢', trend: 'down' },
            { channel: '自然流量', pct: 12, count: 68, color: '#a78bfa', icon: '🚶', trend: 'stable' },
            { channel: '活动导入', pct: 4, count: 24, color: '#f472b6', icon: '🎪', trend: 'up' },
          ].map(function(src, i) {
            return (
              <div key={i} style={{ padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>{src.icon}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{src.channel}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: src.color, marginTop: 2 }}>{src.pct}%</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{src.count}人</div>
                <div style={{ fontSize: 10, color: src.trend === 'up' ? '#34d399' : src.trend === 'down' ? '#f87171' : '#94a3b8', marginTop: 2 }}>
                  {src.trend === 'up' ? '↑ 增长' : src.trend === 'down' ? '↓ 下降' : '→ 持平'}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(148,163,184,0.06)', fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>📊 来源分布健康度: <span style={{ color: '#34d399', fontWeight: 600 }}>良好</span></span>
          <span>扫码+推荐占比 <span style={{ color: '#60a5fa', fontWeight: 600 }}>{38 + 28}%</span> · 自然增长动力充足</span>
        </div>
      </div>

      {/* 月度增长趋势对比 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>📈 月度增长趋势对比 (新增 vs 流失)</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 90, padding: '6px 0' }}>
          {[
            { month: '2月', add: 28, lost: 5 },
            { month: '3月', add: 35, lost: 8 },
            { month: '4月', add: 42, lost: 12 },
            { month: '5月', add: 38, lost: 15 },
            { month: '6月', add: 52, lost: 9 },
            { month: '7月', add: 48, lost: 11 },
          ].map(function(m, i) {
            const maxVal = 55;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                  <div style={{
                    width: 22, height: Math.max(3, (m.add / maxVal) * 70) + 'px',
                    borderRadius: '4px 4px 0 0', background: 'rgba(52,211,153,0.6)',
                    transition: 'height 0.3s', position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#34d399', fontWeight: 600, whiteSpace: 'nowrap' }}>+{m.add}</span>
                  </div>
                  <div style={{
                    width: 22, height: Math.max(3, (m.lost / maxVal) * 70) + 'px',
                    borderRadius: '4px 4px 0 0', background: 'rgba(248,113,113,0.5)',
                    transition: 'height 0.3s', position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#f87171', fontWeight: 600, whiteSpace: 'nowrap' }}>-{m.lost}</span>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 14 }}>{m.month}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          <span><span style={{ color: 'rgba(52,211,153,0.7)' }}>■</span> 新增会员</span>
          <span><span style={{ color: 'rgba(248,113,113,0.7)' }}>■</span> 流失会员</span>
          <span>净增长: <span style={{ color: '#34d399', fontWeight: 600 }}>+{28 + 35 + 42 + 38 + 52 + 48 - 5 - 8 - 12 - 15 - 9 - 11}</span></span>
        </div>
      </div>

      {/* 会员沉睡唤醒分析 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>💤 会员沉睡唤醒分析</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { tier: '30天沉睡', days: '30-60天未到店', count: 68, pct: 22, color: '#fbbf24', desc: '轻度沉睡·唤醒容易' },
            { tier: '60天沉睡', days: '60-90天未到店', count: 45, pct: 14, color: '#f97316', desc: '中度沉睡·需优惠刺激' },
            { tier: '90天沉睡', days: '90天以上未到店', count: 32, pct: 10, color: '#ef4444', desc: '深度沉睡·高流失风险' },
          ].map(function(st, i) {
            return (
              <div key={i} style={{ flex: '1 1 140px', padding: 14, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center', border: '1px solid rgba(148,163,184,0.1)' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>{st.tier}</div>
                <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{st.days}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: st.color, marginTop: 4 }}>{st.count}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>占总会员 {st.pct}%</div>
                <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
                  <div style={{ width: st.pct * 3 + '%', height: '100%', borderRadius: 3, background: st.color, opacity: 0.7 }} />
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{st.desc}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(148,163,184,0.06)', fontSize: 11, color: '#94a3b8' }}>
          💡 <span style={{ color: '#fbbf24' }}>唤醒建议</span>: 30天沉睡发送提醒 → 60天沉睡发放优惠券 → 90天沉睡电话回访
          · 可唤醒会员 <span style={{ color: '#34d399', fontWeight: 600 }}>{68 + 45}人</span> (占比 {22 + 14}%)
          · 总沉睡会员 <span style={{ color: '#f87171', fontWeight: 600 }}>{68 + 45 + 32}人</span>
        </div>
      </div>

"""

if anchor in content:
    content = content.replace(anchor, new_panels + anchor)
    with open(filepath, "w") as f:
        f.write(content)
    print("OK: Inserted 3 new panels before 脚注")
else:
    print("ERROR: anchor not found!")
    idx = content.find("脚注")
    if idx >= 0:
        print(f"Found '脚注' at index {idx}")
        print(repr(content[idx-20:idx+30]))
