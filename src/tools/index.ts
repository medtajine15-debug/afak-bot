import { getCurrentTime, getCurrentTimeDefinition } from './getCurrentTime.js';

export const toolsDefinitions = [getCurrentTimeDefinition];

export async function executeTool(toolName: string, args: any): Promise<any> {
    switch (toolName) {
        case 'get_current_time':
            return getCurrentTime();
        default:
            throw new Error(`Tool ${toolName} not found.`);
    }
}
export * from "./imageGen.js";