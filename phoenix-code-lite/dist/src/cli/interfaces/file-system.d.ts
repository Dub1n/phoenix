/**---
 * title: [File System Interface - CLI Abstraction]
 * tags: [CLI, Interface, Types]
 * provides: [IFileSystem Interface]
 * requires: []
 * description: [Abstraction for file system operations used by CLI components to enable testing and portability.]
 * ---*/
export interface IFileSystem {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    createDirectory(path: string): Promise<void>;
    listFiles(path: string): Promise<string[]>;
}
//# sourceMappingURL=file-system.d.ts.map