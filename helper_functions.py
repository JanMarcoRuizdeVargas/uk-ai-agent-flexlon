import random
import re
import time
from datetime import datetime
from typing import Dict, List, Any, Tuple
from uuid import uuid4

import requests

import json


# The base URL for the DEG hackathon sandbox API
SANDBOX_URL = "https://deg-hackathon-bap-sandbox.becknprotocol.io/api"
SHIFT_RANGE = 3
CARBON_WEIGHT = 50


def generate_context(action: str, transaction_id: str, bap_id: str, bap_uri: str, bpp_id: str = None,
                     bpp_uri: str = None) -> dict:
    """Generates the standardized Beckn context dictionary."""
    timestamp = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())

    context = {
        "domain": "beckn.one:DEG:compute-energy:1.0",
        "action": action,
        "version": "2.0.0",
        "bap_id": bap_id,
        "bap_uri": bap_uri,
        "transaction_id": transaction_id,
        "message_id": str(uuid4()),
        "timestamp": timestamp,
        "ttl": "PT30S",
        "schema_context": [
            "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/ComputeEnergy/v1/context.jsonld"
        ]
    }
    # Add BPP details only if provided (relevant for select, init, etc.)
    if bpp_id:
        context["bpp_id"] = bpp_id
    if bpp_uri:
        context["bpp_uri"] = bpp_uri

    return context


def send_beckn_request(endpoint: str, payload: dict) -> dict:
    """Sends a POST request to the specified Beckn endpoint."""
    url = f"{SANDBOX_URL}/{endpoint}"

    print(f"\n--- Attempting POST to /{endpoint} at: {url} ---")

    # In a production environment, an 'Authorization' header with a digital signature is required.
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)

        response_json = response.json()
        print(f"Status Code: {response.status_code}")

        # Beckn synchronous response should contain an ACK/NACK
        if response_json.get("message", {}):
            print("Synchronous ACK Status: SUCCESS")
            print(f"--- Received callback from /{endpoint}_on at: {url}_on ---")
            print(json.dumps(response_json, indent=4))
        # else:
        #     print("Synchronous ACK Status: FAILED (Check response for details)")

        return response_json

    except requests.exceptions.RequestException as e:
        print(f"\nAPI Request Failed for /{endpoint}: {e}")
        if 'response' in locals() and response.content:
            print(f"Error Response: {response.text}")
        return {"error": str(e)}


def extract_select_params(on_discover_data: dict, schedule: Dict[int, List[Dict[str, Any]]]) -> dict:
    context = on_discover_data['context']
    catalog = on_discover_data['message']['catalogs'][0]

    bpp_id = catalog['beckn:providerId']
    bpp_uri = f"https://{bpp_id}.com/beckn"

    # 1. Collect all unique selected Item IDs (generator IDs) from the schedule
    selected_item_ids = set()
    # Regex to find the ID within parentheses at the end of the generator name
    item_id_regex = re.compile(r'\(([^)]+)\)$')

    # Iterate through all hourly entries in the schedule
    for hour, scheduled_items in schedule.items():
        for item in scheduled_items:
            generator_name = item.get("generator", "")

            match = item_id_regex.search(generator_name)
            if match:
                selected_item_ids.add(match.group(1))

    # 2. Map selected Item IDs back to their Beckn Item objects for the 'select' order
    selected_items_payload = []

    # Map all available Beckn Items for quick lookup
    item_map = {item['beckn:id']: item for item in catalog.get('beckn:items', [])}

    for item_id in selected_item_ids:
        original_item = item_map.get(item_id)
        if original_item:
            # We include the item structure for the select payload
            selected_items_payload.append({
                "beckn:id": original_item['beckn:id'],
                "beckn:descriptor": original_item['beckn:descriptor'],
                "beckn:itemAttributes": original_item['beckn:itemAttributes'],
                "beckn:provider": original_item['beckn:provider']
            })

    # 3. Construct the response payload for the 'select' call
    return {
        "transaction_id": context['transaction_id'],
        "bap_id": context['bap_id'],
        "bap_uri": context['bap_uri'],
        "bpp_id": bpp_id,
        "bpp_uri": bpp_uri
        # "order_items": selected_items_payload,
    }


def transform_beckn_to_generation_data(catalogs):
    if not catalogs:
        return []

    generation_data = [{"hour": h, "generators": []} for h in range(24)]

    catalog = catalogs[0]

    offer_map = {}
    for offer in catalog.get("beckn:offers", []):
        item_ids = offer.get("beckn:items", [])
        if item_ids:
            item_id = item_ids[0]
            offer_map[item_id] = {
                "price": offer.get("beckn:price", {}).get("value"),
                "currency": offer.get("beckn:price", {}).get("currency"),
            }

    for item in catalog.get("beckn:items", []):
        item_id = item.get("beckn:id")
        descriptor = item.get("beckn:descriptor", {})
        attributes = item.get("beckn:itemAttributes", {})
        time_window = attributes.get("beckn:timeWindow", {})
        grid_params = attributes.get("beckn:gridParameters", {})

        pricing = offer_map.get(item_id)
        if not pricing:
            continue

        start_time_str = time_window.get("start")
        end_time_str = time_window.get("end")

        if start_time_str and end_time_str:
            try:
                start_hour = datetime.strptime(start_time_str, "%H:%M:%S%z").hour
                end_hour = datetime.strptime(end_time_str, "%H:%M:%S%z").hour

                if end_hour == 0 and start_hour != 0:
                    end_hour = 24

                generator_entry = {
                    "name": f"{descriptor.get('schema:name')} ({item_id})",
                    "price": pricing.get("price", 0.0),
                    "carbon": grid_params.get("carbonIntensity", 0),
                    "carbonUnit": grid_params.get("carbonIntensityUnit"),
                    "renewableMix": grid_params.get("renewableMix", 0)
                }

                current_hour = start_hour
                while current_hour != end_hour:
                    hour_index = current_hour % 24
                    if hour_index < 24:
                        generation_data[hour_index]["generators"].append(generator_entry)
                    current_hour = (current_hour + 1) % 24

            except ValueError:
                continue

    return generation_data


def compute_schedule(generation_data: List[Dict[str, Any]], tasks: List[Dict[str, Any]], shift_range: int = 3,
                     carbon_weight: float = 50.0) -> List[Dict[str, Any]]:
    SHIFT_COST_PER_KW_HOUR = 0.01
    HOUR_LIMIT = len(generation_data)

    for task in tasks:
        task["original_start"] = task["start"]

    def get_min_hourly_score_and_gen(hour: int) -> Tuple[float, str]:
        if hour < 0 or hour >= HOUR_LIMIT:
            return float('inf'), "UNAVAILABLE"

        hourly_data = generation_data[hour]
        generators = hourly_data.get("generators", [])

        if not generators:
            return float('inf'), "UNAVAILABLE"

        min_score = float('inf')
        best_generator_name = ""

        for gen in generators:
            score = gen.get("price", float('inf')) + (carbon_weight * gen.get("carbon", float('inf')))
            if score < min_score:
                min_score = score
                best_generator_name = gen.get("name", "Unknown Generator")

        return min_score, best_generator_name

    def get_generation_score(hour: int) -> float:
        score, _ = get_min_hourly_score_and_gen(hour)
        return score

    def calculate_task_score(task: dict, start_time: int) -> float:
        if start_time < 0 or start_time + task["duration"] > HOUR_LIMIT:
            return float('inf')

        shift_amount = abs(start_time - task["original_start"])
        shift_cost = shift_amount * task["load"] * SHIFT_COST_PER_KW_HOUR

        generation_score = 0.0
        for i in range(task["duration"]):
            hour = start_time + i
            hourly_gen_score = get_generation_score(hour)

            if hourly_gen_score == float('inf'):
                return float('inf')

            generation_score += task["load"] * hourly_gen_score

        return generation_score + shift_cost

    improved = True
    while improved:
        improved = False
        for task in random.sample(tasks, len(tasks)):
            current_score = calculate_task_score(task, task["start"])
            best_score = current_score
            best_start_time = task["start"]

            for shift in range(-shift_range, shift_range + 1):
                if shift == 0:
                    continue

                new_start_time = task["start"] + shift
                new_score = calculate_task_score(task, new_start_time)

                if new_score < best_score:
                    best_score = new_score
                    best_start_time = new_start_time

            if best_start_time != task["start"]:
                task["start"] = best_start_time
                improved = True

    # Final step: Attach generator schedule to the optimized tasks
    for task in tasks:
        task["generator_schedule"] = []

        for i in range(task["duration"]):
            hour = task["start"] + i
            hourly_score, best_generator = get_min_hourly_score_and_gen(hour)

            cost_contribution = task["load"] * hourly_score

            task["generator_schedule"].append({
                "hour": hour,
                "generator": best_generator,
                "cost_contribution": cost_contribution
            })

    return tasks


def get_min_hourly_score_and_gen(hour: int, generation_data: List[Dict[str, Any]], carbon_weight: float) -> Tuple[
    float, str]:
    """Finds the best generator (lowest combined score) for a specific hour."""
    HOUR_LIMIT = len(generation_data)
    if hour < 0 or hour >= HOUR_LIMIT:
        return float('inf'), "UNAVAILABLE"

    generators = generation_data[hour].get("generators", [])
    if not generators:
        return float('inf'), "UNAVAILABLE"

    min_score = float('inf')
    best_generator_name = ""

    for gen in generators:
        # Score = Price + (Carbon_Weight * Carbon_Intensity)
        score = gen.get("price", float('inf')) + (carbon_weight * gen.get("carbon", float('inf')))
        if score < min_score:
            min_score = score
            best_generator_name = gen.get("name", "Unknown Generator")

    return min_score, best_generator_name


def simple_reschedule(generation_data: List[Dict[str, Any]], tasks: List[Dict[str, Any]],
                      carbon_weight: float = 50.0) -> Dict[int, List[Dict[str, Any]]]:
    """
    Reschedules tasks to the earliest possible contiguous window where generation
    is available, and aggregates the results by hour.
    """
    HOUR_LIMIT = len(generation_data)
    schedule = {h: [] for h in range(HOUR_LIMIT)}

    # Process tasks sequentially
    for task in tasks:
        task_duration = task["duration"]

        # Search for the earliest valid start time
        found_start_time = -1
        for start_time in range(HOUR_LIMIT - task_duration + 1):
            is_valid_window = True

            # Check if all hours in the window have at least one generator available
            for i in range(task_duration):
                hour = start_time + i
                if not generation_data[hour].get("generators"):
                    is_valid_window = False
                    break

            if is_valid_window:
                found_start_time = start_time
                break

        if found_start_time != -1:
            task["start"] = found_start_time

            # Populate the schedule and determine the best generator for each hour
            for i in range(task_duration):
                hour = found_start_time + i
                _, best_generator = get_min_hourly_score_and_gen(hour, generation_data, carbon_weight)

                schedule[hour].append({
                    "task_id": task.get("id", f"Task-{i}"),
                    "load": task["load"],
                    "generator": best_generator,
                    "is_start": i == 0,
                    "is_end": i == task_duration - 1,
                    "duration": task_duration
                })

    return schedule
