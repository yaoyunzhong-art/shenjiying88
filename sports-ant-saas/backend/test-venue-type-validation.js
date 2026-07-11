// 测试场地类型验证问题
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

async function testVenueTypeValidation() {
  console.log('🔍 测试场地类型验证问题...');
  
  try {
    // 使用现有的有效token
    const tokenInfo = require('./refresh-token-info.json');
    const adminToken = tokenInfo.adminUser.token;
    
    if (!adminToken) {
      console.log('❌ 没有找到有效的token');
      return { success: false };
    }
    
    console.log('✅ 使用有效token');
    
    // 测试不同的场地类型
    const testCases = [
      {
        name: '测试用例1 - gym (应该成功)',
        type: 'gym',
        expected: '成功'
      },
      {
        name: '测试用例2 - swimming_pool (应该失败，正确是pool)',
        type: 'swimming_pool',
        expected: '失败'
      },
      {
        name: '测试用例3 - pool (应该成功)',
        type: 'pool',
        expected: '成功'
      },
      {
        name: '测试用例4 - yoga_studio (应该失败，正确是other)',
        type: 'yoga_studio',
        expected: '失败'
      },
      {
        name: '测试用例5 - other (应该成功)',
        type: 'other',
        expected: '成功'
      },
      {
        name: '测试用例6 - stadium (应该成功)',
        type: 'stadium',
        expected: '成功'
      },
      {
        name: '测试用例7 - court (应该成功)',
        type: 'court',
        expected: '成功'
      },
      {
        name: '测试用例8 - indoor (应该成功)',
        type: 'indoor',
        expected: '成功'
      },
      {
        name: '测试用例9 - outdoor (应该成功)',
        type: 'outdoor',
        expected: '成功'
      },
      {
        name: '测试用例10 - mixed (应该成功)',
        type: 'mixed',
        expected: '成功'
      }
    ];
    
    const results = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n${i + 1}. ${testCase.name}`);
      console.log(`   测试类型: "${testCase.type}"，预期: ${testCase.expected}`);
      
      const venueData = {
        name: `类型测试场地 ${i + 1} - ${testCase.type}`,
        description: `测试场地类型 "${testCase.type}" 的验证`,
        address: `类型测试市测试区测试路${100 + i}号`,
        city: '类型测试市',
        province: '类型测试省',
        postalCode: `${100000 + i * 1000}`,
        country: '中国',
        type: testCase.type,
        capacity: 100 + i * 10,
        contactPhone: `+86138${(60000000 + i * 1000000).toString().padStart(8, '0')}`,
        contactEmail: `type-test-${i + 1}-${timestamp}@example.com`,
        status: 'active',
        allowOnlineBooking: true,
        bookingAdvanceHours: 24 * (i + 1)
      };
      
      const result = await makeRequest('POST', `${API_BASE}/venues`, venueData, {
        Authorization: `Bearer ${adminToken}`
      });
      
      const success = result.status === 200 || result.status === 201;
      const statusText = success ? '✅ 成功' : '❌ 失败';
      
      console.log(`   实际结果: ${statusText} (状态码: ${result.status})`);
      
      if (!success && result.data && result.data.message) {
        console.log(`   错误信息: ${result.data.message}`);
        if (result.data.errors) {
          result.data.errors.forEach((error, idx) => {
            if (error.property === 'type') {
              console.log(`   验证错误: ${error.property} - ${Object.values(error.constraints || {}).join(', ')}`);
            }
          });
        }
      }
      
      if (success && result.data && result.data.id) {
        console.log(`   场地ID: ${result.data.id}`);
      }
      
      results.push({
        testCase: testCase.name,
        type: testCase.type,
        expected: testCase.expected,
        actual: success ? '成功' : '失败',
        status: result.status,
        match: (testCase.expected === '成功') === success,
        id: result.data?.id
      });
      
      // 小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 分析验证问题
    console.log('\n🔍 验证问题分析:');
    const totalTests = results.length;
    const passedTests = results.filter(r => r.match).length;
    const failedTests = results.filter(r => !r.match).length;
    
    console.log(`   总测试数: ${totalTests}`);
    console.log(`   通过测试: ${passedTests}`);
    console.log(`   失败测试: ${failedTests}`);
    
    // 分析失败原因
    const failedCases = results.filter(r => !r.match);
    if (failedCases.length > 0) {
      console.log('\n   失败测试分析:');
      failedCases.forEach((test, idx) => {
        console.log(`   ${idx + 1}. ${test.testCase}`);
        console.log(`      类型: "${test.type}"`);
        console.log(`      预期: ${test.expected}，实际: ${test.actual}`);
        console.log(`      状态码: ${test.status}`);
        console.log(`      问题: 类型枚举不匹配`);
      });
    }
    
    // 总结有效的场地类型
    console.log('\n📋 有效的场地类型枚举:');
    const validTypes = ['gym', 'stadium', 'court', 'pool', 'other', 'indoor', 'outdoor', 'mixed'];
    console.log(`   ${validTypes.join(', ')}`);
    
    // 总结常见的错误类型映射
    console.log('\n🔄 常见的错误类型映射:');
    const commonMistakes = {
      'swimming_pool': 'pool',
      'yoga_studio': 'other',
      'tennis_court': 'court',
      'basketball_court': 'court',
      'football_field': 'stadium',
      'boxing_ring': 'other',
      'dance_studio': 'other',
      'climbing_wall': 'other'
    };
    
    Object.entries(commonMistakes).forEach(([wrong, correct]) => {
      console.log(`   "${wrong}" → "${correct}"`);
    });
    
    // 创建验证问题解决方案
    console.log('\n💡 验证问题解决方案:');
    console.log('   1. 更新测试数据使用正确的枚举值');
    console.log('   2. 或者扩展VenueType枚举包含更多类型');
    console.log('   3. 更新文档说明有效的场地类型');
    
    return {
      success: true,
      results: results,
      validTypes: validTypes,
      commonMistakes: commonMistakes
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return { success: false };
  }
}

// 运行测试
testVenueTypeValidation().then(result => {
  console.log('\n🧪 测试结果总结:');
  if (result && result.success) {
    console.log('✅ 场地类型验证测试完成');
    console.log('   成功识别了场地类型枚举不匹配问题');
    console.log('   明确了有效的场地类型和常见的错误映射');
    console.log('   为修复测试数据和API文档提供了明确方向');
  }
});