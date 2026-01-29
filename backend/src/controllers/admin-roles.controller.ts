
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { SystemRole } from '@prisma/client';

export const getRoles = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const adminUser = await prisma.user.findUnique({ where: { id: adminId } });

        if (!adminUser || adminUser.systemRole !== SystemRole.ADMIN) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const roles = await prisma.role.findMany({
            include: {
                _count: {
                    select: { members: true }
                },
                permissions: {
                    include: { permission: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(roles);
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllPermissions = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const adminUser = await prisma.user.findUnique({ where: { id: adminId } });

        if (!adminUser || adminUser.systemRole !== SystemRole.ADMIN) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const permissions = await prisma.permission.findMany({
            orderBy: { category: 'asc' }
        });

        // Group by category
        const grouped = permissions.reduce((acc: any, p) => {
            if (!acc[p.category]) acc[p.category] = [];
            acc[p.category].push(p);
            return acc;
        }, {});

        res.json(grouped);
    } catch (error) {
        console.error('Get all permissions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateRolePermissions = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const { id: roleId } = req.params;
        const { permissionIds } = req.body; // Array of permission strings

        const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
        if (!adminUser || adminUser.systemRole !== SystemRole.ADMIN) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role) {
            res.status(404).json({ error: 'Role not found' });
            return;
        }

        if (role.isSystem && role.name === 'ADMIN') {
            res.status(400).json({ error: 'Cannot modify System Admin permissions' });
            return;
        }

        // Transaction to sync permissions
        await prisma.$transaction(async (tx) => {
            // Delete existing
            await tx.rolePermission.deleteMany({
                where: { roleId }
            });

            // Create new
            if (permissionIds && permissionIds.length > 0) {
                await tx.rolePermission.createMany({
                    data: permissionIds.map((pId: string) => ({
                        roleId,
                        permissionId: pId
                    }))
                });
            }

            // Audit log
            await tx.adminAuditLog.create({
                data: {
                    action: 'ROLE_PERMISSIONS_UPDATED',
                    performedById: adminId,
                    entityType: 'ROLE',
                    entityId: roleId,
                    metadata: { permissionIds }
                } as any
            });
        });

        res.json({ message: 'Permissions updated successfully' });
    } catch (error) {
        console.error('Update role permissions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createRole = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const { name, description, organizationId } = req.body;

        const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
        if (!adminUser || adminUser.systemRole !== SystemRole.ADMIN) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const newRole = await prisma.role.create({
            data: {
                name,
                description,
                organizationId, // Required by schema
                createdById: adminId,
                isSystem: false
            }
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                action: 'ROLE_CREATED',
                performedById: adminId,
                entityType: 'ROLE',
                entityId: newRole.id,
                metadata: { name }
            } as any
        });

        res.json(newRole);
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
