import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = './backend/uploads';

export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function saveUploadedFile(filename: string, buffer: Buffer): { fileId: string; filePath: string } {
  ensureUploadDir();
  
  const fileId = uuidv4();
  const ext = path.extname(filename);
  const newFilename = `${fileId}${ext}`;
  const filePath = path.join(UPLOAD_DIR, newFilename);
  
  fs.writeFileSync(filePath, buffer);
  
  return {
    fileId,
    filePath
  };
}

export function getFilePath(fileId: string, ext: string = '.csv'): string {
  return path.join(UPLOAD_DIR, `${fileId}${ext}`);
}

export function deleteUploadedFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getFileSize(filePath: string): number {
  if (fs.existsSync(filePath)) {
    return fs.statSync(filePath).size;
  }
  return 0;
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
