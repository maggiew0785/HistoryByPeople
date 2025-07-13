import React from 'react';
import ReactMarkdown from 'react-markdown';

// Generate Videos Button Component
function GenerateVideosButton({ message, chatState }) {
  const { 
    scenes, 
    isGeneratingVisuals, 
    visualProgress, 
    generateVisuals, 
    generatedVideos,
    visualError 
  } = chatState;

  // Check if this message contains scenes and should show the button
  const messageHasScenes = message.text.includes('**Scene 1:') || 
                          message.text.includes('Scene 1:') ||
                          message.text.includes('GENERATE_VISUALS:');
  const hasValidScenes = scenes && scenes.scenes && scenes.scenes.length > 0;
  
  // Don't show button if no scenes detected or already generated for this persona
  if (!messageHasScenes || !hasValidScenes) {
    return null;
  }

  // Don't show if already generated videos for this persona
  if (generatedVideos && generatedVideos.personaName === scenes.personaName) {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center text-green-700">
          <span className="text-lg mr-2">✅</span>
          <span className="text-sm font-medium">
            Videos generated for {generatedVideos.personaName}! 
            Check the Visual Stories panel →
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {!isGeneratingVisuals ? (
        <button
          onClick={generateVisuals}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <span>🎬</span>
          Generate Videos ({scenes.scenes.length} scenes)
        </button>
      ) : (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-blue-700 mb-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-sm font-medium">Generating videos...</span>
          </div>
          
          {visualProgress && (
            <div className="text-xs text-blue-600">
              {visualProgress.message || 'Processing scenes...'}
              {visualProgress.completedScenes && (
                <div className="mt-1">
                  Completed: {visualProgress.completedScenes.length} / {scenes.scenes.length} scenes
                </div>
              )}
            </div>
          )}
          
          {visualError && (
            <div className="mt-2 text-xs text-red-600">
              Error: {visualError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatMessage({ message, chatState }) {
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
          <GenerateVideosButton message={message} chatState={chatState} />
        )}
        
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}
