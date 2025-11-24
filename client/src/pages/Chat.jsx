import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, VolumeX, Send, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

export default function Chat() {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [conversation, setConversation] = useState([]);
    const [avatarText, setAvatarText] = useState('Hi! I\'m Maya, your wellness companion. Talk to me or type below!');
    const [textInput, setTextInput] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const textInputRef = useRef(null);
    const { user } = useApp();
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    console.log('[Chat] API_BASE_URL:', API_BASE_URL);
    console.log('[Chat] User:', user);

    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                setTranscript(speechResult);
                handleUserSpeech(speechResult);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Fallback response generator (used when API fails)
    const generateFallbackResponse = (userMessage) => {
        // Backend handles all responses now - only use this for actual errors
        return "I'm having trouble connecting right now. Please try again.";
    };

    const navigate = useNavigate(); // Add navigation hook

    // Handle agent actions based on structured response
    const handleAgentAction = (action) => {
        if (!action) return;

        console.log('[Chat] Handling agent action:', action);

        switch (action.type) {
            case 'journal':
                // Navigate to journal with prompt
                // We'll pass the prompt via state or query param
                // For now, let's assume passing state works with the router setup
                navigate('/journal', { state: { prompt: action.payload.prompt } });
                break;

            case 'habit':
                // Navigate to habits page
                // Ideally we'd open a modal to create the specific habit
                // passing the payload to pre-fill the form
                navigate('/habits', { state: { suggestedHabit: action.payload } });
                break;

            case 'alert_therapist':
                // Navigate to crisis support or therapist page
                navigate('/crisis', { state: { alert: action.payload } });
                break;

            case 'suggest_therapy':
                // Navigate to therapist list
                navigate('/therapists', { state: { suggestion: action.payload } });
                break;

            default:
                console.warn('[Chat] Unknown action type:', action.type);
        }
    };

    // Call the backend API for chat response
    const getAIResponse = async (userMessage) => {
        console.log('[Chat] getAIResponse called with message:', userMessage);
        const token = localStorage.getItem('authToken');

        if (!token) {
            console.warn('[Chat] No auth token found, using fallback response');
            const fallback = generateFallbackResponse(userMessage);
            console.log('[Chat] Fallback response:', fallback);
            return { response: fallback, action: null };
        }

        const url = `${API_BASE_URL}/api/chat/message`;
        console.log('[Chat] Making API request to:', url);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            console.log('[Chat] API response data:', data);

            if (data.success && data.response) {
                return {
                    response: data.response,
                    action: data.action || data.recommendation?.action
                };
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('[Chat] Error calling chat API:', error);
            throw error;
        }
    };

    const handleUserSpeech = async (text) => {
        console.log('[Chat] handleUserSpeech called with text:', text);
        const userMsg = { role: 'user', content: text, timestamp: new Date() };
        setConversation(prev => [...prev, userMsg]);

        setIsTyping(true);

        try {
            const { response: aiResponse, action } = await getAIResponse(text);

            const aiMsg = { role: 'ai', content: aiResponse, timestamp: new Date() };
            setIsTyping(false);
            setConversation(prev => [...prev, aiMsg]);
            setAvatarText(aiResponse);

            // Speak and handle action safely without breaking the flow
            try {
                speak(aiResponse);
            } catch (speakError) {
                console.warn('[Chat] Speech synthesis failed:', speakError);
            }

            if (action) {
                try {
                    handleAgentAction(action);
                } catch (actionError) {
                    console.warn('[Chat] Action handling failed:', actionError);
                }
            }
        } catch (error) {
            console.error('[Chat] Error handling user speech:', error);
            setIsTyping(false);

            const fallbackResponse = generateFallbackResponse(text);
            const errorAiMsg = { role: 'ai', content: fallbackResponse, timestamp: new Date() };
            setConversation(prev => [...prev, errorAiMsg]);
            setAvatarText(fallbackResponse);

            try {
                speak(fallbackResponse);
            } catch (speakError) {
                console.warn('[Chat] Speech synthesis failed:', speakError);
            }
        }
    };

    const handleTextSubmit = async (e) => {
        e.preventDefault();

        if (!textInput.trim() || isSpeaking) return;

        const userMessage = textInput.trim();
        const userMsg = { role: 'user', content: userMessage, timestamp: new Date() };
        setConversation(prev => [...prev, userMsg]);
        setTextInput('');
        setIsTyping(true);

        try {
            const { response: aiResponse, action } = await getAIResponse(userMessage);

            const aiMsg = { role: 'ai', content: aiResponse, timestamp: new Date() };
            setIsTyping(false);
            setConversation(prev => [...prev, aiMsg]);
            setAvatarText(aiResponse);

            // Speak and handle action safely without breaking the flow
            try {
                speak(aiResponse);
            } catch (speakError) {
                console.warn('[Chat] Speech synthesis failed:', speakError);
            }

            if (action) {
                try {
                    handleAgentAction(action);
                } catch (actionError) {
                    console.warn('[Chat] Action handling failed:', actionError);
                }
            }
        } catch (error) {
            console.error('[Chat] Error in handleTextSubmit:', error);
            setIsTyping(false);

            const fallbackResponse = generateFallbackResponse(userMessage);
            const errorAiMsg = { role: 'ai', content: fallbackResponse, timestamp: new Date() };
            setConversation(prev => [...prev, errorAiMsg]);
            setAvatarText(fallbackResponse);

            try {
                speak(fallbackResponse);
            } catch (speakError) {
                console.warn('[Chat] Speech synthesis failed:', speakError);
            }
        }
    };

    const copyMessage = (content) => {
        navigator.clipboard.writeText(content);
    };

    const giveFeedback = (messageIndex, isPositive) => {
        console.log(`Feedback for message ${messageIndex}: ${isPositive ? 'positive' : 'negative'}`);
    };

    const saveConversation = () => {
        if (conversation.length === 0) return;

        const sessionId = Date.now();
        const session = {
            id: sessionId,
            title: conversation[0]?.content.substring(0, 30) + '...',
            messages: [...conversation],
            date: new Date()
        };

        setConversationHistory(prev => [session, ...prev]);
        setConversation([]);
        setAvatarText('Hi! I\'m Maya, your wellness companion. Talk to me or type below!');
    };

    const loadConversation = (session) => {
        setSelectedSession(session);
        setConversation(session.messages);
        setAvatarText(session.messages[session.messages.length - 1]?.content || 'Session loaded!');
    };

    const deleteSession = (sessionId) => {
        setConversationHistory(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSession?.id === sessionId) {
            setSelectedSession(null);
            setConversation([]);
        }
    };

    const startNewChat = () => {
        if (conversation.length > 0) {
            saveConversation();
        }
        setConversation([]);
        setSelectedSession(null);
        setAvatarText('Hi! I\'m Maya, your wellness companion. Talk to me or type below!');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, isTyping]);
    useEffect(() => {
        if (isListening) {
            const interval = setInterval(() => {
                setAudioLevel(Math.random() * 100);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setAudioLevel(0);
        }
    }, [isListening]);
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl/Cmd + K - Focus input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                textInputRef.current?.focus();
            }
            // Ctrl/Cmd + N - New chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                startNewChat();
            }
            // Ctrl/Cmd + S - Save conversation
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (conversation.length > 0) {
                    saveConversation();
                }
            }
            // Ctrl/Cmd + / - Show shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                setShowShortcuts(prev => !prev);
            }
            // Escape - Clear input or hide shortcuts
            if (e.key === 'Escape') {
                if (showShortcuts) {
                    setShowShortcuts(false);
                } else if (textInput) {
                    setTextInput('');
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [conversation, textInput, showShortcuts]);
    useEffect(() => {
        if (conversation.length > 0 && document.hidden) {
            setUnreadCount(prev => prev + 1);
        }
    }, [conversation]);
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                setUnreadCount(0);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (recognitionRef.current) {
                setTranscript('');
                setIsListening(true);
                recognitionRef.current.start();
            } else {
                alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            }
        }
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    return (
        <div className={`gamified-chat-page ${isFullscreen ? 'fullscreen-mode' : ''}`}>
            {/* Mobile Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Mobile Sidebar Toggle Button */}
            <button
                className="mobile-sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
            >
                ☰
            </button>

            {showShortcuts && (
                <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
                    <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="shortcuts-header">
                            <h3>⌨️ Keyboard Shortcuts</h3>
                            <button onClick={() => setShowShortcuts(false)} className="close-shortcuts">
                                ✕
                            </button>
                        </div>
                        <div className="shortcuts-list">
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>K</kbd></span>
                                <span className="shortcut-desc">Focus input field</span>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>N</kbd></span>
                                <span className="shortcut-desc">Start new chat</span>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>S</kbd></span>
                                <span className="shortcut-desc">Save conversation</span>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>/</kbd></span>
                                <span className="shortcut-desc">Toggle shortcuts</span>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Esc</kbd></span>
                                <span className="shortcut-desc">Clear input / Close</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <button
                className="fullscreen-toggle-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
                {isFullscreen ? '⊟' : '⊞'}
            </button>
            <button
                className="shortcuts-hint-btn"
                onClick={() => setShowShortcuts(true)}
                title="Keyboard shortcuts (Ctrl + /)">
                ⌨️
            </button>

            <div className="chat-layout">
                <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header-chat">
                        <div className="header-with-badge">
                            <h3>💬 Chat Sessions</h3>
                            {conversationHistory.length > 0 && (
                                <span className="session-badge">{conversationHistory.length}</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                className="new-chat-btn"
                                onClick={() => {
                                    startNewChat();
                                    setSidebarOpen(false);
                                }}
                                title="New Chat (Ctrl+N)"
                            >
                                +
                            </button>
                            <button
                                className="mobile-sidebar-close"
                                onClick={() => setSidebarOpen(false)}
                                title="Close sidebar"
                                aria-label="Close sidebar"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="sessions-list">
                        {conversationHistory.length === 0 ? (
                            <div className="empty-sessions">
                                <div className="empty-icon">📝</div>
                                <p>No saved conversations</p>
                                <span className="empty-hint">Start chatting to create your first session</span>
                            </div>
                        ) : (
                            conversationHistory.map((session) => (
                                <div
                                    key={session.id}
                                    className={`session-card ${selectedSession?.id === session.id ? 'active' : ''}`}
                                    onClick={() => {
                                        loadConversation(session);
                                        setSidebarOpen(false);
                                    }}
                                >
                                    <div className="session-info">
                                        <h4>{session.title}</h4>
                                        <p>{new Date(session.date).toLocaleDateString()}</p>
                                        <span className="message-count">{session.messages.length} messages</span>
                                    </div>
                                    <button
                                        className="delete-session-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSession(session.id);
                                        }}
                                        title="Delete"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {conversation.length > 0 && (
                        <button
                            className="save-conversation-btn"
                            onClick={() => {
                                saveConversation();
                                setSidebarOpen(false);
                            }}
                        >
                            💾 Save Current Chat
                        </button>
                    )}
                </div>
                <div className="chat-main">
                    <div className="messages-area">
                        <div className="messages-scroll">
                            {conversation.length === 0 ? (
                                <div className="welcome-message">
                                    <div className="empty-state-icon">💬</div>
                                    <h2>Start a Conversation</h2>
                                    <p className="empty-state-desc">Choose a topic below or type your own message</p>
                                    <div className="quick-starters">
                                        <button onClick={() => setTextInput("I'm feeling anxious today")}>💭 Feeling anxious</button>
                                        <button onClick={() => setTextInput("I need help managing stress")}>😓 Managing stress</button>
                                        <button onClick={() => setTextInput("Tell me about meditation")}>🧘 Learn meditation</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {conversation.map((msg, index) => (
                                        <div key={index} className={`chat-message ${msg.role}`}>
                                            <div className="message-avatar-icon">
                                                {msg.role === 'user' ? (
                                                    <div className="user-avatar">U</div>
                                                ) : (
                                                    <Bot size={20} className="ai-avatar-icon" />
                                                )}
                                            </div>
                                            <div className="message-bubble-wrapper">
                                                <div className="message-bubble">
                                                    <p>{msg.content}</p>
                                                    <span className="message-timestamp">
                                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {msg.role === 'ai' && (
                                                    <div className="message-actions">
                                                        <button
                                                            className="message-action-btn"
                                                            onClick={() => copyMessage(msg.content)}
                                                            title="Copy message"
                                                        >
                                                            📋
                                                        </button>
                                                        <button
                                                            className="message-action-btn"
                                                            onClick={() => giveFeedback(index, true)}
                                                            title="Helpful"
                                                        >
                                                            👍
                                                        </button>
                                                        <button
                                                            className="message-action-btn"
                                                            onClick={() => giveFeedback(index, false)}
                                                            title="Not helpful"
                                                        >
                                                            👎
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Typing Indicator */}
                                    {isTyping && (
                                        <div className="chat-message ai typing-message">
                                            <div className="message-avatar-icon">
                                                <Bot size={20} className="ai-avatar-icon" />
                                            </div>
                                            <div className="message-bubble typing-bubble">
                                                <div className="typing-dots">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="chat-input-zone">
                        {isListening && (
                            <div className="listening-animation">
                                <div className="voice-visualizer">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="voice-bar"
                                            style={{
                                                height: `${Math.max(20, audioLevel * (0.5 + Math.random() * 0.5))}%`,
                                                animationDelay: `${i * 0.1}s`
                                            }}
                                        ></div>
                                    ))}
                                </div>
                                <span>Listening...</span>
                            </div>
                        )}

                        <form onSubmit={handleTextSubmit} className="input-form">
                            <button
                                type="button"
                                className={`mic-button ${isListening ? 'active' : ''}`}
                                onClick={toggleListening}
                                disabled={isSpeaking}
                                title={isListening ? 'Stop listening' : 'Start voice input'}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            <input
                                ref={textInputRef}
                                type="text"
                                className="text-input-field"
                                placeholder="Type your message or use voice... (Ctrl+K to focus)"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                disabled={isSpeaking || isListening}
                            />

                            <button
                                type="submit"
                                className="send-button"
                                disabled={!textInput.trim() || isSpeaking || isListening}
                                onClick={(e) => {
                                    console.log('[Chat] Send button clicked');
                                    if (!textInput.trim() || isSpeaking || isListening) {
                                        console.log('[Chat] Button disabled, not submitting');
                                        e.preventDefault();
                                    }
                                }}
                                title="Send message"
                            >
                                <Send size={18} />
                            </button>

                            {isSpeaking && (
                                <button
                                    type="button"
                                    className="stop-speaking-btn"
                                    onClick={stopSpeaking}
                                    title="Stop speaking"
                                >
                                    <VolumeX size={20} />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
