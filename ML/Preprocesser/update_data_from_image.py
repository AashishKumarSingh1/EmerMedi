import random


def update_data_from_image():
    sample_data = {
        "patient_name": random.choice(["John Doe", "Alice Smith", "Raj Kumar"]),
        "age": random.choice([25, 34, 47, 60]),
        "gender": random.choice(["Male", "Female"]),
        "diagnosis": random.choice([
            "Hypertension",
            "Type 2 Diabetes",
            "Common Cold",
            "Migraine"
        ]),
        "medications": [
            random.choice(["Paracetamol", "Metformin", "Amlodipine", "Ibuprofen"])
        ],
        "allergies": random.choice([
            "None",
            "Penicillin",
            "Peanuts"
        ]),
        "doctor_notes": "Patient advised to rest and follow medication schedule.",
        "follow_up_required": random.choice([True, False]),
        "medical_history_updates": "No significant changes in medical history.",
        "summary": "Patient condition stable."
    }

    return sample_data