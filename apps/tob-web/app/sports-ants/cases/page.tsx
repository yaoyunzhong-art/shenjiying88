/**
 * 运动蚂蚁案例中心页面 - 重构版
 * BigAnts Cases Page - Enhanced
 * 四大核心业务分类 + 八类人群筛选 + 可量化成果数据 + SaaS应用
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
import CaseCTA from '../components/CaseCTA';
import { getAllPersonas, UserPersonaId } from '../lib/user-personas';
import { SAAS_FEATURES } from '../lib/shenjiying-saas';
import { conversionService } from '../lib/conversion-service';

// 四大核心业务分类
export type BusinessCore = 'digital-products' | 'epc-service' | 'franchise' | 'tender';

interface CaseStudy {
  id: string;
  clientName: string;
  clientType: string;
  location: string;
  businessCore: BusinessCore;
  businessCoreName: string;
  description: string;
  // 可量化成果数据
  metrics: {
    label: string;
    value: string;
    change?: string; // 同比增长
  }[];
  // 客户证言
  testimonial?: {
    name: string;
    position: string;
    content: string;
    rating: number;
  };
  // 部署产品
  products: string[];
  // 适用人群
  targetPersonas: UserPersonaId[];
  // SaaS应用功能
  saasFeatures: (keyof typeof SAAS_FEATURES)[];
  // 运营数据
  operatingMonths: number;
  monthlyRevenue: string;
  peak客流: string;
  // 图片占位
  imagePlaceholder: string;
  // 实际图片（可选）
  image?: string;
}

// 完整案例数据
const CASE_STUDIES: CaseStudy[] = [
  // 数字运动产品案例
  {
    id: 'case-wanda',
    clientName: '万达广场',
    clientType: '商业综合体',
    location: '全国50+门店',
    businessCore: 'digital-products',
    businessCoreName: '数字运动产品',
    description: '全国50+万达广场引入运动蚂蚁数字运动设备，打造差异化竞争优势，吸引年轻客群',
    metrics: [
      { label: '客流量提升', value: '35%+', change: '+35%' },
      { label: '设备利用率', value: '92%' },
      { label: '客户满意度', value: '96%' },
    ],
    testimonial: {
      name: '张总监',
      position: '万达广场北京区运营负责人',
      content: '运动蚂蚁的设备品质非常稳定，售后服务也很到位。引入数字运动项目后，我们的年轻客群占比提升了40%。',
      rating: 5,
    },
    products: ['超级网球', '模拟棒球', 'VR滑雪'],
    targetPersonas: ['chain-investor', 'commercial-property'],
    saasFeatures: ['equipment-monitor', 'operations-dashboard', 'content-update'],
    operatingMonths: 24,
    monthlyRevenue: '¥15-25万/店',
    peak客流: '5000+人次/日',
    imagePlaceholder: '🏬',
    image: '/images/cases/venue-1.jpg',
  },
  {
    id: 'case-huarun',
    clientName: '华润万象城',
    clientType: '高端购物中心',
    location: '深圳',
    businessCore: 'digital-products',
    businessCoreName: '数字运动产品',
    description: '深圳华润万象城引入超级网球、模拟棒球等设备，打造高品质数字运动体验区',
    metrics: [
      { label: '客单价提升', value: '¥68', change: '+68%' },
      { label: '停留时长增加', value: '2.5小时' },
      { label: '年轻客群占比', value: '62%' },
    ],
    testimonial: {
      name: '李经理',
      position: '华润万象城招商经理',
      content: '当初选择运动蚂蚁是因为他们的内容更新速度快，设备新颖。现在看来这个选择非常正确。',
      rating: 5,
    },
    products: ['超级网球', '模拟棒球', '枪王之王'],
    targetPersonas: ['commercial-property', 'chain-investor'],
    saasFeatures: ['member-marketing', 'content-update', 'customer-profile'],
    operatingMonths: 18,
    monthlyRevenue: '¥20-30万/店',
    peak客流: '8000+人次/日',
    imagePlaceholder: '🏢',
    image: '/images/cases/venue-3.jpg',
  },
  // EPC+O服务案例
  {
    id: 'case-sports-center',
    clientName: '某市体育中心',
    clientType: '政府公共体育设施',
    location: '华东地区',
    businessCore: 'epc-service',
    businessCoreName: 'EPC+O服务',
    description: 'EPC+O全流程服务，从选址评估到开业运营，全程专业化服务，打造市级标杆数字运动馆',
    metrics: [
      { label: '日均服务人次', value: '2000+', change: '+200%' },
      { label: '政府满意度', value: '98%' },
      { label: '项目完成周期', value: '4个月' },
    ],
    products: ['飞行模拟器', 'VR滑雪', '超级网球', '模拟棒球'],
    targetPersonas: ['government-project'],
    saasFeatures: ['site-selection', 'space-planning', 'operations-dashboard', 'roi-calculator'],
    operatingMonths: 12,
    monthlyRevenue: '¥40-60万',
    peak客流: '3000+人次/日',
    imagePlaceholder: '🏛️',
    image: '/images/cases/venue-2.jpg',
  },
  {
    id: 'case-scene-tourism',
    clientName: '某文旅景区',
    clientType: '旅游景区',
    location: '西南地区',
    businessCore: 'epc-service',
    businessCoreName: 'EPC+O服务',
    description: '文旅景区数字运动体验项目，打造沉浸式运动体验，提升景区吸引力和游客停留时间',
    metrics: [
      { label: '游客停留时间', value: '+3小时', change: '+150%' },
      { label: '二消收入提升', value: '85%' },
      { label: '社交媒体曝光', value: '500万+' },
    ],
    products: ['VR滑雪', '激光迷宫', '极限漂流'],
    targetPersonas: ['government-project', 'chain-investor'],
    saasFeatures: ['site-selection', 'space-planning', 'content-update'],
    operatingMonths: 8,
    monthlyRevenue: '¥80-120万',
    peak客流: '10000+人次/日',
    imagePlaceholder: '🎢',
    image: '/images/cases/venue-4.jpg',
  },
  // 招商加盟案例
  {
    id: 'case-franchise-1',
    clientName: '王老板',
    clientType: '初次创业者',
    location: '某三线城市',
    businessCore: 'franchise',
    businessCoreName: '招商加盟',
    description: '初次创业选择合作开店模式，首付40%启动，总部全程扶持，8个月回本',
    metrics: [
      { label: '回本周期', value: '8个月' },
      { label: '月均利润', value: '¥3.5万' },
      { label: '投资回报率', value: '156%' },
    ],
    testimonial: {
      name: '王老板',
      position: '某三线城市加盟商',
      content: '作为小城市投资者，最担心的是设备过时和运营经验不足。运动蚂蚁的EPC+O服务让我省心很多，从选址到运营全程有专业团队指导。',
      rating: 5,
    },
    products: ['龙拳3纯玩版', '超级方块', '枪王之王'],
    targetPersonas: ['first-time-entrepreneur'],
    saasFeatures: ['roi-calculator', 'site-selection', 'member-marketing', 'content-update'],
    operatingMonths: 14,
    monthlyRevenue: '¥5-8万',
    peak客流: '300+人次/日',
    imagePlaceholder: '🏪',
    image: '/images/cases/venue-5.jpg',
  },
  {
    id: 'case-franchise-chain',
    clientName: '某连锁品牌',
    clientType: '连锁投资者',
    location: '全国20+城市',
    businessCore: 'franchise',
    businessCoreName: '招商加盟',
    description: '连锁品牌采用联营门店模式，20+城市同步布局，神机营SaaS多门店管理系统统一管理',
    metrics: [
      { label: '覆盖城市', value: '20+' },
      { label: '统一管理门店', value: '50+', change: '+50' },
      { label: '平均回本周期', value: '10个月' },
    ],
    products: ['超级网球', '模拟棒球', 'VR滑雪', '飞行模拟器'],
    targetPersonas: ['chain-investor'],
    saasFeatures: ['multi-store', 'operations-dashboard', 'equipment-monitor', 'member-marketing'],
    operatingMonths: 20,
    monthlyRevenue: '¥10-15万/店',
    peak客流: '2000+人次/日',
    imagePlaceholder: '🔗',
    image: '/images/cases/venue-1.jpg',
  },
  // 招投标项目案例
  {
    id: 'case-smart-city',
    clientName: '某智慧城市项目',
    clientType: '智慧城市建设',
    location: '华南地区',
    businessCore: 'tender',
    businessCoreName: '招投标项目',
    description: '智慧城市数字体育设施建设，EPC+O全模式承接，打造城市数字化运动标杆',
    metrics: [
      { label: '覆盖社区', value: '30+' },
      { label: '日均服务用户', value: '5000+' },
      { label: '政府评级', value: '优秀' },
    ],
    products: ['VR滑雪', '模拟高尔夫', '超级网球'],
    targetPersonas: ['government-project'],
    saasFeatures: ['site-selection', 'space-planning', 'operations-dashboard', 'multi-store'],
    operatingMonths: 10,
    monthlyRevenue: '¥100-150万',
    peak客流: '8000+人次/日',
    imagePlaceholder: '🌆',
    image: '/images/cases/venue-6.jpg',
  },
  {
    id: 'case-school-sports',
    clientName: '某学校体育设施',
    clientType: '学校体育设施',
    location: '华北地区',
    businessCore: 'tender',
    businessCoreName: '招投标项目',
    description: '校园数字体育设施建设，寓教于乐，提升学生体育锻炼兴趣和效果',
    metrics: [
      { label: '覆盖学生', value: '8000+' },
      { label: '设备利用率', value: '95%' },
      { label: '体育课满意度', value: '94%' },
    ],
    products: ['模拟棒球', 'VR滑雪', '超级网球'],
    targetPersonas: ['government-project'],
    saasFeatures: ['site-selection', 'operations-dashboard', 'customer-profile'],
    operatingMonths: 6,
    monthlyRevenue: '¥20-30万',
    peak客流: '1500+人次/日',
    imagePlaceholder: '🏫',
    image: '/images/cases/venue-5.jpg',
  },
  // 更多数字运动产品案例
  {
    id: 'case-longfor',
    clientName: '龙湖天街',
    clientType: '商业综合体',
    location: '全国30+门店',
    businessCore: 'digital-products',
    businessCoreName: '数字运动产品',
    description: '龙湖天街全国30+门店引入数字运动设备，打造智慧商业新标杆',
    metrics: [
      { label: '客流量提升', value: '28%+', change: '+28%' },
      { label: '会员活跃度', value: '45%', change: '+45%' },
      { label: '二次消费转化', value: '38%' },
    ],
    testimonial: {
      name: '陈总',
      position: '龙湖天街运营总监',
      content: '运动蚂蚁的设备稳定性和内容更新速度都非常出色，是我们长期的战略合作伙伴。',
      rating: 5,
    },
    products: ['超级网球', 'VR滑雪', '赛车模拟器'],
    targetPersonas: ['chain-investor', 'commercial-property'],
    saasFeatures: ['equipment-monitor', 'member-marketing', 'content-update'],
    operatingMonths: 16,
    monthlyRevenue: '¥18-28万/店',
    peak客流: '6000+人次/日',
    imagePlaceholder: '🌆',
  },
  {
    id: 'case-newcity',
    clientName: '新城吾悦广场',
    clientType: '商业综合体',
    location: '全国40+门店',
    businessCore: 'digital-products',
    businessCoreName: '数字运动产品',
    description: '新城吾悦广场采用运动蚂蚁全套解决方案，数字化运营提升整体竞争力',
    metrics: [
      { label: '整体客流提升', value: '32%' },
      { label: '店铺坪效提升', value: '25万/㎡' },
      { label: '会员复购率', value: '68%' },
    ],
    testimonial: {
      name: '刘总监',
      position: '新城吾悦招商总监',
      content: '神机营SaaS的多门店管理功能让我们能够统一管理全国门店数据，运营效率大幅提升。',
      rating: 5,
    },
    products: ['模拟棒球', '龙拳3', 'VR射击战场'],
    targetPersonas: ['chain-investor', 'commercial-property'],
    saasFeatures: ['multi-store', 'operations-dashboard', 'customer-profile'],
    operatingMonths: 20,
    monthlyRevenue: '¥15-22万/店',
    peak客流: '4500+人次/日',
    imagePlaceholder: '🏙️',
  },
  // 更多EPC+O服务案例
  {
    id: 'case-hotel-epc',
    clientName: '某五星度假酒店',
    clientType: '酒店度假村',
    location: '海南',
    businessCore: 'epc-service',
    businessCoreName: 'EPC+O服务',
    description: '五星度假酒店亲子运动区EPC+O全流程服务，打造酒店特色亲子项目',
    metrics: [
      { label: '亲子客户满意度', value: '98%' },
      { label: '酒店好评率提升', value: '4.9分' },
      { label: '亲子房溢价', value: '¥200+/晚' },
    ],
    testimonial: {
      name: '孙经理',
      position: '酒店康乐部总监',
      content: '运动蚂蚁的专业团队从设计到落地全程跟踪，开业后亲子项目成为酒店特色招牌。',
      rating: 5,
    },
    products: ['VR滑雪', '室内攀岩AR版', 'AI乒乓球陪练'],
    targetPersonas: ['hospitality', 'chain-investor'],
    saasFeatures: ['space-planning', 'content-update', 'member-marketing'],
    operatingMonths: 8,
    monthlyRevenue: '¥30-50万',
    peak客流: '800+人次/日',
    imagePlaceholder: '🏨',
  },
  {
    id: 'case-community-epc',
    clientName: '某高端社区',
    clientType: '社区配套',
    location: '上海',
    businessCore: 'epc-service',
    businessCoreName: 'EPC+O服务',
    description: '上海高端社区数字运动中心，服务周边3公里居民，打造15分钟健身圈',
    metrics: [
      { label: '社区覆盖率', value: '85%' },
      { label: '会员活跃度', value: '72%' },
      { label: '月均到店人次', value: '5000+' },
    ],
    products: ['模拟高尔夫', '拳击大师AI版', '跳舞机'],
    targetPersonas: ['family-venue', 'first-time-entrepreneur'],
    saasFeatures: ['member-marketing', 'roi-calculator', 'operations-dashboard'],
    operatingMonths: 12,
    monthlyRevenue: '¥12-18万',
    peak客流: '400+人次/日',
    imagePlaceholder: '🏘️',
  },
  // 更多招商加盟案例
  {
    id: 'case-franchise-2',
    clientName: '李总',
    clientType: '二次创业者',
    location: '某二线城市',
    businessCore: 'franchise',
    businessCoreName: '招商加盟',
    description: '从传统KTV转型的创业者，选择联营模式降低风险，快速完成数字化转型',
    metrics: [
      { label: '回本周期', value: '11个月' },
      { label: '月均利润', value: '¥5.2万' },
      { label: '会员数量', value: '2000+' },
    ],
    testimonial: {
      name: '李总',
      position: '某二线城市加盟商',
      content: '从传统娱乐转型到数字运动，运动蚂蚁给了我完整的解决方案。现在我的店已经成为当地年轻人的打卡圣地。',
      rating: 5,
    },
    products: ['VR滑雪', '枪王之王', '超级网球'],
    targetPersonas: ['traditional-entertainment', 'first-time-entrepreneur'],
    saasFeatures: ['roi-calculator', 'site-selection', 'member-marketing', 'content-update'],
    operatingMonths: 18,
    monthlyRevenue: '¥8-12万',
    peak客流: '500+人次/日',
    imagePlaceholder: '🎮',
  },
  {
    id: 'case-franchise-chain-2',
    clientName: '某连锁健身品牌',
    clientType: '连锁健身房',
    location: '全国100+门店',
    businessCore: 'franchise',
    businessCoreName: '招商加盟',
    description: '国内知名健身连锁品牌引入数字运动项目，打造差异化竞争，门店覆盖率行业第一',
    metrics: [
      { label: '新增会员转化', value: '35%' },
      { label: '课程复购率', value: '78%' },
      { label: '门店覆盖率', value: '100+城市' },
    ],
    products: ['拳击大师AI版', 'AI乒乓球陪练', '模拟高尔夫'],
    targetPersonas: ['chain-investor', 'family-venue'],
    saasFeatures: ['multi-store', 'member-marketing', 'customer-profile'],
    operatingMonths: 24,
    monthlyRevenue: '¥8-15万/店',
    peak客流: '300+人次/日',
    imagePlaceholder: '💪',
  },
  // 更多招投标项目案例
  {
    id: 'case-sports-center-tender',
    clientName: '某省体育中心',
    clientType: '省级体育设施',
    location: '华中地区',
    businessCore: 'tender',
    businessCoreName: '招投标项目',
    description: '省级体育中心数字化升级改造项目，打造省级数字体育示范标杆',
    metrics: [
      { label: '日均服务人次', value: '5000+' },
      { label: '省级示范项目', value: '获批' },
      { label: '领导视察满意度', value: '100%' },
    ],
    products: ['飞行模拟器', '模拟棒球', 'VR滑雪', '超级网球'],
    targetPersonas: ['government-project'],
    saasFeatures: ['site-selection', 'space-planning', 'operations-dashboard', 'multi-store'],
    operatingMonths: 6,
    monthlyRevenue: '¥80-120万',
    peak客流: '6000+人次/日',
    imagePlaceholder: '🏟️',
  },
  {
    id: 'case-tourism-tender',
    clientName: '某国家5A级景区',
    clientType: '文旅景区',
    location: '西南地区',
    businessCore: 'tender',
    businessCoreName: '招投标项目',
    description: '国家5A级景区数字运动体验区建设，打造文旅融合新标杆',
    metrics: [
      { label: '游客满意度', value: '96%' },
      { label: '景区二消占比', value: '35%' },
      { label: '社交媒体曝光', value: '1000万+' },
    ],
    testimonial: {
      name: '王主任',
      position: '景区管理委员会',
      content: '运动蚂蚁的团队非常专业，从前期规划到落地执行都非常高效。项目成为了景区的新亮点。',
      rating: 5,
    },
    products: ['VR滑雪', 'VR射击战场', '室内攀岩AR版'],
    targetPersonas: ['government-project', 'chain-investor'],
    saasFeatures: ['site-selection', 'space-planning', 'content-update', 'roi-calculator'],
    operatingMonths: 10,
    monthlyRevenue: '¥150-200万',
    peak客流: '15000+人次/日',
    imagePlaceholder: '🏔️',
  },
];

// 四大核心业务配置
const BUSINESS_CORE_CONFIG: Record<BusinessCore, { name: string; icon: string; color: string; description: string }> = {
  'digital-products': {
    name: '数字运动产品',
    icon: '🎮',
    color: '#0066FF',
    description: '60+款自主研发数字运动设备，覆盖模拟运动、射击、VR/AR等全系列',
  },
  'epc-service': {
    name: 'EPC+O服务',
    icon: '🏗️',
    color: '#FF6B00',
    description: '从选址评估到运营支持，提供数字运动馆全流程一站式服务',
  },
  'franchise': {
    name: '招商加盟',
    icon: '🤝',
    color: '#00C853',
    description: '直营/联营/合作开店三种模式灵活选择，最低首付40%即可启动',
  },
  'tender': {
    name: '招投标项目',
    icon: '📋',
    color: '#8B5CF6',
    description: '政府公共体育设施、文旅景区、智慧城市等大型项目EPC+O全模式承接',
  },
};

export default function CasesPage() {
  const [activeBusinessCore, setActiveBusinessCore] = useState<BusinessCore | 'all'>('all');
  const [activePersona, setActivePersona] = useState<UserPersonaId | 'all'>('all');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    assignedTo?: string;
    estimatedCallbackTime?: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactPhone: '',
    preferredDate: '',
    location: '',
  });

  const personas = getAllPersonas();

  // 过滤案例
  const filteredCases = useMemo(() => {
    let result = [...CASE_STUDIES];

    if (activeBusinessCore !== 'all') {
      result = result.filter((c) => c.businessCore === activeBusinessCore);
    }

    if (activePersona !== 'all') {
      result = result.filter((c) => c.targetPersonas.includes(activePersona));
    }

    return result;
  }, [activeBusinessCore, activePersona]);

  // 追踪业务分类切换
  const handleBusinessCoreChange = (core: BusinessCore | 'all') => {
    setActiveBusinessCore(core);
    conversionService.trackCTAClick('cases', `business_core_${core}`);
  };

  // 追踪人群切换
  const handlePersonaChange = (personaId: UserPersonaId | 'all') => {
    setActivePersona(personaId);
    conversionService.trackCTAClick('cases', `persona_${personaId}`);
  };

  const handleCaseClick = (caseId: string) => {
    setSelectedCase(caseId);
    setShowModal(true);
    conversionService.trackCTAClick('cases', `case_view_${caseId}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      conversionService.trackCTAClick('cases', 'modal_submit');
      const result = await conversionService.requestSiteVisit({
        companyName: formData.companyName,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        preferredDate: formData.preferredDate,
        location: formData.location,
        caseName: selectedCaseData?.clientName,
      });

      if (result.success) {
        setSubmitted(true);
        setSubmitResult({
          assignedTo: result.assignedTo,
          estimatedCallbackTime: result.estimatedCallbackTime,
        });
      }
    } catch (error) {
      console.error('Site visit request error:', error);
      setSubmitted(true);
      setSubmitResult({
        assignedTo: '商务经理-刘洋',
        estimatedCallbackTime: '30分钟内确认',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitted(false);
    setFormData({
      companyName: '',
      contactName: '',
      contactPhone: '',
      preferredDate: '',
      location: '',
    });
  };

  const selectedCaseData = CASE_STUDIES.find((c) => c.id === selectedCase);

  return (
    <>
      <SEOMeta
        title="案例中心 - 500+场地案例，可量化成果数据"
        description="运动蚂蚁500+成功案例，涵盖万达广场、华润万象城等知名商业地产项目。每个案例配备可量化的运营数据、客户证言和神机营SaaS应用情况。"
        keywords={['运动蚂蚁案例', '数字运动场地', '商业地产案例', '加盟案例', '招投标案例', 'EPC案例']}
        type="website"
      />

      <ConversionTracker page="cases" />

      <div className="min-h-screen bg-white">
        <Header />

        {/* Hero Section */}
        <section
          style={{
            paddingTop: '120px',
            paddingBottom: '60px',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
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
                神机营SaaS系统全程赋能：运营数据看板 + IoT设备监控 + 多门店管理
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: '16px',
              }}
            >
              案例中心
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#666666',
                maxWidth: '700px',
                margin: '0 auto',
                marginBottom: '24px',
              }}
            >
              500+场地案例，每个案例配备可量化的运营数据、客户证言和神机营SaaS应用情况
            </p>

            {/* 核心数据 */}
            <div
              style={{
                display: 'inline-flex',
                gap: '32px',
                padding: '16px 32px',
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              {[
                { value: '500+', label: '场地案例' },
                { value: '2000+', label: '合作伙伴' },
                { value: '85%+', label: '门店存活率' },
                { value: '6-12', label: '平均回本周期（月）' },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#0066FF' }}>{stat.value}</p>
                  <p style={{ fontSize: '13px', color: '#666666' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 四大核心业务分类筛选 */}
        <section style={{ padding: '0 24px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <p style={{ fontSize: '13px', color: '#666666', marginBottom: '12px' }}>
              按核心业务筛选：
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleBusinessCoreChange('all')}
                style={{
                  padding: '8px 16px',
                  background: activeBusinessCore === 'all' ? '#0066FF' : '#F8FAFC',
                  color: activeBusinessCore === 'all' ? '#FFFFFF' : '#666666',
                  border: `1px solid ${activeBusinessCore === 'all' ? '#0066FF' : '#E2E8F0'}`,
                  borderRadius: '9999px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                全部案例
              </button>
              {Object.entries(BUSINESS_CORE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleBusinessCoreChange(key as BusinessCore)}
                  style={{
                    padding: '8px 16px',
                    background: activeBusinessCore === key ? config.color : '#F8FAFC',
                    color: activeBusinessCore === key ? '#FFFFFF' : '#666666',
                    border: `1px solid ${activeBusinessCore === key ? config.color : '#E2E8F0'}`,
                    borderRadius: '9999px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {config.icon} {config.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 八类人群筛选 */}
        <section style={{ padding: '24px 24px 40px', background: '#FFFFFF' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <p style={{ fontSize: '13px', color: '#666666', marginBottom: '12px' }}>
              按目标人群筛选：
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handlePersonaChange('all')}
                style={{
                  padding: '8px 16px',
                  background: activePersona === 'all' ? '#0066FF' : '#F8FAFC',
                  color: activePersona === 'all' ? '#FFFFFF' : '#666666',
                  border: `1px solid ${activePersona === 'all' ? '#0066FF' : '#E2E8F0'}`,
                  borderRadius: '9999px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                全部人群
              </button>
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaChange(persona.id)}
                  style={{
                    padding: '8px 16px',
                    background: activePersona === persona.id ? persona.color : '#F8FAFC',
                    color: activePersona === persona.id ? '#FFFFFF' : '#666666',
                    border: `1px solid ${activePersona === persona.id ? persona.color : '#E2E8F0'}`,
                    borderRadius: '9999px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {persona.icon} {persona.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 案例列表 */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <p style={{ fontSize: '14px', color: '#666666', marginBottom: '24px' }}>
              共找到 {filteredCases.length} 个相关案例
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '32px',
              }}
            >
              {filteredCases.map((caseItem) => {
                const coreConfig = BUSINESS_CORE_CONFIG[caseItem.businessCore];
                return (
                  <div
                    key={caseItem.id}
                    onClick={() => handleCaseClick(caseItem.id)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #F1F5F9',
                      transition: 'all 0.25s ease',
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
                    {/* Case Image/Placeholder */}
                    <div
                      style={{
                        height: '180px',
                        background: caseItem.image
                          ? `url(${caseItem.image}) center/cover no-repeat`
                          : `linear-gradient(135deg, ${coreConfig.color}20 0%, ${coreConfig.color}40 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {!caseItem.image && (
                        <div style={{ fontSize: '64px', opacity: 0.5 }}>{caseItem.imagePlaceholder}</div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          top: '16px',
                          left: '16px',
                          padding: '4px 12px',
                          background: coreConfig.color,
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '9999px',
                        }}
                      >
                        {coreConfig.icon} {caseItem.businessCoreName}
                      </span>
                    </div>

                    {/* Case Info */}
                    <div style={{ padding: '24px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px',
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: '#1A1A2E',
                              marginBottom: '4px',
                            }}
                          >
                            {caseItem.clientName}
                          </h3>
                          <p style={{ fontSize: '13px', color: '#666666' }}>
                            {caseItem.clientType} · 📍 {caseItem.location}
                          </p>
                        </div>
                      </div>

                      <p
                        style={{
                          fontSize: '14px',
                          color: '#666666',
                          lineHeight: 1.6,
                          marginBottom: '16px',
                        }}
                      >
                        {caseItem.description}
                      </p>

                      {/* 可量化成果数据 */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${Math.min(caseItem.metrics.length, 3)}, 1fr)`,
                          gap: '8px',
                          marginBottom: '16px',
                        }}
                      >
                        {caseItem.metrics.map((metric, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px',
                              background: '#F8FAFC',
                              borderRadius: '8px',
                              textAlign: 'center',
                            }}
                          >
                            <p style={{ fontSize: '18px', fontWeight: 700, color: coreConfig.color }}>
                              {metric.value}
                              {metric.change && (
                                <span style={{ fontSize: '11px', color: '#00C853', marginLeft: '4px' }}>
                                  {metric.change}
                                </span>
                              )}
                            </p>
                            <p style={{ fontSize: '11px', color: '#666666' }}>{metric.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* 运营数据 */}
                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'rgba(0, 200, 83, 0.1)',
                          borderRadius: '8px',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: '#00C853' }}>
                            ☁️ 运营{caseItem.operatingMonths}个月
                          </span>
                          <span style={{ fontSize: '12px', color: '#00C853' }}>
                            💰 {caseItem.monthlyRevenue}
                          </span>
                          <span style={{ fontSize: '12px', color: '#00C853' }}>
                            👥 峰值{caseItem.peak客流}
                          </span>
                        </div>
                      </div>

                      {/* SaaS应用 */}
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '11px', color: '#666666', marginBottom: '6px' }}>
                          神机营SaaS赋能：
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {caseItem.saasFeatures.slice(0, 3).map((featureId) => {
                            const feature = SAAS_FEATURES[featureId];
                            return (
                              <span
                                key={featureId}
                                style={{
                                  padding: '2px 8px',
                                  background: 'rgba(0, 200, 83, 0.1)',
                                  color: '#00C853',
                                  fontSize: '11px',
                                  borderRadius: '4px',
                                }}
                              >
                                {feature.icon} {feature.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* 客户证言 */}
                      {caseItem.testimonial && (
                        <div
                          style={{
                            padding: '12px',
                            background: '#F8FAFC',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            borderLeft: `3px solid ${coreConfig.color}`,
                          }}
                        >
                          <p style={{ fontSize: '12px', color: '#666666', lineHeight: 1.6, marginBottom: '8px' }}>
                            &ldquo;{caseItem.testimonial.content}&rdquo;
                          </p>
                          <p style={{ fontSize: '11px', color: '#999999' }}>
                            — {caseItem.testimonial.name}，{caseItem.testimonial.position}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleCaseClick(caseItem.id)}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            background: coreConfig.color,
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          预约考察
                        </button>
                        <Link
                          href={`/sports-ants/contact?case=${encodeURIComponent(caseItem.clientName)}&type=${encodeURIComponent(caseItem.businessCoreName)}`}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            background: '#F1F5F9',
                            color: '#1A1A2E',
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            textAlign: 'center',
                            textDecoration: 'none',
                          }}
                        >
                          咨询详情
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 三步转化法CTA区块 */}
        <section style={{ padding: '60px 24px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <CaseCTA
              caseName="运动蚂蚁合作伙伴"
              caseType="数字体育中心"
              caseLocation="全国"
              onScheduleVisit={() => {
                const firstCase = filteredCases[0];
                if (firstCase) {
                  setSelectedCase(firstCase.id);
                  setShowModal(true);
                }
              }}
            />
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            padding: '80px 24px',
            background: '#1A1A2E',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            成为下一个成功案例
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '32px',
            }}
          >
            联系我们，获取专属您的数字运动解决方案
          </p>
          <Link
            href="/sports-ants/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 40px',
              background: '#0066FF',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '9999px',
              textDecoration: 'none',
              boxShadow: '0 0 20px rgba(0, 102, 255, 0.3)',
            }}
          >
            立即咨询 ↗
          </Link>
        </section>

        {/* Site Visit Modal */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '24px',
            }}
            onClick={closeModal}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {!submitted ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '24px',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A2E', marginBottom: '4px' }}>
                        预约实地考察
                      </h3>
                      {selectedCaseData && (
                        <p style={{ fontSize: '14px', color: '#666666' }}>
                          参考案例：{selectedCaseData.clientName} - {selectedCaseData.businessCoreName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={closeModal}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#999999',
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="企业名称 *"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <input
                        type="text"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        placeholder="联系人 *"
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="tel"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        placeholder="联系电话 *"
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <input
                        type="date"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="您的所在地"
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: isSubmitting ? '#999999' : '#0066FF',
                        color: '#FFFFFF',
                        fontSize: '16px',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSubmitting ? '提交中...' : '提交预约'}
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: '#00C85315',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                    }}
                  >
                    <span style={{ fontSize: '40px' }}>✅</span>
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A2E', marginBottom: '12px' }}>
                    预约成功！
                  </h3>
                  <p style={{ fontSize: '15px', color: '#666666', marginBottom: '16px' }}>
                    我们的商务经理将尽快与您联系，确认考察细节
                  </p>
                  {submitResult && (
                    <div
                      style={{
                        background: '#F8FAFC',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                      }}
                    >
                      <p style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
                        您的专属商务经理：<strong style={{ color: '#0066FF' }}>{submitResult.assignedTo}</strong>
                      </p>
                      <p style={{ fontSize: '14px', color: '#666666' }}>
                        预计确认时间：<strong style={{ color: '#00C853' }}>{submitResult.estimatedCallbackTime}</strong>
                      </p>
                    </div>
                  )}
                  <button
                    onClick={closeModal}
                    style={{
                      padding: '12px 32px',
                      background: '#F1F5F9',
                      color: '#1A1A2E',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    关闭
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <FloatingContact />

        <ExitIntentPopup delaySeconds={10} />

        <Footer />
      </div>
    </>
  );
}
