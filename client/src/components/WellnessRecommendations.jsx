import React from 'react';
import { Link } from 'react-router-dom';
import { 
    AlertCircle, 
    Heart, 
    BookOpen, 
    CheckSquare, 
    TrendingUp, 
    MessageCircle, 
    Award,
    ChevronRight 
} from 'lucide-react';

const iconMap = {
    AlertCircle,
    Heart,
    BookOpen,
    CheckSquare,
    TrendingUp,
    MessageCircle,
    Award
};

export default function WellnessRecommendations({ recommendations = [], wellnessScore = null }) {
    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    const getPriorityBadge = (priority) => {
        const badges = {
            critical: { text: 'Urgent', color: '#ef4444' },
            high: { text: 'Important', color: '#f59e0b' },
            medium: { text: 'Suggested', color: '#06b6d4' },
            low: { text: 'Optional', color: '#10b981' }
        };
        return badges[priority] || badges.medium;
    };

    return (
        <div className="wellness-recommendations">
            <div className="recommendations-header">
                <h2>🤖 AI Wellness Recommendations</h2>
                {wellnessScore && (
                    <div className="wellness-score-badge">
                        <span className="score-label">Your Wellness Score:</span>
                        <span 
                            className="score-value"
                            style={{ 
                                color: wellnessScore.score < 5 ? '#ef4444' : 
                                       wellnessScore.score < 7 ? '#f59e0b' : '#10b981'
                            }}
                        >
                            {wellnessScore.score}/10
                        </span>
                        {wellnessScore.trend && (
                            <span className={`trend-indicator trend-${wellnessScore.trend}`}>
                                {wellnessScore.trend === 'improving' ? '↑' : 
                                 wellnessScore.trend === 'declining' ? '↓' : '→'}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="recommendations-list">
                {recommendations.map((rec, index) => {
                    const Icon = iconMap[rec.icon] || MessageCircle;
                    const badge = getPriorityBadge(rec.priority);

                    return (
                        <div 
                            key={index} 
                            className={`recommendation-card priority-${rec.priority}`}
                            style={{ borderLeftColor: rec.color }}
                        >
                            <div className="recommendation-header">
                                <div className="rec-icon" style={{ backgroundColor: rec.color + '20' }}>
                                    <Icon size={24} style={{ color: rec.color }} />
                                </div>
                                <div className="rec-title-section">
                                    <h3>{rec.title}</h3>
                                    <span 
                                        className="priority-badge"
                                        style={{ 
                                            backgroundColor: badge.color + '20',
                                            color: badge.color
                                        }}
                                    >
                                        {badge.text}
                                    </span>
                                </div>
                            </div>

                            <p className="rec-message">{rec.message}</p>

                            {rec.habitSuggestions && (
                                <div className="habit-suggestions">
                                    <span className="suggestions-label">Suggested habits:</span>
                                    <ul>
                                        {rec.habitSuggestions.map((habit, idx) => (
                                            <li key={idx}>
                                                {habit.habit} <span className="frequency">({habit.frequency})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {rec.actionLink && (
                                <Link 
                                    to={rec.actionLink} 
                                    className="rec-action-button"
                                    style={{ backgroundColor: rec.color }}
                                >
                                    {rec.actionText}
                                    <ChevronRight size={18} />
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
