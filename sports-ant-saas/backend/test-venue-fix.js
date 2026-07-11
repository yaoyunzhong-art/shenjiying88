// 测试场地创建API修复
const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';

function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testVenueCreation() {
  console.log('🚀 测试场地创建API修复...');
  
  try {
    // 1. 注册测试用户
    console.log('1. 注册测试用户...');
    const registerResult = await makeRequest('POST', `${API_BASE}/auth/register`, {
      email: 'test-venue-' + Date.now() + '@example.com',
      password: 'Test123!',
      username: 'testvenue' + Date.now(),
      phone: '+86138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
    });
    
    if (registerResult.status === 200 || registerResult.status === 201) {
      console.log('✅ 用户注册成功');
      const token = registerResult.data.accessToken;
      
      // 2. 测试场地创建API
      console.log('\n2. 测试场地创建API...');
      const testVenueData = {
        name: '体育中心测试场地',
        description: '这是一个用于测试的体育中心场地',
        address: '测试市测试区测试路123号',
        city: '测试市',
        province: '测试省',
        postalCode: '100000',
        country: '中国',
        type: 'gym',
        capacity: 200,
        contactPhone: '+8613800000000',
        contactEmail: 'venue@example.com',
        status: 'active',
        allowOnlineBooking: true,
        bookingAdvanceHours: 24
      };
      
      const venueResult = await makeRequest('POST', `${API_BASE}/venues`, testVenueData, {
        Authorization: `Bearer ${token}`
      });
      
      console.log('场地创建响应:');
      console.log('   状态码:', venueResult.status);
      
      if (venueResult.status === 200 || venueResult.status === 201) {
        console.log('✅ 场地创建成功!');
        console.log('   场地ID:', venueResult.data.id || venueResult.data.venue?.id);
        console.log('   场地名称:', venueResult.data.name);
        
        // 3. 验证场地列表
        console.log('\n3. 验证场地列表...');
        const listResult = await makeRequest('GET', `${API_BASE}/venues?page=1&limit=5`, null, {
          Authorization: `Bearer ${token}`
        });
        
        if (listResult.status === 200 && listResult.data.venues) {
          console.log(`✅ 场地列表获取成功，共有 ${listResult.data.venues.length} 个场地`);
          return {
            success: true,
            venueId: venueResult.data.id || venueResult.data.venue?.id,
            token: token
          };
        }
      } else {
        console.log('❌ 场地创建失败:');
        console.log('   错误信息:', venueResult.data?.message || '未知错误');
        console.log('   验证错误:', venueResult.data?.validationErrors || '无');
        console.log('   完整响应:', JSON.stringify(venueResult.data, null, 2));
      }
    } else {
      console.log('❌ 用户注册失败:', registerResult.data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
  
  return { success: false };
}

// 运行测试
testVenueCreation().then(result => {
  if (result.success) {
    console.log('\n🎉 CreateVenueDto修复成功！场地创建API现在可以正常工作。');
    console.log(`   场地ID: ${result.venueId}`);
    console.log(`   认证Token: ${result.token.substring(0, 20)}...`);
  } else {
    console.log('\n⚠️ 场地创建API测试失败，需要进一步调试。');
  }
});