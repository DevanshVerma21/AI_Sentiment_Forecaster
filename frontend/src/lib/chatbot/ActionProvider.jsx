import React from 'react';
const ActionProvider = ({ createChatBotMessage, setState, children }) => {

  const getAIResponse = async (userMessage) => {
    const typingMessage = createChatBotMessage("Thinking...");
    updateChatbotState(typingMessage);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      
      const data = await response.json();
      
      const botMessage = createChatBotMessage(data.reply);
      updateChatbotState(botMessage);
    } catch (error) {
      const errorMessage = createChatBotMessage("Sorry, I'm having trouble connecting to the server.");
      updateChatbotState(errorMessage);
    }
  };

  const updateChatbotState = (message) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          actions: { getAIResponse },
        });
      })}
    </div>
  );
};
export default ActionProvider;
