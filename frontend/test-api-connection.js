// 测试前后端API连接状态的脚本 - 简化版本
const API_URL = 'https://tcm-knowledge-graph.onrender.com/api';
const https = require('https');

console.log('开始测试API连接...');
console.log('目标API地址:', API_URL);

// 使用Node.js原生https模块进行简单测试
function testAPIWithHttps() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'tcm-knowledge-graph.onrender.com',
      path: '/api/stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      console.log(`\n响应状态码: ${res.statusCode}`);
      console.log(`响应头信息: ${JSON.stringify(res.headers)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n响应数据长度:', data.length, '字节');
        if (data.length > 0) {
          try {
            const jsonData = JSON.parse(data);
            console.log('成功解析为JSON数据');
          } catch (e) {
            console.log('响应数据（前200字节）:', data.substring(0, 200) + '...');
          }
        }
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.error('\n请求错误:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('\n请求超时');
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 执行测试
async function runTests() {
  try {
    console.log('测试1: 检查API基础连接');
    await testAPIWithHttps();
    console.log('\n测试2: 检查API根路径');
    // 简单检查根路径
    await new Promise((resolve, reject) => {
      https.get('https://tcm-knowledge-graph.onrender.com', (res) => {
        console.log(`根路径响应状态码: ${res.statusCode}`);
        resolve();
      }).on('error', (e) => {
        console.error('根路径访问错误:', e.message);
        resolve(); // 即使失败也继续
      });
    });
    
    console.log('\nAPI连接测试完成');
  } catch (error) {
    console.error('\n测试过程中出现错误:', error.message);
    console.log('\n可能的原因:');
    console.log('1. Render服务可能处于休眠状态（需要等待自动启动）');
    console.log('2. 网络连接问题');
    console.log('3. 后端服务未正常部署或运行');
  }
}

runTests();