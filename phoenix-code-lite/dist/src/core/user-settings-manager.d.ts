/**---
 * title: [User Settings Manager - Core Service Module]
 * tags: [Core, Service, Settings, Persistence]
 * provides: [UserSettingsManager Class, Settings Load/Save, Version Reset, Mode Preferences]
 * requires: [fs, path, chalk]
 * description: [Manages persistent per-user CLI preferences with version-aware resets, mode selection, and preference updates for consistent UX.]
 * ---*/
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
export declare class UserSettingsManager {
    private settingsPath;
    private currentVersion;
    private settings;
    constructor(currentVersion?: string);
    /**
     * Initialize settings - load from file or create defaults
     */
    initialize(): Promise<boolean>;
    /**
     * Get current settings
     */
    getSettings(): UserSettings;
    /**
     * Get interaction mode
     */
    getInteractionMode(): 'interactive' | 'command' | 'debug';
    /**
     * Set interaction mode
     */
    setInteractionMode(mode: 'interactive' | 'command' | 'debug'): Promise<boolean>;
    /**
     * Update specific setting
     */
    updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<boolean>;
    /**
     * Update preference setting
     */
    updatePreference<K extends keyof UserSettings['preferences']>(key: K, value: UserSettings['preferences'][K]): Promise<boolean>;
    /**
     * Reset settings to defaults
     */
    resetToDefaults(): Promise<boolean>;
    /**
     * Get settings file path
     */
    getSettingsPath(): string;
    /**
     * Check if settings file exists
     */
    settingsFileExists(): boolean;
    /**
     * Display current settings
     */
    displaySettings(): void;
    /**
     * Get default settings
     */
    private getDefaultSettings;
    /**
     * Load settings from file
     */
    private loadSettings;
    /**
     * Save settings to file
     */
    private saveSettings;
    /**
     * Get available interaction modes
     */
    static getAvailableInteractionModes(): Array<{
        mode: string;
        description: string;
    }>;
}
//# sourceMappingURL=user-settings-manager.d.ts.map