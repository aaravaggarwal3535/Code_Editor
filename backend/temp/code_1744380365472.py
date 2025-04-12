import os
import langchain
from gemini import Gemini

gemini_api_key = os.environ.get("GEMINI_API_KEY")
gemini_api_secret = os.environ.get("GEMINI_API_SECRET")

gemini_client = Gemini(gemini_api_key, gemini_api_secret)

def get_response(prompt):
    llm = langchain.LLM.from_model("llama")
    response = llm.generate(prompt)
    return response

def send_response(response):
    gemini_client.send_message(response)

def main():
    prompt = input("Enter your prompt: ")
    response = get_response(prompt)
    send_response(response)

if __name__ == "__main__":
    main()