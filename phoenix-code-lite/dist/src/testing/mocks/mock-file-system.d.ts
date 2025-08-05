import { IFileSystem } from '../../cli/interfaces/file-system';
export declare class MockFileSystem implements IFileSystem {
    private files;
    private directories;
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    createDirectory(path: string): Promise<void>;
    listFiles(path: string): Promise<string[]>;
    setFile(path: string, content: string): void;
    getFile(path: string): string | undefined;
    clearFiles(): void;
    getFiles(): Map<string, string>;
}
//# sourceMappingURL=mock-file-system.d.ts.map