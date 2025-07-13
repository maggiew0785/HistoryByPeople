import React, { useState } from 'react';
import storageManager from '../services/storageManager';

// Single Persona Video Display Component
function PersonaVideoDisplay({ personaData, onDeletePersona, onRegenerateScene }) {
  const [currentScene, setCurrentScene] = useState(0);
  const { personaName, scenes } = personaData;
  const scene = scenes[currentScene];

  const isVideoExpired = (scene) => {
    return scene.videoUrl && !storageManager.isVideoValid(scene);
  };

  const handleDeletePersona = () => {
    if (window.confirm(`Delete ${personaName} and all their scenes?`)) {
      onDeletePersona?.(personaData);
    }
  };

  const handleRegenerateScene = () => {
    onRegenerateScene?.(personaData, scene, currentScene);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Scene Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2 mb-3 flex-wrap">
          {scenes.map((sceneItem, index) => (
            <button
              key={index}
              onClick={() => setCurrentScene(index)}
              className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                currentScene === index
                  ? 'bg-blue-600 text-white'
                  : sceneItem.status === 'complete'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : sceneItem.status === 'failed'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : sceneItem.status === 'generating'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {/* Status icon */}
              {sceneItem.status === 'complete' ? '✅' : 
               sceneItem.status === 'failed' ? '❌' : 
               sceneItem.status === 'generating' ? '🔄' : '⏳'}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="text-green-500">✅</span>
                {scene.title}
              </h3>
              <div className="flex gap-2">
                {isVideoExpired(scene) && (
                  <button
                    onClick={handleRegenerateScene}
                    className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                    title="Video expired - regenerate"
                  >
                    Regenerate
                  </button>
                )}
                <button
                  onClick={handleDeletePersona}
                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  title="Delete persona"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {/* Video Player - Check for expiration */}
            {scene.videoUrl && !isVideoExpired(scene) ? (
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
            ) : scene.videoUrl && isVideoExpired(scene) ? (
              <div className="mb-4 p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <div className="text-4xl mb-2">🕐</div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Video Expired</h4>
                <p className="text-sm text-gray-600 mb-4">
                  This video URL has expired (24 hour limit). Click regenerate to create a new video.
                </p>
                <button
                  onClick={handleRegenerateScene}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Regenerate Video
                </button>
              </div>
            ) : null}
            
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
                  <p className="mt-1"><strong>Image URL:</strong> {scene.imageUrl}</p>
                )}
                {scene.videoUrl && (
                  <p className="mt-1"><strong>Video URL:</strong> {scene.videoUrl}</p>
                )}
                {scene.generatedAt && (
                  <p className="mt-1"><strong>Generated:</strong> {new Date(scene.generatedAt).toLocaleString()}</p>
                )}
              </div>
            </details>
          </div>
        ) : scene.status === 'failed' ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-red-700 mb-2">{scene.title}</h3>
            <p className="text-red-600 mb-4">Generation failed: {scene.error}</p>
            <button
              onClick={handleRegenerateScene}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry Generation
            </button>
          </div>
        ) : scene.status === 'generating' ? (
          <div className="text-center py-8">
            <div className="text-blue-500 text-4xl mb-4 animate-spin">🔄</div>
            <h3 className="text-lg font-medium text-blue-700 mb-2">{scene.title}</h3>
            <p className="text-blue-600">Currently generating image and video...</p>
            <div className="mt-4 w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">{scene.title}</h3>
            <p className="text-gray-600">Waiting in queue...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Tabbed VideoPanel Component
export default function VideoPanel({ 
  allGeneratedPersonas, 
  currentGeneratedVideos, 
  onDeletePersona,
  onRegenerateScene 
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Combine current generation with all personas and refresh from localStorage
  const allPersonas = React.useMemo(() => {
    // Get fresh data from localStorage for progressive updates
    const storedPersonas = storageManager.getPersonas();
    
    // Merge with passed props
    const combined = [...(allGeneratedPersonas || [])];
    
    // Add stored personas that aren't already in the list
    storedPersonas.forEach(storedPersona => {
      const existingIndex = combined.findIndex(p => 
        p.personaName === storedPersona.personaName || p.id === storedPersona.id
      );
      
      if (existingIndex >= 0) {
        // Update existing persona with latest data from storage
        combined[existingIndex] = {
          ...combined[existingIndex],
          ...storedPersona,
          // Merge scenes to get the latest status
          scenes: storedPersona.scenes || combined[existingIndex].scenes
        };
      } else {
        combined.push(storedPersona);
      }
    });
    
    // Add current generation if not already included
    if (currentGeneratedVideos && !combined.find(p => 
      p.personaName === currentGeneratedVideos.personaName || 
      p.id === currentGeneratedVideos.id
    )) {
      combined.push(currentGeneratedVideos);
    }
    
    return combined;
  }, [allGeneratedPersonas, currentGeneratedVideos, refreshKey]);

  // Auto-refresh every 2 seconds during generation to show progressive updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Check if any persona is currently generating
      const hasGenerating = allPersonas.some(p => 
        p.metadata?.status === 'generating' || 
        p.scenes?.some(s => s.status === 'pending' || s.status === 'generating')
      );
      
      if (hasGenerating) {
        setRefreshKey(prev => prev + 1);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [allPersonas]);

  // Set active tab to most recent if not set
  React.useEffect(() => {
    if (allPersonas.length > 0 && activeTab >= allPersonas.length) {
      setActiveTab(allPersonas.length - 1);
    }
  }, [allPersonas.length, activeTab]);

  const handleDeletePersona = (personaData) => {
    // Show confirmation dialog
    if (!window.confirm(`Delete ${personaData.personaName || personaData.name} and all their scenes? This action cannot be undone.`)) {
      return;
    }

    // Remove from localStorage if it has an ID
    if (personaData.id) {
      const success = storageManager.deletePersona(personaData.id);
      if (!success) {
        alert('Failed to delete persona. Please try again.');
        return;
      }
    }
    
    // Adjust active tab if necessary
    const currentPersonaIndex = allPersonas.findIndex(p => 
      (p.id && p.id === personaData.id) || 
      (p.personaName === personaData.personaName || p.name === personaData.name)
    );
    
    if (currentPersonaIndex >= 0) {
      if (activeTab === currentPersonaIndex) {
        // If deleting the active tab, switch to the previous tab or first tab
        setActiveTab(currentPersonaIndex > 0 ? currentPersonaIndex - 1 : 0);
      } else if (activeTab > currentPersonaIndex) {
        // If deleting a tab to the left of active tab, adjust active tab index
        setActiveTab(activeTab - 1);
      }
    }
    
    // Force refresh to update the UI
    setRefreshKey(prev => prev + 1);
    
    // Call parent handler
    onDeletePersona?.(personaData);
  };

  const handleRegenerateScene = (personaData, scene, sceneIndex) => {
    // Call parent handler for regeneration logic
    onRegenerateScene?.(personaData, scene, sceneIndex);
  };

  const activePersona = allPersonas[activeTab];

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
            <div
              key={persona.personaName + index}
              className={`group flex items-center border-b-2 transition-colors ${
                activeTab === index
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <button
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === index
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {persona.personaName}
                <span className="ml-1 text-xs text-gray-500">
                  ({persona.scenes.length} scenes)
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePersona(persona);
                }}
                className="p-1 mr-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title={`Delete ${persona.personaName}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Active Persona Content */}
      <div className="flex-1 min-h-0">
        <PersonaVideoDisplay 
          personaData={activePersona} 
          onDeletePersona={handleDeletePersona}
          onRegenerateScene={handleRegenerateScene}
        />
      </div>
    </div>
  );
}
