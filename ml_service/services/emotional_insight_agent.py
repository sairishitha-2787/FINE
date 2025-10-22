import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from pymongo import MongoClient

from config.database import get_mood_logs_collection, get_insights_collection, get_user_data_collection
from utils.logger import get_logger

logger = get_logger(__name__)

class EmotionalInsightAgent:
    """
    Main AI agent that orchestrates emotional and financial insights
    """
    
    def __init__(self, nlp_module, clustering_module, forecasting_module, recommendation_module, feature_engineering):
        self.nlp_module = nlp_module
        self.clustering_module = clustering_module
        self.forecasting_module = forecasting_module
        self.recommendation_module = recommendation_module
        self.feature_engineering = feature_engineering
        
        # Insight templates
        self.insight_templates = {
            "spending_pattern": {
                "title_template": "Spending Pattern Detected: {pattern_name}",
                "description_template": "You tend to spend {amount} on {category} when you're feeling {mood}. This pattern has been observed {frequency} times in the last {days} days.",
                "priority": "medium",
                "category": "financial"
            },
            "mood_correlation": {
                "title_template": "Mood-Spending Correlation Found",
                "description_template": "Your spending increases by {percentage}% when you're feeling {mood}. Consider setting up a mood-based spending alert.",
                "priority": "high",
                "category": "emotional"
            },
            "budget_insight": {
                "title_template": "Budget Optimization Opportunity",
                "description_template": "You could save {amount} per month by reducing {category} spending by {percentage}%. This would help you reach your {goal} goal faster.",
                "priority": "high",
                "category": "financial"
            },
            "behavioral_trigger": {
                "title_template": "Spending Trigger Identified",
                "description_template": "You're more likely to make impulse purchases when {trigger_condition}. Consider implementing a 24-hour rule for purchases over ${amount}.",
                "priority": "medium",
                "category": "behavioral"
            },
            "recommendation": {
                "title_template": "Personalized Recommendation",
                "description_template": "{recommendation_text}",
                "priority": "medium",
                "category": "actionable"
            },
            "forecast": {
                "title_template": "Financial Forecast",
                "description_template": "Based on your current patterns, you're projected to spend {amount} in the next {days} days. Your mood score is expected to be {mood_score}.",
                "priority": "low",
                "category": "predictive"
            }
        }
    
    async def generate_insights(self, user_id: str, insight_type: str = "comprehensive", force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Generate comprehensive insights for a user
        """
        try:
            logger.info(f"Generating {insight_type} insights for user {user_id}")
            
            # Get user data
            user_data = await self._get_user_data(user_id)
            
            if not user_data:
                logger.warning(f"No data found for user {user_id}")
                return []
            
            insights = []
            
            if insight_type == "comprehensive" or insight_type == "spending_pattern":
                spending_insights = await self._generate_spending_pattern_insights(user_id, user_data)
                insights.extend(spending_insights)
            
            if insight_type == "comprehensive" or insight_type == "mood_correlation":
                mood_insights = await self._generate_mood_correlation_insights(user_id, user_data)
                insights.extend(mood_insights)
            
            if insight_type == "comprehensive" or insight_type == "budget_insight":
                budget_insights = await self._generate_budget_insights(user_id, user_data)
                insights.extend(budget_insights)
            
            if insight_type == "comprehensive" or insight_type == "behavioral_trigger":
                behavioral_insights = await self._generate_behavioral_insights(user_id, user_data)
                insights.extend(behavioral_insights)
            
            if insight_type == "comprehensive" or insight_type == "recommendation":
                recommendation_insights = await self._generate_recommendation_insights(user_id, user_data)
                insights.extend(recommendation_insights)
            
            if insight_type == "comprehensive" or insight_type == "forecast":
                forecast_insights = await self._generate_forecast_insights(user_id, user_data)
                insights.extend(forecast_insights)
            
            # Save insights to database
            await self._save_insights(user_id, insights)
            
            logger.info(f"Generated {len(insights)} insights for user {user_id}")
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights for user {user_id}: {str(e)}")
            raise
    
    async def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive user data for analysis
        """
        try:
            # Get mood logs
            mood_logs_collection = get_mood_logs_collection()
            mood_logs = await mood_logs_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(1000).to_list(length=1000)
            
            # Get existing insights
            insights_collection = get_insights_collection()
            existing_insights = await insights_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(100).to_list(length=100)
            
            # Get user data from ML collection
            user_data_collection = get_user_data_collection()
            user_data = await user_data_collection.find_one({"userId": user_id})
            
            return {
                "mood_logs": mood_logs,
                "existing_insights": existing_insights,
                "user_data": user_data or {}
            }
            
        except Exception as e:
            logger.error(f"Error getting user data for {user_id}: {str(e)}")
            return {}
    
    async def _generate_spending_pattern_insights(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate spending pattern insights
        """
        insights = []
        
        try:
            # Analyze spending patterns using clustering
            patterns = await self.clustering_module.identify_spending_patterns(user_id)
            
            for pattern in patterns:
                insight = {
                    "userId": user_id,
                    "type": "spending_pattern",
                    "title": self.insight_templates["spending_pattern"]["title_template"].format(
                        pattern_name=pattern.get("name", "Unknown Pattern")
                    ),
                    "description": self.insight_templates["spending_pattern"]["description_template"].format(
                        amount=f"${pattern.get('avg_amount', 0):.2f}",
                        category=pattern.get("category", "various categories"),
                        mood=pattern.get("mood", "neutral"),
                        frequency=pattern.get("frequency", 0),
                        days=30
                    ),
                    "confidence": pattern.get("confidence", 0.7),
                    "priority": self.insight_templates["spending_pattern"]["priority"],
                    "category": self.insight_templates["spending_pattern"]["category"],
                    "data": {
                        "pattern": pattern,
                        "spendingAmount": pattern.get("avg_amount", 0),
                        "category": pattern.get("category"),
                        "timeframe": "30 days"
                    },
                    "isActionable": True,
                    "source": "ml_analysis",
                    "tags": ["spending", "pattern", "behavior"],
                    "expiresAt": datetime.utcnow() + timedelta(days=30)
                }
                insights.append(insight)
                
        except Exception as e:
            logger.error(f"Error generating spending pattern insights: {str(e)}")
        
        return insights
    
    async def _generate_mood_correlation_insights(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate mood correlation insights
        """
        insights = []
        
        try:
            # Analyze mood-spending correlations
            correlations = await self.clustering_module.analyze_mood_spending_correlation(user_id)
            
            for correlation in correlations:
                if correlation.get("correlation_strength", 0) > 0.3:  # Only significant correlations
                    insight = {
                        "userId": user_id,
                        "type": "mood_correlation",
                        "title": self.insight_templates["mood_correlation"]["title_template"],
                        "description": self.insight_templates["mood_correlation"]["description_template"].format(
                            percentage=f"{correlation.get('percentage_increase', 0):.1f}",
                            mood=correlation.get("mood", "stressed")
                        ),
                        "confidence": correlation.get("confidence", 0.6),
                        "priority": self.insight_templates["mood_correlation"]["priority"],
                        "category": self.insight_templates["mood_correlation"]["category"],
                        "data": {
                            "correlation": correlation,
                            "moodScore": correlation.get("mood_score", 0),
                            "spendingIncrease": correlation.get("percentage_increase", 0)
                        },
                        "isActionable": True,
                        "source": "ml_analysis",
                        "tags": ["mood", "spending", "correlation"],
                        "expiresAt": datetime.utcnow() + timedelta(days=14)
                    }
                    insights.append(insight)
                    
        except Exception as e:
            logger.error(f"Error generating mood correlation insights: {str(e)}")
        
        return insights
    
    async def _generate_budget_insights(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate budget optimization insights
        """
        insights = []
        
        try:
            # Get budget recommendations
            recommendations = await self.recommendation_module.get_budget_recommendations(user_id)
            
            for rec in recommendations:
                insight = {
                    "userId": user_id,
                    "type": "budget_insight",
                    "title": self.insight_templates["budget_insight"]["title_template"],
                    "description": self.insight_templates["budget_insight"]["description_template"].format(
                        amount=f"${rec.get('savings_amount', 0):.2f}",
                        category=rec.get("category", "various"),
                        percentage=f"{rec.get('reduction_percentage', 0):.1f}",
                        goal=rec.get("goal", "financial")
                    ),
                    "confidence": rec.get("confidence", 0.8),
                    "priority": self.insight_templates["budget_insight"]["priority"],
                    "category": self.insight_templates["budget_insight"]["category"],
                    "data": {
                        "recommendation": rec,
                        "savingsAmount": rec.get("savings_amount", 0),
                        "category": rec.get("category")
                    },
                    "isActionable": True,
                    "source": "ml_analysis",
                    "tags": ["budget", "savings", "optimization"],
                    "expiresAt": datetime.utcnow() + timedelta(days=7)
                }
                insights.append(insight)
                
        except Exception as e:
            logger.error(f"Error generating budget insights: {str(e)}")
        
        return insights
    
    async def _generate_behavioral_insights(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate behavioral trigger insights
        """
        insights = []
        
        try:
            # Identify behavioral triggers
            triggers = await self.clustering_module.identify_behavioral_triggers(user_id)
            
            for trigger in triggers:
                insight = {
                    "userId": user_id,
                    "type": "behavioral_trigger",
                    "title": self.insight_templates["behavioral_trigger"]["title_template"],
                    "description": self.insight_templates["behavioral_trigger"]["description_template"].format(
                        trigger_condition=trigger.get("condition", "in certain situations"),
                        amount=trigger.get("threshold_amount", 50)
                    ),
                    "confidence": trigger.get("confidence", 0.6),
                    "priority": self.insight_templates["behavioral_trigger"]["priority"],
                    "category": self.insight_templates["behavioral_trigger"]["category"],
                    "data": {
                        "trigger": trigger,
                        "thresholdAmount": trigger.get("threshold_amount", 50)
                    },
                    "isActionable": True,
                    "source": "ml_analysis",
                    "tags": ["behavior", "trigger", "impulse"],
                    "expiresAt": datetime.utcnow() + timedelta(days=21)
                }
                insights.append(insight)
                
        except Exception as e:
            logger.error(f"Error generating behavioral insights: {str(e)}")
        
        return insights
    
    async def _generate_recommendation_insights(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate personalized recommendations
        """
        insights = []
        
        try:
            # Get personalized recommendations
            recommendations = await self.recommendation_module.generate_recommendations(
                user_id=user_id,
                recommendation_type="general",
                limit=3
            )
            
            for rec in recommendations:
                insight = {
                    "userId": user_id,
                    "type": "recommendation",
                    "title": self.insight_templates["recommendation"]["title_template"],
                    "description": self.insight_templates["recommendation"]["description_template"].format(
                        recommendation_text=rec.get("message", "Consider this personalized recommendation.")
                    ),
                    "confidence": rec.get("confidence", 0.7),
                    "priority": rec.get("priority", "medium"),
                    "category": self.insight_templates["recommendation"]["category"],
                    "data": {
                        "recommendation": rec,
                        "actionable": rec.get("actionable", "Consider implementing this recommendation.")
                    },
                    "isActionable": True,
                    "source": "ml_analysis",
                    "tags": rec.get("tags", ["recommendation"]),
                    "expiresAt": datetime.utcnow() + timedelta(days=14)
                }
                insights.append(insight)
                
        except Exception as e:
            logger.error(f"Error generating recommendation insights: {str(e)}")
        
        return insights
    
    async def _generate_forecast_insights(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate forecast insights
        """
        insights = []
        
        try:
            # Generate spending forecast
            forecast = await self.forecasting_module.generate_forecast(
                user_id=user_id,
                forecast_type="spending",
                days=30
            )
            
            if forecast and forecast.get("data"):
                insight = {
                    "userId": user_id,
                    "type": "forecast",
                    "title": self.insight_templates["forecast"]["title_template"],
                    "description": self.insight_templates["forecast"]["description_template"].format(
                        amount=f"${forecast['data'].get('predicted_amount', 0):.2f}",
                        days=30,
                        mood_score=f"{forecast['data'].get('predicted_mood_score', 5):.1f}"
                    ),
                    "confidence": forecast.get("confidence", 0.6),
                    "priority": self.insight_templates["forecast"]["priority"],
                    "category": self.insight_templates["forecast"]["category"],
                    "data": {
                        "forecast": forecast["data"],
                        "nextWeekPrediction": forecast["data"].get("predicted_amount", 0),
                        "confidence": forecast.get("confidence", 0.6)
                    },
                    "isActionable": False,
                    "source": "ml_analysis",
                    "tags": ["forecast", "prediction", "spending"],
                    "expiresAt": datetime.utcnow() + timedelta(days=7)
                }
                insights.append(insight)
                
        except Exception as e:
            logger.error(f"Error generating forecast insights: {str(e)}")
        
        return insights
    
    async def _save_insights(self, user_id: str, insights: List[Dict[str, Any]]):
        """
        Save insights to database
        """
        try:
            if not insights:
                return
            
            insights_collection = get_insights_collection()
            
            # Add metadata to each insight
            for insight in insights:
                insight["createdAt"] = datetime.utcnow()
                insight["updatedAt"] = datetime.utcnow()
                insight["isRead"] = False
                insight["actionTaken"] = False
            
            # Insert insights
            await insights_collection.insert_many(insights)
            logger.info(f"Saved {len(insights)} insights for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error saving insights for user {user_id}: {str(e)}")
    
    async def process_user_data(self, user_id: str):
        """
        Process user data for ML analysis (background task)
        """
        try:
            logger.info(f"Processing user data for {user_id}")
            
            # Feature engineering
            features = await self.feature_engineering.extract_features(user_id)
            
            # Save processed data
            user_data_collection = get_user_data_collection()
            await user_data_collection.update_one(
                {"userId": user_id},
                {
                    "$set": {
                        "features": features,
                        "lastProcessed": datetime.utcnow(),
                        "processedAt": datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            logger.info(f"Completed data processing for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error processing user data for {user_id}: {str(e)}")
