import asyncio
import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

from config.database import get_mood_logs_collection, get_insights_collection, get_user_data_collection
from utils.logger import get_logger

logger = get_logger(__name__)

class RecommendationModule:
    """
    Recommendation module for generating personalized financial and behavioral recommendations
    """
    
    def __init__(self):
        self.recommendation_templates = {
            "spending": {
                "high_spending": "Consider setting a daily spending limit of ${amount} to help control your expenses.",
                "impulse_spending": "Try implementing a 24-hour rule for purchases over ${amount} to reduce impulse buying.",
                "mood_spending": "When feeling {mood}, consider taking a walk or calling a friend before making purchases.",
                "category_spending": "You've spent ${amount} on {category} this month. Consider if this aligns with your goals."
            },
            "budget": {
                "overspending": "You're ${amount} over budget this month. Consider reducing {category} spending by {percentage}%.",
                "underspending": "Great job! You're ${amount} under budget. Consider allocating this to your savings goal.",
                "category_overspend": "Your {category} spending is {percentage}% over budget. Try meal planning or finding alternatives.",
                "emergency_fund": "Consider building an emergency fund with ${amount} to cover unexpected expenses."
            },
            "behavioral": {
                "mood_tracking": "You've logged your mood {count} times this week. Keep it up for better insights!",
                "spending_awareness": "Try logging your mood before each purchase to understand your spending triggers.",
                "goal_progress": "You're making great progress on your {goal} goal! Consider increasing your monthly contribution.",
                "habit_building": "Consistency is key! Try to log your transactions and mood at the same time each day."
            },
            "financial": {
                "savings": "Consider setting up automatic transfers of ${amount} to your savings account each month.",
                "debt_payment": "You could save ${amount} in interest by paying an extra ${extra} toward your debt each month.",
                "investment": "With your current savings rate, you could invest ${amount} monthly for long-term growth.",
                "retirement": "Consider increasing your retirement contribution by {percentage}% to reach your goals faster."
            }
        }
        
        self.recommendation_priorities = {
            "urgent": ["overspending", "debt_payment", "emergency_fund"],
            "high": ["high_spending", "impulse_spending", "category_overspend"],
            "medium": ["mood_spending", "savings", "goal_progress"],
            "low": ["mood_tracking", "habit_building", "investment"]
        }
    
    async def generate_recommendations(self, user_id: str, recommendation_type: str = "general", limit: int = 5) -> List[Dict[str, Any]]:
        """
        Generate personalized recommendations for a user
        """
        try:
            logger.info(f"Generating {recommendation_type} recommendations for user {user_id}")
            
            # Get user data
            user_data = await self._get_user_data(user_id)
            
            if not user_data:
                return []
            
            recommendations = []
            
            if recommendation_type == "general" or recommendation_type == "spending":
                spending_recs = await self._generate_spending_recommendations(user_id, user_data)
                recommendations.extend(spending_recs)
            
            if recommendation_type == "general" or recommendation_type == "budget":
                budget_recs = await self._generate_budget_recommendations(user_id, user_data)
                recommendations.extend(budget_recs)
            
            if recommendation_type == "general" or recommendation_type == "behavioral":
                behavioral_recs = await self._generate_behavioral_recommendations(user_id, user_data)
                recommendations.extend(behavioral_recs)
            
            if recommendation_type == "general" or recommendation_type == "financial":
                financial_recs = await self._generate_financial_recommendations(user_id, user_data)
                recommendations.extend(financial_recs)
            
            # Sort by priority and limit results
            recommendations = self._sort_recommendations(recommendations)
            recommendations = recommendations[:limit]
            
            logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations for user {user_id}: {str(e)}")
            return []
    
    async def get_budget_recommendations(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get specific budget recommendations
        """
        try:
            user_data = await self._get_user_data(user_id)
            if not user_data:
                return []
            
            return await self._generate_budget_recommendations(user_id, user_data)
            
        except Exception as e:
            logger.error(f"Error getting budget recommendations for user {user_id}: {str(e)}")
            return []
    
    async def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive user data for recommendations
        """
        try:
            # Get mood logs
            mood_logs_collection = get_mood_logs_collection()
            mood_logs = await mood_logs_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(200).to_list(length=200)
            
            # Get recent insights
            insights_collection = get_insights_collection()
            recent_insights = await insights_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(50).to_list(length=50)
            
            # Get user data from ML collection
            user_data_collection = get_user_data_collection()
            user_data = await user_data_collection.find_one({"userId": user_id})
            
            return {
                "mood_logs": mood_logs,
                "recent_insights": recent_insights,
                "user_data": user_data or {}
            }
            
        except Exception as e:
            logger.error(f"Error getting user data for {user_id}: {str(e)}")
            return {}
    
    async def _generate_spending_recommendations(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate spending-related recommendations
        """
        recommendations = []
        
        try:
            mood_logs = user_data.get("mood_logs", [])
            if len(mood_logs) < 10:
                return recommendations
            
            # Analyze spending patterns
            spending_analysis = self._analyze_spending_patterns(mood_logs)
            
            # High spending recommendation
            if spending_analysis.get("avg_daily_spending", 0) > 100:
                rec = {
                    "type": "spending",
                    "category": "high_spending",
                    "title": "High Daily Spending Detected",
                    "message": self.recommendation_templates["spending"]["high_spending"].format(
                        amount=spending_analysis.get("avg_daily_spending", 100)
                    ),
                    "priority": "high",
                    "confidence": 0.8,
                    "actionable": "Set a daily spending limit in your budget settings",
                    "tags": ["spending", "budget", "control"]
                }
                recommendations.append(rec)
            
            # Impulse spending recommendation
            if spending_analysis.get("impulse_ratio", 0) > 0.3:
                rec = {
                    "type": "spending",
                    "category": "impulse_spending",
                    "title": "Impulse Spending Pattern",
                    "message": self.recommendation_templates["spending"]["impulse_spending"].format(
                        amount=50
                    ),
                    "priority": "high",
                    "confidence": 0.7,
                    "actionable": "Enable spending notifications for purchases over $50",
                    "tags": ["spending", "impulse", "control"]
                }
                recommendations.append(rec)
            
            # Mood-based spending recommendation
            mood_spending = spending_analysis.get("mood_spending", {})
            if mood_spending:
                highest_mood = max(mood_spending, key=mood_spending.get)
                if mood_spending[highest_mood] > 1.2:  # 20% increase
                    rec = {
                        "type": "spending",
                        "category": "mood_spending",
                        "title": "Mood-Based Spending Alert",
                        "message": self.recommendation_templates["spending"]["mood_spending"].format(
                            mood=highest_mood
                        ),
                        "priority": "medium",
                        "confidence": 0.6,
                        "actionable": "Set up mood-based spending alerts",
                        "tags": ["spending", "mood", "awareness"]
                    }
                    recommendations.append(rec)
            
        except Exception as e:
            logger.error(f"Error generating spending recommendations: {str(e)}")
        
        return recommendations
    
    async def _generate_budget_recommendations(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate budget-related recommendations
        """
        recommendations = []
        
        try:
            mood_logs = user_data.get("mood_logs", [])
            if len(mood_logs) < 20:
                return recommendations
            
            # Simulate budget analysis (in real implementation, this would use actual budget data)
            budget_analysis = self._analyze_budget_performance(mood_logs)
            
            # Overspending recommendation
            if budget_analysis.get("overspent", False):
                rec = {
                    "type": "budget",
                    "category": "overspending",
                    "title": "Budget Overspend Alert",
                    "message": self.recommendation_templates["budget"]["overspending"].format(
                        amount=budget_analysis.get("overspend_amount", 200),
                        category=budget_analysis.get("overspend_category", "various"),
                        percentage=budget_analysis.get("reduction_percentage", 15)
                    ),
                    "priority": "urgent",
                    "confidence": 0.9,
                    "actionable": "Review your budget and adjust spending categories",
                    "tags": ["budget", "overspend", "urgent"]
                }
                recommendations.append(rec)
            
            # Emergency fund recommendation
            if not budget_analysis.get("has_emergency_fund", True):
                rec = {
                    "type": "budget",
                    "category": "emergency_fund",
                    "title": "Emergency Fund Needed",
                    "message": self.recommendation_templates["budget"]["emergency_fund"].format(
                        amount=1000
                    ),
                    "priority": "high",
                    "confidence": 0.8,
                    "actionable": "Set up automatic transfers to build your emergency fund",
                    "tags": ["budget", "emergency", "savings"]
                }
                recommendations.append(rec)
            
            # Category overspend recommendation
            category_overspend = budget_analysis.get("category_overspend", {})
            if category_overspend:
                category = max(category_overspend, key=category_overspend.get)
                percentage = category_overspend[category]
                if percentage > 20:  # 20% over budget
                    rec = {
                        "type": "budget",
                        "category": "category_overspend",
                        "title": f"{category.title()} Budget Overspend",
                        "message": self.recommendation_templates["budget"]["category_overspend"].format(
                            category=category,
                            percentage=percentage
                        ),
                        "priority": "high",
                        "confidence": 0.7,
                        "actionable": f"Review your {category} spending and find ways to reduce costs",
                        "tags": ["budget", "category", "overspend"]
                    }
                    recommendations.append(rec)
            
        except Exception as e:
            logger.error(f"Error generating budget recommendations: {str(e)}")
        
        return recommendations
    
    async def _generate_behavioral_recommendations(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate behavioral recommendations
        """
        recommendations = []
        
        try:
            mood_logs = user_data.get("mood_logs", [])
            if len(mood_logs) < 5:
                return recommendations
            
            # Mood tracking recommendation
            recent_mood_logs = [log for log in mood_logs if 
                              (datetime.utcnow() - log.get("createdAt", datetime.utcnow())).days <= 7]
            
            if len(recent_mood_logs) >= 5:
                rec = {
                    "type": "behavioral",
                    "category": "mood_tracking",
                    "title": "Great Mood Tracking!",
                    "message": self.recommendation_templates["behavioral"]["mood_tracking"].format(
                        count=len(recent_mood_logs)
                    ),
                    "priority": "low",
                    "confidence": 0.9,
                    "actionable": "Keep logging your mood for better insights",
                    "tags": ["behavioral", "mood", "tracking"]
                }
                recommendations.append(rec)
            
            # Spending awareness recommendation
            spending_awareness = self._analyze_spending_awareness(mood_logs)
            if spending_awareness.get("needs_improvement", False):
                rec = {
                    "type": "behavioral",
                    "category": "spending_awareness",
                    "title": "Improve Spending Awareness",
                    "message": self.recommendation_templates["behavioral"]["spending_awareness"],
                    "priority": "medium",
                    "confidence": 0.6,
                    "actionable": "Log your mood before each purchase",
                    "tags": ["behavioral", "spending", "awareness"]
                }
                recommendations.append(rec)
            
            # Habit building recommendation
            habit_analysis = self._analyze_habit_consistency(mood_logs)
            if habit_analysis.get("consistency_score", 0) < 0.7:
                rec = {
                    "type": "behavioral",
                    "category": "habit_building",
                    "title": "Build Consistent Habits",
                    "message": self.recommendation_templates["behavioral"]["habit_building"],
                    "priority": "medium",
                    "confidence": 0.7,
                    "actionable": "Set a daily reminder to log your mood and transactions",
                    "tags": ["behavioral", "habits", "consistency"]
                }
                recommendations.append(rec)
            
        except Exception as e:
            logger.error(f"Error generating behavioral recommendations: {str(e)}")
        
        return recommendations
    
    async def _generate_financial_recommendations(self, user_id: str, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate financial recommendations
        """
        recommendations = []
        
        try:
            mood_logs = user_data.get("mood_logs", [])
            if len(mood_logs) < 30:
                return recommendations
            
            # Analyze financial health
            financial_analysis = self._analyze_financial_health(mood_logs)
            
            # Savings recommendation
            if financial_analysis.get("savings_rate", 0) < 0.1:  # Less than 10% savings rate
                rec = {
                    "type": "financial",
                    "category": "savings",
                    "title": "Increase Savings Rate",
                    "message": self.recommendation_templates["financial"]["savings"].format(
                        amount=200
                    ),
                    "priority": "high",
                    "confidence": 0.8,
                    "actionable": "Set up automatic transfers to your savings account",
                    "tags": ["financial", "savings", "automation"]
                }
                recommendations.append(rec)
            
            # Investment recommendation
            if financial_analysis.get("savings_rate", 0) > 0.15:  # Good savings rate
                rec = {
                    "type": "financial",
                    "category": "investment",
                    "title": "Consider Investing",
                    "message": self.recommendation_templates["financial"]["investment"].format(
                        amount=300
                    ),
                    "priority": "medium",
                    "confidence": 0.7,
                    "actionable": "Research low-cost index funds for long-term growth",
                    "tags": ["financial", "investment", "growth"]
                }
                recommendations.append(rec)
            
            # Retirement recommendation
            if financial_analysis.get("age", 30) > 25:  # Assuming age > 25
                rec = {
                    "type": "financial",
                    "category": "retirement",
                    "title": "Boost Retirement Savings",
                    "message": self.recommendation_templates["financial"]["retirement"].format(
                        percentage=2
                    ),
                    "priority": "medium",
                    "confidence": 0.6,
                    "actionable": "Increase your 401(k) or IRA contribution",
                    "tags": ["financial", "retirement", "long-term"]
                }
                recommendations.append(rec)
            
        except Exception as e:
            logger.error(f"Error generating financial recommendations: {str(e)}")
        
        return recommendations
    
    def _analyze_spending_patterns(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze spending patterns from mood logs
        """
        try:
            if not mood_logs:
                return {}
            
            # Simulate spending analysis based on mood patterns
            total_spending = 0
            mood_spending = {}
            impulse_count = 0
            
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                
                # Simulate spending amount based on mood and intensity
                base_amount = 50
                mood_multipliers = {
                    "happy": 1.2, "excited": 1.3, "sad": 1.1, "anxious": 1.4,
                    "angry": 1.1, "calm": 0.8, "neutral": 1.0
                }
                
                amount = base_amount * mood_multipliers.get(mood, 1.0) * (intensity / 10)
                total_spending += amount
                
                # Track mood-based spending
                if mood not in mood_spending:
                    mood_spending[mood] = 0
                mood_spending[mood] += amount
                
                # Count potential impulse purchases (high intensity, negative mood)
                if intensity > 7 and mood in ["anxious", "sad", "angry"]:
                    impulse_count += 1
            
            days = len(mood_logs)
            avg_daily_spending = total_spending / days if days > 0 else 0
            impulse_ratio = impulse_count / days if days > 0 else 0
            
            return {
                "total_spending": total_spending,
                "avg_daily_spending": avg_daily_spending,
                "mood_spending": mood_spending,
                "impulse_ratio": impulse_ratio,
                "days_analyzed": days
            }
            
        except Exception as e:
            logger.error(f"Error analyzing spending patterns: {str(e)}")
            return {}
    
    def _analyze_budget_performance(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze budget performance (simulated)
        """
        try:
            if not mood_logs:
                return {}
            
            # Simulate budget analysis
            total_spending = sum(50 * (log.get("intensity", 5) / 10) for log in mood_logs)
            monthly_budget = 2000  # Simulated monthly budget
            
            overspent = total_spending > monthly_budget
            overspend_amount = max(0, total_spending - monthly_budget)
            
            # Simulate category overspend
            category_overspend = {
                "food": random.randint(0, 30),
                "entertainment": random.randint(0, 25),
                "shopping": random.randint(0, 40)
            }
            
            return {
                "total_spending": total_spending,
                "monthly_budget": monthly_budget,
                "overspent": overspent,
                "overspend_amount": overspend_amount,
                "overspend_category": "various",
                "reduction_percentage": 15,
                "category_overspend": category_overspend,
                "has_emergency_fund": random.choice([True, False])
            }
            
        except Exception as e:
            logger.error(f"Error analyzing budget performance: {str(e)}")
            return {}
    
    def _analyze_spending_awareness(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze spending awareness
        """
        try:
            if not mood_logs:
                return {"needs_improvement": True}
            
            # Check if user logs mood before transactions
            before_transaction_logs = [log for log in mood_logs if log.get("context") == "before_transaction"]
            awareness_ratio = len(before_transaction_logs) / len(mood_logs) if mood_logs else 0
            
            return {
                "needs_improvement": awareness_ratio < 0.3,
                "awareness_ratio": awareness_ratio
            }
            
        except Exception as e:
            logger.error(f"Error analyzing spending awareness: {str(e)}")
            return {"needs_improvement": True}
    
    def _analyze_habit_consistency(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze habit consistency
        """
        try:
            if not mood_logs:
                return {"consistency_score": 0}
            
            # Analyze logging frequency
            dates = [log.get("createdAt", datetime.utcnow()) for log in mood_logs]
            unique_days = len(set(date.date() for date in dates))
            total_days = (datetime.utcnow() - min(dates)).days + 1 if dates else 1
            
            consistency_score = unique_days / total_days if total_days > 0 else 0
            
            return {
                "consistency_score": consistency_score,
                "unique_days": unique_days,
                "total_days": total_days
            }
            
        except Exception as e:
            logger.error(f"Error analyzing habit consistency: {str(e)}")
            return {"consistency_score": 0}
    
    def _analyze_financial_health(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze financial health (simulated)
        """
        try:
            if not mood_logs:
                return {}
            
            # Simulate financial health metrics
            total_spending = sum(50 * (log.get("intensity", 5) / 10) for log in mood_logs)
            monthly_income = 5000  # Simulated monthly income
            savings_rate = max(0, (monthly_income - total_spending) / monthly_income)
            
            return {
                "savings_rate": savings_rate,
                "monthly_income": monthly_income,
                "total_spending": total_spending,
                "age": 30  # Simulated age
            }
            
        except Exception as e:
            logger.error(f"Error analyzing financial health: {str(e)}")
            return {}
    
    def _sort_recommendations(self, recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sort recommendations by priority
        """
        try:
            priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
            
            return sorted(recommendations, key=lambda x: (
                priority_order.get(x.get("priority", "low"), 3),
                -x.get("confidence", 0)
            ))
            
        except Exception as e:
            logger.error(f"Error sorting recommendations: {str(e)}")
            return recommendations
