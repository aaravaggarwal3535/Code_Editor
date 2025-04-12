import os
from grow_SDK import GrowSDK

grow_sdk = GrowSDK(os.environ['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'])

def get_answer(query):
    response = grow_sdk.query(query)
    if response.status_code == 200:
        return response.json()['answer']
    else:
        return None

answer = get_answer("What is the capital of France?")
print(answer)