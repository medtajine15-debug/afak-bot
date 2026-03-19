import dotenv from 'dotenv';
dotenv.config();

function getEnv(key: string, required = true): string {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Environment variable ${key} is required.`);
    }
    return value || '';
}

export const config = {
    telegramBotToken: getEnv('TELEGRAM_BOT_TOKEN'),
    groqApiKey: getEnv('GROQ_API_KEY'),
    geminiApiKey: getEnv('GEMINI_API_KEY'),
    dbPath: getEnv('DB_PATH', false) || './memory.db',
    allowedUserIds: getEnv('ALLOWED_USER_IDS', false).split(',').map(id => id.trim()).filter(id => id),
};

export function isUserAllowed(userId: number): boolean {
    if (config.allowedUserIds.length === 0) {
        console.warn("WARNING: No ALLOWED_USER_IDS provided. Bot will reject all users for security.");
        return false;
    }
    return config.allowedUserIds.includes(userId.toString());
}
