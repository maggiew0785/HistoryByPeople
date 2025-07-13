import React from 'react';
import ReactMarkdown from 'react-markdown';

// Enhanced Generate Videos Button Component
function GenerateVideosButton({ message, chatState, onGenerateVideos, isLastAiMessage }) {
  // Handle both new and legacy chatState structure
  const state = chatState.chatState || chatState;
  const { 
    scenes, 
    isGenerating = chatState.isGeneratingVisuals, 
    progress = chatState.visualProgress, 
    generatedVideos,
    error = chatState.visualError,
    completedScenes = []
  } = state;

  // Check if this message contains scenes OR if we have scenes in global state
  const messageHasScenes = message.text.includes('**Scene') || 
                          message.text.includes('Scene ') ||
                          message.text.includes('GENERATE_VISUALS:');
  
  const sceneCount = scenes?.scenes?.length || 0;
  const hasValidScenes = sceneCount > 0;
  const personaName = scenes?.personaName || 'Unknown Character';
  
  // NEW LOGIC: Show button only on the last AI message when we have valid scenes
  // This ensures the button appears in the right place and doesn't duplicate
  const shouldShowButton = hasValidScenes && !generatedVideos && !isGenerating && isLastAiMessage;
  
  // Debug logging (simplified)
  if (hasValidScenes && isLastAiMessage) {
    console.log('🎬 Generate button available:', {
      sceneCount,
      personaName,
      shouldShowButton
    });
  }

  const handleButtonClick = () => {
    console.log('🎬 Generating visual story for:', personaName);
    if (onGenerateVideos && typeof onGenerateVideos === 'function') {
      onGenerateVideos();
    } else {
      console.error('❌ onGenerateVideos function not available');
    }
  };

  // Don't show anything if no scenes are available
  if (!hasValidScenes) {
    return null;
  }

  return (
    <div className="mt-4">

      {/* Generation in Progress - Only show on the last AI message */}
      {isGenerating && isLastAiMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="font-medium text-blue-800">Generating Visual Story...</span>
          </div>
          
          {progress && (
            <div className="text-sm text-blue-700">
              <div>Phase: {progress.phase || progress.type}</div>
              <div>Message: {progress.message}</div>
              {progress.elapsed && (
                <div>Elapsed: {Math.round(progress.elapsed / 1000)}s</div>
              )}
            </div>
          )}
          
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((completedScenes?.length || 0) / sceneCount) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {completedScenes?.length || 0} of {sceneCount} scenes completed
          </div>
        </div>
      )}

      {/* Success State - Only show on the last AI message */}
      {generatedVideos && isLastAiMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-700">
            <span className="text-lg mr-2">✅</span>
            <span className="font-medium">Visual Story Generated!</span>
          </div>
          <div className="text-sm text-green-600 mt-1">
            Generated {generatedVideos.totalScenes || sceneCount} scenes for {personaName}. 
            Check the Visual Stories panel →
          </div>
        </div>
      )}

      {/* Error State - Only show on the last AI message */}
      {error && !isGenerating && isLastAiMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-700 mb-2">
            <span className="text-lg mr-2">❌</span>
            <span className="font-medium">Generation Failed</span>
          </div>
          <div className="text-sm text-red-600 mb-3">{error}</div>
          <button
            onClick={handleButtonClick}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Retry Generation
          </button>
        </div>
      )}

      {/* Main Generate Button */}
      {shouldShowButton && !isGenerating && (
        <button
          onClick={handleButtonClick}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 flex items-center justify-center"
        >
          <span className="text-lg mr-2">🎬</span>
          <div className="text-left">
            <div className="font-semibold">Generate Visual Story</div>
            <div className="text-sm opacity-90">
              Ready to create {sceneCount} scenes for {personaName}
            </div>
          </div>
        </button>
      )}
    </div>
  );
}

export default function ChatMessage({ message, chatState, onGenerateVideos, isLastAiMessage }) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        <div className="text-sm break-words">
          {isUser ? (
            // For user messages, just show plain text
            <div className="whitespace-pre-wrap">{message.text}</div>
          ) : (
            // For AI messages, render basic markdown
            <ReactMarkdown
              components={{
                p: ({ children }) => <div className="mb-1">{children}</div>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
              }}
            >
              {message.text}
            </ReactMarkdown>
          )}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>
        
        {/* Generate Videos Button - Show for AI messages with scenes */}
        {!isUser && !message.isStreaming && chatState && (
          <GenerateVideosButton 
            message={message} 
            chatState={chatState} 
            onGenerateVideos={onGenerateVideos}
            isLastAiMessage={isLastAiMessage}
          />
        )}
        
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {(() => {
            const timestamp = typeof message.timestamp === 'string' 
              ? new Date(message.timestamp) 
              : message.timestamp;
            return timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          })()}
        </div>
      </div>
    </div>
  );
}
