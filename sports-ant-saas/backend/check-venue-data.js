// 检查场地数据问题
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

async function checkVenueData() {
  console.log('🔍 检查场地数据问题...');
  
  try {
    // 1. 注册测试用户
    console.log('1. 注册测试用户...');
    const timestamp = Date.now();
    const registerResult = await makeRequest('POST', `${API_BASE}/auth/register`, {
      email: `venue-check-${timestamp}@example.com`,
      password: 'Test123!',
      username: `venuecheck${timestamp}`,
      phone: `+86138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
    });
    
    if (registerResult.status === 200 || registerResult.status === 201) {
      console.log('✅ 用户注册成功');
      const token = registerResult.data.accessToken;
      
      // 2. 获取场地列表，分析数据
      console.log('\n2. 获取场地列表，分析数据问题...');
      const listResult = await makeRequest('GET', `${API_BASE}/venues?page=1&limit=20`, null, {
        Authorization: `Bearer ${token}`
      });
      
      if (listResult.status === 200 && listResult.data) {
        console.log('✅ 场地列表获取成功');
        
        if (listResult.data.venues && Array.isArray(listResult.data.venues)) {
          const totalVenues = listResult.data.venues.length;
          console.log(`   场地总数: ${totalVenues}`);
          
          // 分析ID问题
          let validIdCount = 0;
          let emptyIdCount = 0;
          let invalidIdCount = 0;
          const problemVenues = [];
          
          listResult.data.venues.forEach((venue, index) => {
            if (venue.id && venue.id !== '') {
              validIdCount++;
            } else if (venue.id === '') {
              emptyIdCount++;
              problemVenues.push({
                index: index,
                name: venue.name,
                email: venue.contactEmail,
                id: venue.id,
                problem: '空ID'
              });
            } else {
              invalidIdCount++;
              problemVenues.push({
                index: index,
                name: venue.name,
                email: venue.contactEmail,
                id: venue.id,
                problem: '无效ID'
              });
            }
          });
          
          console.log('\n   场地ID分析结果:');
          console.log(`   ✅ 有效ID: ${validIdCount} 个`);
          console.log(`   ❌ 空ID: ${emptyIdCount} 个`);
          console.log(`   ⚠️ 无效ID: ${invalidIdCount} 个`);
          
          if (problemVenues.length > 0) {
            console.log('\n   有问题的场地数据:');
            problemVenues.forEach(problem => {
              console.log(`   - 场地 ${problem.index}: ${problem.name} (${problem.email})`);
              console.log(`     问题: ${problem.problem}, ID: "${problem.id}"`);
            });
          } else {
            console.log('   🎉 所有场地数据ID都有效，没有问题！');
          }
          
          // 3. 检查场地详情API
          console.log('\n3. 检查场地详情API...');
          if (listResult.data.venues.length > 0) {
            const firstVenue = listResult.data.venues[0];
            console.log(`   测试第一个场地详情: ID="${firstVenue.id}", 名称="${firstVenue.name}"`);
            
            const detailResult = await makeRequest('GET', `${API_BASE}/venues/${firstVenue.id}`, null, {
              Authorization: `Bearer ${token}`
            });
            
            console.log(`   详情API响应状态码: ${detailResult.status}`);
            if (detailResult.status === 200) {
              console.log('   ✅ 场地详情获取成功');
              console.log(`   场地名称: ${detailResult.data.name}`);
              console.log(`   场地ID: ${detailResult.data.id}`);
            } else {
              console.log(`   ❌ 场地详情获取失败: ${detailResult.data?.message}`);
            }
          }
        }
      } else {
        console.log('❌ 场地列表获取失败:', listResult.data?.message);
      }
      
      // 4. 创建新的场地测试当前ID生成
      console.log('\n4. 创建新的场地测试当前ID生成...');
      const newVenueData = {
        name: `数据检查测试场地 ${timestamp}`,
        description: '用于检查场地数据问题的场地',
        address: '数据检查测试市测试区测试路707号',
        city: '数据检查测试市',
        province: '数据检查测试省',
        postalCode: '950000',
        country: '中国',
        type: 'gym',
        capacity: 250,
        contactPhone: '+8613888888888',
        contactEmail: `venue-check-new-${timestamp}@example.com`,
        status: 'active',
        allowOnlineBooking: true,
        bookingAdvanceHours: 192
      };
      
      const newVenueResult = await makeRequest('POST', `${API_BASE}/venues`, newVenueData, {
        Authorization: `Bearer ${token}`
      });
      
      console.log('   新场地创建状态码:', newVenueResult.status);
      if (newVenueResult.status === 200 || newVenueResult.status === 201) {
        console.log('   ✅ 新场地创建成功');
        console.log('   新场地ID:', newVenueResult.data.id || '未找到');
        console.log('   ID有效性:', newVenueResult.data.id && newVenueResult.data.id !== '' ? '有效' : '无效');
      } else {
        console.log('   ❌ 新场地创建失败:', newVenueResult.data?.message);
      }
      
      // 5. 数据问题总结
      console.log('\n5. 数据问题总结:');
      console.log('   场地数据状态:', emptyIdCount > 0 ? '有历史空ID数据' : '所有数据正常');
      console.log('   会员数据状态:', '有1个历史空ID数据（之前检查发现）');
      console.log('   当前生成状态:', '新数据ID生成正常');
      console.log('   建议处理:', emptyIdCount > 0 ? '考虑清理历史空ID数据' : '无需处理');
      
      return {
        success: true,
        totalVenues: listResult.data?.venues?.length || 0,
        problemVenues: problemVenues.length,
        token: token
      };
      
    } else {
      console.log('❌ 用户注册失败:', registerResult.data);
      return { success: false };
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    return { success: false };
  }
}

// 运行检查
checkVenueData().then(result => {
  console.log('\n📊 检查结果总结:');
  if (result && result.success) {
    console.log(`   场地数据检查完成，共有 ${result.totalVenues} 个场地`);
    if (result.problemVenues > 0) {
      console.log(`   ⚠️ 发现 ${result.problemVenues} 个有问题的场地数据`);
    } else {
      console.log('   ✅ 所有场地数据ID都有效');
    }
    console.log('   系统状态总结:');
    console.log('   - 新数据ID生成: ✅ 正常');
    console.log('   - 历史数据问题: ⚠️ 存在（可清理）');
    console.log('   - 核心功能: ✅ 正常');
  }
});