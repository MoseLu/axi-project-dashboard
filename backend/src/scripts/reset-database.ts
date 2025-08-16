import { connectDatabase } from '../database/connection';
import { sequelize } from '../database/sequelize';
import { logger } from '../utils/logger';

// 完全重置数据库
const resetDatabase = async (): Promise<void> => {
  let conn;
  
  try {
    logger.info('🔧 开始重置数据库...');

    // 1. 连接数据库
    conn = await connectDatabase();
    
    // 测试数据库连接
    await conn.execute('SELECT 1');
    logger.info('✅ 数据库连接正常');

    // 2. 删除所有表
    await dropAllTables(conn);

    // 3. 重新初始化数据库
    logger.info('🔧 重新初始化数据库...');
    const initializeDatabase = (await import('./init-database')).default;
    await initializeDatabase();

    logger.info('✅ 数据库重置完成');
  } catch (error) {
    logger.error('❌ 数据库重置失败:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
};

// 删除所有表
const dropAllTables = async (conn: any): Promise<void> => {
  // 获取所有表名
  const [rows] = await conn.execute(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE()
  `) as any;

  const tables = rows.map((row: any) => row.table_name);
  
  if (tables.length === 0) {
    logger.info('ℹ️ 数据库中没有表需要删除');
    return;
  }

  logger.info(`📋 发现 ${tables.length} 个表: ${tables.join(', ')}`);

  // 禁用外键检查
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
  logger.info('🔧 已禁用外键检查');

  // 删除所有表
  for (const tableName of tables) {
    logger.info(`🗑️ 删除表: ${tableName}`);
    await conn.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
  }

  // 重新启用外键检查
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  logger.info('🔧 已启用外键检查');

  logger.info(`✅ 已删除 ${tables.length} 个表`);
};

// 重置部署数据表（保持向后兼容）
const resetDeploymentData = async (): Promise<void> => {
  let conn;
  
  try {
    logger.info('🔧 重置部署数据...');

    conn = await connectDatabase();
    
    // 删除部署相关的表
    const deploymentTables = ['deployments', 'deployment_steps'];
    
    for (const tableName of deploymentTables) {
      logger.info(`🗑️ 删除表: ${tableName}`);
      await conn.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
    }

    // 重新创建部署相关的表
    logger.info('🔧 重新创建部署相关的表...');
    const initializeDatabase = (await import('./init-database')).default;
    await initializeDatabase();

    logger.info('✅ 部署数据重置完成');
  } catch (error) {
    logger.error('❌ 部署数据重置失败:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
};

// 清理测试数据（不删除表结构）
const cleanupTestData = async (): Promise<void> => {
  let conn;
  
  try {
    logger.info('🔧 清理测试数据...');

    conn = await connectDatabase();
    
    // 清理 deployments 表中的测试数据
    const [deploymentResult] = await conn.execute(`
      DELETE FROM deployments 
      WHERE project_name LIKE '%test%' 
         OR project_name LIKE '%demo%' 
         OR project_name LIKE '%example%'
         OR commit_hash LIKE '%test%'
         OR logs LIKE '%test%'
    `) as any;

    logger.info(`🗑️ 已删除 ${deploymentResult.affectedRows} 条测试部署数据`);

    // 清理 deployment_steps 表中的测试数据
    const [stepResult] = await conn.execute(`
      DELETE FROM deployment_steps 
      WHERE step_name LIKE '%test%' 
         OR step_name LIKE '%demo%' 
         OR step_name LIKE '%example%'
         OR logs LIKE '%test%'
    `) as any;

    logger.info(`🗑️ 已删除 ${stepResult.affectedRows} 条测试部署步骤数据`);

    // 清理 projects 表中的测试数据
    const [projectResult] = await conn.execute(`
      DELETE FROM projects 
      WHERE name LIKE '%test%' 
         OR name LIKE '%demo%' 
         OR name LIKE '%example%'
         OR description LIKE '%test%'
    `) as any;

    logger.info(`🗑️ 已删除 ${projectResult.affectedRows} 条测试项目数据`);

    // 清理孤立的部署步骤数据
    const [orphanedResult] = await conn.execute(`
      DELETE ds FROM deployment_steps ds
      LEFT JOIN deployments d ON ds.deployment_id = d.id
      WHERE d.id IS NULL
    `) as any;

    logger.info(`🗑️ 已删除 ${orphanedResult.affectedRows} 条孤立的部署步骤数据`);

    logger.info('✅ 测试数据清理完成');
  } catch (error) {
    logger.error('❌ 测试数据清理失败:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
};

// 获取数据库状态信息
const getDatabaseStatus = async (): Promise<any> => {
  let conn;
  
  try {
    conn = await connectDatabase();
    
    const status: any = {
      tables: {},
      totalRecords: 0
    };

    // 获取所有表的信息
    const [tables] = await conn.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `) as any;

    for (const table of tables) {
      const tableName = table.table_name;
      
      // 获取表的行数
      const [countResult] = await conn.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``) as any;
      const rowCount = countResult[0].count;
      
      status.tables[tableName] = {
        exists: true,
        rowCount: rowCount
      };
      
      status.totalRecords += rowCount;
    }

    return status;
  } catch (error) {
    logger.error('❌ 获取数据库状态失败:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case '--reset-all':
      resetDatabase()
        .then(() => {
          logger.info('✅ 数据库完全重置完成');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('❌ 数据库重置失败:', error);
          process.exit(1);
        });
      break;
      
    case '--reset-deployments':
      resetDeploymentData()
        .then(() => {
          logger.info('✅ 部署数据重置完成');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('❌ 部署数据重置失败:', error);
          process.exit(1);
        });
      break;
      
    case '--cleanup-test':
      cleanupTestData()
        .then(() => {
          logger.info('✅ 测试数据清理完成');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('❌ 测试数据清理失败:', error);
          process.exit(1);
        });
      break;
      
    case '--status':
      getDatabaseStatus()
        .then((status) => {
          logger.info('📊 数据库状态:');
          logger.info(JSON.stringify(status, null, 2));
          process.exit(0);
        })
        .catch((error) => {
          logger.error('❌ 获取数据库状态失败:', error);
          process.exit(1);
        });
      break;
      
    default:
      logger.info('📋 可用的命令:');
      logger.info('  --reset-all       完全重置数据库（删除所有表并重新创建）');
      logger.info('  --reset-deployments 重置部署相关数据');
      logger.info('  --cleanup-test    清理测试数据（保留表结构）');
      logger.info('  --status          显示数据库状态');
      process.exit(0);
  }
}

export {
  resetDatabase,
  resetDeploymentData,
  cleanupTestData,
  getDatabaseStatus
};
