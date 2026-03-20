import { Bot, InputFile } from 'grammy';
import { config, isUserAllowed } from '../config/index.js';
import { runAgentLoop } from '../agent/index.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const bot = new Bot(config.telegramBotToken);

// إعداد الذكاء الاصطناعي للصور (تأكد من إضافة GEMINI_API_KEY في Render)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId || !isUserAllowed(userId)) {
        console.log(`Unauthorized access attempt from user ID: ${userId}`);
        return;
    }
    await next();
});

bot.command("start", async (ctx) => {
    await ctx.reply("Hello! I am afak kids one bot, your personal AI agent.\n\nاستخدم أمر /draw متبوعاً بوصف لرسم صورة!");
});

// ميزة توليد الصور الجديدة (Nano Banana 2)
bot.command("draw", async (ctx) => {
    const prompt = ctx.match;

    if (!prompt) {
        return ctx.reply("أرجوك اكتب وصفاً للصورة بعد الأمر، مثلاً:\n/draw فضاء رقمي بأسلوب فني");
    }

    try {
        await ctx.replyWithChatAction("upload_photo");

        // استدعاء موديل الصور Gemini 3 Flash Image
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-image" });

        const result = await model.generateContent(prompt);
        const response = await result.response;

        // استخراج الصورة بصيغة Base64
        const imagePart = response.candidates?.[0].content.parts[0].inlineData;

        if (imagePart) {
            const buffer = Buffer.from(imagePart.data, 'base64');
            // إرسال الصورة باستخدام InputFile الخاص بـ grammy
            await ctx.replyWithPhoto(new InputFile(buffer), {
                caption: `تم توليد صورتك بناءً على: ${prompt}`
            });
        } else {
            await ctx.reply("للأسف لم أستطع توليد الصورة، جرب وصفاً آخر.");
        }
    } catch (err: any) {
        console.error("Error in drawing:", err);
        await ctx.reply(`حدث خطأ أثناء الرسم: ${err.message}`);
    }
});

bot.command("clear", async (ctx) => {
    const userId = ctx.from?.id;
    if (userId) {
        const { memory } = await import('../agent/memory.js');
        memory.clearHistory(userId);
        await ctx.reply("Agent memory cleared.");
    }
});

bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;

    try {
        await ctx.replyWithChatAction("typing");
        const reply = await runAgentLoop(userId, text);

        if (reply.length > 4000) {
            await ctx.reply(reply.substring(0, 4000) + "...\n\n(Message truncated)");
        } else {
            await ctx.reply(reply);
        }
    } catch (err: any) {
        console.error("Error processing message:", err);
        await ctx.reply(`An error occurred: ${err.message}`);
    }
});

export async function startBot() {
    console.log("Starting bot...");
    await bot.start({
        onStart: (botInfo) => {
            console.log(`Bot initialized successfully! Handle: @${botInfo.username}`);
        }
    });
}