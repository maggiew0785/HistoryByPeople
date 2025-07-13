import React, { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import VideoPanel from './components/VideoPanel';
import ConversationHistory from './components/ConversationHistory';
import SessionRestoreModal from './components/SessionRestoreModal';
import SettingsModal from './components/SettingsModal';
import ErrorBoundary from './components/ErrorBoundary';
import useChat from './hooks/useChat';
import storageManager from './services/storageManager';

export default function App() {
  const [chatWidth, setChatWidth] = useState(33); // percentage
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [lastConversation, setLastConversation] = useState(null);
  const [conversationRefresh, setConversationRefresh] = useState(0);
  
  // Callback to trigger conversation history refresh
  const handleConversationsChange = useCallback(() => {
    setConversationRefresh(prev => prev + 1);
  }, []);
  
  // Use the chat hook to manage all state
  const chatState = useChat(handleConversationsChange);

  // Check for session restoration on app load
  useEffect(() => {
    const settings = storageManager.getSettings();
    if (settings.autoRestore !== false) {
      const lastSession = chatState.restoreLastSession();
      if (lastSession) {
        setLastConversation(lastSession);
        setShowRestoreModal(true);
      }
    }
  }, [chatState.restoreLastSession]);

  // Handle conversation selection from history
  const handleSelectConversation = (conversationId) => {
    const success = chatState.loadConversation(conversationId);
    if (!success) {
      console.error('Failed to load conversation:', conversationId);
    }
  };

  // Handle new conversation
  const handleNewConversation = () => {
    chatState.startNewConversation();
    setShowRestoreModal(false);
  };

  // Handle conversation deletion
  const handleDeleteConversation = (conversationId) => {
    // If deleting current conversation, start a new one
    if (conversationId === chatState.currentConversationId) {
      chatState.startNewConversation();
    }
    
    // Trigger conversation history refresh
    handleConversationsChange();
  };

  // Session restore handlers
  const handleRestoreSession = () => {
    if (lastConversation) {
      chatState.loadConversation(lastConversation.id);
    }
    setShowRestoreModal(false);
  };

  const handleStartNewSession = () => {
    chatState.startNewConversation();
    setShowRestoreModal(false);
  };

  const handleDismissRestore = () => {
    setShowRestoreModal(false);
  };

  // Handle persona deletion
  const handleDeletePersona = (personaData) => {
    // The VideoPanel component handles localStorage deletion
    // We might need to refresh the chat state here if needed
    console.log('Persona deleted:', personaData.personaName || personaData.name);
    
    // Trigger any necessary UI refreshes
    handleConversationsChange();
  };

  // Handle scene regeneration
  const handleRegenerateScene = (personaData, scene, sceneIndex) => {
    // This would trigger a regeneration workflow
    // For now, just log - implement full regeneration logic as needed
    console.log('Regenerate scene requested:', personaData.personaName, scene.title);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidth;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      // Adjust calculation based on whether history is collapsed
      const historyWidth = historyCollapsed ? 3 : 20; // 48px collapsed, ~320px expanded
      const minChatWidth = 25;
      const maxChatWidth = 70;
      
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, minChatWidth), maxChatWidth);
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
    <ErrorBoundary>
      <div className="h-screen flex flex-col overflow-hidden">
        <div 
          className="flex items-center justify-center p-4 text-white flex-shrink-0 relative"
          style={{
            backgroundImage: 'url(/bookshelf-header.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            fontFamily: '"Times New Roman", Times, serif'
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/60"></div>
          
          {/* Content */}
          <div className="relative z-10 bg-black/80 px-6 py-3 rounded">
            <h1 className="text-3xl font-bold text-white text-center" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              Walk a mile in their shoes. History by people.
            </h1>
          </div>
          
          {/* Settings button positioned absolutely in top right */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-black/20 rounded-lg transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex min-h-0">
          {/* Conversation History Sidebar */}
          <ConversationHistory
            currentConversationId={chatState.currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            isCollapsed={historyCollapsed}
            onToggleCollapse={() => setHistoryCollapsed(!historyCollapsed)}
            refreshTrigger={conversationRefresh}
          />
          
          {/* Chat Panel */}
          <div style={{ width: `${chatWidth}%` }} className="border-r border-gray-200 h-full">
            <ErrorBoundary>
              <ChatPanel 
                chatState={chatState} 
                onGenerateVideos={chatState.generateVisuals}
              />
            </ErrorBoundary>
          </div>
          
          {/* Resize Handle */}
          <div 
            className="w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex items-center justify-center"
            onMouseDown={handleMouseDown}
          >
            <div className="w-1 h-8 bg-gray-400 rounded"></div>
          </div>
          
          {/* Video Panel */}
          <div style={{ width: `${100 - chatWidth - (historyCollapsed ? 3 : 20) - 1}%` }} className="h-full">
            <ErrorBoundary>
              <VideoPanel 
                allGeneratedPersonas={chatState.allGeneratedPersonas}
                currentGeneratedVideos={chatState.chatState?.generatedVideos || chatState.generatedVideos}
                currentConversationId={chatState.currentConversationId}
                isGenerating={chatState.chatState?.isGenerating || chatState.isGeneratingVisuals}
                progress={chatState.chatState?.progress || chatState.visualProgress}
                onDeletePersona={handleDeletePersona}
                onRegenerateScene={handleRegenerateScene}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Session Restore Modal */}
      {showRestoreModal && (
        <SessionRestoreModal
          lastConversation={lastConversation}
          onRestore={handleRestoreSession}
          onStartNew={handleStartNewSession}
          onDismiss={handleDismissRestore}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </ErrorBoundary>
  );
}