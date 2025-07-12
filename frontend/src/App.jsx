import React from 'react';
import ChatPanel from './components/ChatPanel';
import VideoPanel from './components/VideoPanel';

export default function App() {
  return (
    <div className="h-full flex">
      <div className="w-1/3 border-r border-gray-200">
        <ChatPanel />
      </div>
      <div className="w-2/3">
        <VideoPanel />
      </div>
    </div>
  );
}
