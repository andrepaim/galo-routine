const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  // Today screen
  await page.goto('http://localhost:8081/?dev=child', { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'test-screenshots/app-today-latest.png' });
  
  // Table screen  
  await page.goto('http://localhost:8081/table?dev=child', { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'test-screenshots/app-table-latest.png' });
  
  // Trophies screen
  await page.goto('http://localhost:8081/trophies?dev=child', { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'test-screenshots/app-trophies-latest.png' });
  
  console.log('All screenshots saved!');
  await browser.close();
})();
