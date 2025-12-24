import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config/config';
import { User } from '@prisma/client';
import { UserService } from './user.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  static async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationName?: string
  ) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user and optionally an organization
    const { user, organization } = await UserService.createUser(
      email,
      password,
      firstName,
      lastName,
      organizationName
    );

    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    return {
      user: this.exclude(user, ['password']),
      tokens,
      organization
    };
  }

  static async login(email: string, password: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.exclude(user, ['password']),
      tokens,
    };
  }

  static async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret
      ) as { userId: string };

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      return await this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  private static async generateTokens(user: User): Promise<AuthTokens> {
    // Create JWT token
    const accessToken = jwt.sign(
      { userId: user.id },
      config.jwt.secret,
      { expiresIn: '30d' } // Default to 30 days if not set
    ) as string;

    // Create refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: '90d' } // Default to 90 days if not set
    ) as string;

    // Calculate token expiration in seconds
    const expiresIn = Math.floor(
      (new Date().getTime() + 
       (parseInt(config.jwt.expiresIn) * 1000)) / 1000
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  // Helper to exclude fields from user object
  private static exclude<User, Key extends keyof User>(
    user: User,
    keys: Key[]
  ): Omit<User, Key> {
    for (const key of keys) {
      delete user[key];
    }
    return user;
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  static async requestPasswordReset(email: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the email doesn't exist
      return;
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id },
      config.jwt.secret + user.password, // Include password in secret to invalidate when password changes
      { expiresIn: '1h' }
    );

    // In a real app, you would send an email with a reset link
    // For now, we'll just return the token
    return { resetToken };
  }

  static async resetPassword(token: string, newPassword: string) {
    try {
      // Find user by token
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('Invalid or expired token');
      }

      // Hash new password
      const hashedPassword = await hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { success: true };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export default AuthService;
