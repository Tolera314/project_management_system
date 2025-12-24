import { PrismaClient, Prisma } from '@prisma/client';
import { ServiceError } from '../lib/errors';

export class BaseService<T> {
  protected prisma: PrismaClient;
  protected model: keyof PrismaClient;

  constructor(model: keyof PrismaClient) {
    this.prisma = new PrismaClient();
    this.model = model;
  }

  async create(data: any): Promise<T> {
    try {
      return await (this.prisma[this.model] as any).create({ data });
    } catch (error) {
      throw new ServiceError('Failed to create record', 500, error);
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await (this.prisma[this.model] as any).findUnique({
        where: { id },
      });
    } catch (error) {
      throw new ServiceError('Failed to find record', 500, error);
    }
  }

  async findMany(where: any = {}): Promise<T[]> {
    try {
      return await (this.prisma[this.model] as any).findMany({
        where,
      });
    } catch (error) {
      throw new ServiceError('Failed to find records', 500, error);
    }
  }

  async update(id: string, data: any): Promise<T> {
    try {
      return await (this.prisma[this.model] as any).update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new ServiceError('Failed to update record', 500, error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await (this.prisma[this.model] as any).delete({
        where: { id },
      });
    } catch (error) {
      throw new ServiceError('Failed to delete record', 500, error);
    }
  }

  async count(where: any = {}): Promise<number> {
    try {
      return await (this.prisma[this.model] as any).count({ where });
    } catch (error) {
      throw new ServiceError('Failed to count records', 500, error);
    }
  }
}
