from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import logging
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from config.database import connect_mongodb, get_mongodb
from services.emotional_insight_agent import EmotionalInsightAgent
from services.nlp_module import NLPModule
from services.clustering_module import ClusteringModule
from services.forecasting_module import ForecastingModule
from services.recommendation_module import RecommendationModule
from services.feature_engineering import FeatureEngineeringModule
from utils.logger import setup_logger

# Load environment variables
load_dotenv()

# Setup logging
logger = setup_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="FINE ML Service",
    description="Machine Learning microservice for FINE Finance Intelligent Ecosystem",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Global variables for ML modules
emotional_insight_agent = None
nlp_module = None
clustering_module = None
forecasting_module = None
recommendation_module = None
feature_engineering = None

# Pydantic models
class InsightRequest(BaseModel):
    userId: str
    type: str = "comprehensive"
    forceRefresh: bool = False

class InsightResponse(BaseModel):
    success: bool
    insights: List[Dict[str, Any]]
    processingTime: float
    message: Optional[str] = None

class MoodAnalysisRequest(BaseModel):
    userId: str
    text: str
    context: Optional[str] = None

class MoodAnalysisResponse(BaseModel):
    success: bool
    mood: str
    confidence: float
    sentiment: float
    emotions: Dict[str, float]
    message: Optional[str] = None

class ForecastRequest(BaseModel):
    userId: str
    forecastType: str = "spending"
    days: int = 30

class ForecastResponse(BaseModel):
    success: bool
    forecast: Dict[str, Any]
    confidence: float
    message: Optional[str] = None

class RecommendationRequest(BaseModel):
    userId: str
    recommendationType: str = "general"
    limit: int = 5

class RecommendationResponse(BaseModel):
    success: bool
    recommendations: List[Dict[str, Any]]
    message: Optional[str] = None

# Dependency to get MongoDB connection
async def get_database():
    db = get_mongodb()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return db

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize ML modules and database connections"""
    try:
        logger.info("Starting FINE ML Service...")
        
        # Connect to MongoDB
        await connect_mongodb()
        logger.info("✅ MongoDB connected")
        
        # Initialize ML modules
        global emotional_insight_agent, nlp_module, clustering_module, forecasting_module, recommendation_module, feature_engineering
        
        feature_engineering = FeatureEngineeringModule()
        nlp_module = NLPModule()
        clustering_module = ClusteringModule()
        forecasting_module = ForecastingModule()
        recommendation_module = RecommendationModule()
        emotional_insight_agent = EmotionalInsightAgent(
            nlp_module=nlp_module,
            clustering_module=clustering_module,
            forecasting_module=forecasting_module,
            recommendation_module=recommendation_module,
            feature_engineering=feature_engineering
        )
        
        logger.info("✅ All ML modules initialized")
        logger.info("🚀 FINE ML Service ready!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "FINE ML Service",
        "version": "1.0.0"
    }

# Generate insights endpoint
@app.post("/api/insights/generate", response_model=InsightResponse)
async def generate_insights(
    request: InsightRequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_database)
):
    """Generate comprehensive insights for a user"""
    try:
        start_time = datetime.utcnow()
        
        logger.info(f"Generating insights for user {request.userId}")
        
        # Generate insights using the emotional insight agent
        insights = await emotional_insight_agent.generate_insights(
            user_id=request.userId,
            insight_type=request.type,
            force_refresh=request.forceRefresh
        )
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        logger.info(f"Generated {len(insights)} insights for user {request.userId} in {processing_time:.2f}s")
        
        return InsightResponse(
            success=True,
            insights=insights,
            processingTime=processing_time,
            message=f"Generated {len(insights)} insights successfully"
        )
        
    except Exception as e:
        logger.error(f"Error generating insights for user {request.userId}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

# Analyze mood from text
@app.post("/api/mood/analyze", response_model=MoodAnalysisResponse)
async def analyze_mood(
    request: MoodAnalysisRequest,
    db=Depends(get_database)
):
    """Analyze mood and sentiment from text"""
    try:
        logger.info(f"Analyzing mood for user {request.userId}")
        
        # Use NLP module to analyze mood
        analysis = await nlp_module.analyze_mood(
            text=request.text,
            context=request.context
        )
        
        return MoodAnalysisResponse(
            success=True,
            mood=analysis["mood"],
            confidence=analysis["confidence"],
            sentiment=analysis["sentiment"],
            emotions=analysis["emotions"],
            message="Mood analysis completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error analyzing mood for user {request.userId}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze mood: {str(e)}")

# Generate forecast
@app.post("/api/forecast/generate", response_model=ForecastResponse)
async def generate_forecast(
    request: ForecastRequest,
    db=Depends(get_database)
):
    """Generate financial forecast for a user"""
    try:
        logger.info(f"Generating {request.forecastType} forecast for user {request.userId}")
        
        # Use forecasting module
        forecast = await forecasting_module.generate_forecast(
            user_id=request.userId,
            forecast_type=request.forecastType,
            days=request.days
        )
        
        return ForecastResponse(
            success=True,
            forecast=forecast["data"],
            confidence=forecast["confidence"],
            message=f"{request.forecastType.title()} forecast generated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error generating forecast for user {request.userId}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate forecast: {str(e)}")

# Generate recommendations
@app.post("/api/recommendations/generate", response_model=RecommendationResponse)
async def generate_recommendations(
    request: RecommendationRequest,
    db=Depends(get_database)
):
    """Generate personalized recommendations for a user"""
    try:
        logger.info(f"Generating {request.recommendationType} recommendations for user {request.userId}")
        
        # Use recommendation module
        recommendations = await recommendation_module.generate_recommendations(
            user_id=request.userId,
            recommendation_type=request.recommendationType,
            limit=request.limit
        )
        
        return RecommendationResponse(
            success=True,
            recommendations=recommendations,
            message=f"Generated {len(recommendations)} recommendations successfully"
        )
        
    except Exception as e:
        logger.error(f"Error generating recommendations for user {request.userId}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

# Get user patterns
@app.get("/api/patterns/{user_id}")
async def get_user_patterns(
    user_id: str,
    pattern_type: str = "all",
    days: int = 90,
    db=Depends(get_database)
):
    """Get user behavior patterns"""
    try:
        logger.info(f"Getting {pattern_type} patterns for user {user_id}")
        
        # Use clustering module to identify patterns
        patterns = await clustering_module.identify_patterns(
            user_id=user_id,
            pattern_type=pattern_type,
            days=days
        )
        
        return {
            "success": True,
            "patterns": patterns,
            "message": f"Retrieved {len(patterns)} patterns successfully"
        }
        
    except Exception as e:
        logger.error(f"Error getting patterns for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get patterns: {str(e)}")

# Process user data (background task)
@app.post("/api/data/process")
async def process_user_data(
    user_id: str,
    background_tasks: BackgroundTasks,
    db=Depends(get_database)
):
    """Process user data for ML insights (background task)"""
    try:
        logger.info(f"Queuing data processing for user {user_id}")
        
        # Add background task
        background_tasks.add_task(
            emotional_insight_agent.process_user_data,
            user_id=user_id
        )
        
        return {
            "success": True,
            "message": "Data processing queued successfully"
        }
        
    except Exception as e:
        logger.error(f"Error queuing data processing for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to queue data processing: {str(e)}")

# Get ML service status
@app.get("/api/status")
async def get_service_status():
    """Get ML service status and module health"""
    try:
        status = {
            "service": "FINE ML Service",
            "version": "1.0.0",
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "modules": {
                "emotional_insight_agent": emotional_insight_agent is not None,
                "nlp_module": nlp_module is not None,
                "clustering_module": clustering_module is not None,
                "forecasting_module": forecasting_module is not None,
                "recommendation_module": recommendation_module is not None,
                "feature_engineering": feature_engineering is not None
            }
        }
        
        return status
        
    except Exception as e:
        logger.error(f"Error getting service status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get service status: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
