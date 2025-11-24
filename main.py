import requests
import json
import time
from uuid import uuid4

# --- Sample Incoming JSON (The payload your BAP receives on the /on_discover webhook) ---
INCOMING_ON_DISCOVER_PAYLOAD = {
    "context": {
        "message_id": "c927e2b9-a544-4bc8-acdb-d6dc5787d794",
        "bap_id": "ev-charging.sandbox1.com",
        "transaction_id": "c434c5c7-d5bf-4cdf-836b-8540a93aee9b",
        "timestamp": "2025-11-24T15:37:35.496Z",
        "domain": "beckn.one:DEG:compute-energy:1.0",
        "action": "on_discover",
        "version": "2.0.0",
        "ttl": "PT30S",
        "bap_uri": "https://ev-charging.sandbox1.com.com/bap",
        "schema_context": ["..."]
    },
    "message": {
        "catalogs": [
            {
                "beckn:providerId": "gridflex-agent-uk",
                "beckn:items": [
                    {
                        "beckn:id": "item-ce-cambridge-morning-001",
                        "fulfillment_id": "FULFILL_CE_CAM_MOR_001",  # Assuming an ID exists here for simplicity
                        "beckn:provider": {
                            "beckn:id": "gridflex-agent-uk"
                        }
                    },
                    # ... potentially other items
                ]
            }
        ]
    }
}

SANDBOX_URL = "https://deg-hackathon-bap-sandbox.becknprotocol.io/api"
# SANDBOX_URL = "https://ev-charging.sandbox1.com.com/bpp"


# --- Agent Logic ---

def extract_select_params(data: dict) -> dict:
    """
    Extracts essential IDs from the on_discover payload for the select call.
    Assumes the first catalog and the first item in that catalog are selected.
    """
    context = data['context']
    catalog = data['message']['catalogs'][0]
    item = catalog['beckn:items'][0]

    bpp_id = catalog['beckn:providerId']

    # CRITICAL: BPP_URI is required to address the POST /select request.
    # It must be known from the Sandbox/Registry documentation. We use a predictable URI for the example.
    bpp_uri = f"https://{bpp_id}.com/beckn"

    return {
        "TRANSACTION_ID": context['transaction_id'],
        "BAP_ID": context['bap_id'],
        "BAP_URI": context['bap_uri'],
        "BPP_ID": bpp_id,
        "BPP_URI": bpp_uri,
        "SELECTED_ITEM_ID": item['beckn:id'],
        # Reusing BPP ID as the fulfillment and location ID for a simple proxy
        "FULFILLMENT_ID": f"fulfill-{item['beckn:id']}",  # Placeholder ID
        "LOCATION_ID": f"loc-{bpp_id}"  # Placeholder ID
    }


def generate_select_payload(params: dict) -> dict:
    """Generates the Beckn compliant JSON payload for the 'select' action."""

    timestamp = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
    message_id = str(uuid4())

    payload = {
        "context": {
            "domain": "beckn.one:DEG:compute-energy:1.0",
            "action": "select",
            "country": "GBR",
            "city": "uk-regions",
            "core_version": "2.0.0",
            "bap_id": params['BAP_ID'],
            "bap_uri": params['BAP_URI'],
            "bpp_id": params['BPP_ID'],
            "bpp_uri": params['BPP_URI'],
            "transaction_id": params['TRANSACTION_ID'],
            "message_id": message_id,
            "timestamp": timestamp,
            "ttl": "PT30S"
        },
        "message": {
            "order": {
                "provider": {
                    "id": params['BPP_ID'],
                    "locations": [
                        {
                            "id": params['LOCATION_ID']
                        }
                    ]
                },
                "items": [
                    {
                        "id": params['SELECTED_ITEM_ID'],
                        "fulfillment_id": params['FULFILLMENT_ID'],
                        "quantity": {
                            "count": 1
                        }
                    }
                ]
            }
        }
    }
    return payload


def send_select_request(payload: dict, bpp_uri: str):
    """Sends the POST request to the Beckn Gateway using the BPP URI."""

    # NOTE: The actual target endpoint for /select is typically the BPP_URI,
    # but in a sandbox, it might be a central Gateway URL.
    # We use the BPP_URI as the base to send the request to the provider.
    SELECT_ENDPOINT = f"{bpp_uri}/select"

    print(f"--- Attempting POST to: {SELECT_ENDPOINT} ---")

    # In a real environment, you MUST generate and include the digital signature
    # in the 'Authorization' header before sending the request.

    try:
        response = requests.post(
            SELECT_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()

        print("\n--- Synchronous Response (ACK) Status ---")
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")

        print("\n*** The final quote will arrive asynchronously on your /on_select webhook ***")

    except requests.exceptions.RequestException as e:
        print(f"\nAPI Request Failed (Check BPP_URI and Sandbox Status): {e}")
        if 'response' in locals() and response.content:
            print(f"Error Response: {response.text}")


if __name__ == "__main__":
    # 1. Simulate receiving and processing the incoming response
    print("--- 1. Processing Incoming on_discover Payload ---")
    try:
        extracted_params = extract_select_params(INCOMING_ON_DISCOVER_PAYLOAD)
        print("Extracted Parameters:")
        print(json.dumps(extracted_params, indent=2))
        print("-" * 35)

        # 2. Generate the outbound select payload
        select_payload = generate_select_payload(extracted_params)
        print("--- 2. Generated Outbound select Payload ---")
        print(json.dumps(select_payload, indent=2))
        print("-" * 35)

        # 3. Send the request
        # NOTE: This will fail unless the BPP_URI is a live, valid Beckn endpoint.
        send_select_request(select_payload, SANDBOX_URL)
        print("Request function call is commented out. Run with a live Sandbox URL.")

    except (IndexError, KeyError) as e:
        print(f"\nError: Could not parse required data from JSON. Missing key: {e}. Check your JSON structure.")