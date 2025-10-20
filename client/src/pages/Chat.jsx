import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Chat() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            content: "Hi! I'm your AI mental health companion. How are you feeling today?",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useApp();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const generateAIResponse = (userMessage) => {
        const responses = [
            "I understand. It's completely normal to feel that way. Can you tell me more about what's been on your mind?",
            "Thank you for sharing that with me. Your feelings are valid. Have you noticed any patterns in when these feelings occur?",
            "That sounds challenging. Remember, it's okay to take things one step at a time. What would help you feel better right now?",
            "I hear you. Sometimes just talking about it can help. Would you like to explore some coping strategies together?",
            "You're doing great by opening up about this. Let's work through this together. What's the most pressing thing on your mind?"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: generateAIResponse(inputValue),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickPrompts = [
        "I'm feeling anxious today",
        "Can you help me with stress?",
        "I need coping strategies",
        "Tell me about mindfulness"
    ];

    return (
        <div className="chat-page">
            <header className="page-header">
                <div>
                    <h1>AI Companion Chat</h1>
                    <p>Your safe space for conversation and support</p>
                </div>
            </header>

            <div className="chat-container">
                <div className="messages-container">
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.type}`}>
                            <div className="message-avatar">
                                {message.type === 'ai' ? <Bot size={20} /> : <UserIcon size={20} />}
                            </div>
                            <div className="message-content">
                                <p>{message.content}</p>
                                <span className="message-time">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="message ai">
                            <div className="message-avatar">
                                <Bot size={20} />
                            </div>
                            <div className="message-content typing">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {messages.length === 1 && (
                    <div className="quick-prompts">
                        <p>Try asking:</p>
                        <div className="prompts-grid">
                            {quickPrompts.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInputValue(prompt)}
                                    className="prompt-btn"
                                >
                                    <Sparkles size={14} />
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="chat-input-container">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        rows="1"
                    />
                    <button onClick={handleSend} disabled={!inputValue.trim()}>
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
