import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageProvider } from './storage.interface';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly baseUploadPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {
    this.baseUploadPath = path.resolve(this.configService.get<string>('app.storage.localPath') || './uploads');
    
    // Ensure root uploads path exists
    if (!fs.existsSync(this.baseUploadPath)) {
      fs.mkdirSync(this.baseUploadPath, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, bucket = 'general'): Promise<string> {
    const bucketPath = path.join(this.baseUploadPath, bucket);
    
    if (!fs.existsSync(bucketPath)) {
      await fs.promises.mkdir(bucketPath, { recursive: true });
    }

    // Generate unique file name
    const fileExt = path.extname(fileName);
    const baseName = path.basename(fileName, fileExt);
    const uniqueFileName = `${baseName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    const filePath = path.join(bucketPath, uniqueFileName);

    await fs.promises.writeFile(filePath, fileBuffer);
    
    this.logger.log(`Uploaded file to local storage: ${filePath}`, 'LocalStorageProvider');

    // Return the relative key path (e.g. general/filename.ext)
    return path.join(bucket, uniqueFileName).replace(/\\/g, '/');
  }

  async getFileStream(key: string, bucket = 'general'): Promise<NodeJS.ReadableStream> {
    const filePath = path.join(this.baseUploadPath, key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }
    return fs.createReadStream(filePath);
  }

  async deleteFile(key: string, bucket = 'general'): Promise<void> {
    const filePath = path.join(this.baseUploadPath, key);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`Deleted local file: ${filePath}`, 'LocalStorageProvider');
      }
    } catch (error) {
      this.logger.error(`Error deleting local file: ${filePath}`, error.stack, 'LocalStorageProvider');
      throw error;
    }
  }

  async getDownloadUrl(key: string, bucket = 'general'): Promise<string> {
    // For local storage, returns the media path URL (e.g. /media/general/filename.ext)
    return `/media/${key}`;
  }
}
