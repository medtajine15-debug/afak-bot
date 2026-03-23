import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const imageGenTool = new DynamicStructuredTool({
    name: "image_generator",
    description: "Generates an image from a prompt",
    schema: z.object({
        prompt: z.string().describe("The description of the image"),
    }),
    func: async ({ prompt }) => {
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=42`;
        return `IMAGE_URL:${imageUrl}`;
    },
});