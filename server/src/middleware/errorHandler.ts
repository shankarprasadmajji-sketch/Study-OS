import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: `An account or record with that ${field} already exists.`,
    });
    return;
  }

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: `Invalid identifier provided for ${err.path}.`,
    });
    return;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      error: 'Data validation failed.',
      details: messages,
    });
    return;
  }

  if (config.nodeEnv !== 'production') {
    console.error('[Error Details]:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An internal server error occurred.',
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
}
