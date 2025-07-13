import { useState, useCallback } from 'react';
import { ChatAPI } from '../services/api';

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
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

  // Enhanced scene detection (no auto-generation)
  const parseScenes = useCallback(async (responseText) => {
    try {
      console.log('🔍 Parsing scenes from response...', responseText.substring(0, 200));
      
      // Look for scene markers in the response
      if (responseText.includes('**Scene 1:') || 
          responseText.includes('Scene 1:') || 
          responseText.includes('GENERATE_VISUALS:')) {
        
        console.log('✅ Scene markers found in response');
        
        // Enhanced persona name extraction
        let personaName = 'Character';
        
        // Strategy 1: Look for GENERATE_VISUALS trigger first
        const generateMatch = responseText.match(/GENERATE_VISUALS:\s*([^\n\r]+)/i);
        if (generateMatch && generateMatch[1]) {
          personaName = generateMatch[1].trim();
        } else {
          // Strategy 2: Look for common patterns in historical responses
          const patterns = [
            /bring ([^'s\n]+)'s story to life/i,  // "bring Claudia's story to life"
            /explore ([^'s\n]+)'s/i,
            /([A-Z][a-z]+ [A-Z][a-z]+)'s story/,
            /([A-Z][a-z]+ [A-Z][a-z]+)'s/,
            /journey of ([^,\n]+),/i,
            /story of ([^,\n]+),/i,
            /([A-Z][a-z]+)'s/,
            /I am ([A-Z][a-z]+ [A-Z][a-z]+)/,
            /I am ([A-Z][a-z]+)/,
            /My name is ([^,\n]+)/i,
            /call me ([^,\n]+)/i,
            /Visual Prompt:\s*([^,\n]+),/i,
            /\*\*([A-Z][a-z]+),\s*[^*]*\*\*/i  // "**Claudia, a Christian Martyr**"
          ];
          
          for (const pattern of patterns) {
            const match = responseText.match(pattern);
            if (match && match[1]) {
              personaName = match[1].trim();
              // Clean up common artifacts
              personaName = personaName.replace(/^(the|a|an)\s+/i, '');
              personaName = personaName.replace(/\s+(the|a|an)\s+/gi, ' ');
              break;
            }
          }
          
          // Strategy 3: Look for proper nouns if no match
          if (personaName === 'Character') {
            const firstParagraph = responseText.split('\n\n')[0];
            const properNouns = firstParagraph.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g);
            if (properNouns && properNouns.length > 0) {
              const excludeWords = ['Scene', 'The', 'This', 'Historical', 'Emperor', 'King', 'Queen', 'Lord', 'Lady', 'Visual', 'Prompt'];
              const validNames = properNouns.filter(name => 
                !excludeWords.includes(name) && 
                name.length > 2 &&
                !name.match(/^(Scene|Chapter|Part|Phase)\s*\d/i)
              );
              if (validNames.length > 0) {
                personaName = validNames[0];
              }
            }
          }
        }
        
        console.log('🎭 Extracted persona name:', personaName);
        
        // Parse scenes using API
        const result = await ChatAPI.parseScenes(responseText, personaName);
        console.log('📝 API parse result:', result);
        
        if (result.success && result.scenes.length > 0) {
          console.log('✅ Scenes parsed successfully:', result.scenes.length, 'scenes');
          setChatState(prev => ({
            ...prev,
            scenes: {
              scenes: result.scenes,
              personaName: result.personaName,
              responseText: responseText
            },
            generatedVideos: null, // Clear previous results
            error: null,
            progress: null,
            completedScenes: []
          }));
          return true;
        } else {
          console.log('❌ No scenes found or parsing failed');
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
  }, []);

  // Button-triggered visual generation
  const generateVisuals = useCallback(async () => {
    if (!chatState.scenes) return;

    setChatState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      progress: null,
      completedScenes: []
    }));

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
        
        if (data.type === 'scene_complete') {
          setChatState(prev => ({
            ...prev,
            completedScenes: [...prev.completedScenes, data.scene],
            progress: {
              ...prev.progress,
              currentScene: prev.completedScenes.length + 1
            }
          }));
        }
        
        if (data.type === 'complete') {
          const completedPersona = {
            personaName: chatState.scenes.personaName,
            scenes: data.results,
            totalScenes: data.results.length,
            timestamp: new Date().toISOString()
          };
          
          setChatState(prev => ({
            ...prev,
            generatedVideos: completedPersona,
            isGenerating: false,
            progress: null
          }));
          
          // Update legacy state for backward compatibility
          setAllGeneratedPersonas(prev => [...prev, completedPersona]);
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

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
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
          await parseScenes(finalText);
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
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
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
