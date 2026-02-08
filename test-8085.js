const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/home/andrepaim/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
  });
  
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERR:', msg.text().substring(0, 100));
  });
  
  await page.setViewport({ width: 390, height: 844 });
  
  console.log('Loading...');
  try {
    await page.goto('http://localhost:8085/?dev=child', { 
      waitUntil: 'networkidle0',
      timeout: 90000 
    });
    console.log('Page loaded, waiting for React...');
    await new Promise(r => setTimeout(r, 8000));
    
    const hasContent = await page.evaluate(() => document.body.innerText.length > 10);
    console.log('Has content:', hasContent);
    
    await page.screenshot({ path: 'test-screenshots/port8085.png' });
    console.log('Done!');
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})();
