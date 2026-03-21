import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

async function universalEngine(url, options) {
    const { keyword, contentType, filterType } = options;
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    try {
        const response = await page.goto(url, { waitUntil: 'networkidle2' });
        
        const serverType = response.headers()['content-type'] || '';
        if (serverType.includes('application/pdf')) {
            throw new Error("This is a PDF file. Scraper only supports HTML webpages.");
        }
        if (!response.ok()) {
            throw new Error(`Website returned error code: ${response.status()}`);
        }

        const data = await page.evaluate((opts) => {
            const results = { matches: [], images: [], keyword: opts.keyword };
            const container = document.querySelector('main, article, body');
            if (!container) return results;

            if (opts.contentType === 'text' || opts.contentType === 'both') {
                const keywordLower = opts.keyword.toLowerCase();
                
                if (opts.filterType === 'paragraph') {
                    const paragraphs = Array.from(container.querySelectorAll('p, div, li'));
                    results.matches = paragraphs
                        .filter(p => p.innerText.toLowerCase().includes(keywordLower))
                        .map(p => p.innerText.trim());
                } else {
                    const rawText = container.innerText;
                    const sentenceRegex = new RegExp(`[^.!?\\n]*\\b${opts.keyword}\\b[^.!?\\n]*[.!?]`, 'gi');
                    const matches = rawText.match(sentenceRegex);
                    results.matches = matches ? matches.map(s => s.trim()) : [];
                }
            }

            if (opts.contentType === 'images' || opts.contentType === 'both') {
                results.images = Array.from(document.querySelectorAll('img')).map(img => img.src);
            }
            return results;
        }, { keyword, contentType, filterType });

        return data;
    } finally {
        await browser.close();
    }
}

// THE API ROUTE
app.post('/api/scrape', async (req, res) => {
    const { url, keyword, contentType, filterType } = req.body;
    console.log(`📩 Request received! URL: ${url}, Keyword: ${keyword}`);

    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        console.log(`🔎 Scraping: ${url}`);
        const data = await universalEngine(url, { keyword, contentType, filterType });
        console.log("✅ Scrape Successful! Sending data back...");
        res.json(data);
    } catch (error) {
        console.error("❌ API Route Error:", error);
        res.status(500).json({ error: "Scraping failed", details: error.message });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`🚀 Scraper Backend live at http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => console.error('🔥 System Error:', err));
process.on('unhandledRejection', (reason) => console.error('🔥 Promise Error:', reason));