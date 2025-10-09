const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

async function translateTexts(texts, target='th') {
  const resp = await fetch('https://libretranslate.de/translate', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({q:texts, source:'auto', target: target, format:'text'})
  });
  const data = await resp.json();
  if (Array.isArray(data)) return data.map(d=>d.translatedText ?? d);
  if (data.translatedText) return [data.translatedText];
  return texts;
}

(async () => {
  const url = process.argv[2];
  const target = process.argv[3] || 'th';
  if (!url) { console.error('Usage: node translate-site.js <url> [target]'); process.exit(1); }
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const texts = await page.evaluate(() => {
    function walk(root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: node => node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      });
      const arr = [];
      while(walker.nextNode()) arr.push(walker.currentNode.nodeValue);
      return arr;
    }
    return walk(document.body);
  });

  const batchSize = 30;
  const translatedAll = [];
  for (let i=0;i<texts.length;i+=batchSize) {
    const chunk = texts.slice(i, i+batchSize);
    const translated = await translateTexts(chunk, target);
    translatedAll.push(...translated);
    await new Promise(r => setTimeout(r, 300));
  }
  await page.evaluate((translated) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let i = 0;
    while (walker.nextNode()) {
      walker.currentNode.nodeValue = translated[i++] || walker.currentNode.nodeValue;
    }
  }, translatedAll);

  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('translated.html', html, 'utf8');
  console.log('Saved translated.html');
  await browser.close();
})();
