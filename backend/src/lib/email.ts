import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const defaultSender = `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`;

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
    try {
        const info = await transporter.sendMail({
            from: defaultSender,
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
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
                <a href="http://localhost:3000/dashboard" class="btn">Go to Dashboard</a>
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
