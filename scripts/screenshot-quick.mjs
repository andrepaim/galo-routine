#!/usr/bin/env node
import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, '..', 'test-screenshots');

const route = process.argv[2] || '?dev=child';
const filename = process.argv[3] || `galo-${Date.now()}.png`;

async function screenshot() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  const url = `http://localhost:8081/${route}`;
  console.log(`Navigating to ${url}...`);
  
  // Don't wait for network idle - just wait for load + timer
  await page.goto(url, { waitUntil: 'load', timeout: 15000 });
  console.log('Page loaded, waiting for render...');
  await new Promise(r => setTimeout(r, 8000));
  
  const filepath = join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  
  console.log(`Screenshot saved: ${filepath}`);
  await browser.close();
}

screenshot().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
