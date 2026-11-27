import nodemailer from 'nodemailer';
import prisma from '../lib/prisma'; // Import prisma

// Helper to get transporter dynamically
const getTransporter = async () => {
    // Port 465 (SSL/TLS) is generally more reliable on Render/Cloud networks
    // We default to 465 even if the user provides 587, unless explicitly forced otherwise,
    // because 587 is frequently blocked or experiences timeouts on Render.
    const DEFAULT_PORT = 465;
    const DEFAULT_SECURE = true;

    // 1. Try to fetch settings from DB
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { group: 'EMAIL' }
        });

        const config: Record<string, string> = {};
        settings.forEach((s: any) => config[s.key] = s.value as string);

        if (config['SMTP_SERVER'] && config['SMTP_USER']) {
            let port = parseInt(config['SMTP_PORT'] || DEFAULT_PORT.toString());

            // If port is 587 but we're experiencing timeouts, force 465 for stability
            if (port === 587) {
                console.log('[Email] Port 587 detected, forcing 465 for better production stability on Render');
                port = 465;
            }

            const secure = port === 465;

            console.log(`[Email] Configuring SMTP: ${config['SMTP_SERVER']}:${port} (Secure: ${secure})`);

            return nodemailer.createTransport({
                host: config['SMTP_SERVER'],
                port,
                secure,
                auth: {
                    user: config['SMTP_USER'],
                    pass: config['SMTP_PASS'],
                },
                connectionTimeout: 15000,
                greetingTimeout: 15000,
                socketTimeout: 30000,
            });
        }
    } catch (e) {
        console.warn('Failed to fetch email settings from DB, falling back to ENV', e);
    }

    // 2. Fallback to ENV
    let envPort = parseInt(process.env.SMTP_PORT || DEFAULT_PORT.toString());

    // Force 465 if 587 is provided for fallback as well
    if (envPort === 587) {
        envPort = 465;
    }

    const envSecure = envPort === 465;

    console.log(`[Email] Configuring SMTP (ENV): ${process.env.SMTP_SERVER}:${envPort} (Secure: ${envSecure})`);

    return nodemailer.createTransport({
        host: process.env.SMTP_SERVER,
        port: envPort,
        secure: envSecure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
    });
};

const defaultSender = `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`;

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
    try {
        console.log('[Email] Creating transporter...');
        const transporter = await getTransporter();

        // Verify SMTP connection before sending
        try {
            await transporter.verify();
            console.log('[Email] SMTP connection verified successfully');
        } catch (verifyError: any) {
            console.error('[Email] SMTP verification failed:', {
                error: verifyError.message,
                code: verifyError.code,
                command: verifyError.command
            });
            throw new Error(`SMTP connection failed: ${verifyError.message}`);
        }

        // Get dynamic sender name if available
        let from = defaultSender;
        const fromName = await prisma.systemSetting.findUnique({ where: { group_key: { group: 'EMAIL', key: 'SENDER_NAME' } } });
        const fromEmail = await prisma.systemSetting.findUnique({ where: { group_key: { group: 'EMAIL', key: 'SENDER_EMAIL' } } });

        if (fromName && fromEmail) {
            from = `"${fromName.value}" <${fromEmail.value}>`;
        }

        console.log('[Email] Sending email:', { to, subject, from });
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
        });

        console.log('[Email] Message sent successfully:', {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
            response: info.response
        });

        return info;
    } catch (error: any) {
        console.error('[Email] Error sending email:', {
            error: error.message,
            stack: error.stack,
            code: error.code,
            to,
            subject
        });
        throw error;
    }
};

// --- Templates ---

export const getWelcomeEmailTemplate = (projectName: string, inviterName: string, role: string, link: string) => {
    return `
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
        <div class="header">
            <h1>You've been invited!</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong> as a <strong>${role}</strong>.</p>
            <p>Collaborate with your team, track tasks, and hit your milestones together.</p>
            <div style="text-align: center;">
                <a href="${link}" class="btn">Accept Invitation</a>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Project Management System. All rights reserved.
        </div>
    </div>
</body>
</html>
    `;
};

export const getPlatformWelcomeTemplate = (userName: string) => {
    return `
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
        <div class="header">
            <h1>Welcome to ProjectOS!</h1>
        </div>
        <div class="content">
            <p>Hello ${userName},</p>
            <p>We're thrilled to have you join our platform. ProjectOS is designed to help you manage your tasks, collaborate with your team, and achieve your goals more efficiently.</p>
            <p>Ready to get started? Create your first workspace and invite your team members.</p>
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">Go to Dashboard</a>
            </div>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Project Management System. All rights reserved.
        </div>
    </div>
</body>
</html>
    `;
};

export const getTaskAssignedEmailTemplate = (taskTitle: string, projectName: string, assignerName: string, link: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background-color: #10B981; color: #ffffff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .card { background-color: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #10B981; margin: 20px 0; }
        .btn { display: inline-block; background-color: #10B981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Task Assignment</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p><strong>${assignerName}</strong> has assigned you a new task in <strong>${projectName}</strong>.</p>
            <div class="card">
                <h3 style="margin-top: 0;">${taskTitle}</h3>
                <p style="margin-bottom: 0;">Check the task details for deadline and priority.</p>
            </div>
            <div style="text-align: center;">
                <a href="${link}" class="btn">View Task</a>
            </div>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Project Management System. All rights reserved.
        </div>
    </div>
</body>
</html>
    `;
};

export const getWorkspaceInvitationTemplate = (workspaceName: string, inviterName: string, roleName: string, invitationLink: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background-color: #7C3AED; color: #ffffff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .btn { display: inline-block; background-color: #7C3AED; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
        .info-box { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #7C3AED; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Workspace Invitation</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> as a <strong>${roleName}</strong>.</p>
            <div class="info-box">
                <p style="margin: 0;"><strong>Workspace:</strong> ${workspaceName}</p>
                <p style="margin: 8px 0 0 0;"><strong>Your Role:</strong> ${roleName}</p>
            </div>
            <p>Click the button below to accept your invitation:</p>
            <div style="text-align: center;">
                <a href="${invitationLink}" class="btn">Accept Invitation</a>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">This invitation link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Project Management System. All rights reserved.
        </div>
    </div>
</body>
</html>
    `;
};

export const getProjectInvitationTemplate = (projectName: string, inviterName: string, roleName: string, invitationLink: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background-color: #4F46E5; color: #ffffff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .btn { display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
        .info-box { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #4F46E5; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Project Invitation</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong> as a <strong>${roleName}</strong>.</p>
            <div class="info-box">
                <p style="margin: 0;"><strong>Project:</strong> ${projectName}</p>
                <p style="margin: 8px 0 0 0;"><strong>Your Role:</strong> ${roleName}</p>
            </div>
            <p>Click the button below to accept your invitation and start collaborating:</p>
            <div style="text-align: center;">
                <a href="${invitationLink}" class="btn">Accept Invitation</a>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">This invitation link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Project Management System. All rights reserved.
        </div>
    </div>
</body>
</html>
    `;
};
export const getOTPVerificationTemplate = (otpCode: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 40px 30px; text-align: center; }
        .otp-container { background-color: #f1f5f9; padding: 24px; border-radius: 12px; margin: 30px 0; border: 2px dashed #cbd5e1; }
        .otp-code { font-size: 48px; font-weight: 800; color: #4F46E5; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <p style="font-size: 16px; color: #475569;">Hello,</p>
            <p style="font-size: 16px; color: #475569;">To complete your signup, please use the following verification code:</p>
            <div class="otp-container">
                <span class="otp-code">${otpCode}</span>
            </div>
            <p style="font-size: 14px; color: #94a3b8;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} ProjectOS. Professional Project Management.
        </div>
    </div>
</body>
</html>
    `;
};
