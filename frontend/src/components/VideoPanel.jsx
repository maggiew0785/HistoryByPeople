import React, { useState } from 'react';

// Single Persona Video Display Component
function PersonaVideoDisplay({ personaData }) {
  const [currentScene, setCurrentScene] = useState(0);
  const { personaName, scenes } = personaData;
  const scene = scenes[currentScene];

  return (
    <div className="h-full overflow-y-auto">
      {/* Scene Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2 mb-3">
          {scenes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentScene(index)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                currentScene === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Scene {index + 1}
            </button>
          ))}
        </div>
        
        {/* Scene Navigation Arrows */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentScene(Math.max(0, currentScene - 1))}
            disabled={currentScene === 0}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            ← Previous
          </button>
          
          <span className="text-sm text-gray-600">
            {currentScene + 1} of {scenes.length}
          </span>
          
          <button
            onClick={() => setCurrentScene(Math.min(scenes.length - 1, currentScene + 1))}
            disabled={currentScene === scenes.length - 1}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Current Scene Display */}
      <div className="p-4">
        {scene.status === 'complete' ? (
          <div>
            <h3 className="text-lg font-medium mb-3">{scene.title}</h3>
            
            {/* Video Player */}
            {scene.videoUrl && (
              <div className="mb-4">
                <video
                  src={scene.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-lg shadow-lg"
                  style={{ maxHeight: '400px' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            
            {/* Fallback to Image if Video Failed */}
            {!scene.videoUrl && scene.imageUrl && (
              <div className="mb-4">
                <img
                  src={scene.imageUrl}
                  alt={scene.title}
                  className="w-full rounded-lg shadow-lg"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
                <p className="text-sm text-yellow-600 mt-2">
                  ⚠️ Video generation failed, showing image only
                </p>
              </div>
            )}
            
            {/* Scene Context */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-1">Scene Context</h4>
              <p className="text-sm text-gray-700">{scene.context}</p>
            </div>
            
            {/* Technical Details (Collapsible) */}
            <details className="mt-3">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                View generation details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600">
                <p><strong>Visual Prompt:</strong> {scene.visualPrompt}</p>
                {scene.imageUrl && (
                  <p className="mt-1 break-all"><strong>Image URL:</strong> {scene.imageUrl}</p>
                )}
                {scene.videoUrl && (
                  <p className="mt-1 break-all"><strong>Video URL:</strong> {scene.videoUrl}</p>
                )}
              </div>
            </details>
          </div>
        ) : scene.status === 'failed' ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-red-700 mb-2">{scene.title}</h3>
            <p className="text-red-600">Generation failed: {scene.error}</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">{scene.title}</h3>
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

  // Combine current generation with all personas
  const allPersonas = [...(allGeneratedPersonas || [])];
  if (currentGeneratedVideos && !allPersonas.find(p => p.personaName === currentGeneratedVideos.personaName)) {
    allPersonas.push(currentGeneratedVideos);
  }

  // Set active tab to most recent if not set
  React.useEffect(() => {
    if (allPersonas.length > 0 && activeTab >= allPersonas.length) {
      setActiveTab(allPersonas.length - 1);
    }
  }, [allPersonas.length, activeTab]);

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

  const activePersona = allPersonas[activeTab];

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Header with Tabs */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <div className="p-4 pb-0">
          <h2 className="text-lg font-semibold mb-3">Visual Stories</h2>
        </div>
        
        {/* Persona Tabs */}
        <div className="flex border-b border-gray-200">
          {allPersonas.map((persona, index) => (
            <button
              key={persona.personaName + index}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === index
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {persona.personaName}
              <span className="ml-1 text-xs text-gray-500">
                ({persona.scenes.length} scenes)
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Active Persona Content */}
      <div className="flex-1 min-h-0">
        <PersonaVideoDisplay personaData={activePersona} />
      </div>
    </div>
  );
}
