"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystem = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class FileSystem {
    async readFile(path) {
        return await fs_1.promises.readFile(path, 'utf-8');
    }
    async writeFile(path, content) {
        // Ensure directory exists
        const dir = (0, path_1.dirname)(path);
        await fs_1.promises.mkdir(dir, { recursive: true });
        await fs_1.promises.writeFile(path, content, 'utf-8');
    }
    async exists(path) {
        try {
            await fs_1.promises.access(path);
            return true;
        }
        catch {
            return false;
        }
    }
    async createDirectory(path) {
        await fs_1.promises.mkdir(path, { recursive: true });
    }
    async listFiles(path) {
        const items = await fs_1.promises.readdir(path);
        const files = [];
        for (const item of items) {
            const fullPath = (0, path_1.join)(path, item);
            const stat = await fs_1.promises.stat(fullPath);
            if (stat.isFile()) {
                files.push(fullPath);
            }
        }
        return files;
    }
}
exports.FileSystem = FileSystem;
//# sourceMappingURL=file-system.js.map