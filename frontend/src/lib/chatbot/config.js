import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  botName: 'TrendAI Assistant',
  initialMessages: [
    createChatBotMessage(
      "Welcome to TrendAI! 👋 I'm your AI Assistant. Ask me anything about market trends, sentiment analysis, data management, billing, or API integration. I'm here to help!",
      {
        withAvatar: true,
        delay: 500,
      }
    ),
  ],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#0dcbf2',
      color: '#ffffff',
      borderRadius: '16px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(13, 203, 242, 0.15)',
      fontSize: '14px',
      lineHeight: '1.5',
      maxWidth: '85%'
    },
    chatButton: {
      backgroundColor: '#0dcbf2',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      boxShadow: '0 4px 16px rgba(13, 203, 242, 0.3)',
    },
    chatButtonBox: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
    },
    chatbox: {
      backgroundColor: '#0f172a',
      border: '1px solid rgba(13, 203, 242, 0.2)',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      fontFamily: 'Inter, sans-serif',
    },
    userMessageBox: {
      backgroundColor: '#0dcbf2',
      color: '#ffffff',
      borderRadius: '16px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(13, 203, 242, 0.15)',
      fontSize: '14px',
      lineHeight: '1.5',
      maxWidth: '85%'
    },
    chatHeader: {
      backgroundColor: 'rgba(13, 203, 242, 0.05)',
      borderBottom: '1px solid rgba(13, 203, 242, 0.1)',
      borderRadius: '20px 20px 0 0',
      padding: '16px 20px',
    },
    chatHeaderTitle: {
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 700,
      letterSpacing: '0.5px',
    },
    chatHeaderCloseButton: {
      color: '#0dcbf2',
    },
    chatContainer: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      backgroundColor: '#0f172a',
    },
  },
  state: {
    messageHistory: [],
  },
  widgets: [],
};

export default config;