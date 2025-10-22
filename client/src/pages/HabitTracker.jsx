import React, { useState } from 'react';
import { CheckSquare, Plus, TrendingUp, Moon, Dumbbell, Brain, Users, Apple } from 'lucide-react';

const habitIcons = {
    sleep: Moon,
    exercise: Dumbbell,
    meditation: Brain,
    social_connection: Users,
    nutrition: Apple
};

const habitColors = {
    sleep: '#8b5cf6',
    exercise: '#10b981',
    meditation: '#06b6d4',
    social_connection: '#f59e0b',
    nutrition: '#ef4444'
};

export default function HabitTracker() {
    const [habits, setHabits] = useState([
        {
            id: 1,
            name: 'Morning Meditation',
            category: 'meditation',
            goal: 'daily',
            streak: 7,
            completedDates: ['2025-10-20', '2025-10-19', '2025-10-18'],
            description: '10 minutes of mindfulness'
        },
        {
            id: 2,
            name: 'Exercise',
            category: 'exercise',
            goal: '5 times per week',
            streak: 3,
            completedDates: ['2025-10-20', '2025-10-19'],
            description: '30 minutes of physical activity'
        },
        {
            id: 3,
            name: '8 Hours Sleep',
            category: 'sleep',
            goal: 'daily',
            streak: 12,
            completedDates: ['2025-10-20', '2025-10-19', '2025-10-18'],
            description: 'Get quality rest'
        }
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newHabit, setNewHabit] = useState({
        name: '',
        category: 'meditation',
        goal: 'daily',
        description: ''
    });

    const handleAddHabit = () => {
        if (!newHabit.name) {
            alert('Please enter a habit name');
            return;
        }

        const habit = {
            id: habits.length + 1,
            name: newHabit.name,
            category: newHabit.category,
            goal: newHabit.goal,
            streak: 0,
            completedDates: [],
            description: newHabit.description
        };

        setHabits([...habits, habit]);
        setNewHabit({ name: '', category: 'meditation', goal: 'daily', description: '' });
        setShowAddForm(false);
    };

    const toggleHabitToday = (habitId) => {
        const today = new Date().toISOString().split('T')[0];
        setHabits(habits.map(habit => {
            if (habit.id === habitId) {
                const isCompleted = habit.completedDates.includes(today);
                if (isCompleted) {
                    return {
                        ...habit,
                        completedDates: habit.completedDates.filter(d => d !== today),
                        streak: Math.max(0, habit.streak - 1)
                    };
                } else {
                    return {
                        ...habit,
                        completedDates: [...habit.completedDates, today],
                        streak: habit.streak + 1
                    };
                }
            }
            return habit;
        }));
    };

    const isCompletedToday = (habit) => {
        const today = new Date().toISOString().split('T')[0];
        return habit.completedDates.includes(today);
    };

    const getTotalStreak = () => {
        return habits.reduce((sum, h) => sum + h.streak, 0);
    };

    return (
        <div className="habit-tracker-page">
            <header className="page-header">
                <div>
                    <h1>Habit Tracker</h1>
                    <p>Build healthy habits for better mental wellness</p>
                </div>
                <button 
                    className="primary-button"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    <Plus size={20} />
                    {showAddForm ? 'Cancel' : 'Add Habit'}
                </button>
            </header>

            <div className="tracker-stats">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#667eea20' }}>
                        <CheckSquare size={24} style={{ color: '#667eea' }} />
                    </div>
                    <div className="stat-content">
                        <h3>{habits.length}</h3>
                        <p>Active Habits</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#10b98120' }}>
                        <TrendingUp size={24} style={{ color: '#10b981' }} />
                    </div>
                    <div className="stat-content">
                        <h3>{getTotalStreak()}</h3>
                        <p>Total Streaks</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#f59e0b20' }}>
                        <CheckSquare size={24} style={{ color: '#f59e0b' }} />
                    </div>
                    <div className="stat-content">
                        <h3>{habits.filter(h => isCompletedToday(h)).length}/{habits.length}</h3>
                        <p>Completed Today</p>
                    </div>
                </div>
            </div>

            {showAddForm && (
                <div className="add-habit-form">
                    <h2>Add New Habit</h2>
                    <div className="form-content">
                        <input
                            type="text"
                            placeholder="Habit name..."
                            value={newHabit.name}
                            onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                            className="habit-name-input"
                        />

                        <select
                            value={newHabit.category}
                            onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                            className="habit-category-select"
                        >
                            <option value="meditation">🧘 Meditation</option>
                            <option value="exercise">💪 Exercise</option>
                            <option value="sleep">😴 Sleep</option>
                            <option value="social_connection">👥 Social Connection</option>
                            <option value="nutrition">🍎 Nutrition</option>
                        </select>

                        <select
                            value={newHabit.goal}
                            onChange={(e) => setNewHabit({ ...newHabit, goal: e.target.value })}
                            className="habit-goal-select"
                        >
                            <option value="daily">Daily</option>
                            <option value="3 times per week">3 times per week</option>
                            <option value="5 times per week">5 times per week</option>
                            <option value="weekly">Weekly</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Description (optional)..."
                            value={newHabit.description}
                            onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                            className="habit-description-input"
                        />

                        <button onClick={handleAddHabit} className="save-button">
                            <Plus size={20} />
                            Add Habit
                        </button>
                    </div>
                </div>
            )}

            <div className="habits-list">
                <h2>Your Habits</h2>
                <div className="habits-grid">
                    {habits.map((habit) => {
                        const Icon = habitIcons[habit.category] || CheckSquare;
                        const color = habitColors[habit.category] || '#667eea';
                        const completed = isCompletedToday(habit);

                        return (
                            <div 
                                key={habit.id} 
                                className={`habit-card ${completed ? 'completed' : ''}`}
                                style={{ borderLeftColor: color }}
                            >
                                <div className="habit-header">
                                    <div className="habit-icon" style={{ backgroundColor: color + '20' }}>
                                        <Icon size={24} style={{ color }} />
                                    </div>
                                    <div className="habit-info">
                                        <h3>{habit.name}</h3>
                                        <p className="habit-goal">{habit.goal}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleHabitToday(habit.id)}
                                        className={`habit-check ${completed ? 'checked' : ''}`}
                                        style={{ 
                                            backgroundColor: completed ? color : 'transparent',
                                            borderColor: color
                                        }}
                                    >
                                        {completed && <CheckSquare size={20} />}
                                    </button>
                                </div>

                                {habit.description && (
                                    <p className="habit-description">{habit.description}</p>
                                )}

                                <div className="habit-stats">
                                    <div className="habit-stat">
                                        <span className="stat-label">Streak</span>
                                        <span className="stat-value" style={{ color }}>
                                            🔥 {habit.streak} days
                                        </span>
                                    </div>
                                    <div className="habit-stat">
                                        <span className="stat-label">Completed</span>
                                        <span className="stat-value">
                                            {habit.completedDates.length} times
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {habits.length === 0 && (
                    <div className="empty-state">
                        <CheckSquare size={48} />
                        <h3>No habits yet</h3>
                        <p>Start building healthy habits to improve your wellness</p>
                    </div>
                )}
            </div>
        </div>
    );
}
