from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from dotenv import load_dotenv
from pydantic import BaseModel
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
        
        # Step 2: Get the user_id from the response
        user_id = auth_response.user.id
        
        # Step 3: Fetch user data from users table
        user_data = supabase.table("users").select("*").eq("id", user_id).execute()
        
        # Step 4: Return session token + user data
        return {"access_token": auth_response.session.access_token, "user": user_data.data[0]}
        
    except Exception as e:
        return {"error": str(e)}

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
class OnboardingRequest(BaseModel):
    communication_style: str
    financial_situation: str
    nudge_preference: str

@app.put("/user/onboarding")
async def complete_onboarding(request: OnboardingRequest, current_user = Depends(get_current_user)):
    try:
        # Step 1: Get user_id from current_user
        user_id = current_user.id
        
        # Step 2: Update the users table
        supabase.table("users").update({
            "communication_style": request.communication_style,
            "financial_situation": request.financial_situation,
            "nudge_preference": request.nudge_preference,
            "onboarding_complete": True
        }).eq("id", user_id).execute()
       
        
        # Step 3: Return success message
        return {"message": "Onboarding completed"}
    
    except Exception as e:
        return {"error": str(e)}
    
class TransactionRequest(BaseModel):
    amount: float
    category: str
    mood: str
    note: str = None  # optional field with default None
    date_time: str = None  # optional, defaults to now

@app.post("/transactions")
async def log_transaction(request: TransactionRequest, current_user = Depends(get_current_user)):
    try:
        # Step 1: Get user_id from current_user
        user_id = current_user.id
        # Step 2: Build transaction data
        transaction_data = {
            "user_id": user_id,
            "amount": request.amount,
            "category": request.category,
            "mood": request.mood
        }
        if request.note is not None:
            transaction_data["note"] = request.note
        if request.date_time is not None:
            transaction_data["date_time"] = request.date_time

        # Step 3: Insert into transactions table
        supabase.table("transactions").insert(transaction_data).execute()
        
        # Step 4: Return the created transaction
        return {"message": "Transaction logged"}
    
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/transactions")
async def get_transactions(current_user = Depends(get_current_user)):
    try:
        # Step 1: Get user_id
        user_id = current_user.id

        # Step 2: Fetch all transactions for this user
        transactions = supabase.table("transactions").select("*").eq("user_id", user_id).order("date_time", desc=True).execute()
        
        # Step 3: Return the transactions
        return {"transactions": transactions.data}
        
    except Exception as e:
        return {"error": str(e)}