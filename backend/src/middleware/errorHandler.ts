import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: 'error'
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
      status: 'error'
    });
  }

  logger.error('Unhandled error:', err);

  return res.status(500).json({
    error: 'Internal server error',
    status: 'error'
  });
};