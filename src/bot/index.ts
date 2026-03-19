import { Bot } from 'grammy';
import { config, isUserAllowed } from '../config/index.js';
import { runAgentLoop } from '../agent/index.js';

export const bot = new Bot(config.telegramBotToken);

bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId || !isUserAllowed(userId)) {
        console.log(`Unauthorized access attempt from user ID: ${userId}`);
        return;
    }
    await next();
});

bot.command("start", async (ctx) => {
    await ctx.reply("Hello! I am afak kids one bot, your personal AI agent.");
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

        // Telegram max message length is 4096
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
