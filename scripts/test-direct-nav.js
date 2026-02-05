#!/usr/bin/env node
/**
 * Test direct navigation to register page
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:8081';

async function test() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Capture navigation
  page.on('console', msg => {
    if (msg.text().includes('navigation') || msg.text().includes('route')) {
      console.log(`[Console] ${msg.text()}`);
    }
  });

  console.log('Testing different register routes...\n');

  const routes = [
    '/register',
    '/(auth)/register',
    '/auth/register',
    '/(auth)',
  ];

  for (const route of routes) {
    console.log(`\n--- Testing: ${route} ---`);
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 10000 });
      const url = page.url();
      const inputs = await page.evaluate(() => document.querySelectorAll('input').length);
      const text = await page.evaluate(() => document.body.innerText.substring(0, 200));
      
      console.log(`  Final URL: ${url}`);
      console.log(`  Input count: ${inputs}`);
      console.log(`  Content preview: ${text.replace(/\n/g, ' ').substring(0, 100)}...`);
      
      if (inputs >= 5) {
        console.log('  ✅ FOUND REGISTER PAGE!');
        await page.screenshot({ path: `/root/star-routine/test-screenshots/FOUND-register-${route.replace(/\//g, '_')}.png` });
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }

  // Also test clicking the button and logging what happens
  console.log('\n--- Testing button click navigation ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  
  // Add navigation listener
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log(`  Navigated to: ${frame.url()}`);
    }
  });

  // Find and click the button
  const clicked = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    for (const el of elements) {
      if (el.innerText && el.innerText.includes('Create Family Account')) {
        console.log('Found button, clicking...');
        el.click();
        return true;
      }
    }
    return false;
  });

  console.log(`  Button clicked: ${clicked}`);
  
  // Wait for any navigation
  await new Promise(r => setTimeout(r, 3000));
  
  const finalUrl = page.url();
  const finalInputs = await page.evaluate(() => document.querySelectorAll('input').length);
  console.log(`  Final URL after click: ${finalUrl}`);
  console.log(`  Input count: ${finalInputs}`);

  await browser.close();
}

test().catch(console.error);
