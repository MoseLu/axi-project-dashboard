import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { ApiError } from '@/middleware/error.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { connectDatabase } from '@/database/connection';
import { upload, getFileUrl, deleteFile } from '@/utils/upload';

const router: Router = Router();

// 用户登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ApiError('用户名和密码不能为空', 400);
    }

    const conn = await connectDatabase();
    
    // 查询用户
    const [users] = await conn.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    ) as any;

    if (!users || users.length === 0) {
      throw new ApiError('用户名或密码错误', 401);
    }

    const user = users[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new ApiError('用户名或密码错误', 401);
    }

    // 检查用户是否激活
    if (!user.is_active) {
      throw new ApiError('账户已被禁用', 403);
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      },
      'your-super-secret-jwt-key',
      { expiresIn: '7d' }
    );

    // 更新最后登录时间
    await conn.execute(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    await conn.end();

    logger.info(`用户登录成功: ${user.username}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          role: user.role || 'user'
        }
      }
    });
  } catch (error) {
    logger.error('登录失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '登录失败，请稍后重试'
      });
    }
  }
});

// 用户注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      throw new ApiError('所有字段都是必填的', 400);
    }

    if (password !== confirmPassword) {
      throw new ApiError('两次输入的密码不一致', 400);
    }

    if (password.length < 6) {
      throw new ApiError('密码长度至少6位', 400);
    }

    const conn = await connectDatabase();

    // 检查用户名是否已存在
    const [existingUsers] = await conn.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    ) as any;

    if (existingUsers && existingUsers.length > 0) {
      throw new ApiError('用户名或邮箱已存在', 409);
    }

    // 加密密码
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const [result] = await conn.execute(
      `INSERT INTO users (uuid, username, email, password_hash, role, is_active) 
       VALUES (UUID(), ?, ?, ?, 'user', TRUE)`,
      [username, email, passwordHash]
    ) as any;

    await conn.end();

    logger.info(`新用户注册成功: ${username}`);

    res.status(201).json({
      success: true,
      message: '注册成功，请登录',
      data: {
        userId: result.insertId
      }
    });
  } catch (error) {
    logger.error('注册失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '注册失败，请稍后重试'
      });
    }
  }
});

// 验证token
router.get('/verify', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    res.json({
      success: true,
      message: 'Token有效',
      data: {
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Token验证失败:', error);
    res.status(401).json({
      success: false,
      message: 'Token无效'
    });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const conn = await connectDatabase();

    const [users] = await conn.execute(
      'SELECT id, uuid, username, email, avatar_url, bio, role, is_active, last_login_at, created_at FROM users WHERE id = ?',
      [user.id]
    ) as any;

    await conn.end();

    if (!users || users.length === 0) {
      throw new ApiError('用户不存在', 404);
    }

    const userData = users[0];

    res.json({
      success: true,
      message: '获取用户信息成功',
      data: {
        user: userData
      }
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }
});

// 退出登录
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  try {
    // 在实际应用中，这里可以将token加入黑名单
    // 目前简单返回成功，客户端删除token即可
    
    res.json({
      success: true,
      message: '退出登录成功'
    });
  } catch (error) {
    logger.error('退出登录失败:', error);
    res.status(500).json({
      success: false,
      message: '退出登录失败'
    });
  }
});

// 获取用户设置
router.get('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // 返回默认设置
    res.json({
      success: true,
      message: '获取设置成功',
      data: {
        notifications: {
          email_notifications: true,
          push_notifications: true,
          deployment_alerts: true,
          system_updates: true,
          marketing_emails: false
        },
        privacy: {
          profile_visibility: 'public',
          show_online_status: true,
          allow_friend_requests: true,
          data_collection: true
        },
        security: {
          two_factor_auth: false,
          login_notifications: true,
          session_timeout: 30,
          max_login_attempts: 5
        }
      }
    });
  } catch (error) {
    logger.error('获取设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败'
    });
  }
});

// 更新通知设置
router.put('/settings/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const settings = req.body;
    
    // 这里可以保存到数据库
    logger.info(`用户 ${user.username} 更新通知设置:`, settings);
    
    res.json({
      success: true,
      message: '通知设置已保存'
    });
  } catch (error) {
    logger.error('保存通知设置失败:', error);
    res.status(500).json({
      success: false,
      message: '保存通知设置失败'
    });
  }
});

// 更新隐私设置
router.put('/settings/privacy', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const settings = req.body;
    
    // 这里可以保存到数据库
    logger.info(`用户 ${user.username} 更新隐私设置:`, settings);
    
    res.json({
      success: true,
      message: '隐私设置已保存'
    });
  } catch (error) {
    logger.error('保存隐私设置失败:', error);
    res.status(500).json({
      success: false,
      message: '保存隐私设置失败'
    });
  }
});

// 更新安全设置
router.put('/settings/security', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const settings = req.body;
    
    // 这里可以保存到数据库
    logger.info(`用户 ${user.username} 更新安全设置:`, settings);
    
    res.json({
      success: true,
      message: '安全设置已保存'
    });
  } catch (error) {
    logger.error('保存安全设置失败:', error);
    res.status(500).json({
      success: false,
      message: '保存安全设置失败'
    });
  }
});

// 更新用户资料
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { email, bio } = req.body;
    
    const conn = await connectDatabase();
    
    await conn.execute(
      'UPDATE users SET email = ?, bio = ? WHERE id = ?',
      [email, bio, user.id]
    );
    
    // 获取更新后的用户信息
    const [users] = await conn.execute(
      'SELECT id, uuid, username, email, avatar_url, bio, role, is_active, last_login_at, created_at FROM users WHERE id = ?',
      [user.id]
    ) as any;
    
    await conn.end();
    
    if (!users || users.length === 0) {
      throw new ApiError('用户不存在', 404);
    }
    
    const updatedUser = users[0];
    
    res.json({
      success: true,
      message: '个人资料更新成功',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    logger.error('更新个人资料失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '更新个人资料失败'
      });
    }
  }
});

// 修改密码
router.put('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      throw new ApiError('当前密码和新密码不能为空', 400);
    }
    
    if (new_password.length < 6) {
      throw new ApiError('新密码长度至少6位', 400);
    }
    
    const conn = await connectDatabase();
    
    // 获取用户当前密码
    const [users] = await conn.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [user.id]
    ) as any;
    
    if (!users || users.length === 0) {
      throw new ApiError('用户不存在', 404);
    }
    
    // 验证当前密码
    const isValidPassword = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isValidPassword) {
      throw new ApiError('当前密码错误', 400);
    }
    
    // 加密新密码
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);
    
    // 更新密码
    await conn.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, user.id]
    );
    
    await conn.end();
    
    logger.info(`用户 ${user.username} 修改密码成功`);
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    logger.error('修改密码失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '修改密码失败'
      });
    }
  }
});

// 上传头像
router.post('/upload-avatar', authMiddleware, (req: Request, res: Response, next: any) => {
  upload.single('avatar')(req, res, (err: any) => {
    if (err) {
      logger.error('文件上传错误:', err);
      return res.status(400).json({
        success: false,
        message: '文件上传失败: ' + err.message
      });
    }
    next();
    return; // 确保回调函数有返回值
  });
  return; // 添加明确的返回值
}, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // 检查是否有文件上传错误
    if ((req as any).fileValidationError) {
      throw new ApiError((req as any).fileValidationError, 400);
    }
    
    if (!req.file) {
      throw new ApiError('请选择要上传的图片文件', 400);
    }
    
    // 获取文件URL
    const avatarUrl = getFileUrl(req.file.filename);
    
    const conn = await connectDatabase();
    
    // 获取用户当前头像
    const [users] = await conn.execute(
      'SELECT avatar_url FROM users WHERE id = ?',
      [user.id]
    ) as any;
    
    // 删除旧头像文件（如果存在且不是默认头像）
    if (users && users.length > 0 && users[0].avatar_url) {
      const oldAvatarUrl = users[0].avatar_url;
      if (oldAvatarUrl.includes('/uploads/avatars/')) {
        const oldFilename = oldAvatarUrl.split('/').pop();
        if (oldFilename) {
          deleteFile(oldFilename);
        }
      }
    }
    
    // 更新数据库中的头像URL
    await conn.execute(
      'UPDATE users SET avatar_url = ? WHERE id = ?',
      [avatarUrl, user.id]
    );
    
    await conn.end();
    
    logger.info(`用户 ${user.username} 上传头像成功: ${req.file.filename}`);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatar_url: avatarUrl
      }
    });
  } catch (error) {
    logger.error('上传头像失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '上传头像失败'
      });
    }
  }
});

export default router;
