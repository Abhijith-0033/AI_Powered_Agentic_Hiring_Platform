import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    X,
    Send,
    Bot,
    User,
    Minimize2,
    Maximize2,
    Sparkles,
    Paperclip,
    MoreHorizontal
} from 'lucide-react';

/**
 * ChatbotWidget component - A unique, modern chatbot widget
 * Features:
 * - Persistent bottom-right positioning
 * - Custom animated icon
 * - Responsive chat window
 * - Message history with bot simulation
 * - Auto-scroll and typing indicators
 */
const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hi there! I'm your AI Hiring Assistant. How can I help you with your journey today?",
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom whenever messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, isOpen, isMinimized, isTyping]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage = {
            id: messages.length + 1,
            text: inputValue,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Show typing indicator
        setIsTyping(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${API_BASE_URL}/chatbot/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: userMessage.text })
            });

            const data = await response.json();

            if (data.success) {
                const botResponse = {
                    id: Date.now(),
                    text: data.answer,
                    sender: 'bot',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, botResponse]);
            } else {
                throw new Error(data.message || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMessage = {
                id: Date.now(),
                text: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.",
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out border border-gray-100 flex flex-col
            ${isMinimized ? 'h-14 w-72 mb-4' : 'h-[500px] w-[350px] sm:w-[400px] mb-4'}
            ${!isOpen ? 'opacity-0 scale-95 translate-y-10' : 'opacity-100 scale-100 translate-y-0'}
          `}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex items-center justify-between shadow-md">
                        <div className="flex items-center space-x-2">
                            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                <Sparkles size={18} className="text-white animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-none">HireX Assistant</h3>
                                <div className="flex items-center mt-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                                    <span className="text-[10px] text-blue-100 uppercase tracking-wider font-medium">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                                title={isMinimized ? "Maximize" : "Minimize"}
                            >
                                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                            </button>
                            <button
                                onClick={toggleChat}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`flex-shrink-0 mt-1 ${msg.sender === 'user' ? 'ml-2' : 'mr-2'}`}>
                                                {msg.sender === 'bot' ? (
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                                                        <Bot size={16} />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                                                        <User size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm
                          ${msg.sender === 'user'
                                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
                        `}>
                                                    {msg.text}
                                                </div>
                                                <span className={`text-[10px] mt-1 text-gray-400 font-medium px-1
                          ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
                                                >
                                                    {msg.timestamp}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex flex-row">
                                            <div className="flex-shrink-0 mr-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <Bot size={16} />
                                                </div>
                                            </div>
                                            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex space-x-1.5 items-center">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form
                                onSubmit={handleSendMessage}
                                className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2"
                            >
                                <div className="flex-1 bg-gray-100 rounded-xl flex items-center px-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-blue-200">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Ask a question..."
                                        className="w-full py-2 bg-transparent text-sm focus:outline-none text-gray-700"
                                    />
                                    <button type="button" className="text-gray-400 hover:text-blue-500 transition-colors">
                                        <Paperclip size={18} />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className={`p-2.5 rounded-xl transition-all shadow-md active:scale-95
                    ${inputValue.trim()
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                  `}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}

            {/* Launcher Icon */}
            <button
                onClick={toggleChat}
                className={`group relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden
          ${isOpen
                        ? 'bg-gray-100 text-gray-700 rotate-90 scale-90'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-2xl hover:scale-105 active:scale-95'}
        `}
                aria-label="Toggle Chatbot"
            >
                {/* Animated background rings when closed */}
                {!isOpen && (
                    <>
                        <div className="absolute inset-0 bg-white/20 animate-ping opacity-20"></div>
                        <div className="absolute inset-0 bg-blue-400/20 animate-pulse opacity-30 rounded-full"></div>
                    </>
                )}

                {isOpen ? (
                    <X size={28} />
                ) : (
                    <div className="relative">
                        <Bot size={32} className="group-hover:translate-y-[-2px] transition-transform duration-300" />
                        <div className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                        </div>
                    </div>
                )}
            </button>

            {/* Tooltip (only visible when chat is closed) */}
            {!isOpen && (
                <div className="absolute right-20 bottom-2 bg-gray-800 text-white text-xs py-2 px-4 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none transform translate-y-[-10px] group-hover:translate-y-0 duration-300">
                    Need help? Click to chat!
                    <div className="absolute right-[-4px] top-1/2 translate-y-[-50%] border-l-4 border-l-gray-800 border-y-4 border-y-transparent"></div>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
