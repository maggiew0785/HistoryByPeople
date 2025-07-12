import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

export default function ChatContainer({ messages, error }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
          <p className="text-sm">Ask me about any historical event or period!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll px-4 py-4 chat-scroll"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}
      >
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}