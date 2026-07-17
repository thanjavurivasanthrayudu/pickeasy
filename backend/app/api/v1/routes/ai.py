"""
AI Diagnostic Route - Proxies NVIDIA NIM API calls for the Inspection AI Assistant.
"""
import requests
from flask import Blueprint, request, jsonify

ai_bp = Blueprint('ai', __name__)

NVIDIA_API_KEY = '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'
NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'


@ai_bp.post('/diagnose')
def diagnose():
    """
    Receives complaint + symptoms from the frontend, calls NVIDIA NIM,
    and returns a structured diagnostic JSON.
    """
    body = request.get_json(silent=True) or {}
    complaint = body.get('complaint', '').strip()
    symptoms  = body.get('symptoms', '').strip()

    if not complaint and not symptoms:
        return jsonify({'error': 'Please provide complaint or symptoms.'}), 400

    system_prompt = (
        "You are an expert motorcycle and bike service technician AI. "
        "Analyze vehicle complaints and symptoms to provide structured diagnostic reports. "
        "Always respond with ONLY a valid JSON object — no markdown, no explanation, no extra text."
    )

    user_prompt = f"""A mechanic submitted this vehicle inspection report:
- Customer Complaint: "{complaint or 'Not specified'}"
- Observed Symptoms:  "{symptoms or 'Not specified'}"

Respond with ONLY this JSON (no extra text):
{{
  "issues":   ["Primary issue", "Secondary issue if applicable"],
  "service":  "Recommended service title",
  "steps":    ["Step 1", "Step 2", "Step 3"],
  "severity": "Low",
  "eta":      "30-60 mins",
  "parts":    ["Part name with quantity"],
  "warnings": ["Safety warning if applicable"]
}}

Replace "Low" with "Medium" or "High" as appropriate."""

    try:
        resp = requests.post(
            NVIDIA_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {NVIDIA_API_KEY}'
            },
            json={
                'model': 'meta/llama-3.1-70b-instruct',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                'temperature': 0.4,
                'max_tokens':  1024,
                'stream': False
            },
            timeout=30
        )
        data = resp.json()

        if not resp.ok:
            msg = data.get('message') or data.get('detail') or f'HTTP {resp.status_code}'
            return jsonify({'error': f'NVIDIA API Error: {msg}'}), resp.status_code

        raw_text = data.get('choices', [{}])[0].get('message', {}).get('content', '')

        # Extract the JSON block
        import re, json
        match = re.search(r'\{[\s\S]*\}', raw_text)
        if not match:
            return jsonify({'error': 'Could not parse AI response.'}), 502

        parsed = json.loads(match.group())

        # Normalise severity
        if parsed.get('severity') not in ('Low', 'Medium', 'High'):
            parsed['severity'] = 'Medium'

        return jsonify(parsed), 200

    except requests.exceptions.Timeout:
        return jsonify({'error': 'AI request timed out. Please try again.'}), 504
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500
