"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectDiscovery = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
class ProjectDiscovery {
    constructor() {
        this.stackDatabase = new Map();
        this.initializeStackDatabase();
    }
    async analyzeProject(projectPath = process.cwd()) {
        const context = {
            type: 'unknown',
            language: 'unknown',
            framework: null,
            packageManager: 'unknown',
            hasTests: false,
            hasLinting: false,
            hasTypeScript: false,
            dependencies: [],
            devDependencies: [],
            confidence: 0,
            detectedFiles: [],
            suggestedTemplate: 'starter'
        };
        try {
            // Analyze package.json for Node.js projects
            const packageJsonPath = (0, path_1.join)(projectPath, 'package.json');
            try {
                const packageJson = JSON.parse(await fs_1.promises.readFile(packageJsonPath, 'utf-8'));
                await this.analyzePackageJson(packageJson, context);
                context.detectedFiles.push('package.json');
            }
            catch (error) {
                // No package.json found
            }
            // Analyze Python projects
            await this.analyzePythonProject(projectPath, context);
            // Analyze file structure
            await this.analyzeFileStructure(projectPath, context);
            // Analyze configuration files
            await this.analyzeConfigFiles(projectPath, context);
            // Determine project type based on collected evidence
            this.inferProjectType(context);
            // Calculate confidence score
            context.confidence = this.calculateConfidence(context);
            // Suggest template based on analysis
            context.suggestedTemplate = this.suggestTemplate(context);
        }
        catch (error) {
            console.warn('Project analysis failed:', error);
        }
        return context;
    }
    async analyzePackageJson(packageJson, context) {
        // Extract dependencies
        context.dependencies = Object.keys(packageJson.dependencies || {});
        context.devDependencies = Object.keys(packageJson.devDependencies || {});
        // Detect language
        if (context.devDependencies.includes('typescript') ||
            context.dependencies.includes('typescript')) {
            context.language = 'typescript';
            context.hasTypeScript = true;
        }
        else {
            context.language = 'javascript';
        }
        // Detect package manager
        context.packageManager = 'npm'; // Default, could be enhanced to detect yarn/pnpm
        // Detect framework
        context.framework = this.detectFramework(context.dependencies.concat(context.devDependencies));
        // Detect testing
        context.hasTests = this.hasTestingFramework(context.devDependencies);
        // Detect linting
        context.hasLinting = this.hasLintingTools(context.devDependencies);
    }
    async analyzePythonProject(projectPath, context) {
        const pythonFiles = ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile'];
        for (const file of pythonFiles) {
            try {
                await fs_1.promises.access((0, path_1.join)(projectPath, file));
                context.language = 'python';
                context.detectedFiles.push(file);
                if (file === 'requirements.txt') {
                    const content = await fs_1.promises.readFile((0, path_1.join)(projectPath, file), 'utf-8');
                    context.dependencies = content.split('\n')
                        .filter(line => line.trim() && !line.startsWith('#'))
                        .map(line => line.split('==')[0].split('>=')[0].trim());
                    context.framework = this.detectPythonFramework(context.dependencies);
                }
                break;
            }
            catch (error) {
                // File doesn't exist, continue
            }
        }
    }
    async analyzeFileStructure(projectPath, context) {
        try {
            const files = await fs_1.promises.readdir(projectPath);
            // Common frontend patterns
            if (files.includes('src') || files.includes('public') || files.includes('components')) {
                if (context.type === 'unknown')
                    context.type = 'web';
            }
            // Common backend patterns
            if (files.includes('server') || files.includes('api') || files.includes('routes')) {
                if (context.type === 'unknown')
                    context.type = 'api';
            }
            // CLI patterns
            if (files.includes('bin') || files.includes('cli')) {
                context.type = 'cli';
            }
            // Library patterns
            if (files.includes('lib') || files.includes('dist') && !files.includes('public')) {
                if (context.type === 'unknown')
                    context.type = 'library';
            }
            // Test directories
            if (files.includes('test') || files.includes('tests') || files.includes('__tests__')) {
                context.hasTests = true;
            }
        }
        catch (error) {
            // Directory read failed
        }
    }
    async analyzeConfigFiles(projectPath, context) {
        const configFiles = [
            'tsconfig.json', 'webpack.config.js', 'vite.config.js', 'next.config.js',
            '.eslintrc.js', '.eslintrc.json', 'prettier.config.js', 'jest.config.js'
        ];
        for (const file of configFiles) {
            try {
                await fs_1.promises.access((0, path_1.join)(projectPath, file));
                context.detectedFiles.push(file);
                if (file === 'tsconfig.json') {
                    context.hasTypeScript = true;
                    if (context.language === 'unknown')
                        context.language = 'typescript';
                }
                if (file.includes('eslint') || file.includes('prettier')) {
                    context.hasLinting = true;
                }
                if (file.includes('jest') || file.includes('test')) {
                    context.hasTests = true;
                }
            }
            catch (error) {
                // File doesn't exist
            }
        }
    }
    detectFramework(dependencies) {
        const frameworkMap = new Map([
            ['react', 'React'],
            ['vue', 'Vue.js'],
            ['@angular/core', 'Angular'],
            ['express', 'Express.js'],
            ['fastify', 'Fastify'],
            ['next', 'Next.js'],
            ['nuxt', 'Nuxt.js'],
            ['svelte', 'Svelte'],
            ['gatsby', 'Gatsby'],
            ['nest', 'NestJS']
        ]);
        for (const [dep, framework] of frameworkMap) {
            if (dependencies.some(d => d.includes(dep))) {
                return framework;
            }
        }
        return null;
    }
    detectPythonFramework(dependencies) {
        const pythonFrameworks = new Map([
            ['django', 'Django'],
            ['flask', 'Flask'],
            ['fastapi', 'FastAPI'],
            ['tornado', 'Tornado'],
            ['pyramid', 'Pyramid']
        ]);
        for (const [dep, framework] of pythonFrameworks) {
            if (dependencies.some(d => d.toLowerCase().includes(dep))) {
                return framework;
            }
        }
        return null;
    }
    hasTestingFramework(devDependencies) {
        const testFrameworks = ['jest', 'mocha', 'jasmine', 'cypress', 'playwright', 'vitest'];
        return testFrameworks.some(framework => devDependencies.some(dep => dep.includes(framework)));
    }
    hasLintingTools(devDependencies) {
        const lintTools = ['eslint', 'prettier', 'tslint'];
        return lintTools.some(tool => devDependencies.some(dep => dep.includes(tool)));
    }
    inferProjectType(context) {
        if (context.type !== 'unknown')
            return;
        // Infer from framework
        if (context.framework) {
            const frontendFrameworks = ['React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby'];
            const backendFrameworks = ['Express.js', 'Fastify', 'NestJS', 'Django', 'Flask', 'FastAPI'];
            if (frontendFrameworks.includes(context.framework)) {
                context.type = 'web';
            }
            else if (backendFrameworks.includes(context.framework)) {
                context.type = 'api';
            }
        }
        // Infer from dependencies
        const webDeps = ['react-dom', 'vue-router', '@angular/router'];
        const apiDeps = ['cors', 'helmet', 'morgan', 'body-parser'];
        if (webDeps.some(dep => context.dependencies.includes(dep))) {
            context.type = 'web';
        }
        else if (apiDeps.some(dep => context.dependencies.includes(dep))) {
            context.type = 'api';
        }
    }
    calculateConfidence(context) {
        let score = 0;
        const maxScore = 10;
        // Language detection confidence
        if (context.language !== 'unknown')
            score += 2;
        if (context.hasTypeScript)
            score += 1;
        // Framework detection confidence
        if (context.framework)
            score += 3;
        // Project type confidence
        if (context.type !== 'unknown')
            score += 2;
        // Configuration files boost confidence
        score += Math.min(context.detectedFiles.length * 0.5, 2);
        return Math.min(score / maxScore, 1);
    }
    suggestTemplate(context) {
        // Enterprise for complex setups
        if (context.hasTests && context.hasLinting && context.hasTypeScript && context.confidence > 0.8) {
            return 'enterprise';
        }
        // Professional for good practices
        if ((context.hasTests || context.hasLinting) && context.confidence > 0.6) {
            return 'professional';
        }
        // Performance for simple, fast setups
        if (context.framework && !context.hasTests && context.confidence > 0.7) {
            return 'performance';
        }
        // Default to starter
        return 'starter';
    }
    initializeStackDatabase() {
        // React stack knowledge
        this.stackDatabase.set('React', {
            framework: 'React',
            type: 'frontend',
            language: ['javascript', 'typescript'],
            testingFrameworks: ['jest', 'react-testing-library', 'cypress'],
            buildTools: ['webpack', 'vite', 'create-react-app'],
            recommendations: {
                qualityLevel: 'professional',
                testCoverage: 0.8,
                additionalTools: ['eslint', 'prettier', 'husky']
            }
        });
        // Express.js stack knowledge
        this.stackDatabase.set('Express.js', {
            framework: 'Express.js',
            type: 'backend',
            language: ['javascript', 'typescript'],
            testingFrameworks: ['jest', 'mocha', 'supertest'],
            buildTools: ['nodemon', 'ts-node'],
            recommendations: {
                qualityLevel: 'professional',
                testCoverage: 0.85,
                additionalTools: ['helmet', 'cors', 'morgan']
            }
        });
        // Add more stack knowledge as needed
    }
    getStackKnowledge(framework) {
        return this.stackDatabase.get(framework) || null;
    }
    displayAnalysis(context) {
        console.log(chalk_1.default.blue('\n🔍 Project Discovery Results'));
        console.log(chalk_1.default.gray('═'.repeat(40)));
        console.log(`${chalk_1.default.green('Project Type:')} ${context.type}`);
        console.log(`${chalk_1.default.green('Language:')} ${context.language}`);
        console.log(`${chalk_1.default.green('Framework:')} ${context.framework || 'None detected'}`);
        console.log(`${chalk_1.default.green('Package Manager:')} ${context.packageManager}`);
        console.log(`${chalk_1.default.green('Has Tests:')} ${context.hasTests ? '✅' : '❌'}`);
        console.log(`${chalk_1.default.green('Has Linting:')} ${context.hasLinting ? '✅' : '❌'}`);
        console.log(`${chalk_1.default.green('TypeScript:')} ${context.hasTypeScript ? '✅' : '❌'}`);
        console.log(`${chalk_1.default.green('Confidence:')} ${Math.round(context.confidence * 100)}%`);
        console.log(`${chalk_1.default.green('Suggested Template:')} ${context.suggestedTemplate}`);
        if (context.detectedFiles.length > 0) {
            console.log(`${chalk_1.default.green('Detected Files:')} ${context.detectedFiles.join(', ')}`);
        }
        console.log(chalk_1.default.gray('═'.repeat(40)));
    }
}
exports.ProjectDiscovery = ProjectDiscovery;
//# sourceMappingURL=project-discovery.js.map