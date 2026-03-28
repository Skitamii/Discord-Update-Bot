import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
loadData();

function loadData() {
    console.log("Setup files...");
    const dataFolder = `${__dirname}/../data`;
    const feedFile = `${dataFolder}/feeds.json`;
    const subscriptionFile = `${dataFolder}/subscriptions.json`;
    try {
        if (!fs.existsSync(dataFolder)) { fs.mkdirSync(dataFolder); }
        if (!fs.existsSync(feedFile)) { fs.writeFileSync(feedFile, "{}"); }
        if (!fs.existsSync(subscriptionFile)) { fs.writeFileSync(subscriptionFile, "{}"); }
        console.log("Setup files END");
    } catch (error) {
        console.log("Error to creating files");
    }
}