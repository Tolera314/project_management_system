import { Request, Response } from 'express';
import { generateSecret, generateURI, TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import QRCode from 'qrcode';
import { z } from 'zod';
import prisma from '../lib/prisma';

const APP_NAME = process.env.APP_NAME || 'ProjectOS';

function createTOTPInstance(secret: string) {
    return new TOTP({
        secret,
        digits: 6,
        period: 30,
        crypto: new NobleCryptoPlugin(),
        base32: new ScureBase32Plugin(),
    });
}

const verifyCodeSchema = z.object({
    code: z.string().length(6, 'MFA code must be exactly 6 digits').regex(/^\d{6}$/, 'MFA code must be numeric'),
});

const disableSchema = z.object({
    code: z.string().length(6, 'MFA code must be exactly 6 digits').regex(/^\d{6}$/, 'MFA code must be numeric'),
    password: z.string().min(1, 'Password is required to disable MFA'),
});

/**
 * GET /auth/mfa/setup
 * Generates a new TOTP secret for the authenticated user and returns a QR code.
 */
export const setupMFA = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || (req as any).userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, mfaEnabled: true, mfaSecret: true },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.mfaEnabled) {
            res.status(400).json({ error: 'MFA is already enabled. Disable it first to reconfigure.' });
            return;
        }

        // Generate a new 20-byte base32 secret
        const secret = generateSecret();
        const otpAuthUrl = generateURI({
            issuer: APP_NAME,
            label: user.email,
            secret,
        });

        // Store the pending secret in user record
        await prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: secret },
        });

        const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
            width: 256,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
        });

        res.status(200).json({
            message: 'Scan the QR code with your authenticator app, then verify with a code to enable MFA.',
            secret,
            qrCode: qrCodeDataUrl,
        });
    } catch (error: any) {
        console.error('[MFA] Setup error:', error);
        res.status(500).json({ error: 'Failed to generate MFA setup. Please try again.' });
    }
};

/**
 * POST /auth/mfa/verify-setup
 * Verifies the TOTP code after setup to confirm the authenticator app is configured correctly.
 * Marks MFA as enabled on success.
 */
export const verifyMFASetup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || (req as any).userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const validation = verifyCodeSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { code } = validation.data;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { mfaSecret: true, mfaEnabled: true },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.mfaEnabled) {
            res.status(400).json({ error: 'MFA is already enabled' });
            return;
        }

        if (!user.mfaSecret) {
            res.status(400).json({ error: 'MFA setup not initiated. Please call /auth/mfa/setup first.' });
            return;
        }

        const totp = createTOTPInstance(user.mfaSecret);
        const result = await totp.verify(code);
        if (!result || !result.valid) {
            res.status(400).json({ error: 'Invalid MFA code. Please check your authenticator app and try again.' });
            return;
        }

        // Enable MFA — secret is already saved
        await prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true },
        });

        res.status(200).json({ message: 'MFA has been successfully enabled on your account.' });
    } catch (error: any) {
        console.error('[MFA] Verify setup error:', error);
        res.status(500).json({ error: 'Failed to verify MFA code. Please try again.' });
    }
};

/**
 * POST /auth/mfa/verify
 * Validates a TOTP code during login (called after credentials are verified).
 * Returns a final JWT token if the code is valid.
 */
export const verifyMFA = async (req: Request, res: Response) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            res.status(400).json({ error: 'User ID and MFA code are required' });
            return;
        }

        const validation = verifyCodeSchema.safeParse({ code });
        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, mfaEnabled: true, mfaSecret: true, status: true, tokenVersion: true },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Your account is not active. Please contact support.' });
            return;
        }

        if (!user.mfaEnabled || !user.mfaSecret) {
            res.status(400).json({ error: 'MFA is not enabled on this account' });
            return;
        }

        const totp = createTOTPInstance(user.mfaSecret);
        const result = await totp.verify(code);
        if (!result || !result.valid) {
            res.status(400).json({ error: 'Invalid MFA code. Code expires every 30 seconds — please try again with a fresh code.' });
            return;
        }

        // Issue final JWT
        const jwt = await import('jsonwebtoken');
        const token = jwt.default.sign(
            { userId: user.id, tokenVersion: user.tokenVersion },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        // Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        res.status(200).json({ message: 'MFA verification successful', token });
    } catch (error: any) {
        console.error('[MFA] Verify error:', error);
        res.status(500).json({ error: 'Failed to verify MFA code. Please try again.' });
    }
};

/**
 * DELETE /auth/mfa/disable
 * Disables MFA after verifying the current TOTP code and account password.
 */
export const disableMFA = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || (req as any).userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const validation = disableSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { code, password } = validation.data;

        const bcrypt = await import('bcrypt');
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { mfaEnabled: true, mfaSecret: true, password: true },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (!user.mfaEnabled) {
            res.status(400).json({ error: 'MFA is not currently enabled on this account' });
            return;
        }

        if (!user.password) {
            res.status(400).json({ error: 'Cannot disable MFA on an OAuth account without a password. Please set a password first.' });
            return;
        }

        const passwordValid = await bcrypt.default.compare(password, user.password);
        if (!passwordValid) {
            res.status(400).json({ error: 'Incorrect password' });
            return;
        }

        if (!user.mfaSecret) {
            res.status(500).json({ error: 'MFA configuration is corrupted. Please contact support.' });
            return;
        }

        const totp = createTOTPInstance(user.mfaSecret);
        const result = await totp.verify(code);
        if (!result || !result.valid) {
            res.status(400).json({ error: 'Invalid MFA code. Please check your authenticator app.' });
            return;
        }

        await prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: false, mfaSecret: null },
        });

        res.status(200).json({ message: 'MFA has been disabled. Your account will now use password-only authentication.' });
    } catch (error: any) {
        console.error('[MFA] Disable error:', error);
        res.status(500).json({ error: 'Failed to disable MFA. Please try again.' });
    }
};

/**
 * GET /auth/mfa/status
 * Returns the current MFA status for the authenticated user.
 */
export const getMFAStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || (req as any).userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { mfaEnabled: true },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({ mfaEnabled: user.mfaEnabled });
    } catch (error: any) {
        console.error('[MFA] Status error:', error);
        res.status(500).json({ error: 'Failed to retrieve MFA status' });
    }
};
