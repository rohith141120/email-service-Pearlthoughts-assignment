
import { IEmailProvider } from '../interfaces/IEmailProvider';
import { IEmailOptions } from '../interfaces/IEmailOptions';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export enum EmailStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
}

export class EmailService {
  private primaryProvider: IEmailProvider;
  private fallbackProvider: IEmailProvider;

  // Maps a clean UUID to its status
  private emailStatuses = new Map<string, EmailStatus>();
  // Maps the content hash to the clean UUID for idempotency
  private idempotencyMap = new Map<string, string>();

  private emailQueue: { id: string; options: IEmailOptions }[] = [];
  private readonly RATE_LIMIT_INTERVAL = 1000;
  private processingTimeout: NodeJS.Timeout | null = null;

  constructor(primaryProvider: IEmailProvider, fallbackProvider: IEmailProvider) {
    this.primaryProvider = primaryProvider;
    this.fallbackProvider = fallbackProvider;
  }

  public destroy() {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
  }

  private generateContentKey(options: IEmailOptions): string {
    // This key is for internal idempotency checks only
    return JSON.stringify(options);
  }

  public async sendEmail(options: IEmailOptions): Promise<string> {
    const contentKey = this.generateContentKey(options);

    // If we've seen this exact email content before, return the existing ID
    if (this.idempotencyMap.has(contentKey)) {
      const existingId = this.idempotencyMap.get(contentKey)!;
      logger.log(`Email is a duplicate. Returning existing ID: ${existingId}`);
      return existingId;
    }

    // This is a new email, so generate a new, clean ID
    const emailId = uuidv4();
    this.idempotencyMap.set(contentKey, emailId);
    this.emailStatuses.set(emailId, EmailStatus.Pending);
    this.emailQueue.push({ id: emailId, options });
    logger.log(`New email queued. ID: ${emailId}`);
    
    if (!this.processingTimeout) {
      this.scheduleProcessing();
    }
    
    return emailId;
  }

  public getEmailStatus(emailId: string): EmailStatus | undefined {
    return this.emailStatuses.get(emailId);
  }

  private scheduleProcessing() {
    this.processingTimeout = setTimeout(() => {
      this.processQueueItem();
    }, this.RATE_LIMIT_INTERVAL);
  }

  private async processQueueItem() {
    if (this.emailQueue.length === 0) {
      this.processingTimeout = null;
      return;
    }

    const { id, options } = this.emailQueue.shift()!;
    try {
      await this.trySendWithRetriesAndFallback(options);
      this.emailStatuses.set(id, EmailStatus.Sent);
      logger.log(`Email sent (id: ${id})`);
    } catch (error) {
      this.emailStatuses.set(id, EmailStatus.Failed);
      logger.error(`Email failed (id: ${id}):`, (error as Error).message);
    }

    if (this.emailQueue.length > 0) {
      this.scheduleProcessing();
    } else {
      this.processingTimeout = null;
    }
  }

  private async trySendWithRetriesAndFallback(options: IEmailOptions) {
    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
      try {
        logger.log(`Attempt ${attempt + 1} with primary provider...`);
        await this.primaryProvider.send(options);
        return;
      } catch (error) {
        logger.error(`Attempt ${attempt + 1} failed:`, (error as Error).message);
        attempt++;
        if (attempt < maxRetries) {
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        }
      }
    }

    logger.log('Primary failed. Trying fallback...');
    try {
      await this.fallbackProvider.send(options);
    } catch (fallbackError) {
      logger.error('Fallback failed:', (fallbackError as Error).message);
      throw new Error('Both providers failed');
    }
  }
}
