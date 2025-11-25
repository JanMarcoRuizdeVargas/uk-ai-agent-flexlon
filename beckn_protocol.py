import sys
from io import StringIO
from uuid import uuid4

from helper_functions import extract_select_params, transform_beckn_to_generation_data, simple_reschedule
from subprotocols import discover, select, initialise, confirm, status, update_workload, rating

import flask

app = flask.Flask(__name__)

FORECASTED_TASKS = [
    {"id": "Batch_A", "start": 1, "duration": 2, "load": 2.5},
    {"id": "Query_B", "start": 1, "duration": 4, "load": 1.0},
    {"id": "Backup_C", "start": 10, "duration": 3, "load": 5.0}
]

@app.route("/")
def beckn_protocol():
    buffer = StringIO()
    old_stdout = sys.stdout
    sys.stdout = buffer

    try:
        TXN_ID = str(uuid4())
        BAP_ID = "ev-charging.sandbox1.com"
        BAP_URI = "https://ev-charging.sandbox1.com.com/bap"

        on_discover_response = discover(BAP_ID, BAP_URI, TXN_ID)
        gen_data = transform_beckn_to_generation_data(on_discover_response['message']['catalogs'])
        schedule = simple_reschedule(gen_data, FORECASTED_TASKS, carbon_weight=0.0001)
        extracted_params = extract_select_params(on_discover_response, schedule)
        extracted_params["transaction_id"] = TXN_ID
        select(on_discover_response, schedule)
        initialise(**extracted_params)
        confirm(**extracted_params)
        status(**extracted_params)
        update_workload(**extracted_params)
        rating(**extracted_params)
    finally:
        sys.stdout = old_stdout

    return "<pre>" + buffer.getvalue() + "</pre>"
