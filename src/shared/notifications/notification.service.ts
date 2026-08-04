import { Inject, Injectable } from '@nestjs/common';
import { MAIL_PROVIDER_TOKEN } from '../mail/mail.interface';
import type { IMailProvider } from '../mail/mail.interface';
import { INotificationPayload, NotificationChannel } from './notification.interface';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(MAIL_PROVIDER_TOKEN)
    private readonly mailProvider: IMailProvider,
    private readonly logger: LoggerService
  ) {}

  async send(notification: INotificationPayload): Promise<void> {
    const promises = notification.channels.map(async (channel) => {
      try {
        switch (channel) {
          case NotificationChannel.Email:
            if (notification.to.email) {
              const htmlContent = `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                  <h2>${notification.title}</h2>
                  <p>${notification.body}</p>
                </div>
              `;
              await this.mailProvider.sendMail(notification.to.email, notification.title, htmlContent);
            } else {
              this.logger.warn('Email channel selected but recipient email is missing', 'NotificationService');
            }
            break;
            
          case NotificationChannel.SMS:
            this.logger.log(`[SMS STUB] Sending to ${notification.to.phone}: ${notification.body}`, 'NotificationService');
            break;
            
          case NotificationChannel.Push:
            this.logger.log(`[PUSH STUB] Sending to device ${notification.to.deviceId}: ${notification.title}`, 'NotificationService');
            break;
            
          case NotificationChannel.WhatsApp:
            this.logger.log(`[WHATSAPP STUB] Sending to ${notification.to.phone}: ${notification.body}`, 'NotificationService');
            break;
            
          default:
            this.logger.warn(`Unsupported notification channel: ${channel}`, 'NotificationService');
        }
      } catch (error) {
        this.logger.error(`Failed to send notification via ${channel} to user`, error.stack, 'NotificationService');
      }
    });

    await Promise.all(promises);
  }
}
