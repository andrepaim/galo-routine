#!/usr/bin/env node
/**
 * Star Routine Auth & Features Testing v2
 * Properly handles registration with all required fields
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8081';
const SCREENSHOT_DIR = '/root/star-routine/test-screenshots';

// Test credentials
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
  return filepath;
}

// Fill a React Native Paper TextInput by its label text
async function fillInputByLabel(page, labelText, value) {
  const filled = await page.evaluate((label, val) => {
    // RN Paper TextInput renders label as a sibling or child
    // The actual input is usually within the same container
    const allText = document.body.innerText;
    if (!allText.toLowerCase().includes(label.toLowerCase())) {
      return { found: false, reason: 'Label not in page' };
    }

    // Find all inputs
    const inputs = Array.from(document.querySelectorAll('input'));
    
    // Try to match by looking at nearby text/labels
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const parent = input.closest('[class]');
      if (parent) {
        const parentText = parent.innerText || '';
        if (parentText.toLowerCase().includes(label.toLowerCase())) {
          input.focus();
          // Clear existing value
          input.value = '';
          // Set new value
          for (const char of val) {
            input.value += char;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          return { found: true, index: i, parentText: parentText.substring(0, 50) };
        }
      }
    }
    
    // Fallback: try by index based on typical order
    // Register form: parentName, childName, email, password, pin
    const labelOrder = {
      "parent": 0,
      "child's name": 1,
      "child name": 1,
      "email": 2,
      "password": 3,
      "pin": 4
    };
    
    for (const [key, idx] of Object.entries(labelOrder)) {
      if (label.toLowerCase().includes(key) && inputs[idx]) {
        inputs[idx].focus();
        inputs[idx].value = '';
        for (const char of val) {
          inputs[idx].value += char;
          inputs[idx].dispatchEvent(new Event('input', { bubbles: true }));
        }
        return { found: true, index: idx, method: 'fallback-index' };
      }
    }
    
    return { found: false, reason: 'Could not match label to input' };
  }, labelText, value);
  
  return filled;
}

async function clickButton(page, text) {
  const result = await page.evaluate((txt) => {
    const elements = Array.from(document.querySelectorAll('*'));
    for (const el of elements) {
      const elText = el.innerText || '';
      // Check if this element or its parent is clickable
      if (elText.toLowerCase().includes(txt.toLowerCase())) {
        const clickable = el.closest('div[role="button"], button, [data-testid]') || el;
        if (clickable && typeof clickable.click === 'function') {
          clickable.click();
          return { clicked: true, text: elText.substring(0, 50) };
        }
      }
    }
    return { clicked: false };
  }, text);
  return result;
}

async function runTests() {
  console.log('🔐 Star Routine Auth & Features Test v2\n');
  console.log('='.repeat(60) + '\n');
  console.log(`📧 Email: ${TEST_EMAIL}`);
  console.log(`🔑 Password: ${TEST_PASSWORD}`);
  console.log(`👨 Parent: ${TEST_PARENT_NAME}`);
  console.log(`👶 Child: ${TEST_CHILD_NAME}`);
  console.log(`🔢 PIN: ${TEST_PIN}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Capture console
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.log(`  [Error] ${msg.text().substring(0, 100)}`);
    }
  });

  const results = { passed: 0, failed: 0, warnings: 0 };
  const log = (status, msg) => {
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${msg}`);
    results[status === 'pass' ? 'passed' : status === 'fail' ? 'failed' : 'warnings']++;
  };

  try {
    // ========================================
    // STEP 1: Navigate to Register Page
    // ========================================
    console.log('📋 STEP 1: Go to Register Page\n');

    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(2000);
    await screenshot(page, 'V2-01-login-page');

    // Click "Create Family Account"
    const navResult = await clickButton(page, 'Create Family');
    if (navResult.clicked) {
      log('pass', 'Navigated to register page');
    } else {
      log('fail', 'Could not find Create Family Account link');
    }

    await delay(2000);
    await screenshot(page, 'V2-02-register-page');

    // ========================================
    // STEP 2: Analyze Register Form
    // ========================================
    console.log('\n📋 STEP 2: Analyze Register Form\n');

    const formInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const labels = Array.from(document.querySelectorAll('span, div, label'))
        .filter(el => el.innerText && el.innerText.length < 50)
        .map(el => el.innerText);
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button'))
        .map(el => el.innerText);
      return {
        inputCount: inputs.length,
        inputTypes: inputs.map(i => i.type),
        possibleLabels: [...new Set(labels)].slice(0, 20),
        buttons: buttons.filter(b => b && b.length < 50)
      };
    });

    console.log(`  Found ${formInfo.inputCount} input fields`);
    console.log(`  Input types: ${formInfo.inputTypes.join(', ')}`);
    console.log(`  Possible labels: ${formInfo.possibleLabels.slice(0, 10).join(', ')}`);
    console.log(`  Buttons: ${formInfo.buttons.join(', ')}`);

    if (formInfo.inputCount >= 5) {
      log('pass', `Register form has ${formInfo.inputCount} inputs (expected 5+)`);
    } else if (formInfo.inputCount >= 2) {
      log('warn', `Only ${formInfo.inputCount} inputs found - might be login page still`);
    } else {
      log('fail', 'No input fields found');
    }

    // ========================================
    // STEP 3: Fill Registration Form
    // ========================================
    console.log('\n📋 STEP 3: Fill Registration Form\n');

    // Fill each field
    const fields = [
      ['Parent', TEST_PARENT_NAME],
      ['Child', TEST_CHILD_NAME],
      ['Email', TEST_EMAIL],
      ['Password', TEST_PASSWORD],
      ['PIN', TEST_PIN]
    ];

    for (const [label, value] of fields) {
      const result = await fillInputByLabel(page, label, value);
      if (result.found) {
        log('pass', `Filled "${label}" field`);
      } else {
        log('warn', `Could not fill "${label}": ${result.reason}`);
      }
      await delay(300);
    }

    await screenshot(page, 'V2-03-form-filled');

    // ========================================
    // STEP 4: Submit Registration
    // ========================================
    console.log('\n📋 STEP 4: Submit Registration\n');

    const submitResult = await clickButton(page, 'Create Family Account');
    if (submitResult.clicked) {
      log('pass', 'Clicked submit button');
    } else {
      // Try alternatives
      const altSubmit = await clickButton(page, 'Register') || await clickButton(page, 'Create');
      if (altSubmit && altSubmit.clicked) {
        log('pass', 'Clicked alternative submit button');
      } else {
        log('warn', 'Could not find submit button');
      }
    }

    // Wait for Firebase registration
    console.log('  Waiting for registration (5s)...');
    await delay(5000);
    await screenshot(page, 'V2-04-after-submit');

    // Check result
    const currentUrl = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`  Current URL: ${currentUrl}`);

    // Check for errors
    if (bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('failed')) {
      const errorMatch = bodyText.match(/error[:\s]+([^\n]+)/i);
      log('fail', `Registration error: ${errorMatch ? errorMatch[1].substring(0, 100) : 'unknown'}`);
    } else if (currentUrl.includes('parent') || currentUrl.includes('(parent)')) {
      log('pass', '🎉 Registration successful! Redirected to parent view');
    } else if (currentUrl.includes('login')) {
      log('warn', 'Still on login page - registration may have failed silently');
    } else {
      log('warn', `Unknown state: URL = ${currentUrl}`);
    }

    // ========================================
    // STEP 5: Test Parent Dashboard (if logged in)
    // ========================================
    console.log('\n📋 STEP 5: Test Parent Dashboard\n');

    // Try navigating to parent routes
    const parentRoutes = [
      ['/(parent)/home', 'Home'],
      ['/(parent)/tasks', 'Tasks'],
      ['/(parent)/rewards', 'Rewards'],
      ['/(parent)/approvals', 'Approvals'],
      ['/(parent)/settings', 'Settings']
    ];

    for (const [route, name] of parentRoutes) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 10000 });
        await delay(1000);
        
        const pageUrl = page.url();
        const hasContent = await page.evaluate(() => document.body.innerText.length > 100);
        
        if (pageUrl.includes('login') || pageUrl.includes('auth')) {
          log('warn', `${name}: Redirected to login (not authenticated)`);
        } else if (hasContent) {
          log('pass', `${name}: Page loads with content`);
          await screenshot(page, `V2-05-parent-${name.toLowerCase()}`);
        } else {
          log('warn', `${name}: Page loads but empty`);
        }
      } catch (e) {
        log('fail', `${name}: Error - ${e.message.substring(0, 50)}`);
      }
    }

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    
    if (consoleLogs.filter(l => l.type === 'error').length > 0) {
      console.log('\n🔴 Console Errors:');
      consoleLogs.filter(l => l.type === 'error').slice(0, 5).forEach(l => 
        console.log(`   ${l.text.substring(0, 100)}`)
      );
    }

    console.log('\n' + '='.repeat(60));

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'auth-test-v2-results.json'),
      JSON.stringify({ ...results, consoleLogs: consoleLogs.slice(-20) }, null, 2)
    );

    return results;

  } catch (error) {
    console.error('❌ Test crashed:', error.message);
    await screenshot(page, 'V2-ERROR').catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
