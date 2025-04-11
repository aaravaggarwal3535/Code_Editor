import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Directly implement the API key
api_key = "AIzaSyC7958lvH9cC0y4E2qUV26o-0eBmDB1L70"  # Replace with your actual API key

# Attempt to load from .env file as fallback
if not api_key or api_key == "YOUR_ACTUAL_API_KEY_HERE":
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("No GOOGLE_API_KEY found. Please add it directly in the code or in your .env file.")

try:
    # Initialize the direct API first
    genai.configure(api_key=api_key)
    
    # List available models first
    print("Listing available models...")
    try:
        models = genai.list_models()
        print("Available models:")
        for model in models:
            print(f" - {model.name}: {model.display_name}")
            supported_methods = []
            if hasattr(model, 'supported_generation_methods'):
                supported_methods = model.supported_generation_methods
            print(f"   Supported methods: {supported_methods}")
    except Exception as list_error:
        print(f"Error listing models: {list_error}")
    
    # Try a different model name - gemini-1.5-pro is the newer version
    print("Trying with gemini-1.5-pro model...")
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        test_response = model.generate_content("Test")
        print(f"Direct API test succeeded with gemini-1.5-pro: {test_response.text}")
    except Exception as pro_error:
        print(f"Error with gemini-1.5-pro: {pro_error}")
        
        # Try with gemini-1.5-flash as a fallback
        print("Trying with gemini-1.5-flash model...")
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            test_response = model.generate_content("Test")
            print(f"Direct API test succeeded with gemini-1.5-flash: {test_response.text}")
            
            # Use the working model name
            working_model = 'gemini-1.5-flash'
        except Exception as flash_error:
            print(f"Error with gemini-1.5-flash: {flash_error}")
            working_model = None
    else:
        # gemini-1.5-pro worked
        working_model = 'gemini-1.5-pro'
    
    if working_model:
        print(f"Using {working_model} for LangChain integration")
        # Initialize LangChain with the working model
        llm = ChatGoogleGenerativeAI(
            model=working_model,
            google_api_key=api_key,
            temperature=0.2,
            top_p=0.8,
            top_k=40,
            verbose=True
        )
        output_parser = StrOutputParser()
        print("LLM initialized successfully")
    else:
        print("ERROR: Could not find a working Gemini model!")
        llm = None
        output_parser = None
except Exception as init_error:
    print(f"ERROR initializing AI: {str(init_error)}")
    import traceback
    print(traceback.format_exc())
    llm = None
    output_parser = None

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use ["http://localhost:5173"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AIRequest(BaseModel):
    code: str
    language: str
    prompt: str

class AIResponse(BaseModel):
    updated_code: str
    explanation: str

# Update the /ai/improve endpoint
@app.post("/ai/improve", response_model=AIResponse)
async def improve_code(request: AIRequest):
    if llm is None:
        raise HTTPException(
            status_code=503,
            detail="AI service unavailable: No working Gemini model found"
        )
    try:
        print(f"Received request: language={request.language}, prompt length={len(request.prompt)}, code length={len(request.code)}")
        
        # Create a prompt template
        template = """
        You are an expert programmer focusing on improving code.
        
        ORIGINAL CODE ({language}):
        ```{language}
        {code}
        ```
        
        USER REQUEST:
        {prompt}
        
        Please improve the code according to the user's request. 
        Follow these rules:
        1. Maintain the same general functionality unless the user explicitly asks for changes
        2. Make the code more efficient, readable, or maintainable as appropriate
        3. Add comments to explain complex parts
        4. Format your response in two parts: 
           - First provide ONLY the improved code without markdown formatting or explanation
           - Then on a new line write "EXPLANATION:" followed by your explanation
        
        IMPROVED CODE:
        """
        
        prompt_template = PromptTemplate(
            input_variables=["language", "code", "prompt"],
            template=template
        )
        
        print("Creating chain...")
        # Create and run the chain with detailed error handling
        try:
            # Make sure output_parser is initialized
            if output_parser is None:
                output_parser = StrOutputParser()
                
            chain = (
                {"language": lambda x: x["language"], "code": lambda x: x["code"], "prompt": lambda x: x["prompt"]} 
                | prompt_template 
                | llm 
                | output_parser
            )
            
            print("Invoking chain...")
            result = chain.invoke({
                "language": request.language,
                "code": request.code,
                "prompt": request.prompt
            })
            print(f"Chain result length: {len(result)}")
            
        except Exception as chain_error:
            print(f"Chain execution error: {str(chain_error)}")
            import traceback
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500, 
                detail=f"AI model error: {str(chain_error)}"
            )
        
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
            # Remove first line with ``` and last line with ```
            if len(code_lines) >= 3 and "```" in code_lines[0] and "```" in code_lines[-1]:
                updated_code = '\n'.join(code_lines[1:-1])
        
        print(f"Successfully processed code improvement request")
        return AIResponse(
            updated_code=updated_code,
            explanation=explanation
        )
    
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        error_msg = f"AI processing error: {str(e)}"
        print(f"ERROR: {error_msg}\n{traceback_str}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/ai/simple-improve")
async def simple_improve(request: AIRequest):
    try:
        # Test with direct API call - no chains
        prompt = f"""
        Improve this {request.language} code:
        ```{request.language}
        {request.code}
        ```
        
        Request: {request.prompt}
        
        Respond with only improved code:
        """
        
        response = llm.invoke(prompt)
        return {"result": str(response)}
    except Exception as e:
        import traceback
        error_msg = f"Simple AI error: {str(e)}"
        print(f"ERROR: {error_msg}\n{traceback.format_exc()}")
        return {"error": error_msg}

@app.post("/ai/direct-improve", response_model=AIResponse)
async def direct_improve(request: AIRequest):
    try:
        print(f"Direct improve: language={request.language}, prompt={request.prompt}")
        
        # Use the Google API directly without LangChain
        prompt = f"""
        You are an expert programmer focusing on improving code.
        
        ORIGINAL CODE ({request.language}):
        ```{request.language}
        {request.code}
        ```
        
        USER REQUEST:
        {request.prompt}
        
        Please improve the code according to the user's request. 
        Follow these rules:
        1. Maintain the same general functionality unless the user explicitly asks for changes
        2. Make the code more efficient, readable, or maintainable as appropriate
        3. Add comments to explain complex parts
        4. Format your response in two parts: 
           - First provide ONLY the improved code without markdown formatting or explanation
           - Then on a new line write "EXPLANATION:" followed by your explanation
        
        IMPROVED CODE:
        """
        
        # Use the model that's known to work
        model_name = 'gemini-1.5-pro'  # We know this works from your tests
        print(f"Using model: {model_name}")
        
        model = genai.GenerativeModel(
            model_name,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                top_p=0.8,
                top_k=40,
            )
        )
        
        # Generate the content
        response = model.generate_content(prompt)
        result = response.text
        print(f"Direct API response: {result[:100]}...")
        
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
            # Remove first line with ``` and last line with ```
            if len(code_lines) >= 3 and "```" in code_lines[0] and "```" in code_lines[-1]:
                updated_code = '\n'.join(code_lines[1:-1])
        
        print(f"Successfully processed direct code improvement request")
        return AIResponse(
            updated_code=updated_code,
            explanation=explanation
        )
    
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        error_msg = f"Direct AI processing error: {str(e)}"
        print(f"ERROR: {error_msg}\n{traceback_str}")
        raise HTTPException(status_code=500, detail=error_msg)

# Add a test endpoint to check the API key
@app.get("/test-gemini")  # This must be exactly as shown here - check for typos
async def test_gemini():
    logger.debug("test-gemini endpoint called")
    try:
        # Test with a simple prompt
        logger.debug("Invoking Gemini LLM")
        simple_result = llm.invoke("Say hello")
        logger.debug(f"Received response: {simple_result}")
        return {
            "status": "success", 
            "message": "Gemini API is working", 
            "response": str(simple_result)
        }
    except Exception as e:
        logger.error(f"Error invoking Gemini: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "status": "error", 
            "message": f"Failed to connect to Gemini API: {str(e)}",
            "traceback": traceback.format_exc()
        }

@app.get("/direct-test")
async def direct_test():
    try:
        # Use Google's API directly
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("Say hello")
        return {
            "status": "success",
            "response": response.text
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
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
