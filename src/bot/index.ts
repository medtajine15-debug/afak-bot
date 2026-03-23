import { Bot, InputFile } from 'grammy';
import { config, isUserAllowed } from '../config/index.js';
import { runAgentLoop } from '../agent/index.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. تعريف البوت
export const bot = new Bot(config.telegramBotToken);

// 2. إعداد الذكاء الاصطناعي
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 3. التحقق من المستخدم (Security)
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId || !isUserAllowed(userId)) {
        return;
    }
    await next();
});

// 4. أمر البداية
bot.command("start", async (ctx) => {
    await ctx.reply("أهلاً بك في بوت AFAK الذكي! 🚀\nاستخدم /draw متبوعاً بوصف لرسم صورة فورية.");
});

// 5. ميزة الرسم الحقيقية (التي كانت ترسل نصاً وأصلحناها لتكون صورة)
bot.command("draw", async (ctx) => {
    const prompt = ctx.match;
    if (!prompt) {
        return ctx.reply("أرجوك اكتب وصفاً للصورة بعد الأمر، مثلاً:\n/draw مدينة قالمة في المستقبل");
    }

    try {
        await ctx.replyWithChatAction("upload_photo");

        // تحويل النص إلى رابط صورة مباشر (Nano Banana 2 Style)
        const encodedPrompt = encodeURIComponent(prompt as string);
        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;

        // إرسال الصورة مباشرة للمستخدم
        await ctx.replyWithPhoto(imageUrl, {
            caption: `✨ تم توليد صورتك بنجاح!\n📝 الوصف: ${prompt}`
        });
    } catch (err: any) {
        await ctx.reply(`حدث خطأ أثناء الرسم: ${err.message}`);
    }
});

// 6. المحادثة العادية مع الذكاء الاصطناعي
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

// 7. تشغيل البوت
export async function startBot() {
    console.log("Starting bot...");
    await bot.start({
        onStart: (botInfo) => {
            console.log(`Bot initialized successfully! Handle: @${botInfo.username}`);
        }
    });
}


