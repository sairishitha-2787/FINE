import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from datetime import datetime, timedelta
import math

from config.database import get_mood_logs_collection, get_user_data_collection
from utils.logger import get_logger

logger = get_logger(__name__)

class ClusteringModule:
    """
    Clustering module for pattern identification and behavioral analysis
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.min_cluster_size = 3
        self.max_clusters = 10
    
    async def identify_spending_patterns(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Identify spending patterns using clustering
        """
        try:
            # Get user transaction data (this would come from MySQL in real implementation)
            # For now, we'll simulate with mood data
            mood_logs_collection = get_mood_logs_collection()
            mood_logs = await mood_logs_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(1000).to_list(length=1000)
            
            if len(mood_logs) < 10:
                return []
            
            # Convert mood logs to features
            features = self._extract_spending_features(mood_logs)
            
            if len(features) < self.min_cluster_size:
                return []
            
            # Perform clustering
            patterns = await self._cluster_spending_patterns(features)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error identifying spending patterns for user {user_id}: {str(e)}")
            return []
    
    async def analyze_mood_spending_correlation(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Analyze correlation between mood and spending
        """
        try:
            mood_logs_collection = get_mood_logs_collection()
            mood_logs = await mood_logs_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(500).to_list(length=500)
            
            if len(mood_logs) < 20:
                return []
            
            # Analyze correlations
            correlations = []
            
            # Group by mood
            mood_groups = {}
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                if mood not in mood_groups:
                    mood_groups[mood] = []
                mood_groups[mood].append(log)
            
            # Calculate spending patterns for each mood
            for mood, logs in mood_groups.items():
                if len(logs) < 5:  # Need minimum data points
                    continue
                
                # Simulate spending data (in real implementation, this would come from MySQL)
                spending_data = self._simulate_spending_from_mood(logs)
                
                if spending_data:
                    correlation = {
                        "mood": mood,
                        "avg_spending": spending_data["avg_amount"],
                        "frequency": len(logs),
                        "percentage_increase": spending_data["increase_percentage"],
                        "confidence": min(len(logs) / 20, 1.0),
                        "mood_score": self._calculate_mood_score(mood, logs)
                    }
                    correlations.append(correlation)
            
            return correlations
            
        except Exception as e:
            logger.error(f"Error analyzing mood-spending correlation for user {user_id}: {str(e)}")
            return []
    
    async def identify_behavioral_triggers(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Identify behavioral triggers for spending
        """
        try:
            mood_logs_collection = get_mood_logs_collection()
            mood_logs = await mood_logs_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(1000).to_list(length=1000)
            
            if len(mood_logs) < 30:
                return []
            
            triggers = []
            
            # Analyze time-based triggers
            time_triggers = self._analyze_time_triggers(mood_logs)
            triggers.extend(time_triggers)
            
            # Analyze mood-based triggers
            mood_triggers = self._analyze_mood_triggers(mood_logs)
            triggers.extend(mood_triggers)
            
            # Analyze context triggers
            context_triggers = self._analyze_context_triggers(mood_logs)
            triggers.extend(context_triggers)
            
            return triggers
            
        except Exception as e:
            logger.error(f"Error identifying behavioral triggers for user {user_id}: {str(e)}")
            return []
    
    async def identify_patterns(self, user_id: str, pattern_type: str = "all", days: int = 90) -> List[Dict[str, Any]]:
        """
        Identify various patterns for a user
        """
        try:
            patterns = []
            
            if pattern_type in ["all", "spending"]:
                spending_patterns = await self.identify_spending_patterns(user_id)
                patterns.extend(spending_patterns)
            
            if pattern_type in ["all", "mood"]:
                mood_patterns = await self._identify_mood_patterns(user_id, days)
                patterns.extend(mood_patterns)
            
            if pattern_type in ["all", "behavioral"]:
                behavioral_patterns = await self.identify_behavioral_triggers(user_id)
                patterns.extend(behavioral_patterns)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error identifying patterns for user {user_id}: {str(e)}")
            return []
    
    def _extract_spending_features(self, mood_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract features from mood logs for spending pattern analysis
        """
        features = []
        
        for log in mood_logs:
            # Convert mood to numeric features
            mood_numeric = self._mood_to_numeric(log.get("mood", "neutral"))
            intensity = log.get("intensity", 5)
            context = log.get("context", "general")
            
            # Time features
            created_at = log.get("createdAt", datetime.utcnow())
            hour = created_at.hour
            day_of_week = created_at.weekday()
            is_weekend = day_of_week >= 5
            
            # Simulate spending amount based on mood and context
            base_amount = 50  # Base spending amount
            mood_multiplier = {
                "happy": 1.2, "excited": 1.3, "sad": 1.1, "anxious": 1.4,
                "angry": 1.1, "calm": 0.8, "neutral": 1.0
            }.get(log.get("mood", "neutral"), 1.0)
            
            context_multiplier = {
                "before_transaction": 1.2, "after_transaction": 1.0,
                "general": 1.0, "budget_review": 0.9, "goal_check": 0.8
            }.get(context, 1.0)
            
            amount = base_amount * mood_multiplier * context_multiplier * (intensity / 10)
            
            feature = {
                "mood_numeric": mood_numeric,
                "intensity": intensity,
                "hour": hour,
                "day_of_week": day_of_week,
                "is_weekend": int(is_weekend),
                "context_numeric": self._context_to_numeric(context),
                "amount": amount,
                "timestamp": created_at
            }
            features.append(feature)
        
        return features
    
    def _cluster_spending_patterns(self, features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Perform clustering on spending features
        """
        try:
            if len(features) < self.min_cluster_size:
                return []
            
            # Convert to DataFrame
            df = pd.DataFrame(features)
            
            # Select features for clustering
            feature_columns = ["mood_numeric", "intensity", "hour", "day_of_week", "is_weekend", "context_numeric"]
            X = df[feature_columns].values
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Determine optimal number of clusters
            optimal_k = self._find_optimal_clusters(X_scaled)
            
            # Perform K-means clustering
            kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(X_scaled)
            
            # Analyze clusters
            patterns = []
            for i in range(optimal_k):
                cluster_mask = cluster_labels == i
                cluster_data = df[cluster_mask]
                
                if len(cluster_data) < 3:  # Skip small clusters
                    continue
                
                pattern = {
                    "name": f"Pattern {i+1}",
                    "cluster_id": i,
                    "frequency": len(cluster_data),
                    "avg_amount": cluster_data["amount"].mean(),
                    "mood": self._numeric_to_mood(cluster_data["mood_numeric"].mean()),
                    "avg_intensity": cluster_data["intensity"].mean(),
                    "common_hour": cluster_data["hour"].mode().iloc[0] if not cluster_data["hour"].mode().empty else 12,
                    "common_day": cluster_data["day_of_week"].mode().iloc[0] if not cluster_data["day_of_week"].mode().empty else 0,
                    "weekend_ratio": cluster_data["is_weekend"].mean(),
                    "confidence": min(len(cluster_data) / 20, 1.0)
                }
                patterns.append(pattern)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error clustering spending patterns: {str(e)}")
            return []
    
    def _find_optimal_clusters(self, X: np.ndarray) -> int:
        """
        Find optimal number of clusters using silhouette score
        """
        try:
            if len(X) < 4:
                return 2
            
            max_k = min(self.max_clusters, len(X) // 2)
            if max_k < 2:
                return 2
            
            silhouette_scores = []
            k_range = range(2, max_k + 1)
            
            for k in k_range:
                kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                cluster_labels = kmeans.fit_predict(X)
                score = silhouette_score(X, cluster_labels)
                silhouette_scores.append(score)
            
            # Return k with highest silhouette score
            optimal_k = k_range[np.argmax(silhouette_scores)]
            return optimal_k
            
        except Exception as e:
            logger.error(f"Error finding optimal clusters: {str(e)}")
            return 2
    
    def _simulate_spending_from_mood(self, mood_logs: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Simulate spending data from mood logs (in real implementation, this would use actual transaction data)
        """
        try:
            if not mood_logs:
                return None
            
            # Calculate average mood score
            total_mood_score = 0
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_score = self._mood_to_numeric(mood) * (intensity / 10)
                total_mood_score += mood_score
            
            avg_mood_score = total_mood_score / len(mood_logs)
            
            # Simulate spending based on mood
            base_spending = 100  # Base spending amount
            
            # Negative emotions tend to increase spending
            if avg_mood_score < 4:
                spending_multiplier = 1.3
            elif avg_mood_score > 7:
                spending_multiplier = 1.1
            else:
                spending_multiplier = 1.0
            
            avg_amount = base_spending * spending_multiplier
            
            # Calculate increase percentage compared to neutral mood
            neutral_amount = base_spending * 1.0
            increase_percentage = ((avg_amount - neutral_amount) / neutral_amount) * 100
            
            return {
                "avg_amount": avg_amount,
                "increase_percentage": increase_percentage,
                "mood_score": avg_mood_score
            }
            
        except Exception as e:
            logger.error(f"Error simulating spending from mood: {str(e)}")
            return None
    
    def _analyze_time_triggers(self, mood_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze time-based behavioral triggers
        """
        triggers = []
        
        try:
            # Group by hour
            hour_groups = {}
            for log in mood_logs:
                hour = log.get("createdAt", datetime.utcnow()).hour
                if hour not in hour_groups:
                    hour_groups[hour] = []
                hour_groups[hour].append(log)
            
            # Find high-activity hours
            for hour, logs in hour_groups.items():
                if len(logs) >= 5:  # Minimum threshold
                    # Check if this hour has higher emotional intensity
                    avg_intensity = np.mean([log.get("intensity", 5) for log in logs])
                    
                    if avg_intensity > 6:  # High intensity threshold
                        trigger = {
                            "condition": f"during {hour}:00 hour",
                            "confidence": min(len(logs) / 20, 1.0),
                            "threshold_amount": 50,
                            "type": "time_based",
                            "frequency": len(logs),
                            "avg_intensity": avg_intensity
                        }
                        triggers.append(trigger)
            
            # Analyze weekend vs weekday patterns
            weekend_logs = [log for log in mood_logs if log.get("createdAt", datetime.utcnow()).weekday() >= 5]
            weekday_logs = [log for log in mood_logs if log.get("createdAt", datetime.utcnow()).weekday() < 5]
            
            if len(weekend_logs) >= 5 and len(weekday_logs) >= 5:
                weekend_avg_intensity = np.mean([log.get("intensity", 5) for log in weekend_logs])
                weekday_avg_intensity = np.mean([log.get("intensity", 5) for log in weekday_logs])
                
                if weekend_avg_intensity > weekday_avg_intensity + 1:
                    trigger = {
                        "condition": "on weekends",
                        "confidence": 0.7,
                        "threshold_amount": 75,
                        "type": "time_based",
                        "frequency": len(weekend_logs),
                        "avg_intensity": weekend_avg_intensity
                    }
                    triggers.append(trigger)
            
        except Exception as e:
            logger.error(f"Error analyzing time triggers: {str(e)}")
        
        return triggers
    
    def _analyze_mood_triggers(self, mood_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze mood-based behavioral triggers
        """
        triggers = []
        
        try:
            # Group by mood
            mood_groups = {}
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                if mood not in mood_groups:
                    mood_groups[mood] = []
                mood_groups[mood].append(log)
            
            # Find high-intensity moods
            for mood, logs in mood_groups.items():
                if len(logs) >= 5:
                    avg_intensity = np.mean([log.get("intensity", 5) for log in logs])
                    
                    if avg_intensity > 7:  # High intensity threshold
                        trigger = {
                            "condition": f"when feeling {mood}",
                            "confidence": min(len(logs) / 15, 1.0),
                            "threshold_amount": 60,
                            "type": "mood_based",
                            "frequency": len(logs),
                            "avg_intensity": avg_intensity
                        }
                        triggers.append(trigger)
            
        except Exception as e:
            logger.error(f"Error analyzing mood triggers: {str(e)}")
        
        return triggers
    
    def _analyze_context_triggers(self, mood_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze context-based behavioral triggers
        """
        triggers = []
        
        try:
            # Group by context
            context_groups = {}
            for log in mood_logs:
                context = log.get("context", "general")
                if context not in context_groups:
                    context_groups[context] = []
                context_groups[context].append(log)
            
            # Find high-intensity contexts
            for context, logs in context_groups.items():
                if len(logs) >= 3:
                    avg_intensity = np.mean([log.get("intensity", 5) for log in logs])
                    
                    if avg_intensity > 6:
                        context_description = {
                            "before_transaction": "before making a purchase",
                            "after_transaction": "after making a purchase",
                            "budget_review": "when reviewing budget",
                            "goal_check": "when checking goals",
                            "general": "in general situations"
                        }.get(context, context)
                        
                        trigger = {
                            "condition": context_description,
                            "confidence": min(len(logs) / 10, 1.0),
                            "threshold_amount": 40,
                            "type": "context_based",
                            "frequency": len(logs),
                            "avg_intensity": avg_intensity
                        }
                        triggers.append(trigger)
            
        except Exception as e:
            logger.error(f"Error analyzing context triggers: {str(e)}")
        
        return triggers
    
    async def _identify_mood_patterns(self, user_id: str, days: int) -> List[Dict[str, Any]]:
        """
        Identify mood patterns over time
        """
        try:
            mood_logs_collection = get_mood_logs_collection()
            start_date = datetime.utcnow() - timedelta(days=days)
            
            mood_logs = await mood_logs_collection.find({
                "userId": user_id,
                "createdAt": {"$gte": start_date}
            }).sort("createdAt", -1).to_list(length=1000)
            
            if len(mood_logs) < 10:
                return []
            
            patterns = []
            
            # Analyze mood trends by day of week
            day_patterns = self._analyze_mood_by_day(mood_logs)
            patterns.extend(day_patterns)
            
            # Analyze mood trends by time of day
            time_patterns = self._analyze_mood_by_time(mood_logs)
            patterns.extend(time_patterns)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error identifying mood patterns: {str(e)}")
            return []
    
    def _analyze_mood_by_day(self, mood_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze mood patterns by day of week
        """
        patterns = []
        
        try:
            day_groups = {}
            for log in mood_logs:
                day = log.get("createdAt", datetime.utcnow()).weekday()
                if day not in day_groups:
                    day_groups[day] = []
                day_groups[day].append(log)
            
            day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            
            for day, logs in day_groups.items():
                if len(logs) >= 3:
                    avg_mood_score = np.mean([self._mood_to_numeric(log.get("mood", "neutral")) for log in logs])
                    avg_intensity = np.mean([log.get("intensity", 5) for log in logs])
                    
                    pattern = {
                        "name": f"{day_names[day]} Mood Pattern",
                        "type": "mood_pattern",
                        "day": day_names[day],
                        "avg_mood_score": avg_mood_score,
                        "avg_intensity": avg_intensity,
                        "frequency": len(logs),
                        "confidence": min(len(logs) / 10, 1.0)
                    }
                    patterns.append(pattern)
            
        except Exception as e:
            logger.error(f"Error analyzing mood by day: {str(e)}")
        
        return patterns
    
    def _analyze_mood_by_time(self, mood_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze mood patterns by time of day
        """
        patterns = []
        
        try:
            time_groups = {"morning": [], "afternoon": [], "evening": [], "night": []}
            
            for log in mood_logs:
                hour = log.get("createdAt", datetime.utcnow()).hour
                if 6 <= hour < 12:
                    time_groups["morning"].append(log)
                elif 12 <= hour < 18:
                    time_groups["afternoon"].append(log)
                elif 18 <= hour < 22:
                    time_groups["evening"].append(log)
                else:
                    time_groups["night"].append(log)
            
            for time_period, logs in time_groups.items():
                if len(logs) >= 3:
                    avg_mood_score = np.mean([self._mood_to_numeric(log.get("mood", "neutral")) for log in logs])
                    avg_intensity = np.mean([log.get("intensity", 5) for log in logs])
                    
                    pattern = {
                        "name": f"{time_period.title()} Mood Pattern",
                        "type": "mood_pattern",
                        "time_period": time_period,
                        "avg_mood_score": avg_mood_score,
                        "avg_intensity": avg_intensity,
                        "frequency": len(logs),
                        "confidence": min(len(logs) / 10, 1.0)
                    }
                    patterns.append(pattern)
            
        except Exception as e:
            logger.error(f"Error analyzing mood by time: {str(e)}")
        
        return patterns
    
    def _mood_to_numeric(self, mood: str) -> float:
        """
        Convert mood to numeric value
        """
        mood_mapping = {
            "sad": 1, "anxious": 2, "angry": 2, "worried": 3,
            "neutral": 5, "calm": 6, "content": 7,
            "happy": 8, "excited": 9
        }
        return mood_mapping.get(mood, 5)
    
    def _numeric_to_mood(self, numeric_value: float) -> str:
        """
        Convert numeric value back to mood
        """
        if numeric_value <= 2:
            return "sad"
        elif numeric_value <= 3:
            return "anxious"
        elif numeric_value <= 4:
            return "worried"
        elif numeric_value <= 6:
            return "neutral"
        elif numeric_value <= 7:
            return "calm"
        elif numeric_value <= 8:
            return "happy"
        else:
            return "excited"
    
    def _context_to_numeric(self, context: str) -> float:
        """
        Convert context to numeric value
        """
        context_mapping = {
            "before_transaction": 1,
            "after_transaction": 2,
            "budget_review": 3,
            "goal_check": 4,
            "general": 5
        }
        return context_mapping.get(context, 5)
    
    def _calculate_mood_score(self, mood: str, logs: List[Dict[str, Any]]) -> float:
        """
        Calculate average mood score for a group of logs
        """
        if not logs:
            return 5.0
        
        total_score = 0
        for log in logs:
            mood_numeric = self._mood_to_numeric(mood)
            intensity = log.get("intensity", 5)
            total_score += mood_numeric * (intensity / 10)
        
        return total_score / len(logs)
