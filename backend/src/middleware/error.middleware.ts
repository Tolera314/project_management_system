import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { config } from '../config/config';

interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: number;
  keyValue?: any;
  errors?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  // Handle specific error types
  if (error.name === 'JsonWebTokenError') {
    return handleJWTError(res);
  }
  if (error.name === 'TokenExpiredError') {
    return handleJWTExpiredError(res);
  }
  if (error.name === 'ValidationError') {
    return handleValidationError(error, res);
  }
  if (error.code === 'P2002') {
    return handleDuplicateFieldDB(error, res);
  }
  if (error.code === 'P2025' || error.name === 'NotFoundError') {
    return handleNotFoundError(error, res);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error 💥', error);
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Error handling functions
const handleJWTError = (res: Response) => {
  return res.status(401).json({
    status: 'error',
    message: 'Invalid token. Please log in again!',
  });
};

const handleJWTExpiredError = (res: Response) => {
  return res.status(401).json({
    status: 'error',
    message: 'Your token has expired! Please log in again.',
  });
};

const handleValidationError = (error: any, res: Response) => {
  const errors = Object.values(error.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return res.status(400).json({
    status: 'error',
    message,
  });
};

const handleDuplicateFieldDB = (error: any, res: Response) => {
  const value = error.meta?.target?.[0] || 'field';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return res.status(400).json({
    status: 'error',
    message,
  });
};

const handleNotFoundError = (error: any, res: Response) => {
  return res.status(404).json({
    status: 'error',
    message: error.message || 'The requested resource was not found.',
  });
};

const handlePrismaError = (error: any, res: Response) => {
  console.error('Prisma Error:', error);
  return res.status(400).json({
    status: 'error',
    message: 'Something went wrong with the database operation.',
  });
};

const sendErrorDev = (error: any, res: Response) => {
  res.status(error.statusCode || 500).json({
    status: error.status,
    error,
    message: error.message,
    stack: error.stack,
  });
};

const sendErrorProd = (error: any, res: Response) => {
  // Operational, trusted error: send message to client
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    // 1) Log error
    console.error('ERROR 💥', error);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
