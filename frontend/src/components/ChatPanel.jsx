import React from 'react';
import useChat from '../hooks/useChat';
import ChatContainer from './chat/ChatContainer';
import ChatInput from './chat/ChatInput';

export default function ChatPanel() {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Historical Chat</h2>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>
      
      {/* Scrollable Chat Area - This will expand to fill available space */}
      <div className="flex-1 min-h-0">
        <ChatContainer messages={messages} error={error} />
      </div>
      
      {/* Fixed Input at Bottom */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
