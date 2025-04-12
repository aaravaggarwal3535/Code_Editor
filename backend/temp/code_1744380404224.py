import os
import langchain
from gemini import Gemini

gemini_api_key = os.environ.get("AIzaSyC7958lvH9cC0y4E2qUV26o-0eBmDB1L70")
gemini_api_secret = os.environ.get("AIzaSyC7958lvH9cC0y4E2qUV26o-0eBmDB1L70")

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