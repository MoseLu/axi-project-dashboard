import { Request, Response } from 'express';
import { User, ApiResponse } from './index';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      requestId?: string;
      startTime?: number;
      ipAddress?: string;
      userAgent?: string;
      correlationId?: string;
    }
  }
}

// API 控制器基础类型
export interface ApiController {
  [key: string]: (req: Request, res: Response) => Promise<void> | void;
}

// 请求验证类型
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

// 中间件类型
export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: Function
) => void | Promise<void>;

// 错误处理类型
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;
}

// 请求上下文类型
export interface RequestContext {
  userId?: string;
  userRole?: string;
  requestId: string;
  correlationId?: string;
  startTime: number;
  ipAddress: string;
  userAgent: string;
  path: string;
  method: string;
}

// API 响应辅助类型
export interface ApiResponseBuilder {
  success<T = any>(data?: T, message?: string): ApiResponse<T>;
  error(message: string, code?: string, statusCode?: number): ApiResponse;
  notFound(message?: string): ApiResponse;
  unauthorized(message?: string): ApiResponse;
  forbidden(message?: string): ApiResponse;
  badRequest(message?: string, errors?: ValidationError[]): ApiResponse;
  serverError(message?: string): ApiResponse;
}

// 分页请求类型
export interface PaginatedRequest extends Request {
  pagination: {
    page: number;
    limit: number;
    offset: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

// 过滤请求类型
export interface FilteredRequest extends Request {
  filters: {
    [key: string]: any;
  };
}

// 文件上传请求类型
export interface FileUploadRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}
