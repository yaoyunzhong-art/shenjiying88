/**
 * 运动蚂蚁产品中心页面 - 重构版
 * BigAnts Products Page - Enhanced
 * 按四大核心业务组织 + 人群筛选 + SaaS融合
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import ExitIntentPopup from '../components/ExitIntentPopup';
import ConversionTracker from '../components/ConversionTracker';
import ProductCTA from '../components/ProductCTA';
import { getAllPersonas, USER_PERSONAS, UserPersonaId } from '../lib/user-personas';
import { SAAS_FEATURES } from '../lib/shenjiying-saas';
import { conversionService } from '../lib/conversion-service';

// 产品分类（按四大核心业务重组）
export type ProductCategory = 
  | 'digital-sports'     // 数字运动产品（核心业务1）
  | 'epc-equipment'     // EPC设备供应（核心业务2）
  | 'franchise-package' // 加盟套餐设备（核心业务3）
  | 'tender-solution';  // 招投标解决方案（核心业务4）

// 产品数据
interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryName: string;
  subCategory: string;
  description: string;
  tags: string[];
  featured: boolean;
  highlight: string;
  pricing: string;
  power: string;
  area: string;
  capacity: string;
  applicableVenues: string[];
  targetPersonas: UserPersonaId[];  // 适用人群
  saasFeature?: keyof typeof SAAS_FEATURES;  // 关联SaaS功能
  patentCount: number;  // 专利数
  marketData?: { label: string; value: string };  // 市场数据
  image?: string;  // 产品图片
}

const PRODUCTS: Product[] = [
  // 数字运动产品（核心业务1）
  {
    id: 'super-tennis',
    name: '超级网球 AI对战版',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '模拟运动',
    description: '利用发球机与软件画面营造出真实比赛场景，实现玩家与AI的实时对抗',
    tags: ['网球', 'AI对战', '多关卡', '真人PK'],
    featured: true,
    highlight: 'AI智能对战',
    pricing: '¥150,000-280,000',
    power: '3.5kW',
    area: '32㎡（8m×4m）',
    capacity: '1-4人/次',
    applicableVenues: ['商业综合体', '健身房', '体育场馆'],
    targetPersonas: ['chain-investor', 'commercial-property', 'first-time-entrepreneur', 'family-venue'],
    saasFeature: 'equipment-monitor',
    patentCount: 12,
    marketData: { label: '月均体验人次', value: '5000+' },
    image: '/images/products/tennis-simulator.jpg',
  },
  {
    id: 'baseball',
    name: '模拟棒球',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '模拟运动',
    description: '高度还原棒球比赛场景，击球手、投手、守备员多角色体验',
    tags: ['棒球', '团队协作', '实时对抗'],
    featured: true,
    highlight: '多角色切换',
    pricing: '¥180,000-320,000',
    power: '4.2kW',
    area: '50㎡（10m×5m）',
    capacity: '1-6人/次',
    applicableVenues: ['商业综合体', '体育主题场馆', '青少年培训中心'],
    targetPersonas: ['chain-investor', 'commercial-property', 'family-venue', 'traditional-entertainment'],
    saasFeature: 'equipment-monitor',
    patentCount: 8,
    marketData: { label: '客户满意度', value: '96%' },
    image: '/images/products/baseball-simulator.jpg',
  },
  {
    id: 'golf',
    name: '模拟高尔夫 Pro',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '模拟运动',
    description: '高精度击球感应，真实球场模拟，50+真实球场选择',
    tags: ['高尔夫', '专业级', '多球场'],
    featured: false,
    highlight: '50+真实球场',
    pricing: '¥280,000-450,000',
    power: '5.0kW',
    area: '45㎡（9m×5m）',
    capacity: '1-2人/次',
    applicableVenues: ['高端会所', '酒店', '私人俱乐部'],
    targetPersonas: ['chain-investor', 'hospitality', 'overseas-market'],
    saasFeature: 'content-update',
    patentCount: 15,
    image: '/images/products/golf-simulator.jpg',
  },
  {
    id: 'shooting-master',
    name: '枪王之王',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '射击系列',
    description: '闯关类射击游戏，8个关卡，多种射击模式，支持4人联机PK',
    tags: ['射击', '闯关', '联机PK', '礼品奖励'],
    featured: true,
    highlight: '8关闯关+礼品',
    pricing: '¥120,000-200,000',
    power: '2.8kW',
    area: '24㎡（6m×4m）',
    capacity: '1-4人/次',
    applicableVenues: ['游戏厅', '商业综合体', '游乐场'],
    targetPersonas: ['commercial-property', 'first-time-entrepreneur', 'traditional-entertainment', 'family-venue'],
    saasFeature: 'member-marketing',
    patentCount: 6,
    marketData: { label: '礼品兑换率', value: '78%' },
    image: '/images/products/shooting-game.jpg',
  },
  {
    id: 'vr-skiing',
    name: 'VR滑雪 沉浸版',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: 'VR/AR系列',
    description: '沉浸式VR滑雪体验，360°全景画面，如临真实雪场',
    tags: ['VR', '滑雪', '沉浸式', '全景'],
    featured: true,
    highlight: '360°全景VR',
    pricing: '¥200,000-350,000',
    power: '3.0kW',
    area: '20㎡（5m×4m）',
    capacity: '1-2人/次',
    applicableVenues: ['滑雪场', '文旅景区', '亲子乐园', '商业综合体'],
    targetPersonas: ['commercial-property', 'family-venue', 'government-project', 'hospitality'],
    saasFeature: 'content-update',
    patentCount: 10,
    marketData: { label: '日均体验时长', value: '25分钟' },
    image: '/images/products/vr-skiing.jpg',
  },
  {
    id: 'flight-simulator',
    name: '飞行模拟器 旗舰版',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '大型游戏',
    description: '六轴民航级别驾驶舱，沉浸式飞行体验，如临真实驾驶',
    tags: ['飞行', '模拟', '专业级', '六轴平台'],
    featured: true,
    highlight: '六轴运动平台',
    pricing: '¥450,000-800,000',
    power: '8.5kW',
    area: '30㎡（6m×5m）',
    capacity: '1-2人/次',
    applicableVenues: ['航空航天体验馆', '科技馆', '主题公园', '商业综合体'],
    targetPersonas: ['chain-investor', 'government-project', 'commercial-property', 'traditional-entertainment'],
    saasFeature: 'equipment-monitor',
    patentCount: 22,
    marketData: { label: '客单价', value: '¥198/人' },
    image: '/images/products/flight-simulator.jpg',
  },
  {
    id: 'dragon-fist',
    name: '龙拳3纯玩版',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '娱乐设备',
    description: '简约时尚外观，真实拳击打击感，有机会赢得彩票奖励',
    tags: ['拳击', '彩票', '定制外观', '高坪效'],
    featured: true,
    highlight: '高坪效爆品',
    pricing: '¥45,000-80,000',
    power: '1.5kW',
    area: '6㎡（3m×2m）',
    capacity: '1人/次',
    applicableVenues: ['游戏厅', '酒吧', '电影院', '便利店'],
    targetPersonas: ['first-time-entrepreneur', 'traditional-entertainment', 'hospitality'],
    saasFeature: 'member-marketing',
    patentCount: 4,
    marketData: { label: '日均营收', value: '¥2000+' },
    image: '/images/products/dragon-fist.jpg',
  },
  {
    id: 'racing-simulator',
    name: '赛车模拟器 专业版',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '模拟运动',
    description: '专业赛车座椅+三联屏沉浸体验，支持多人联机对战，真实赛车手感',
    tags: ['赛车', '模拟驾驶', '联机对战', '专业座椅'],
    featured: false,
    highlight: '三联屏沉浸',
    pricing: '¥180,000-280,000',
    power: '4.0kW',
    area: '25㎡（5m×5m）',
    capacity: '1-2人/次',
    applicableVenues: ['游戏厅', '电竞馆', '商业综合体', '汽车4S店'],
    targetPersonas: ['chain-investor', 'commercial-property', 'first-time-entrepreneur'],
    saasFeature: 'member-marketing',
    patentCount: 8,
    marketData: { label: '日均体验人次', value: '80+' },
    image: '/images/products/racing-simulator.jpg',
  },
  {
    id: 'bowling-simulator',
    name: '模拟保龄球',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '模拟运动',
    description: '真实保龄球道还原，支持多种游戏模式，适合全家同乐',
    tags: ['保龄球', '家庭娱乐', '多模式', '真实球道'],
    featured: false,
    highlight: '真实球道体验',
    pricing: '¥220,000-380,000',
    power: '5.5kW',
    area: '40㎡（8m×5m）',
    capacity: '1-6人/次',
    applicableVenues: ['商业综合体', '家庭娱乐中心', '社区活动中心'],
    targetPersonas: ['family-venue', 'commercial-property', 'first-time-entrepreneur'],
    saasFeature: 'equipment-monitor',
    patentCount: 12,
    marketData: { label: '家庭占比', value: '65%' },
    image: '/images/products/bowling-simulator.jpg',
  },
  {
    id: 'vr-shooting',
    name: 'VR射击战场',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: 'VR/AR系列',
    description: '多人联机VR射击游戏，真实持枪手感，多种战场场景',
    tags: ['VR', '射击', '联机对战', '沉浸体验'],
    featured: true,
    highlight: '多人VR联机',
    pricing: '¥280,000-450,000',
    power: '6.0kW',
    area: '35㎡（7m×5m）',
    capacity: '2-8人/次',
    applicableVenues: ['VR体验馆', '主题公园', '文旅景区', '密室逃脱升级'],
    targetPersonas: ['chain-investor', 'government-project', 'traditional-entertainment'],
    saasFeature: 'member-marketing',
    patentCount: 18,
    marketData: { label: '客单价', value: '¥128/人' },
    image: '/images/products/vr-shooting.jpg',
  },
  {
    id: 'boxing-master',
    name: '拳击大师 AI版',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '健身系列',
    description: 'AI陪练模式，实时打分系统，专业拳击训练体验',
    tags: ['拳击', 'AI陪练', '健身', '实时打分'],
    featured: false,
    highlight: 'AI陪练+打分',
    pricing: '¥85,000-150,000',
    power: '2.0kW',
    area: '12㎡（4m×3m）',
    capacity: '1-2人/次',
    applicableVenues: ['健身房', '拳击馆', '酒店', '企业健身中心'],
    targetPersonas: ['hospitality', 'chain-investor', 'first-time-entrepreneur'],
    saasFeature: 'member-marketing',
    patentCount: 6,
    marketData: { label: '日均训练人次', value: '40+' },
    image: '/images/products/boxing-master.jpg',
  },
  {
    id: 'table-tennis-ai',
    name: 'AI乒乓球陪练',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '健身系列',
    description: 'AI发球机陪练，多难度适应，实时技术分析',
    tags: ['乒乓球', 'AI陪练', '技术分析', '多难度'],
    featured: false,
    highlight: 'AI发球+分析',
    pricing: '¥68,000-120,000',
    power: '1.8kW',
    area: '20㎡（5m×4m）',
    capacity: '1-2人/次',
    applicableVenues: ['社区中心', '学校', '健身房', '体育场馆'],
    targetPersonas: ['government-project', 'family-venue', 'hospitality'],
    saasFeature: 'member-marketing',
    patentCount: 5,
    marketData: { label: '技术提升效果', value: '显著' },
    image: '/images/products/table-tennis-ai.jpg',
  },
  {
    id: 'climbing-wall',
    name: '室内攀岩 AR版',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: 'AR/互动系列',
    description: 'AR互动攀岩，实时计分排名，多种场景变换，安全性高',
    tags: ['攀岩', 'AR互动', '安全', '计分排名'],
    featured: false,
    highlight: 'AR+安全攀岩',
    pricing: '¥150,000-250,000',
    power: '3.5kW',
    area: '30㎡（6m×5m）',
    capacity: '1-4人/次',
    applicableVenues: ['亲子乐园', '商业综合体', '蹦床馆', '学校体育设施'],
    targetPersonas: ['family-venue', 'commercial-property', 'government-project'],
    saasFeature: 'roi-calculator',
    patentCount: 9,
    marketData: { label: '儿童喜爱度', value: '98%' },
    image: '/images/products/climbing-wall.jpg',
  },
  {
    id: 'dance-machine',
    name: '跳舞机 全民版',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '娱乐设备',
    description: '经典跳舞机升级版，多人联机PK，100+首舞曲持续更新',
    tags: ['跳舞', '音乐', '联机PK', '舞曲更新'],
    featured: false,
    highlight: '100+舞曲持续更新',
    pricing: '¥55,000-95,000',
    power: '1.2kW',
    area: '10㎡（4m×2.5m）',
    capacity: '1-3人/次',
    applicableVenues: ['游戏厅', '电影院', 'KTV', '便利店'],
    targetPersonas: ['first-time-entrepreneur', 'traditional-entertainment', 'hospitality'],
    saasFeature: 'content-update',
    patentCount: 3,
    marketData: { label: '日均活跃用户', value: '120+' },
    image: '/images/products/dance-machine.jpg',
  },
  {
    id: 'hunting-simulator',
    name: '模拟狩猎',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '射击系列',
    description: '沉浸式狩猎体验，多种猎物选择，真实场景还原',
    tags: ['狩猎', '射击', '沉浸式', '多种场景'],
    featured: false,
    highlight: '真实狩猎体验',
    pricing: '¥180,000-280,000',
    power: '3.2kW',
    area: '35㎡（7m×5m）',
    capacity: '1-4人/次',
    applicableVenues: ['狩猎场', '主题公园', '文旅景区', '度假村'],
    targetPersonas: ['chain-investor', 'hospitality', 'government-project'],
    saasFeature: 'member-marketing',
    patentCount: 8,
    marketData: { label: '客户满意度', value: '94%' },
    image: '/images/products/hunting-simulator.jpg',
  },
  {
    id: 'fencing-simulator',
    name: '模拟击剑',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '格斗系列',
    description: '专业击剑动作捕捉，AI对战模式，实时技术分析',
    tags: ['击剑', '格斗', 'AI对战', '技术分析'],
    featured: false,
    highlight: 'AI击剑陪练',
    pricing: '¥120,000-200,000',
    power: '2.5kW',
    area: '25㎡（5m×5m）',
    capacity: '1-2人/次',
    applicableVenues: ['击剑馆', '学校体育', '健身房', '企业健身'],
    targetPersonas: ['government-project', 'hospitality', 'chain-investor'],
    saasFeature: 'customer-profile',
    patentCount: 6,
    marketData: { label: '技术提升效果', value: '+40%' },
    image: '/images/products/fencing-simulator.jpg',
  },
  {
    id: 'skiing-simulator',
    name: '模拟滑雪 入门版',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '模拟运动',
    description: '真实滑雪手感，多难度雪道，室内就能体验滑雪乐趣',
    tags: ['滑雪', '模拟运动', '室内滑雪', '多难度'],
    featured: false,
    highlight: '室内滑雪体验',
    pricing: '¥150,000-250,000',
    power: '4.0kW',
    area: '40㎡（8m×5m）',
    capacity: '1-2人/次',
    applicableVenues: ['滑雪场', '商业综合体', '亲子乐园', '文旅景区'],
    targetPersonas: ['family-venue', 'commercial-property', 'hospitality'],
    saasFeature: 'content-update',
    patentCount: 7,
    marketData: { label: '复玩率', value: '65%' },
    image: '/images/products/skiing-simulator.jpg',
  },
  {
    id: 'equestrian-simulator',
    name: '模拟马术',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '模拟运动',
    description: '仿真马术骑行，多种马匹选择，场景丰富多变',
    tags: ['马术', '模拟骑行', '户外场景', '专业训练'],
    featured: false,
    highlight: '仿真马术体验',
    pricing: '¥200,000-320,000',
    power: '3.8kW',
    area: '30㎡（6m×5m）',
    capacity: '1-2人/次',
    applicableVenues: ['马术俱乐部', '高端会所', '文旅景区', '学校体育'],
    targetPersonas: ['hospitality', 'government-project', 'chain-investor'],
    saasFeature: 'equipment-monitor',
    patentCount: 10,
    marketData: { label: '专业训练效果', value: '显著' },
    image: '/images/products/equestrian-simulator.jpg',
  },
  {
    id: 'rowing-simulator',
    name: '模拟赛艇',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '健身系列',
    description: '真实划船体验，多人联机竞赛，实时体能数据',
    tags: ['赛艇', '健身', '联机竞赛', '体能数据'],
    featured: false,
    highlight: '多人联机竞赛',
    pricing: '¥160,000-260,000',
    power: '2.8kW',
    area: '20㎡（5m×4m）',
    capacity: '1-4人/次',
    applicableVenues: ['健身房', '水上运动中心', '企业健身', '社区健身'],
    targetPersonas: ['hospitality', 'chain-investor', 'first-time-entrepreneur'],
    saasFeature: 'member-marketing',
    patentCount: 5,
    marketData: { label: '卡路里消耗', value: '500kcal/小时' },
    image: '/images/products/rowing-simulator.jpg',
  },
  {
    id: 'fitness-robot',
    name: '智能健身机器人',
    category: 'digital-sports',
    categoryName: '数字运动产品',
    subCategory: '健身系列',
    description: 'AI私教机器人，个性化训练方案，实时动作纠正',
    tags: ['健身', 'AI私教', '智能训练', '动作纠正'],
    featured: true,
    highlight: 'AI私教+纠正',
    pricing: '¥80,000-150,000',
    power: '1.5kW',
    area: '8㎡（4m×2m）',
    capacity: '1人/次',
    applicableVenues: ['健身房', '企业健身', '酒店', '社区健身'],
    targetPersonas: ['hospitality', 'chain-investor', 'first-time-entrepreneur'],
    saasFeature: 'member-marketing',
    patentCount: 12,
    marketData: { label: '训练效果提升', value: '+50%' },
    image: '/images/products/fitness-robot.jpg',
  },
  // EPC设备（核心业务2）
  {
    id: 'epc-bundle-standard',
    name: 'EPC标准设备包',
    category: 'epc-equipment',
    categoryName: 'EPC设备供应',
    subCategory: '设备套餐',
    description: 'EPC全流程服务标准设备配置，包含全套数字运动设备+安装调试+培训',
    tags: ['EPC', '全包', '标准配置', '一站式'],
    featured: true,
    highlight: 'EPC全流程',
    pricing: '¥500,000-1,500,000',
    power: '根据配置',
    area: '200-500㎡',
    capacity: '根据配置',
    applicableVenues: ['新建数字运动馆', '旧店升级', '商业综合体'],
    targetPersonas: ['first-time-entrepreneur', 'chain-investor', 'government-project'],
    saasFeature: 'site-selection',
    patentCount: 0,
    image: '/images/products/epc-bundle.jpg',
  },
  // 招投标解决方案（核心业务4）
  {
    id: 'tender-gov-sports',
    name: '政府公共体育数字运动解决方案',
    category: 'tender-solution',
    categoryName: '招投标解决方案',
    subCategory: '政府项目',
    description: '专为政府公共体育设施设计的数字化运动解决方案，符合国家体育设施标准',
    tags: ['政府项目', 'EPC+O', '公共体育', '资质齐全'],
    featured: true,
    highlight: '政府资质认证',
    pricing: '¥800,000-3,000,000',
    power: '根据规模',
    area: '500-2000㎡',
    capacity: '根据规模',
    applicableVenues: ['政府体育中心', '社区健身中心', '学校体育设施'],
    targetPersonas: ['government-project'],
    saasFeature: 'operations-dashboard',
    patentCount: 0,
    image: '/images/solutions/government-sports.jpg',
  },
  {
    id: 'tender-culture-tourism',
    name: '文旅景区数字运动解决方案',
    category: 'tender-solution',
    categoryName: '招投标解决方案',
    subCategory: '文旅项目',
    description: '结合文旅景区特色的数字运动体验项目，提升景区吸引力和消费体验',
    tags: ['文旅', '景区', 'EPC+O', '体验升级'],
    featured: false,
    highlight: '文旅融合',
    pricing: '¥600,000-2,000,000',
    power: '根据规模',
    area: '300-1000㎡',
    capacity: '根据规模',
    applicableVenues: ['旅游景区', '主题公园', '文旅小镇'],
    targetPersonas: ['government-project', 'chain-investor'],
    saasFeature: 'site-selection',
    patentCount: 0,
    image: '/images/solutions/culture-tourism.jpg',
  },
];

// 分类配置
const CATEGORY_CONFIG: Record<ProductCategory, { 
  name: string; 
  icon: string; 
  color: string;
  description: string;
  businessCore: string;
}> = {
  'digital-sports': {
    name: '数字运动产品',
    icon: '🎮',
    color: '#0066FF',
    description: '60+款自主研发数字运动设备，覆盖模拟运动、射击、VR/AR等全系列',
    businessCore: '核心业务1：数字运动潮玩全链路业务',
  },
  'epc-equipment': {
    name: 'EPC设备供应',
    icon: '🏗️',
    color: '#FF6B00',
    description: 'EPC全流程服务配套设备，源头生产，品质保障',
    businessCore: '核心业务2：数字运动潮玩馆一站式全流程服务',
  },
  'franchise-package': {
    name: '加盟套餐设备',
    icon: '🤝',
    color: '#00C853',
    description: '三种加盟模式配套设备套餐，灵活选择，总有一款适合您',
    businessCore: '核心业务3：品牌全渠道招商加盟体系',
  },
  'tender-solution': {
    name: '招投标解决方案',
    icon: '📋',
    color: '#8B5CF6',
    description: '政府公共体育设施、文旅景区等大型项目EPC+O全模式承接',
    businessCore: '核心业务4：招投标及政府项目EPC+O承接',
  },
};

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [activePersona, setActivePersona] = useState<UserPersonaId | 'all'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const personas = getAllPersonas();

  // 过滤和排序产品
  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];

    // 按分类过滤
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    // 按人群过滤
    if (activePersona !== 'all') {
      result = result.filter(p => p.targetPersonas.includes(activePersona));
    }

    // 排序
    if (sortBy === 'price-asc') {
      result.sort((a, b) => {
        const aPrice = parseInt(a.pricing.replace(/[^0-9]/g, '')) || 0;
        const bPrice = parseInt(b.pricing.replace(/[^0-9]/g, '')) || 0;
        return aPrice - bPrice;
      });
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const aPrice = parseInt(a.pricing.replace(/[^0-9]/g, '')) || 0;
        const bPrice = parseInt(b.pricing.replace(/[^0-9]/g, '')) || 0;
        return bPrice - aPrice;
      });
    } else {
      // 默认：热门优先
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [activeCategory, activePersona, sortBy]);

  // 追踪人群切换
  const handlePersonaChange = (personaId: UserPersonaId | 'all') => {
    setActivePersona(personaId);
    if (personaId !== 'all') {
      conversionService.trackUserPersona(personaId, 80);
      conversionService.trackCTAClick('products', `persona_${personaId}`);
    } else {
      conversionService.trackCTAClick('products', 'persona_all');
    }
  };

  // 追踪分类切换
  const handleCategoryChange = (category: ProductCategory | 'all') => {
    setActiveCategory(category);
    conversionService.trackCTAClick('products', `category_${category}`);
  };

  // 追踪排序变化
  const handleSortChange = (sort: typeof sortBy) => {
    setSortBy(sort);
    conversionService.trackCTAClick('products', `sort_${sort}`);
  };

  // 追踪产品卡片点击
  const handleProductClick = (productId: string) => {
    conversionService.trackCTAClick('products', `product_${productId}`);
  };

  return (
    <>
      <SEOMeta
        title="产品中心 - 数字运动设备全系列"
        description="运动蚂蚁提供60+款数字运动设备，包括模拟运动（网球、棒球、高尔夫）、射击系列、VR/AR系列、大型游戏设备等，满足各类场馆差异化需求。神机营SaaS系统全程赋能。"
        keywords={['数字运动设备', '模拟运动', 'VR设备', '射击设备', '游戏机', 'EPC设备']}
        type="website"
      />

      <ConversionTracker page="products" />

      <div className="min-h-screen bg-white">
        <Header />

        {/* Hero Section */}
        <section
          style={{
            paddingTop: '120px',
            paddingBottom: '60px',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: '16px',
              }}
            >
              产品中心
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#666666',
                maxWidth: '700px',
                margin: '0 auto',
                marginBottom: '16px',
              }}
            >
              60+款数字运动设备，涵盖模拟运动、射击、VR/AR等全系列
            </p>
            {/* SaaS融合标识 */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(0, 200, 83, 0.1)',
                border: '1px solid rgba(0, 200, 83, 0.3)',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '16px' }}>☁️</span>
              <span style={{ fontSize: '13px', color: '#00C853' }}>
                所有设备接入神机营SaaS系统，IoT监控 + 云端内容更新
              </span>
            </div>
          </div>
        </section>

        {/* 四大核心业务导航 */}
        <section style={{ padding: '0 0 40px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => handleCategoryChange('all')}
                style={{
                  padding: '10px 20px',
                  background: activeCategory === 'all' ? '#0066FF' : '#F8FAFC',
                  color: activeCategory === 'all' ? '#FFFFFF' : '#666666',
                  border: `1px solid ${activeCategory === 'all' ? '#0066FF' : '#E2E8F0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                全部产品
              </button>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(key as ProductCategory)}
                  style={{
                    padding: '10px 20px',
                    background: activeCategory === key ? config.color : '#F8FAFC',
                    color: activeCategory === key ? '#FFFFFF' : '#666666',
                    border: `1px solid ${activeCategory === key ? config.color : '#E2E8F0'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{config.icon}</span>
                  <span>{config.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 人群筛选器 */}
        <section style={{ padding: '24px 0', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#666666', fontWeight: 500 }}>
                适用人群：
              </span>
              <button
                onClick={() => handlePersonaChange('all')}
                style={{
                  padding: '6px 14px',
                  background: activePersona === 'all' ? '#1A1A2E' : '#FFFFFF',
                  color: activePersona === 'all' ? '#FFFFFF' : '#666666',
                  border: `1px solid ${activePersona === 'all' ? '#1A1A2E' : '#E2E8F0'}`,
                  borderRadius: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                全部
              </button>
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaChange(persona.id)}
                  style={{
                    padding: '6px 14px',
                    background: activePersona === persona.id ? persona.color : '#FFFFFF',
                    color: activePersona === persona.id ? '#FFFFFF' : '#666666',
                    border: `1px solid ${activePersona === persona.id ? persona.color : '#E2E8F0'}`,
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{persona.icon}</span>
                  <span>{persona.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 产品网格 */}
        <section style={{ padding: '40px 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
            {/* 结果统计 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#666666' }}>
                共找到 <span style={{ fontWeight: 600, color: '#1A1A2E' }}>{filteredProducts.length}</span> 款产品
                {activePersona !== 'all' && (
                  <span style={{ color: '#0066FF' }}> / 匹配{USER_PERSONAS[activePersona]?.name}的需求</span>
                )}
              </p>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#666666',
                  cursor: 'pointer',
                }}
              >
                <option value="default">默认排序</option>
                <option value="price-asc">价格从低到高</option>
                <option value="price-desc">价格从高到低</option>
              </select>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '24px',
              }}
            >
              {filteredProducts.map((product) => {
                const categoryConfig = CATEGORY_CONFIG[product.category];
                const applicablePersonas = product.targetPersonas.map(id => USER_PERSONAS[id]).filter(Boolean);

                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.25s ease',
                      border: '1px solid #F1F5F9',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* 产品图片区域 */}
                    <div
                      style={{
                        height: '180px',
                        background: product.image
                          ? `url(${product.image}) center/cover no-repeat`
                          : `linear-gradient(135deg, ${categoryConfig.color}15 0%, ${categoryConfig.color}05 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {!product.image && (
                        <div style={{ fontSize: '64px', opacity: 0.6 }}>{categoryConfig.icon}</div>
                      )}
                      
                      {/* 标签 */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                        {product.featured && (
                          <span
                            style={{
                              padding: '4px 10px',
                              background: '#FF6B00',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '6px',
                            }}
                          >
                            热门
                          </span>
                        )}
                        <span
                          style={{
                            padding: '4px 10px',
                            background: categoryConfig.color,
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                          }}
                        >
                          {categoryConfig.name}
                        </span>
                      </div>

                      {/* SaaS功能标识 */}
                      {product.saasFeature && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            padding: '4px 10px',
                            background: 'rgba(0, 200, 83, 0.1)',
                            border: '1px solid rgba(0, 200, 83, 0.3)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ fontSize: '12px' }}>
                            {SAAS_FEATURES[product.saasFeature]?.icon || '☁️'}
                          </span>
                          <span style={{ fontSize: '10px', color: '#00C853' }}>
                            SaaS
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 产品信息 */}
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3
                          style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#1A1A2E',
                          }}
                        >
                          {product.name}
                        </h3>
                        {product.highlight && (
                          <span
                            style={{
                              padding: '2px 8px',
                              background: `${categoryConfig.color}15`,
                              color: categoryConfig.color,
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '4px',
                            }}
                          >
                            {product.highlight}
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: '13px',
                          color: '#666666',
                          lineHeight: 1.6,
                          marginBottom: '12px',
                        }}
                      >
                        {product.description}
                      </p>

                      {/* 规格参数 */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                          padding: '12px',
                          background: '#F8FAFC',
                          borderRadius: '8px',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#999999', marginBottom: '2px' }}>功率</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E' }}>{product.power}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#999999', marginBottom: '2px' }}>面积</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E' }}>{product.area}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#999999', marginBottom: '2px' }}>容量</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E' }}>{product.capacity}</div>
                        </div>
                      </div>

                      {/* 市场数据 */}
                      {product.marketData && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            background: 'rgba(0, 102, 255, 0.05)',
                            borderRadius: '6px',
                            marginBottom: '12px',
                          }}
                        >
                          <span style={{ fontSize: '12px', color: '#0066FF' }}>📊</span>
                          <span style={{ fontSize: '12px', color: '#666666' }}>{product.marketData.label}：</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0066FF' }}>{product.marketData.value}</span>
                        </div>
                      )}

                      {/* 适用人群 */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#999999', marginBottom: '6px' }}>适用人群</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {applicablePersonas.slice(0, 3).map((persona) => (
                            <span
                              key={persona.id}
                              style={{
                                padding: '2px 8px',
                                background: `${persona.color}15`,
                                color: persona.color,
                                fontSize: '11px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <span>{persona.icon}</span>
                              <span>{persona.name}</span>
                            </span>
                          ))}
                          {applicablePersonas.length > 3 && (
                            <span style={{ fontSize: '11px', color: '#999999' }}>
                              +{applicablePersonas.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 价格和操作 */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#999999' }}>参考价格</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#FF6B00' }}>{product.pricing}</div>
                        </div>
                        <button
                          onClick={() => {
                            conversionService.trackCTAClick('products', `咨询-${product.name}`);
                            window.location.href = `/sports-ants/contact?source=product&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.categoryName)}`;
                          }}
                          style={{
                            padding: '10px 20px',
                            background: '#F1F5F9',
                            color: '#1A1A2E',
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          咨询详情
                        </button>
                        <button
                          onClick={() => {
                            conversionService.trackCTAClick('products', `获取报价-${product.name}`);
                            window.location.href = `/sports-ants/contact?source=product&product=${encodeURIComponent(product.name)}&type=quote`;
                          }}
                          style={{
                            padding: '10px 20px',
                            background: categoryConfig.color,
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          获取报价
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 空状态 */}
            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A2E', marginBottom: '8px' }}>
                  未找到匹配的产品
                </h3>
                <p style={{ fontSize: '14px', color: '#666666', marginBottom: '24px' }}>
                  尝试调整筛选条件，或联系我们的专业顾问获取定制方案
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setActivePersona('all');
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#0066FF',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  清除筛选
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 三步转化法CTA区块 */}
        <section style={{ padding: '60px 0', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 24px' }}>
            <ProductCTA productName="数字运动设备" productCategory="全系列" />
          </div>
        </section>

        {/* 需要定制 */}
        <section
          style={{
            padding: '60px 0',
            background: '#0066FF',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            需要定制产品方案？
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '24px',
            }}
          >
            根据您的场馆需求、预算和目标人群，我们提供量身定制的产品和服务方案
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              href="/sports-ants/epc"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                background: '#FFFFFF',
                color: '#0066FF',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '9999px',
                textDecoration: 'none',
              }}
            >
              EPC全流程服务 →
            </Link>
            <Link
              href="/sports-ants/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                background: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '9999px',
                textDecoration: 'none',
                border: '2px solid #FFFFFF',
              }}
            >
              咨询专属顾问
            </Link>
          </div>
        </section>

        <FloatingContact />

        <ExitIntentPopup delaySeconds={10} />

        <Footer />
      </div>
    </>
  );
}
