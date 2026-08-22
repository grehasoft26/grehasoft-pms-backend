export interface IMailProvider {
  sendMail(
    to: string,
    subject: string,
    htmlContent: string,
    attachments?: any[],
  ): Promise<void>;
}

export const MAIL_PROVIDER_TOKEN = 'MAIL_PROVIDER_TOKEN';
