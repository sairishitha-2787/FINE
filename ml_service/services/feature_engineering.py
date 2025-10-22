import asyncio
import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import math

from config.database import get_mood_logs_collection, get_user_data_collection
from utils.logger import get_logger

logger = get_logger(__name__)

class FeatureEngineeringModule:
    """
    Feature engineering module for extracting and transforming data for ML models
    """
    
    def __init__(self):
        self.feature_cache = {}
        self.cache_ttl = 3600  # 1 hour cache TTL
    
    async def extract_features(self, user_id: str) -> Dict[str, Any]:
        """
        Extract comprehensive features for a user
        """
        try:
            logger.info(f"Extracting features for user {user_id}")
            
            # Check cache first
            cache_key = f"features_{user_id}"
            if cache_key in self.feature_cache:
                cached_data, timestamp = self.feature_cache[cache_key]
                if (datetime.utcnow() - timestamp).seconds < self.cache_ttl:
                    return cached_data
            
            # Get raw data
            raw_data = await self._get_raw_data(user_id)
            
            if not raw_data:
                return {}
            
            # Extract different types of features
            features = {
                "user_id": user_id,
                "extracted_at": datetime.utcnow().isoformat(),
                "mood_features": await self._extract_mood_features(raw_data["mood_logs"]),
                "temporal_features": await self._extract_temporal_features(raw_data["mood_logs"]),
                "behavioral_features": await self._extract_behavioral_features(raw_data["mood_logs"]),
                "contextual_features": await self._extract_contextual_features(raw_data["mood_logs"]),
                "aggregated_features": await self._extract_aggregated_features(raw_data["mood_logs"]),
                "derived_features": await self._extract_derived_features(raw_data["mood_logs"])
            }
            
            # Cache the results
            self.feature_cache[cache_key] = (features, datetime.utcnow())
            
            logger.info(f"Extracted {len(features)} feature categories for user {user_id}")
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features for user {user_id}: {str(e)}")
            return {}
    
    async def _get_raw_data(self, user_id: str) -> Dict[str, Any]:
        """
        Get raw data for feature extraction
        """
        try:
            # Get mood logs
            mood_logs_collection = get_mood_logs_collection()
            mood_logs = await mood_logs_collection.find(
                {"userId": user_id}
            ).sort("createdAt", -1).limit(1000).to_list(length=1000)
            
            return {
                "mood_logs": mood_logs
            }
            
        except Exception as e:
            logger.error(f"Error getting raw data for user {user_id}: {str(e)}")
            return {}
    
    async def _extract_mood_features(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract mood-related features
        """
        try:
            if not mood_logs:
                return {}
            
            # Basic mood statistics
            moods = [log.get("mood", "neutral") for log in mood_logs]
            intensities = [log.get("intensity", 5) for log in mood_logs]
            
            # Mood distribution
            mood_counts = {}
            for mood in moods:
                mood_counts[mood] = mood_counts.get(mood, 0) + 1
            
            total_logs = len(mood_logs)
            mood_distribution = {mood: count / total_logs for mood, count in mood_counts.items()}
            
            # Mood scores (numeric representation)
            mood_scores = []
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = self._mood_to_numeric(mood)
                mood_scores.append(mood_numeric * (intensity / 10))
            
            # Mood statistics
            avg_mood_score = np.mean(mood_scores) if mood_scores else 5.0
            mood_volatility = np.std(mood_scores) if len(mood_scores) > 1 else 0.0
            mood_trend = self._calculate_mood_trend(mood_logs)
            
            # Intensity statistics
            avg_intensity = np.mean(intensities) if intensities else 5.0
            intensity_volatility = np.std(intensities) if len(intensities) > 1 else 0.0
            
            # Dominant mood
            dominant_mood = max(mood_counts, key=mood_counts.get) if mood_counts else "neutral"
            
            return {
                "mood_distribution": mood_distribution,
                "avg_mood_score": avg_mood_score,
                "mood_volatility": mood_volatility,
                "mood_trend": mood_trend,
                "avg_intensity": avg_intensity,
                "intensity_volatility": intensity_volatility,
                "dominant_mood": dominant_mood,
                "total_mood_logs": total_logs,
                "mood_scores": mood_scores
            }
            
        except Exception as e:
            logger.error(f"Error extracting mood features: {str(e)}")
            return {}
    
    async def _extract_temporal_features(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract temporal features
        """
        try:
            if not mood_logs:
                return {}
            
            # Time-based features
            hours = []
            days_of_week = []
            is_weekends = []
            time_of_day = []
            
            for log in mood_logs:
                created_at = log.get("createdAt", datetime.utcnow())
                hour = created_at.hour
                day_of_week = created_at.weekday()
                is_weekend = 1 if day_of_week >= 5 else 0
                
                # Time of day categories
                if 6 <= hour < 12:
                    tod = "morning"
                elif 12 <= hour < 18:
                    tod = "afternoon"
                elif 18 <= hour < 22:
                    tod = "evening"
                else:
                    tod = "night"
                
                hours.append(hour)
                days_of_week.append(day_of_week)
                is_weekends.append(is_weekend)
                time_of_day.append(tod)
            
            # Temporal patterns
            hour_distribution = {}
            for hour in hours:
                hour_distribution[hour] = hour_distribution.get(hour, 0) + 1
            
            day_distribution = {}
            for day in days_of_week:
                day_distribution[day] = day_distribution.get(day, 0) + 1
            
            time_of_day_distribution = {}
            for tod in time_of_day:
                time_of_day_distribution[tod] = time_of_day_distribution.get(tod, 0) + 1
            
            # Weekend ratio
            weekend_ratio = np.mean(is_weekends) if is_weekends else 0.0
            
            # Peak activity times
            peak_hour = max(hour_distribution, key=hour_distribution.get) if hour_distribution else 12
            peak_day = max(day_distribution, key=day_distribution.get) if day_distribution else 0
            peak_time_of_day = max(time_of_day_distribution, key=time_of_day_distribution.get) if time_of_day_distribution else "afternoon"
            
            return {
                "hour_distribution": hour_distribution,
                "day_distribution": day_distribution,
                "time_of_day_distribution": time_of_day_distribution,
                "weekend_ratio": weekend_ratio,
                "peak_hour": peak_hour,
                "peak_day": peak_day,
                "peak_time_of_day": peak_time_of_day,
                "avg_hour": np.mean(hours) if hours else 12.0,
                "avg_day_of_week": np.mean(days_of_week) if days_of_week else 3.0
            }
            
        except Exception as e:
            logger.error(f"Error extracting temporal features: {str(e)}")
            return {}
    
    async def _extract_behavioral_features(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract behavioral features
        """
        try:
            if not mood_logs:
                return {}
            
            # Context analysis
            contexts = [log.get("context", "general") for log in mood_logs]
            context_distribution = {}
            for context in contexts:
                context_distribution[context] = context_distribution.get(context, 0) + 1
            
            # Trigger analysis
            triggers = []
            for log in mood_logs:
                log_triggers = log.get("triggers", [])
                triggers.extend(log_triggers)
            
            trigger_distribution = {}
            for trigger in triggers:
                trigger_distribution[trigger] = trigger_distribution.get(trigger, 0) + 1
            
            # Behavioral patterns
            has_notes = sum(1 for log in mood_logs if log.get("notes"))
            notes_ratio = has_notes / len(mood_logs) if mood_logs else 0.0
            
            # Location data (if available)
            has_location = sum(1 for log in mood_logs if log.get("location"))
            location_ratio = has_location / len(mood_logs) if mood_logs else 0.0
            
            # Consistency metrics
            logging_consistency = self._calculate_logging_consistency(mood_logs)
            
            return {
                "context_distribution": context_distribution,
                "trigger_distribution": trigger_distribution,
                "notes_ratio": notes_ratio,
                "location_ratio": location_ratio,
                "logging_consistency": logging_consistency,
                "total_contexts": len(context_distribution),
                "total_triggers": len(trigger_distribution),
                "most_common_context": max(context_distribution, key=context_distribution.get) if context_distribution else "general",
                "most_common_trigger": max(trigger_distribution, key=trigger_distribution.get) if trigger_distribution else None
            }
            
        except Exception as e:
            logger.error(f"Error extracting behavioral features: {str(e)}")
            return {}
    
    async def _extract_contextual_features(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract contextual features
        """
        try:
            if not mood_logs:
                return {}
            
            # Device information
            device_platforms = []
            user_agents = []
            
            for log in mood_logs:
                device_info = log.get("deviceInfo", {})
                if device_info:
                    platform = device_info.get("platform", "unknown")
                    user_agent = device_info.get("userAgent", "unknown")
                    device_platforms.append(platform)
                    user_agents.append(user_agent)
            
            # Metadata analysis
            weather_conditions = []
            time_of_day_metadata = []
            day_of_week_metadata = []
            
            for log in mood_logs:
                metadata = log.get("metadata", {})
                if metadata:
                    weather = metadata.get("weather")
                    tod = metadata.get("timeOfDay")
                    dow = metadata.get("dayOfWeek")
                    
                    if weather:
                        weather_conditions.append(weather)
                    if tod:
                        time_of_day_metadata.append(tod)
                    if dow:
                        day_of_week_metadata.append(dow)
            
            # Contextual patterns
            device_distribution = {}
            for platform in device_platforms:
                device_distribution[platform] = device_distribution.get(platform, 0) + 1
            
            weather_distribution = {}
            for weather in weather_conditions:
                weather_distribution[weather] = weather_distribution.get(weather, 0) + 1
            
            return {
                "device_distribution": device_distribution,
                "weather_distribution": weather_distribution,
                "most_common_device": max(device_distribution, key=device_distribution.get) if device_distribution else "unknown",
                "most_common_weather": max(weather_distribution, key=weather_distribution.get) if weather_distribution else "unknown",
                "device_diversity": len(device_distribution),
                "weather_diversity": len(weather_distribution)
            }
            
        except Exception as e:
            logger.error(f"Error extracting contextual features: {str(e)}")
            return {}
    
    async def _extract_aggregated_features(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract aggregated features
        """
        try:
            if not mood_logs:
                return {}
            
            # Time-based aggregations
            daily_aggregates = self._aggregate_by_day(mood_logs)
            weekly_aggregates = self._aggregate_by_week(mood_logs)
            monthly_aggregates = self._aggregate_by_month(mood_logs)
            
            # Statistical aggregations
            mood_scores = []
            intensities = []
            
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = self._mood_to_numeric(mood)
                mood_scores.append(mood_numeric * (intensity / 10))
                intensities.append(intensity)
            
            # Statistical measures
            mood_stats = {
                "mean": np.mean(mood_scores) if mood_scores else 5.0,
                "median": np.median(mood_scores) if mood_scores else 5.0,
                "std": np.std(mood_scores) if len(mood_scores) > 1 else 0.0,
                "min": np.min(mood_scores) if mood_scores else 5.0,
                "max": np.max(mood_scores) if mood_scores else 5.0,
                "q25": np.percentile(mood_scores, 25) if mood_scores else 5.0,
                "q75": np.percentile(mood_scores, 75) if mood_scores else 5.0
            }
            
            intensity_stats = {
                "mean": np.mean(intensities) if intensities else 5.0,
                "median": np.median(intensities) if intensities else 5.0,
                "std": np.std(intensities) if len(intensities) > 1 else 0.0,
                "min": np.min(intensities) if intensities else 5.0,
                "max": np.max(intensities) if intensities else 5.0
            }
            
            return {
                "daily_aggregates": daily_aggregates,
                "weekly_aggregates": weekly_aggregates,
                "monthly_aggregates": monthly_aggregates,
                "mood_statistics": mood_stats,
                "intensity_statistics": intensity_stats,
                "total_logs": len(mood_logs),
                "date_range": {
                    "start": min(log.get("createdAt", datetime.utcnow()) for log in mood_logs).isoformat(),
                    "end": max(log.get("createdAt", datetime.utcnow()) for log in mood_logs).isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error extracting aggregated features: {str(e)}")
            return {}
    
    async def _extract_derived_features(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract derived/computed features
        """
        try:
            if not mood_logs:
                return {}
            
            # Mood stability score
            mood_scores = []
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = self._mood_to_numeric(mood)
                mood_scores.append(mood_numeric * (intensity / 10))
            
            mood_stability = 1.0 - (np.std(mood_scores) / np.mean(mood_scores)) if mood_scores and np.mean(mood_scores) > 0 else 0.0
            
            # Emotional range
            emotional_range = np.max(mood_scores) - np.min(mood_scores) if mood_scores else 0.0
            
            # Mood momentum (trend over time)
            mood_momentum = self._calculate_mood_momentum(mood_logs)
            
            # Engagement score (based on logging frequency and detail)
            engagement_score = self._calculate_engagement_score(mood_logs)
            
            # Stress indicators
            stress_indicators = self._calculate_stress_indicators(mood_logs)
            
            # Well-being score
            well_being_score = self._calculate_well_being_score(mood_logs)
            
            return {
                "mood_stability": mood_stability,
                "emotional_range": emotional_range,
                "mood_momentum": mood_momentum,
                "engagement_score": engagement_score,
                "stress_indicators": stress_indicators,
                "well_being_score": well_being_score,
                "mood_volatility_category": self._categorize_volatility(mood_stability),
                "emotional_intensity_category": self._categorize_intensity(emotional_range)
            }
            
        except Exception as e:
            logger.error(f"Error extracting derived features: {str(e)}")
            return {}
    
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
    
    def _calculate_mood_trend(self, mood_logs: List[Dict[str, Any]]) -> str:
        """
        Calculate mood trend over time
        """
        try:
            if len(mood_logs) < 3:
                return "insufficient_data"
            
            # Sort by date
            sorted_logs = sorted(mood_logs, key=lambda x: x.get("createdAt", datetime.utcnow()))
            
            # Calculate mood scores
            mood_scores = []
            for log in sorted_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = self._mood_to_numeric(mood)
                mood_scores.append(mood_numeric * (intensity / 10))
            
            # Calculate trend
            if len(mood_scores) >= 3:
                recent_avg = np.mean(mood_scores[-3:])
                earlier_avg = np.mean(mood_scores[:3])
                
                if recent_avg > earlier_avg + 0.5:
                    return "improving"
                elif recent_avg < earlier_avg - 0.5:
                    return "declining"
            
            return "stable"
            
        except Exception as e:
            logger.error(f"Error calculating mood trend: {str(e)}")
            return "unknown"
    
    def _calculate_logging_consistency(self, mood_logs: List[Dict[str, Any]]) -> float:
        """
        Calculate logging consistency score
        """
        try:
            if not mood_logs:
                return 0.0
            
            # Get unique dates
            dates = set()
            for log in mood_logs:
                created_at = log.get("createdAt", datetime.utcnow())
                dates.add(created_at.date())
            
            # Calculate date range
            if not dates:
                return 0.0
            
            min_date = min(dates)
            max_date = max(dates)
            total_days = (max_date - min_date).days + 1
            
            # Calculate consistency
            consistency = len(dates) / total_days if total_days > 0 else 0.0
            return min(consistency, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating logging consistency: {str(e)}")
            return 0.0
    
    def _aggregate_by_day(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate mood data by day
        """
        try:
            daily_data = {}
            
            for log in mood_logs:
                created_at = log.get("createdAt", datetime.utcnow())
                date_key = created_at.date().isoformat()
                
                if date_key not in daily_data:
                    daily_data[date_key] = {
                        "mood_scores": [],
                        "intensities": [],
                        "count": 0
                    }
                
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = self._mood_to_numeric(mood)
                mood_score = mood_numeric * (intensity / 10)
                
                daily_data[date_key]["mood_scores"].append(mood_score)
                daily_data[date_key]["intensities"].append(intensity)
                daily_data[date_key]["count"] += 1
            
            # Calculate daily statistics
            for date_key in daily_data:
                data = daily_data[date_key]
                data["avg_mood_score"] = np.mean(data["mood_scores"])
                data["avg_intensity"] = np.mean(data["intensities"])
                data["mood_volatility"] = np.std(data["mood_scores"]) if len(data["mood_scores"]) > 1 else 0.0
            
            return daily_data
            
        except Exception as e:
            logger.error(f"Error aggregating by day: {str(e)}")
            return {}
    
    def _aggregate_by_week(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate mood data by week
        """
        try:
            weekly_data = {}
            
            for log in mood_logs:
                created_at = log.get("createdAt", datetime.utcnow())
                # Get week number
                year, week, _ = created_at.isocalendar()
                week_key = f"{year}-W{week:02d}"
                
                if week_key not in weekly_data:
                    weekly_data[week_key] = {
                        "mood_scores": [],
                        "intensities": [],
                        "count": 0
                    }
                
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = self._mood_to_numeric(mood)
                mood_score = mood_numeric * (intensity / 10)
                
                weekly_data[week_key]["mood_scores"].append(mood_score)
                weekly_data[week_key]["intensities"].append(intensity)
                weekly_data[week_key]["count"] += 1
            
            # Calculate weekly statistics
            for week_key in weekly_data:
                data = weekly_data[week_key]
                data["avg_mood_score"] = np.mean(data["mood_scores"])
                data["avg_intensity"] = np.mean(data["intensities"])
                data["mood_volatility"] = np.std(data["mood_scores"]) if len(data["mood_scores"]) > 1 else 0.0
            
            return weekly_data
            
        except Exception as e:
            logger.error(f"Error aggregating by week: {str(e)}")
            return {}
    
    def _aggregate_by_month(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate mood data by month
        """
        try:
            monthly_data = {}
            
            for log in mood_logs:
                created_at = log.get("createdAt", datetime.utcnow())
                month_key = created_at.strftime("%Y-%m")
                
                if month_key not in monthly_data:
                    monthly_data[month_key] = {
                        "mood_scores": [],
                        "intensities": [],
                        "count": 0
                    }
                
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = self._mood_to_numeric(mood)
                mood_score = mood_numeric * (intensity / 10)
                
                monthly_data[month_key]["mood_scores"].append(mood_score)
                monthly_data[month_key]["intensities"].append(intensity)
                monthly_data[month_key]["count"] += 1
            
            # Calculate monthly statistics
            for month_key in monthly_data:
                data = monthly_data[month_key]
                data["avg_mood_score"] = np.mean(data["mood_scores"])
                data["avg_intensity"] = np.mean(data["intensities"])
                data["mood_volatility"] = np.std(data["mood_scores"]) if len(data["mood_scores"]) > 1 else 0.0
            
            return monthly_data
            
        except Exception as e:
            logger.error(f"Error aggregating by month: {str(e)}")
            return {}
    
    def _calculate_mood_momentum(self, mood_logs: List[Dict[str, Any]]) -> float:
        """
        Calculate mood momentum (trend over time)
        """
        try:
            if len(mood_logs) < 5:
                return 0.0
            
            # Sort by date
            sorted_logs = sorted(mood_logs, key=lambda x: x.get("createdAt", datetime.utcnow()))
            
            # Calculate mood scores
            mood_scores = []
            for log in sorted_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = self._mood_to_numeric(mood)
                mood_scores.append(mood_numeric * (intensity / 10))
            
            # Calculate linear trend
            x = np.arange(len(mood_scores))
            slope, _ = np.polyfit(x, mood_scores, 1)
            
            return slope
            
        except Exception as e:
            logger.error(f"Error calculating mood momentum: {str(e)}")
            return 0.0
    
    def _calculate_engagement_score(self, mood_logs: List[Dict[str, Any]]) -> float:
        """
        Calculate user engagement score
        """
        try:
            if not mood_logs:
                return 0.0
            
            # Factors for engagement
            total_logs = len(mood_logs)
            has_notes = sum(1 for log in mood_logs if log.get("notes"))
            has_triggers = sum(1 for log in mood_logs if log.get("triggers"))
            has_location = sum(1 for log in mood_logs if log.get("location"))
            
            # Calculate engagement components
            frequency_score = min(total_logs / 100, 1.0)  # Normalize to 0-1
            detail_score = (has_notes + has_triggers + has_location) / (total_logs * 3)
            consistency_score = self._calculate_logging_consistency(mood_logs)
            
            # Weighted engagement score
            engagement_score = (frequency_score * 0.4 + detail_score * 0.3 + consistency_score * 0.3)
            
            return min(engagement_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating engagement score: {str(e)}")
            return 0.0
    
    def _calculate_stress_indicators(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate stress indicators
        """
        try:
            if not mood_logs:
                return {"stress_score": 0.0, "stress_level": "low"}
            
            # Stress-related moods
            stress_moods = ["anxious", "stressed", "worried", "angry"]
            stress_count = sum(1 for log in mood_logs if log.get("mood") in stress_moods)
            
            # High intensity logs
            high_intensity_count = sum(1 for log in mood_logs if log.get("intensity", 5) > 7)
            
            # Calculate stress score
            total_logs = len(mood_logs)
            stress_ratio = stress_count / total_logs if total_logs > 0 else 0.0
            intensity_ratio = high_intensity_count / total_logs if total_logs > 0 else 0.0
            
            stress_score = (stress_ratio * 0.7 + intensity_ratio * 0.3)
            
            # Determine stress level
            if stress_score > 0.6:
                stress_level = "high"
            elif stress_score > 0.3:
                stress_level = "medium"
            else:
                stress_level = "low"
            
            return {
                "stress_score": stress_score,
                "stress_level": stress_level,
                "stress_mood_ratio": stress_ratio,
                "high_intensity_ratio": intensity_ratio
            }
            
        except Exception as e:
            logger.error(f"Error calculating stress indicators: {str(e)}")
            return {"stress_score": 0.0, "stress_level": "low"}
    
    def _calculate_well_being_score(self, mood_logs: List[Dict[str, Any]]) -> float:
        """
        Calculate overall well-being score
        """
        try:
            if not mood_logs:
                return 5.0
            
            # Calculate average mood score
            mood_scores = []
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                mood_numeric = self._mood_to_numeric(mood)
                mood_scores.append(mood_numeric * (intensity / 10))
            
            avg_mood_score = np.mean(mood_scores) if mood_scores else 5.0
            
            # Adjust for volatility (lower volatility = higher well-being)
            mood_volatility = np.std(mood_scores) if len(mood_scores) > 1 else 0.0
            volatility_penalty = min(mood_volatility / 2, 1.0)  # Max penalty of 1.0
            
            well_being_score = avg_mood_score - volatility_penalty
            
            return max(well_being_score, 1.0)  # Minimum score of 1.0
            
        except Exception as e:
            logger.error(f"Error calculating well-being score: {str(e)}")
            return 5.0
    
    def _categorize_volatility(self, mood_stability: float) -> str:
        """
        Categorize mood volatility
        """
        if mood_stability > 0.8:
            return "very_stable"
        elif mood_stability > 0.6:
            return "stable"
        elif mood_stability > 0.4:
            return "moderate"
        elif mood_stability > 0.2:
            return "volatile"
        else:
            return "very_volatile"
    
    def _categorize_intensity(self, emotional_range: float) -> str:
        """
        Categorize emotional intensity
        """
        if emotional_range > 6:
            return "very_high"
        elif emotional_range > 4:
            return "high"
        elif emotional_range > 2:
            return "moderate"
        elif emotional_range > 1:
            return "low"
        else:
            return "very_low"
