import { Deployment } from '../database/models/deployment';
import { sequelize } from '../database/sequelize';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

async function fixDeploymentData() {
  try {
    await sequelize.authenticate();
    logger.info('数据库连接成功');

    // 获取当前时间
    const now = new Date();
    logger.info(`当前时间: ${now.toISOString()}`);

    // 删除所有现有的部署数据，让仪表板从空白开始
    logger.info('🗑️ 删除所有现有的部署数据...');
    const totalCount = await Deployment.count();
    
    if (totalCount > 0) {
      await Deployment.destroy({
        where: {},
        truncate: true // 使用 truncate 更快地清空表
      });
      logger.info(`✅ 已删除所有 ${totalCount} 条部署记录`);
    } else {
      logger.info('ℹ️ 数据库中没有部署记录，无需清理');
    }

    // 验证清理结果
    const remainingCount = await Deployment.count();
    logger.info(`📊 清理后剩余记录数: ${remainingCount}`);

    if (remainingCount === 0) {
      logger.info('✅ 数据库已清空，仪表板将显示空白状态');
      logger.info('💡 当有真实的部署发生时，数据会自动添加');
    } else {
      logger.warn('⚠️ 仍有数据未清理，请检查数据库');
    }

    // 显示清理结果
    logger.info('📋 清理结果总结:');
    logger.info(`  - 总记录数: ${totalCount}`);
    logger.info(`  - 已删除: ${totalCount}`);
    logger.info(`  - 剩余: ${remainingCount}`);
    
    if (remainingCount === 0) {
      logger.info('🎉 清理完成！仪表板现在将显示空白状态');
      logger.info('📝 当有真实的部署发生时，数据会自动添加到仪表板');
    }

  } catch (error) {
    logger.error('修复部署数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixDeploymentData();
}

export { fixDeploymentData };
