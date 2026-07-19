/**
 * seed-geo-locations.ts — GEO 地域标签种子脚本 (P-49 V3)
 *
 * 用法: npx tsx scripts/seed-geo-locations.ts
 *
 * 为30城S/A/B三级城市生成初始地域标签数据
 * 可通过 POST /seo/geo-locations API 导入, 或用此脚本直接写入
 */

interface GeoSeed {
  city: string
  district: string
  landmark: string
  lat: number
  lng: number
  radiusKm: number
  tier: 'S' | 'A' | 'B'
  tenantId: string
}

const CITIES: GeoSeed[] = [
  // ── S级 核心城市 ──
  ...['徐汇', '浦东', '静安', '黄浦', '长宁'].map((d, i) => ({
    city: '上海', district: d, landmark: ['徐家汇', '陆家嘴', '南京西路', '外滩', '中山公园'][i]!,
    lat: [31.19, 31.24, 31.23, 31.24, 31.22][i]!,
    lng: [121.44, 121.51, 121.45, 121.49, 121.42][i]!,
    radiusKm: 3, tier: 'S' as const, tenantId: 'default',
  })),
  ...['朝阳', '海淀', '东城', '西城', '丰台'].map((d, i) => ({
    city: '北京', district: d, landmark: ['三里屯', '中关村', '王府井', '西单', '丽泽'][i]!,
    lat: [39.93, 39.98, 39.92, 39.91, 39.86][i]!,
    lng: [116.45, 116.31, 116.41, 116.37, 116.29][i]!,
    radiusKm: 3, tier: 'S' as const, tenantId: 'default',
  })),
  ...(['天河', '越秀', '海珠', '番禺'] as const).map((d, i) => ({
    city: '广州', district: d, landmark: ['天河城', '北京路', '江南西', '长隆'][i]!,
    lat: [23.13, 23.13, 23.10, 22.99][i]!,
    lng: [113.32, 113.27, 113.26, 113.33][i]!,
    radiusKm: 3, tier: 'S' as const, tenantId: 'default',
  })),
  ...(['南山', '福田', '罗湖', '宝安'] as const).map((d, i) => ({
    city: '深圳', district: d, landmark: ['海岸城', '华强北', '东门', '壹方城'][i]!,
    lat: [22.52, 22.54, 22.55, 22.56][i]!,
    lng: [113.94, 114.06, 114.13, 113.90][i]!,
    radiusKm: 3, tier: 'S' as const, tenantId: 'default',
  })),
  ...(['锦江', '武侯', '成华', '金牛'] as const).map((d, i) => ({
    city: '成都', district: d, landmark: ['春熙路', '武侯祠', '建设路', '一品天下'][i]!,
    lat: [30.66, 30.65, 30.67, 30.70][i]!,
    lng: [104.08, 104.05, 104.10, 104.04][i]!,
    radiusKm: 3, tier: 'S' as const, tenantId: 'default',
  })),

  // ── A级 重点城市 ──
  ...(['上城', '西湖', '滨江', '余杭'] as const).map((d, i) => ({
    city: '杭州', district: d, landmark: ['湖滨银泰', '灵隐', '星光大道', '未来科技城'][i]!,
    lat: [30.25, 30.26, 30.21, 30.28][i]!,
    lng: [120.17, 120.12, 120.21, 120.02][i]!,
    radiusKm: 3, tier: 'A' as const, tenantId: 'default',
  })),
  ...(['渝中', '江北', '南岸', '沙坪坝'] as const).map((d, i) => ({
    city: '重庆', district: d, landmark: ['解放碑', '观音桥', '南滨路', '三峡广场'][i]!,
    lat: [29.56, 29.57, 29.54, 29.54][i]!,
    lng: [106.57, 106.53, 106.56, 106.46][i]!,
    radiusKm: 3, tier: 'A' as const, tenantId: 'default',
  })),
  { city: '武汉', district: '江汉', landmark: '江汉路', lat: 30.58, lng: 114.27, radiusKm: 3, tier: 'A', tenantId: 'default' },
  { city: '武汉', district: '武昌', landmark: '光谷', lat: 30.51, lng: 114.41, radiusKm: 3, tier: 'A', tenantId: 'default' },
  { city: '武汉', district: '洪山', landmark: '街道口', lat: 30.51, lng: 114.35, radiusKm: 3, tier: 'A', tenantId: 'default' },
  { city: '西安', district: '雁塔', landmark: '大雁塔', lat: 34.22, lng: 108.96, radiusKm: 3, tier: 'A', tenantId: 'default' },
  { city: '西安', district: '碑林', landmark: '钟楼', lat: 34.26, lng: 108.94, radiusKm: 3, tier: 'A', tenantId: 'default' },
  { city: '西安', district: '未央', landmark: '大明宫', lat: 34.32, lng: 108.96, radiusKm: 3, tier: 'A', tenantId: 'default' },
  { city: '南京', district: '鼓楼', landmark: '新街口', lat: 32.04, lng: 118.78, radiusKm: 3, tier: 'A', tenantId: 'default' },
  { city: '南京', district: '秦淮', landmark: '夫子庙', lat: 32.02, lng: 118.79, radiusKm: 3, tier: 'A', tenantId: 'default' },
  { city: '南京', district: '建邺', landmark: '河西', lat: 32.03, lng: 118.74, radiusKm: 3, tier: 'A', tenantId: 'default' },
  { city: '长沙', district: '芙蓉', landmark: '五一广场', lat: 28.20, lng: 112.98, radiusKm: 3, tier: 'A', tenantId: 'default' },

  // ── B级 潜力城市 ──
  { city: '苏州', district: '姑苏', landmark: '观前街', lat: 31.31, lng: 120.63, radiusKm: 3, tier: 'B', tenantId: 'default' },
  { city: '苏州', district: '园区', landmark: '苏州中心', lat: 31.32, lng: 120.67, radiusKm: 3, tier: 'B', tenantId: 'default' },
  { city: '宁波', district: '海曙', landmark: '天一广场', lat: 29.87, lng: 121.55, radiusKm: 3, tier: 'B', tenantId: 'default' },
  { city: '厦门', district: '思明', landmark: '中山路', lat: 24.46, lng: 118.08, radiusKm: 3, tier: 'B', tenantId: 'default' },
  { city: '济南', district: '历下', landmark: '泉城广场', lat: 36.66, lng: 117.02, radiusKm: 3, tier: 'B', tenantId: 'default' },
  { city: '合肥', district: '庐阳', landmark: '淮河路', lat: 31.87, lng: 117.28, radiusKm: 3, tier: 'B', tenantId: 'default' },
  { city: '青岛', district: '市南', landmark: '五四广场', lat: 36.07, lng: 120.38, radiusKm: 3, tier: 'B', tenantId: 'default' },
  { city: '昆明', district: '五华', landmark: '南屏街', lat: 25.04, lng: 102.71, radiusKm: 3, tier: 'B', tenantId: 'default' },
  { city: '大连', district: '中山', landmark: '青泥洼', lat: 38.92, lng: 121.64, radiusKm: 3, tier: 'B', tenantId: 'default' },
  { city: '福州', district: '鼓楼', landmark: '东街口', lat: 26.08, lng: 119.30, radiusKm: 3, tier: 'B', tenantId: 'default' },
]

function main() {
  console.log(`📊 GEO 地域标签种子数据: ${CITIES.length} 条`)
  console.log(`   城市覆盖: ${new Set(CITIES.map(c => c.city)).size} 城`)
  console.log(`   级别分布: S=${CITIES.filter(c => c.tier === 'S').length} / A=${CITIES.filter(c => c.tier === 'A').length} / B=${CITIES.filter(c => c.tier === 'B').length}`)
  console.log('')
  console.log('📋 城市列表:')
  for (const tier of ['S', 'A', 'B'] as const) {
    const cities = [...new Set(CITIES.filter(c => c.tier === tier).map(c => c.city))]
    console.log(`   ${tier}级 (${cities.length}城): ${cities.join('、')}`)
  }
  console.log('')
  console.log('💡 使用: 启动API后通过 POST /seo/geo-locations 批量导入')
  console.log('   curl -X POST http://127.0.0.1:8098/api/seo/geo-locations -H "Content-Type: application/json" -d \'{"city":"...","district":"...","landmark":"...","lat":...,"lng":...,"radiusKm":3,"tenantId":"default"}\'')
}

main()
