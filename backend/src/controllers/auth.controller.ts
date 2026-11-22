
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { NotificationService } from '../services/notification.service';
import crypto from 'crypto';
import axios from 'axios';
import { sendEmail, getOTPVerificationTemplate } from '../lib/email';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

const generateOTP = (): string => {
    // Use crypto.randomInt for cryptographically secure OTP generation
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return otp;
};

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

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email'),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
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

        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Only create user, workspace will be created separately
        const user = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName: lastName || firstName,
                password: hashedPassword,
                otpCode,
                otpExpiresAt,
                isVerified: false,
                status: 'PENDING_VERIFICATION'
            }
        });

        // Send OTP Email via Brevo
        let emailSent = false;
        let emailError = null;

        try {
            console.log('[Auth] Attempting to send OTP email to:', user.email);
            console.log('[Auth] SMTP Config:', {
                server: process.env.SMTP_SERVER,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER ? '***configured***' : 'MISSING',
                from: process.env.SENDER_EMAIL
            });

            await sendEmail({
                to: user.email,
                subject: 'Verify your email - ProjectOS',
                html: getOTPVerificationTemplate(otpCode)
            });

            emailSent = true;
            console.log('[Auth] OTP email sent successfully to:', user.email);
        } catch (err: any) {
            emailError = err.message;
            console.error('[Auth] Failed to send OTP email:', {
                error: err.message,
                stack: err.stack,
                code: err.code,
                recipientEmail: user.email
            });
        }

        const token = jwt.sign({ userId: user.id, tokenVersion: 1 }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        res.status(201).json({
            message: emailSent
                ? 'User registered successfully. Please check your email for the verification code.'
                : 'User registered. Verification email could not be sent — please request a new code from the verification page.',
            token,
            emailSent,
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

        if (user.status === 'PENDING_VERIFICATION') {
            res.status(403).json({
                error: 'Account not verified. Please verify your email.',
                requiresVerification: true,
                email: user.email
            });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, tokenVersion: user.tokenVersion },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        // Update Last Login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Create Session
        await prisma.session.create({
            data: {
                userId: user.id,
                token: token,
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

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
                    role: om.role.name,
                    color: om.organization.color
                }))
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            await prisma.session.deleteMany({ where: { token } });
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const revokeAllSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        await prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } }
        });
        await prisma.session.deleteMany({ where: { userId } });
        res.json({ message: 'All sessions revoked' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(401).json({ error: 'Refresh token required' });
            return;
        }

        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!session || session.expiresAt < new Date()) {
            res.status(401).json({ error: 'Invalid or expired session' });
            return;
        }

        const newToken = jwt.sign({ userId: session.userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        await prisma.session.update({
            where: { id: session.id },
            data: {
                token: newToken,
                lastActive: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        res.json({ token: newToken });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const validation = forgotPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email: validation.data.email } });
        if (!user) {
            // Secretive success
            res.json({ message: 'If an account exists, a reset link has been sent.' });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Delete existing tokens
        await prisma.resetToken.deleteMany({ where: { userId: user.id } });

        // Create new token
        await prisma.resetToken.create({
            data: {
                token,
                expiresAt,
                userId: user.id
            }
        });

        // Send password reset email
        const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        try {
            const { sendEmail } = await import('../lib/email');
            await sendEmail({
                to: user.email,
                subject: 'Reset your password — ProjectOS',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            .header { background-color: #4F46E5; color: #ffffff; padding: 30px; text-align: center; }
                            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                            .content { padding: 40px 30px; }
                            .btn { display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
                            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header"><h1>Reset Your Password</h1></div>
                            <div class="content">
                                <p>Hello,</p>
                                <p>You requested a password reset for your ProjectOS account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
                                <div style="text-align: center;">
                                    <a href="${link}" class="btn">Reset Password</a>
                                </div>
                                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
                            </div>
                            <div class="footer">&copy; ${new Date().getFullYear()} ProjectOS. All rights reserved.</div>
                        </div>
                    </body>
                    </html>
                `
            });
        } catch (emailErr: any) {
            console.error('[Auth] Failed to send password reset email:', emailErr.message);
            // Still respond with success to prevent email enumeration
        }

        res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const validation = resetPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { token, newPassword } = validation.data;

        const resetToken = await prisma.resetToken.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        });

        if (!resetToken) {
            res.status(400).json({ error: 'Invalid or expired token' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: resetToken.userId },
            data: {
                password: hashedPassword,
                passwordVersion: { increment: 1 }
            }
        });

        // Delete used token
        await prisma.resetToken.delete({ where: { id: resetToken.id } });

        // Revoke all sessions
        await prisma.session.deleteMany({ where: { userId: resetToken.userId } });

        // Revoke tokens by incrementing version
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { tokenVersion: { increment: 1 } }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyMFA = async (req: Request, res: Response) => {
    // MFA via TOTP is a future enhancement — placeholder returns 501
    res.status(501).json({ error: 'MFA verification is not yet implemented.' });
};

export const getSession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                systemRole: true,
                mfaEnabled: true,
                organizationMembers: {
                    include: {
                        organization: true,
                        role: true
                    }
                }
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            user: {
                ...user,
                hasWorkspace: user.organizationMembers.length > 0,
                organizations: user.organizationMembers.map(om => ({
                    id: om.organization.id,
                    name: om.organization.name,
                    role: om.role.name,
                    color: om.organization.color
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const googleLogin = (req: Request, res: Response) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: `${backendUrl}/auth/google/callback`,
        response_type: 'code',
        scope: 'profile email',
        access_type: 'offline',
        prompt: 'consent'
    });

    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
};

export const googleCallback = async (req: Request, res: Response) => {
    try {
        const { code } = req.query;
        if (!code) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/login?error=Google login failed`);
            return;
        }

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        // Exchange code for tokens
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${backendUrl}/auth/google/callback`,
            grant_type: 'authorization_code'
        });

        const { access_token, id_token } = tokenRes.data;

        // Get User Info
        const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { email, given_name, family_name, picture, id: googleId } = userRes.data;

        // Find or Create User
        let user = await prisma.user.findUnique({
            where: { email },
            include: { organizationMembers: true }
        });

        if (!user) {
            // Create user with random password
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await prisma.user.create({
                data: {
                    email,
                    firstName: given_name || 'Google',
                    lastName: family_name || 'User',
                    password: hashedPassword,
                    avatarUrl: picture,
                    isVerified: true,       // Google accounts are pre-verified
                    status: 'ACTIVE',
                },
                include: { organizationMembers: true }
            });

            // Send welcome email logic here if desired
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.id, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        // Create Session
        await prisma.session.create({
            data: {
                userId: user.id,
                token: token,
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip as string, // Fixed req.toString() to req.ip
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            systemRole: user.systemRole,
            hasWorkspace: user.organizationMembers.length > 0
        }))}`);

    } catch (error) {
        console.error('Google Auth Error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?error=Google authentication failed`);
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { email, otpCode } = req.body;

        if (!email || !otpCode) {
            res.status(400).json({ error: 'Email and OTP code are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ error: 'User is already verified' });
            return;
        }

        if (user.otpCode !== otpCode.toUpperCase()) {
            res.status(400).json({ error: 'Invalid verification code' });
            return;
        }

        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            res.status(400).json({ error: 'Verification code has expired' });
            return;
        }

        // Activate user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                status: 'ACTIVE',
                otpCode: null,
                otpExpiresAt: null
            }
        });

        // Send Platform Welcome Email
        NotificationService.sendWelcomeEmail({ email: user.email, firstName: user.firstName });

        const token = jwt.sign({ userId: user.id, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Email verified successfully',
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
        console.error('[Auth] Verify OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resendOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ error: 'User is already verified' });
            return;
        }

        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: { otpCode, otpExpiresAt }
        });

        let emailSent = false;
        let emailError = null;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Your new verification code - ProjectOS',
                html: getOTPVerificationTemplate(otpCode)
            });
            emailSent = true;
        } catch (err: any) {
            emailError = err.message;
            console.error('[Auth] Resend OTP email failed:', err);
        }

        if (emailSent) {
            res.json({ message: 'New verification code sent', emailSent: true });
        } else {
            res.status(500).json({
                error: 'Failed to send verification email. Please try again later.',
                emailSent: false,
                emailError
            });
        }

    } catch (error) {
        console.error('[Auth] Resend OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

