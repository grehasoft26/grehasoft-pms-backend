import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { IPdfProvider } from './pdf.interface';
import { LoggerService } from '../logger/logger.service';
import * as path from 'path';
import * as fs from 'fs';

const THEMES: Record<
  string,
  { primary: string; secondary: string; accent: string; bg_card?: string }
> = {
  corporate: { primary: '#0753F6', secondary: '#6B7280', accent: '#1AB728' },
  modern: { primary: '#0f172a', secondary: '#3b82f6', accent: '#10b981' },
  enterprise: { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#047857' },
  minimal: { primary: '#000000', secondary: '#4b5563', accent: '#1f2937' },
  classic: { primary: '#701a75', secondary: '#a21caf', accent: '#b5179e' },
};

@Injectable()
export class PdfKitProvider implements IPdfProvider {
  constructor(private readonly logger: LoggerService) {}

  generatePdf(
    title: string,
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Simple internal image-size parser for PNG and JPEG
        const getImageSize = (filePath: string): { width: number; height: number } => {
          try {
            if (!fs.existsSync(filePath)) return { width: 595, height: 100 };
            const buffer = fs.readFileSync(filePath);
            // PNG check
            if (buffer.toString('ascii', 1, 4) === 'PNG') {
              const width = buffer.readUInt32BE(16);
              const height = buffer.readUInt32BE(20);
              return { width, height };
            }
            // JPEG check
            if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
              let offset = 2;
              while (offset < buffer.length) {
                const marker = buffer.readUInt16BE(offset);
                offset += 2;
                if (marker === 0xFFC0 || marker === 0xFFC2) {
                  offset += 3;
                  const height = buffer.readUInt16BE(offset);
                  offset += 2;
                  const width = buffer.readUInt16BE(offset);
                  return { width, height };
                }
                const length = buffer.readUInt16BE(offset);
                offset += length;
              }
            }
          } catch (e) {
            // silent catch
          }
          return { width: 595, height: 100 };
        };

        // Simple tokenizer to break rich HTML text into styled chunks
        const parseHtml = (htmlText: string) => {
          if (!htmlText) return [];
          const tagRegex = /(<\/?[a-zA-Z0-9]+(?:\s+[a-zA-Z0-9]+(?:="[^"]*")*)*\s*\/?>)/g;
          const parts = htmlText.split(tagRegex);
          const result: any[] = [];
          let isBold = false;
          let isItalic = false;
          let isUnderline = false;

          for (const part of parts) {
            if (!part) continue;
            if (tagRegex.test(part)) {
              const lowerTag = part.toLowerCase();
              if (lowerTag === '<b>' || lowerTag === '<strong>') {
                isBold = true;
              } else if (lowerTag === '</b>' || lowerTag === '</strong>') {
                isBold = false;
              } else if (lowerTag === '<i>' || lowerTag === '<em>') {
                isItalic = true;
              } else if (lowerTag === '</i>' || lowerTag === '</em>') {
                isItalic = false;
              } else if (lowerTag === '<u>') {
                isUnderline = true;
              } else if (lowerTag === '</u>') {
                isUnderline = false;
              } else if (lowerTag === '<p>') {
                result.push({ text: '', isNewParagraph: true });
              } else if (lowerTag === '</p>') {
                result.push({ text: '', isLineBreak: true });
              } else if (lowerTag === '<li>') {
                result.push({ text: '', isBullet: true });
              } else if (lowerTag === '</li>') {
                result.push({ text: '', isLineBreak: true });
              } else if (lowerTag === '<br>' || lowerTag === '<br/>' || lowerTag === '<br />') {
                result.push({ text: '', isLineBreak: true });
              }
            } else {
              const cleanText = part
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, ' ');
              result.push({
                text: cleanText,
                bold: isBold,
                italic: isItalic,
                underline: isUnderline,
              });
            }
          }
          return result;
        };

        const writeFormattedText = (pdfDoc: any, html: string, defaultFontSize = 10, defaultColor = '#2d3748') => {
          const tokens = parseHtml(html);
          pdfDoc.fontSize(defaultFontSize).fillColor(defaultColor);

          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const isLast = i === tokens.length - 1;

            if (token.isNewParagraph) {
              pdfDoc.moveDown(0.6);
              continue;
            }
            if (token.isLineBreak) {
              pdfDoc.text('\n', { continued: false });
              continue;
            }
            if (token.isBullet) {
              pdfDoc.moveDown(0.2);
              pdfDoc.text('  • ', { continued: true });
              continue;
            }

            if (token.text) {
              let font = 'Helvetica';
              if (token.bold && token.italic) {
                font = 'Helvetica-BoldOblique';
              } else if (token.bold) {
                font = 'Helvetica-Bold';
              } else if (token.italic) {
                font = 'Helvetica-Oblique';
              }

              pdfDoc.font(font);

              const nextToken = tokens[i + 1];
              const nextIsBreak = nextToken && (nextToken.isLineBreak || nextToken.isNewParagraph || nextToken.isBullet);
              const shouldContinue = !isLast && !nextIsBreak;

              pdfDoc.text(token.text, {
                continued: shouldContinue,
                underline: token.underline,
              });
            }
          }
          pdfDoc.font('Helvetica');
          pdfDoc.text('', { continued: false });
        };

        // Determine absolute paths for images
        const assetsDir = path.join(__dirname, '..', '..', 'assets');
        const logoPath = path.join(assetsDir, 'grehasoftlogo.png');
        const watermarkPath = path.join(assetsDir, 'grehasoftwatermark.png');
        const headerPath = path.join(assetsDir, 'invoice_header.png');

        console.log('[PDF PREVIEW] Loading assets');
        console.log('[PDF PREVIEW] Logo path:', logoPath, 'Exists:', fs.existsSync(logoPath));
        console.log('[PDF PREVIEW] Watermark path:', watermarkPath, 'Exists:', fs.existsSync(watermarkPath));
        console.log('[PDF PREVIEW] Header path:', headerPath, 'Exists:', fs.existsSync(headerPath));

        const config = metadata.builderConfig || {};
        const layout = config.layout || {};

        // Custom margin geometry inputs
        const leftM = layout.leftMargin ?? 50;
        const rightM = layout.rightMargin ?? 50;
        const topM = layout.topMargin ?? 50;
        const bottomM = layout.bottomMargin ?? 50;
        console.log('[PDF PREVIEW] Creating PDF document');
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            left: leftM,
            right: rightM,
            top: topM,
            bottom: bottomM,
          },
          bufferPages: true,
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          console.log('[PDF PREVIEW] PDF generation completed');
          console.log('[PDF PREVIEW] Buffer size:', pdfBuffer.length);
          this.logger.log(
            `PDF successfully generated: "${title}"`,
            'PdfKitProvider',
          );
          resolve(pdfBuffer);
        });

        // Branding assets parameters
        const showWatermark = config.branding?.watermark?.enabled ?? true;
        const showHeader = config.branding?.header?.enabled ?? true;
        const showLogo = config.branding?.logo?.enabled ?? true;

        const watermarkOpacitySetting = (config.branding?.watermark?.opacity ?? 15) / 100;
        const watermarkScaleSetting = (config.branding?.watermark?.size ?? 65) / 100;
        const coverLogoWidth = config.branding?.logo?.width ?? 280;

        // Proportional Watermark Drawing
        const drawWatermark = (pdfDoc: any) => {
          if (showWatermark && fs.existsSync(watermarkPath)) {
            const size = getImageSize(watermarkPath);
            const ratio = size.height / size.width;

            let wWidth = 595 * watermarkScaleSetting;
            let wHeight = wWidth * ratio;

            // Enforce max 65% height boundaries
            if (wHeight > 842 * watermarkScaleSetting) {
              wHeight = 842 * watermarkScaleSetting;
              wWidth = wHeight / ratio;
            }

            pdfDoc.save();
            pdfDoc.opacity(watermarkOpacitySetting);
            pdfDoc.image(
              watermarkPath,
              (595 - wWidth) / 2,
              (842 - wHeight) / 2,
              {
                width: wWidth,
                height: wHeight,
              },
            );
            pdfDoc.restore();
          }
        };

        // Subpage Header Banner and Top Margins
        const getHeaderHeight = (): number => {
          if (showHeader && fs.existsSync(headerPath)) {
            const size = getImageSize(headerPath);
            return 595 * (size.height / size.width);
          }
          return 0;
        };

        const headerHeight = getHeaderHeight();
        const subpageTopMargin = headerHeight > 0 ? headerHeight + 25 : topM;

        const drawHeaderBanner = (pdfDoc: any) => {
          if (showHeader && fs.existsSync(headerPath)) {
            pdfDoc.image(headerPath, 0, 0, { width: 595 });
          }
        };

        // If no builderConfig, use standard simple PDF rendering
        if (!metadata.builderConfig) {
          drawWatermark(doc);
          doc
            .fillColor('#2c3e50')
            .fontSize(20)
            .text(title, { align: 'center' });
          doc.moveDown(1);
          doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .strokeColor('#bdc3c7')
            .stroke();
          doc.moveDown(2);

          doc.fillColor('#34495e').fontSize(12).text(content, {
            align: 'justify',
            lineGap: 4,
          });

          if (Object.keys(metadata).length > 0) {
            doc.moveDown(3);
            doc
              .moveTo(50, doc.y)
              .lineTo(545, doc.y)
              .strokeColor('#ecf0f1')
              .stroke();
            doc.moveDown(1);
            doc.fontSize(10).fillColor('#7f8c8d');
            for (const [key, value] of Object.entries(metadata)) {
              if (typeof value === 'string' || typeof value === 'number') {
                doc.text(`${key}: ${value}`);
              }
            }
          }

          doc.on('pageAdded', () => {
            drawWatermark(doc);
          });

          doc.end();
          return;
        }

        // --- Visual Proposal Builder Config PDF Layout ---
        const themeName = config.template || 'corporate';
        const colors = THEMES[themeName] || THEMES.corporate;

        if (config.colors?.primary) colors.primary = config.colors.primary;
        if (config.colors?.secondary) colors.secondary = config.colors.secondary;
        if (config.colors?.bg_card) colors.bg_card = config.colors.bg_card;

        // Cover Page prepared-for/by details
        const cover = config.cover_page || {};
        const clientName = cover.preparedForName || metadata.client?.name || 'Valued Client';
        const clientCompany = cover.preparedForCompany || metadata.client?.companyName || 'Client Company';
        const byCompany = cover.preparedByCompany || 'Grehasoft Smart IT Solutions';
        const byAddress = cover.preparedByAddress || 'Kochi, Kerala';
        const byEmail = cover.preparedByEmail || 'info@grehasoft.com';
        const byWebsite = cover.preparedByWebsite || 'www.grehasoft.com';
        const docDate = cover.proposalDate || new Date().toLocaleDateString('en-GB');
        const docPlace = cover.place || 'Kochi';

        // Setup hook for subsequent pages background
        doc.on('pageAdded', () => {
          drawWatermark(doc);
          drawHeaderBanner(doc);
          doc.y = subpageTopMargin;
        });

        // Dynamic sections ordering checklist loop
        const rawSections = config.sections || [
          'cover',
          'cover_letter',
          'project_overview',
          'scope_of_work',
          'website_structure',
          'deliverables',
          'pricing',
          'additional_charges',
          'maintenance_cost',
          'terms_conditions',
        ];
        const activeSections = rawSections.map((s: any, idx: number) => {
          if (typeof s === 'string') {
            return { key: s, enabled: true, order: idx };
          }
          return {
            key: s.key,
            enabled: s.enabled !== false,
            order: s.order ?? idx
          };
        }).filter((s: any) => s.enabled)
          .sort((a: any, b: any) => a.order - b.order)
          .map((s: any) => s.key);

        let isFirstPage = true;

        console.log('[PDF PREVIEW] Rendering sections:', activeSections);
        for (const sectionId of activeSections) {
          console.log('[PDF PREVIEW] Rendering section:', sectionId);
          if (!isFirstPage) {
            doc.addPage();
          }
          isFirstPage = false;

          if (sectionId === 'cover') {
            // Render 1. Cover Page
            drawWatermark(doc);
            if (showLogo && fs.existsSync(logoPath)) {
              doc.image(logoPath, (595 - coverLogoWidth) / 2, 80, { width: coverLogoWidth });
              doc.moveDown(12);
            } else {
              doc.moveDown(6);
            }

            const coverTitle = cover.title || title || 'Project Proposal';
            doc
              .fillColor(colors.primary)
              .fontSize(32)
              .text(coverTitle, { align: 'center', underline: true });
            doc.moveDown(0.5);

            if (cover.showSubtitle && cover.subtitle) {
              doc
                .fillColor(colors.secondary)
                .fontSize(16)
                .text(cover.subtitle, { align: 'center' });
            }
            doc.moveDown(4);

            const startX = 60;
            doc.fontSize(12).fillColor('#1f2937');
            doc.text('Prepared For:', startX, doc.y, { underline: true });
            doc.fillColor(colors.secondary).text(`${clientCompany}`, startX + 15);
            if (clientName && clientName !== clientCompany) {
              doc.text(`${clientName}`, startX + 15);
            }
            doc.moveDown(1);

            doc.fillColor('#1f2937').text('Prepared By:', startX);
            doc.fillColor(colors.secondary).text(`${byCompany}`, startX + 15);
            doc.text(`${byAddress}`, startX + 15);
            doc.text(`Website: ${byWebsite} | Email: ${byEmail}`, startX + 15);
            doc.moveDown(1.5);

            doc.fillColor('#1f2937').text(`DATE: ${docDate}`, startX);
            doc.text(`PLACE: ${docPlace}`, startX);

          } else if (sectionId === 'cover_letter') {
            // Render 2. Cover Letter
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Cover Letter', { underline: true });
            doc.moveDown(1);
            writeFormattedText(doc, metadata.coverLetter || config.cover_letter || '', 11, '#2d3748');

          } else if (sectionId === 'project_overview') {
            // Render 3. Project Overview
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Project Overview', { underline: true });
            doc.moveDown(1);
            writeFormattedText(
              doc,
              config.project_overview || metadata.proposal?.projectOverview || '',
              11,
              '#2d3748',
            );

          } else if (sectionId === 'scope' || sectionId === 'scope_of_work') {
            // Render 4. Scope of Work
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Scope of Work', { underline: true });
            doc.moveDown(1);
            writeFormattedText(
              doc,
              config.scope_of_work || metadata.proposal?.description || '',
              11,
              '#2d3748',
            );

          } else if (sectionId === 'website_structure') {
            // Render 5. Website Structure
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Website Structure & Pages', { underline: true });
            doc.moveDown(1);
            writeFormattedText(doc, config.website_structure || '', 11, '#2d3748');

          } else if (sectionId === 'deliverables') {
            // Render 6. Deliverables Table
            const deliverables = config.deliverables || [];
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Project Deliverables', { underline: true });
            doc.moveDown(1);

            if (deliverables.length > 0) {
              const colX = [50, 160, 240, 545];
              let currentY = doc.y;

              doc
                .rect(colX[0], currentY, colX[3] - colX[0], 25)
                .fill(colors.primary);
              doc.fillColor('#ffffff').fontSize(10);
              doc.text('Phase / Milestone', colX[0] + 5, currentY + 7);
              doc.text('Timeline', colX[1] + 5, currentY + 7);
              doc.text('Details / Deliverables', colX[2] + 5, currentY + 7);
              currentY += 25;

              doc.fillColor('#2d3748');
              for (const row of deliverables) {
                if (currentY > 700) {
                  doc.addPage();
                  currentY = doc.y;
                  doc
                    .rect(colX[0], currentY, colX[3] - colX[0], 25)
                    .fill(colors.primary);
                  doc.fillColor('#ffffff');
                  doc.text('Phase / Milestone', colX[0] + 5, currentY + 7);
                  doc.text('Timeline', colX[1] + 5, currentY + 7);
                  doc.text('Details / Deliverables', colX[2] + 5, currentY + 7);
                  currentY += 25;
                }

                doc
                  .moveTo(colX[0], currentY)
                  .lineTo(colX[3], currentY)
                  .strokeColor('#cbd5e1')
                  .stroke();

                const phaseTxt = row.phase || '';
                const timeTxt = row.timeline || '';
                const detailsTxt = row.details || '';

                doc
                  .fillColor('#1f2937')
                  .fontSize(9)
                  .text(phaseTxt, colX[0] + 5, currentY + 6, { width: 100 });
                doc.text(timeTxt, colX[1] + 5, currentY + 6, { width: 70 });
                doc
                  .fillColor('#4b5563')
                  .text(detailsTxt, colX[2] + 5, currentY + 6, { width: 290 });

                const rowHeight = Math.max(
                  30,
                  doc.heightOfString(detailsTxt, { width: 290 }) + 12,
                );
                currentY += rowHeight;
              }
              doc
                .moveTo(colX[0], currentY)
                .lineTo(colX[3], currentY)
                .strokeColor('#cbd5e1')
                .stroke();
            }

          } else if (sectionId === 'pricing') {
            // Render 7. Pricing table
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Financial Investment', { underline: true });
            doc.moveDown(1.5);

            const pricingItems = config.pricing?.items || metadata.items || [];
            const pricingColX = [50, 200, 260, 320, 390, 460, 545];
            let priceY = doc.y;

            doc
              .rect(pricingColX[0], priceY, pricingColX[6] - pricingColX[0], 25)
              .fill(colors.primary);
            doc.fillColor('#ffffff').fontSize(9);
            doc.text('Service Item', pricingColX[0] + 5, priceY + 7);
            doc.text('Description', pricingColX[1] + 5, priceY + 7);
            doc.text('Qty', pricingColX[2] + 5, priceY + 7);
            doc.text('Rate', pricingColX[3] + 5, priceY + 7);
            doc.text('Disc', pricingColX[4] + 5, priceY + 7);
            doc.text('Tax', pricingColX[5] + 5, priceY + 7);
            doc.text('Total', pricingColX[6] - 45, priceY + 7);
            priceY += 25;

            doc.fillColor('#2d3748');
            for (const item of pricingItems) {
              if (priceY > 700) {
                doc.addPage();
                priceY = doc.y;
                doc
                  .rect(pricingColX[0], priceY, pricingColX[6] - pricingColX[0], 25)
                  .fill(colors.primary);
                doc.fillColor('#ffffff');
                doc.text('Service Item', pricingColX[0] + 5, priceY + 7);
                doc.text('Description', pricingColX[1] + 5, priceY + 7);
                doc.text('Qty', pricingColX[2] + 5, priceY + 7);
                doc.text('Rate', pricingColX[3] + 5, priceY + 7);
                doc.text('Disc', pricingColX[4] + 5, priceY + 7);
                doc.text('Tax', pricingColX[5] + 5, priceY + 7);
                doc.text('Total', pricingColX[6] - 45, priceY + 7);
                priceY += 25;
              }

              doc
                .moveTo(pricingColX[0], priceY)
                .lineTo(pricingColX[6], priceY)
                .strokeColor('#cbd5e1')
                .stroke();

              const name = item.productName || item.service || 'Service';
              const desc = item.description || '-';
              const qty = Number(item.quantity || 1);
              const price = Number(item.price || item.cost || 0);
              const disc = Number(item.discount || 0);
              const tax = Number(item.tax || 0);
              const totalVal = Number(item.total || (qty * price - disc) * (1 + tax / 100));

              doc
                .fillColor('#1f2937')
                .fontSize(9)
                .text(name, pricingColX[0] + 5, priceY + 6, { width: 140 });
              doc
                .fillColor('#4b5563')
                .text(desc, pricingColX[1] + 5, priceY + 6, { width: 55 });
              doc.text(String(qty), pricingColX[2] + 5, priceY + 6);
              doc.text(price.toFixed(2), pricingColX[3] + 5, priceY + 6);
              doc.text(disc.toFixed(2), pricingColX[4] + 5, priceY + 6);
              doc.text(`${tax}%`, pricingColX[5] + 5, priceY + 6);
              doc
                .fillColor('#1f2937')
                .text(totalVal.toFixed(2), pricingColX[6] - 50, priceY + 6, {
                  width: 75,
                  align: 'right',
                });

              const rowH = Math.max(
                30,
                doc.heightOfString(name, { width: 140 }) + 10,
              );
              priceY += rowH;
            }

            doc
              .moveTo(pricingColX[0], priceY)
              .lineTo(pricingColX[6], priceY)
              .strokeColor('#cbd5e1')
              .stroke();
            priceY += 15;

            const currency = metadata.proposal?.currency || 'USD';
            const subtotal = Number(config.pricing?.subtotal || metadata.proposal?.subtotal || 0);
            const discountTotal = Number(config.pricing?.discount || metadata.proposal?.discountTotal || 0);
            const taxTotal = Number(config.pricing?.taxTotal || metadata.proposal?.taxTotal || 0);
            const total = Number(config.pricing?.amount || metadata.proposal?.total || 0);

            doc.fillColor('#4b5563').fontSize(9);
            doc.text('Subtotal:', 380, priceY);
            doc
              .fillColor('#1f2937')
              .text(`${currency} ${subtotal.toFixed(2)}`, 460, priceY, {
                align: 'right',
                width: 85,
              });
            priceY += 16;

            doc.fillColor('#4b5563').text('Discount:', 380, priceY);
            doc
              .fillColor('#ef4444')
              .text(`-${currency} ${discountTotal.toFixed(2)}`, 460, priceY, {
                align: 'right',
                width: 85,
              });
            priceY += 16;

            doc.fillColor('#4b5563').text('Taxes:', 380, priceY);
            doc
              .fillColor('#1f2937')
              .text(`${currency} ${taxTotal.toFixed(2)}`, 460, priceY, {
                align: 'right',
                width: 85,
              });
            priceY += 20;

            doc.rect(370, priceY - 4, 180, 22).fill(colors.bg_card || '#f8fafc');
            doc
              .rect(370, priceY - 4, 180, 22)
              .strokeColor(colors.primary)
              .stroke();
            doc
              .fillColor(colors.primary)
              .fontSize(10)
              .text('GRAND TOTAL:', 375, priceY + 2);
            doc.text(`${currency} ${total.toFixed(2)}`, 460, priceY + 2, {
              align: 'right',
              width: 85,
            });

          } else if (sectionId === 'payment_terms') {
            // Render Payment Terms
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Payment Terms & Schedule', { underline: true });
            doc.moveDown(1);

            const sched = config.payment_terms || {};
            const adv = sched.advance || 50;
            const dev = sched.development || 30;
            const dep = sched.deployment || 20;

            doc
              .fillColor('#2d3748')
              .fontSize(11)
              .text(
                `The financial investment payments are scheduled dynamically across milestones:\n` +
                  `• ${adv}% Advance: payable immediately upon contract sign-off.\n` +
                  `• ${dev}% Development: payable mid-project upon milestone reviews.\n` +
                  `• ${dep}% Launch Deployment: payable prior to production launch.`,
                { lineGap: 4 },
              );

          } else if (sectionId === 'additional_charges') {
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Additional Charges', { underline: true });
            doc.moveDown(1);

            const startY = doc.y;
            const tableWidths = [120, 240, 120];
            const startX = 50;

            // Draw Header Background
            doc.rect(startX, startY, 480, 22).fill(colors.primary);
            doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
            doc.text('Item', startX + 8, startY + 6);
            doc.text('Description', startX + tableWidths[0] + 8, startY + 6);
            doc.text('Cost', startX + tableWidths[0] + tableWidths[1] + 8, startY + 6);
            doc.font('Helvetica');

            let currentY = startY + 22;

            // Row 1: Domain & Hosting
            doc.rect(startX, currentY, 480, 75).strokeColor('#cbd5e1').stroke();
            doc.fillColor('#1f2937').fontSize(9).font('Helvetica-Bold');
            doc.text('1. Domain & Hosting', startX + 8, currentY + 8, { width: 110 });
            doc.font('Helvetica').fillColor('#4b5563');
            doc.text(
              '• The client may independently purchase the domain name and provide the login credentials.\n' +
              '• Alternatively, Grehasoft can register the domain on behalf of the client.\n' +
              '• Website hosting will be provided through Grehasoft resell infrastructure.\n' +
              '• The website will be securely deployed, maintained and hosted.',
              startX + tableWidths[0] + 8,
              currentY + 8,
              { width: 220, lineGap: 2 }
            );
            doc.fillColor('#1f2937');
            doc.text('Starts from ₹5,000/yr', startX + tableWidths[0] + tableWidths[1] + 8, currentY + 8);

            currentY += 75;

            // Row 2: SSL Certificate
            doc.rect(startX, currentY, 480, 45).strokeColor('#cbd5e1').stroke();
            doc.fillColor('#1f2937').font('Helvetica-Bold');
            doc.text('2. SSL Certificate', startX + 8, currentY + 8, { width: 110 });
            doc.font('Helvetica').fillColor('#4b5563');
            doc.text(
              'If a free SSL certificate is used, no additional charge applies.\n' +
              'If the client requires a premium SSL certificate, it must be purchased separately by the client.',
              startX + tableWidths[0] + 8,
              currentY + 8,
              { width: 220, lineGap: 2 }
            );
            doc.fillColor('#1f2937');
            doc.text('Included / Client Paid', startX + tableWidths[0] + tableWidths[1] + 8, currentY + 8);

            doc.y = currentY + 55;

          } else if (sectionId === 'maintenance_cost') {
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Maintenance Cost', { underline: true });
            doc.moveDown(0.2);
            doc
              .fillColor('#6B7280')
              .fontSize(10)
              .font('Helvetica-Oblique')
              .text('(* If required by the client only)');
            doc.font('Helvetica').moveDown(1);

            doc.fillColor('#1f2937').fontSize(11).text('Maintenance services include:');
            doc.fillColor('#4b5563').fontSize(10).text(
              '• Security Updates\n' +
              '• Plugin Updates\n' +
              '• Theme Updates\n' +
              '• Content Updates\n' +
              '• Backup & Disaster Recovery\n' +
              '• User Management',
              { lineGap: 2 }
            );
            doc.moveDown(1);

            doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text('Pricing Plans:');
            doc.font('Helvetica').fillColor('#4b5563').fontSize(10).text(
              '• Yearly Advance: ₹25,000\n' +
              '• Quarterly Advance: ₹7,000\n' +
              '• Monthly: ₹3,000',
              { lineGap: 2 }
            );
            doc.moveDown(1.5);

            // Draw Box Note
            const noteY = doc.y;
            doc.rect(50, noteY, 480, 45).fill(colors.bg_card || '#f8fafc');
            doc.rect(50, noteY, 480, 45).strokeColor('#cbd5e1').stroke();
            doc.fillColor('#4b5563').fontSize(9.5).font('Helvetica-Oblique');
            doc.text(
              'If the client does not opt for any maintenance plan, future maintenance requests will be charged based on functionality or development time at ₹500/hour.',
              60,
              noteY + 8,
              { width: 460, lineGap: 2 }
            );
            doc.font('Helvetica');
            doc.y = noteY + 55;

          } else if (sectionId === 'terms_conditions') {
            doc
              .fillColor(colors.primary)
              .fontSize(20)
              .text('Terms & Conditions', { underline: true });
            doc.moveDown(1);

            const sched = config.payment_terms || {};
            const adv = sched.advance || 50;
            const dev = sched.development || 30;
            const dep = sched.deployment || 20;

            const clauses = [
              {
                title: '1. Payment Terms',
                text: `The payment for the project is scheduled as follows:\n` +
                      `• ${adv}% Advance: payable immediately to kick off the development.\n` +
                      `• ${dev}% Development Milestone: payable upon completion of core modules.\n` +
                      `• ${dep}% Final Deployment: payable prior to launching the production workspace.`
              },
              {
                title: '2. Project Scope & Costs',
                text: '• The costs outlined in this proposal are based on the requirements discussed. Any changes, additions, or modifications to the scope of work after the commencement of the project will be treated as extra work and charged separately.\n• In case of scope changes, a revised quote will be provided for approval before implementation.'
              },
              {
                title: '3. Scope Limitation',
                text: '• Information Website only.\n• No custom systems.\n• Additional features will be quoted separately.'
              },
              {
                title: '4. Design & Banner Images Policy',
                text: '• Royalty-free images will be utilized for website design.\n• AI-generated images may be used to enhance the website aesthetics.\n• Homepage banner revisions are limited to the revision cycle.\n• Section image revisions will be handled as part of the overall design revisions.'
              },
              {
                title: '5. Client Provided Images',
                text: '• The client must provide high-quality images and assets.\n• Grehasoft is not responsible for the poor rendering of low-resolution or poor-quality client-provided images.\n• Any necessary edits or replacements of client-provided images must be supplied by the client.'
              },
              {
                title: '6. Design',
                text: '• One initial design concept will be presented to the client.\n• Up to two free revisions are included in the project cost.\n• Additional revisions beyond the two free rounds are chargeable.'
              },
              {
                title: '7. Client Responsibilities',
                text: '• The client must provide all content, text, logos, branding assets, images, and other materials in a timely manner.\n• Delays in providing materials or feedback will result in corresponding delays in the project timeline.\n• The client must verify and approve milestones promptly to ensure progress.'
              },
              {
                title: '8. E-Commerce Website Requirements',
                text: '• Client provides the product list, description, pricing, and images.\n• For e-commerce websites, initial upload includes a maximum of 50 products. Extra products will be charged at ₹75 per product.'
              },
              {
                title: '9. Third-Party Integrations',
                text: '• Third-party integrations such as CRM integrations and marketing tools will be configured as per requirements.\n• All third-party subscription costs (e.g., APIs, CRM licenses, premium tools) are to be borne directly by the client.\n• SSL integration is included. Premium SSL certificates must be purchased separately by the client.'
              },
              {
                title: '10. Multimedia & Content Embeds',
                text: '• Multimedia content like videos should be uploaded by the client to third-party platforms (e.g., YouTube).\n• Grehasoft will embed these videos on the website using YouTube URLs provided by the client.'
              },
              {
                title: '11. Legal & Copyright Compliance',
                text: '• The client is responsible for obtaining necessary licenses and permissions for all content, text, images, and logos supplied to Grehasoft.\n• Grehasoft is not liable for any copyright infringement or legal issues arising from client-provided materials.\n• The website will include standard copyright notice and disclaimer unless otherwise specified.'
              },
              {
                title: '12. Project Timeline & Communication',
                text: '• The project timeline is dependent on prompt communication and feedback from the client.\n• Approvals for designs or milestones must be provided within 3 business days. Delays in communication will extend the project timeline.'
              },
              {
                title: '13. Portfolio Rights',
                text: '• Grehasoft reserves the right to showcase the completed website, design, and case study in its portfolio, website, marketing materials, and social media channels unless otherwise agreed in writing.'
              },
              {
                title: '14. Proposal Validity',
                text: '• This proposal remains valid for three (3) months from submission.'
              },
              {
                title: '15. Support & Availability',
                text: '• Support channels: Phone, WhatsApp, Botim, Email, Messenger.\n• Support Hours: 9:00 AM – 6:00 PM IST.\n• Working Days only.'
              }
            ];

            for (const clause of clauses) {
              if (doc.y > 700) {
                doc.addPage();
              }
              doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text(clause.title);
              doc.fillColor('#4b5563').fontSize(9.5).font('Helvetica').text(clause.text, { lineGap: 2 });
              doc.moveDown(0.5);
            }
          }
        }

        // Render 10. Acceptance Signatures Section
        doc.addPage();
        doc
          .fillColor(colors.primary)
          .fontSize(16)
          .text('WISHING YOU A GREAT DAY!!', { align: 'left' });
        doc.moveDown(1.5);
        doc
          .fillColor(colors.primary)
          .fontSize(20)
          .text('Contract Acceptance Signatures', { underline: true });
        doc.moveDown(1);
        doc
          .fillColor('#4b5563')
          .fontSize(10)
          .text('Please sign and date below to confirm this quote and launch project phases.');
        doc.moveDown(4);

        const sigY = doc.y;
        doc.moveTo(50, sigY).lineTo(220, sigY).strokeColor('#4b5563').stroke();
        doc
          .fontSize(10)
          .fillColor('#1f2937')
          .text(`For ${byCompany}`, 50, sigY + 5);
        doc.text('Date: ______________', 50, sigY + 20);

        doc.moveTo(375, sigY).lineTo(545, sigY).strokeColor('#4b5563').stroke();
        doc.text(`For ${clientCompany}`, 375, sigY + 5);
        doc.text('Date: ______________', 375, sigY + 20);

        console.log('[PDF PREVIEW] Finalizing PDF');
        // Finalize page numbering across footers
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .fillColor('#9ca3af')
            .text(
              `Page ${i + 1} of ${range.count}  |  Grehasoft Smart IT Solutions`,
              50,
              800,
              { align: 'center', width: 495 },
            );
        }

        doc.end();
      } catch (error) {
        this.logger.error(
          `Failed to generate PDF for "${title}"`,
          error.stack,
          'PdfKitProvider',
        );
        reject(error);
      }
    });
  }
}
