import { startBot } from './bot/index.js';

async function main() {
    try {
        await startBot();
    } catch (err) {
        console.error("Fatal error starting application:", err);
        process.exit(1);
    }
}

main();
