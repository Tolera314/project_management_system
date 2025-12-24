import { PrismaClient, Prisma } from '@prisma/client';
import { ServiceError, NotFoundError, ForbiddenError } from './errors';

export abstract class BaseService<T, CreateInput, UpdateInput> {
  protected prisma: PrismaClient;
  protected model: keyof PrismaClient;

  constructor(prisma: PrismaClient, model: keyof PrismaClient) {
    this.prisma = prisma;
    this.model = model;
  }

  protected async findMany(args?: any): Promise<T[]> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.model].findMany(args);
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async findUnique(args: any): Promise<T | null> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.model].findUnique(args);
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async create(data: CreateInput): Promise<T> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.model].create({ data });
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async update(id: string, data: UpdateInput): Promise<T> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.model].update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async delete(id: string): Promise<T> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.model].delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  protected handleError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ServiceError('Unique constraint violation', 409);
        case 'P2025':
          throw new NotFoundError('Resource not found');
        case 'P2003':
          throw new ServiceError('Foreign key constraint failed', 400);
        default:
          console.error('Prisma error:', error);
          throw new ServiceError('Database error', 500);
      }
    }
    console.error('Unexpected error:', error);
    throw new ServiceError('Internal server error', 500);
  }
}

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}
