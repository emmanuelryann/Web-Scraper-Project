import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());


// Scraper Engine
async function scrapeKeyword(url, keyword, filterType) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2' });

    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('application/pdf')) {
      throw new Error('This is a PDF file. Scraper only supports HTML webpages.');
    }

    if (!response.ok()) {
      throw new Error(`Website returned error code: ${response.status()}`);
    }

    const pageText = await page.evaluate(() => {
      const root = document.querySelector('main') ||
                   document.querySelector('article') ||
                   document.body;
      if (!root) return '';
      return root.innerText;
    });

    if (!pageText) return { matches: [], keyword };

    const matches = findMatches(pageText, keyword, filterType);

    return { matches, keyword };
  } finally {
    await browser.close();
  }
}


// Text Matching Helpers
function findMatches(text, keyword, filterType) {
  if (!keyword || !keyword.trim()) return [];

  if (filterType === 'paragraph') {
    return extractParagraphs(text, keyword);
  }
  return extractSentences(text, keyword);
}

function extractSentences(text, keyword) {
  const parts = text.split(/([.!?]+[\s]+|[.!?]+$)/g);

  const sentences = [];
  for (let i = 0; i < parts.length; i += 2) {
    let sentence = (parts[i] || '').trim();
    const punct = (parts[i + 1] || '').trim();
    if (punct) sentence += punct;
    if (sentence) sentences.push(sentence);
  }

  const keywordLower = keyword.toLowerCase();
  return sentences.filter(s => s.toLowerCase().includes(keywordLower));
}


// Paragraph Mode
function extractParagraphs(text, keyword) {
  const paragraphs = text.split(/\n{2,}/g)
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);

  const keywordLower = keyword.toLowerCase();
  return paragraphs.filter(p => p.toLowerCase().includes(keywordLower));
}


// API Route
app.post('/api/scrape', async (req, res) => {
  const { url, keyword, filterType } = req.body;
  console.log(`📩 [new-engine] Request received  |  URL: ${url}  |  Keyword: "${keyword}"  |  Filter: ${filterType}`);

  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }
  if (!keyword || !keyword.trim()) {
    return res.status(400).json({ error: 'Keyword is required.' });
  }

  try {
    const data = await scrapeKeyword(url, keyword, filterType || 'sentence');
    console.log(`✅ [new-engine] Done – ${data.matches.length} match(es) found.`);
    res.json(data);
  } catch (err) {
    console.error('❌ [new-engine] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// Start Server
const PORT = 8081;
app.listen(PORT, () => {
  console.log(`🚀 [new-engine] Scraper Backend live at http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => console.error('🔥 [new-engine] System Error:', err));
process.on('unhandledRejection', (reason) => console.error('🔥 [new-engine] Promise Error:', reason));