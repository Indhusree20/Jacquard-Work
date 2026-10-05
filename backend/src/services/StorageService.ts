import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env';

export interface IStoredFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface IStorageProvider {
  uploadFile(file: Express.Multer.File): Promise<IStoredFile>;
  deleteFile(fileUrl: string): Promise<boolean>;
}

export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(__dirname, '../../', ENV.UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<IStoredFile> {
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const destinationPath = path.join(this.uploadDir, fileName);

    // If file is already on disk (e.g. from multer diskStorage)
    if (file.path) {
      if (file.path !== destinationPath) {
        fs.renameSync(file.path, destinationPath);
      }
    } else if (file.buffer) {
      fs.writeFileSync(destinationPath, file.buffer);
    }

    const fileUrl = `/uploads/${fileName}`;

    return {
      fileName: file.originalname,
      fileUrl,
      fileType: file.mimetype,
      fileSize: file.size
    };
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[StorageService] Error deleting file:', err);
      return false;
    }
  }
}

// Factory to allow switching to Cloudinary/S3 in the future seamlessly
export class StorageService {
  private static instance: IStorageProvider;

  public static getInstance(): IStorageProvider {
    if (!StorageService.instance) {
      if (ENV.STORAGE_PROVIDER === 'cloudinary') {
        // Fallback to local if not configured
        StorageService.instance = new LocalStorageProvider();
      } else {
        StorageService.instance = new LocalStorageProvider();
      }
    }
    return StorageService.instance;
  }
}
