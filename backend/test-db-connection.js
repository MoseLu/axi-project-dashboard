const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing MySQL connection...');
    
    // 测试基本连接
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '123456',
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectTimeout: 10000,
    });

    console.log('✅ Connected to MySQL server');

    // 测试查询
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);

    // 检查数据库是否存在
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📊 Available databases:', databases.map(db => db.Database));

    // 创建数据库（如果不存在）
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`project_dashboard\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✅ Database created/verified');

    // 切换到项目数据库
    await connection.execute('USE project_dashboard');
    console.log('✅ Switched to project_dashboard database');

    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        bio TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_uuid (uuid),
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Users table created/verified');

    // 插入测试用户
    await connection.execute(`
      INSERT IGNORE INTO users (uuid, username, email, password_hash, bio, is_active)
      VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'admin',
        'admin@axi-deploy.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'AXI Deploy Dashboard Administrator',
        TRUE
      )
    `);
    console.log('✅ Test user inserted');

    // 查询用户
    const [users] = await connection.execute('SELECT * FROM users');
    console.log('👥 Users in database:', users.length);

    await connection.end();
    console.log('✅ Database connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  }
}

testDatabaseConnection();
