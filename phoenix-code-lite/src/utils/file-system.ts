import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { IFileSystem } from '../cli/interfaces/file-system';

export class FileSystem implements IFileSystem {
  async readFile(path: string): Promise<string> {
    return await fs.readFile(path, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Ensure directory exists
    const dir = dirname(path);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(path, content, 'utf-8');
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async createDirectory(path: string): Promise<void> {
    await fs.mkdir(path, { recursive: true });
  }

  async listFiles(path: string): Promise<string[]> {
    const items = await fs.readdir(path);
    const files: string[] = [];
    
    for (const item of items) {
      const fullPath = join(path, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isFile()) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
} 