import { Global, Module } from '@nestjs/common';
import { SmtpMailProvider } from './smtp-mail.provider';
import { MAIL_PROVIDER_TOKEN } from './mail.interface';

@Global()
@Module({
  providers: [
    {
      provide: MAIL_PROVIDER_TOKEN,
      useClass: SmtpMailProvider,
    },
  ],
  exports: [MAIL_PROVIDER_TOKEN],
})
export class MailModule {}
