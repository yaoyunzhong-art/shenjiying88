// 调试场地创建API验证问题
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

async function debugVenueValidation() {
  console.log('🔍 调试场地创建API验证问题...');
  
  try {
    // 使用现有的测试管理员token
    const testInfo = require('./test-dataset-info.json');
    const adminToken = testInfo.adminUser.token;
    
    if (!adminToken) {
      console.log('❌ 没有找到有效的管理员token');
      return { success: false };
    }
    
    console.log('✅ 使用现有管理员token');
    
    // 测试不同的场地数据，找出验证问题
    const testCases = [
      {
        name: '测试用例1 - 最小有效数据',
        data: {
          name: '最小测试场地',
          description: '最小数据测试',
          address: '测试地址',
          city: '测试市',
          province: '测试省',
          postalCode: '100000',
          country: '中国',
          type: 'gym',
          capacity: 50,
          contactPhone: '+8613812345678',
          contactEmail: 'min-test@example.com',
          status: 'active',
          allowOnlineBooking: true,
          bookingAdvanceHours: 24
        }
      },
      {
        name: '测试用例2 - 上海场地（之前失败的）',
        data: {
          name: '测试场地 2 - 上海',
          description: '这是位于上海的swimming_pool测试场地，提供优质的运动服务',
          address: '上海市测试区测试路101号',
          city: '上海',
          province: '上海省',
          postalCode: '200000',
          country: '中国',
          type: 'swimming_pool',
          capacity: 150,
          contactPhone: '+8613810000001',
          contactEmail: 'test-venue-2-1774567331319@example.com',
          status: 'active',
          allowOnlineBooking: true,
          bookingAdvanceHours: 48
        }
      },
      {
        name: '测试用例3 - 检查type枚举',
        data: {
          name: '测试枚举类型',
          description: '测试type枚举验证',
          address: '枚举测试地址',
          city: '测试市',
          province: '测试省',
          postalCode: '300000',
          country: '中国',
          type: 'invalid_type', // 可能无效的类型
          capacity: 100,
          contactPhone: '+8613812345679',
          contactEmail: 'enum-test@example.com',
          status: 'active',
          allowOnlineBooking: true,
          bookingAdvanceHours: 72
        }
      },
      {
        name: '测试用例4 - 检查status枚举',
        data: {
          name: '测试状态枚举',
          description: '测试status枚举验证',
          address: '状态测试地址',
          city: '测试市',
          province: '测试省',
          postalCode: '400000',
          country: '中国',
          type: 'gym',
          capacity: 80,
          contactPhone: '+8613812345680',
          contactEmail: 'status-test@example.com',
          status: 'invalid_status', // 可能无效的状态
          allowOnlineBooking: true,
          bookingAdvanceHours: 96
        }
      },
      {
        name: '测试用例5 - 检查数字范围',
        data: {
          name: '测试数字范围',
          description: '测试capacity和bookingAdvanceHours范围',
          address: '范围测试地址',
          city: '测试市',
          province: '测试省',
          postalCode: '500000',
          country: '中国',
          type: 'gym',
          capacity: -10, // 无效的负数
          contactPhone: '+8613812345681',
          contactEmail: 'range-test@example.com',
          status: 'active',
          allowOnlineBooking: true,
          bookingAdvanceHours: -24 // 无效的负数
        }
      },
      {
        name: '测试用例6 - 检查必填字段',
        data: {
          // 缺少必填字段
          name: '测试必填字段',
          description: '测试缺少必填字段',
          // 缺少address
          city: '测试市',
          province: '测试省',
          postalCode: '600000',
          country: '中国',
          type: 'gym',
          capacity: 100,
          contactPhone: '+8613812345682',
          contactEmail: 'required-test@example.com',
          status: 'active',
          allowOnlineBooking: true,
          bookingAdvanceHours: 120
        }
      }
    ];
    
    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n${i + 1}. ${testCase.name}`);
      console.log('   发送数据:', JSON.stringify(testCase.data, null, 2).split('\n').map(line => '   ' + line).join('\n'));
      
      const result = await makeRequest('POST', `${API_BASE}/venues`, testCase.data, {
        Authorization: `Bearer ${adminToken}`
      });
      
      console.log('   响应状态码:', result.status);
      
      if (result.status === 200 || result.status === 201) {
        console.log('   ✅ 创建成功');
        console.log('   场地ID:', result.data.id);
      } else {
        console.log('   ❌ 创建失败');
        if (result.data && result.data.message) {
          console.log('   错误信息:', result.data.message);
        }
        if (result.data && result.data.errors) {
          console.log('   验证错误:');
          result.data.errors.forEach((error, idx) => {
            console.log(`     ${idx + 1}. ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`);
          });
        }
      }
      
      results.push({
        testCase: testCase.name,
        status: result.status,
        data: result.data,
        success: result.status === 200 || result.status === 201
      });
      
      // 小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 分析验证问题
    console.log('\n🔍 验证问题分析:');
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`   成功: ${successCount} 个，失败: ${failCount} 个`);
    
    // 分析失败原因
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('\n   失败测试分析:');
      failedTests.forEach((test, idx) => {
        console.log(`   ${idx + 1}. ${test.testCase}`);
        console.log(`     状态码: ${test.status}`);
        if (test.data && test.data.message) {
          console.log(`     错误: ${test.data.message}`);
        }
        if (test.data && test.data.errors) {
          console.log(`     验证错误:`);
          test.data.errors.forEach((error, errorIdx) => {
            console.log(`       - ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`);
          });
        }
      });
    }
    
    // 总结验证规则
    console.log('\n📋 验证规则总结:');
    const validationRules = {
      requiredFields: ['name', 'address', 'city', 'province', 'postalCode', 'country', 'type', 'capacity', 'contactPhone', 'contactEmail', 'status'],
      typeEnum: ['gym', 'swimming_pool', 'yoga_studio', 'tennis_court', 'basketball_court', 'football_field', 'boxing_ring', 'dance_studio', 'climbing_wall', 'other'],
      statusEnum: ['active', 'inactive', 'maintenance', 'closed'],
      numberRanges: {
        capacity: '正数',
        bookingAdvanceHours: '正数或零'
      }
    };
    
    console.log('   必填字段:', validationRules.requiredFields.join(', '));
    console.log('   场地类型枚举:', validationRules.typeEnum.join(', '));
    console.log('   状态枚举:', validationRules.statusEnum.join(', '));
    console.log('   数字范围:', JSON.stringify(validationRules.numberRanges, null, 2).split('\n').map(line => '   ' + line).join('\n'));
    
    return {
      success: true,
      results: results,
      validationRules: validationRules
    };
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    return { success: false };
  }
}

// 运行调试
debugVenueValidation().then(result => {
  console.log('\n🧪 调试结果总结:');
  if (result && result.success) {
    console.log('✅ 验证问题调试完成');
    console.log('   通过系统化测试识别了验证规则和问题');
    console.log('   为优化API验证提供了明确方向');
  }
});