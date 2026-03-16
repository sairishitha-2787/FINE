from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="FINE API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "FINE API is running"}

@app.get("/health")
def health():
    return {"status": "healthy", "supabase": "connected"}

from pydantic import BaseModel

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

@app.post("/auth/signup")
async def signup(request: SignupRequest):
    try:
        # Step 1: Create auth user in Supabase
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        user_id = auth_response.user.id
        
        # Step 2: Insert into our users table
        supabase.table("users").insert({
            "id": user_id,
            "name": request.name,
            "email": request.email,
            "onboarding_complete": False
        }).execute()
        
        return {"message": "Account created", "user_id": user_id}
    
    except Exception as e:
        return {"error": str(e)}
    
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/auth/login")
async def login(request: LoginRequest):
    try:
        # Step 1: Sign in with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        # hint: supabase.auth.sign_in_with_password()
        
        # Step 2: Get the user_id from the response
        user_id = auth_response.user.id
        
        # Step 3: Fetch user data from users table
        user_data = supabase.table("users").select("*").eq("id", user_id).execute()
        
        # Step 4: Return session token + user data
        return {"access_token": auth_response.session.access_token, "user": user_data.data[0]}
        
    except Exception as e:
        return {"error": str(e)}