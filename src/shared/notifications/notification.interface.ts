export enum NotificationChannel {
  Email = 'email',
  SMS = 'sms',
  Push = 'push',
  WhatsApp = 'whatsapp',
}

export interface INotificationPayload {
  to: {
    email?: string;
    phone?: string;
    deviceId?: string;
  };
  title: string;
  body: string;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
}

export abstract class NotificationBase {
  abstract getPayload(): INotificationPayload;
}
