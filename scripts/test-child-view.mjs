#!/usr/bin/env node
/**
 * Test Child View with Galo theme
 * Logs in and screenshots the child view
 */

import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, '..', 'test-screenshots');

// Test credentials - should exist from previous testing
const TEST_EMAIL = 'test@star-routine.app';
const TEST_PASSWORD = 'testpass123';
const CHILD_PIN = '1234';

async function test() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 }); // iPhone 14 size
  
  console.log('Navigating to app...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2000);
  
  // Screenshot login page
  await page.screenshot({ 
    path: join(SCREENSHOTS_DIR, 'galo-01-login.png'), 
    fullPage: false 
  });
  console.log('Screenshot: login page');

  // Try to login as parent first
  try {
    console.log('Attempting login...');
    
    // Find and fill email
    const emailInput = await page.$('input[type="text"], input[placeholder*="Email"], input[placeholder*="email"]');
    if (emailInput) {
      await emailInput.type(TEST_EMAIL);
    }
    
    // Find and fill password
    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      await passInput.type(TEST_PASSWORD);
    }
    
    await sleep(500);
    
    // Screenshot with filled form
    await page.screenshot({ 
      path: join(SCREENSHOTS_DIR, 'galo-02-login-filled.png'), 
      fullPage: false 
    });
    
    // Click login button
    const loginBtn = await page.$('button:has-text("Log In"), button:has-text("Login"), button');
    if (loginBtn) {
      await loginBtn.click();
    }
    
    await sleep(3000);
    
    // Screenshot whatever page we land on
    await page.screenshot({ 
      path: join(SCREENSHOTS_DIR, 'galo-03-after-login.png'), 
      fullPage: false 
    });
    console.log('Screenshot: after login attempt');
    
  } catch (e) {
    console.log('Login failed:', e.message);
  }

  // Try direct navigation to child route
  console.log('Trying direct child route...');
  await page.goto('http://localhost:8081/(child)', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2000);
  
  await page.screenshot({ 
    path: join(SCREENSHOTS_DIR, 'galo-04-child-direct.png'), 
    fullPage: false 
  });
  console.log('Screenshot: direct child route');
  
  // Try child/tasks
  await page.goto('http://localhost:8081/(child)/tasks', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2000);
  
  await page.screenshot({ 
    path: join(SCREENSHOTS_DIR, 'galo-05-child-tasks.png'), 
    fullPage: false 
  });
  console.log('Screenshot: child tasks');
  
  await browser.close();
  console.log('\nDone! Check test-screenshots/');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

test().catch(console.error);
