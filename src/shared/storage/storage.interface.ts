export interface IStorageProvider {
  uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, bucket?: string): Promise<string>;
  getFileStream(key: string, bucket?: string): Promise<NodeJS.ReadableStream>;
  deleteFile(key: string, bucket?: string): Promise<void>;
  getDownloadUrl(key: string, bucket?: string): Promise<string>;
}

export const STORAGE_PROVIDER_TOKEN = 'STORAGE_PROVIDER_TOKEN';
