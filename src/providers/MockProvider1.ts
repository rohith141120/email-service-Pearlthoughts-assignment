
import { IEmailProvider } from '../interfaces/IEmailProvider';
import { IEmailOptions } from '../interfaces/IEmailOptions';

export class MockProvider1 implements IEmailProvider {
  public async send(options: IEmailOptions): Promise<void> {
    // Simulate a random failure
    if (Math.random() > 0.5) {
      throw new Error('MockProvider1 failed to send email');
    }
    console.log(`Email sent to ${options.to} from MockProvider1`);
  }
}
