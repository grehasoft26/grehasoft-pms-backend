import { Global, Module } from '@nestjs/common';
import { PdfKitProvider } from './pdfkit.provider';
import { PDF_PROVIDER_TOKEN } from './pdf.interface';

@Global()
@Module({
  providers: [
    {
      provide: PDF_PROVIDER_TOKEN,
      useClass: PdfKitProvider,
    },
  ],
  exports: [PDF_PROVIDER_TOKEN],
})
export class PdfModule {}
