const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// 数据库配置
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'axi_dashboard',
  logging: false,
  timezone: '+08:00'
});

// 简化的 Deployment 模型
const Deployment = sequelize.define('Deployment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  uuid: {
    type: DataTypes.UUID,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
  },
  project_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  repository: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  branch: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  commit_hash: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'success', 'failed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  triggered_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  trigger_type: {
    type: DataTypes.ENUM('push', 'manual', 'schedule'),
    allowNull: false,
    defaultValue: 'manual',
  },
  logs: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'deployments',
  timestamps: true,
});

async function fixDeploymentData() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 获取当前时间
    const now = new Date();
    console.log(`📅 当前时间: ${now.toISOString()}`);

    // 删除所有现有的部署数据，让仪表板从空白开始
    console.log('🗑️ 删除所有现有的部署数据...');
    const totalCount = await Deployment.count();
    
    if (totalCount > 0) {
      await Deployment.destroy({
        where: {},
        truncate: true // 使用 truncate 更快地清空表
      });
      console.log(`✅ 已删除所有 ${totalCount} 条部署记录`);
    } else {
      console.log('ℹ️ 数据库中没有部署记录，无需清理');
    }

    // 验证清理结果
    const remainingCount = await Deployment.count();
    console.log(`📊 清理后剩余记录数: ${remainingCount}`);

    if (remainingCount === 0) {
      console.log('✅ 数据库已清空，仪表板将显示空白状态');
      console.log('💡 当有真实的部署发生时，数据会自动添加');
    } else {
      console.log('⚠️ 仍有数据未清理，请检查数据库');
    }

    // 显示清理结果
    console.log('📋 清理结果总结:');
    console.log(`  - 总记录数: ${totalCount}`);
    console.log(`  - 已删除: ${totalCount}`);
    console.log(`  - 剩余: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('🎉 清理完成！仪表板现在将显示空白状态');
      console.log('📝 当有真实的部署发生时，数据会自动添加到仪表板');
    }

  } catch (error) {
    console.error('❌ 修复部署数据失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixDeploymentData();
}

module.exports = { fixDeploymentData };
