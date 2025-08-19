import { connectDatabase } from '../database/connection';
import { sequelize } from '../database/sequelize';
import { Project } from '../database/models/project';
import { logger } from '../utils/logger';

// 初始化监控数据
const initializeMonitoringData = async (): Promise<void> => {
  let conn;
  
  try {
    logger.info('🚀 开始初始化监控数据...');
    
    // 连接数据库
    conn = await connectDatabase();
    logger.info('✅ 数据库连接已建立');
    
    // 检查是否已有项目数据
    const existingProjects = await Project.findAll();
    if (existingProjects.length > 0) {
      logger.info(`ℹ️ 数据库中已有 ${existingProjects.length} 个项目，跳过初始化`);
      return;
    }
    
    // 创建示例项目数据
    const sampleProjects = [
      {
        uuid: 'project-1',
        name: 'axi-project-dashboard',
        display_name: '项目部署监控中心',
        description: '云端部署监控和管理系统',
        repository: 'MoseLu/axi-project-dashboard',
        branch: 'main',
        deploy_type: 'backend' as const,
        status: 'active' as const,
        deploy_path: '/srv/apps/axi-project-dashboard',
        port: 8090,
        url: 'https://redamancy.com.cn/project-dashboard',
        has_mysql: true,
        has_redis: true,
        health_check_interval: 300,
        auto_restart: true,
        restart_threshold: 3,
        total_deployments: 5,
        successful_deployments: 4,
        failed_deployments: 1,
        average_deployment_time: 120,
        is_running: false,
        mysql_backup_enabled: true
      },
      {
        uuid: 'project-2',
        name: 'axi-star-cloud',
        display_name: '星云文件管理系统',
        description: '基于Go的文件管理和分享系统',
        repository: 'MoseLu/axi-star-cloud',
        branch: 'main',
        deploy_type: 'backend' as const,
        status: 'active' as const,
        deploy_path: '/srv/apps/axi-star-cloud',
        port: 8080,
        url: 'https://redamancy.com.cn/star-cloud',
        has_mysql: true,
        has_redis: true,
        health_check_interval: 300,
        auto_restart: true,
        restart_threshold: 3,
        total_deployments: 8,
        successful_deployments: 7,
        failed_deployments: 1,
        average_deployment_time: 180,
        is_running: false,
        mysql_backup_enabled: true
      },
      {
        uuid: 'project-3',
        name: 'axi-docs',
        display_name: '文档中心',
        description: '项目文档和知识库',
        repository: 'MoseLu/axi-docs',
        branch: 'main',
        deploy_type: 'static' as const,
        status: 'active' as const,
        deploy_path: '/srv/static/axi-docs',
        url: 'https://redamancy.com.cn/docs',
        has_mysql: false,
        has_redis: false,
        health_check_interval: 300,
        auto_restart: true,
        restart_threshold: 3,
        total_deployments: 3,
        successful_deployments: 3,
        failed_deployments: 0,
        average_deployment_time: 45,
        is_running: false,
        mysql_backup_enabled: false
      },
      {
        uuid: 'project-4',
        name: 'axi-deploy',
        display_name: '部署中心',
        description: '自动化部署和CI/CD系统',
        repository: 'MoseLu/axi-deploy',
        branch: 'master',
        deploy_type: 'backend' as const,
        status: 'active' as const,
        deploy_path: '/srv/apps/axi-deploy',
        port: 8081,
        url: 'https://redamancy.com.cn/deploy',
        has_mysql: true,
        has_redis: false,
        health_check_interval: 300,
        auto_restart: true,
        restart_threshold: 3,
        total_deployments: 12,
        successful_deployments: 11,
        failed_deployments: 1,
        average_deployment_time: 90,
        is_running: false,
        mysql_backup_enabled: true
      }
    ];
    
    // 插入项目数据
    for (const projectData of sampleProjects) {
      await Project.create(projectData);
      logger.info(`✅ 已创建项目: ${projectData.display_name}`);
    }
    
    logger.info('🎉 监控数据初始化完成');
    logger.info(`📊 已创建 ${sampleProjects.length} 个项目`);
    
  } catch (error) {
    logger.error('❌ 监控数据初始化失败:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  initializeMonitoringData()
    .then(() => {
      logger.info('✅ 监控数据初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ 监控数据初始化失败:', error);
      process.exit(1);
    });
}

export default initializeMonitoringData;
