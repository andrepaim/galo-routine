#!/usr/bin/env node
/**
 * Star Routine Web Testing Script
 * Uses Puppeteer to navigate and screenshot the Expo web app
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8081';
const SCREENSHOT_DIR = '/root/star-routine/test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${name}.png`);
  return filepath;
}

async function testApp() {
  console.log('🚀 Starting Star Routine Web Test Suite\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 }); // iPhone 14 Pro size
  
  const results = {
    passed: [],
    failed: [],
    screenshots: []
  };

  try {
    // Test 1: App loads
    console.log('📋 Test 1: App loads...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(3000); // Wait for React to hydrate
    
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    const screenshot = await takeScreenshot(page, '01-initial-load');
    results.screenshots.push(screenshot);
    
    // Check if app rendered
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`   Body text preview: ${bodyText.substring(0, 200)}...`);
    
    if (bodyText.includes('error') || bodyText.includes('Error')) {
      results.failed.push('App Load: Contains error message');
      console.log('   ❌ App shows error\n');
    } else {
      results.passed.push('App Load');
      console.log('   ✅ App loads without obvious errors\n');
    }

    // Test 2: Check for login/auth screen
    console.log('📋 Test 2: Auth screen...');
    await delay(2000);
    await takeScreenshot(page, '02-auth-screen');
    
    // Look for auth elements
    const pageContent = await page.content();
    const hasLogin = pageContent.toLowerCase().includes('login') || 
                     pageContent.toLowerCase().includes('sign in') ||
                     pageContent.toLowerCase().includes('email');
    
    if (hasLogin) {
      results.passed.push('Auth Screen Visible');
      console.log('   ✅ Auth screen elements found\n');
    } else {
      console.log('   ⚠️  No obvious auth elements - might be showing different screen\n');
    }

    // Test 3: Check console for errors
    console.log('📋 Test 3: Console errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(3000);
    
    if (consoleErrors.length > 0) {
      console.log(`   ⚠️  ${consoleErrors.length} console errors found:`);
      consoleErrors.slice(0, 5).forEach(e => console.log(`      - ${e.substring(0, 100)}`));
      results.failed.push(`Console Errors: ${consoleErrors.length} errors`);
    } else {
      results.passed.push('No Console Errors');
      console.log('   ✅ No console errors\n');
    }

    // Final screenshot
    await takeScreenshot(page, '03-final-state');

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    results.failed.push(`Suite Error: ${error.message}`);
    await takeScreenshot(page, 'error-state').catch(() => {});
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach(t => console.log(`   - ${t}`));
  console.log(`❌ Failed: ${results.failed.length}`);
  results.failed.forEach(t => console.log(`   - ${t}`));
  console.log(`📸 Screenshots: ${results.screenshots.length}`);
  console.log('='.repeat(50));

  // Save results
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'test-results.json'),
    JSON.stringify(results, null, 2)
  );

  return results;
}

testApp().catch(console.error);
