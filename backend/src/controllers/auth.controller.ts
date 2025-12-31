
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';

const registerSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response) => {
    try {
        console.log('[Auth] Register request body:', req.body);
        const { fullName, email, password } = req.body;

        if (!fullName) {
            res.status(400).json({ error: 'Full name is required' });
            return;
        }

        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || firstName;

        const validation = registerSchema.safeParse({
            firstName,
            lastName,
            email,
            password,
        });

        
        if (!validation.success) {
            console.warn('[Auth] Validation failed:', validation.error.issues[0].message);
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Only create user, workspace will be created separately
        const user = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName: lastName || firstName,
                password: hashedPassword,
            }
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                systemRole: user.systemRole,
                hasWorkspace: false
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const validation = loginSchema.safeParse({ email, password });

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                organizationMembers: {
                    include: {
                        organization: true,
                        role: true
                    }
                }
            }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                systemRole: user.systemRole,
                hasWorkspace: user.organizationMembers.length > 0,
                organizations: user.organizationMembers.map(om => ({
                    id: om.organization.id,
                    name: om.organization.name,
                    role: om.role.name
                }))
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
