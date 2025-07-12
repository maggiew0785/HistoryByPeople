import { useState, useCallback } from 'react';
import { ChatAPI } from '../services/api';

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await ChatAPI.sendMessage(message, conversationHistory);
      
      // Create AI message placeholder
      const aiMessage = {
        id: Date.now() + 1,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, aiMessage]);

      // Stream the response
      let streamedText = '';
      for await (const data of ChatAPI.streamResponse(response)) {
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (!data.done) {
          streamedText += data.content;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, text: streamedText }
              : msg
          ));
        } else {
          // Streaming complete
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, text: data.fullResponse || streamedText, isStreaming: false }
              : msg
          ));
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  };
}
