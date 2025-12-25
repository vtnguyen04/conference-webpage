
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(`[ERROR] ${_req.method} ${_req.path}:`, err);

    if (err instanceof ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({
            message: "Dữ liệu không hợp lệ",
            details: validationError.message
        });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Đã có lỗi hệ thống xảy ra";

    res.status(status).json({
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
