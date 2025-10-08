import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

import type { Logger } from '../../utils/logger';

export type ServiceFileEvent = 'add' | 'change';

export interface WatchDirectoryResolutionOptions {
  registryPath: string;
  explicitDirectories?: string[];
  cwd: string;
}

export function resolveWatchDirectories(options: WatchDirectoryResolutionOptions): string[] {
  const { registryPath, explicitDirectories, cwd } = options;

  if (explicitDirectories && explicitDirectories.length > 0) {
    return explicitDirectories.filter(Boolean);
  }

  const registryDir = path.dirname(registryPath);
  const workspaceServicesDir = path.join(cwd, '.templum', 'services');
  const siblingServicesDir = path.resolve(cwd, '..', '.templum', 'services');

  const directories = [
    path.join(registryDir, 'services'),
    workspaceServicesDir,
  ];

  if (siblingServicesDir !== workspaceServicesDir) {
    directories.push(siblingServicesDir);
  }

  return Array.from(new Set(directories));
}

export interface ServiceDiscoveryFileWatcherConfig {
  directories: string[];
  logger: Logger;
  onServiceFileChange: (filePath: string, eventType: ServiceFileEvent) => Promise<void>;
  onServiceFileRemoval: (filePath: string) => void;
  onWatcherError: (error: unknown) => void;
  chokidarFactory?: typeof chokidar.watch;
}

export class ServiceDiscoveryFileWatcher {
  private watcher?: chokidar.FSWatcher;

  constructor(private readonly config: ServiceDiscoveryFileWatcherConfig) {}

  start(): void {
    if (this.watcher) {
      return;
    }

    const directories = this.prepareDirectories();

    if (directories.length === 0) {
      this.config.logger.warn('No service directories available for file watching');
      return;
    }

    this.config.logger.info('Watching directories for service descriptors', {
      directories,
    });

    const factory = this.config.chokidarFactory ?? chokidar.watch;
    this.watcher = factory(directories, {
      ignored: /(^|[\\/])\../,
      persistent: true,
      ignoreInitial: true,
      depth: 1,
    });

    this.watcher
      .on('add', (filePath: string) => this.handleServiceFileChange(filePath, 'add'))
      .on('change', (filePath: string) => this.handleServiceFileChange(filePath, 'change'))
      .on('unlink', (filePath: string) => this.handleRemoval(filePath))
      .on('error', (error) => this.handleWatcherError(error));
  }

  async close(): Promise<void> {
    if (!this.watcher) {
      return;
    }

    try {
      await this.watcher.close();
    } finally {
      this.watcher = undefined;
    }
  }

  private prepareDirectories(): string[] {
    const prepared = new Set<string>();

    for (const directory of this.config.directories) {
      if (!directory) {
        continue;
      }

      const resolved = path.resolve(directory);

      if (!fs.existsSync(resolved)) {
        try {
          this.config.logger.info('Creating services directory', { directory: resolved });
          fs.mkdirSync(resolved, { recursive: true });
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error(String(error));
          this.config.logger.error('Unable to create services directory', normalizedError, {
            directory: resolved,
          });
          continue;
        }
      }

      prepared.add(resolved);
    }

    return Array.from(prepared);
  }

  private handleServiceFileChange(filePath: string, eventType: ServiceFileEvent): void {
    if (!filePath.endsWith('.json')) {
      return;
    }

    void this.config.onServiceFileChange(filePath, eventType).catch((error) => {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      this.config.logger.error('Failed to process service file event', normalizedError, {
        filePath,
        eventType,
      });
    });
  }

  private handleRemoval(filePath: string): void {
    if (!filePath.endsWith('.json')) {
      return;
    }

    this.config.onServiceFileRemoval(filePath);
  }

  private handleWatcherError(error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.config.logger.error('File watching error', normalizedError);
    this.config.onWatcherError(error);
  }
}
