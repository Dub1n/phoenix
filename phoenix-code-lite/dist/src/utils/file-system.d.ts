import { IFileSystem } from '../cli/interfaces/file-system';
export declare class FileSystem implements IFileSystem {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    createDirectory(path: string): Promise<void>;
    listFiles(path: string): Promise<string[]>;
}
//# sourceMappingURL=file-system.d.ts.map