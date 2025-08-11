import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}
export declare const errorHandler: (error: AppError, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare class ApiError extends Error implements AppError {
    statusCode: number;
    status: string;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
//# sourceMappingURL=error.middleware.d.ts.map