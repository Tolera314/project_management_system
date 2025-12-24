import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { promisify } from 'util';
import config from '../config';
import { UnauthorizedError } from './errors';

const jwtSign = promisify(jwt.sign) as any;
const jwtVerify = promisify(jwt.verify) as any;

interface TokenPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  static async comparePasswords(
    candidatePassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async signToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>,
    expiresIn: string = config.jwt.expiresIn
  ): Promise<string> {
    return await jwtSign(
      { id: payload.id, email: payload.email },
      config.jwt.secret,
      { expiresIn }
    );
  }

  static async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return (await jwtVerify(token, config.jwt.secret)) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  static createSendToken(
    user: any,
    statusCode: number,
    res: any
  ) {
    const token = this.signToken({ id: user.id, email: user.email });
    
    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  }

  static restrictTo(...roles: string[]) {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new UnauthorizedError('You do not have permission to perform this action')
        );
      }
      next();
    };
  }

  static protect = async (req: any, res: any, next: any) => {
    try {
      // 1) Getting token and check if it's there
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return next(
          new UnauthorizedError('You are not logged in! Please log in to get access.')
        );
      }

      // 2) Verification token
      const decoded = await this.verifyToken(token);

      // 3) Check if user still exists
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!currentUser) {
        return next(
          new UnauthorizedError('The user belonging to this token no longer exists.')
        );
      }

      // 4) Check if user changed password after the token was issued
      if (currentUser.passwordChangedAt) {
        const changedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
        if (decoded.iat && decoded.iat < changedTimestamp) {
          return next(
            new UnauthorizedError('User recently changed password! Please log in again.')
          );
        }
      }

      // GRANT ACCESS TO PROTECTED ROUTE
      req.user = currentUser;
      res.locals.user = currentUser;
      next();
    } catch (error) {
      next(error);
    }
  };
}
