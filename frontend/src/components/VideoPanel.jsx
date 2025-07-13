import React, { useState, useEffect } from 'react';

// Single Persona Video Display Component
function PersonaVideoDisplay({ personaData }) {
  // Safety check for personaData
  if (!personaData || !personaData.scenes || personaData.scenes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="text-lg font-medium mb-2">No persona data available</h3>
          <p className="text-sm">Unable to load persona information.</p>
        </div>
      </div>
    );
  }

  const [currentScene, setCurrentScene] = useState(0);
  const [videoErrors, setVideoErrors] = useState({}); // Track video errors by scene index
  const { personaName, scenes } = personaData;
  
  // Ensure currentScene is within bounds
  const safeCurrentScene = Math.min(Math.max(0, currentScene), scenes.length - 1);
  const scene = scenes[safeCurrentScene];

  // Reset video error for current scene when scene changes
  useEffect(() => {
    if (videoErrors[safeCurrentScene]) {
      setVideoErrors(prev => ({ ...prev, [safeCurrentScene]: false }));
    }
  }, [safeCurrentScene]);

  const handleVideoError = (sceneIndex) => {
    setVideoErrors(prev => ({ ...prev, [sceneIndex]: true }));
  };

  const hasVideoError = videoErrors[safeCurrentScene];

  // Safety check for scene
  if (!scene) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Scene not found</h3>
          <p className="text-sm">The requested scene could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Scene Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2 mb-3 flex-wrap">
          {scenes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentScene(index)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                safeCurrentScene === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label={`Go to scene ${index + 1}`}
            >
              Scene {index + 1}
            </button>
          ))}
        </div>
        
        {/* Scene Navigation Arrows */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentScene(Math.max(0, safeCurrentScene - 1))}
            disabled={safeCurrentScene === 0}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            aria-label="Previous scene"
          >
            ← Previous
          </button>
          
          <span className="text-sm text-gray-600">
            {safeCurrentScene + 1} of {scenes.length}
          </span>
          
          <button
            onClick={() => setCurrentScene(Math.min(scenes.length - 1, safeCurrentScene + 1))}
            disabled={safeCurrentScene === scenes.length - 1}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            aria-label="Next scene"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Current Scene Display */}
      <div className="p-4">
        {scene.status === 'complete' ? (
          <div>
            <h3 className="text-lg font-medium mb-3">{scene.title || 'Untitled Scene'}</h3>
            
            {/* Video Player - only show if videoUrl exists and no error */}
            {scene.videoUrl && !hasVideoError && (
              <div className="mb-4">
                <video
                  src={scene.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-lg shadow-lg"
                  style={{ maxHeight: '400px' }}
                  onError={() => handleVideoError(safeCurrentScene)}
                  aria-label={`Video for ${scene.title || 'scene'}`}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            
            {/* Fallback to Image if Video Failed or doesn't exist */}
            {(!scene.videoUrl || hasVideoError) && scene.imageUrl && (
              <div className="mb-4">
                <img
                  src={scene.imageUrl}
                  alt={scene.title || 'Scene image'}
                  className="w-full rounded-lg shadow-lg"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
                <p className="text-sm text-yellow-600 mt-2">
                  ⚠️ {hasVideoError ? 'Video failed to load' : 'Video generation failed'}, showing image only
                </p>
              </div>
            )}
            
            {/* No media available */}
            {(!scene.videoUrl || hasVideoError) && !scene.imageUrl && (
              <div className="mb-4 p-8 bg-gray-100 rounded-lg text-center">
                <div className="text-gray-400 text-4xl mb-2">🎬</div>
                <p className="text-gray-600">No media available for this scene</p>
              </div>
            )}
            
            {/* Scene Context */}
            {scene.context && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Scene Context</h4>
                <p className="text-sm text-gray-700">{scene.context}</p>
              </div>
            )}
            
            {/* Technical Details (Collapsible) */}
            <details className="mt-3">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                View generation details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600">
                {scene.visualPrompt && (
                  <p><strong>Visual Prompt:</strong> {scene.visualPrompt}</p>
                )}
                {scene.imageUrl && (
                  <p className="mt-1 break-all"><strong>Image URL:</strong> {scene.imageUrl}</p>
                )}
                {scene.videoUrl && (
                  <p className="mt-1 break-all"><strong>Video URL:</strong> {scene.videoUrl}</p>
                )}
                {hasVideoError && (
                  <p className="mt-1 text-red-600"><strong>Video Error:</strong> Failed to load video</p>
                )}
              </div>
            </details>
          </div>
        ) : scene.status === 'failed' ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-red-700 mb-2">{scene.title || 'Scene Generation Failed'}</h3>
            <p className="text-red-600">Generation failed: {scene.error || 'Unknown error'}</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">{scene.title || 'Generating Scene'}</h3>
            <p className="text-gray-600">Generating...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Tabbed VideoPanel Component
export default function VideoPanel({ allGeneratedPersonas, currentGeneratedVideos }) {
  const [activeTab, setActiveTab] = useState(0);

  // Combine current generation with all personas, avoiding duplicates
  const allPersonas = [...(allGeneratedPersonas || [])];
  
  // Add current generation if it exists and isn't already in the list
  if (currentGeneratedVideos && 
      currentGeneratedVideos.personaName && 
      !allPersonas.find(p => p.personaName === currentGeneratedVideos.personaName && 
                              JSON.stringify(p.scenes) === JSON.stringify(currentGeneratedVideos.scenes))) {
    allPersonas.push(currentGeneratedVideos);
  }

  // Set active tab to most recent if current tab is out of bounds
  useEffect(() => {
    if (allPersonas.length > 0 && activeTab >= allPersonas.length) {
      setActiveTab(allPersonas.length - 1);
    }
  }, [allPersonas, activeTab]);

  if (allPersonas.length === 0) {
    return (
      <div className="h-full bg-white flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Visual Stories</h2>
        </div>
        <div className="flex-1 p-4 overflow-y-auto chat-scroll">
          <div className="text-center text-gray-600 mt-8">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-medium mb-2">No visual stories yet</h3>
            <p className="text-sm">
              Generate videos from your historical conversations to see them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure activeTab is within bounds
  const safeActiveTab = Math.min(Math.max(0, activeTab), allPersonas.length - 1);
  const activePersona = allPersonas[safeActiveTab];

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Header with Tabs */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <div className="p-4 pb-0">
          <h2 className="text-lg font-semibold mb-3">Visual Stories</h2>
        </div>
        
        {/* Persona Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {allPersonas.map((persona, index) => (
            <button
              key={`${persona.personaName}-${index}`}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                safeActiveTab === index
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              aria-label={`View ${persona.personaName} stories`}
            >
              {persona.personaName || 'Unnamed Persona'}
              <span className="ml-1 text-xs text-gray-500">
                ({(persona.scenes || []).length} scenes)
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Active Persona Content */}
      <div className="flex-1 min-h-0">
        {activePersona ? (
          <PersonaVideoDisplay personaData={activePersona} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium mb-2">No persona selected</h3>
              <p className="text-sm">Unable to load persona data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}