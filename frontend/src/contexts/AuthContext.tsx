import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { api } from '../utils/api';

export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: string;
  bio?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // 验证token
  const verifyToken = async (): Promise<boolean> => {
    if (!token) {
      setIsLoading(false);
      return false;
    }

    try {
      const data = await api.get('/auth/verify');
      if (data.success && data.data.user) {
        setUser(data.data.user);
        setIsLoading(false);
        return true;
      } else {
        throw new Error('Token验证响应格式错误');
      }
    } catch (error) {
      console.error('Token验证失败:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  // 登录
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const data = await api.post('/auth/login', credentials, { requireAuth: false });

      if (data.success) {
        const { token: newToken, user: userData } = data.data;
        
        // 保存token和用户信息
        localStorage.setItem('auth_token', newToken);
        setToken(newToken);
        setUser(userData);
        
        message.success('登录成功');
        setIsLoading(false);
        return true;
      } else {
        message.error(data.message || '登录失败');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请检查网络连接');
      setIsLoading(false);
      return false;
    }
  };

  // 注册
  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const data = await api.post('/auth/register', credentials, { requireAuth: false });

      if (data.success) {
        message.success('注册成功，请登录');
        setIsLoading(false);
        return true;
      } else {
        message.error(data.message || '注册失败');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('注册失败:', error);
      message.error('注册失败，请检查网络连接');
      setIsLoading(false);
      return false;
    }
  };

  // 退出登录
  const logout = async () => {
    try {
      if (token) {
        // 调用后端退出接口
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      // 清除本地存储
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      message.success('已退出登录');
    }
  };

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // 初始化时验证token
  useEffect(() => {
    verifyToken();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    verifyToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
