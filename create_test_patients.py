import os
import django
import sys
from datetime import datetime, timedelta

# Setup Django
sys.path.insert(0, os.path.expanduser('~/care'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from facility.models import Facility, Patient, Encounter, EncounterPatient
from users.models import User

# Get a facility and user
facility = Facility.objects.first()
user = User.objects.filter(user_type=5).first()  # Get a doctor

if not facility or not user:
    print("No facility or user found")
    sys.exit(1)

print(f"Using facility: {facility.name}")
print(f"Using user: {user.username}")

# Test cases with ages in days
test_cases = [
    {'name': 'QATest-15Days', 'days': 15, 'label': '0-28-days'},
    {'name': 'QATest-60Days', 'days': 60, 'label': '29-days-1-year'},
    {'name': 'QATest-450Days', 'days': 450, 'label': '1-2-years'},
    {'name': 'QATest-2000Days', 'days': 2000, 'label': '2-18-years'},
    {'name': 'QATest-15000Days', 'days': 15000, 'label': '18-plus'},
]

results = []

for test in test_cases:
    dob = datetime.now().date() - timedelta(days=test['days'])
    
    # Create patient
    patient = Patient.objects.create(
        name=test['name'],
        phone_number=f"9{str(test['days']).zfill(9)}",
        emergency_phone_number=f"8{str(test['days']).zfill(9)}",
        date_of_birth=dob,
        gender=1,  # Male
        blood_group="A+",
        address="123 Test Street",
        pincode="560001",
        facility=facility,
        is_active=True
    )
    
    # Create encounter
    encounter = Encounter.objects.create(
        facility=facility,
        chief_complaint="QA test for age display",
        encounter_type="emergency",
        status="ongoing"
    )
    
    EncounterPatient.objects.create(
        encounter=encounter,
        patient=patient
    )
    
    print(f"Created: {test['name']} (DOB: {dob}) - Encounter ID: {encounter.external_id}")
    results.append({
        'label': test['label'],
        'patient_id': patient.external_id,
        'encounter_id': encounter.external_id
    })

# Save results for the screenshot script
import json
with open('test_encounters.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\n✓ Test patients and encounters created successfully")
print("Results saved to test_encounters.json")
