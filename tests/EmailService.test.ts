import { EmailService, EmailStatus } from '../src/services/EmailService';
import { IEmailProvider } from '../src/interfaces/IEmailProvider';
import { IEmailOptions } from '../src/interfaces/IEmailOptions';

// Mock providers
const mockPrimaryProvider: IEmailProvider = {
  send: jest.fn(),
};

const mockFallbackProvider: IEmailProvider = {
  send: jest.fn(),
};

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    emailService = new EmailService(mockPrimaryProvider, mockFallbackProvider);
  });

  afterEach(() => {
    emailService.destroy();
    jest.useRealTimers();
  });

  it('should send an email with the primary provider', async () => {
    const emailOptions: IEmailOptions = { to: 'test@example.com', from: 'test@test.com', subject: 'test', body: 'test' };
    (mockPrimaryProvider.send as jest.Mock).mockResolvedValue(undefined);

    const emailId = await emailService.sendEmail(emailOptions);
    
    // Wait for the queue to process
    await jest.advanceTimersByTimeAsync(1000);

    expect(mockPrimaryProvider.send).toHaveBeenCalledWith(emailOptions);
    expect(mockFallbackProvider.send).not.toHaveBeenCalled();
    expect(emailService.getEmailStatus(emailId)).toBe(EmailStatus.Sent);
  });

  it('should use the fallback provider if the primary provider fails', async () => {
    const emailOptions: IEmailOptions = { to: 'test@example.com', from: 'test@test.com', subject: 'test', body: 'test' };
    (mockPrimaryProvider.send as jest.Mock).mockRejectedValue(new Error('Primary provider failed'));
    (mockFallbackProvider.send as jest.Mock).mockResolvedValue(undefined);

    const emailId = await emailService.sendEmail(emailOptions);

    // Advance time enough for all retries and the fallback to complete
    await jest.advanceTimersByTimeAsync(8000);

    expect(mockPrimaryProvider.send).toHaveBeenCalledTimes(3);
    expect(mockFallbackProvider.send).toHaveBeenCalledWith(emailOptions);
    expect(emailService.getEmailStatus(emailId)).toBe(EmailStatus.Sent);
  });

  it('should fail if both providers fail', async () => {
    const emailOptions: IEmailOptions = { to: 'test@example.com', from: 'test@test.com', subject: 'test', body: 'test' };
    (mockPrimaryProvider.send as jest.Mock).mockRejectedValue(new Error('Primary provider failed'));
    (mockFallbackProvider.send as jest.Mock).mockRejectedValue(new Error('Fallback provider failed'));

    const emailId = await emailService.sendEmail(emailOptions);

    // Advance time enough for all retries and the fallback to complete
    await jest.advanceTimersByTimeAsync(8000);

    expect(mockPrimaryProvider.send).toHaveBeenCalledTimes(3);
    expect(mockFallbackProvider.send).toHaveBeenCalledTimes(1);
    expect(emailService.getEmailStatus(emailId)).toBe(EmailStatus.Failed);
  });

  it('should not send the same email twice (idempotency)', async () => {
    const emailOptions: IEmailOptions = { to: 'test@example.com', from: 'test@test.com', subject: 'test', body: 'test' };
    (mockPrimaryProvider.send as jest.Mock).mockResolvedValue(undefined);

    // Send the same email twice
    await emailService.sendEmail(emailOptions);
    await emailService.sendEmail(emailOptions);

    // Advance time to process the queue
    await jest.advanceTimersByTimeAsync(1000);

    // The provider should only have been called once
    expect(mockPrimaryProvider.send).toHaveBeenCalledTimes(1);
  });
});