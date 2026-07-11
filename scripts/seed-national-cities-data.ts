/**
 * 全国30城场馆种子数据
 * T1 10城 + T2 10城 + T3 10城 × 4场馆/城 = 120馆
 * 用于DB测试和侦察兵采集验证
 * 最后更新: 2026-07-12
 */

export interface NationalVenueSeed {
  name: string;
  city: string;
  city_tier: 'T1' | 'T2' | 'T3';
  region: string;
  category: string;
  address?: string;
  rating: number;
  review_count: number;
  source: string;
  tags: string[];
}

export const nationalCityVenueData: NationalVenueSeed[] = [
  // ========== T1 (10城) ==========
  // 北京
  { name: '风云再起(王府井店)', city: '北京', city_tier: 'T1', region: '华北', category: '游艺厅', address: '王府井大街138号', rating: 4.5, review_count: 2869, source: '美团', tags: ['连锁', '高消费', '网红'] },
  { name: '汤姆熊欢乐世界(朝阳大悦城)', city: '北京', city_tier: 'T1', region: '华北', category: '综合娱乐', address: '朝阳北路101号', rating: 4.3, review_count: 3521, source: '点评', tags: ['连锁', '亲子'] },
  { name: '星际传奇(龙湖天街)', city: '北京', city_tier: 'T1', region: '华北', category: '电玩城', address: '龙湖长楹天街', rating: 4.2, review_count: 1823, source: '抖音', tags: ['连锁', '新店'] },
  { name: '嗨翻电竞(海淀旗舰店)', city: '北京', city_tier: 'T1', region: '华北', category: 'VR体验', address: '中关村大街15号', rating: 4.0, review_count: 876, source: '小红书', tags: ['网红', '24h'] },
  // 上海
  { name: '世嘉都市乐园(环球港)', city: '上海', city_tier: 'T1', region: '华东', category: '综合娱乐', address: '中山北路3300号', rating: 4.6, review_count: 5231, source: '美团', tags: ['连锁', '亲子', '网红'] },
  { name: '汤姆熊(五角场万达)', city: '上海', city_tier: 'T1', region: '华东', category: '游艺厅', address: '淞沪路77号', rating: 4.4, review_count: 2890, source: '点评', tags: ['连锁', '高消费'] },
  { name: 'PLAY1(浦东八佰伴)', city: '上海', city_tier: 'T1', region: '华东', category: '电玩城', address: '张杨路501号', rating: 4.3, review_count: 1642, source: '抖音', tags: ['连锁'] },
  { name: 'A9电竞(淮海中路)', city: '上海', city_tier: 'T1', region: '华东', category: 'VR体验', address: '淮海中路887号', rating: 4.1, review_count: 621, source: '小红书', tags: ['网红', '24h'] },
  // 广州
  { name: '动漫星城(公园前)', city: '广州', city_tier: 'T1', region: '华南', category: '综合娱乐', address: '中山五路219号', rating: 4.2, review_count: 4520, source: '美团', tags: ['亲子'] },
  { name: '城市英雄(天河城)', city: '广州', city_tier: 'T1', region: '华南', category: '游艺厅', address: '天河路208号', rating: 4.5, review_count: 3128, source: '点评', tags: ['连锁'] },
  { name: '大玩家(白云万达)', city: '广州', city_tier: 'T1', region: '华南', category: '电玩城', address: '云城东路501号', rating: 4.0, review_count: 2231, source: '抖音', tags: ['连锁', '新店'] },
  { name: 'VR元宇宙(广州塔)', city: '广州', city_tier: 'T1', region: '华南', category: 'VR体验', address: '阅江西路222号', rating: 4.3, review_count: 987, source: '小红书', tags: ['网红'] },
  // 深圳
  { name: '风云再起(东门店)', city: '深圳', city_tier: 'T1', region: '华南', category: '游艺厅', address: '东门中路2088号', rating: 4.4, review_count: 3120, source: '美团', tags: ['连锁', '高消费'] },
  { name: '星际传奇(宝安壹方城)', city: '深圳', city_tier: 'T1', region: '华南', category: '电玩城', address: '宝华路1号', rating: 4.3, review_count: 1842, source: '点评', tags: ['连锁'] },
  { name: '环游嘉年华(欢乐海岸)', city: '深圳', city_tier: 'T1', region: '华南', category: '综合娱乐', address: '白石路8号', rating: 4.6, review_count: 2856, source: '抖音', tags: ['亲子', '网红'] },
  { name: '量子VR(华强北)', city: '深圳', city_tier: 'T1', region: '华南', category: 'VR体验', address: '华强北路1019号', rating: 4.2, review_count: 743, source: '小红书', tags: ['新店'] },
  // 成都
  { name: '汤姆熊(春熙路伊藤)', city: '成都', city_tier: 'T1', region: '西南', category: '游艺厅', address: '春熙路伊藤洋华堂', rating: 4.3, review_count: 2560, source: '美团', tags: ['连锁', '亲子'] },
  { name: '大玩家(锦华万达)', city: '成都', city_tier: 'T1', region: '西南', category: '电玩城', address: '锦华路一段68号', rating: 4.1, review_count: 1893, source: '点评', tags: ['连锁'] },
  { name: '风云再起(建设路)', city: '成都', city_tier: 'T1', region: '西南', category: '综合娱乐', address: '建设路2号', rating: 4.5, review_count: 2210, source: '抖音', tags: ['高消费', '网红'] },
  { name: 'VR视界(太古里)', city: '成都', city_tier: 'T1', region: '西南', category: 'VR体验', address: '中纱帽街8号', rating: 4.4, review_count: 1156, source: '小红书', tags: ['网红'] },
  // 杭州
  { name: '汤姆熊(西湖银泰)', city: '杭州', city_tier: 'T1', region: '华东', category: '游艺厅', address: '延安路98号', rating: 4.4, review_count: 2341, source: '美团', tags: ['连锁'] },
  { name: '风云再起(湖滨in77)', city: '杭州', city_tier: 'T1', region: '华东', category: '综合娱乐', address: '延安路258号', rating: 4.5, review_count: 3190, source: '点评', tags: ['高消费', '网红'] },
  { name: '星际传奇(城西银泰)', city: '杭州', city_tier: 'T1', region: '华东', category: '电玩城', address: '丰潭路380号', rating: 4.2, review_count: 1456, source: '抖音', tags: ['连锁'] },
  { name: '虚极VR(钱江新城)', city: '杭州', city_tier: 'T1', region: '华东', category: 'VR体验', address: '民心路280号', rating: 4.3, review_count: 654, source: '小红书', tags: ['新店'] },
  // 重庆
  { name: '大玩家(解放碑)', city: '重庆', city_tier: 'T1', region: '西南', category: '电玩城', address: '八一路177号', rating: 4.2, review_count: 1876, source: '美团', tags: ['连锁'] },
  { name: '汤姆熊(观音桥)', city: '重庆', city_tier: 'T1', region: '西南', category: '游艺厅', address: '建新北路68号', rating: 4.3, review_count: 2320, source: '点评', tags: ['连锁', '亲子'] },
  { name: '风云再起(南坪万达)', city: '重庆', city_tier: 'T1', region: '西南', category: '综合娱乐', address: '南城大道6号', rating: 4.1, review_count: 1456, source: '抖音', tags: ['高消费'] },
  { name: '星河元宇宙(来福士)', city: '重庆', city_tier: 'T1', region: '西南', category: 'VR体验', address: '接圣街8号', rating: 4.5, review_count: 823, source: '小红书', tags: ['网红', '新店'] },
  // 武汉
  { name: '汤姆熊(武商摩尔城)', city: '武汉', city_tier: 'T1', region: '华中', category: '游艺厅', address: '解放大道690号', rating: 4.3, review_count: 2234, source: '美团', tags: ['连锁'] },
  { name: '风云再起(江汉路)', city: '武汉', city_tier: 'T1', region: '华中', category: '综合娱乐', address: '江汉路118号', rating: 4.4, review_count: 2810, source: '点评', tags: ['高消费'] },
  { name: '大玩家(汉街万达)', city: '武汉', city_tier: 'T1', region: '华中', category: '电玩城', address: '中北路171号', rating: 4.0, review_count: 1234, source: '抖音', tags: ['连锁'] },
  { name: '幻境VR(光谷步行街)', city: '武汉', city_tier: 'T1', region: '华中', category: 'VR体验', address: '鲁巷光谷街', rating: 4.1, review_count: 567, source: '小红书', tags: ['新店'] },
  // 西安
  { name: '风云再起(小寨赛格)', city: '西安', city_tier: 'T1', region: '西北', category: '游艺厅', address: '长安中路123号', rating: 4.5, review_count: 3421, source: '美团', tags: ['连锁', '高消费'] },
  { name: '汤姆熊(钟楼)', city: '西安', city_tier: 'T1', region: '西北', category: '综合娱乐', address: '东大街239号', rating: 4.2, review_count: 2187, source: '点评', tags: ['连锁', '亲子'] },
  { name: '大玩家(大明宫万达)', city: '西安', city_tier: 'T1', region: '西北', category: '电玩城', address: '太华北路369号', rating: 4.0, review_count: 1123, source: '抖音', tags: ['连锁'] },
  { name: 'X-RvR(大唐不夜城)', city: '西安', city_tier: 'T1', region: '西北', category: 'VR体验', address: '慈恩路66号', rating: 4.4, review_count: 912, source: '小红书', tags: ['网红'] },
  // 南京
  { name: '汤姆熊(新街口)', city: '南京', city_tier: 'T1', region: '华东', category: '游艺厅', address: '中山南路79号', rating: 4.4, review_count: 2789, source: '美团', tags: ['连锁'] },
  { name: '风云再起(夫子庙)', city: '南京', city_tier: 'T1', region: '华东', category: '综合娱乐', address: '贡院街80号', rating: 4.3, review_count: 1987, source: '点评', tags: ['高消费'] },
  { name: '星际传奇(江宁万达)', city: '南京', city_tier: 'T1', region: '华东', category: '电玩城', address: '东山街道', rating: 4.1, review_count: 987, source: '抖音', tags: ['连锁'] },
  { name: '赛博VR(河西)', city: '南京', city_tier: 'T1', region: '华东', category: 'VR体验', address: '江东中路345号', rating: 4.2, review_count: 456, source: '小红书', tags: ['新店'] },

  // ========== T2 (10城) ==========
  // 天津
  { name: '汤姆熊(滨江道)', city: '天津', city_tier: 'T2', region: '华北', category: '游艺厅', address: '滨江道208号', rating: 4.1, review_count: 1876, source: '美团', tags: ['连锁'] },
  { name: '大玩家(河东万达)', city: '天津', city_tier: 'T2', region: '华北', category: '电玩城', address: '津滨大道53号', rating: 4.0, review_count: 1234, source: '点评', tags: ['连锁'] },
  { name: '风云再起(南开)', city: '天津', city_tier: 'T2', region: '华北', category: '综合娱乐', address: '南马路', rating: 4.2, review_count: 1456, source: '抖音', tags: ['高消费'] },
  { name: '跃界VR(奥城)', city: '天津', city_tier: 'T2', region: '华北', category: 'VR体验', address: '奥城商业广场', rating: 3.9, review_count: 234, source: '小红书', tags: ['新店'] },
  // 苏州
  { name: '汤姆熊(观前街)', city: '苏州', city_tier: 'T2', region: '华东', category: '游艺厅', address: '观前街245号', rating: 4.3, review_count: 2145, source: '美团', tags: ['连锁'] },
  { name: '梦幻电玩(狮山)', city: '苏州', city_tier: 'T2', region: '华东', category: '电玩城', address: '狮山路', rating: 4.0, review_count: 876, source: '点评', tags: ['亲子'] },
  { name: '宇宙娱乐(苏州中心)', city: '苏州', city_tier: 'T2', region: '华东', category: '综合娱乐', address: '苏州中心广场', rating: 4.4, review_count: 2341, source: '抖音', tags: ['网红'] },
  { name: '元界VR(李公堤)', city: '苏州', city_tier: 'T2', region: '华东', category: 'VR体验', address: '李公堤', rating: 4.1, review_count: 345, source: '小红书', tags: ['新店'] },
  // 长沙
  { name: '风云再起(坡子街)', city: '长沙', city_tier: 'T2', region: '华中', category: '综合娱乐', address: '坡子街108号', rating: 4.6, review_count: 4560, source: '美团', tags: ['网红', '连锁'] },
  { name: '汤姆熊(五一广场)', city: '长沙', city_tier: 'T2', region: '华中', category: '游艺厅', address: '黄兴中路88号', rating: 4.3, review_count: 2876, source: '点评', tags: ['连锁'] },
  { name: '大玩家(万家丽)', city: '长沙', city_tier: 'T2', region: '华中', category: '电玩城', address: '万家丽中路', rating: 4.1, review_count: 1567, source: '抖音', tags: ['连锁'] },
  { name: '幻城VR(梅溪湖)', city: '长沙', city_tier: 'T2', region: '华中', category: 'VR体验', address: '梅溪湖路', rating: 4.2, review_count: 678, source: '小红书', tags: ['新店'] },
  // 郑州
  { name: '汤姆熊(二七广场)', city: '郑州', city_tier: 'T2', region: '华中', category: '游艺厅', address: '二七路200号', rating: 4.0, review_count: 1654, source: '美团', tags: ['连锁'] },
  { name: '星际传奇(花园路)', city: '郑州', city_tier: 'T2', region: '华中', category: '电玩城', address: '花园路126号', rating: 4.1, review_count: 987, source: '点评', tags: ['连锁'] },
  { name: '大玩家(中原万达)', city: '郑州', city_tier: 'T2', region: '华中', category: '综合娱乐', address: '中原路', rating: 3.9, review_count: 1123, source: '抖音', tags: ['连锁'] },
  { name: '星河VR(郑东CBD)', city: '郑州', city_tier: 'T2', region: '华中', category: 'VR体验', address: '商务内环路', rating: 4.0, review_count: 234, source: '小红书', tags: ['新店'] },
  // 东莞
  { name: '城市英雄(东城万达)', city: '东莞', city_tier: 'T2', region: '华南', category: '游艺厅', address: '东纵路208号', rating: 4.1, review_count: 1345, source: '美团', tags: ['连锁'] },
  { name: '大玩家(南城)', city: '东莞', city_tier: 'T2', region: '华南', category: '电玩城', address: '鸿福路', rating: 3.9, review_count: 876, source: '点评', tags: ['连锁'] },
  { name: '嗨翻天(长安)', city: '东莞', city_tier: 'T2', region: '华南', category: '综合娱乐', address: '长安镇', rating: 4.0, review_count: 654, source: '抖音', tags: ['亲子'] },
  { name: '未来VR(松山湖)', city: '东莞', city_tier: 'T2', region: '华南', category: 'VR体验', address: '松山湖', rating: 4.1, review_count: 123, source: '小红书', tags: ['新店'] },
  // 青岛
  { name: '汤姆熊(台东)', city: '青岛', city_tier: 'T2', region: '华东', category: '游艺厅', address: '台东三路', rating: 4.2, review_count: 1876, source: '美团', tags: ['连锁'] },
  { name: '风云再起(香港中路)', city: '青岛', city_tier: 'T2', region: '华东', category: '综合娱乐', address: '香港中路78号', rating: 4.4, review_count: 2345, source: '点评', tags: ['高消费'] },
  { name: '大玩家(李沧万达)', city: '青岛', city_tier: 'T2', region: '华东', category: '电玩城', address: '巨峰路178号', rating: 4.0, review_count: 987, source: '抖音', tags: ['连锁'] },
  { name: '数字VR(麦岛)', city: '青岛', city_tier: 'T2', region: '华东', category: 'VR体验', address: '宁夏路', rating: 4.2, review_count: 345, source: '小红书', tags: ['新店'] },
  // 沈阳
  { name: '汤姆熊(中街)', city: '沈阳', city_tier: 'T2', region: '东北', category: '游艺厅', address: '中街路68号', rating: 4.1, review_count: 1987, source: '美团', tags: ['连锁'] },
  { name: '风云再起(太原街)', city: '沈阳', city_tier: 'T2', region: '东北', category: '综合娱乐', address: '太原北街86号', rating: 4.3, review_count: 2123, source: '点评', tags: ['高消费'] },
  { name: '大玩家(铁西)', city: '沈阳', city_tier: 'T2', region: '东北', category: '电玩城', address: '建设东路', rating: 3.9, review_count: 765, source: '抖音', tags: ['连锁'] },
  { name: '维度VR(浑南)', city: '沈阳', city_tier: 'T2', region: '东北', category: 'VR体验', address: '浑南新区', rating: 4.0, review_count: 234, source: '小红书', tags: ['新店'] },
  // 宁波
  { name: '汤姆熊(天一广场)', city: '宁波', city_tier: 'T2', region: '华东', category: '游艺厅', address: '中山东路', rating: 4.2, review_count: 1567, source: '美团', tags: ['连锁'] },
  { name: '星际传奇(鄞州万达)', city: '宁波', city_tier: 'T2', region: '华东', category: '电玩城', address: '宁南北路', rating: 4.1, review_count: 876, source: '点评', tags: ['连锁'] },
  { name: '风云再起(城隍庙)', city: '宁波', city_tier: 'T2', region: '华东', category: '综合娱乐', address: '县学街22号', rating: 4.0, review_count: 1234, source: '抖音', tags: ['亲子'] },
  { name: '镜界VR(东部新城)', city: '宁波', city_tier: 'T2', region: '华东', category: 'VR体验', address: '东部新城', rating: 4.1, review_count: 198, source: '小红书', tags: ['新店'] },
  // 昆明
  { name: '汤姆熊(顺城)', city: '昆明', city_tier: 'T2', region: '西南', category: '游艺厅', address: '东风西路11号', rating: 4.0, review_count: 1234, source: '美团', tags: ['连锁'] },
  { name: '风云再起(南屏街)', city: '昆明', city_tier: 'T2', region: '西南', category: '综合娱乐', address: '南屏街76号', rating: 4.2, review_count: 1654, source: '点评', tags: ['高消费'] },
  { name: '大玩家(同德)', city: '昆明', city_tier: 'T2', region: '西南', category: '电玩城', address: '北京路', rating: 3.9, review_count: 876, source: '抖音', tags: ['连锁'] },
  { name: '梦幻VR(滇池)', city: '昆明', city_tier: 'T2', region: '西南', category: 'VR体验', address: '滇池路', rating: 4.0, review_count: 167, source: '小红书', tags: ['新店'] },
  // 大连
  { name: '汤姆熊(青泥洼)', city: '大连', city_tier: 'T2', region: '东北', category: '游艺厅', address: '青泥洼桥', rating: 4.2, review_count: 1678, source: '美团', tags: ['连锁'] },
  { name: '风云再起(西安路)', city: '大连', city_tier: 'T2', region: '东北', category: '综合娱乐', address: '西安路99号', rating: 4.3, review_count: 1987, source: '点评', tags: ['高消费'] },
  { name: '大玩家(华南)', city: '大连', city_tier: 'T2', region: '东北', category: '电玩城', address: '中华西路', rating: 4.0, review_count: 765, source: '抖音', tags: ['连锁'] },
  { name: '星界VR(东港)', city: '大连', city_tier: 'T2', region: '东北', category: 'VR体验', address: '东港商务区', rating: 4.1, review_count: 234, source: '小红书', tags: ['新店'] },

  // ========== T3 (10城) ==========
  // 佛山
  { name: '汤姆熊(祖庙)', city: '佛山', city_tier: 'T3', region: '华南', category: '游艺厅', address: '祖庙路', rating: 3.9, review_count: 1234, source: '美团', tags: ['连锁'] },
  { name: '风云再起(南海万达)', city: '佛山', city_tier: 'T3', region: '华南', category: '综合娱乐', address: '南海大道', rating: 4.0, review_count: 987, source: '点评', tags: ['连锁'] },
  { name: '大玩家(顺德)', city: '佛山', city_tier: 'T3', region: '华南', category: '电玩城', address: '大良街道', rating: 3.8, review_count: 654, source: '抖音', tags: ['连锁'] },
  { name: '悦动VR(千灯湖)', city: '佛山', city_tier: 'T3', region: '华南', category: 'VR体验', address: '千灯湖', rating: 4.0, review_count: 123, source: '小红书', tags: ['新店'] },
  // 合肥
  { name: '汤姆熊(淮河路)', city: '合肥', city_tier: 'T3', region: '华东', category: '游艺厅', address: '淮河路步行街', rating: 4.0, review_count: 1456, source: '美团', tags: ['连锁'] },
  { name: '星际传奇(政务区)', city: '合肥', city_tier: 'T3', region: '华东', category: '电玩城', address: '天鹅湖路', rating: 3.9, review_count: 876, source: '点评', tags: ['连锁'] },
  { name: '大玩家(包河万达)', city: '合肥', city_tier: 'T3', region: '华东', category: '综合娱乐', address: '马鞍山路', rating: 3.8, review_count: 765, source: '抖音', tags: ['连锁'] },
  { name: '云端VR(滨湖)', city: '合肥', city_tier: 'T3', region: '华东', category: 'VR体验', address: '滨湖新区', rating: 3.9, review_count: 98, source: '小红书', tags: ['新店'] },
  // 福州
  { name: '汤姆熊(东街口)', city: '福州', city_tier: 'T3', region: '华东', category: '游艺厅', address: '八一七北路', rating: 4.1, review_count: 1234, source: '美团', tags: ['连锁'] },
  { name: '风云再起(宝龙)', city: '福州', city_tier: 'T3', region: '华东', category: '综合娱乐', address: '工业路', rating: 4.2, review_count: 1567, source: '点评', tags: ['高消费'] },
  { name: '大玩家(仓山万达)', city: '福州', city_tier: 'T3', region: '华东', category: '电玩城', address: '浦上大道', rating: 3.9, review_count: 654, source: '抖音', tags: ['连锁'] },
  { name: '幻境VR(闽江北)', city: '福州', city_tier: 'T3', region: '华东', category: 'VR体验', address: '闽江北岸', rating: 4.0, review_count: 145, source: '小红书', tags: ['新店'] },
  // 济南
  { name: '汤姆熊(泉城路)', city: '济南', city_tier: 'T3', region: '华东', category: '游艺厅', address: '泉城路188号', rating: 4.1, review_count: 1876, source: '美团', tags: ['连锁'] },
  { name: '风云再起(经四路)', city: '济南', city_tier: 'T3', region: '华东', category: '综合娱乐', address: '经四路', rating: 4.0, review_count: 1234, source: '点评', tags: ['亲子'] },
  { name: '大玩家(高新万达)', city: '济南', city_tier: 'T3', region: '华东', category: '电玩城', address: '工业南路', rating: 3.9, review_count: 876, source: '抖音', tags: ['连锁'] },
  { name: '极光VR(大明湖)', city: '济南', city_tier: 'T3', region: '华东', category: 'VR体验', address: '大明湖路', rating: 4.1, review_count: 198, source: '小红书', tags: ['新店'] },
  // 厦门
  { name: '汤姆熊(中山路)', city: '厦门', city_tier: 'T3', region: '华东', category: '游艺厅', address: '中山路', rating: 4.2, review_count: 2234, source: '美团', tags: ['连锁'] },
  { name: '风云再起(SM广场)', city: '厦门', city_tier: 'T3', region: '华东', category: '综合娱乐', address: '嘉禾路', rating: 4.3, review_count: 2567, source: '点评', tags: ['高消费', '网红'] },
  { name: '星际传奇(湖里)', city: '厦门', city_tier: 'T3', region: '华东', category: '电玩城', address: '仙岳路', rating: 4.0, review_count: 987, source: '抖音', tags: ['连锁'] },
  { name: '超时空VR(鼓浪屿)', city: '厦门', city_tier: 'T3', region: '华东', category: 'VR体验', address: '鼓浪屿', rating: 4.3, review_count: 456, source: '小红书', tags: ['网红'] },
  // 南宁
  { name: '汤姆熊(朝阳)', city: '南宁', city_tier: 'T3', region: '华南', category: '游艺厅', address: '朝阳路', rating: 3.9, review_count: 1234, source: '美团', tags: ['连锁'] },
  { name: '风云再起(万象城)', city: '南宁', city_tier: 'T3', region: '华南', category: '综合娱乐', address: '民族大道', rating: 4.1, review_count: 1456, source: '点评', tags: ['高消费'] },
  { name: '大玩家(江南万达)', city: '南宁', city_tier: 'T3', region: '华南', category: '电玩城', address: '亭洪路', rating: 3.8, review_count: 654, source: '抖音', tags: ['连锁'] },
  { name: '未来世界VR(五象)', city: '南宁', city_tier: 'T3', region: '华南', category: 'VR体验', address: '五象新区', rating: 3.9, review_count: 123, source: '小红书', tags: ['新店'] },
  // 贵阳
  { name: '汤姆熊(中华路)', city: '贵阳', city_tier: 'T3', region: '西南', category: '游艺厅', address: '中华中路', rating: 3.9, review_count: 987, source: '美团', tags: ['连锁'] },
  { name: '风云再起(喷水池)', city: '贵阳', city_tier: 'T3', region: '西南', category: '综合娱乐', address: '延安中路', rating: 4.0, review_count: 1234, source: '点评', tags: ['连锁'] },
  { name: '大玩家(世纪城)', city: '贵阳', city_tier: 'T3', region: '西南', category: '电玩城', address: '北京西路', rating: 3.7, review_count: 543, source: '抖音', tags: ['连锁'] },
  { name: 'VR之窗(观山湖)', city: '贵阳', city_tier: 'T3', region: '西南', category: 'VR体验', address: '观山湖区', rating: 3.9, review_count: 98, source: '小红书', tags: ['新店'] },
  // 哈尔滨
  { name: '汤姆熊(中央大街)', city: '哈尔滨', city_tier: 'T3', region: '东北', category: '游艺厅', address: '中央大街55号', rating: 4.0, review_count: 1567, source: '美团', tags: ['连锁'] },
  { name: '风云再起(果戈里)', city: '哈尔滨', city_tier: 'T3', region: '东北', category: '综合娱乐', address: '果戈里大街', rating: 4.1, review_count: 1234, source: '点评', tags: ['亲子'] },
  { name: '大玩家(哈西万达)', city: '哈尔滨', city_tier: 'T3', region: '东北', category: '电玩城', address: '中兴大道', rating: 3.8, review_count: 765, source: '抖音', tags: ['连锁'] },
  { name: '冰雪VR(松北)', city: '哈尔滨', city_tier: 'T3', region: '东北', category: 'VR体验', address: '松北大道', rating: 4.0, review_count: 167, source: '小红书', tags: ['新店'] },
  // 长春
  { name: '汤姆熊(重庆路)', city: '长春', city_tier: 'T3', region: '东北', category: '游艺厅', address: '重庆路', rating: 3.9, review_count: 1234, source: '美团', tags: ['连锁'] },
  { name: '风云再起(红旗街)', city: '长春', city_tier: 'T3', region: '东北', category: '综合娱乐', address: '红旗街', rating: 4.0, review_count: 987, source: '点评', tags: ['连锁'] },
  { name: '大玩家(净月)', city: '长春', city_tier: 'T3', region: '东北', category: '电玩城', address: '净月区', rating: 3.7, review_count: 543, source: '抖音', tags: ['连锁'] },
  { name: '长影VR(电影城)', city: '长春', city_tier: 'T3', region: '东北', category: 'VR体验', address: '红旗街1118号', rating: 4.1, review_count: 234, source: '小红书', tags: ['网红'] },
  // 石家庄
  { name: '汤姆熊(中山东路)', city: '石家庄', city_tier: 'T3', region: '华北', category: '游艺厅', address: '中山东路', rating: 3.8, review_count: 876, source: '美团', tags: ['连锁'] },
  { name: '风云再起(万象城)', city: '石家庄', city_tier: 'T3', region: '华北', category: '综合娱乐', address: '中山西路', rating: 4.0, review_count: 1123, source: '点评', tags: ['高消费'] },
  { name: '大玩家(裕华万达)', city: '石家庄', city_tier: 'T3', region: '华北', category: '电玩城', address: '建华大街', rating: 3.8, review_count: 654, source: '抖音', tags: ['连锁'] },
  { name: '正定VR(古城)', city: '石家庄', city_tier: 'T3', region: '华北', category: 'VR体验', address: '正定古城', rating: 3.9, review_count: 87, source: '小红书', tags: ['新店'] },
];

export default nationalCityVenueData;
