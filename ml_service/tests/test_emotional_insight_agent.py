import pytest
import asyncio
from unittest.mock import Mock, patch
from services.emotional_insight_agent import EmotionalInsightAgent
from services.nlp_module import NLPModule
from services.clustering_module import ClusteringModule
from services.forecasting_module import ForecastingModule

class TestEmotionalInsightAgent:
    @pytest.fixture
    def agent(self):
        return EmotionalInsightAgent()

    @pytest.fixture
    def mock_user_data(self):
        return {
            "userId": "test_user_123",
            "transactions": [
                {"amount": -50.0, "category": "food", "mood": "happy", "date": "2024-01-15"},
                {"amount": -25.0, "category": "transport", "mood": "neutral", "date": "2024-01-14"},
                {"amount": 2000.0, "category": "income", "mood": "excited", "date": "2024-01-01"},
            ],
            "moodLogs": [
                {"mood": "happy", "score": 8, "date": "2024-01-15"},
                {"mood": "neutral", "score": 6, "date": "2024-01-14"},
                {"mood": "excited", "score": 9, "date": "2024-01-01"},
            ]
        }

    @pytest.mark.asyncio
    async def test_generate_emotional_profile(self, agent, mock_user_data):
        """Test emotional profile generation"""
        profile = await agent.generate_emotional_profile(mock_user_data)
        
        assert profile is not None
        assert "overallMood" in profile
        assert "moodTrend" in profile
        assert "stressLevel" in profile
        assert "emotionalStability" in profile
        assert "recentMoods" in profile

    @pytest.mark.asyncio
    async def test_analyze_spending_patterns(self, agent, mock_user_data):
        """Test spending pattern analysis"""
        patterns = await agent.analyze_spending_patterns(mock_user_data)
        
        assert patterns is not None
        assert "totalSpent" in patterns
        assert "averageDaily" in patterns
        assert "topCategories" in patterns
        assert "spendingTrend" in patterns
        assert "budgetCompliance" in patterns

    @pytest.mark.asyncio
    async def test_generate_recommendations(self, agent, mock_user_data):
        """Test recommendation generation"""
        recommendations = await agent.generate_recommendations(mock_user_data)
        
        assert recommendations is not None
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        
        for rec in recommendations:
            assert "type" in rec
            assert "priority" in rec
            assert "title" in rec
            assert "description" in rec
            assert "impact" in rec
            assert "action" in rec
            assert "sentiment" in rec

    @pytest.mark.asyncio
    async def test_generate_forecasts(self, agent, mock_user_data):
        """Test forecast generation"""
        forecasts = await agent.generate_forecasts(mock_user_data)
        
        assert forecasts is not None
        assert "nextMonthSpending" in forecasts
        assert "savingsProjection" in forecasts
        assert "goalAchievement" in forecasts

    @pytest.mark.asyncio
    async def test_process_user_data(self, agent, mock_user_data):
        """Test complete user data processing"""
        result = await agent.process_user_data(mock_user_data)
        
        assert result is not None
        assert "emotionalProfile" in result
        assert "spendingPatterns" in result
        assert "recommendations" in result
        assert "forecasts" in result
        assert "aiInsights" in result

class TestNLPModule:
    @pytest.fixture
    def nlp_module(self):
        return NLPModule()

    def test_sentiment_analysis(self, nlp_module):
        """Test sentiment analysis functionality"""
        positive_text = "I'm so happy with my financial progress!"
        negative_text = "I'm stressed about my spending habits."
        neutral_text = "I made a purchase today."

        positive_sentiment = nlp_module.analyze_sentiment(positive_text)
        negative_sentiment = nlp_module.analyze_sentiment(negative_text)
        neutral_sentiment = nlp_module.analyze_sentiment(neutral_text)

        assert positive_sentiment["sentiment"] == "positive"
        assert negative_sentiment["sentiment"] == "negative"
        assert neutral_sentiment["sentiment"] == "neutral"

    def test_keyword_extraction(self, nlp_module):
        """Test keyword extraction functionality"""
        text = "I spent money on groceries and transportation today."
        keywords = nlp_module.extract_keywords(text)
        
        assert isinstance(keywords, list)
        assert len(keywords) > 0
        assert "groceries" in keywords or "transportation" in keywords

class TestClusteringModule:
    @pytest.fixture
    def clustering_module(self):
        return ClusteringModule()

    def test_user_segmentation(self, clustering_module):
        """Test user segmentation functionality"""
        user_data = [
            {"spending": 1000, "income": 3000, "savings": 500},
            {"spending": 2000, "income": 4000, "savings": 200},
            {"spending": 500, "income": 2000, "savings": 300},
        ]
        
        segments = clustering_module.segment_users(user_data)
        
        assert isinstance(segments, list)
        assert len(segments) > 0

class TestForecastingModule:
    @pytest.fixture
    def forecasting_module(self):
        return ForecastingModule()

    def test_spending_forecast(self, forecasting_module):
        """Test spending forecast functionality"""
        historical_data = [100, 120, 110, 130, 115, 125, 140]
        forecast = forecasting_module.forecast_spending(historical_data, periods=3)
        
        assert isinstance(forecast, list)
        assert len(forecast) == 3
        assert all(isinstance(x, (int, float)) for x in forecast)

    def test_mood_forecast(self, forecasting_module):
        """Test mood forecast functionality"""
        mood_scores = [8, 7, 9, 6, 8, 7, 9]
        forecast = forecasting_module.forecast_mood(mood_scores, periods=3)
        
        assert isinstance(forecast, list)
        assert len(forecast) == 3
        assert all(0 <= x <= 10 for x in forecast)
