import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Always log detailed technical error privately to server console
  console.error('[Server Technical Log]:', err);

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
    const messages = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      error: 'Data validation failed.',
      details: messages,
    });
    return;
  }

  // Database connectivity / disconnection errors
  const isDbConnectionError =
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoTimeoutError' ||
    err.name === 'MongoServerSelectionError' ||
    (err.name === 'MongooseError' && err.message?.includes('buffering timed out')) ||
    (typeof err.message === 'string' &&
      (err.message.includes('ECONNREFUSED') ||
        err.message.includes('buffering timed out') ||
        err.message.includes('Topology is closed') ||
        err.message.includes('connection timed out') ||
        err.message.includes('topology was destroyed') ||
        err.message.includes('failed to connect to server')));

  if (isDbConnectionError) {
    res.status(503).json({
      success: false,
      error: 'Unable to save your changes. Please try again.',
    });
    return;
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Protect backend info: Never leak connection strings, hostnames, stack traces, or credentials
  let publicMessage = err.message || 'An unexpected error occurred. Please try again.';

  if (statusCode >= 500) {
    if (
      /mongodb|mongoose|cluster|atlas|srv|replica|credential|password|database|econnrefused/i.test(
        publicMessage
      )
    ) {
      publicMessage = 'Unable to save your changes. Please try again.';
    }
  }

  res.status(statusCode).json({
    success: false,
    error: publicMessage,
  });
}
