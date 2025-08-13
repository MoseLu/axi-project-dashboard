import { Deployment } from '../database/models/deployment';
import { sequelize } from '../database/sequelize';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

async function cleanupTestData() {
  try {
    await sequelize.authenticate();
    logger.info('数据库连接成功');

    // 删除测试数据（根据项目名称或其他标识）
    const testProjectNames = [
      'test-project',
      'demo-project',
      'sample-project',
      'mock-project',
      'fake-project'
    ];

    // 删除包含测试关键词的部署记录
    const deletedCount = await Deployment.destroy({
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

    logger.info(`已删除 ${deletedCount} 条测试部署记录`);

    // 删除没有实际意义的部署记录（比如duration为0且状态为success的记录）
    const meaninglessCount = await Deployment.destroy({
      where: {
        duration: 0,
        status: 'success',
        project_name: {
          [Op.notLike]: '%axi%' // 保留包含axi的项目
        }
      }
    });

    logger.info(`已删除 ${meaninglessCount} 条无意义的部署记录`);

    // 显示剩余的部署记录统计
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

  } catch (error) {
    logger.error('清理测试数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupTestData();
}

export { cleanupTestData };
