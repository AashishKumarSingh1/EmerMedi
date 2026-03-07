import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize the Bedrock Client with explicit credentials
# This prevents bearer token expiration issues
client = boto3.client(
    "bedrock-runtime",
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

def analyze_with_llm(labels, prompt_template):
    """
    Modular function using the Hackathon-specific Bearer Token 
    and the latest Converse API.
    """
    # 1. Prepare the data
    labels_text = ", ".join(labels)
    final_prompt = prompt_template.format(labels_text=labels_text)
    
    try:
        print(f"   -> [HACKATHON API] Invoking Claude 4.5 via Converse...")
        
        # 2. THE CONVERSE CALL (Using your provided SDK snippet)
        response = client.converse( 
            modelId="us.anthropic.claude-haiku-4-5-20251001-v1:0", 
            messages=[ 
                { 
                    "role": "user", 
                    "content": [{"text": final_prompt}]
                } 
            ],
            inferenceConfig={
                "maxTokens": 200,
                "temperature": 0.1
            }
        )  

        # 3. Extract the response text
        ai_text = response["output"]["message"]["content"][0]["text"].strip()
        
        # 4. ROBUST PARSING (Cleanup backticks/markdown)
        return parse_json_safely(ai_text)

    except Exception as e:
        print(f"!!! LLM ANALYZER ERROR: {str(e)}")
        return {"status": "unknown", "reason": f"System Error: {str(e)}"}

def parse_json_safely(text):
    """Cleans up the AI response to ensure it's a valid dictionary."""
    text = text.strip()
    # Remove markdown code blocks if the AI added them
    if text.startswith("```json"):
        text = text.replace("```json", "").replace("```", "").strip()
    elif text.startswith("```"):
        text = text.replace("```", "").strip()
        
    try:
        return json.loads(text)
    except:
        # Emergency fallback: If JSON is broken, try to find the word 'emergency'
        print("   ⚠️ AI returned non-JSON text. Attempting manual parse...")
        status = "emergency" if "emergency" in text.lower() and "non-emergency" not in text.lower() else "non-emergency"
        return {"status": status, "reason": text[:60] + "..."}