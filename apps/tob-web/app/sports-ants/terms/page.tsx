/**
 * 运动蚂蚁服务条款页面
 * BigAnts Terms of Service
 */

'use client';

import React from 'react';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BigAntsColors, BigAntsSpacing, BigAntsFonts } from '../lib/bigants-design';

export default function TermsPage() {
  return (
    <>
      <SEOMeta
        title="服务条款 - 运动蚂蚁"
        description="运动蚂蚁服务条款，详细说明用户与运动蚂蚁之间的权利义务关系。"
        keywords={['服务条款', '用户协议', '法律声明']}
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
            服务条款
          </h1>
          <p style={{ fontFamily: BigAntsFonts.chinese, fontSize: '14px', color: '#999999', marginBottom: '40px' }}>
            更新日期：2024年1月1日
          </p>

          <div style={{ fontFamily: BigAntsFonts.chinese, fontSize: '15px', color: '#333333', lineHeight: 1.8 }}>
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                一、服务条款的确认和接受
              </h2>
              <p style={{ marginBottom: '12px' }}>
                欢迎使用运动蚂蚁（以下简称"本公司"）提供的数字运动设备及相关服务。当您访问或使用本公司运营的网站、移动应用及相关服务时，表示您已阅读、理解并同意接受本服务条款的约束。
              </p>
              <p>
                如果您不同意本服务条款的任何内容，请立即停止使用我们的服务。您继续使用服务的行为将被视为您已接受本服务条款的全部内容。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                二、服务内容
              </h2>
              <p style={{ marginBottom: '12px' }}>
                运动蚂蚁主要提供以下服务：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>数字运动设备的研发、生产和销售</li>
                <li>数字运动场馆的规划、设计和建设</li>
                <li>数字运动设备的安装、调试和维修服务</li>
                <li>数字运动相关的技术咨询和运营指导</li>
                <li>线上内容和服务，包括但不限于产品信息、活动资讯等</li>
              </ul>
              <p>
                本公司保留随时调整服务内容或变更服务费用的权利，变更内容将通过网站公告或书面通知方式告知。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                三、用户注册与账户
              </h2>
              <p style={{ marginBottom: '12px' }}>
                用户在使用部分服务前需要注册账户。用户在注册时应当提供真实、准确、完整的个人信息，并及时更新。用户承诺：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>不得以虚假信息骗取账户注册</li>
                <li>不得冒充他人或机构注册账户</li>
                <li>不得使用可能引起混淆或侵权的用户名</li>
                <li>妥善保管账户信息和密码，因个人原因导致的损失由用户自行承担</li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                四、设备采购与合作
              </h2>
              <p style={{ marginBottom: '12px' }}>
                通过运动蚂蚁采购设备或开展合作的用户，应遵守以下规定：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>应提供真实、准确的资质证明和经营信息</li>
                <li>应按照合同约定用途使用设备，不得擅自改装、销售或转授权</li>
                <li>应按时支付合同约定的各项费用</li>
                <li>应配合公司进行设备维护和软件更新</li>
                <li>应遵守国家相关法律法规，合法经营</li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                五、知识产权
              </h2>
              <p style={{ marginBottom: '12px' }}>
                运动蚂蚁网站、移动应用及相关服务中包含的所有内容、文字、图片、音频、视频、软件、程序、界面设计、版面框架等知识产权均归本公司或相关权利人所有。
              </p>
              <p style={{ marginBottom: '12px' }}>
                未经本公司书面授权，用户不得对上述内容进行复制、传播、修改、反向工程或以其他方式侵犯本公司知识产权。
              </p>
              <p>
                用户在使用服务过程中产生的任何内容，其知识产权归属用户，但用户授予本公司全球范围内免费、非独占的使用许可。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                六、隐私保护
              </h2>
              <p style={{ marginBottom: '12px' }}>
                本公司重视用户隐私保护，详情请参阅《隐私政策》。使用本公司服务即表示您同意我们按照隐私政策收集、使用和保护您的个人信息。
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                七、免责声明
              </h2>
              <p style={{ marginBottom: '12px' }}>
                在法律允许的范围内，本公司对以下情况不承担责任：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>因不可抗力导致的服务中断或损失</li>
                <li>因用户原因导致的个人信息泄露、账户被盗用等损失</li>
                <li>因用户不当使用设备导致的损失</li>
                <li>第三方原因导致的损失，包括但不限于网络故障、黑客攻击等</li>
                <li>服务中断期间导致的任何间接损失或预期收益损失</li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                八、服务变更和终止
              </h2>
              <p style={{ marginBottom: '12px' }}>
                本公司保留以下权利：
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>随时修改或中断服务，恕不另行通知</li>
                <li>对违反服务条款的用户限制或终止服务</li>
                <li>对涉嫌违法的内容或行为进行调查并采取必要措施</li>
                <li>在必要时修订服务条款，修订后的条款将在网站上公布</li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                九、争议解决
              </h2>
              <p style={{ marginBottom: '12px' }}>
                本服务条款的解释和执行均适用中华人民共和国法律。因本服务条款引起的任何争议，双方应首先友好协商解决；协商不成的，任一方可向本公司所在地有管辖权的人民法院提起诉讼。
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>
                十、联系方式
              </h2>
              <p style={{ marginBottom: '8px' }}>
                如您对本服务条款有任何疑问，请通过以下方式联系我们：
              </p>
              <p>
                客服热线：400-888-8888<br />
                电子邮箱：contact@sportsants.com<br />
                公司地址：广州市番禺区钟村街道XX路XX号
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
