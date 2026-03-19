// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config/index.js';

export interface ChatMessage {
    id?: number;
    userId: number;
    message: any; // The whole OpenAI-like message object (role, content, tool_calls, etc.)
    timestamp?: string;
}

const db = new DatabaseSync(config.dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

const insertMessageStmt = db.prepare(`
    INSERT INTO messages (userId, message)
    VALUES (?, ?)
`);

const getMessagesStmt = db.prepare(`
    SELECT * FROM messages
    WHERE userId = ?
    ORDER BY timestamp ASC
    LIMIT ?
`);

export const memory = {
    addMessage: (userId: number, messageObj: any) => {
        insertMessageStmt.run(userId, JSON.stringify(messageObj));
    },
    
    getHistory: (userId: number, limit: number = 50): any[] => {
        const rows = getMessagesStmt.all(userId, limit) as any[];
        return rows.map(r => JSON.parse(r.message));
    },

    clearHistory: (userId: number) => {
        db.prepare('DELETE FROM messages WHERE userId = ?').run(userId);
    }
};
