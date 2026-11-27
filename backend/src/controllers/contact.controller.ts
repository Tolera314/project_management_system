import { Request, Response } from 'express';
import { z } from 'zod';
import { sendEmail } from '../lib/email';

const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message too long')
});

export const submitContactForm = async (req: Request, res: Response) => {
    try {
        const validation = contactSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { name, email, subject, message } = validation.data;

        // Send email to support team (fire-and-forget)
        setImmediate(async () => {
            try {
                await sendEmail({
                    to: process.env.SENDER_EMAIL || 'support@projectos.com',
                    subject: `Contact Form: ${subject}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
                            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                                <h2 style="color: #4F46E5; margin-bottom: 20px;">New Contact Form Submission</h2>
                                <p><strong>From:</strong> ${name} (${email})</p>
                                <p><strong>Subject:</strong> ${subject}</p>
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;">
                                <div style="background: #f9fafb; padding: 15px; border-radius: 5px;">
                                    <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                                </div>
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;">
                                <p style="color: #6b7280; font-size: 12px;">Sent from ProjectOS Contact Form</p>
                            </div>
                        </div>
                    `
                });

                // Send auto-reply to user
                await sendEmail({
                    to: email,
                    subject: 'We received your message - ProjectOS',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
                            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                                <h2 style="color: #4F46E5; margin-bottom: 20px;">Thanks for contacting us!</h2>
                                <p>Hi ${name},</p>
                                <p>We've received your message and our team will get back to you within 24-48 hours.</p>
                                <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                    <p style="margin: 0;"><strong>Your message:</strong></p>
                                    <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
                                </div>
                                <p>Best regards,<br>The ProjectOS Team</p>
                            </div>
                        </div>
                    `
                });
            } catch (error) {
                console.error('Failed to send contact form emails:', error);
            }
        });

        res.status(200).json({
            success: true,
            message: 'Thank you for contacting us! We\'ll get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to process your message. Please try again.' });
    }
};
