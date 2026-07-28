import { chromium } from 'playwright';
import dayjs from 'dayjs';

async function run() {
  const browser = await chromium.launch({ 
    headless: true
  });
  
  // Load authenticated session
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  const baseUrl = 'http://localhost:4000';
  
  console.log('Starting QA tests for patient age display...');
  
  // Go to homepage first
  await page.goto(baseUrl);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('Logged in, searching for facility...');
  
  // Navigate to a facility
  await page.goto(`${baseUrl}/facility/1`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('At facility page, navigating to patients...');
  
  // Navigate to patients list
  await page.goto(`${baseUrl}/facility/1/patients`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('At patients page');
  
  // Helper to create patient with specific age using the UI
  async function createPatientWithAge(ageInDays, name) {
    const dob = dayjs().subtract(ageInDays, 'days').format('YYYY-MM-DD');
    const patientName = `QA-${name}-${Date.now()}`;
    
    console.log(`\nCreating patient: ${patientName} with DOB: ${dob} (age: ${ageInDays} days)`);
    
    // Navigate to patient creation
    await page.goto(`${baseUrl}/facility/1/patient/create`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Fill patient details
    await page.fill('input[name="name"]', patientName);
    await page.fill('input[name="phone_number"]', `9${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`);
    await page.fill('input[name="emergency_phone_number"]', `9${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`);
    
    // Set date of birth
    await page.fill('input[name="date_of_birth"]', dob);
    
    // Select gender - find the combobox button
    const genderButton = page.locator('button[role="combobox"]').filter({ hasText: /gender/i }).first();
    await genderButton.click();
    await page.waitForTimeout(500);
    await page.locator('div[role="option"]').filter({ hasText: 'Male' }).first().click();
    await page.waitForTimeout(500);
    
    // Select blood group
    const bloodButton = page.locator('button[role="combobox"]').filter({ hasText: /blood/i }).first();
    await bloodButton.click();
    await page.waitForTimeout(500);
    await page.locator('div[role="option"]').filter({ hasText: 'A+' }).first().click();
    await page.waitForTimeout(500);
    
    // Fill address
    await page.fill('input[name="address"]', '123 Test Street');
    await page.fill('input[name="pincode"]', '560001');
    
    // Submit
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /add.*patient/i }).first();
    await submitButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Get patient ID from URL
    const url = page.url();
    const match = url.match(/\/patient\/([a-f0-9-]+)/);
    if (!match) {
      console.error('Could not extract patient ID from URL:', url);
      return null;
    }
    
    return { patientId: match[1], patientName };
  }
  
  // Helper to create encounter
  async function createEncounter(patientId) {
    console.log(`Creating encounter for patient ${patientId}`);
    
    await page.goto(`${baseUrl}/facility/1/patient/${patientId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click create encounter button
    const createButton = page.locator('button').filter({ hasText: /encounter/i }).first();
    await createButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Fill basic details
    await page.fill('textarea[name="chief_complaint"]', 'QA test encounter');
    
    // Select encounter type - find first option
    const typeButton = page.locator('button[role="combobox"]').first();
    await typeButton.click();
    await page.waitForTimeout(500);
    await page.locator('div[role="option"]').first().click();
    await page.waitForTimeout(500);
    
    // Submit
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create/i }).first();
    await submitButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Get encounter ID from URL
    const url = page.url();
    const match = url.match(/\/encounter\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  }
  
  // Helper to capture screenshot
  async function captureEncounter(encounterId, screenshotName) {
    console.log(`Capturing screenshots for encounter ${encounterId}`);
    
    await page.goto(`${baseUrl}/facility/1/encounter/${encounterId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot without hover
    await page.screenshot({
      path: `specs/30/screenshots/${screenshotName}.png`,
      fullPage: false
    });
    console.log(`✓ Screenshot saved: ${screenshotName}.png`);
    
    // Find and hover over age element
    const ageElement = page.locator('.cursor-help').first();
    await ageElement.hover();
    await page.waitForTimeout(1000); // Wait for tooltip
    
    // Screenshot with tooltip
    await page.screenshot({
      path: `specs/30/screenshots/${screenshotName}-tooltip.png`,
      fullPage: false
    });
    console.log(`✓ Screenshot saved: ${screenshotName}-tooltip.png`);
  }
  
  // Test cases
  const testCases = [
    { name: '0-28-days', ageInDays: 15, label: 'Newborn15Days' },
    { name: '29-days-1-year', ageInDays: 60, label: 'Infant60Days' },
    { name: '1-2-years', ageInDays: 450, label: 'Toddler450Days' },
    { name: '2-18-years', ageInDays: 2000, label: 'Child2000Days' },
    { name: '18-plus', ageInDays: 15000, label: 'Adult41Years' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n=== Testing: ${testCase.name} ===`);
      
      const patient = await createPatientWithAge(testCase.ageInDays, testCase.label);
      if (!patient) {
        console.error('Failed to create patient');
        continue;
      }
      
      const encounterId = await createEncounter(patient.patientId);
      if (!encounterId) {
        console.error('Failed to create encounter');
        continue;
      }
      
      await captureEncounter(encounterId, testCase.name);
      
    } catch (error) {
      console.error(`Error testing ${testCase.name}:`, error.message);
      await page.screenshot({
        path: `specs/30/screenshots/error-${testCase.name}.png`
      });
    }
  }
  
  console.log('\n✓ QA testing complete!');
  await browser.close();
}

run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
