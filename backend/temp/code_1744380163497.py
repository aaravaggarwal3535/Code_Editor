import os
import openai

openai.api_key = "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"

def get_response(prompt):
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        temperature=0.5,
        max_tokens=100,
    )
    return response.choices[0].text.strip()

def main():
    python_code = """
    # Your preset python code here
    """
    prompt = f"Write a response to the following python code:\n{python_code}"
    response = get_response(prompt)
    print(response)

if __name__ == "__main__":
    main()