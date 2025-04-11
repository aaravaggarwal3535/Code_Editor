import logging
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import groq
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Use Groq API key - you'll need to get this from https://console.groq.com/
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("No GROQ_API_KEY found in environment variables. Please add it to your .env file.")

# Initialize the Groq client
groq_client = groq.Client(api_key=groq_api_key)

# Select the model to use
MODEL_NAME = "llama3-70b-8192"  # Groq's Llama 3 70B model - high quality, fast inferences

# Test the API connection
try:
    print("Testing Groq API connection...")
    response = groq_client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hello"}
        ],
        temperature=0.2,
        max_tokens=100
    )
    print(f"Groq API test succeeded: {response.choices[0].message.content}")
    print(f"Response completion time: {response.usage.completion_time}s")
except Exception as e:
    print(f"ERROR initializing Groq API: {str(e)}")
    import traceback
    print(traceback.format_exc())
    raise ValueError(f"Failed to initialize Groq API: {str(e)}")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use ["http://localhost:5173"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== Session Management ==========

# Session storage - in a production app, you would use a database
sessions: Dict[str, Dict] = {}

# Session cleanup - remove sessions older than 1 hour
def cleanup_sessions():
    current_time = datetime.now()
    expired_sessions = []
    
    for session_id, session_data in sessions.items():
        if current_time - session_data["last_activity"] > timedelta(hours=1):
            expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        del sessions[session_id]
    
    if expired_sessions:
        print(f"Cleaned up {len(expired_sessions)} expired sessions")

# Create or get a session
def get_or_create_session(session_id: Optional[str] = None) -> str:
    # Clean up old sessions first
    cleanup_sessions()
    
    if session_id and session_id in sessions:
        # Update last activity time
        sessions[session_id]["last_activity"] = datetime.now()
        return session_id
    
    # Create new session
    new_session_id = str(uuid.uuid4())
    sessions[new_session_id] = {
        "created_at": datetime.now(),
        "last_activity": datetime.now(),
        "message_history": [
            {"role": "system", "content": """
            You are an expert programming assistant focused on improving code.
            You help users improve their code by making it more efficient, readable, and maintainable.
            Remember previous interactions to provide a coherent experience.
            """}
        ],
        "code_history": []  # To store previous code versions
    }
    
    return new_session_id

# ========== Request/Response Models ==========

class AIRequest(BaseModel):
    code: str
    language: str
    prompt: str
    session_id: Optional[str] = None

class AIResponse(BaseModel):
    updated_code: str
    explanation: str
    session_id: str

class ChatMemoryItem(BaseModel):
    timestamp: str
    code: str
    language: str
    prompt: str
    response: str

class SessionInfoResponse(BaseModel):
    session_id: str
    created_at: str
    last_activity: str
    message_count: int
    code_versions: int

# ========== API Endpoints ==========

@app.post("/ai/improve", response_model=AIResponse)
@app.post("/ai/direct-improve", response_model=AIResponse)
async def improve_code(request: AIRequest):
    try:
        # Get or create a session
        session_id = get_or_create_session(request.session_id)
        session = sessions[session_id]
        
        print(f"Processing code improvement: session={session_id}, language={request.language}, prompt={request.prompt}")
        
        # Add the current code to history
        code_entry = {
            "timestamp": datetime.now().isoformat(),
            "language": request.language,
            "code": request.code,
            "prompt": request.prompt
        }
        session["code_history"].append(code_entry)
        
        # Prepare context from previous interactions
        context = ""
        if len(session["code_history"]) > 1:
            # Include information about previous changes
            prev_entries = session["code_history"][-2:]  # Get last 2 entries
            for i, entry in enumerate(prev_entries[:-1]):  # Skip the current entry
                context += f"Previous code ({entry['language']}):\n```{entry['language']}\n{entry['code']}\n```\n"
                context += f"Previous request: {entry['prompt']}\n\n"
        
        # Create a prompt for the Groq model
        system_prompt = """
        You are an expert programmer focusing on improving code. 
        When asked to improve code, you will:
        1. Maintain the same general functionality unless explicitly asked for changes
        2. Make the code more efficient, readable, or maintainable as appropriate
        3. Add comments to explain complex parts
        4. First provide ONLY the improved code without any explanation or markdown formatting
        5. Then on a new line write "EXPLANATION:" followed by your explanation of the changes
        
        If you have seen previous versions of this code, consider the progression and build upon your previous suggestions.
        Do not include any additional text before or after these two parts.
        """
        
        user_prompt = f"""
        {context}
        
        Please improve this {request.language} code according to these requirements:
        
        {request.prompt}
        
        Here is the code to improve:
        ```{request.language}
        {request.code}
        ```
        
        Remember to structure your response with the improved code first, followed by "EXPLANATION:" and then your explanation.
        """
        
        # Add user message to history
        session["message_history"].append({"role": "user", "content": user_prompt})
        
        # Keep message history to a reasonable size (last 10 messages)
        if len(session["message_history"]) > 12:  # system + 10 exchanges + current
            session["message_history"] = [session["message_history"][0]] + session["message_history"][-11:]
        
        print("Sending request to Groq API with message history...")
        response = groq_client.chat.completions.create(
            model=MODEL_NAME,
            messages=session["message_history"],
            temperature=0.2,
            max_tokens=4000,
        )
        
        result = response.choices[0].message.content
        print(f"Received response from Groq API. Length: {len(result)} characters")
        print(f"Response completion time: {response.usage.completion_time}s")
        
        # Add assistant response to history
        session["message_history"].append({"role": "assistant", "content": result})
        
        # Parse the result to separate code and explanation
        parts = result.split("EXPLANATION:", 1)
        if len(parts) > 1:
            updated_code = parts[0].strip()
            explanation = parts[1].strip()
        else:
            # If no EXPLANATION section, try to guess the separation
            lines = result.split('\n')
            code_end_index = -1
            
            # Look for markdown code blocks or natural language transitions
            for i, line in enumerate(lines):
                if "```" in line or "Here's why:" in line or "Explanation:" in line:
                    code_end_index = i
                    break
            
            if code_end_index > 0:
                updated_code = '\n'.join(lines[:code_end_index]).strip()
                explanation = '\n'.join(lines[code_end_index:]).strip()
            else:
                # Fallback: assume 80% is code, rest is explanation
                split_point = int(len(lines) * 0.8)
                updated_code = '\n'.join(lines[:split_point]).strip()
                explanation = '\n'.join(lines[split_point:]).strip()
        
        # Clean up the code (remove markdown code blocks if present)
        if updated_code.startswith("```"):
            code_lines = updated_code.split('\n')
            # Remove first line with ``` and potentially the language identifier after it
            if len(code_lines) >= 3 and "```" in code_lines[0]:
                # Determine where the end of the code block is
                end_index = None
                for i, line in enumerate(code_lines[1:], 1):
                    if "```" in line:
                        end_index = i
                        break
                
                if end_index:
                    updated_code = '\n'.join(code_lines[1:end_index])
                else:
                    # No closing marker found, just remove the first line
                    updated_code = '\n'.join(code_lines[1:])
        
        # Store the result
        session["code_history"][-1]["response"] = result
        session["last_activity"] = datetime.now()
        
        print(f"Successfully processed code improvement request")
        return AIResponse(
            updated_code=updated_code,
            explanation=explanation,
            session_id=session_id
        )
    
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        error_msg = f"AI processing error: {str(e)}"
        print(f"ERROR: {error_msg}\n{traceback_str}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/ai/session/{session_id}")
async def get_session_info(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    return SessionInfoResponse(
        session_id=session_id,
        created_at=session["created_at"].isoformat(),
        last_activity=session["last_activity"].isoformat(),
        message_count=len(session["message_history"]),
        code_versions=len(session["code_history"])
    )

@app.get("/ai/session/{session_id}/history")
async def get_session_history(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    history = []
    
    for entry in session["code_history"]:
        history.append(ChatMemoryItem(
            timestamp=entry["timestamp"],
            code=entry["code"],
            language=entry["language"],
            prompt=entry["prompt"],
            response=entry.get("response", "No response recorded")
        ))
    
    return history

@app.get("/ai/active-sessions")
async def get_active_sessions():
    return {"active_sessions": len(sessions)}

@app.get("/test-groq")
async def test_groq():
    try:
        response = groq_client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Explain what makes Groq special in 2 sentences."}
            ],
            temperature=0.2,
            max_tokens=100
        )
        
        return {
            "status": "success",
            "message": "Groq API is working",
            "response": response.choices[0].message.content,
            "completion_time": response.usage.completion_time,
            "model": MODEL_NAME
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": f"Failed to connect to Groq API: {str(e)}",
            "traceback": traceback.format_exc()
        }

@app.get("/ping")
async def ping():
    return {"message": "pong"}

if __name__ == "__main__":
    import uvicorn
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8001)
    args = parser.parse_args()
    
    uvicorn.run(app, host="0.0.0.0", port=args.port)

