import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailProvider } from './mail.interface';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class SmtpMailProvider implements IMailProvider, OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>('app.smtp.host');
    const port = this.configService.get<number>('app.smtp.port');
    const user = this.configService.get<string>('app.smtp.user');
    const pass = this.configService.get<string>('app.smtp.pass');
    const isDev =
      this.configService.get<string>('app.nodeEnv') === 'development';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // True for 465, false for others
      auth: {
        user,
        pass,
      },
    });

    // Verify SMTP connection pool on startup (optional warning in development)
    this.transporter.verify((error) => {
      if (error) {
        if (isDev) {
          this.logger.warn(
            `SMTP Mail Server is unavailable. Emails will not send during development. Error: ${error.message}`,
            'SMTPMailProvider',
          );
        } else {
          this.logger.error(
            'SMTP Mail Server verification failed',
            error.stack,
            'SMTPMailProvider',
          );
        }
      } else {
        this.logger.log(
          'SMTP Mail Server initialized and ready to send emails',
          'SMTPMailProvider',
        );
      }
    });
  }

  async sendMail(
    to: string,
    subject: string,
    htmlContent: string,
    attachments?: any[],
  ): Promise<void> {
    const fromAddress =
      this.configService.get<string>('app.smtp.from') ||
      'noreply@grehasoft.com';

    try {
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html: htmlContent,
        attachments,
      });

      this.logger.log(
        `Email successfully sent to ${to}. MessageId: ${info.messageId}`,
        'SMTPMailProvider',
      );

      // Log to audit log
      this.logger.audit('system', 'Send Email', to, {
        subject,
        messageId: info.messageId,
      });
    } catch (error) {
      this.logger.error(
        `Error sending email to ${to} for subject "${subject}"`,
        error.stack,
        'SMTPMailProvider',
      );
      throw error;
    }
  }
}
