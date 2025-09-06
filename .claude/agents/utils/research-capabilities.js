"use strict";
/**
 * Research Agent Core Capabilities
 *
 * Implementation of research functions for TASK-SUBAGENT-002
 * Generic Research Agent with pattern analysis and task assessment
 *
 * @created 2025-09-05
 * @source TASK-SUBAGENT-002 Generic Research Agent Implementation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeResearch = executeResearch;
exports.analyzePatterns = analyzePatterns;
exports.assessComplexity = assessComplexity;
exports.analyzeDependencies = analyzeDependencies;
const fs = __importStar(require("fs/promises"));
/**
 * Main research execution function
 */
async function executeResearch(input) {
    const startTime = Date.now();
    const { task_description, requirements, constraints, relevant_files } = input.context;
    try {
        // Pattern analysis
        const patterns = await analyzePatterns(task_description, requirements);
        // Task assessment
        const complexity = assessComplexity(requirements, constraints);
        // Dependency analysis
        const dependencies = await analyzeDependencies(relevant_files || []);
        // Generate implementation guidance
        const guidance = generateImplementationGuidance(patterns, complexity, dependencies);
        return {
            patterns_found: patterns,
            complexity_assessment: complexity,
            dependencies: dependencies,
            implementation_guidance: guidance,
            execution_time: Date.now() - startTime
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Research execution failed: ${errorMessage}`);
    }
}
/**
 * Analyze patterns in pattern documents for task relevance
 */
async function analyzePatterns(taskDescription, requirements) {
    const patterns = [];
    try {
        // Find pattern documents
        const patternFiles = await findPatternFiles();
        for (const patternFile of patternFiles) {
            const content = await fs.readFile(patternFile, 'utf8');
            const filePatterns = await extractPatternsFromFile(content, patternFile, taskDescription, requirements);
            patterns.push(...filePatterns);
        }
        // Sort by relevance score (highest first)
        patterns.sort((a, b) => b.relevance_score - a.relevance_score);
        // Return top 10 most relevant patterns
        return patterns.slice(0, 10);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Pattern analysis warning: ${errorMessage}`);
        return [];
    }
}
/**
 * Find pattern document files in the project
 */
async function findPatternFiles() {
    const patternFiles = [];
    const searchPaths = [
        'dev/*-patterns.md',
        'docs/**/*patterns.md',
        '**/*-pattern*.md'
    ];
    // This is a simplified implementation - in practice would use glob
    // For now, return known pattern files based on project structure
    const potentialFiles = [
        'Templum/dev/templum-patterns.md',
        'phoenix-code-lite/docs/patterns.md',
        '.claude/patterns/*.md'
    ];
    for (const file of potentialFiles) {
        try {
            await fs.access(file);
            patternFiles.push(file);
        }
        catch (_a) {
            // File doesn't exist, continue
        }
    }
    return patternFiles;
}
/**
 * Extract patterns from a pattern document file
 */
async function extractPatternsFromFile(content, filePath, taskDescription, requirements) {
    const patterns = [];
    // Split content into pattern sections
    const patternSections = content.split(/^###?\s+/m);
    for (let i = 0; i < patternSections.length; i++) {
        const section = patternSections[i];
        // Skip empty sections
        if (!section.trim())
            continue;
        // Extract pattern name from first line
        const firstLine = section.split('\n')[0];
        const patternName = firstLine.replace(/Pattern$/, '').trim();
        // Calculate relevance score
        const relevanceScore = calculatePatternRelevance(section, patternName, taskDescription, requirements);
        // Only include patterns with relevance > 20%
        if (relevanceScore > 20) {
            patterns.push({
                pattern_name: patternName,
                relevance_score: relevanceScore,
                file_path: filePath,
                line_number: calculateLineNumber(content, section),
                implementation_guidance: extractImplementationGuidance(section),
                complexity_estimate: estimatePatternComplexity(section),
                dependencies: extractPatternDependencies(section)
            });
        }
    }
    return patterns;
}
/**
 * Calculate relevance score for a pattern
 */
function calculatePatternRelevance(patternContent, patternName, taskDescription, requirements) {
    let score = 0;
    const patternLower = patternContent.toLowerCase();
    const taskLower = taskDescription.toLowerCase();
    // Check pattern name similarity
    if (taskLower.includes(patternName.toLowerCase())) {
        score += 40;
    }
    // Check keyword matches
    const keywords = extractKeywords(taskDescription);
    for (const keyword of keywords) {
        if (patternLower.includes(keyword.toLowerCase())) {
            score += 10;
        }
    }
    // Check requirement matches
    for (const requirement of requirements) {
        const reqKeywords = extractKeywords(requirement);
        for (const keyword of reqKeywords) {
            if (patternLower.includes(keyword.toLowerCase())) {
                score += 5;
            }
        }
    }
    return Math.min(score, 100); // Cap at 100%
}
/**
 * Extract keywords from text for matching
 */
function extractKeywords(text) {
    // Simple keyword extraction - remove common words
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);
    return text
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 2 && !commonWords.has(word))
        .slice(0, 10); // Top 10 keywords
}
/**
 * Assess task complexity based on requirements and constraints
 */
function assessComplexity(requirements, constraints) {
    const factors = {
        requirement_count: requirements.length,
        constraint_count: constraints.length,
        estimated_difficulty: calculateDifficulty(requirements),
        dependency_complexity: analyzeDependencyComplexity(requirements)
    };
    const score = calculateComplexityScore(factors);
    const timeEstimate = estimateImplementationTime(factors);
    const riskFactors = identifyRiskFactors(requirements, constraints);
    return {
        score,
        factors,
        estimated_time_hours: timeEstimate,
        risk_factors: riskFactors
    };
}
/**
 * Calculate complexity score from factors
 */
function calculateComplexityScore(factors) {
    let score = 1; // Base complexity
    // Add complexity for requirements (0.5 per requirement)
    score += factors.requirement_count * 0.5;
    // Add complexity for constraints (0.3 per constraint) 
    score += factors.constraint_count * 0.3;
    // Add estimated difficulty (1-3 scale)
    score += factors.estimated_difficulty;
    // Add dependency complexity (1-3 scale)
    score += factors.dependency_complexity;
    return Math.min(Math.max(Math.round(score), 1), 10); // 1-10 scale
}
/**
 * Calculate difficulty based on requirement keywords
 */
function calculateDifficulty(requirements) {
    const highComplexityKeywords = [
        'architecture', 'refactor', 'integration', 'performance', 'security',
        'concurrent', 'async', 'distributed', 'migration', 'optimization'
    ];
    const mediumComplexityKeywords = [
        'implement', 'create', 'build', 'update', 'modify', 'enhance',
        'validation', 'testing', 'configuration', 'interface'
    ];
    let difficulty = 1;
    const reqText = requirements.join(' ').toLowerCase();
    // High complexity keywords add more difficulty
    for (const keyword of highComplexityKeywords) {
        if (reqText.includes(keyword)) {
            difficulty += 0.5;
        }
    }
    // Medium complexity keywords add less difficulty
    for (const keyword of mediumComplexityKeywords) {
        if (reqText.includes(keyword)) {
            difficulty += 0.2;
        }
    }
    return Math.min(difficulty, 3); // 1-3 scale
}
/**
 * Analyze dependency complexity from requirements
 */
function analyzeDependencyComplexity(requirements) {
    const dependencyKeywords = [
        'depends', 'requires', 'needs', 'uses', 'integrates', 'connects',
        'imports', 'extends', 'implements', 'inherits'
    ];
    let complexity = 1;
    const reqText = requirements.join(' ').toLowerCase();
    for (const keyword of dependencyKeywords) {
        if (reqText.includes(keyword)) {
            complexity += 0.3;
        }
    }
    return Math.min(complexity, 3); // 1-3 scale
}
/**
 * Estimate implementation time based on complexity factors
 */
function estimateImplementationTime(factors) {
    let baseHours = 1;
    // Add time for requirements
    baseHours += factors.requirement_count * 0.5;
    // Add time for constraints
    baseHours += factors.constraint_count * 0.25;
    // Multiply by difficulty
    baseHours *= factors.estimated_difficulty;
    // Multiply by dependency complexity
    baseHours *= factors.dependency_complexity;
    return Math.round(baseHours * 10) / 10; // Round to 1 decimal
}
/**
 * Identify risk factors from requirements and constraints
 */
function identifyRiskFactors(requirements, constraints) {
    const risks = [];
    const allText = [...requirements, ...constraints].join(' ').toLowerCase();
    const riskPatterns = [
        { pattern: /breaking.{0,10}change/, risk: 'Breaking changes may affect existing functionality' },
        { pattern: /performance.{0,10}critical/, risk: 'Performance requirements may be challenging to meet' },
        { pattern: /legacy.{0,10}system/, risk: 'Legacy system integration complexity' },
        { pattern: /external.{0,10}dependency/, risk: 'External dependencies may introduce instability' },
        { pattern: /concurrent|async|parallel/, risk: 'Concurrency issues may arise' },
        { pattern: /security.{0,10}sensitive/, risk: 'Security requirements need special attention' }
    ];
    for (const { pattern, risk } of riskPatterns) {
        if (pattern.test(allText)) {
            risks.push(risk);
        }
    }
    return risks;
}
/**
 * Analyze dependencies from relevant files
 */
async function analyzeDependencies(relevantFiles) {
    const analysis = {
        file_dependencies: [],
        pattern_dependencies: [],
        external_dependencies: []
    };
    for (const filePath of relevantFiles) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            // Extract file dependencies (imports, references)
            const fileDeps = extractFileDependencies(content, filePath);
            analysis.file_dependencies.push(...fileDeps);
            // Extract pattern dependencies
            const patternDeps = extractPatternDependencies(content);
            analysis.pattern_dependencies.push(...patternDeps.map(dep => ({
                pattern_name: dep,
                required: true,
                status: 'documented' // Simplified - would need to verify
            })));
            // Extract external dependencies
            const externalDeps = extractExternalDependencies(content);
            analysis.external_dependencies.push(...externalDeps);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`Failed to analyze file ${filePath}: ${errorMessage}`);
        }
    }
    return analysis;
}
// Helper functions for dependency analysis
function extractFileDependencies(content, filePath) {
    const dependencies = [];
    // Extract import statements
    const importPattern = /import\s+.*from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importPattern.exec(content)) !== null) {
        dependencies.push({
            file_path: match[1],
            dependency_type: 'import',
            status: 'available' // Simplified - would need to verify
        });
    }
    return dependencies;
}
function extractPatternDependencies(content) {
    const patterns = [];
    // Look for pattern references
    const patternPattern = /Pattern:\s*([^|\n]+)/g;
    let match;
    while ((match = patternPattern.exec(content)) !== null) {
        patterns.push(match[1].trim());
    }
    return patterns;
}
function extractExternalDependencies(content) {
    const dependencies = [];
    // Look for package imports
    const packagePattern = /import\s+.*from\s+['"]([^./][^'"]+)['"]/g;
    let match;
    while ((match = packagePattern.exec(content)) !== null) {
        dependencies.push({
            package_name: match[1],
            required: true,
            status: 'available' // Simplified - would need to verify
        });
    }
    return dependencies;
}
/**
 * Generate implementation guidance based on research results
 */
function generateImplementationGuidance(patterns, complexity, dependencies) {
    const topPattern = patterns[0];
    return {
        recommended_approach: topPattern
            ? `Follow ${topPattern.pattern_name} pattern (${topPattern.relevance_score}% match)`
            : 'No specific pattern found - use generic implementation approach',
        alternative_approaches: patterns.slice(1, 3).map(p => `${p.pattern_name} pattern (${p.relevance_score}% match)`),
        potential_blockers: [
            ...complexity.risk_factors,
            ...dependencies.file_dependencies
                .filter(d => d.status === 'missing')
                .map(d => `Missing file dependency: ${d.file_path}`),
            ...dependencies.external_dependencies
                .filter(d => d.status === 'missing')
                .map(d => `Missing package dependency: ${d.package_name}`)
        ],
        success_criteria: [
            'Implementation follows identified pattern guidelines',
            'All dependencies resolved and available',
            'Complexity managed within estimated timeframe',
            'Risk factors addressed with mitigation strategies'
        ]
    };
}
// Helper functions for pattern extraction
function calculateLineNumber(content, section) {
    const index = content.indexOf(section);
    if (index === -1)
        return 0;
    return content.substring(0, index).split('\n').length;
}
function extractImplementationGuidance(section) {
    // Look for implementation steps or guidance
    const guidancePatterns = [
        /Implementation[:\s]+(.*?)(?=\n#|\n$)/s,
        /Steps[:\s]+(.*?)(?=\n#|\n$)/s,
        /Approach[:\s]+(.*?)(?=\n#|\n$)/s
    ];
    for (const pattern of guidancePatterns) {
        const match = section.match(pattern);
        if (match) {
            return match[1].trim().substring(0, 200) + '...'; // Truncate for summary
        }
    }
    return 'See pattern documentation for implementation details';
}
function estimatePatternComplexity(section) {
    const complexityKeywords = [
        'complex', 'difficult', 'advanced', 'enterprise', 'architecture',
        'integration', 'performance', 'security', 'concurrent'
    ];
    let complexity = 3; // Default medium complexity
    const sectionLower = section.toLowerCase();
    for (const keyword of complexityKeywords) {
        if (sectionLower.includes(keyword)) {
            complexity += 0.5;
        }
    }
    return Math.min(Math.max(Math.round(complexity), 1), 10);
}
