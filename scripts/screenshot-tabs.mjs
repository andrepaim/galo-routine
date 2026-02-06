#!/usr/bin/env node
import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, '..', 'test-screenshots');

async function screenshot() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  // Start with dev=parent
  console.log('Loading parent view...');
  await page.goto('http://localhost:8081/?dev=parent', { waitUntil: 'load', timeout: 15000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // Tab positions (8 tabs, 390px wide = ~49px per tab, bottom of screen ~820px)
  // Tabs: Início(24), Taref(73), Prêm(122), Aprov(171), Perío(220), Metas(268), Relat(317), Config(366)
  const tabY = 820;
  
  // Click Períodos tab (5th tab from left)
  console.log('Clicking Períodos tab...');
  await page.mouse.click(220, tabY);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'periods-v2.png'), fullPage: false });
  console.log('Saved periods-v2.png');
  
  // Click Config tab (last tab)
  console.log('Clicking Config tab...');
  await page.mouse.click(366, tabY);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'config-v2.png'), fullPage: false });
  console.log('Saved config-v2.png');
  
  await browser.close();
  console.log('Done!');
}

screenshot().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
