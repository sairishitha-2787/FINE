import asyncio
import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
import math

from config.database import get_mood_logs_collection, get_user_data_collection
from utils.logger import get_logger

logger = get_logger(__name__)

class ForecastingModule:
    """
    Forecasting module for predicting future financial and emotional trends
    """
    
    def __init__(self):
        self.forecast_horizons = {
            "short": 7,    # 1 week
            "medium": 30,  # 1 month
            "long": 90     # 3 months
        }
    
    async def generate_forecast(self, user_id: str, forecast_type: str = "spending", days: int = 30) -> Dict[str, Any]:
        """
        Generate forecast for a user
        """
        try:
            logger.info(f"Generating {forecast_type} forecast for user {user_id}")
            
            if forecast_type == "spending":
                return await self._forecast_spending(user_id, days)
            elif forecast_type == "mood":
                return await self._forecast_mood(user_id, days)
            elif forecast_type == "budget":
                return await self._forecast_budget(user_id, days)
            else:
                return await self._forecast_comprehensive(user_id, days)
                
        except Exception as e:
            logger.error(f"Error generating forecast for user {user_id}: {str(e)}")
            return {
                "success": False,
                "data": {},
                "confidence": 0.0,
                "message": f"Forecast generation failed: {str(e)}"
            }
    
    async def _forecast_spending(self, user_id: str, days: int) -> Dict[str, Any]:
        """
        Forecast spending patterns
        """
        try:
            # Get historical mood data (in real implementation, this would include actual spending data)
            mood_logs_collection = get_mood_logs_collection()
            mood_logs = await mood_logs_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(500).to_list(length=500)
            
            if len(mood_logs) < 30:
                return {
                    "success": False,
                    "data": {},
                    "confidence": 0.0,
                    "message": "Insufficient data for forecasting"
                }
            
            # Convert mood logs to spending simulation
            spending_data = self._simulate_spending_from_mood_logs(mood_logs)
            
            if not spending_data:
                return {
                    "success": False,
                    "data": {},
                    "confidence": 0.0,
                    "message": "Could not generate spending data"
                }
            
            # Generate forecast
            forecast = self._generate_spending_forecast(spending_data, days)
            
            return {
                "success": True,
                "data": forecast,
                "confidence": min(len(mood_logs) / 100, 0.9),
                "message": f"Spending forecast generated for {days} days"
            }
            
        except Exception as e:
            logger.error(f"Error forecasting spending: {str(e)}")
            return {
                "success": False,
                "data": {},
                "confidence": 0.0,
                "message": f"Spending forecast failed: {str(e)}"
            }
    
    async def _forecast_mood(self, user_id: str, days: int) -> Dict[str, Any]:
        """
        Forecast mood trends
        """
        try:
            mood_logs_collection = get_mood_logs_collection()
            mood_logs = await mood_logs_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(200).to_list(length=200)
            
            if len(mood_logs) < 20:
                return {
                    "success": False,
                    "data": {},
                    "confidence": 0.0,
                    "message": "Insufficient mood data for forecasting"
                }
            
            # Generate mood forecast
            forecast = self._generate_mood_forecast(mood_logs, days)
            
            return {
                "success": True,
                "data": forecast,
                "confidence": min(len(mood_logs) / 50, 0.8),
                "message": f"Mood forecast generated for {days} days"
            }
            
        except Exception as e:
            logger.error(f"Error forecasting mood: {str(e)}")
            return {
                "success": False,
                "data": {},
                "confidence": 0.0,
                "message": f"Mood forecast failed: {str(e)}"
            }
    
    async def _forecast_budget(self, user_id: str, days: int) -> Dict[str, Any]:
        """
        Forecast budget performance
        """
        try:
            # This would integrate with actual budget data from MySQL
            # For now, we'll simulate based on mood patterns
            
            mood_logs_collection = get_mood_logs_collection()
            mood_logs = await mood_logs_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(100).to_list(length=100)
            
            if len(mood_logs) < 20:
                return {
                    "success": False,
                    "data": {},
                    "confidence": 0.0,
                    "message": "Insufficient data for budget forecasting"
                }
            
            # Generate budget forecast
            forecast = self._generate_budget_forecast(mood_logs, days)
            
            return {
                "success": True,
                "data": forecast,
                "confidence": min(len(mood_logs) / 50, 0.7),
                "message": f"Budget forecast generated for {days} days"
            }
            
        except Exception as e:
            logger.error(f"Error forecasting budget: {str(e)}")
            return {
                "success": False,
                "data": {},
                "confidence": 0.0,
                "message": f"Budget forecast failed: {str(e)}"
            }
    
    async def _forecast_comprehensive(self, user_id: str, days: int) -> Dict[str, Any]:
        """
        Generate comprehensive forecast including spending, mood, and budget
        """
        try:
            # Get all forecast types
            spending_forecast = await self._forecast_spending(user_id, days)
            mood_forecast = await self._forecast_mood(user_id, days)
            budget_forecast = await self._forecast_budget(user_id, days)
            
            # Combine forecasts
            comprehensive_data = {
                "spending": spending_forecast.get("data", {}),
                "mood": mood_forecast.get("data", {}),
                "budget": budget_forecast.get("data", {}),
                "forecast_period": days,
                "generated_at": datetime.utcnow().isoformat()
            }
            
            # Calculate overall confidence
            confidences = [
                spending_forecast.get("confidence", 0),
                mood_forecast.get("confidence", 0),
                budget_forecast.get("confidence", 0)
            ]
            overall_confidence = np.mean([c for c in confidences if c > 0])
            
            return {
                "success": True,
                "data": comprehensive_data,
                "confidence": overall_confidence,
                "message": f"Comprehensive forecast generated for {days} days"
            }
            
        except Exception as e:
            logger.error(f"Error generating comprehensive forecast: {str(e)}")
            return {
                "success": False,
                "data": {},
                "confidence": 0.0,
                "message": f"Comprehensive forecast failed: {str(e)}"
            }
    
    def _simulate_spending_from_mood_logs(self, mood_logs: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """
        Simulate spending data from mood logs
        """
        try:
            spending_data = []
            
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                created_at = log.get("createdAt", datetime.utcnow())
                
                # Convert mood to spending amount
                base_amount = 50
                mood_multipliers = {
                    "happy": 1.2, "excited": 1.3, "sad": 1.1, "anxious": 1.4,
                    "angry": 1.1, "calm": 0.8, "neutral": 1.0, "worried": 1.2
                }
                
                amount = base_amount * mood_multipliers.get(mood, 1.0) * (intensity / 10)
                
                spending_data.append({
                    "date": created_at,
                    "amount": amount,
                    "mood": mood,
                    "intensity": intensity
                })
            
            return spending_data
            
        except Exception as e:
            logger.error(f"Error simulating spending data: {str(e)}")
            return None
    
    def _generate_spending_forecast(self, spending_data: List[Dict[str, Any]], days: int) -> Dict[str, Any]:
        """
        Generate spending forecast using time series analysis
        """
        try:
            # Convert to DataFrame
            df = pd.DataFrame(spending_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Create time features
            df['day_of_week'] = df['date'].dt.dayofweek
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
            
            # Prepare features for regression
            X = df[['days_since_start', 'day_of_week', 'is_weekend']].values
            y = df['amount'].values
            
            if len(X) < 10:
                # Not enough data for regression, use simple average
                avg_spending = np.mean(y)
                predicted_amount = avg_spending * days
                
                return {
                    "predicted_amount": predicted_amount,
                    "daily_average": avg_spending,
                    "confidence_interval": {
                        "lower": predicted_amount * 0.8,
                        "upper": predicted_amount * 1.2
                    },
                    "trend": "stable",
                    "method": "average"
                }
            
            # Use polynomial regression for trend
            poly_features = PolynomialFeatures(degree=2)
            X_poly = poly_features.fit_transform(X)
            
            model = LinearRegression()
            model.fit(X_poly, y)
            
            # Generate future dates
            last_date = df['date'].max()
            future_dates = [last_date + timedelta(days=i) for i in range(1, days + 1)]
            
            # Prepare future features
            future_df = pd.DataFrame({
                'date': future_dates,
                'day_of_week': [d.weekday() for d in future_dates],
                'is_weekend': [1 if d.weekday() in [5, 6] else 0 for d in future_dates],
                'days_since_start': [(d - df['date'].min()).days for d in future_dates]
            })
            
            X_future = future_df[['days_since_start', 'day_of_week', 'is_weekend']].values
            X_future_poly = poly_features.transform(X_future)
            
            # Make predictions
            predictions = model.predict(X_future_poly)
            
            # Calculate statistics
            predicted_amount = np.sum(predictions)
            daily_average = predicted_amount / days
            
            # Calculate confidence interval (simplified)
            residuals = y - model.predict(X_poly)
            std_error = np.std(residuals)
            confidence_margin = 1.96 * std_error * np.sqrt(days)  # 95% confidence
            
            # Determine trend
            if len(predictions) > 1:
                trend_slope = np.polyfit(range(len(predictions)), predictions, 1)[0]
                if trend_slope > 0.1:
                    trend = "increasing"
                elif trend_slope < -0.1:
                    trend = "decreasing"
                else:
                    trend = "stable"
            else:
                trend = "stable"
            
            return {
                "predicted_amount": predicted_amount,
                "daily_average": daily_average,
                "confidence_interval": {
                    "lower": predicted_amount - confidence_margin,
                    "upper": predicted_amount + confidence_margin
                },
                "trend": trend,
                "method": "polynomial_regression",
                "daily_predictions": predictions.tolist()
            }
            
        except Exception as e:
            logger.error(f"Error generating spending forecast: {str(e)}")
            # Fallback to simple average
            amounts = [item['amount'] for item in spending_data]
            avg_spending = np.mean(amounts)
            predicted_amount = avg_spending * days
            
            return {
                "predicted_amount": predicted_amount,
                "daily_average": avg_spending,
                "confidence_interval": {
                    "lower": predicted_amount * 0.8,
                    "upper": predicted_amount * 1.2
                },
                "trend": "stable",
                "method": "fallback_average"
            }
    
    def _generate_mood_forecast(self, mood_logs: List[Dict[str, Any]], days: int) -> Dict[str, Any]:
        """
        Generate mood forecast
        """
        try:
            # Convert mood logs to time series
            mood_scores = []
            dates = []
            
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                created_at = log.get("createdAt", datetime.utcnow())
                
                # Convert mood to numeric score
                mood_numeric = {
                    "sad": 1, "anxious": 2, "angry": 2, "worried": 3,
                    "neutral": 5, "calm": 6, "content": 7,
                    "happy": 8, "excited": 9
                }.get(mood, 5)
                
                mood_score = mood_numeric * (intensity / 10)
                mood_scores.append(mood_score)
                dates.append(created_at)
            
            if len(mood_scores) < 10:
                # Not enough data, use average
                avg_mood = np.mean(mood_scores)
                return {
                    "predicted_mood_score": avg_mood,
                    "trend": "stable",
                    "method": "average"
                }
            
            # Create time series
            df = pd.DataFrame({
                'date': dates,
                'mood_score': mood_scores
            })
            df = df.sort_values('date')
            df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
            
            # Simple linear trend
            X = df[['days_since_start']].values
            y = df['mood_score'].values
            
            model = LinearRegression()
            model.fit(X, y)
            
            # Predict future mood
            last_day = df['days_since_start'].max()
            future_days = np.array([[last_day + i] for i in range(1, days + 1)])
            future_mood_scores = model.predict(future_days)
            
            predicted_mood_score = np.mean(future_mood_scores)
            
            # Determine trend
            if len(future_mood_scores) > 1:
                trend_slope = np.polyfit(range(len(future_mood_scores)), future_mood_scores, 1)[0]
                if trend_slope > 0.05:
                    trend = "improving"
                elif trend_slope < -0.05:
                    trend = "declining"
                else:
                    trend = "stable"
            else:
                trend = "stable"
            
            return {
                "predicted_mood_score": predicted_mood_score,
                "trend": trend,
                "method": "linear_regression",
                "daily_predictions": future_mood_scores.tolist()
            }
            
        except Exception as e:
            logger.error(f"Error generating mood forecast: {str(e)}")
            # Fallback to average
            mood_scores = []
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = {
                    "sad": 1, "anxious": 2, "angry": 2, "worried": 3,
                    "neutral": 5, "calm": 6, "content": 7,
                    "happy": 8, "excited": 9
                }.get(mood, 5)
                mood_scores.append(mood_numeric * (intensity / 10))
            
            avg_mood = np.mean(mood_scores)
            return {
                "predicted_mood_score": avg_mood,
                "trend": "stable",
                "method": "fallback_average"
            }
    
    def _generate_budget_forecast(self, mood_logs: List[Dict[str, Any]], days: int) -> Dict[str, Any]:
        """
        Generate budget forecast
        """
        try:
            # Simulate budget performance based on mood patterns
            # In real implementation, this would use actual budget data
            
            # Calculate mood-based spending risk
            recent_moods = [log.get("mood", "neutral") for log in mood_logs[-20:]]
            high_risk_moods = ["anxious", "sad", "angry", "stressed"]
            risk_mood_count = sum(1 for mood in recent_moods if mood in high_risk_moods)
            risk_ratio = risk_mood_count / len(recent_moods) if recent_moods else 0
            
            # Estimate budget performance
            base_budget = 1000  # Base monthly budget
            risk_adjustment = 1 + (risk_ratio * 0.3)  # 30% increase for high-risk moods
            
            predicted_spending = base_budget * risk_adjustment * (days / 30)
            budget_health = max(0, 1 - risk_ratio)
            
            return {
                "predicted_spending": predicted_spending,
                "budget_health": budget_health,
                "risk_level": "high" if risk_ratio > 0.5 else "medium" if risk_ratio > 0.2 else "low",
                "recommendation": self._get_budget_recommendation(risk_ratio),
                "method": "mood_based_simulation"
            }
            
        except Exception as e:
            logger.error(f"Error generating budget forecast: {str(e)}")
            return {
                "predicted_spending": 1000 * (days / 30),
                "budget_health": 0.7,
                "risk_level": "medium",
                "recommendation": "Monitor spending patterns",
                "method": "fallback"
            }
    
    def _get_budget_recommendation(self, risk_ratio: float) -> str:
        """
        Get budget recommendation based on risk ratio
        """
        if risk_ratio > 0.6:
            return "Consider setting up spending alerts and reviewing your budget more frequently"
        elif risk_ratio > 0.3:
            return "Monitor your mood and spending patterns closely"
        else:
            return "Your budget appears to be on track"
