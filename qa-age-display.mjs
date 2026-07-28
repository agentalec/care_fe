import { chromium } from 'playwright';
import dayjs from 'dayjs';

async function run() {
  const browser = await chromium.launch({ headless: false });
  
  // Load authenticated session
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  const baseUrl = 'http://localhost:4000';
  const apiUrl = 'http://localhost:9000';
  
  console.log('Starting QA tests for patient age display...');
  
  // Helper to create patient with specific age
  async function createPatientWithAge(ageInDays) {
    const dob = dayjs().subtract(ageInDays, 'days').format('YYYY-MM-DD');
    const patientName = `TestPatient-${ageInDays}days-${Date.now()}`;
    
    console.log(`Creating patient: ${patientName} with DOB: ${dob}`);
    
    // Navigate to patient creation page
    await page.goto(`${baseUrl}/facility/1/patients`);
    await page.waitForLoadState('networkidle');
    
    // Click "Add Details of Patient" button
    await page.click('button:has-text("Add Details of Patient")');
    await page.waitForLoadState('networkidle');
    
    // Fill in patient details
    await page.fill('input[name="name"]', patientName);
    await page.fill('input[name="phone_number"]', `9${Math.floor(Math.random() * 1000000000)}`);
    await page.fill('input[name="emergency_phone_number"]', `9${Math.floor(Math.random() * 1000000000)}`);
    
    // Set date of birth
    await page.fill('input[name="date_of_birth"]', dob);
    
    // Select gender
    await page.click('button[role="combobox"]:has-text("Select Gender")');
    await page.click('div[role="option"]:has-text("Male")');
    
    // Select blood group
    await page.click('button[role="combobox"]:has-text("Select Blood Group")');
    await page.click('div[role="option"]:has-text("A+")');
    
    // Fill address
    await page.fill('input[name="address"]', '123 Test Street');
    await page.fill('input[name="pincode"]', '560001');
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Add Patient")');
    await page.waitForLoadState('networkidle');
    
    // Get patient ID from URL
    const url = page.url();
    const patientId = url.match(/\/patient\/([^\/]+)/)?.[1];
    
    return { patientId, patientName, dob };
  }
  
  // Helper to create encounter for patient
  async function createEncounter(patientId) {
    console.log(`Creating encounter for patient ${patientId}`);
    
    await page.goto(`${baseUrl}/facility/1/patient/${patientId}`);
    await page.waitForLoadState('networkidle');
    
    // Click "Create Encounter" or similar button
    await page.click('button:has-text("Create Encounter"), button:has-text("Add Encounter")');
    await page.waitForLoadState('networkidle');
    
    // Fill basic encounter details
    await page.fill('input[name="chief_complaint"]', 'Test complaint for QA');
    
    // Select encounter type
    await page.click('button[role="combobox"]:has-text("Select Type")');
    await page.click('div[role="option"]:first-child');
    
    // Submit encounter
    await page.click('button[type="submit"]:has-text("Create Encounter")');
    await page.waitForLoadState('networkidle');
    
    // Get encounter ID from URL
    const url = page.url();
    const encounterId = url.match(/\/encounter\/([^\/]+)/)?.[1];
    
    return encounterId;
  }
  
  // Test cases based on acceptance criteria
  const testCases = [
    { name: '0-28-days', ageInDays: 15, expectedFormat: 'days only', criterion: 1 },
    { name: '29-days-1-year', ageInDays: 60, expectedFormat: 'weeks + days', criterion: 2 },
    { name: '1-2-years', ageInDays: 450, expectedFormat: 'months + days', criterion: 3 },
    { name: '2-18-years', ageInDays: 2000, expectedFormat: 'years + months', criterion: 4 },
    { name: '18-plus', ageInDays: 15000, expectedFormat: 'years only', criterion: 5 }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n=== Testing: ${testCase.name} (Criterion ${testCase.criterion}) ===`);
      
      const { patientId, patientName } = await createPatientWithAge(testCase.ageInDays);
      if (!patientId) {
        console.error('Failed to create patient');
        continue;
      }
      
      const encounterId = await createEncounter(patientId);
      if (!encounterId) {
        console.error('Failed to create encounter');
        continue;
      }
      
      // Navigate to encounter page
      await page.goto(`${baseUrl}/facility/1/encounter/${encounterId}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for rendering
      
      // Screenshot without hover
      await page.screenshot({
        path: `specs/30/screenshots/${testCase.name}.png`,
        fullPage: false
      });
      console.log(`✓ Screenshot saved: ${testCase.name}.png`);
      
      // Find the age element and hover over it
      const ageElement = await page.locator('.cursor-help').first();
      if (await ageElement.count() > 0) {
        await ageElement.hover();
        await page.waitForTimeout(500); // Wait for tooltip
        
        // Screenshot with tooltip
        await page.screenshot({
          path: `specs/30/screenshots/${testCase.name}-tooltip.png`,
          fullPage: false
        });
        console.log(`✓ Screenshot saved: ${testCase.name}-tooltip.png`);
      }
      
    } catch (error) {
      console.error(`Error testing ${testCase.name}:`, error.message);
    }
  }
  
  // Test deceased patient (criterion 7)
  try {
    console.log(`\n=== Testing: deceased patient (Criterion 7) ===`);
    
    // Create a patient who was 40 years old when they died 2 years ago
    const deceasedDob = dayjs().subtract(42, 'years').format('YYYY-MM-DD');
    const deceasedDatetime = dayjs().subtract(2, 'years').format('YYYY-MM-DDTHH:mm:ss');
    
    // We'll need to use API to set deceased_datetime
    // For now, just document this as needing manual setup
    console.log('Note: Deceased patient test requires API setup');
    
  } catch (error) {
    console.error('Error testing deceased patient:', error.message);
  }
  
  console.log('\n✓ QA testing complete!');
  
  await browser.close();
}

run().catch(console.error);
