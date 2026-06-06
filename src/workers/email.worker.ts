import { Worker, type Job } from 'bullmq';
import { getBullMQConnectionOptions } from '../config/bullmq.js';
import { sendEmail, emailContent } from '../utils/mail.js';
import logger from '../utils/logger.js';
import type { EmailJobData, EmailJobType } from '../queues/email.queue.js';

// ─── Job Processor ────────────────────────────────────────────────────────────

const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
  const { type, to, username, verificationLink, passwordResetLink } = job.data;

  logger.info(`[EmailWorker] Processing job ${job.id} — type: "${type}" → ${to}`);

  let subject: string;
  let content: ReturnType<typeof emailContent>;

  switch (type) {
    case 'welcome':
      subject = 'Verify Your Email';
      content = emailContent(username, 'welcome', verificationLink);
      break;

    case 'resend':
      subject = 'Verify Your Email (Resent)';
      content = emailContent(username, 'welcome', verificationLink);
      break;

    case 'forgot':
      subject = 'Reset Your Password';
      content = emailContent(username, 'forgot', undefined, passwordResetLink);
      break;

    default:
      throw new Error(`[EmailWorker] Unknown email job type: "${type}"`);
  }

  await sendEmail({ to, subject, mailgenContent: content });

  logger.info(`[EmailWorker] Job ${job.id} completed — email sent to ${to}`);
};

// ─── Worker ───────────────────────────────────────────────────────────────────

export const emailWorker = new Worker<EmailJobData, void, EmailJobType>(
  'email',
  processEmailJob,
  {
    connection: getBullMQConnectionOptions(),
    concurrency: 5,
  },
);

// ─── Event Handlers ───────────────────────────────────────────────────────────

emailWorker.on('completed', (job: Job<EmailJobData>) => {
  logger.info(`[EmailWorker] ✅ Job ${job.id} (${job.data.type}) completed`);
});

emailWorker.on('failed', (job: Job<EmailJobData> | undefined, err: Error) => {
  logger.error(
    `[EmailWorker] ❌ Job ${job?.id ?? 'unknown'} (${job?.data?.type ?? 'unknown'}) failed: ${err.message}`,
    { stack: err.stack, attempts: job?.attemptsMade },
  );
});

emailWorker.on('error', (err: Error) => {
  logger.error(`[EmailWorker] Worker error: ${err.message}`, { stack: err.stack });
});

logger.info('[EmailWorker] Email worker started and listening for jobs');
