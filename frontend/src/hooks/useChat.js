import { useState, useCallback, useEffect } from 'react';
import { ChatAPI } from '../services/api';
import storageManager from '../services/storageManager';

export default function useChat(onConversationsChange) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Conversation management
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationPhase, setConversationPhase] = useState('clarification');
  
  // Enhanced visual generation state - button-triggered approach
  const [chatState, setChatState] = useState({
    scenes: null,              // Parsed scenes from AI response
    isGenerating: false,       // Loading state for generation
    generatedVideos: null,     // Results from generation
    error: null,              // Error handling
    progress: null,           // Real-time progress updates
    completedScenes: []       // Track completed scenes during generation
  });
  
  // Legacy state for backward compatibility
  const [allGeneratedPersonas, setAllGeneratedPersonas] = useState([]);

  // Auto-save conversation whenever messages change
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      const saveConversation = async () => {
        try {
          await storageManager.saveConversation(
            currentConversationId, 
            messages, 
            conversationPhase,
            { lastActivity: Date.now() }
          );
          
          // Trigger sidebar refresh
          if (onConversationsChange) {
            onConversationsChange();
          }
        } catch (error) {
          console.error('Error auto-saving conversation:', error);
        }
      };
      
      // Debounce saves to avoid too frequent localStorage writes
      const timeoutId = setTimeout(saveConversation, 500); // Reduced delay for better responsiveness
      return () => clearTimeout(timeoutId);
    }
  }, [currentConversationId, messages, conversationPhase, onConversationsChange]);

  // Load conversation from localStorage
  const loadConversation = useCallback((conversationId) => {
    try {
      const conversation = storageManager.getConversation(conversationId);
      if (conversation) {
        // Convert timestamp strings back to Date objects
        const messagesWithDateObjects = conversation.messages.map(message => ({
          ...message,
          timestamp: typeof message.timestamp === 'string' 
            ? new Date(message.timestamp) 
            : message.timestamp
        }));
        
        setMessages(messagesWithDateObjects);
        setCurrentConversationId(conversationId);
        setConversationPhase(conversation.currentPhase || 'clarification');
        
        // Load associated personas
        const personas = storageManager.getPersonasByConversation(conversationId);
        setAllGeneratedPersonas(personas.map(persona => ({
          personaName: persona.name,
          scenes: persona.scenes,
          totalScenes: persona.scenes.length,
          timestamp: new Date(persona.createdAt).toISOString()
        })));
        
        // Set as active conversation
        storageManager.setActiveConversation(conversationId);
        
        return true;
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
    return false;
  }, []);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    const newId = storageManager.generateId();
    setCurrentConversationId(newId);
    setMessages([]);
    setConversationPhase('clarification');
    setChatState({
      scenes: null,
      isGenerating: false,
      generatedVideos: null,
      error: null,
      progress: null,
      completedScenes: []
    });
    setAllGeneratedPersonas([]);
    setError(null);
    
    // Clear active conversation until first message
    storageManager.clearActiveConversation();
    
    return newId;
  }, []);

  // Auto-restore last conversation on app load
  const restoreLastSession = useCallback(() => {
    const activeConversationId = storageManager.getActiveConversationId();
    if (activeConversationId) {
      const conversation = storageManager.getConversation(activeConversationId);
      if (conversation && conversation.messages.length > 0) {
        return conversation;
      }
    }
    return null;
  }, []);

  // Enhanced scene detection (no auto-generation)
  const parseScenes = useCallback(async (responseText, userMessage = '') => {
    try {
      console.log('🔍 Parsing scenes from response...', responseText.substring(0, 200));
      
      // Check if user requested specific scenes
      const sceneRequestMatch = userMessage.match(/(?:show|generate|create|make)\s+(?:me\s+)?(?:only\s+)?scene\s*(\d+)/i);
      const specificSceneNumber = sceneRequestMatch ? parseInt(sceneRequestMatch[1]) : null;
      
      // Look for scene markers in the response
      if (responseText.includes('**Scene ') || 
          responseText.includes('Scene ') || 
          responseText.includes('GENERATE_VISUALS:')) {
        
        console.log('✅ Scene markers found in response');
        
        // Enhanced persona name extraction
        let personaName = 'Character';
        
        // Strategy 1: Look for GENERATE_VISUALS trigger first
        const generateMatch = responseText.match(/GENERATE_VISUALS:\s*([^\n\r]+)/i);
        if (generateMatch && generateMatch[1]) {
          personaName = generateMatch[1].trim();
        } else {
          // Strategy 2: Extract from conversation context
          personaName = extractPersonaFromContext(messages) || 'Character';
        }
        
        console.log('🎭 Extracted persona name:', personaName);
        
        // Parse all scenes from response
        const allScenes = parseSceneDetails(responseText);
        console.log('📝 All parsed scenes:', allScenes);
        
        // Filter to specific scene if requested
        let scenesToUse = allScenes;
        if (specificSceneNumber && allScenes.length > 0) {
          const requestedScene = allScenes.find(scene => scene.sceneNumber === specificSceneNumber);
          if (requestedScene) {
            scenesToUse = [requestedScene];
            console.log(`✅ Using only requested Scene ${specificSceneNumber}`);
          }
        }
        
        if (scenesToUse.length > 0) {
          console.log('✅ Scenes parsed successfully:', scenesToUse.length, 'scenes');
          setChatState(prev => ({
            ...prev,
            scenes: {
              scenes: scenesToUse,
              personaName: personaName,
              responseText: responseText
            },
            generatedVideos: null, // Clear previous results
            error: null,
            progress: null,
            completedScenes: []
          }));
          return true;
        } else {
          console.log('❌ No valid scenes found after filtering');
        }
      } else {
        console.log('❌ No scene markers found in response');
      }
      return false;
    } catch (error) {
      console.error('Scene parsing error:', error);
      setChatState(prev => ({
        ...prev,
        error: error.message
      }));
      return false;
    }
  }, [messages]);

  // Helper function to parse scene details from text
  const parseSceneDetails = useCallback((responseText) => {
    const scenes = [];
    
    // Enhanced regex to capture scene details
    const sceneRegex = /\*\*Scene (\d+): (.+?)\*\*\s*(?:Visual Prompt: (.+?)(?=\s*Context:|$))?(?:\s*Context: (.+?)(?=\*\*Scene|\n\n|$))?/gs;
    let match;
    
    while ((match = sceneRegex.exec(responseText)) !== null) {
      const sceneNumber = parseInt(match[1]);
      const title = match[2].trim();
      let visualPrompt = match[3]?.trim() || '';
      let context = match[4]?.trim() || '';
      
      // If no explicit visual prompt/context, extract from surrounding text
      if (!visualPrompt || !context) {
        const sceneStartIndex = match.index;
        const nextSceneMatch = responseText.match(/\*\*Scene \d+:/g);
        const nextSceneIndex = nextSceneMatch && nextSceneMatch.length > sceneNumber ? 
          responseText.indexOf(nextSceneMatch[sceneNumber], sceneStartIndex) : responseText.length;
        
        const sceneContent = responseText.substring(sceneStartIndex, nextSceneIndex);
        
        if (!visualPrompt) {
          const promptMatch = sceneContent.match(/Visual Prompt:\s*(.+?)(?=\s*Context:|$)/s);
          visualPrompt = promptMatch ? promptMatch[1].trim() : `Scene depicting ${title}`;
        }
        
        if (!context) {
          const contextMatch = sceneContent.match(/Context:\s*(.+?)(?=\*\*Scene|$)/s);
          context = contextMatch ? contextMatch[1].trim() : `This scene shows ${title}`;
        }
      }
      
      scenes.push({
        sceneNumber,
        title,
        visualPrompt: visualPrompt || `${title} - historical scene`,
        context: context || `This scene depicts ${title}`,
        status: 'pending'
      });
    }
    
    return scenes;
  }, []);

  // Helper function to extract persona name from conversation context
  const extractPersonaFromContext = useCallback((messages) => {
    // Look for previous persona mentions in the conversation
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender === 'ai' && msg.text.includes('GENERATE_VISUALS:')) {
        const match = msg.text.match(/GENERATE_VISUALS:\s*(.+?)(?:\n|$)/);
        if (match) return match[1].trim();
      }
      
      // Look for character names in user messages
      const characterMatch = msg.text.match(/(?:show|tell|about)\s+(.+?)(?:'s|story|scene)/i);
      if (characterMatch) return characterMatch[1].trim();
    }
    
    return null;
  }, []);

  // Button-triggered visual generation with progressive scene display
  const generateVisuals = useCallback(async () => {
    if (!chatState.scenes) return;

    setChatState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      progress: null,
      completedScenes: [],
      generatedVideos: null // Clear previous results for fresh start
    }));

    // Initialize persona in localStorage immediately
    const personaId = currentConversationId 
      ? `${currentConversationId}_${chatState.scenes.personaName}` 
      : storageManager.generateId();

    const initialPersonaData = {
      id: personaId,
      personaName: chatState.scenes.personaName,
      scenes: chatState.scenes.scenes.map(scene => ({
        ...scene,
        status: 'pending',
        imageUrl: null,
        videoUrl: null
      })),
      metadata: {
        generatedAt: Date.now(),
        totalScenes: chatState.scenes.scenes.length,
        status: 'generating'
      }
    };

    if (currentConversationId) {
      storageManager.savePersona(currentConversationId, initialPersonaData);
    }

    try {
      const response = await ChatAPI.generateVisualSequence(
        chatState.scenes.scenes, 
        chatState.scenes.personaName
      );
      
      // Stream the visual generation progress
      for await (const data of ChatAPI.streamVisualGeneration(response)) {
        if (data.type === 'error') {
          throw new Error(data.message || 'Visual generation failed');
        }
        
        if (data.type === 'status' || data.type === 'progress') {
          setChatState(prev => ({
            ...prev,
            progress: data
          }));
        }
        
        // Handle individual scene completion - update localStorage immediately
        if (data.type === 'scene_complete') {
          const completedScene = data.scene;
          
          console.log(`🎬 Scene ${completedScene.sceneNumber} completed:`, completedScene);
          
          // Update scene with proper timestamps
          const sceneWithTimestamp = {
            ...completedScene,
            generatedAt: Date.now(),
            createdAt: Date.now(),
            // Only set expiration if we have a video URL
            expiresAt: completedScene.videoUrl ? Date.now() + (24 * 60 * 60 * 1000) : null
          };

          // Update localStorage immediately for progressive display
          if (currentConversationId) {
            const updated = storageManager.updatePersonaScene(
              personaId, 
              completedScene.sceneNumber, 
              sceneWithTimestamp
            );
            console.log(`💾 Updated persona in localStorage:`, updated ? 'success' : 'failed');
          }

          // Update local state for UI
          setChatState(prev => ({
            ...prev,
            completedScenes: [...prev.completedScenes, sceneWithTimestamp],
            progress: {
              ...prev.progress,
              currentScene: prev.completedScenes.length + 1,
              message: `Scene ${completedScene.sceneNumber} completed`
            }
          }));

          console.log(`✅ Scene ${completedScene.sceneNumber} completed and saved to localStorage`);
        }
        
        if (data.type === 'complete') {
          const completedPersona = {
            id: personaId,
            conversationId: currentConversationId, // ADD: Include conversation context
            personaName: chatState.scenes.personaName,
            scenes: data.results.map(scene => ({
              ...scene,
              generatedAt: Date.now(),
              createdAt: Date.now(),
              expiresAt: scene.videoUrl ? Date.now() + (24 * 60 * 60 * 1000) : null
            })),
            totalScenes: data.results.length,
            timestamp: new Date().toISOString()
          };
          
          setChatState(prev => ({
            ...prev,
            generatedVideos: completedPersona,
            isGenerating: false,
            progress: {
              type: 'complete',
              message: `All ${data.results.length} scenes completed successfully!`
            }
          }));
          
          // Update legacy state for backward compatibility
          setAllGeneratedPersonas(prev => [...prev, completedPersona]);
          
          // Final save to localStorage with complete status
          if (currentConversationId) {
            const finalPersonaData = {
              ...completedPersona,
              metadata: {
                generatedAt: Date.now(),
                totalScenes: data.results.length,
                status: 'complete',
                completedAt: Date.now()
              }
            };
            storageManager.savePersona(currentConversationId, finalPersonaData);
          }

          console.log(`🎉 All scenes completed for ${chatState.scenes.personaName}`);
        }
      }
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        error: error.message,
        isGenerating: false,
        progress: null
      }));
      console.error('Visual generation error:', error);
    }
  }, [chatState.scenes]);

  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    // Initialize conversation if needed
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = storageManager.generateId();
      setCurrentConversationId(conversationId);
    }

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Immediately save conversation with user message to trigger sidebar update
    try {
      storageManager.saveConversation(
        conversationId,
        updatedMessages,
        conversationPhase,
        { lastActivity: Date.now() }
      );
      
      // Trigger sidebar refresh immediately
      if (onConversationsChange) {
        onConversationsChange();
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }

    setIsLoading(true);
    setError(null);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await ChatAPI.sendMessage(message, conversationHistory);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, aiMessage]);

      let streamedText = '';
      for await (const data of ChatAPI.streamResponse(response)) {
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (!data.done) {
          streamedText += data.content;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, text: streamedText }
              : msg
          ));
        } else {
          const finalText = data.fullResponse || streamedText;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, text: finalText, isStreaming: false }
              : msg
          ));
          
          // Parse scenes from the completed response (but don't auto-generate)
          const hasScenes = await parseScenes(finalText);
          
          // Update conversation phase based on content
          if (hasScenes) {
            setConversationPhase('visualization');
          } else if (finalText.includes('Who\'s story would you like to explore first') || 
                     finalText.includes('perspective') || 
                     finalText.includes('persona')) {
            setConversationPhase('curation');
          } else {
            setConversationPhase('clarification');
          }
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [messages, parseScenes]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setChatState({
      scenes: null,
      isGenerating: false,
      generatedVideos: null,
      error: null,
      progress: null,
      completedScenes: []
    });
    setAllGeneratedPersonas([]);
    setConversationPhase('clarification');
    
    if (currentConversationId) {
      storageManager.clearActiveConversation();
    }
  }, [currentConversationId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    // Conversation management
    currentConversationId,
    conversationPhase,
    loadConversation,
    startNewConversation,
    restoreLastSession,
    // Enhanced visual generation exports
    chatState,
    generateVisuals,
    parseScenes,
    // Legacy exports for backward compatibility
    scenes: chatState.scenes,
    isGeneratingVisuals: chatState.isGenerating,
    visualProgress: chatState.progress,
    generatedVideos: chatState.generatedVideos,
    allGeneratedPersonas,
    visualError: chatState.error
  };
}
