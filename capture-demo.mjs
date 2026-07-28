import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  console.log('Capturing screenshots of age format demonstration...');
  
  // Load the HTML file
  await page.goto('file:///workspaces/agent_hq/_target/6ca2c033308915e4/age-format-qa.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Get all test cases
  const testCases = await page.locator('.test-case').all();
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const title = await testCase.locator('h3').textContent();
    
    console.log(`Capturing: ${title}`);
    
    // Determine filename based on criterion
    let filename;
    if (title.includes('Criterion 1')) filename = '0-28-days';
    else if (title.includes('Criterion 2')) filename = '29-days-1-year';
    else if (title.includes('Criterion 3')) filename = '1-2-years';
    else if (title.includes('Criterion 4')) filename = '2-18-years';
    else if (title.includes('Criterion 5')) filename = '18-plus';
    else if (title.includes('Criterion 7')) filename = 'deceased';
    
    // Screenshot without hover
    await testCase.screenshot({
      path: `specs/30/screenshots/${filename}.png`
    });
    console.log(`✓ Saved: ${filename}.png`);
    
    // Hover over age display and capture tooltip
    const ageDisplay = testCase.locator('.age-display');
    await ageDisplay.hover();
    await page.waitForTimeout(500);
    
    await testCase.screenshot({
      path: `specs/30/screenshots/${filename}-tooltip.png`
    });
    console.log(`✓ Saved: ${filename}-tooltip.png`);
  }
  
  console.log('\n✓ All screenshots captured!');
  await browser.close();
}

run().catch(console.error);
