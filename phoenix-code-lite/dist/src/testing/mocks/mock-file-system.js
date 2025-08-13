"use strict";
/**---
 * title: [Mock File System - Testing Double]
 * tags: [Testing, Mocks]
 * provides: [MockFileSystem]
 * requires: []
 * description: [Mock implementation of IFileSystem for unit and integration tests.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockFileSystem = void 0;
class MockFileSystem {
    constructor() {
        this.files = new Map();
        this.directories = new Set();
    }
    async readFile(path) {
        const content = this.files.get(path);
        if (content === undefined) {
            throw new Error(`File not found: ${path}`);
        }
        return content;
    }
    async writeFile(path, content) {
        this.files.set(path, content);
    }
    async exists(path) {
        return this.files.has(path) || this.directories.has(path);
    }
    async createDirectory(path) {
        this.directories.add(path);
    }
    async listFiles(path) {
        const files = [];
        for (const filePath of this.files.keys()) {
            if (filePath.startsWith(path)) {
                files.push(filePath);
            }
        }
        return files;
    }
    // Test utility methods
    setFile(path, content) {
        this.files.set(path, content);
    }
    getFile(path) {
        return this.files.get(path);
    }
    clearFiles() {
        this.files.clear();
        this.directories.clear();
    }
    getFiles() {
        return new Map(this.files);
    }
}
exports.MockFileSystem = MockFileSystem;
//# sourceMappingURL=mock-file-system.js.map