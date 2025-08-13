/**---
 * title: [Config Formatter - Human-Readable Configuration Output]
 * tags: [CLI, Utility, Formatting, Configuration]
 * provides: [ConfigFormatter Class, Section Formatting, Value Rendering]
 * requires: [chalk, PhoenixCodeLiteConfigData]
 * description: [Formats Phoenix Code Lite configuration into readable sections and items with colorized output suitable for CLI display.]
 * ---*/
import { PhoenixCodeLiteConfigData } from '../config/settings';
export declare class ConfigFormatter {
    private static formatValue;
    private static humanizeKey;
    private static formatSection;
    static formatConfig(config: PhoenixCodeLiteConfigData): string;
    static formatConfigSummary(config: PhoenixCodeLiteConfigData): string;
}
//# sourceMappingURL=config-formatter.d.ts.map