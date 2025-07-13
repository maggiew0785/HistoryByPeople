import React from 'react';
import ReactMarkdown from 'react-markdown';

// Enhanced Generate Videos Button Component
function GenerateVideosButton({ message, chatState, onGenerateVideos }) {
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

  // Check if this message contains scenes and should show the button
  const messageHasScenes = message.text.includes('**Scene 1:') || 
                          message.text.includes('Scene 1:') ||
                          message.text.includes('GENERATE_VISUALS:');
  
  const sceneCount = scenes?.scenes?.length || 0;
  const hasValidScenes = sceneCount > 0;
  const personaName = scenes?.personaName || 'Unknown Character';
  
  // Debug logging
  console.log('🔍 GenerateVideosButton Debug:', {
    messageHasScenes,
    sceneCount,
    hasValidScenes,
    isGenerating,
    generatedVideos: !!generatedVideos,
    onGenerateVideos: typeof onGenerateVideos,
    personaName
  });

  const shouldShowButton = messageHasScenes && hasValidScenes && !generatedVideos;

  const handleButtonClick = () => {
    console.log('🎬 Button clicked! Calling onGenerateVideos');
    if (onGenerateVideos && typeof onGenerateVideos === 'function') {
      onGenerateVideos();
    } else {
      console.error('❌ onGenerateVideos is not available:', onGenerateVideos);
    }
  };

  if (!messageHasScenes) {
    return null;
  }

  return (
    <div className="mt-4">
      {/* Debug Info */}
      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center text-yellow-700 mb-2">
          <span className="text-lg mr-2">⚠️</span>
          <span className="font-medium">DEBUG: Scenes Detected!</span>
        </div>
        <div className="text-sm text-yellow-600">
          <p>Message contains scene markers: {messageHasScenes ? 'Yes' : 'No'}</p>
          <p>Scenes in state: <strong>{sceneCount} scenes</strong></p>
          <p>Persona: <strong>{personaName}</strong></p>
          <p>Generated videos: {generatedVideos ? 'Yes' : 'No'}</p>
          <p>Is generating: {isGenerating ? 'Yes' : 'No'}</p>
          <p>Should show button: {shouldShowButton ? 'Yes' : 'No'}</p>
          <p>onGenerateVideos function: {typeof onGenerateVideos}</p>
        </div>
      </div>

      {/* Generation in Progress */}
      {isGenerating && (
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

      {/* Success State */}
      {generatedVideos && (
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

      {/* Error State */}
      {error && !isGenerating && (
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

  // Show success state if videos already generated for this persona
  if (generatedVideos && generatedVideos.personaName === scenes.personaName) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center text-green-700 mb-2">
          <span className="text-xl mr-2">✅</span>
          <span className="font-medium">Videos Generated Successfully!</span>
        </div>
        <div className="text-sm text-green-600">
          <p>Generated {generatedVideos.totalScenes} scenes for <strong>{generatedVideos.personaName}</strong></p>
          <p className="mt-1">Check the Visual Stories panel to view your videos →</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !isGenerating) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-700 mb-2">
          <span className="text-xl mr-2">❌</span>
          <span className="font-medium">Generation Failed</span>
        </div>
        <div className="text-sm text-red-600 mb-3">
          {error}
        </div>
        <button
          onClick={generateVisuals}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <span>🔄</span>
          Retry Generation
        </button>
      </div>
    );
  }

  // Show generation in progress
  if (isGenerating) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center text-blue-700 mb-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="font-medium">Generating Videos...</span>
        </div>
        
        {progress && (
          <div className="space-y-2">
            <div className="text-sm text-blue-600">
              {progress.message || 'Processing scenes...'}
            </div>
            
            {/* Progress bar */}
            {progress.currentScene && progress.totalScenes && (
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(progress.currentScene / progress.totalScenes) * 100}%` 
                  }}
                ></div>
              </div>
            )}
            
            {/* Scene completion status */}
            {completedScenes.length > 0 && (
              <div className="text-xs text-blue-600">
                <div className="font-medium mb-1">
                  Completed: {completedScenes.length} / {scenes.scenes.length} scenes
                </div>
                <div className="space-y-1">
                  {completedScenes.map(scene => (
                    <div key={scene.sceneNumber} className="flex items-center text-green-600">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Scene {scene.sceneNumber}: {scene.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Show the main generate button
  return (
    <div className="mt-4">
      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center text-gray-700 mb-2">
          <span className="text-lg mr-2">🎬</span>
          <span className="font-medium">Ready to Generate Visual Story</span>
        </div>
        <div className="text-sm text-gray-600">
          <p>Detected <strong>{scenes.scenes.length} scenes</strong> for <strong>{scenes.personaName}</strong></p>
          <p className="mt-1">Click below to create videos for each scene using AI</p>
        </div>
      </div>
      
      <button
        onClick={generateVisuals}
        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
      >
        <span className="text-xl">🎥</span>
        <div className="text-left">
          <div>Generate Videos</div>
          <div className="text-xs opacity-90">{scenes.scenes.length} scenes • ~{scenes.scenes.length * 30} seconds</div>
        </div>
      </button>
    </div>
  );
}

export default function ChatMessage({ message, chatState, onGenerateVideos }) {
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
          />
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
