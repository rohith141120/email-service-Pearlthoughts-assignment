
import { IEmailOptions } from './IEmailOptions';

export interface IEmailProvider {
  send(options: IEmailOptions): Promise<void>;
}
