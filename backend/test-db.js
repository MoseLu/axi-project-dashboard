const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'project_dashboard',
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectTimeout: 10000,
    });

    console.log('✅ Database connection successful!');
    
    // 测试查询用户表
    const [users] = await connection.execute('SELECT * FROM users LIMIT 5');
    console.log('📊 Users found:', users.length);
    
    if (users.length > 0) {
      console.log('👤 First user:', {
        id: users[0].id,
        username: users[0].username,
        email: users[0].email,
        role: users[0].role,
        is_active: users[0].is_active,
        password_hash: users[0].password_hash
      });
    }
    
    await connection.end();
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 MySQL server is not running or not accessible');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Wrong username or password');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Database does not exist');
    }
  }
}

testDatabaseConnection();
