import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const createWorkspaceSchema = z.object({
    name: z.string().min(1, 'Workspace name is required').max(100, 'Name is too long'),
    type: z.enum(['personal', 'team', 'company']).optional(),
    color: z.string().optional(),
});

export const createWorkspace = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = createWorkspaceSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { name, type, color } = validation.data;

        const generateSlug = (s: string): string => {
            if (!s || typeof s !== 'string') {
                const randomStr = Math.random().toString(36).substring(2, 10);
                return `workspace-${randomStr}`;
            }
            
            // Generate a basic slug from the name
            let slug = s
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
            
            // If the slug is empty after processing (e.g., name was all special chars)
            if (!slug) {
                // Generate a random string as fallback
                const randomStr = Math.random().toString(36).substring(2, 10);
                return `workspace-${randomStr}`;
            }
            
            return slug;
        };

        // Generate slug and ensure it's not empty
        const slug = generateSlug(name);
        console.log(`[WorkspaceService] Generated slug: ${slug}`);

        // Check if user already has a workspace
        console.log(`[WorkspaceService] Checking membership for user: ${userId}`);
        const existingMembership = await prisma.organizationMember.findFirst({
            where: { userId },
            include: {
                organization: true,
                role: true
            }
        });

        if (existingMembership) {
            console.log(`[WorkspaceService] User ${userId} already has membership in organization: ${existingMembership.organizationId}. Returning existing workspace.`);
            res.status(200).json({
                message: 'You already have a workspace',
                workspace: {
                    id: existingMembership.organization.id,
                    name: existingMembership.organization.name,
                }
            });
            return;
        }

        console.log(`[WorkspaceService] Creating new workspace for user: ${userId}`);

        // Create workspace with admin role
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const organization = await tx.organization.create({
                data: {
                    name: (name || '').trim() || 'My Workspace',
                    slug: slug,
                    color: color || '#4F46E5', // Default color if none provided
                }
            });

            const adminRole = await tx.role.create({
                data: {
                    name: 'Admin',
                    organizationId: organization.id,
                    createdById: userId,
                    isSystem: true
                }
            });

            await tx.organizationMember.create({
                data: {
                    organizationId: organization.id,
                    userId,
                    roleId: adminRole.id
                }
            });

            return { organization, adminRole };
        }).catch((error: unknown) => {
            console.error('Transaction error:', error);
            throw error;
        });

        res.status(201).json({
            message: 'Workspace created successfully',
            workspace: {
                id: result.organization.id,
                name: result.organization.name,
                color: result.organization.color,
            }
        });

    } catch (error) {
        console.error('Create workspace error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserWorkspace = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        console.log(`[WorkspaceService] Getting workspace for user: ${userId}`);
        const membership = await prisma.organizationMember.findFirst({
            where: { userId },
            include: {
                organization: true,
                role: true
            }
        });

        if (!membership) {
            console.log(`[WorkspaceService] No workspace found for user: ${userId}`);
            res.status(200).json({ hasWorkspace: false });
            return;
        }

        console.log(`[WorkspaceService] Workspace found for user: ${userId} - Org: ${membership.organization.name}`);

        res.status(200).json({
            hasWorkspace: true,
            workspace: {
                id: membership.organization.id,
                name: membership.organization.name,
                color: membership.organization.color,
                role: membership.role.name
            }
        });

    } catch (error) {
        console.error('Get workspace error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
