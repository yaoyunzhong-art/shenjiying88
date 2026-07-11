'use client';

import { useState } from 'react';
import { PageShell, StatCard } from '@m5/ui';

const SETMEALS = [
  { id: 1, name: '新手体验套餐', price: 58, originalPrice: 128, duration: '1小时', items: ['街机区自由体验', '射击游戏3局', '饮料1杯'], tag: '入门', popular: false, color: 'from-green-600/30' },
  { id: 2, name: '畅玩3小时', price: 128, originalPrice: 268, duration: '3小时', items: ['全场自由体验', '赛车区5局', 'VR体验2次', '饮料1杯', '零食1份'], tag: '超值', popular: true, color: 'from-blue-600/30' },
  { id: 3, name: '双人约会套餐', price: 198, originalPrice: 398, duration: '2小时', items: ['双人全场体验', 'VR双人游戏1次', '射击比赛2局', '饮品2杯', '合照打印'], tag: '浪漫', popular: true, color: 'from-purple-600/30' },
  { id: 4, name: '亲子欢乐套餐', price: 168, originalPrice: 338, duration: '2小时', items: ['1大1小全场体验', '亲子赛车赛3局', '射击/投篮不限', '儿童饮品+小食', '亲子游戏指导'], tag: '亲子', popular: false, color: 'from-yellow-600/30' },
  { id: 5, name: '团建包场套餐', price: 3888, originalPrice: 5888, duration: '4小时', items: ['10人以下包场', '全部设备开放', '专属主持人', '自助简餐', '团建游戏', '定制奖杯'], tag: '团建', popular: false, color: 'from-red-600/30' },
  { id: 6, name: 'VIP至尊卡', price: 888, originalPrice: 1688, duration: '月卡', items: ['每月12次体验', 'VIP入口免排队', '专属休息区', '每月新游优先试玩', '生日派对5折', '好友体验券×3'], tag: 'VIP', popular: false, color: 'from-amber-600/30' },
];

const TAGS = ['全部', '入门', '超值', '浪漫', '亲子', '团建', 'VIP'];

function formatPrice(n: number) { return `¥${n.toLocaleString()}`; }

export default function SetmealPage() {
  const [tagFilter, setTagFilter] = useState('全部');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [purchased, setPurchased] = useState(false);

  const filtered = SETMEALS.filter(s => tagFilter === '全部' || s.tag === tagFilter);

  const selected = SETMEALS.find(s => s.id === selectedId);

  const handleBuy = () => {
    setPurchased(true);
    setTimeout(() => setPurchased(false), 3000);
  };

  return (
    <PageShell title="套餐中心" subtitle="超值优惠·多种套餐">
      <div className="p-4 space-y-4">
        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          {TAGS.map(t => (
            <button
              key={t}
              onClick={() => setTagFilter(t)}
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                tagFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >{t}</button>
          ))}
        </div>

        {/* 套餐卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(sm => (
            <div
              key={sm.id}
              className={`rounded-lg bg-gradient-to-br ${sm.color} to-gray-900/95 border border-gray-700/50 overflow-hidden relative ${selectedId === sm.id ? 'ring-2 ring-blue-500' : 'cursor-pointer hover:border-gray-600'}`}
              onClick={() => { selectedId === sm.id ? setSelectedId(null) : setSelectedId(sm.id); setPurchased(false); }}
            >
              {sm.popular && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full">🔥 热门</div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{sm.name}</h3>
                      <span className="px-2 py-0.5 bg-white/10 text-gray-400 text-[10px] rounded">{sm.tag}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">⏱ {sm.duration}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-white">{formatPrice(sm.price)}</span>
                  <span className="text-sm text-gray-500 line-through ml-2">{formatPrice(sm.originalPrice)}</span>
                  <span className="ml-2 text-xs text-green-400">省{formatPrice(sm.originalPrice - sm.price)}</span>
                </div>
                <ul className="mt-3 space-y-1">
                  {sm.items.slice(0, 4).map((item, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span className="text-green-400">✓</span> {item}
                    </li>
                  ))}
                  {sm.items.length > 4 && <li className="text-xs text-gray-600 ml-4">+{sm.items.length - 4}项更多...</li>}
                </ul>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedId(sm.id); }}
                  className={`mt-4 w-full py-2 text-sm rounded-lg transition-colors ${
                    selectedId === sm.id ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {selectedId === sm.id ? '确认购买' : '立即购买'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 购买确认弹窗 */}
        {selected && selectedId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedId(null); setPurchased(false); }}>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{purchased ? '✅ 购买成功' : '确认购买'}</h3>
                <button onClick={() => { setSelectedId(null); setPurchased(false); }} className="text-gray-500 hover:text-gray-300 text-xl">✕</button>
              </div>

              {purchased ? (
                <div className="text-center py-6">
                  <span className="text-5xl">🎉</span>
                  <p className="text-green-400 mt-3 font-medium">{selected.name} 已购买成功！</p>
                  <p className="text-xs text-gray-500 mt-1">请在"我的订单"中查看使用</p>
                  <button onClick={() => { setSelectedId(null); setPurchased(false); }} className="mt-4 px-6 py-2 bg-blue-600 text-white text-sm rounded-lg">知道了</button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-400">套餐</span>
                    <span className="text-sm text-white">{selected.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-400">时长</span>
                    <span className="text-sm text-white">{selected.duration}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-gray-700 mt-2 pt-2">
                    <span className="text-sm text-gray-400">价格</span>
                    <div>
                      <span className="text-xl font-bold text-white">{formatPrice(selected.price)}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">{formatPrice(selected.originalPrice)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-400">支付方式</span>
                    <select className="px-3 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white">
                      <option>微信支付</option>
                      <option>支付宝</option>
                      <option>余额支付</option>
                    </select>
                  </div>
                  <button
                    onClick={handleBuy}
                    className="mt-4 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
                  >
                    立即支付 {formatPrice(selected.price)}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
