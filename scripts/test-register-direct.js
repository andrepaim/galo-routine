#!/usr/bin/env node
/**
 * Test registration by navigating directly to /register
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8081';
const SCREENSHOT_DIR = '/root/star-routine/test-screenshots';

const TEST_EMAIL = `test-${Date.now()}@starroutine.test`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_PARENT_NAME = 'Test Parent';
const TEST_CHILD_NAME = 'Test Child';
const TEST_PIN = '123456';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  📸 ${name}.png`);
}

async function test() {
  console.log('🔐 Direct Register Test\n');
  console.log(`📧 ${TEST_EMAIL}`);
  console.log(`👨 ${TEST_PARENT_NAME} | 👶 ${TEST_CHILD_NAME}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Capture errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log(`  [Error] ${msg.text().substring(0, 80)}`);
    }
  });

  try {
    // Go directly to register
    console.log('📋 Step 1: Navigate to /register\n');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);
    await screenshot(page, 'REG-01-register-page');

    const inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
    console.log(`  ✅ Register page loaded with ${inputCount} inputs\n`);

    // Fill form using tab navigation (more reliable)
    console.log('📋 Step 2: Fill registration form\n');

    // Get all inputs
    const inputs = await page.$$('input');
    console.log(`  Found ${inputs.length} input elements`);

    // Fill in order: parentName, childName, email, password, pin
    const values = [TEST_PARENT_NAME, TEST_CHILD_NAME, TEST_EMAIL, TEST_PASSWORD, TEST_PIN];
    
    for (let i = 0; i < Math.min(inputs.length, values.length); i++) {
      await inputs[i].click();
      await inputs[i].type(values[i], { delay: 20 });
      console.log(`  ✅ Filled field ${i + 1}: ${values[i].substring(0, 20)}...`);
      await delay(200);
    }

    await screenshot(page, 'REG-02-form-filled');

    // Submit
    console.log('\n📋 Step 3: Submit registration\n');
    
    const submitClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
      for (const btn of buttons) {
        if (btn.innerText && btn.innerText.includes('Create Family')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (submitClicked) {
      console.log('  ✅ Clicked submit button');
    } else {
      console.log('  ⚠️ Submit button not found, trying Enter');
      await page.keyboard.press('Enter');
    }

    // Wait for Firebase
    console.log('  ⏳ Waiting 8 seconds for Firebase...');
    await delay(8000);
    await screenshot(page, 'REG-03-after-submit');

    // Check result
    const finalUrl = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText);

    console.log(`\n📋 Step 4: Check results\n`);
    console.log(`  Final URL: ${finalUrl}`);

    if (bodyText.toLowerCase().includes('error')) {
      // Extract error message
      const errorLines = bodyText.split('\n').filter(l => l.toLowerCase().includes('error'));
      console.log(`  ❌ Error detected: ${errorLines[0] || 'unknown'}`);
    } else if (finalUrl.includes('parent')) {
      console.log('  🎉 SUCCESS! Registered and redirected to parent view!');
      await screenshot(page, 'REG-04-parent-home');
      
      // Test parent features
      console.log('\n📋 Step 5: Test parent features\n');
      
      // Check what's visible
      console.log(`  Content preview: ${bodyText.substring(0, 200).replace(/\n/g, ' ')}`);
      
      // Navigate to tasks
      await page.goto(`${BASE_URL}/(parent)/tasks`, { waitUntil: 'networkidle2' });
      await delay(2000);
      await screenshot(page, 'REG-05-tasks');
      const tasksContent = await page.evaluate(() => document.body.innerText);
      console.log(`  Tasks page: ${tasksContent.substring(0, 100).replace(/\n/g, ' ')}...`);

    } else {
      console.log(`  ⚠️ Unclear result. Content: ${bodyText.substring(0, 200).replace(/\n/g, ' ')}`);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    console.log(`Console errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.slice(0, 3).forEach(e => console.log(`  - ${e.substring(0, 80)}`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await screenshot(page, 'REG-ERROR');
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
