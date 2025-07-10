
import { IEmailProvider } from '../interfaces/IEmailProvider';
import { IEmailOptions } from '../interfaces/IEmailOptions';

export class MockProvider2 implements IEmailProvider {
  public async send(options: IEmailOptions): Promise<void> {
    // This provider is more reliable
    console.log(`Email sent to ${options.to} from MockProvider2`);
    return Promise.resolve();
  }
}
