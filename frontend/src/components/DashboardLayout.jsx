import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Bell, MessageSquare, LogOut, Search, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Chatbot from 'react-chatbot-kit';
import chatbotConfig from '../lib/chatbot/config';
import MessageParser from '../lib/chatbot/MessageParser';
import ActionProvider from '../lib/chatbot/ActionProvider';

const DashboardLayout = ({ children, title = "Dashboard" }) => {
    const navigate = useNavigate();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const messagesContainerRef = useRef(null);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const atBottom = scrollHeight - scrollTop - clientHeight < 10;
            setIsAtBottom(atBottom);
        }
    };

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (!isChatOpen) return;

        const timer = setTimeout(() => {
            const messagesContainer = document.querySelector('.chatbot-container .react-chatbot-kit-messages-container');
            if (messagesContainer) {
                messagesContainerRef.current = messagesContainer;
                messagesContainer.addEventListener('scroll', handleScroll);
                // Initial check
                handleScroll();
                return () => {
                    messagesContainer.removeEventListener('scroll', handleScroll);
                };
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [isChatOpen]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('is_admin');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-background-dark overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-background-dark/50 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <h2 className="text-white text-lg font-bold tracking-tight">{title}</h2>
                        <span className="bg-primary/10 text-primary text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-primary/20">
                            Live
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-primary transition-all relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background-dark"></span>
                        </button>
                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-primary transition-all relative group"
                            title="Open Chat Assistant"
                        >
                            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse border border-background-dark"></span>
                        </button>

                        <div className="h-8 w-px bg-white/10 mx-2"></div>

                        <button onClick={handleLogout} className="flex items-center gap-3 group px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-500 p-[1px]">
                                <div className="w-full h-full rounded-full bg-background-dark flex items-center justify-center overflow-hidden">
                                    <img
                                        src="https://i.pravatar.cc/150?u=dashboard"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        alt="User"
                                    />
                                </div>
                            </div>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-xs font-bold text-slate-200">My Account</span>
                                <span className="text-[10px] text-slate-500 font-medium">Sign Out</span>
                            </div>
                            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors ml-1" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-7xl mx-auto space-y-10">
                        {children}
                    </div>
                </div>
            </main>

            {/* Chatbot Modal */}
            {isChatOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-end p-6 pointer-events-none">
                    <div className="w-full max-w-sm h-[600px] bg-background-dark border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 pointer-events-auto">

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                                <div>
                                    <p className="text-white font-black text-sm tracking-tight">TrendAI Assistant</p>
                                    <p className="text-slate-400 text-[11px]">Powered by Groq AI</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chatbot Container */}
                        <div className="flex-1 bg-[#0a0e27] flex flex-col overflow-visible">
                            <style>{`
                                .chatbot-container {
                                    display: flex;
                                    flex-direction: column;
                                    height: 100%;
                                    overflow: visible;
                                }
                                .chatbot-container .react-chatbot-kit-chat-container {
                                    background: transparent;
                                    border: none;
                                    height: 100%;
                                    display: flex;
                                    flex-direction: column;
                                    overflow: visible;
                                }
                                .chatbot-container .react-chatbot-kit-messages-container {
                                    background: transparent;
                                    padding: 16px;
                                    display: flex;
                                    flex-direction: column;
                                    gap: 12px;
                                    flex: 1;
                                    overflow-y: auto;
                                    overflow-x: hidden;
                                    min-height: 0;
                                    position: relative;
                                }
                                .chatbot-container .react-chatbot-kit-messages-container::-webkit-scrollbar {
                                    width: 8px;
                                }
                                .chatbot-container .react-chatbot-kit-messages-container::-webkit-scrollbar-track {
                                    background: rgba(13, 203, 242, 0.1);
                                    border-radius: 10px;
                                }
                                .chatbot-container .react-chatbot-kit-messages-container::-webkit-scrollbar-thumb {
                                    background: rgba(13, 203, 242, 0.5);
                                    border-radius: 10px;
                                }
                                .chatbot-container .react-chatbot-kit-messages-container::-webkit-scrollbar-thumb:hover {
                                    background: rgba(13, 203, 242, 0.8);
                                }
                                .scroll-to-bottom-btn {
                                    position: absolute;
                                    bottom: 16px;
                                    right: 16px;
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    background: rgba(13, 203, 242, 0.9);
                                    border: none;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                    z-index: 20;
                                    transition: all 0.3s ease;
                                    box-shadow: 0 4px 12px rgba(13, 203, 242, 0.3);
                                }
                                .scroll-to-bottom-btn:hover {
                                    background: rgba(13, 203, 242, 1);
                                    transform: scale(1.1);
                                    box-shadow: 0 6px 16px rgba(13, 203, 242, 0.5);
                                }
                                .scroll-to-bottom-btn:active {
                                    transform: scale(0.95);
                                }
                                .chatbot-container .react-chatbot-kit-input-section {
                                    background: linear-gradient(to top, rgba(10, 14, 39, 1), rgba(10, 14, 39, 0.95));
                                    border-top: 1px solid rgba(13, 203, 242, 0.1);
                                    padding: 12px;
                                    margin: 0;
                                    flex-shrink: 0;
                                    flex-grow: 0;
                                    display: flex;
                                    align-items: center;
                                    z-index: 10;
                                }
                                .chatbot-container .react-chatbot-kit-input-group {
                                    gap: 8px;
                                    background: rgba(13, 203, 242, 0.05);
                                    border: 1px solid rgba(13, 203, 242, 0.15);
                                    border-radius: 12px;
                                    padding: 10px;
                                    display: flex !important;
                                    align-items: center;
                                    width: 100%;
                                    transition: all 0.2s ease;
                                }
                                .chatbot-container .react-chatbot-kit-input-group:focus-within {
                                    border-color: rgba(13, 203, 242, 0.4);
                                    background: rgba(13, 203, 242, 0.08);
                                    box-shadow: 0 0 12px rgba(13, 203, 242, 0.1);
                                }
                                .chatbot-container .react-chatbot-kit-chat-input {
                                    background: transparent;
                                    color: white;
                                    border: none;
                                    font-size: 14px;
                                    flex: 1;
                                    padding: 6px 0;
                                    outline: none;
                                }
                                .chatbot-container .react-chatbot-kit-chat-input::placeholder {
                                    color: rgba(148, 163, 184, 0.6);
                                }
                                .chatbot-container .react-chatbot-kit-send-button {
                                    background: #0dcbf2;
                                    color: #0f172a;
                                    border: none;
                                    border-radius: 8px;
                                    padding: 8px 14px;
                                    font-weight: 700;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                    flex-shrink: 0;
                                    font-size: 13px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                }
                                .chatbot-container .react-chatbot-kit-send-button:hover {
                                    background: #0fbfdf;
                                    transform: scale(1.05);
                                    box-shadow: 0 4px 12px rgba(13, 203, 242, 0.3);
                                }
                                .chatbot-container .react-chatbot-kit-send-button:active {
                                    transform: scale(0.98);
                                }
                                .chatbot-container .react-chatbot-kit-user-chat-message-container {
                                    justify-content: flex-end;
                                }
                                .chatbot-container .react-chatbot-kit-chat-message-container {
                                    margin-bottom: 12px;
                                }
                            `}</style>
                            <div className="chatbot-container h-full flex flex-col relative">
                                <Chatbot
                                    config={chatbotConfig}
                                    messageParser={MessageParser}
                                    actionProvider={ActionProvider}
                                />
                                {!isAtBottom && (
                                    <button
                                        onClick={scrollToBottom}
                                        className="scroll-to-bottom-btn"
                                        title="Scroll to latest messages"
                                    >
                                        <ChevronDown className="w-5 h-5 text-white" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
