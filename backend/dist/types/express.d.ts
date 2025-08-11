import { Request, Response } from 'express';
import { ApiResponse } from './index';
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
export interface ApiController {
    [key: string]: (req: Request, res: Response) => Promise<void> | void;
}
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
export type MiddlewareFunction = (req: Request, res: Response, next: Function) => void | Promise<void>;
export interface AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    code?: string;
    details?: any;
}
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
export interface ApiResponseBuilder {
    success<T = any>(data?: T, message?: string): ApiResponse<T>;
    error(message: string, code?: string, statusCode?: number): ApiResponse;
    notFound(message?: string): ApiResponse;
    unauthorized(message?: string): ApiResponse;
    forbidden(message?: string): ApiResponse;
    badRequest(message?: string, errors?: ValidationError[]): ApiResponse;
    serverError(message?: string): ApiResponse;
}
export interface PaginatedRequest extends Request {
    pagination: {
        page: number;
        limit: number;
        offset: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    };
}
export interface FilteredRequest extends Request {
    filters: {
        [key: string]: any;
    };
}
export interface FileUploadRequest extends Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
}
//# sourceMappingURL=express.d.ts.map