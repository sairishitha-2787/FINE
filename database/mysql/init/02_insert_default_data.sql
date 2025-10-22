-- Insert default categories
INSERT INTO categories (name, icon, color, is_default) VALUES
('Food & Dining', '🍽️', '#FF6B6B', TRUE),
('Transportation', '🚗', '#4ECDC4', TRUE),
('Shopping', '🛍️', '#45B7D1', TRUE),
('Entertainment', '🎬', '#96CEB4', TRUE),
('Healthcare', '🏥', '#FFEAA7', TRUE),
('Education', '📚', '#DDA0DD', TRUE),
('Utilities', '⚡', '#98D8C8', TRUE),
('Rent/Mortgage', '🏠', '#F7DC6F', TRUE),
('Insurance', '🛡️', '#BB8FCE', TRUE),
('Savings', '💰', '#85C1E9', TRUE),
('Investment', '📈', '#F8C471', TRUE),
('Gifts', '🎁', '#F1948A', TRUE),
('Travel', '✈️', '#85C1E9', TRUE),
('Personal Care', '💄', '#F7DC6F', TRUE),
('Subscriptions', '📱', '#D7BDE2', TRUE),
('Income', '💵', '#82E0AA', TRUE),
('Other', '📦', '#BDC3C7', TRUE);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('app_name', 'FINE - Finance Intelligent Ecosystem', 'Application name', TRUE),
('app_version', '1.0.0', 'Current application version', TRUE),
('maintenance_mode', 'false', 'Maintenance mode status', TRUE),
('max_file_size', '5242880', 'Maximum file upload size in bytes', FALSE),
('supported_currencies', '["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]', 'Supported currencies', TRUE),
('default_currency', 'USD', 'Default currency for new users', TRUE),
('ml_service_enabled', 'true', 'ML service integration status', FALSE),
('notification_enabled', 'true', 'Global notification status', TRUE),
('backup_frequency', 'daily', 'Database backup frequency', FALSE),
('session_timeout', '86400', 'Session timeout in seconds (24 hours)', FALSE);

-- Insert sample achievements
INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, icon, points) VALUES
(0, 'onboarding', 'Welcome to FINE!', 'Completed the onboarding process', '🎉', 10),
(0, 'transaction', 'First Transaction', 'Added your first transaction', '💳', 5),
(0, 'budget', 'Budget Master', 'Created your first budget', '📊', 15),
(0, 'goal', 'Goal Setter', 'Set your first financial goal', '🎯', 20),
(0, 'streak', 'Week Warrior', 'Logged transactions for 7 consecutive days', '🔥', 25),
(0, 'saving', 'Saver', 'Saved $100 in a month', '💰', 30),
(0, 'insight', 'Insight Seeker', 'Viewed 10 emotional insights', '🧠', 15),
(0, 'mood', 'Mood Tracker', 'Logged mood for 30 days', '😊', 35),
(0, 'milestone', 'Milestone Master', 'Reached a financial milestone', '🏆', 50),
(0, 'community', 'Helper', 'Provided feedback to improve the app', '🤝', 20);
