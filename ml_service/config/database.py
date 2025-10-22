import motor.motor_asyncio
import logging
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Global MongoDB client
client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
database = None

async def connect_mongodb():
    """Connect to MongoDB"""
    global client, database
    
    try:
        mongodb_url = os.getenv("MONGODB_URI", "mongodb://localhost:27017/fine_insights")
        
        client = motor.motor_asyncio.AsyncIOMotorClient(
            mongodb_url,
            maxPoolSize=10,
            serverSelectionTimeoutMS=5000,
            socketTimeoutMS=45000
        )
        
        # Test the connection
        await client.admin.command('ping')
        
        # Get database
        database = client.fine_insights
        
        logger.info("✅ MongoDB connected successfully")
        
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {str(e)}")
        raise

async def close_mongodb():
    """Close MongoDB connection"""
    global client
    
    if client:
        client.close()
        logger.info("🔌 MongoDB connection closed")

def get_mongodb():
    """Get MongoDB database instance"""
    return database

def get_collection(collection_name: str):
    """Get a specific collection"""
    if database is None:
        raise Exception("Database not connected")
    return database[collection_name]

# Collections
def get_mood_logs_collection():
    """Get mood logs collection"""
    return get_collection("moodlogs")

def get_insights_collection():
    """Get insights collection"""
    return get_collection("insights")

def get_feedback_collection():
    """Get feedback collection"""
    return get_collection("feedback")

def get_user_data_collection():
    """Get user data collection for ML processing"""
    return get_collection("user_data")

def get_patterns_collection():
    """Get patterns collection"""
    return get_collection("patterns")

def get_models_collection():
    """Get ML models collection"""
    return get_collection("models")
