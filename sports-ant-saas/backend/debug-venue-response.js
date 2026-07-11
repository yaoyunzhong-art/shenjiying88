// 调试场地创建API响应
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
            headers: res.headers,
            raw: responseData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
            raw: responseData
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

async function debugVenueResponse() {
  console.log('🔍 调试场地创建API响应结构...');
  
  try {
    // 1. 注册测试用户
    console.log('1. 注册测试用户...');
    const timestamp = Date.now();
    const registerResult = await makeRequest('POST', `${API_BASE}/auth/register`, {
      email: `debug-${timestamp}@example.com`,
      password: 'Test123!',
      username: `debug${timestamp}`,
      phone: `+86138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
    });
    
    if (registerResult.status === 200 || registerResult.status === 201) {
      console.log('✅ 用户注册成功');
      const token = registerResult.data.accessToken;
      
      // 2. 创建测试场地并详细记录响应
      console.log('\n2. 创建测试场地并分析响应...');
      const testVenueData = {
        name: `调试测试场地 ${timestamp}`,
        description: '用于调试响应结构的场地',
        address: '调试测试市测试区测试路789号',
        city: '调试测试市',
        province: '调试测试省',
        postalCode: '300000',
        country: '中国',
        type: 'gym',
        capacity: 100,
        contactPhone: '+8613811111111',
        contactEmail: `debug-venue-${timestamp}@example.com`,
        status: 'active',
        allowOnlineBooking: true,
        bookingAdvanceHours: 24
      };
      
      console.log('   发送的请求数据:', JSON.stringify(testVenueData, null, 2));
      
      const venueResult = await makeRequest('POST', `${API_BASE}/venues`, testVenueData, {
        Authorization: `Bearer ${token}`
      });
      
      console.log('\n   响应分析:');
      console.log('   状态码:', venueResult.status);
      console.log('   响应头:', JSON.stringify(venueResult.headers, null, 2));
      console.log('   原始响应:', venueResult.raw);
      console.log('   解析后的数据:', JSON.stringify(venueResult.data, null, 2));
      
      // 3. 分析响应结构
      console.log('\n3. 响应结构分析:');
      if (venueResult.data) {
        console.log('   响应数据类型:', typeof venueResult.data);
        console.log('   响应数据键:', Object.keys(venueResult.data));
        
        // 检查可能的响应结构
        if (venueResult.data.id) {
          console.log('   ✅ 找到id字段:', venueResult.data.id);
        } else if (venueResult.data.venue && venueResult.data.venue.id) {
          console.log('   ✅ 找到venue.id字段:', venueResult.data.venue.id);
        } else if (venueResult.data.data && venueResult.data.data.id) {
          console.log('   ✅ 找到data.id字段:', venueResult.data.data.id);
        } else {
          console.log('   ❌ 未找到id字段');
          console.log('   所有字段:', JSON.stringify(venueResult.data, null, 2));
        }
        
        // 检查常见的响应包装结构
        if (venueResult.data.success !== undefined) {
          console.log('   响应包含success字段:', venueResult.data.success);
        }
        if (venueResult.data.message) {
          console.log('   响应包含message字段:', venueResult.data.message);
        }
      }
      
      // 4. 测试场地列表以获取ID
      console.log('\n4. 通过列表API获取场地ID...');
      const listResult = await makeRequest('GET', `${API_BASE}/venues?page=1&limit=5`, null, {
        Authorization: `Bearer ${token}`
      });
      
      if (listResult.status === 200 && listResult.data) {
        console.log('   列表响应状态码:', listResult.status);
        console.log('   列表响应结构:', Object.keys(listResult.data));
        
        if (listResult.data.venues && Array.isArray(listResult.data.venues)) {
          console.log(`   场地数量: ${listResult.data.venues.length}`);
          if (listResult.data.venues.length > 0) {
            const firstVenue = listResult.data.venues[0];
            console.log('   第一个场地:', JSON.stringify(firstVenue, null, 2));
            console.log('   第一个场地ID:', firstVenue.id || '未找到');
          }
        }
      }
      
      console.log('\n🎯 调试完成！');
      return {
        success: venueResult.status === 200 || venueResult.status === 201,
        response: venueResult.data,
        token: token
      };
      
    } else {
      console.log('❌ 用户注册失败:', registerResult.data);
      return { success: false };
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    return { success: false };
  }
}

// 运行调试
debugVenueResponse().then(result => {
  if (result && result.success) {
    console.log('\n📊 调试结果总结:');
    console.log('   场地创建API响应状态: 成功');
    console.log('   响应结构已详细分析');
    console.log('   建议: 检查NestJS拦截器、序列化配置或响应包装器');
  } else {
    console.log('\n⚠️ 调试发现API响应结构问题，需要进一步调查。');
  }
});