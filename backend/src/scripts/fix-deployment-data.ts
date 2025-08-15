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
    const currentYear = now.getFullYear();
    
    logger.info(`当前时间: ${now.toISOString()}`);
    logger.info(`当前年份: ${currentYear}`);

    // 1. 删除时间戳明显错误的记录（比如2024年的数据）
    const wrongYearCount = await Deployment.destroy({
      where: {
        triggered_at: {
          [Op.lt]: new Date('2024-12-31') // 删除2024年及之前的所有数据
        }
      }
    });

    logger.info(`已删除 ${wrongYearCount} 条时间戳错误的部署记录`);

    // 2. 删除没有实际意义的部署记录
    const meaninglessCount = await Deployment.destroy({
      where: {
        [Op.or]: [
          {
            duration: 0,
            status: 'success'
          },
          {
            duration: { [Op.is]: null },
            status: 'success'
          }
        ]
      }
    });

    logger.info(`已删除 ${meaninglessCount} 条无意义的部署记录`);

    // 3. 删除测试数据
    const testDataCount = await Deployment.destroy({
      where: {
        project_name: {
          [Op.or]: [
            { [Op.like]: '%test%' },
            { [Op.like]: '%demo%' },
            { [Op.like]: '%sample%' },
            { [Op.like]: '%mock%' },
            { [Op.like]: '%fake%' }
          ]
        }
      }
    });

    logger.info(`已删除 ${testDataCount} 条测试部署记录`);

    // 4. 显示剩余的部署记录统计
    const remainingCount = await Deployment.count();
    const projectStats = await Deployment.findAll({
      attributes: [
        'project_name',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['project_name'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    logger.info(`剩余 ${remainingCount} 条部署记录`);
    logger.info('项目统计:');
    projectStats.forEach(stat => {
      logger.info(`  ${stat.get('project_name')}: ${stat.get('count')} 条`);
    });

    // 5. 显示最近的几条记录用于验证
    const recentDeployments = await Deployment.findAll({
      order: [['triggered_at', 'DESC']],
      limit: 5
    });

    logger.info('最近的部署记录:');
    recentDeployments.forEach(deployment => {
      logger.info(`  ${deployment.project_name}: ${deployment.status} - ${deployment.triggered_at}`);
    });

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
