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
  
  // Tab positions (390px wide = ~49px per tab, bottom ~820px)
  const tabY = 820;
  
  // === CHILD VIEW ===
  console.log('=== CHILD VIEW ===');
  await page.goto('http://localhost:8081/?dev=child', { waitUntil: 'load', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'v3-child-today.png') });
  console.log('Saved child today');
  
  // Child tabs: Hoje(65), Tarefas(130), Estrelas(195), Loja(260), Medalhas(325), Perfil(390)
  // Click Tarefas
  await page.mouse.click(130, tabY);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'v3-child-tasks.png') });
  console.log('Saved child tasks');
  
  // Click Loja
  await page.mouse.click(260, tabY);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'v3-child-shop.png') });
  console.log('Saved child shop');
  
  // Click Medalhas
  await page.mouse.click(325, tabY);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'v3-child-badges.png') });
  console.log('Saved child badges');
  
  // === PARENT VIEW ===
  console.log('=== PARENT VIEW ===');
  await page.goto('http://localhost:8081/?dev=parent', { waitUntil: 'load', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'v3-parent-home.png') });
  console.log('Saved parent home');
  
  // Parent tabs: Início(24), Taref(73), Prêm(122), Aprov(171), Perío(220), Metas(268), Relat(317), Config(366)
  // Click Tarefas
  await page.mouse.click(73, tabY);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'v3-parent-tasks.png') });
  console.log('Saved parent tasks');
  
  // Click Aprovar
  await page.mouse.click(171, tabY);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'v3-parent-approve.png') });
  console.log('Saved parent approve');
  
  // Click Períodos
  await page.mouse.click(220, tabY);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'v3-parent-periods.png') });
  console.log('Saved parent periods');
  
  // Click Config
  await page.mouse.click(366, tabY);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'v3-parent-config.png') });
  console.log('Saved parent config');
  
  await browser.close();
  console.log('Done!');
}

screenshot().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
