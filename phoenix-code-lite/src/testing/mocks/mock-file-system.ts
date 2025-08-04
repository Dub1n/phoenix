import { IFileSystem } from '../../cli/interfaces/file-system';

export class MockFileSystem implements IFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.directories.has(path);
  }

  async createDirectory(path: string): Promise<void> {
    this.directories.add(path);
  }

  async listFiles(path: string): Promise<string[]> {
    const files: string[] = [];
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(path)) {
        files.push(filePath);
      }
    }
    return files;
  }

  // Test utility methods
  setFile(path: string, content: string) {
    this.files.set(path, content);
  }

  getFile(path: string): string | undefined {
    return this.files.get(path);
  }

  clearFiles() {
    this.files.clear();
    this.directories.clear();
  }

  getFiles(): Map<string, string> {
    return new Map(this.files);
  }
} 