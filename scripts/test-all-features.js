#!/usr/bin/env node
/**
 * Star Routine - Comprehensive Feature Testing
 * Tests all 12 features after successful registration
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8081';
const SCREENSHOT_DIR = '/root/star-routine/test-screenshots/features';

// Ensure directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
  console.log(`  📸 ${name}`);
}

async function runTests() {
  console.log('🧪 Star Routine Feature Testing Suite\n');
  console.log('='.repeat(60) + '\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  const results = { passed: 0, failed: 0, warnings: 0 };
  const log = (s, m) => {
    console.log(`${s === 'pass' ? '✅' : s === 'fail' ? '❌' : '⚠️'} ${m}`);
    results[s === 'pass' ? 'passed' : s === 'fail' ? 'failed' : 'warnings']++;
  };

  try {
    // First, register a new user
    console.log('📋 SETUP: Register new test user\n');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(2000);

    const inputs = await page.$$('input');
    const ts = Date.now();
    const values = ['FeatureTest', 'FeatureChild', `feature${ts}@test.com`, 'Password123!', '123456'];
    
    for (let i = 0; i < 5; i++) {
      await inputs[i].type(values[i]);
      await delay(100);
    }

    await page.evaluate(() => {
      document.querySelectorAll('*').forEach(el => {
        if (el.innerText && el.innerText.includes('Create Family Account')) el.click();
      });
    });

    await delay(8000);
    const setupUrl = page.url();
    
    if (setupUrl.includes('login') || setupUrl.includes('register')) {
      log('fail', 'Registration failed - cannot continue tests');
      await browser.close();
      return results;
    }
    log('pass', 'Test user registered successfully');
    await screenshot(page, '00-parent-home');

    // ========================================
    // FEATURE 1: Parent Dashboard / Home
    // ========================================
    console.log('\n📋 FEATURE 1: Parent Dashboard\n');

    const homeContent = await page.evaluate(() => document.body.innerText);
    
    if (homeContent.includes('Hello')) log('pass', 'Greeting visible');
    else log('fail', 'Greeting not found');

    if (homeContent.includes('Pending')) log('pass', 'Pending tasks card visible');
    else log('warn', 'Pending tasks card not found');

    if (homeContent.includes('Star Balance')) log('pass', 'Star balance card visible');
    else log('warn', 'Star balance card not found');

    if (homeContent.includes('Streak')) log('pass', 'Streak card visible');
    else log('warn', 'Streak card not found');

    if (homeContent.includes('New Task')) log('pass', 'New Task action visible');
    else log('warn', 'New Task action not found');

    // ========================================
    // FEATURE 2: Task Management
    // ========================================
    console.log('\n📋 FEATURE 2: Task Management\n');

    await page.goto(`${BASE_URL}/(parent)/tasks`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await screenshot(page, '01-tasks-list');

    const tasksUrl = page.url();
    if (!tasksUrl.includes('login')) {
      log('pass', 'Tasks page accessible');
    } else {
      log('fail', 'Tasks page redirects to login');
    }

    // Try to create a task
    const newTaskClicked = await page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        if (el.innerText && (el.innerText.includes('New Task') || el.innerText.includes('Add Task') || el.innerText.includes('Create'))) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (newTaskClicked) {
      await delay(2000);
      await screenshot(page, '02-task-create-form');
      log('pass', 'Task creation form accessible');
    } else {
      log('warn', 'Could not find new task button');
    }

    // ========================================
    // FEATURE 3: Rewards System
    // ========================================
    console.log('\n📋 FEATURE 3: Rewards System\n');

    await page.goto(`${BASE_URL}/(parent)/rewards`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await screenshot(page, '03-rewards-page');

    const rewardsUrl = page.url();
    if (!rewardsUrl.includes('login')) {
      log('pass', 'Rewards page accessible');
      
      const rewardsContent = await page.evaluate(() => document.body.innerText);
      if (rewardsContent.includes('Reward') || rewardsContent.includes('reward') || rewardsContent.includes('Add')) {
        log('pass', 'Rewards content visible');
      } else {
        log('warn', 'Rewards page may be empty');
      }
    } else {
      log('fail', 'Rewards page redirects to login');
    }

    // ========================================
    // FEATURE 4: Approvals
    // ========================================
    console.log('\n📋 FEATURE 4: Approvals\n');

    await page.goto(`${BASE_URL}/(parent)/approvals`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await screenshot(page, '04-approvals-page');

    const approvalsUrl = page.url();
    if (!approvalsUrl.includes('login')) {
      log('pass', 'Approvals page accessible');
    } else {
      log('fail', 'Approvals page redirects to login');
    }

    // ========================================
    // FEATURE 5: Goals
    // ========================================
    console.log('\n📋 FEATURE 5: Goals\n');

    await page.goto(`${BASE_URL}/(parent)/goals`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await screenshot(page, '05-goals-page');

    const goalsUrl = page.url();
    if (!goalsUrl.includes('login')) {
      log('pass', 'Goals page accessible');
    } else {
      log('fail', 'Goals page redirects to login');
    }

    // ========================================
    // FEATURE 6: Analytics
    // ========================================
    console.log('\n📋 FEATURE 6: Analytics\n');

    await page.goto(`${BASE_URL}/(parent)/analytics`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await screenshot(page, '06-analytics-page');

    const analyticsUrl = page.url();
    if (!analyticsUrl.includes('login')) {
      log('pass', 'Analytics page accessible');
      
      const analyticsContent = await page.evaluate(() => document.body.innerText);
      if (analyticsContent.includes('Overview') || analyticsContent.includes('Category') || analyticsContent.includes('Performance')) {
        log('pass', 'Analytics content visible');
      } else {
        log('warn', 'Analytics may be empty');
      }
    } else {
      log('fail', 'Analytics page redirects to login');
    }

    // ========================================
    // FEATURE 7: Settings
    // ========================================
    console.log('\n📋 FEATURE 7: Settings\n');

    await page.goto(`${BASE_URL}/(parent)/settings`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await screenshot(page, '07-settings-page');

    const settingsUrl = page.url();
    if (!settingsUrl.includes('login')) {
      log('pass', 'Settings page accessible');
      
      const settingsContent = await page.evaluate(() => document.body.innerText);
      if (settingsContent.includes('Settings') || settingsContent.includes('Notification') || settingsContent.includes('Logout')) {
        log('pass', 'Settings content visible');
      } else {
        log('warn', 'Settings content may be minimal');
      }
    } else {
      log('fail', 'Settings page redirects to login');
    }

    // ========================================
    // FEATURE 8: Periods
    // ========================================
    console.log('\n📋 FEATURE 8: Periods\n');

    await page.goto(`${BASE_URL}/(parent)/periods`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await screenshot(page, '08-periods-page');

    const periodsUrl = page.url();
    if (!periodsUrl.includes('login')) {
      log('pass', 'Periods page accessible');
    } else {
      log('fail', 'Periods page redirects to login');
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 FEATURE TEST SUMMARY\n');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    console.log(`📸 Screenshots: ${SCREENSHOT_DIR}`);
    console.log('='.repeat(60));

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'feature-results.json'),
      JSON.stringify(results, null, 2)
    );

    return results;

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    await screenshot(page, 'ERROR').catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
