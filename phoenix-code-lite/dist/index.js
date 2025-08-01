#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCLI = void 0;
const args_1 = require("./cli/args");
Object.defineProperty(exports, "setupCLI", { enumerable: true, get: function () { return args_1.setupCLI; } });
async function main() {
    try {
        const program = (0, args_1.setupCLI)();
        await program.parseAsync(process.argv);
    }
    catch (error) {
        console.error('Phoenix-Code-Lite failed:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=index.js.map