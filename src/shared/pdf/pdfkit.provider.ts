import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { IPdfProvider } from './pdf.interface';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PdfKitProvider implements IPdfProvider {
  constructor(private readonly logger: LoggerService) {}

  generatePdf(title: string, content: string, metadata: Record<string, any> = {}): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          this.logger.log(`PDF successfully generated: "${title}"`, 'PdfKitProvider');
          resolve(pdfBuffer);
        });

        // 1. Add Document Header/Branding
        doc.fillColor('#2c3e50')
           .fontSize(20)
           .text(title, { align: 'center' });
        
        doc.moveDown(1);
        
        // Horizontal line
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#bdc3c7')
           .stroke();
           
        doc.moveDown(2);

        // 2. Add Content
        doc.fillColor('#34495e')
           .fontSize(12)
           .text(content, {
             align: 'justify',
             lineGap: 4,
           });

        // 3. Add Metadata Metadata fields (if any)
        if (Object.keys(metadata).length > 0) {
          doc.moveDown(3);
          doc.moveTo(50, doc.y)
             .lineTo(545, doc.y)
             .strokeColor('#ecf0f1')
             .stroke();
          doc.moveDown(1);
          
          doc.fontSize(10).fillColor('#7f8c8d');
          for (const [key, value] of Object.entries(metadata)) {
            doc.text(`${key}: ${value}`);
          }
        }

        // 4. Footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8)
             .fillColor('#7f8c8d')
             .text(
               'Grehasoft Enterprise Portal - Official Document',
               50,
               doc.page.height - 50,
               { align: 'left' }
             );
        }

        doc.end();
      } catch (error) {
        this.logger.error(`Failed to generate PDF for "${title}"`, error.stack, 'PdfKitProvider');
        reject(error);
      }
    });
  }
}
