import gemini

def get_response(symbol):
    g = gemini.Gemini()
    response = g.get_balance(symbol)
    return response

def main():
    symbol = input("Enter symbol: ")
    response = get_response(symbol)
    print("Response:", response)

if __name__ == "__main__":
    main()