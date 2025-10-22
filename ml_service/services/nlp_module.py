import asyncio
import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from textblob import TextBlob
import nltk
from datetime import datetime

from utils.logger import get_logger

logger = get_logger(__name__)

class NLPModule:
    """
    Natural Language Processing module for mood analysis and text processing
    """
    
    def __init__(self):
        self.mood_keywords = {
            'happy': ['happy', 'joyful', 'excited', 'cheerful', 'content', 'pleased', 'delighted', 'thrilled', 'elated', 'ecstatic'],
            'sad': ['sad', 'depressed', 'down', 'blue', 'melancholy', 'gloomy', 'miserable', 'unhappy', 'dejected', 'sorrowful'],
            'angry': ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'rage', 'livid', 'enraged', 'outraged'],
            'anxious': ['anxious', 'worried', 'nervous', 'stressed', 'tense', 'uneasy', 'apprehensive', 'fearful', 'panicked', 'overwhelmed'],
            'calm': ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'composed', 'collected', 'cool', 'unruffled', 'placid'],
            'excited': ['excited', 'thrilled', 'enthusiastic', 'eager', 'pumped', 'energized', 'animated', 'vibrant', 'lively', 'buzzing'],
            'neutral': ['neutral', 'okay', 'fine', 'normal', 'average', 'regular', 'standard', 'typical', 'ordinary', 'moderate']
        }
        
        self.emotion_intensities = {
            'happy': {'low': ['content', 'pleased'], 'medium': ['happy', 'cheerful'], 'high': ['thrilled', 'ecstatic']},
            'sad': {'low': ['down', 'blue'], 'medium': ['sad', 'unhappy'], 'high': ['miserable', 'devastated']},
            'angry': {'low': ['irritated', 'annoyed'], 'medium': ['angry', 'mad'], 'high': ['furious', 'livid']},
            'anxious': {'low': ['worried', 'nervous'], 'medium': ['anxious', 'stressed'], 'high': ['panicked', 'overwhelmed']},
            'calm': {'low': ['relaxed', 'peaceful'], 'medium': ['calm', 'serene'], 'high': ['tranquil', 'zen']},
            'excited': {'low': ['eager', 'enthusiastic'], 'medium': ['excited', 'thrilled'], 'high': ['ecstatic', 'euphoric']},
            'neutral': {'low': ['okay', 'fine'], 'medium': ['neutral', 'normal'], 'high': ['balanced', 'stable']}
        }
        
        # Download required NLTK data
        try:
            nltk.download('vader_lexicon', quiet=True)
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
        except Exception as e:
            logger.warning(f"Could not download NLTK data: {e}")
    
    async def analyze_mood(self, text: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze mood from text input
        """
        try:
            if not text or not text.strip():
                return {
                    "mood": "neutral",
                    "confidence": 0.5,
                    "sentiment": 0.0,
                    "emotions": {"neutral": 1.0}
                }
            
            # Clean and preprocess text
            cleaned_text = self._clean_text(text)
            
            # Get sentiment analysis
            sentiment_score = self._get_sentiment_score(cleaned_text)
            
            # Get mood from keywords
            mood_scores = self._analyze_mood_keywords(cleaned_text)
            
            # Get emotion intensities
            emotion_scores = self._analyze_emotion_intensities(cleaned_text)
            
            # Combine scores
            combined_scores = self._combine_mood_scores(mood_scores, emotion_scores, sentiment_score)
            
            # Determine primary mood
            primary_mood = max(combined_scores, key=combined_scores.get)
            confidence = combined_scores[primary_mood]
            
            # Adjust based on context
            if context:
                combined_scores = self._adjust_for_context(combined_scores, context)
                primary_mood = max(combined_scores, key=combined_scores.get)
                confidence = combined_scores[primary_mood]
            
            return {
                "mood": primary_mood,
                "confidence": min(confidence, 1.0),
                "sentiment": sentiment_score,
                "emotions": combined_scores
            }
            
        except Exception as e:
            logger.error(f"Error analyzing mood: {str(e)}")
            return {
                "mood": "neutral",
                "confidence": 0.5,
                "sentiment": 0.0,
                "emotions": {"neutral": 1.0}
            }
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and preprocess text
        """
        import re
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _get_sentiment_score(self, text: str) -> float:
        """
        Get sentiment score using TextBlob
        """
        try:
            blob = TextBlob(text)
            return blob.sentiment.polarity  # Range: -1 to 1
        except Exception as e:
            logger.warning(f"Error getting sentiment score: {e}")
            return 0.0
    
    def _analyze_mood_keywords(self, text: str) -> Dict[str, float]:
        """
        Analyze mood based on keyword presence
        """
        mood_scores = {mood: 0.0 for mood in self.mood_keywords.keys()}
        
        words = text.split()
        
        for mood, keywords in self.mood_keywords.items():
            for keyword in keywords:
                if keyword in words:
                    mood_scores[mood] += 1.0
        
        # Normalize scores
        total_matches = sum(mood_scores.values())
        if total_matches > 0:
            for mood in mood_scores:
                mood_scores[mood] = mood_scores[mood] / total_matches
        
        return mood_scores
    
    def _analyze_emotion_intensities(self, text: str) -> Dict[str, float]:
        """
        Analyze emotion intensities
        """
        emotion_scores = {mood: 0.0 for mood in self.emotion_intensities.keys()}
        
        words = text.split()
        
        for mood, intensities in self.emotion_intensities.items():
            for intensity, keywords in intensities.items():
                for keyword in keywords:
                    if keyword in words:
                        # Weight by intensity
                        weight = {'low': 0.3, 'medium': 0.6, 'high': 1.0}[intensity]
                        emotion_scores[mood] += weight
        
        # Normalize scores
        max_score = max(emotion_scores.values()) if emotion_scores.values() else 1
        if max_score > 0:
            for mood in emotion_scores:
                emotion_scores[mood] = emotion_scores[mood] / max_score
        
        return emotion_scores
    
    def _combine_mood_scores(self, mood_scores: Dict[str, float], emotion_scores: Dict[str, float], sentiment_score: float) -> Dict[str, float]:
        """
        Combine different mood analysis scores
        """
        combined_scores = {}
        
        for mood in mood_scores.keys():
            # Combine keyword and emotion scores
            combined = (mood_scores[mood] * 0.4) + (emotion_scores[mood] * 0.6)
            
            # Adjust based on sentiment
            if sentiment_score > 0.1:  # Positive sentiment
                if mood in ['happy', 'excited', 'calm']:
                    combined *= 1.2
                elif mood in ['sad', 'angry', 'anxious']:
                    combined *= 0.8
            elif sentiment_score < -0.1:  # Negative sentiment
                if mood in ['sad', 'angry', 'anxious']:
                    combined *= 1.2
                elif mood in ['happy', 'excited', 'calm']:
                    combined *= 0.8
            
            combined_scores[mood] = min(combined, 1.0)
        
        return combined_scores
    
    def _adjust_for_context(self, mood_scores: Dict[str, float], context: str) -> Dict[str, float]:
        """
        Adjust mood scores based on context
        """
        context_lower = context.lower()
        
        # Financial context adjustments
        if 'transaction' in context_lower or 'spending' in context_lower:
            # Spending might indicate stress or satisfaction
            mood_scores['anxious'] *= 1.1
            mood_scores['happy'] *= 1.05
        
        if 'budget' in context_lower:
            # Budget review might indicate concern or satisfaction
            mood_scores['anxious'] *= 1.1
            mood_scores['calm'] *= 1.05
        
        if 'goal' in context_lower:
            # Goal checking might indicate motivation or frustration
            mood_scores['excited'] *= 1.1
            mood_scores['anxious'] *= 1.05
        
        return mood_scores
    
    async def extract_emotions_from_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract multiple emotions from text
        """
        try:
            emotions = []
            cleaned_text = self._clean_text(text)
            
            # Analyze each emotion type
            for emotion, keywords in self.mood_keywords.items():
                score = 0
                matched_keywords = []
                
                for keyword in keywords:
                    if keyword in cleaned_text:
                        score += 1
                        matched_keywords.append(keyword)
                
                if score > 0:
                    emotions.append({
                        "emotion": emotion,
                        "score": score,
                        "confidence": min(score / len(keywords), 1.0),
                        "matched_keywords": matched_keywords
                    })
            
            # Sort by score
            emotions.sort(key=lambda x: x["score"], reverse=True)
            
            return emotions
            
        except Exception as e:
            logger.error(f"Error extracting emotions: {str(e)}")
            return []
    
    async def analyze_spending_context(self, text: str, amount: float, category: str) -> Dict[str, Any]:
        """
        Analyze spending context and emotional state
        """
        try:
            mood_analysis = await self.analyze_mood(text, "transaction")
            
            # Determine spending sentiment
            spending_sentiment = "neutral"
            if mood_analysis["sentiment"] > 0.2:
                spending_sentiment = "positive"
            elif mood_analysis["sentiment"] < -0.2:
                spending_sentiment = "negative"
            
            # Analyze spending justification
            justification_keywords = {
                "necessary": ["need", "required", "essential", "important", "must"],
                "impulse": ["want", "desire", "treat", "splurge", "impulse"],
                "planned": ["planned", "budgeted", "saved", "expected", "anticipated"],
                "emotional": ["stress", "sad", "happy", "celebrate", "comfort"]
            }
            
            justification_scores = {}
            cleaned_text = self._clean_text(text)
            
            for justification, keywords in justification_keywords.items():
                score = sum(1 for keyword in keywords if keyword in cleaned_text)
                justification_scores[justification] = score
            
            primary_justification = max(justification_scores, key=justification_scores.get) if justification_scores else "neutral"
            
            return {
                "mood": mood_analysis["mood"],
                "confidence": mood_analysis["confidence"],
                "sentiment": mood_analysis["sentiment"],
                "spending_sentiment": spending_sentiment,
                "justification": primary_justification,
                "justification_scores": justification_scores,
                "emotions": mood_analysis["emotions"]
            }
            
        except Exception as e:
            logger.error(f"Error analyzing spending context: {str(e)}")
            return {
                "mood": "neutral",
                "confidence": 0.5,
                "sentiment": 0.0,
                "spending_sentiment": "neutral",
                "justification": "neutral",
                "justification_scores": {},
                "emotions": {"neutral": 1.0}
            }
    
    async def generate_mood_summary(self, mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate mood summary from multiple mood logs
        """
        try:
            if not mood_logs:
                return {
                    "dominant_mood": "neutral",
                    "average_confidence": 0.5,
                    "mood_trend": "stable",
                    "emotion_distribution": {"neutral": 1.0}
                }
            
            # Calculate mood distribution
            mood_counts = {}
            total_confidence = 0
            
            for log in mood_logs:
                mood = log.get("mood", "neutral")
                confidence = log.get("confidence", 0.5)
                
                mood_counts[mood] = mood_counts.get(mood, 0) + 1
                total_confidence += confidence
            
            # Find dominant mood
            dominant_mood = max(mood_counts, key=mood_counts.get)
            
            # Calculate emotion distribution
            emotion_distribution = {}
            for mood, count in mood_counts.items():
                emotion_distribution[mood] = count / len(mood_logs)
            
            # Determine mood trend
            mood_trend = self._calculate_mood_trend(mood_logs)
            
            return {
                "dominant_mood": dominant_mood,
                "average_confidence": total_confidence / len(mood_logs),
                "mood_trend": mood_trend,
                "emotion_distribution": emotion_distribution,
                "total_logs": len(mood_logs)
            }
            
        except Exception as e:
            logger.error(f"Error generating mood summary: {str(e)}")
            return {
                "dominant_mood": "neutral",
                "average_confidence": 0.5,
                "mood_trend": "stable",
                "emotion_distribution": {"neutral": 1.0}
            }
    
    def _calculate_mood_trend(self, mood_logs: List[Dict[str, Any]]) -> str:
        """
        Calculate mood trend over time
        """
        try:
            if len(mood_logs) < 2:
                return "stable"
            
            # Sort by date
            sorted_logs = sorted(mood_logs, key=lambda x: x.get("createdAt", datetime.utcnow()))
            
            # Calculate mood scores over time
            mood_scores = []
            for log in sorted_logs:
                mood = log.get("mood", "neutral")
                intensity = log.get("intensity", 5)
                
                # Convert mood to numeric score
                mood_numeric = {
                    "sad": 1, "anxious": 2, "angry": 2, "neutral": 5,
                    "calm": 6, "happy": 8, "excited": 9
                }.get(mood, 5)
                
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
            return "stable"
