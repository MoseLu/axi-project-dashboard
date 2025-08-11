import { Sequelize } from 'sequelize';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

// 创建 Sequelize 实例
export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: config.database.mysql.host,
  port: config.database.mysql.port,
  username: config.database.mysql.user,
  password: config.database.mysql.password,
  database: config.database.mysql.database,
  timezone: '+08:00',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 10000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
});

// 测试数据库连接
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Sequelize database connection established successfully');
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// 同步数据库模型
export const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('✅ Database models synchronized successfully');
  } catch (error) {
    logger.error('❌ Failed to sync database models:', error);
    throw error;
  }
};

// 关闭数据库连接
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('✅ Sequelize database connection closed successfully');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
    throw error;
  }
};
