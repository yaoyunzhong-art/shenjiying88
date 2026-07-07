/**
 * 运动蚂蚁隐私政策页面
 * BigAnts Privacy Policy
 */

'use client';

import React from 'react';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BigAntsColors, BigAntsSpacing, BigAntsFonts } from '../lib/bigants-design';

export default function PrivacyPage() {
  return (
    <>
      <SEOMeta
        title="隐私政策 - 运动蚂蚁"
        description="运动蚂蚁隐私政策，详细说明我们如何收集、使用、保护您的个人信息。"
        keywords={['隐私政策', '个人信息保护', 'Cookie政策']}
        type="website"
      />

      <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
        <Header />

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 24px 80px' }}>
          <h1
            style={{
              fontFamily: BigAntsFonts.display,
              fontSize: '32px',
              fontWeight: 700,
              color: '#1A1A2E',
              marginBottom: '8px',
            }}
          >
            隐私政策
          </h1>
          <p style={{ fontFamily: BigAntsFonts.chinese, fontSize: '14px', color: '#999999', marginBottom: '40px' }}>
            更新日期：2024年1月1日
          </p>

          <div style={{ fontFamily: BigAntsFonts.chinese, fontSize: '15px', color: '#333333', lineHeight: 1.8 }}>
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                引言
              </h2>
              <p style={{ marginBottom: '12px' }}>
                运动蚂蚁（以下简称"我们"）非常重视您的个人信息保护。本隐私政策旨在向您说明我们如何收集、使用、存储、保护您的个人信息，以及您享有的相关权利。
              </p>
              <p>
                请您在使用我们的服务前，仔细阅读并了解本隐私政策。如果您不同意本隐私政策的任何内容，请立即停止使用我们的服务。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                一、信息收集
              </h2>
              <p style={{ marginBottom: '12px' }}>
                我们收集的信息类型包括：
              </p>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A2E', marginBottom: '8px' }}>
                1. 您主动提供的信息
              </h3>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li>账户注册信息：姓名、手机号码、电子邮箱、公司名称等</li>
                <li>联系表单信息：咨询内容、合作意向等</li>
                <li>订单信息：收货地址、设备配置等</li>
                <li>反馈信息：您提交的投诉、建议或问题描述</li>
              </ul>

              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A2E', marginBottom: '8px' }}>
                2. 设备使用过程中自动收集的信息
              </h3>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li>设备运行数据：运行状态、故障日志、使用时长等</li>
                <li>运动数据：运动时长、得分、成绩等（仅在您授权时收集）</li>
                <li>设备信息：设备型号、序列号、固件版本等</li>
              </ul>

              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A2E', marginBottom: '8px' }}>
                3. 第三方来源的信息
              </h3>
              <ul style={{ paddingLeft: '24px' }}>
                <li>合作伙伴共享的业务合作相关信息</li>
                <li>公开可获取的工商信息、资质信息等</li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                二、信息使用
              </h2>
              <p style={{ marginBottom: '12px' }}>
                我们将您的信息用于以下目的：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>提供、维护和改进我们的产品和服务</li>
                <li>处理您的咨询、订单和售后服务</li>
                <li>向您发送产品更新、活动通知等营销信息（您可选择退订）</li>
                <li>进行数据分析和统计，用于产品优化和决策支持</li>
                <li>预防、发现和调查欺诈、违规或安全风险</li>
                <li>遵守法律法规要求，配合监管机构的合规要求</li>
              </ul>
              <p>
                我们不会将您的个人信息用于与上述目的无关的其他用途。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                三、信息共享
              </h2>
              <p style={{ marginBottom: '12px' }}>
                除以下情况外，我们不会与第三方共享您的个人信息：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>获得您的明确同意后</li>
                <li>为履行合同必需，如向物流供应商提供配送信息</li>
                <li>根据法律法规要求，必须向相关机构提供信息</li>
                <li>为保护我们的合法权益，如调查欺诈或安全问题</li>
                <li>与我们的关联公司共享，用于统一管理和服务优化</li>
              </ul>
              <p>
                我们要求接收您信息的第三方按照不低于本隐私政策的标准保护您的信息安全。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                四、信息存储
              </h2>
              <p style={{ marginBottom: '12px' }}>
                您的信息存储遵循以下原则：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>存储在中华人民共和国境内的服务器上</li>
                <li>仅在实现处理目的所需的期限内保留您的信息</li>
                <li>超出保留期后，您的个人信息将被删除或匿名化处理</li>
                <li>涉及敏感信息（如身份证号）的保存期限不超过必要期限</li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                五、信息安全
              </h2>
              <p style={{ marginBottom: '12px' }}>
                我们采用多种安全措施保护您的信息安全：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>数据传输采用SSL/TLS加密</li>
                <li>服务器部署在符合安全标准的数据中心</li>
                <li>实施严格的访问控制机制</li>
                <li>定期进行安全审计和漏洞扫描</li>
                <li>对员工进行信息安全培训</li>
              </ul>
              <p>
                尽管我们努力采取合理的安全措施，但仍无法保证信息传输或存储的100%安全。请您理解并承担一定的风险。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                六、您的权利
              </h2>
              <p style={{ marginBottom: '12px' }}>
                根据相关法律法规，您对您的个人信息享有以下权利：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li><strong>访问权：</strong>您有权访问我们持有的您的个人信息</li>
                <li><strong>更正权：</strong>您有权要求我们更正不准确的个人信息</li>
                <li><strong>删除权：</strong>在法定情形下，您有权要求我们删除您的个人信息</li>
                <li><strong>撤回同意：</strong>您有权撤回之前给予的同意</li>
                <li><strong>投诉权：</strong>您有权向相关监管机构投诉或提起诉讼</li>
              </ul>
              <p>
                如需行使上述权利，请通过本政策末尾的联系方式与我们联系。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                七、Cookie政策
              </h2>
              <p style={{ marginBottom: '12px' }}>
                我们使用Cookie和类似技术来提升您的使用体验：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li><strong>必要的Cookie：</strong>保证网站基本功能正常运行</li>
                <li><strong>功能Cookie：</strong>记住您的偏好设置</li>
                <li><strong>分析Cookie：</strong>帮助我们了解网站使用情况</li>
              </ul>
              <p>
                您可以通过浏览器设置拒绝Cookie，但这可能影响网站的某些功能。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                八、未成年人保护
              </h2>
              <p style={{ marginBottom: '12px' }}>
                我们的服务主要面向成年人。我们不会故意收集未成年人的个人信息。如果您是不满14周岁的未成年人，请在监护人的陪同下阅读本政策，并在取得监护人的同意后使用我们的服务。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                九、隐私政策更新
              </h2>
              <p style={{ marginBottom: '12px' }}>
                我们可能会不时更新本隐私政策。更新后的政策将在网站上公布，并自公布之日起生效。我们将通过网站公告或发送邮件的方式提醒您重要的变更。
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                十、联系我们
              </h2>
              <p style={{ marginBottom: '8px' }}>
                如您对本隐私政策有任何疑问、意见或投诉，请通过以下方式联系我们：
              </p>
              <p>
                客服热线：400-888-8888<br />
                电子邮箱：privacy@sportsants.com<br />
                公司地址：广州市番禺区钟村街道XX路XX号<br />
                个人信息保护负责人：张经理
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
