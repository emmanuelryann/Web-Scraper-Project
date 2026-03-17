import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json()); // Allows the server to read JSON from the frontend

async function universalEngine(url, options) {
    const browser = await puppeteer.launch({ headless: "new" }); // "new" is production-ready
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const data = await page.evaluate((opts) => {
            const results = {};
            const container = document.querySelector('main') || document.querySelector('article') || document.querySelector('body');
            
            if (opts.contentType === 'text' || opts.contentType === 'both') {
                const rawText = container ? container.innerText : "";
                const sentences = rawText.split(/[.!?\n]+/);
                results.matches = sentences
                    .map(s => s.trim())
                    .filter(s => s.toLowerCase().includes(opts.keyword.toLowerCase()));
            }

            if (opts.contentType === 'images' || opts.contentType === 'both') {
                results.images = Array.from(document.querySelectorAll('img')).map(img => img.src);
            }
            return results;
        }, options);

        return data;
    } finally {
        await browser.close();
    }
}

// THE API ROUTE
app.post('/api/scrape', async (req, res) => {
    const { url, keyword, contentType } = req.body;
    console.log(`📩 Request received! URL: ${url}, Keyword: ${keyword}`); // NEW LINE

    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        console.log("🚀 Launching Browser..."); // NEW LINE
        const data = await universalEngine(url, { keyword, contentType });
        console.log("✅ Scrape Successful! Sending data back..."); // NEW LINE
        res.json(data);
    } catch (error) {
        console.error("❌ API Route Error:", error); // NEW LINE
        res.status(500).json({ error: "Scraping failed", details: error.message });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`--- SERVER STARTED ---`);
    console.log(`Listening on: http://localhost:${PORT}`);
    console.log(`To stop the server: Press CTRL + C`);
    console.log(`-----------------------`);
});

setInterval(() => {}, 1000);

process.on('uncaughtException', (err) => {
    console.error('🔥 CRASH DETECTED:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION:', reason);
});