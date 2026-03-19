import { getLLMResponse } from './llm.js';
import { memory } from './memory.js';
import { executeTool } from '../tools/index.js';

const MAX_ITERATIONS = 5;

export async function runAgentLoop(userId: number, userMessage: string): Promise<string> {
    // 1. Add user message to memory
    memory.addMessage(userId, { role: 'user', content: userMessage });

    let iterations = 0;
    
    while (iterations < MAX_ITERATIONS) {
        iterations++;
        const history = memory.getHistory(userId);
        
        const responseMessage = await getLLMResponse(
            "You are BaraaClaw, a highly capable personal AI agent running locally. You communicate clearly via Telegram.",
            history
        );

        // Add assistant message to memory
        memory.addMessage(userId, responseMessage);

        // Check if there are tool calls
        if ('tool_calls' in responseMessage && responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            const toolCall = responseMessage.tool_calls[0];
            const functionName = toolCall.function.name;
            const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
            
            console.log(`[Agent] Calling tool ${functionName} with args`, args);
            
            try {
                const result = await executeTool(functionName, args);
                
                // Add tool result to memory
                memory.addMessage(userId, {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: functionName,
                    content: typeof result === 'string' ? result : JSON.stringify(result)
                });
            } catch (err: any) {
                console.error(`[Agent] Error executing tool ${functionName}: ${err.message}`);
                memory.addMessage(userId, {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: functionName,
                    content: `Error: ${err.message}`
                });
            }
            // Loop continues so LLM can process the tool result
        } else {
            // No tool calls, return final response
            return responseMessage.content || "Agent returned an empty response.";
        }
    }

    return "Error: Agent reached maximum iteration limit.";
}
