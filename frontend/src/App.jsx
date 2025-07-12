import React, { useState } from 'react';
import ChatPanel from './components/ChatPanel';
import VideoPanel from './components/VideoPanel';

export default function App() {
  const [chatWidth, setChatWidth] = useState(33); // percentage

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidth;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, 20), 60);
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <h1 className="text-2xl font-bold p-4 bg-blue-500 text-white flex-shrink-0">Walk a mile...</h1>
      <div className="flex-1 flex min-h-0">
        <div style={{ width: `${chatWidth}%` }} className="border-r border-gray-200 h-full">
          <ChatPanel />
        </div>
        <div 
          className="w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex items-center justify-center"
          onMouseDown={handleMouseDown}
        >
          <div className="w-1 h-8 bg-gray-400 rounded"></div>
        </div>
        <div style={{ width: `${100 - chatWidth - 1}%` }} className="h-full">
          <VideoPanel />
        </div>
      </div>
    </div>
  );
}