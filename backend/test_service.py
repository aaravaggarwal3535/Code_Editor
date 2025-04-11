from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/ping")
def ping():
    return {"message": "pong"}

@app.get("/test")
def test():
    return {"message": "This is a test endpoint"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)