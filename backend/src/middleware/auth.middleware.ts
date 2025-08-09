import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config';
import { ApiError } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// 为了避免类型冲突，创建一个泛型版本
export interface AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Access denied. No token provided.', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new ApiError('Access denied. No token provided.', 401);
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      req.user = decoded;
      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      throw new ApiError('Invalid token.', 401);
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      req.user = decoded;
    } catch (jwtError) {
      // Ignore invalid tokens in optional auth
      logger.debug('Optional auth: Invalid token ignored');
    }
  }
  
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError('Access denied. Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError('Access denied. Insufficient permissions.', 403);
    }

    next();
  };
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwt.secret);
};
