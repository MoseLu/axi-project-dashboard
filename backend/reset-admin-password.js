const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    // 数据库连接配置
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'project_dashboard'
    });

    console.log('✅ 数据库连接成功');

    // 生成新的密码哈希
    const saltRounds = 12;
    const newPassword = 'admin123';
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新管理员密码
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [passwordHash, 'admin']
    );

    if (result.affectedRows > 0) {
      console.log('✅ 管理员密码重置成功');
      console.log('📋 新的登录信息:');
      console.log('   用户名: admin');
      console.log('   密码: admin123');
    } else {
      console.log('❌ 未找到 admin 用户，创建新用户');
      
      // 创建新的管理员用户
      await connection.execute(`
        INSERT INTO users (uuid, username, email, password_hash, role, is_active) 
        VALUES (UUID(), 'admin', 'admin@axi.com', ?, 'admin', TRUE)
      `, [passwordHash]);
      
      console.log('✅ 管理员用户创建成功');
      console.log('📋 登录信息:');
      console.log('   用户名: admin');
      console.log('   密码: admin123');
    }

    await connection.end();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 重置密码失败:', error);
  }
}

resetAdminPassword();
