import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { sendEmail } from '../lib/email';

interface EmailJobData {
    to: string;
    subject: string;
    html: string;
}

// ── Build Redis connection lazily (only when REDIS_URL is present) ──────────
function getRedisConnection(): { host: string; port: number; password?: string; tls?: object } | null {
    const url = process.env.REDIS_URL;
    if (!url) return null;

    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379', 10),
            password: parsed.password || undefined,
            ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
        };
    } catch {
        console.error('[EmailQueue] Invalid REDIS_URL — falling back to direct email sending');
        return null;
    }
}

const connection = getRedisConnection();

let emailQueue: Queue<EmailJobData> | null = null;
let emailWorker: Worker<EmailJobData> | null = null;
let queueEvents: QueueEvents | null = null;

if (connection) {
    // ── Queue definition ───────────────────────────────────────────────────
    emailQueue = new Queue<EmailJobData>('email', {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }, // 5s, 10s, 20s
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
        },
    });

    // ── Worker definition ──────────────────────────────────────────────────
    emailWorker = new Worker<EmailJobData>(
        'email',
        async (job: Job<EmailJobData>) => {
            const { to, subject, html } = job.data;
            console.log(`[EmailQueue] Processing job ${job.id}: sending "${subject}" to ${to}`);
            await sendEmail({ to, subject, html });
            console.log(`[EmailQueue] Job ${job.id} completed successfully`);
        },
        {
            connection,
            concurrency: 5,
            limiter: { max: 20, duration: 60_000 }, // Max 20 emails/min
        }
    );

    emailWorker.on('completed', (job) => {
        console.log(`[EmailQueue] ✅ Job ${job.id} completed`);
    });

    emailWorker.on('failed', (job, err) => {
        console.error(`[EmailQueue] ❌ Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
    });

    emailWorker.on('error', (err) => {
        console.error('[EmailQueue] Worker error:', err);
    });

    queueEvents = new QueueEvents('email', { connection });

    console.log('✅ BullMQ email queue initialized with Redis');
} else {
    console.log('⚠️  No REDIS_URL — email queue disabled, using direct SMTP sending');
}

/**
 * Queue an email for delivery.
 * - When Redis is available: adds job to BullMQ queue (non-blocking, retryable)
 * - When Redis is not available: sends directly via SMTP (blocking, single attempt)
 */
export const queueEmail = async ({ to, subject, html }: EmailJobData): Promise<void> => {
    if (emailQueue) {
        await emailQueue.add('send', { to, subject, html });
    } else {
        // Fire-and-forget direct send when queue is unavailable
        setImmediate(async () => {
            try {
                await sendEmail({ to, subject, html });
            } catch (err: any) {
                console.error('[EmailQueue] Direct send failed:', err.message);
            }
        });
    }
};

export { emailQueue, emailWorker, queueEvents };
