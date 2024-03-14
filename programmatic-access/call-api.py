import requests
import pandas as pd
import json
import time
import os
from dotenv import load_dotenv

load_dotenv()

def remove_empty_responses(alias_data):
    # Remove keys for responses that are empty
    new_alias_data = { 'responses': {}, 'question_histories': {}, 'questions': {} }
    for key in alias_data['responses'].keys():
        if alias_data['responses'][key] == '':
            continue
        else:
            new_alias_data['responses'][key] = alias_data['responses'][key]
            new_alias_data['question_histories'][key] = alias_data['question_histories'][key]
            new_alias_data['questions'][key] = alias_data['questions'][key]
    return new_alias_data


def call_api(alias_data,participant_id,survey_id,api_key):

    body = {
        **alias_data,
        'participant_id': participant_id,
        'survey_id': survey_id
    }


    headers = {
        'api_key': api_key,
        'Content-Type': 'application/json'
    }

    # Make request and check outcome
    raw_response = requests.post(
        'https://roundtable.ai/api/alias/v013',
        json=body,
        headers=headers
    )

    if raw_response.status_code == 200:
        response = raw_response.json()
        print(response)
        data_for_return = { 'failed': False, 'flagged': response['flagged'] }
        for key in response['checks'].keys():
            flag_str = 'None' if len(response['checks'][key]) == 0 else response['checks'][key][0]
            data_for_return[key + '-flags'] = flag_str
        return data_for_return
    else:
        return { 'failed': True }


# -- -- -- -- --
# -- -- -- -- --
# Main script
# -- -- -- -- --
# -- -- -- -- --

# Set the survey id
survey_id = 'SV_1234567890'

# Get the api key
api_key = os.getenv('ROUNDTABLE_API_KEY')


# Load the data and remove the first two rows
df = pd.read_csv('qualtrics-data-raw.csv')
df = df.iloc[2:]
df = df.reset_index(drop=True)

# Loop through the data and call the API. Add the responses as columns to the dataframe.
results = []
for index, row in df.iterrows():
    print(f'Calling API for row {index}')
    participant_id = str(index) # Use the index as the participant id
    alias_data = json.loads(row['alias_data'])
    alias_data = remove_empty_responses(alias_data)
    result = call_api(alias_data,participant_id,survey_id,api_key)
    results.append(result)
    time.sleep(5)

# Add the results to the dataframe and save
results_df = pd.DataFrame.from_records(results)
df = pd.concat([df.reset_index(drop=True), results_df], axis=1)
df.to_csv('qualtrics-data-with-alias.csv')
