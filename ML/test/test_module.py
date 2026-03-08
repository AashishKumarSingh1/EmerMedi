import requests
import json
import os

# API endpoint
URL = "http://localhost:5000/scan-document"

# Document image to test
DOCUMENT_FILE = "test.jpg"


def test_scan_document():

    if not os.path.exists(DOCUMENT_FILE):
        print("❌ test_document.jpg not found in this folder")
        return

    try:
        print("Reading document image...")

        with open(DOCUMENT_FILE, "rb") as f:
            files = {
                "file": (DOCUMENT_FILE, f, "image/jpeg")
            }

            print("Sending request to API...")

            response = requests.post(URL, files=files)

        if response.status_code == 200:
            print("✅ Success\n")

            data = response.json()
            print("API RESPONSE:\n")
            print(json.dumps(data, indent=2))

        else:
            print("❌ Failed")
            print("Status Code:", response.status_code)
            print("Response:", response.text)

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API")
        print("Make sure your Flask server is running")

    except Exception as e:
        print("Unexpected Error:", str(e))


if __name__ == "__main__":
    test_scan_document()