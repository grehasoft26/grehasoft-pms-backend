export interface IPdfProvider {
  generatePdf(
    title: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<Buffer>;
}

export const PDF_PROVIDER_TOKEN = 'PDF_PROVIDER_TOKEN';
