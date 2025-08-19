#!/usr/bin/env node

/**
 * 监控系统测试脚本
 * 用于测试 Prometheus + Grafana + AlertManager 监控系统
 */

const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 颜色定义
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 日志函数
function log(message, color = 'blue') {
  console.log(`${colors[color]}[${new Date().toISOString()}]${colors.reset} ${message}`);
}

// 测试配置
const config = {
  services: {
    prometheus: 'http://localhost:9090',
    grafana: 'http://localhost:3000',
    alertmanager: 'http://localhost:9093',
    app: 'http://localhost:8090',
    nodeExporter: 'http://localhost:9100'
  },
  timeouts: {
    health: 5000,
    metrics: 10000
  }
};

// 健康检查函数
async function healthCheck(url, serviceName) {
  try {
    log(`检查 ${serviceName} 健康状态...`, 'blue');
    const response = await axios.get(url, { timeout: config.timeouts.health });
    
    if (response.status === 200) {
      log(`✅ ${serviceName} 健康检查通过`, 'green');
      return true;
    } else {
      log(`❌ ${serviceName} 健康检查失败: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${serviceName} 健康检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 指标检查函数
async function metricsCheck(url, serviceName) {
  try {
    log(`检查 ${serviceName} 指标端点...`, 'blue');
    const response = await axios.get(url, { timeout: config.timeouts.metrics });
    
    if (response.status === 200 && response.data) {
      log(`✅ ${serviceName} 指标端点正常`, 'green');
      return true;
    } else {
      log(`❌ ${serviceName} 指标端点异常: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${serviceName} 指标端点异常: ${error.message}`, 'red');
    return false;
  }
}

// Prometheus 目标检查
async function checkPrometheusTargets() {
  try {
    log('检查 Prometheus 监控目标...', 'blue');
    const response = await axios.get(`${config.services.prometheus}/api/v1/targets`);
    
    if (response.status === 200 && response.data.data.activeTargets) {
      const targets = response.data.data.activeTargets;
      log(`✅ Prometheus 监控目标数量: ${targets.length}`, 'green');
      
      targets.forEach(target => {
        const status = target.health === 'up' ? '✅' : '❌';
        log(`  ${status} ${target.labels.job} (${target.labels.instance})`, target.health === 'up' ? 'green' : 'red');
      });
      
      return true;
    } else {
      log('❌ Prometheus 目标检查失败', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Prometheus 目标检查失败: ${error.message}`, 'red');
    return false;
  }
}

// Grafana 数据源检查
async function checkGrafanaDatasources() {
  try {
    log('检查 Grafana 数据源...', 'blue');
    const response = await axios.get(`${config.services.grafana}/api/datasources`);
    
    if (response.status === 200 && response.data) {
      log(`✅ Grafana 数据源数量: ${response.data.length}`, 'green');
      
      response.data.forEach(ds => {
        log(`  ✅ ${ds.name} (${ds.type})`, 'green');
      });
      
      return true;
    } else {
      log('❌ Grafana 数据源检查失败', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Grafana 数据源检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 应用指标检查
async function checkAppMetrics() {
  try {
    log('检查应用监控指标...', 'blue');
    const response = await axios.get(`${config.services.app}/metrics`);
    
    if (response.status === 200 && response.data) {
      const metrics = response.data;
      
      // 检查关键指标是否存在
      const requiredMetrics = [
        'http_requests_total',
        'http_request_duration_seconds',
        'websocket_active_connections',
        'deployment_status'
      ];
      
      let foundMetrics = 0;
      requiredMetrics.forEach(metric => {
        if (metrics.includes(metric)) {
          log(`  ✅ ${metric}`, 'green');
          foundMetrics++;
        } else {
          log(`  ❌ ${metric}`, 'red');
        }
      });
      
      if (foundMetrics === requiredMetrics.length) {
        log('✅ 所有关键指标都存在', 'green');
        return true;
      } else {
        log(`❌ 缺少 ${requiredMetrics.length - foundMetrics} 个关键指标`, 'red');
        return false;
      }
    } else {
      log('❌ 应用指标检查失败', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 应用指标检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 系统指标检查
async function checkSystemMetrics() {
  try {
    log('检查系统监控指标...', 'blue');
    const response = await axios.get(`${config.services.nodeExporter}/metrics`);
    
    if (response.status === 200 && response.data) {
      const metrics = response.data;
      
      // 检查关键系统指标
      const requiredMetrics = [
        'node_cpu_seconds_total',
        'node_memory_MemTotal_bytes',
        'node_filesystem_size_bytes',
        'node_network_receive_bytes_total'
      ];
      
      let foundMetrics = 0;
      requiredMetrics.forEach(metric => {
        if (metrics.includes(metric)) {
          log(`  ✅ ${metric}`, 'green');
          foundMetrics++;
        } else {
          log(`  ❌ ${metric}`, 'red');
        }
      });
      
      if (foundMetrics === requiredMetrics.length) {
        log('✅ 所有系统指标都存在', 'green');
        return true;
      } else {
        log(`❌ 缺少 ${requiredMetrics.length - foundMetrics} 个系统指标`, 'red');
        return false;
      }
    } else {
      log('❌ 系统指标检查失败', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 系统指标检查失败: ${error.message}`, 'red');
    return false;
  }
}

// Docker 容器状态检查
async function checkDockerContainers() {
  try {
    log('检查 Docker 容器状态...', 'blue');
    const { stdout } = await execAsync('docker-compose -f docker-compose.monitoring.yml ps');
    
    const lines = stdout.split('\n').filter(line => line.trim());
    let runningCount = 0;
    
    lines.forEach(line => {
      if (line.includes('Up')) {
        const containerName = line.split(/\s+/)[0];
        log(`  ✅ ${containerName} 运行中`, 'green');
        runningCount++;
      } else if (line.includes('Exit')) {
        const containerName = line.split(/\s+/)[0];
        log(`  ❌ ${containerName} 已停止`, 'red');
      }
    });
    
    log(`✅ 运行中的容器数量: ${runningCount}`, 'green');
    return runningCount > 0;
  } catch (error) {
    log(`❌ Docker 容器检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 性能测试
async function performanceTest() {
  try {
    log('开始性能测试...', 'blue');
    
    // 测试应用响应时间
    const startTime = Date.now();
    await axios.get(`${config.services.app}/health`);
    const responseTime = Date.now() - startTime;
    
    if (responseTime < 1000) {
      log(`✅ 应用响应时间: ${responseTime}ms (正常)`, 'green');
    } else {
      log(`⚠️ 应用响应时间: ${responseTime}ms (较慢)`, 'yellow');
    }
    
    // 测试指标收集时间
    const metricsStartTime = Date.now();
    await axios.get(`${config.services.app}/metrics`);
    const metricsResponseTime = Date.now() - metricsStartTime;
    
    if (metricsResponseTime < 2000) {
      log(`✅ 指标收集时间: ${metricsResponseTime}ms (正常)`, 'green');
    } else {
      log(`⚠️ 指标收集时间: ${metricsResponseTime}ms (较慢)`, 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ 性能测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 主测试函数
async function runTests() {
  log('🚀 开始监控系统测试...', 'blue');
  
  const results = {
    health: {},
    metrics: {},
    docker: false,
    performance: false
  };
  
  // 健康检查
  log('\n📋 健康检查', 'blue');
  for (const [service, url] of Object.entries(config.services)) {
    results.health[service] = await healthCheck(url, service);
  }
  
  // 指标检查
  log('\n📊 指标检查', 'blue');
  results.metrics.app = await checkAppMetrics();
  results.metrics.system = await checkSystemMetrics();
  results.metrics.prometheus = await checkPrometheusTargets();
  results.metrics.grafana = await checkGrafanaDatasources();
  
  // Docker 容器检查
  log('\n🐳 Docker 容器检查', 'blue');
  results.docker = await checkDockerContainers();
  
  // 性能测试
  log('\n⚡ 性能测试', 'blue');
  results.performance = await performanceTest();
  
  // 生成测试报告
  log('\n📈 测试报告', 'blue');
  log('=' * 50, 'blue');
  
  const healthPassed = Object.values(results.health).filter(Boolean).length;
  const healthTotal = Object.keys(results.health).length;
  log(`健康检查: ${healthPassed}/${healthTotal} 通过`, healthPassed === healthTotal ? 'green' : 'red');
  
  const metricsPassed = Object.values(results.metrics).filter(Boolean).length;
  const metricsTotal = Object.keys(results.metrics).length;
  log(`指标检查: ${metricsPassed}/${metricsTotal} 通过`, metricsPassed === metricsTotal ? 'green' : 'red');
  
  log(`Docker 容器: ${results.docker ? '✅ 正常' : '❌ 异常'}`, results.docker ? 'green' : 'red');
  log(`性能测试: ${results.performance ? '✅ 通过' : '❌ 失败'}`, results.performance ? 'green' : 'red');
  
  const totalPassed = healthPassed + metricsPassed + (results.docker ? 1 : 0) + (results.performance ? 1 : 0);
  const totalTests = healthTotal + metricsTotal + 2;
  
  log(`\n总体结果: ${totalPassed}/${totalTests} 通过`, totalPassed === totalTests ? 'green' : 'red');
  
  if (totalPassed === totalTests) {
    log('\n🎉 所有测试通过！监控系统运行正常。', 'green');
  } else {
    log('\n⚠️ 部分测试失败，请检查相关服务。', 'yellow');
  }
  
  return totalPassed === totalTests;
}

// 脚本入口
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ 测试执行失败: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  runTests,
  healthCheck,
  metricsCheck,
  checkPrometheusTargets,
  checkGrafanaDatasources,
  checkAppMetrics,
  checkSystemMetrics,
  checkDockerContainers,
  performanceTest
};
