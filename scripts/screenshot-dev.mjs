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
  
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000)); // Let redirects and animations settle
  
  const filepath = join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  
  console.log(`Screenshot saved: ${filepath}`);
  await browser.close();
}

screenshot().catch(console.error);
