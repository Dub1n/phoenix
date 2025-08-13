/**---
 * title: [File System Utilities - Safe FS Operations]
 * tags: [Utility, FileSystem]
 * provides: [readJson, writeJson, path helpers]
 * requires: [fs, path]
 * description: [Utility helpers for safe file system operations and JSON read/write.]
 * ---*/
import { IFileSystem } from '../cli/interfaces/file-system';
export declare class FileSystem implements IFileSystem {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    createDirectory(path: string): Promise<void>;
    listFiles(path: string): Promise<string[]>;
}
//# sourceMappingURL=file-system.d.ts.map