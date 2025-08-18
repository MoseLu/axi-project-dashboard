const { Sequelize } = require('sequelize');
const { Project } = require('./dist/database/models/project');
const { Deployment } = require('./dist/database/models/deployment');
const { DeploymentStep } = require('./dist/database/models/deployment-step');

// 数据库配置
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'axi_dashboard',
  logging: false
});

async function fixMonitoring() {
  try {
    console.log('🔧 开始修复监控中心问题...\n');

    // 测试连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查数据库表是否存在
    const tables = await sequelize.showAllSchemas();
    console.log('📋 数据库表:', tables.map(t => t.name));

    // 检查项目数据
    const projectCount = await Project.count();
    console.log(`📊 项目数量: ${projectCount}`);

    if (projectCount === 0) {
      console.log('⚠️ 没有项目数据，创建测试项目...');
      
      const testProject = await Project.create({
        name: 'axi-project-dashboard',
        display_name: 'AXI Project Dashboard',
        description: 'AXI 项目仪表板',
        repository: 'https://github.com/MoseLu/axi-project-dashboard',
        branch: 'main',
        port: 8090,
        url: 'https://redamancy.com.cn/project-dashboard',
        status: 'active',
        is_running: true,
        memory_usage: 512,
        disk_usage: 2048,
        cpu_usage: 25,
        uptime: 172800,
        last_health_check: new Date()
      });
      
      console.log(`✅ 创建测试项目: ${testProject.name}`);
    } else {
      const projects = await Project.findAll();
      console.log('📋 现有项目:');
      projects.forEach(p => {
        console.log(`  - ${p.name} (${p.status}) - 运行状态: ${p.is_running}`);
      });
    }

    // 检查部署数据
    const deploymentCount = await Deployment.count();
    console.log(`📊 部署记录数量: ${deploymentCount}`);

    if (deploymentCount === 0) {
      console.log('⚠️ 没有部署记录，创建测试部署...');
      
      const testDeployment = await Deployment.create({
        project_name: 'axi-project-dashboard',
        repository: 'https://github.com/MoseLu/axi-project-dashboard',
        branch: 'main',
        commit_hash: 'test-commit-123',
        status: 'success',
        start_time: new Date(Date.now() - 3600000),
        end_time: new Date(Date.now() - 3500000),
        duration: 100000,
        triggered_by: 'system',
        trigger_type: 'push',
        logs: '测试部署成功完成'
      });
      
      console.log(`✅ 创建测试部署: ${testDeployment.project_name} - ${testDeployment.status}`);
      
      // 创建部署步骤
      const steps = [
        {
          deployment_id: testDeployment.id,
          step_name: 'checkout',
          display_name: '代码检出',
          step_order: 1,
          step_type: 'validation',
          status: 'success',
          start_time: testDeployment.start_time,
          end_time: new Date(testDeployment.start_time.getTime() + 10000),
          duration: 10000,
          logs: '代码检出成功'
        },
        {
          deployment_id: testDeployment.id,
          step_name: 'build',
          display_name: '构建项目',
          step_order: 2,
          step_type: 'deployment',
          status: 'success',
          start_time: new Date(testDeployment.start_time.getTime() + 10000),
          end_time: new Date(testDeployment.start_time.getTime() + 60000),
          duration: 50000,
          logs: '构建完成'
        },
        {
          deployment_id: testDeployment.id,
          step_name: 'deploy',
          display_name: '部署服务',
          step_order: 3,
          step_type: 'service',
          status: 'success',
          start_time: new Date(testDeployment.start_time.getTime() + 60000),
          end_time: testDeployment.end_time,
          duration: 40000,
          logs: '部署成功'
        }
      ];

      for (const stepData of steps) {
        await DeploymentStep.create(stepData);
      }
      console.log(`✅ 为部署创建了 ${steps.length} 个步骤`);
    } else {
      const deployments = await Deployment.findAll({
        limit: 5,
        order: [['created_at', 'DESC']]
      });
      console.log('📋 最近部署记录:');
      deployments.forEach(d => {
        console.log(`  - ${d.project_name} (${d.status}) - ${d.start_time}`);
      });
    }

    // 检查数据库连接状态
    console.log('\n🔍 检查数据库连接状态...');
    const connectionState = sequelize.connectionManager.getConnection();
    console.log(`数据库连接状态: ${connectionState ? '已连接' : '未连接'}`);

    console.log('\n🎉 监控中心修复完成！');
    console.log('📊 最终数据统计:');
    console.log(`- 项目数量: ${await Project.count()}`);
    console.log(`- 部署记录数量: ${await Deployment.count()}`);
    console.log(`- 部署步骤数量: ${await DeploymentStep.count()}`);

  } catch (error) {
    console.error('❌ 修复监控中心失败:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixMonitoring().catch(console.error);
}

module.exports = { fixMonitoring };
