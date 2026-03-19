import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { toolsDefinitions } from '../tools/index.js';

const groq = new Groq({ apiKey: config.groqApiKey });
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function getLLMResponse(systemPrompt: string, conversationHistory: any[]) {
    try {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
        ];
        
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages as any,
            tools: toolsDefinitions as any,
            tool_choice: "auto",
        });

        return response.choices[0].message;
    } catch (error) {
        console.error("Groq API Error:", error);
        
        try {
            console.log("Attempting Gemini fallback...");
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); 
            const chatContext = conversationHistory.map((m: any) => {
                if (m.role === 'assistant' && m.tool_calls) {
                    return `assistant: [called tool ${m.tool_calls[0].function.name}]`;
                }
                if (m.role === 'tool') {
                    return `tool_result: ${m.content}`;
                }
                return `${m.role}: ${m.content}`;
            }).join('\n');
            const finalPrompt = `${systemPrompt}\n\nConversation history:\n${chatContext}\n\nAssistant:`;
            
            const result = await model.generateContent(finalPrompt);
            return {
                role: 'assistant',
                content: result.response.text(),
            };
        } catch (geminiError) {
            console.error("Gemini Fallback Error:", geminiError);
            throw new Error("Both Groq and Gemini APIs failed.");
        }
    }
}
