import { createLogger, Logger } from './logger';

export interface ValidationIssue {
  type: 'security' | 'format' | 'accessibility' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion: string;
}

export interface PathValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  sanitizedPath?: string;
  recommendations: string[];
}

export interface BreadcrumbOptions {
  label?: string;
  truncateAt?: number;
  metadata?: Record<string, unknown>;
  confidence?: number;
}

export interface Breadcrumb {
  label: string;
  path: string;
  depth: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface NavigationContext {
  userIntent: 'browse' | 'jump' | 'search' | 'command';
  interfaceType?: 'cli' | 'ui' | 'api';
  previousPath?: string;
  metadata?: Record<string, unknown>;
}

export interface NavigationAction {
  type: 'navigate' | 'back' | 'forward' | 'refresh' | 'reset';
  target?: string;
  metadata?: Record<string, unknown>;
}

export interface NavigationState {
  currentPath: string;
  breadcrumbs: Breadcrumb[];
  history: NavigationHistoryItem[];
  sessionId: string;
}

export interface NavigationHistoryItem {
  path: string;
  timestamp: Date;
  context: NavigationContext;
}

export interface NavigationRequest {
  path: string;
  context?: NavigationContext;
  action?: NavigationAction;
  force?: boolean;
}

export interface NavigationResult {
  success: boolean;
  path: string;
  normalizedPath: string;
  validation: PathValidationResult;
  confidence: ConfidenceScore;
  breadcrumbs: Breadcrumb[];
  suggestions: string[];
}

export interface ConfidenceBreakdown {
  overall: number;
  pathValidation: number;
  contextRelevance: number;
  navigationHistory: number;
  factors: {
    pathSecurity: number;
    userIntent: number;
    sessionConsistency: number;
  };
}

export interface ConfidenceScore {
  overall: number;
  breakdown: ConfidenceBreakdown;
}

export interface ActionValidationResult {
  isValid: boolean;
  canExecute: boolean;
  confidence: number;
  warnings: string[];
  suggestions: string[];
}

export interface SafetyAssessment {
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  concerns: string[];
  recommendations: string[];
}

const MAX_HISTORY_ITEMS = 100;

const sanitizeSegments = (segments: string[]): string[] => segments.filter(Boolean);

const normalizeLabel = (segment: string): string => {
  if (!segment) {
    return 'home';
  }
  const cleaned = segment.replace(/[-_]+/g, ' ').trim();
  return cleaned.length === 0
    ? 'home'
    : cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const createSessionId = (): string => `nav-session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

class NavigationStateManager {
  private readonly logger: Logger;
  private state: NavigationState;

  constructor(logger: Logger) {
    this.logger = logger.child({ context: 'navigation-state' });
    this.state = {
      currentPath: '/',
      breadcrumbs: [NavigationUtils.createBreadcrumb('/', { label: 'Home', confidence: 1 })],
      history: [],
      sessionId: createSessionId()
    };
  }

  getState(): NavigationState {
    return {
      currentPath: this.state.currentPath,
      breadcrumbs: [...this.state.breadcrumbs],
      history: this.state.history.map(item => ({
        path: item.path,
        timestamp: new Date(item.timestamp.getTime()),
        context: { ...item.context }
      })),
      sessionId: this.state.sessionId
    };
  }

  reset(): NavigationState {
    this.logger.debug('Resetting navigation state');
    this.state = {
      currentPath: '/',
      breadcrumbs: [NavigationUtils.createBreadcrumb('/', { label: 'Home', confidence: 1 })],
      history: [],
      sessionId: createSessionId()
    };
    return this.getState();
  }

  update(path: string, context: NavigationContext): NavigationState {
    const normalizedPath = NavigationUtils.normalizePath(path);
    const breadcrumbs = NavigationUtils.buildBreadcrumbs(normalizedPath);

    if (this.state.history.length >= MAX_HISTORY_ITEMS) {
      this.state.history.shift();
    }

    this.state.history.push({
      path: normalizedPath,
      timestamp: new Date(),
      context
    });

    this.state = {
      ...this.state,
      currentPath: normalizedPath,
      breadcrumbs
    };

    return this.getState();
  }

  handleAction(action: NavigationAction): NavigationState {
    switch (action.type) {
      case 'back':
        if (this.state.history.length > 1) {
          this.state.history.pop();
          const previous = this.state.history[this.state.history.length - 1];
          return this.update(previous.path, previous.context);
        }
        break;
      case 'reset':
        return this.reset();
      case 'refresh':
      default:
        break;
    }
    return this.getState();
  }
}

export class NavigationUtils {
  private static logger: Logger = createLogger('navigation-utils');
  private static manager = new NavigationStateManager(NavigationUtils.logger);

  static validatePath(path: string): PathValidationResult {
    const sanitized = this.sanitizePath(path);
    const segments = sanitizeSegments(sanitized.split('/'));
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let confidence = 1;

    if (path.includes('..')) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: 'Path contains directory traversal sequence',
        suggestion: 'Remove ".." segments or use resolved absolute paths'
      });
      confidence *= 0.2;
    }

    if (/\\/.test(path)) {
      issues.push({
        type: 'format',
        severity: 'medium',
        message: 'Path contains backslashes',
        suggestion: 'Use forward slashes for Templum navigation paths'
      });
      confidence *= 0.7;
    }

    if (!/^\/?[a-zA-Z0-9\-_\/\.]*$/.test(path)) {
      issues.push({
        type: 'format',
        severity: 'medium',
        message: 'Path contains unsupported characters',
        suggestion: 'Restrict paths to alphanumeric characters, hyphens, underscores, slashes, and dots'
      });
      confidence *= 0.6;
    }

    if (segments.length > 5) {
      recommendations.push('Consider simplifying navigation depth for better UX');
      confidence *= 0.9;
    }

    if (segments.length === 0) {
      recommendations.push('Explicitly reference root path "/" for clarity');
    }

    return {
      isValid: issues.length === 0,
      confidence,
      issues,
      sanitizedPath: sanitized,
      recommendations
    };
  }

  static sanitizePath(path: string): string {
    if (!path || path.trim() === '') {
      return '/';
    }

    const trimmed = path.trim();
    const withoutDots = trimmed.replace(/\.\/+/, '/');
    const normalized = withoutDots.replace(/\/+/, '/');
    const segments = sanitizeSegments(normalized.split('/'));
    return `/${segments.join('/')}`;
  }

  static normalizePath(path: string): string {
    let normalized = this.sanitizePath(path);
    if (normalized.endsWith('/') && normalized !== '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  }

  static resolvePath(basePath: string, relativePath: string): string {
    if (!relativePath || relativePath.startsWith('/')) {
      return this.normalizePath(relativePath);
    }
    const baseSegments = sanitizeSegments(this.normalizePath(basePath).split('/'));
    const relativeSegments = sanitizeSegments(relativePath.split('/'));
    const combined = [...baseSegments, ...relativeSegments];
    return this.normalizePath(`/${combined.join('/')}`);
  }

  static createBreadcrumb(path: string, options: BreadcrumbOptions = {}): Breadcrumb {
    const normalizedPath = this.normalizePath(path);
    const segments = sanitizeSegments(normalizedPath.split('/'));
    const label = options.label ?? normalizeLabel(segments[segments.length - 1] ?? '');
    const depth = segments.length;

    let displayLabel = label;
    if (options.truncateAt && displayLabel.length > options.truncateAt) {
      displayLabel = `${displayLabel.slice(0, options.truncateAt)}…`;
    }

    return {
      label: displayLabel,
      path: normalizedPath,
      depth,
      confidence: options.confidence ?? Math.max(0.6, 1 - depth * 0.05),
      metadata: options.metadata
    };
  }

  static buildBreadcrumbs(path: string): Breadcrumb[] {
    const normalized = this.normalizePath(path);
    const segments = sanitizeSegments(normalized.split('/'));
    const breadcrumbs: Breadcrumb[] = [];

    if (segments.length === 0) {
      return [this.createBreadcrumb('/')];
    }

    let current = '';
    for (const segment of segments) {
      current += `/${segment}`;
      breadcrumbs.push(this.createBreadcrumb(current));
    }

    return this.optimizeBreadcrumbs(breadcrumbs);
  }

  static optimizeBreadcrumbs(breadcrumbs: Breadcrumb[]): Breadcrumb[] {
    if (breadcrumbs.length <= 5) {
      return breadcrumbs;
    }

    const optimized: Breadcrumb[] = [];
    optimized.push(breadcrumbs[0]);
    for (let i = 1; i < breadcrumbs.length - 1; i += 2) {
      optimized.push(breadcrumbs[i]);
    }
    optimized.push(breadcrumbs[breadcrumbs.length - 1]);

    return optimized;
  }

  static calculateBreadcrumbDepth(path: string): number {
    return sanitizeSegments(this.normalizePath(path).split('/')).length;
  }

  static validateBreadcrumbChain(breadcrumbs: Breadcrumb[]): ActionValidationResult {
    if (breadcrumbs.length === 0) {
      return {
        isValid: false,
        canExecute: false,
        confidence: 0,
        warnings: ['Breadcrumb chain is empty'],
        suggestions: ['Ensure at least a root breadcrumb exists']
      };
    }

    const warnings: string[] = [];
    let isValid = true;

    for (let i = 1; i < breadcrumbs.length; i++) {
      const current = breadcrumbs[i];
      const previous = breadcrumbs[i - 1];
      if (!current.path.startsWith(previous.path)) {
        isValid = false;
        warnings.push(`Breadcrumb ${current.label} is not nested under ${previous.label}`);
      }
    }

    return {
      isValid,
      canExecute: isValid,
      confidence: isValid ? 0.95 : 0.4,
      warnings,
      suggestions: isValid ? [] : ['Inspect breadcrumb generation order']
    };
  }

  static calculateNavigationConfidence(context: NavigationContext): ConfidenceScore {
    const state = this.manager.getState();
    const validation = this.validatePath(state.currentPath);
    const historyDepth = Math.min(state.history.length, 10);

    const pathSecurity = validation.confidence;
    const intentScore = context.userIntent === 'browse' ? 0.95 : 0.85;
    const sessionConsistency = historyDepth === 0 ? 0.8 : Math.min(1, historyDepth / 5);

    const navigationHistory = Math.min(1, historyDepth / 8);
    const contextRelevance = (pathSecurity * 0.5) + (intentScore * 0.3) + (sessionConsistency * 0.2);
    const overall = (pathSecurity * 0.5) + (contextRelevance * 0.3) + (navigationHistory * 0.2);

    return {
      overall,
      breakdown: {
        overall,
        pathValidation: pathSecurity,
        contextRelevance,
        navigationHistory,
        factors: {
          pathSecurity,
          userIntent: intentScore,
          sessionConsistency
        }
      }
    };
  }

  static validateNavigationAction(action: NavigationAction): ActionValidationResult {
    const state = this.manager.getState();
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let isValid = true;

    if (action.type === 'back' && state.history.length < 2) {
      isValid = false;
      warnings.push('No previous history entry available');
      suggestions.push('Ensure history tracking is enabled before using back navigation');
    }

    if (action.type === 'forward') {
      warnings.push('Forward navigation is not tracked explicitly; consider using navigate');
    }

    const confidence = isValid ? 0.9 : 0.4;

    return {
      isValid,
      canExecute: isValid,
      confidence,
      warnings,
      suggestions
    };
  }

  static assessPathSafety(path: string): SafetyAssessment {
    const validation = this.validatePath(path);
    const concerns = validation.issues.map(issue => issue.message);
    let riskLevel: SafetyAssessment['riskLevel'] = 'low';

    if (validation.issues.some(issue => issue.severity === 'critical')) {
      riskLevel = 'critical';
    } else if (validation.issues.some(issue => issue.severity === 'high')) {
      riskLevel = 'high';
    } else if (validation.issues.some(issue => issue.severity === 'medium')) {
      riskLevel = 'medium';
    }

    return {
      isSafe: validation.issues.length === 0,
      riskLevel,
      concerns,
      recommendations: validation.recommendations
    };
  }

  static async navigate(request: NavigationRequest): Promise<NavigationResult> {
    const context: NavigationContext = request.context ?? {
      userIntent: 'browse'
    };

    if (request.action && request.action.type !== 'navigate') {
      const actionValidation = this.validateNavigationAction(request.action);
      if (!actionValidation.canExecute && !request.force) {
        return {
          success: false,
          path: this.manager.getState().currentPath,
          normalizedPath: this.manager.getState().currentPath,
          validation: this.validatePath(this.manager.getState().currentPath),
          confidence: this.calculateNavigationConfidence(context),
          breadcrumbs: this.manager.getState().breadcrumbs,
          suggestions: [...actionValidation.suggestions, ...actionValidation.warnings]
        };
      }
      this.manager.handleAction(request.action);
    }

    const validation = this.validatePath(request.path);
    const normalizedPath = this.normalizePath(validation.sanitizedPath ?? request.path);
    const safety = this.assessPathSafety(normalizedPath);

    if (!validation.isValid && !request.force) {
      this.logger.warn('Navigation blocked due to validation failure', {
        path: request.path,
        issues: validation.issues
      });
      return {
        success: false,
        path: request.path,
        normalizedPath,
        validation,
        confidence: this.calculateNavigationConfidence({ ...context, userIntent: 'browse' }),
        breadcrumbs: this.manager.getState().breadcrumbs,
        suggestions: [...validation.recommendations, ...safety.recommendations]
      };
    }

    const state = this.manager.update(normalizedPath, {
      ...context,
      previousPath: this.manager.getState().currentPath
    });

    const confidence = this.calculateNavigationConfidence(context);

    return {
      success: true,
      path: request.path,
      normalizedPath,
      validation,
      confidence,
      breadcrumbs: state.breadcrumbs,
      suggestions: [...validation.recommendations, ...safety.recommendations]
    };
  }

  static getNavigationState(): NavigationState {
    return this.manager.getState();
  }

  static resetNavigationState(): NavigationState {
    return this.manager.reset();
  }
}

export const {
  validatePath,
  sanitizePath,
  normalizePath,
  resolvePath,
  createBreadcrumb,
  buildBreadcrumbs,
  optimizeBreadcrumbs,
  calculateBreadcrumbDepth,
  validateBreadcrumbChain,
  calculateNavigationConfidence,
  validateNavigationAction,
  assessPathSafety,
  navigate,
  getNavigationState,
  resetNavigationState
} = NavigationUtils;

