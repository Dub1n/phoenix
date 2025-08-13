/**---
 * title: [User Settings Manager - Core Service Module]
 * tags: [Core, Service, Settings, Persistence]
 * provides: [UserSettingsManager Class, Settings Load/Save, Version Reset, Mode Preferences]
 * requires: [fs, path, chalk]
 * description: [Manages persistent per-user CLI preferences with version-aware resets, mode selection, and preference updates for consistent UX.]
 * ---*/

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface UserSettings {
  version: string;
  interactionMode: 'interactive' | 'command' | 'debug';
  debugMode: boolean;
  lastModified: string;
  preferences: {
    showWelcome: boolean;
    autoSave: boolean;
    colorScheme: 'default' | 'dark' | 'light';
    promptTimeout: number;
  };
}

export class UserSettingsManager {
  private settingsPath: string;
  private currentVersion: string;
  private settings: UserSettings;

  constructor(currentVersion: string = '1.0.0') {
    this.currentVersion = currentVersion;
    this.settingsPath = path.join(process.cwd(), '.phoenix-settings.json');
    this.settings = this.getDefaultSettings();
  }

  /**
   * Initialize settings - load from file or create defaults
   */
  async initialize(): Promise<boolean> {
    try {
      await this.loadSettings();
      
      // Check if version has changed and reset if needed
      if (this.settings.version !== this.currentVersion) {
        console.log(chalk.yellow(`⋇ Version changed from ${this.settings.version} to ${this.currentVersion}`));
        console.log(chalk.yellow('⇔ Resetting user settings to defaults'));
        
        this.settings = this.getDefaultSettings();
        await this.saveSettings();
        
        console.log(chalk.green('✓ Settings reset for new version'));
      }
      
      return true;
    } catch (error) {
      console.error(chalk.red('✗ Failed to initialize user settings:'), error);
      return false;
    }
  }

  /**
   * Get current settings
   */
  getSettings(): UserSettings {
    return { ...this.settings };
  }

  /**
   * Get interaction mode
   */
  getInteractionMode(): 'interactive' | 'command' | 'debug' {
    return this.settings.interactionMode;
  }

  /**
   * Set interaction mode
   */
  async setInteractionMode(mode: 'interactive' | 'command' | 'debug'): Promise<boolean> {
    try {
      this.settings.interactionMode = mode;
      this.settings.debugMode = mode === 'debug';
      this.settings.lastModified = new Date().toISOString();
      
      await this.saveSettings();
      
      console.log(chalk.green(`✓ Interaction mode set to: ${mode}`));
      return true;
    } catch (error) {
      console.error(chalk.red('✗ Failed to set interaction mode:'), error);
      return false;
    }
  }

  /**
   * Update specific setting
   */
  async updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<boolean> {
    try {
      this.settings[key] = value;
      this.settings.lastModified = new Date().toISOString();
      
      await this.saveSettings();
      return true;
    } catch (error) {
      console.error(chalk.red(`✗ Failed to update setting ${String(key)}:`), error);
      return false;
    }
  }

  /**
   * Update preference setting
   */
  async updatePreference<K extends keyof UserSettings['preferences']>(
    key: K, 
    value: UserSettings['preferences'][K]
  ): Promise<boolean> {
    try {
      this.settings.preferences[key] = value;
      this.settings.lastModified = new Date().toISOString();
      
      await this.saveSettings();
      return true;
    } catch (error) {
      console.error(chalk.red(`✗ Failed to update preference ${String(key)}:`), error);
      return false;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<boolean> {
    try {
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
      
      console.log(chalk.green('✓ Settings reset to defaults'));
      return true;
    } catch (error) {
      console.error(chalk.red('✗ Failed to reset settings:'), error);
      return false;
    }
  }

  /**
   * Get settings file path
   */
  getSettingsPath(): string {
    return this.settingsPath;
  }

  /**
   * Check if settings file exists
   */
  settingsFileExists(): boolean {
    return fs.existsSync(this.settingsPath);
  }

  /**
   * Display current settings
   */
  displaySettings(): void {
    console.log(chalk.blue.bold('\n⋇ Current User Settings'));
    console.log(chalk.gray('═'.repeat(50)));
    
    console.log(chalk.yellow('Core Settings:'));
    console.log(`  Version: ${this.settings.version}`);
    console.log(`  Interaction Mode: ${chalk.green(this.settings.interactionMode)}`);
    console.log(`  Debug Mode: ${this.settings.debugMode ? chalk.green('enabled') : chalk.gray('disabled')}`);
    console.log(`  Last Modified: ${this.settings.lastModified}`);
    
    console.log(chalk.yellow('\nPreferences:'));
    console.log(`  Show Welcome: ${this.settings.preferences.showWelcome ? 'yes' : 'no'}`);
    console.log(`  Auto Save: ${this.settings.preferences.autoSave ? 'yes' : 'no'}`);
    console.log(`  Color Scheme: ${this.settings.preferences.colorScheme}`);
    console.log(`  Prompt Timeout: ${this.settings.preferences.promptTimeout}ms`);
    
    console.log(chalk.gray(`\nSettings file: ${this.settingsPath}`));
    console.log(chalk.gray('═'.repeat(50)));
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): UserSettings {
    return {
      version: this.currentVersion,
      interactionMode: 'debug', // Default to debug mode as requested
      debugMode: true,
      lastModified: new Date().toISOString(),
      preferences: {
        showWelcome: true,
        autoSave: true,
        colorScheme: 'default',
        promptTimeout: 30000
      }
    };
  }

  /**
   * Load settings from file
   */
  private async loadSettings(): Promise<void> {
    if (!this.settingsFileExists()) {
      console.log(chalk.yellow('⋇ No settings file found, creating defaults'));
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
      return;
    }

    try {
      const settingsData = fs.readFileSync(this.settingsPath, 'utf-8');
      const parsedSettings = JSON.parse(settingsData);
      
      // Merge with defaults to ensure all properties exist
      this.settings = {
        ...this.getDefaultSettings(),
        ...parsedSettings,
        preferences: {
          ...this.getDefaultSettings().preferences,
          ...parsedSettings.preferences
        }
      };
      
    } catch (error) {
      console.log(chalk.red('✗ Failed to parse settings file, using defaults'));
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
    }
  }

  /**
   * Save settings to file
   */
  private async saveSettings(): Promise<void> {
    try {
      const settingsData = JSON.stringify(this.settings, null, 2);
      fs.writeFileSync(this.settingsPath, settingsData, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available interaction modes
   */
  static getAvailableInteractionModes(): Array<{mode: string; description: string}> {
    return [
      {
        mode: 'debug',
        description: 'Debug mode with verbose output and comprehensive logging (default)'
      },
      {
        mode: 'interactive', 
        description: 'Interactive navigation with numbered menus and arrow keys'
      },
      {
        mode: 'command',
        description: 'Command-line interface with text input and completion'
      }
    ];
  }
}
