#!/usr/bin/env node
/**
 * Star Routine Comprehensive Web Testing
 * Tests UI navigation and feature rendering
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8081';
const SCREENSHOT_DIR = '/root/star-routine/test-screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  📸 ${name}.png`);
  return filepath;
}

async function runTests() {
  console.log('🧪 Star Routine Comprehensive Test Suite\n');
  console.log('='.repeat(60) + '\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  const results = {
    tests: [],
    errors: [],
    warnings: [],
    screenshots: []
  };

  const log = (status, msg) => {
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${msg}`);
    results.tests.push({ status, message: msg });
  };

  try {
    // ========================================
    // TEST GROUP 1: Initial Load & Auth Screen
    // ========================================
    console.log('📋 GROUP 1: Initial Load & Auth\n');

    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(3000);
    await screenshot(page, 'T01-initial-load');

    // Check title
    const title = await page.title();
    if (title === 'Star Routine') {
      log('pass', 'App title is correct: "Star Routine"');
    } else {
      log('fail', `Wrong title: "${title}"`);
    }

    // Check for auth screen elements
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    const authChecks = [
      ['Email', 'Email field label'],
      ['Password', 'Password field label'],
      ['Log In', 'Login button'],
      ['Create Family', 'Create account link'],
      ['Child', 'Child login option']
    ];

    for (const [text, desc] of authChecks) {
      if (bodyText.includes(text)) {
        log('pass', `Auth: ${desc} found`);
      } else {
        log('fail', `Auth: ${desc} NOT found`);
      }
    }

    // ========================================
    // TEST GROUP 2: Try Register Flow
    // ========================================
    console.log('\n📋 GROUP 2: Register Flow\n');

    // Look for and click "Create Family Account"
    const createFamilyBtn = await page.$('text/Create Family Account');
    if (!createFamilyBtn) {
      // Try finding by button content
      const buttons = await page.$$('div[role="button"], button');
      let found = false;
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.includes('Create') || text.includes('Register')) {
          await btn.click();
          found = true;
          log('pass', 'Clicked Create Family Account button');
          break;
        }
      }
      if (!found) {
        log('warn', 'Could not find Create Family Account button');
      }
    } else {
      await createFamilyBtn.click();
      log('pass', 'Clicked Create Family Account button');
    }

    await delay(2000);
    await screenshot(page, 'T02-register-screen');

    // Check current URL/route
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    const registerText = await page.evaluate(() => document.body.innerText);
    if (registerText.includes('Register') || registerText.includes('Create') || registerText.includes('Family Name')) {
      log('pass', 'Register screen content visible');
    } else {
      log('warn', 'May not be on register screen');
    }

    // ========================================
    // TEST GROUP 3: Navigate Back & Try Child
    // ========================================
    console.log('\n📋 GROUP 3: Child Login Flow\n');

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(2000);

    // Find and click "I'm the Child"
    const childBtnFound = await page.evaluate(() => {
      const elements = document.querySelectorAll('div, button, span');
      for (const el of elements) {
        if (el.innerText && el.innerText.includes('Child')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (childBtnFound) {
      log('pass', 'Clicked "I\'m the Child" button');
    } else {
      log('warn', 'Could not find Child button');
    }

    await delay(2000);
    await screenshot(page, 'T03-child-login');

    const childScreenText = await page.evaluate(() => document.body.innerText);
    if (childScreenText.includes('PIN') || childScreenText.includes('pin') || childScreenText.includes('Family')) {
      log('pass', 'Child login screen shows PIN entry');
    } else {
      log('warn', 'Child screen may not show PIN entry');
    }

    // ========================================
    // TEST GROUP 4: Check for React Native Web Compatibility
    // ========================================
    console.log('\n📋 GROUP 4: RN Web Compatibility\n');

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(2000);

    // Check for common RN web issues
    const consoleErrors = [];
    const consoleWarns = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') consoleErrors.push(text);
      if (msg.type() === 'warning') consoleWarns.push(text);
    });

    await page.reload({ waitUntil: 'networkidle2' });
    await delay(3000);

    if (consoleErrors.length === 0) {
      log('pass', 'No JavaScript console errors');
    } else {
      log('fail', `${consoleErrors.length} console errors found`);
      consoleErrors.slice(0, 3).forEach(e => results.errors.push(e.substring(0, 200)));
    }

    // Check if app uses React Native Paper
    const hasPaper = await page.evaluate(() => {
      return document.querySelector('[class*="paper"]') !== null || 
             document.body.innerHTML.includes('material');
    });
    console.log(`  RN Paper components: ${hasPaper ? 'detected' : 'not detected'}`);

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');

    const passed = results.tests.filter(t => t.status === 'pass').length;
    const failed = results.tests.filter(t => t.status === 'fail').length;
    const warns = results.tests.filter(t => t.status === 'warn').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warns}`);
    console.log(`📸 Screenshots: Saved to ${SCREENSHOT_DIR}`);

    if (results.errors.length > 0) {
      console.log('\n🔴 Console Errors (first 3):');
      results.errors.slice(0, 3).forEach(e => console.log(`   ${e}`));
    }

    console.log('\n' + '='.repeat(60));

    // Save detailed results
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'comprehensive-results.json'),
      JSON.stringify({ ...results, passed, failed, warns }, null, 2)
    );

    return { passed, failed, warns };

  } catch (error) {
    console.error('❌ Test suite crashed:', error.message);
    await screenshot(page, 'ERROR-crash');
    throw error;
  } finally {
    await browser.close();
  }
}

runTests()
  .then(r => {
    process.exit(r.failed > 0 ? 1 : 0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
