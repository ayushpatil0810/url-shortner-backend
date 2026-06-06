import { Queue } from 'bullmq';
import { getBullMQConnectionOptions } from '../config/bullmq.js';

// ─── Job Types ────────────────────────────────────────────────────────────────

export type EmailJobType = 'welcome' | 'resend' | 'forgot';

export interface EmailJobData {
  /** Discriminates which email template to use */
  type: EmailJobType;
  /** Recipient email address */
  to: string;
  /** User's display name */
  username: string;
  /** Email verification link (required for 'welcome' and 'resend') */
  verificationLink?: string;
  /** Password reset link (required for 'forgot') */
  passwordResetLink?: string;
}

// ─── Queue ────────────────────────────────────────────────────────────────────

// Third generic (EmailJobType) lets TypeScript enforce valid job names on .add()
export const emailQueue = new Queue<EmailJobData, void, EmailJobType>('email', {
  connection: getBullMQConnectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s → 2s → 4s
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});
