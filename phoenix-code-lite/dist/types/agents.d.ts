import { z } from 'zod';
export declare const AgentPersonaSchema: z.ZodObject<{
    role: z.ZodString;
    expertise: z.ZodArray<z.ZodString>;
    approach: z.ZodString;
    quality_standards: z.ZodArray<z.ZodString>;
    output_format: z.ZodString;
    systemPrompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AgentPersona = z.infer<typeof AgentPersonaSchema>;
export declare const SpecializedAgentContexts: {
    readonly PLANNING_ANALYST: {
        role: string;
        expertise: string[];
        approach: string;
        quality_standards: string[];
        output_format: string;
        systemPrompt: string;
    };
    readonly IMPLEMENTATION_ENGINEER: {
        role: string;
        expertise: string[];
        approach: string;
        quality_standards: string[];
        output_format: string;
        systemPrompt: string;
    };
    readonly QUALITY_REVIEWER: {
        role: string;
        expertise: string[];
        approach: string;
        quality_standards: string[];
        output_format: string;
        systemPrompt: string;
    };
};
//# sourceMappingURL=agents.d.ts.map