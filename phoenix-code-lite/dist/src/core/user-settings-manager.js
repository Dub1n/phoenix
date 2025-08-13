"use strict";
/**---
 * title: [User Settings Manager - Core Service Module]
 * tags: [Core, Service, Settings, Persistence]
 * provides: [UserSettingsManager Class, Settings Load/Save, Version Reset, Mode Preferences]
 * requires: [fs, path, chalk]
 * description: [Manages persistent per-user CLI preferences with version-aware resets, mode selection, and preference updates for consistent UX.]
 * ---*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingsManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class UserSettingsManager {
    constructor(currentVersion = '1.0.0') {
        this.currentVersion = currentVersion;
        this.settingsPath = path_1.default.join(process.cwd(), '.phoenix-settings.json');
        this.settings = this.getDefaultSettings();
    }
    /**
     * Initialize settings - load from file or create defaults
     */
    async initialize() {
        try {
            await this.loadSettings();
            // Check if version has changed and reset if needed
            if (this.settings.version !== this.currentVersion) {
                console.log(chalk_1.default.yellow(`⋇ Version changed from ${this.settings.version} to ${this.currentVersion}`));
                console.log(chalk_1.default.yellow('⇔ Resetting user settings to defaults'));
                this.settings = this.getDefaultSettings();
                await this.saveSettings();
                console.log(chalk_1.default.green('✓ Settings reset for new version'));
            }
            return true;
        }
        catch (error) {
            console.error(chalk_1.default.red('✗ Failed to initialize user settings:'), error);
            return false;
        }
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }
    /**
     * Get interaction mode
     */
    getInteractionMode() {
        return this.settings.interactionMode;
    }
    /**
     * Set interaction mode
     */
    async setInteractionMode(mode) {
        try {
            this.settings.interactionMode = mode;
            this.settings.debugMode = mode === 'debug';
            this.settings.lastModified = new Date().toISOString();
            await this.saveSettings();
            console.log(chalk_1.default.green(`✓ Interaction mode set to: ${mode}`));
            return true;
        }
        catch (error) {
            console.error(chalk_1.default.red('✗ Failed to set interaction mode:'), error);
            return false;
        }
    }
    /**
     * Update specific setting
     */
    async updateSetting(key, value) {
        try {
            this.settings[key] = value;
            this.settings.lastModified = new Date().toISOString();
            await this.saveSettings();
            return true;
        }
        catch (error) {
            console.error(chalk_1.default.red(`✗ Failed to update setting ${String(key)}:`), error);
            return false;
        }
    }
    /**
     * Update preference setting
     */
    async updatePreference(key, value) {
        try {
            this.settings.preferences[key] = value;
            this.settings.lastModified = new Date().toISOString();
            await this.saveSettings();
            return true;
        }
        catch (error) {
            console.error(chalk_1.default.red(`✗ Failed to update preference ${String(key)}:`), error);
            return false;
        }
    }
    /**
     * Reset settings to defaults
     */
    async resetToDefaults() {
        try {
            this.settings = this.getDefaultSettings();
            await this.saveSettings();
            console.log(chalk_1.default.green('✓ Settings reset to defaults'));
            return true;
        }
        catch (error) {
            console.error(chalk_1.default.red('✗ Failed to reset settings:'), error);
            return false;
        }
    }
    /**
     * Get settings file path
     */
    getSettingsPath() {
        return this.settingsPath;
    }
    /**
     * Check if settings file exists
     */
    settingsFileExists() {
        return fs_1.default.existsSync(this.settingsPath);
    }
    /**
     * Display current settings
     */
    displaySettings() {
        console.log(chalk_1.default.blue.bold('\n⋇ Current User Settings'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.yellow('Core Settings:'));
        console.log(`  Version: ${this.settings.version}`);
        console.log(`  Interaction Mode: ${chalk_1.default.green(this.settings.interactionMode)}`);
        console.log(`  Debug Mode: ${this.settings.debugMode ? chalk_1.default.green('enabled') : chalk_1.default.gray('disabled')}`);
        console.log(`  Last Modified: ${this.settings.lastModified}`);
        console.log(chalk_1.default.yellow('\nPreferences:'));
        console.log(`  Show Welcome: ${this.settings.preferences.showWelcome ? 'yes' : 'no'}`);
        console.log(`  Auto Save: ${this.settings.preferences.autoSave ? 'yes' : 'no'}`);
        console.log(`  Color Scheme: ${this.settings.preferences.colorScheme}`);
        console.log(`  Prompt Timeout: ${this.settings.preferences.promptTimeout}ms`);
        console.log(chalk_1.default.gray(`\nSettings file: ${this.settingsPath}`));
        console.log(chalk_1.default.gray('═'.repeat(50)));
    }
    /**
     * Get default settings
     */
    getDefaultSettings() {
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
    async loadSettings() {
        if (!this.settingsFileExists()) {
            console.log(chalk_1.default.yellow('⋇ No settings file found, creating defaults'));
            this.settings = this.getDefaultSettings();
            await this.saveSettings();
            return;
        }
        try {
            const settingsData = fs_1.default.readFileSync(this.settingsPath, 'utf-8');
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
        }
        catch (error) {
            console.log(chalk_1.default.red('✗ Failed to parse settings file, using defaults'));
            this.settings = this.getDefaultSettings();
            await this.saveSettings();
        }
    }
    /**
     * Save settings to file
     */
    async saveSettings() {
        try {
            const settingsData = JSON.stringify(this.settings, null, 2);
            fs_1.default.writeFileSync(this.settingsPath, settingsData, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get available interaction modes
     */
    static getAvailableInteractionModes() {
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
exports.UserSettingsManager = UserSettingsManager;
//# sourceMappingURL=user-settings-manager.js.map