import { Bot, InputFile } from 'grammy';
import { config, isUserAllowed } from '../config/index.js';
import { runAgentLoop } from '../agent/index.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const bot = new Bot(config.telegramBotToken);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId || !isUserAllowed(userId)) {
        return;
    }
    await next();
});

bot.command("start", async (ctx) => {
    await ctx.reply("أهلاً بك! أنا بوت AFAK الذكي.\nاستخدم /draw متبوعاً بوصف لرسم صورة.");
});

// ميزة توليد الصور السريعة (Nano Banana 2)
bot.command("draw", async (ctx) => {
    const prompt = ctx.match;
    if (!prompt) {
        return ctx.reply("أرجوك اكتب وصفاً للصورة بعد الأمر، مثلاً:\n/draw مدينة قالمة في المستقبل");
    }

    try {
        await ctx.replyWithChatAction("upload_photo");
        const encodedPrompt = encodeURIComponent(prompt as string);
        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;

        await ctx.replyWithPhoto(imageUrl, {
            caption: `✨ تم توليد صورتك بنجاح!\n📝 الوصف: ${prompt}`
        });
    } catch (err: any) {
        await ctx.reply(`حدث خطأ أثناء الرسم: ${err.message}`);
    }
});

bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;
    try {
        await ctx.replyWithChatAction("typing");
        const reply = await runAgentLoop(userId, text);
        await ctx.reply(reply);
    } catch (err: any) {
        await ctx.reply(`حدث خطأ: ${err.message}`);
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
