import { chromium } from 'playwright';
import dayjs from 'dayjs';

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  const baseUrl = 'http://localhost:4000';
  const apiUrl = 'http://localhost:9000';
  
  console.log('Starting QA tests for patient age display...');
  
  // Get auth token from cookies
  const cookies = await context.cookies();
  const authTokenCookie = cookies.find(c => c.name.includes('Token') || c.name.includes('token') || c.name.includes('sessionid'));
  const authToken = authTokenCookie?.value;
  
  console.log('Auth token:', authToken ? 'Found' : 'Not found');
  
  // Helper to create patient via API
  async function createPatientViaAPI(ageInDays, name) {
    const dob = dayjs().subtract(ageInDays, 'days').format('YYYY-MM-DD');
    const patientName = `QA-${name}-${Date.now()}`;
    
    console.log(`\nCreating patient via API: ${patientName} with DOB: ${dob} (age: ${ageInDays} days)`);
    
    const patientData = {
      name: patientName,
      phone_number: `9${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
      emergency_phone_number: `9${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
      date_of_birth: dob,
      gender: 1, // Male
      blood_group: "A+",
      address: "123 Test Street",
      pincode: "560001",
      facility: 1,
      is_active: true
    };
    
    try {
      const response = await page.evaluate(async ({ apiUrl, patientData }) => {
        const resp = await fetch(`${apiUrl}/api/v1/patient/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patientData),
          credentials: 'include'
        });
        return {
          ok: resp.ok,
          status: resp.status,
          data: await resp.json()
        };
      }, { apiUrl, patientData });
      
      if (response.ok) {
        console.log('✓ Patient created:', response.data.id);
        return { patientId: response.data.id, patientName };
      } else {
        console.error('Failed to create patient:', response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error('API error:', error.message);
      return null;
    }
  }
  
  // Helper to create encounter via API
  async function createEncounterViaAPI(patientId) {
    console.log(`Creating encounter via API for patient ${patientId}`);
    
    const encounterData = {
      patient: patientId,
      facility: 1,
      chief_complaint: 'QA test encounter',
      encounter_type: 'emergency',
      status: 'ongoing'
    };
    
    try {
      const response = await page.evaluate(async ({ apiUrl, encounterData }) => {
        const resp = await fetch(`${apiUrl}/api/v1/encounter/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(encounterData),
          credentials: 'include'
        });
        return {
          ok: resp.ok,
          status: resp.status,
          data: await resp.json()
        };
      }, { apiUrl, encounterData });
      
      if (response.ok) {
        console.log('✓ Encounter created:', response.data.id);
        return response.data.id;
      } else {
        console.error('Failed to create encounter:', response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error('API error:', error.message);
      return null;
    }
  }
  
  // Helper to capture screenshot
  async function captureEncounter(encounterId, screenshotName) {
    console.log(`Capturing screenshots for encounter ${encounterId}`);
    
    await page.goto(`${baseUrl}/facility/1/encounter/${encounterId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Screenshot without hover
    await page.screenshot({
      path: `specs/30/screenshots/${screenshotName}.png`,
      fullPage: false
    });
    console.log(`✓ Screenshot saved: ${screenshotName}.png`);
    
    // Find and hover over age element
    const ageElement = page.locator('.cursor-help').first();
    if (await ageElement.count() > 0) {
      await ageElement.hover();
      await page.waitForTimeout(1500); // Wait for tooltip
      
      // Screenshot with tooltip
      await page.screenshot({
        path: `specs/30/screenshots/${screenshotName}-tooltip.png`,
        fullPage: false
      });
      console.log(`✓ Screenshot saved: ${screenshotName}-tooltip.png`);
    } else {
      console.warn('Age element not found on page');
    }
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
      
      const patient = await createPatientViaAPI(testCase.ageInDays, testCase.label);
      if (!patient) {
        console.error('Failed to create patient');
        continue;
      }
      
      const encounterId = await createEncounterViaAPI(patient.patientId);
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
