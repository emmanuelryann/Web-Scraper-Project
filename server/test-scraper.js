import puppeteer from 'puppeteer';

async function universalEngine(url, options = { contentType: 'text', keyword: '' }) {
    const browser = await puppeteer.launch(); 
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(60000);

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        let data = {};
        
        // 1. CONTENT SELECTION: Smart Text Extraction
        if (options.contentType === 'text' || options.contentType === 'both') {
            const rawText = await page.evaluate(() => {
                const mainContent = document.querySelector('main') || 
                                   document.querySelector('article') || 
                                   document.querySelector('body');
                return mainContent ? mainContent.innerText : "";
            });
            
            if (options.keyword) {
                const sentences = rawText.split(/[.!?\n]+/);
                data.matches = sentences
                    .map(s => s.trim())
                    .filter(s => s.toLowerCase().includes(options.keyword.toLowerCase()));
            } else {
                data.fullText = rawText.substring(0, 1000);
            }
        }

        // 3. ENHANCED IMAGE FINDER
        if (options.contentType === 'images' || options.contentType === 'both') {
            data.images = await page.evaluate(() => {
                const imageSet = new Set();
                
                // Find standard <img> tags
                document.querySelectorAll('img').forEach(img => {
                    if (img.src) imageSet.add(img.src);
                });

                // Find background images in computed styles
                document.querySelectorAll('*').forEach(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    if (bg && bg !== 'none' && bg.includes('url')) {
                        const url = bg.match(/url\(["']?([^"']*)["']?\)/)?.[1];
                        if (url) imageSet.add(url);
                    }
                });

                return Array.from(imageSet);
            });
        }

        return data;

    } catch (error) {
        console.error("Engine Error:", error);
    } finally {
        await browser.close();
    }
}

// TEST RUN
(async () => {
    const results = await universalEngine('https://developer.mozilla.org/en-US/docs/Web/JavaScript', {
        contentType: 'both',
        keyword: 'prototype'
    });

    console.log("--- UPDATED SCRAPE RESULTS ---");
    console.log("Keyword Matches Found:", results.matches ? results.matches.length : 0);
    console.log("First Match:", results.matches?.[0]);
    console.log("Images Found (including backgrounds):", results.images ? results.images.length : 0);
    // Log first 3 images to see the variety
    if(results.images) console.log("Sample Images:", results.images.slice(0, 3));
})();