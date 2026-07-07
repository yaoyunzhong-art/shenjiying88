/**
 * 运动蚂蚁AI智能客服组件 - 增强版
 * BigAnts AI Customer Service - Enhanced
 * 对接神机营SaaS AI-CS模块，支持意图识别、线索收集、多轮对话
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BigAntsColors, BigAntsFonts, BigAntsRadius, BigAntsTransitions } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';
import { USER_PERSONAS } from '../lib/user-personas';

// 增强的问题分类和意图识别
const INTENT_PATTERNS = {
  'cooperation-mode': {
    keywords: ['合作模式', '加盟方式', '如何加盟', '合作', '加盟'],
    response: '我们有三种合作模式：\n1️⃣ 特许加盟：适合有经验的创业者，投资15-50万\n2️⃣ 合资联营：适合有资源的投资者，共同出资50-200万\n3️⃣ 品牌授权：适合有场地无品牌，轻资产运营5-15万\n\n您更倾向于哪种模式呢？我可以为您详细介绍。',
    leadsTo: 'cooperation_detail',
  },
  'roi': {
    keywords: ['回本', '回报', '盈利', '赚钱', '收益', '投资回报'],
    response: '根据已运营数据，我们的门店平均回本周期为12-18个月。\n\n具体回本时间取决于：\n• 选址位置（商场流量）\n• 运营能力\n• 当地消费水平\n\n您可以告诉我您的预算和场地情况，我帮您做一个详细的盈利测算 📊',
    leadsTo: 'roi_calculator',
  },
  'site-requirement': {
    keywords: ['场地', '面积', '多大', '空间', '尺寸', '需要多大'],
    response: '根据项目类型，场地需求不同：\n\n🏪 单台设备：约10-30㎡\n🏠 标准门店：约100-300㎡\n🏢 大型场馆：500㎡以上\n\n您是有现成场地，还是需要我们帮您选址呢？',
    leadsTo: 'site_requirement',
  },
  'application': {
    keywords: ['申请', '报名', '联系', '怎么合作', '如何开始'],
    response: '很高兴您对运动蚂蚁感兴趣！\n\n您可以通过以下方式联系我们：\n📞 热线：400-888-8888\n💬 微信：bigants888\n📧 邮箱：business@bigants.net\n\n或者直接在这里留下您的联系方式，我们会在1小时内主动联系您 😊',
    leadsTo: 'contact_form',
  },
  'product': {
    keywords: ['设备', '产品', '有哪些', '游戏', '设备有哪些'],
    response: '我们有60+款数字运动设备，包括：\n\n🎾 模拟运动：超级网球、模拟棒球、模拟高尔夫\n🎯 射击系列：枪王之王、奥运射击\n🥽 VR系列：VR滑雪、VR赛车\n🎪 大型设备：飞行模拟器、飞行影院\n\n您对哪类设备比较感兴趣？',
    leadsTo: 'product_list',
  },
  'service': {
    keywords: ['服务', '售后', '保修', '培训', '支持'],
    response: '我们提供全流程服务支持：\n\n✅ 选址评估（AI智能分析）\n✅ 空间规划（3D设计）\n✅ 设备供应（源头厂家）\n✅ 施工建设（专业团队）\n✅ 培训支持（40节课程）\n✅ 运营指导（驻店带教）\n✅ 售后保障（1年保修+7×24客服）\n\n您想了解哪个环节的详细信息？',
    leadsTo: 'service_detail',
  },
  'experience': {
    keywords: ['体验', '试用', '看', '参观', '考察'],
    response: '欢迎来体验我们的设备！\n\n我们提供多种体验方式：\n1️⃣ 到店体验：全国500+门店可预约\n2️⃣ 试运营：申请2周场地试用\n3️⃣ 视频演示：远程观看设备实拍\n\n请问您是在哪个城市呢？我帮您安排最近的体验点 🎮',
    leadsTo: 'experience_booking',
  },
};

// 快捷问题配置
const QUICK_QUESTIONS = [
  { id: 'cooperation-mode', text: '合作模式有哪些？', icon: '🤝' },
  { id: 'roi', text: '多久可以回本？', icon: '📊' },
  { id: 'site-requirement', text: '需要多大场地？', icon: '📐' },
  { id: 'product', text: '有哪些设备？', icon: '🎮' },
];

// 消息类型
interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
  quickReplies?: { id: string; text: string; icon: string }[];
}

// 收集的信息
interface CollectedInfo {
  name?: string;
  phone?: string;
  city?: string;
  budget?: string;
  area?: string;
  intent?: string;
}

export default function AICustomerService() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '您好！我是运动蚂蚁智能客服小蚂蚁 🐜\n\n请问有什么可以帮您？我可以为您提供：\n• 合作模式咨询\n• 投资回报测算\n• 设备产品介绍\n• 场地规划建议',
      timestamp: new Date(),
      quickReplies: QUICK_QUESTIONS,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [collectedInfo, setCollectedInfo] = useState<CollectedInfo>({});
  const [showContactForm, setShowContactForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 意图识别
  const recognizeIntent = useCallback((text: string): { intent: string; confidence: number } => {
    const lowerText = text.toLowerCase();
    let bestMatch = { intent: 'unknown', confidence: 0 };

    for (const [intentId, pattern] of Object.entries(INTENT_PATTERNS)) {
      for (const keyword of pattern.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          const confidence = keyword.length / lowerText.length;
          if (confidence > bestMatch.confidence) {
            bestMatch = { intent: intentId, confidence };
          }
        }
      }
    }

    return bestMatch;
  }, []);

  // 获取响应内容
  const getResponse = useCallback((intent: string): { content: string; quickReplies?: { id: string; text: string; icon: string }[] } => {
    const pattern = INTENT_PATTERNS[intent as keyof typeof INTENT_PATTERNS];
    if (pattern) {
      return {
        content: pattern.response,
        quickReplies: QUICK_QUESTIONS.filter(q => q.id !== intent).slice(0, 3),
      };
    }
    return {
      content: '感谢您的咨询！为了更好地为您服务，请告诉我更多详细信息：\n\n• 您目前的预算范围是多少？\n• 您的场地面积大约是多少？\n• 您在哪个城市？\n\n或者直接留下您的联系方式，专业顾问将尽快与您联系 📞',
    };
  }, []);

  // 发送消息
  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // 识别意图
    const { intent, confidence } = recognizeIntent(messageText);

    // 追踪意图识别
    if (intent !== 'unknown') {
      conversionService.trackAIIntentRecognition(intent, confidence * 100);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      intent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // 模拟AI思考
    setTimeout(() => {
      const response = getResponse(intent);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        intent,
        quickReplies: response.quickReplies,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);

      // 如果是意向较强的用户，展示联系表单
      if (['cooperation-mode', 'application', 'roi'].includes(intent) && confidence > 0.3) {
        setTimeout(() => {
          setShowContactForm(true);
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 2).toString(),
              type: 'system',
              content: '📝 点击留下您的联系方式，专业顾问将为您提供1对1服务',
              timestamp: new Date(),
            },
          ]);
        }, 1500);
      }
    }, 600 + Math.random() * 400);
  }, [inputValue, recognizeIntent, getResponse]);

  // 转人工客服
  const escalateToHuman = useCallback(() => {
    const botMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: '好的，我将为您转接人工客服。请简单描述您的问题：\n\n• 您想了解什么？\n• 您的预算和场地情况？\n\n我们的客服人员将尽快与您联系 ☎️\n\n您也可以直接拨打热线：400-888-8888',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);

    // 追踪转人工
    conversionService.trackAIChatInteraction(collectedInfo.intent || 'unknown', false, true);
  }, [collectedInfo.intent]);

  // 提交联系表单
  const submitContactForm = useCallback(async (formData: CollectedInfo) => {
    try {
      // 通过转化服务提交线索
      await conversionService.submitContactForm({
        contactPerson: formData.name || '',
        phone: formData.phone || '',
        companyName: formData.city || '',
        cooperationType: formData.intent || '未分类',
        message: `来源：AI客服 | 预算：${formData.budget || '未填写'} | 面积：${formData.area || '未填写'}`,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'bot',
          content: `✅ 信息已提交！\n\n我们的${formData.intent === 'cooperation-mode' ? '招商经理' : '专业顾问'}将在1小时内联系您：\n\n📞 ${formData.phone}\n\n您也可以直接拨打热线：400-888-8888`,
          timestamp: new Date(),
        },
      ]);

      // 追踪AI客服交互
      conversionService.trackAIChatInteraction(formData.intent || 'unknown', true, false);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    }
    setShowContactForm(false);
  }, []);

  return (
    <>
      {/* 客服按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: BigAntsColors.primary,
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 102, 255, 0.4)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          transition: `transform ${BigAntsTransitions.fast}, box-shadow ${BigAntsTransitions.fast}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(0, 102, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 102, 255, 0.4)';
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* 聊天窗口 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '380px',
            height: '560px',
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            zIndex: 998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <style>
            {`
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          </style>

          {/* 头部 */}
          <div
            style={{
              padding: '16px 20px',
              background: BigAntsColors.primary,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🐜</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>运动蚂蚁客服</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>AI智能服务 · 7×24在线</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '24px',
                cursor: 'pointer',
              }}
            >
              −
            </button>
          </div>

          {/* 消息区域 */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: message.type === 'user' 
                      ? '16px 16px 4px 16px' 
                      : message.type === 'system'
                      ? '12px 12px 12px 12px'
                      : '16px 16px 16px 4px',
                    background: message.type === 'user' 
                      ? BigAntsColors.primary 
                      : message.type === 'system'
                      ? '#FFF7ED'
                      : '#F1F5F9',
                    color: message.type === 'user' ? '#FFFFFF' : '#1A1A2E',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    border: message.type === 'system' ? '1px solid #FED7AA' : 'none',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* 打字中 */}
            {isTyping && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    background: '#F1F5F9',
                    color: '#666666',
                    fontSize: '14px',
                  }}
                >
                  正在输入...
                </div>
              </div>
            )}

            {/* 快捷问题按钮 */}
            {messages.length <= 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => sendMessage(q.text)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: '#333333',
                      cursor: 'pointer',
                      transition: `all ${BigAntsTransitions.fast}`,
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = BigAntsColors.primary;
                      e.currentTarget.style.background = `${BigAntsColors.primary}08`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.background = '#FFFFFF';
                    }}
                  >
                    <span>{q.icon}</span>
                    <span>{q.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 联系表单 */}
            {showContactForm && (
              <div
                style={{
                  padding: '16px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  marginTop: '8px',
                }}
              >
                <p style={{ fontSize: '13px', color: '#666666', marginBottom: '12px' }}>
                  📞 请留下您的联系方式，专业顾问将尽快联系您
                </p>
                <input
                  type="text"
                  placeholder="您的姓名"
                  value={collectedInfo.name || ''}
                  onChange={(e) => setCollectedInfo(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '8px',
                    outline: 'none',
                  }}
                />
                <input
                  type="tel"
                  placeholder="手机号码"
                  value={collectedInfo.phone || ''}
                  onChange={(e) => setCollectedInfo(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '8px',
                    outline: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="所在城市"
                  value={collectedInfo.city || ''}
                  onChange={(e) => setCollectedInfo(prev => ({ ...prev, city: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '8px',
                    outline: 'none',
                  }}
                />
                <select
                  value={collectedInfo.budget || ''}
                  onChange={(e) => setCollectedInfo(prev => ({ ...prev, budget: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '8px',
                    outline: 'none',
                    color: collectedInfo.budget ? '#333' : '#999',
                  }}
                >
                  <option value="">选择预算范围</option>
                  <option value="15-50万">15-50万</option>
                  <option value="50-100万">50-100万</option>
                  <option value="100-200万">100-200万</option>
                  <option value="200万以上">200万以上</option>
                </select>
                <button
                  onClick={() => submitContactForm(collectedInfo)}
                  disabled={!collectedInfo.phone}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: collectedInfo.phone ? BigAntsColors.primary : '#E2E8F0',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: collectedInfo.phone ? 'pointer' : 'not-allowed',
                  }}
                >
                  提交信息
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 转人工按钮 */}
          {messages.length > 3 && (
            <div style={{ padding: '0 16px 8px' }}>
              <button
                onClick={escalateToHuman}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'transparent',
                  border: `1px solid ${BigAntsColors.primary}`,
                  borderRadius: '8px',
                  color: BigAntsColors.primary,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: `all ${BigAntsTransitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${BigAntsColors.primary}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                👤 转人工客服
              </button>
            </div>
          )}

          {/* 输入区域 */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="输入您的问题..."
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #E2E8F0',
                borderRadius: '20px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: inputValue.trim() ? BigAntsColors.primary : '#E2E8F0',
                color: '#FFFFFF',
                border: 'none',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
