import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs for auth routes
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per 15 min for general API
    message: { error: 'Too many requests. Please slow down and try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** Strict limiter for sensitive actions: password reset, OTP resend */
export const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: 'Too many attempts for this action. Please try again in 1 hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});
