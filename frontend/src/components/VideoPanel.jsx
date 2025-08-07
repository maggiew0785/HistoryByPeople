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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioCache, setAudioCache] = useState(new Map()); // In-memory cache
  const { personaName, scenes } = personaData;
  
  // Ensure currentScene is within bounds
  const safeCurrentScene = Math.min(Math.max(0, currentScene), scenes.length - 1);
  const scene = scenes[safeCurrentScene];

  // Reset video error for current scene when scene changes
  useEffect(() => {
    if (videoErrors[safeCurrentScene]) {
      setVideoErrors(prev => ({ ...prev, [safeCurrentScene]: false }));
    }
    // Stop any ongoing speech when scene changes
    if (isSpeaking) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [safeCurrentScene]);

  // Audio caching utilities
  const generateCacheKey = (text, personaName) => {
    // Create a hash-like key from text and persona name
    const combined = `${text}-${personaName}`;
    
    // Use a simple hash function that works with Unicode characters
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive hex string
    const hashStr = Math.abs(hash).toString(16);
    
    // Pad with zeros and limit to 32 characters
    return hashStr.padStart(8, '0').substring(0, 32);
  };

  const getCachedAudio = async (cacheKey) => {
    // Check in-memory cache first
    if (audioCache.has(cacheKey)) {
      console.log('Found audio in memory cache');
      return audioCache.get(cacheKey);
    }

    // Check localStorage cache
    try {
      const cachedData = localStorage.getItem(`tts_cache_${cacheKey}`);
      if (cachedData) {
        console.log('Found audio in localStorage cache');
        const audioBlob = new Blob([new Uint8Array(JSON.parse(cachedData))], { type: 'audio/wav' });
        // Store in memory cache for faster access
        audioCache.set(cacheKey, audioBlob);
        return audioBlob;
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }

    return null;
  };

  const setCachedAudio = async (cacheKey, audioBlob) => {
    // Store in memory cache
    audioCache.set(cacheKey, audioBlob);

    // Store in localStorage cache
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      localStorage.setItem(`tts_cache_${cacheKey}`, JSON.stringify(Array.from(uint8Array)));
      console.log('Audio cached successfully');
    } catch (error) {
      console.error('Error storing in cache:', error);
    }
  };

  // Cleanup old cache entries (keep only last 50 entries)
  const cleanupCache = () => {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('tts_cache_'));
      if (cacheKeys.length > 50) {
        // Remove oldest entries
        cacheKeys.slice(0, cacheKeys.length - 50).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  };

  // OpenAI TTS functions with caching
  const speakTextWithOpenAI = async (text) => {
    try {
      console.log('Starting TTS generation for:', personaName);
      setIsGeneratingAudio(true);
      
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }

      // Generate cache key
      const cacheKey = generateCacheKey(text, personaName);
      console.log('Cache key:', cacheKey);

      // Check if audio is already cached
      let audioBlob = await getCachedAudio(cacheKey);

      if (!audioBlob) {
        console.log('Audio not cached, generating new audio...');
        
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: text,
            personaName: personaName 
          }),
        });

        console.log('TTS Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('TTS Response error:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        audioBlob = await response.blob();
        console.log('Audio blob size:', audioBlob.size, 'bytes');
        
        if (audioBlob.size === 0) {
          throw new Error('Received empty audio file');
        }

        // Cache the audio for future use
        await setCachedAudio(cacheKey, audioBlob);
        cleanupCache();
      } else {
        console.log('Using cached audio, size:', audioBlob.size, 'bytes');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      setIsSpeaking(true);
      setIsGeneratingAudio(false);

      // Set up event listeners
      audio.onended = () => {
        console.log('Audio playback ended');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsSpeaking(false);
        setIsGeneratingAudio(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      console.log('Starting audio playback...');
      // Play the audio
      await audio.play();
      console.log('Audio playback started successfully');

    } catch (error) {
      console.error('TTS Error details:', error);
      setIsGeneratingAudio(false);
      setIsSpeaking(false);
      alert(`Failed to generate speech: ${error.message}`);
    }
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    // Fallback for browser speech synthesis
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleSpeech = async (text) => {
    if (isSpeaking || isGeneratingAudio) {
      stopSpeaking();
    } else {
      speakTextWithOpenAI(text);
    }
  };

  // Check if audio is cached for this text
  const isAudioCached = (text) => {
    const cacheKey = generateCacheKey(text, personaName);
    return audioCache.has(cacheKey) || localStorage.getItem(`tts_cache_${cacheKey}`) !== null;
  };

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
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">Scene Context</h4>
                  <button
                    onClick={() => toggleSpeech(scene.context)}
                    disabled={isGeneratingAudio}
                    className={`p-1 rounded-full transition-colors ${
                      isSpeaking 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : isGeneratingAudio
                        ? 'bg-yellow-100 text-yellow-600'
                        : isAudioCached(scene.context)
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                    title={
                      isGeneratingAudio 
                        ? 'Generating audio...' 
                        : isSpeaking 
                        ? 'Stop reading' 
                        : isAudioCached(scene.context)
                        ? 'Play cached audio'
                        : 'Generate and play audio'
                    }
                    aria-label={
                      isGeneratingAudio 
                        ? 'Generating audio' 
                        : isSpeaking 
                        ? 'Stop reading context' 
                        : isAudioCached(scene.context)
                        ? 'Play cached audio'
                        : 'Generate and play audio'
                    }
                  >
                    {isGeneratingAudio ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : isSpeaking ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <div className="relative">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12h.01M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {isAudioCached(scene.context) && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-700">{scene.context}</p>
                {(isSpeaking || isGeneratingAudio) && (
                  <div className="mt-2 flex items-center text-xs text-blue-600">
                    <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full mr-1"></div>
                    {isGeneratingAudio ? 'Generating audio...' : 'Playing audio...'}
                    {isAudioCached(scene.context) && !isGeneratingAudio && (
                      <span className="ml-1 text-green-600">(cached)</span>
                    )}
                  </div>
                )}
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