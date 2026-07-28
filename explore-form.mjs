import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  const baseUrl = 'http://localhost:4000';
  
  console.log('Exploring patient creation form...');
  
  // Navigate to patient creation
  await page.goto(`${baseUrl}/facility/1/patient/create`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take a screenshot
  await page.screenshot({ path: 'form-screenshot.png' });
  console.log('Screenshot saved');
  
  // Get all input fields
  const inputs = await page.locator('input').all();
  console.log(`\nFound ${inputs.length} input fields:`);
  for (const input of inputs) {
    const name = await input.getAttribute('name');
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    console.log(`  - name="${name}" type="${type}" placeholder="${placeholder}"`);
  }
  
  // Get all comboboxes
  const comboboxes = await page.locator('button[role="combobox"]').all();
  console.log(`\nFound ${comboboxes.length} combobox fields:`);
  for (const box of comboboxes) {
    const text = await box.textContent();
    console.log(`  - ${text}`);
  }
  
  await browser.close();
}

run().catch(console.error);
