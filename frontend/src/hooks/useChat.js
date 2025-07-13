import { useState, useCallback } from 'react';
import { ChatAPI } from '../services/api';

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Visual generation state
  const [scenes, setScenes] = useState(null);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [visualProgress, setVisualProgress] = useState(null);
  const [generatedVideos, setGeneratedVideos] = useState(null);
  const [allGeneratedPersonas, setAllGeneratedPersonas] = useState([]); // Store all personas
  const [visualError, setVisualError] = useState(null);

  // Parse scenes from AI response
  const parseScenes = useCallback(async (responseText) => {
    try {
      // Look for scene markers in the response
      // Check for scenes or visual generation trigger
      if (responseText.includes('**Scene 1:') || 
          responseText.includes('Scene 1:') || 
          responseText.includes('GENERATE_VISUALS:')) {
        // Enhanced persona name extraction with multiple strategies
        let personaName = 'Character';
        
        // Strategy 1: Look for GENERATE_VISUALS trigger first
        const generateMatch = responseText.match(/GENERATE_VISUALS:\s*([^\n\r]+)/i);
        if (generateMatch && generateMatch[1]) {
          personaName = generateMatch[1].trim();
        } else {
          // Strategy 2: Look for common patterns in historical responses
          const patterns = [
            /bring ([^'s\n]+)'s story to life/i,
            /explore ([^'s\n]+)'s/i,
            /([A-Z][a-z]+ [A-Z][a-z]+)'s story/,  // First Last Name's story
            /([A-Z][a-z]+ [A-Z][a-z]+)'s/,  // First Last Name's
            /journey of ([^,\n]+),/i,
            /story of ([^,\n]+),/i,
            /([A-Z][a-z]+)'s/,  // Single name's
            /I am ([A-Z][a-z]+ [A-Z][a-z]+)/,  // I am First Last
            /I am ([A-Z][a-z]+)/,  // I am Name
            /My name is ([^,\n]+)/i,
            /call me ([^,\n]+)/i,
            /Visual Prompt:\s*([^,\n]+),/i  // From scene format
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
          
          // Strategy 3: Look for proper nouns in the first paragraph if no match
          if (personaName === 'Character') {
            const firstParagraph = responseText.split('\n\n')[0];
            const properNouns = firstParagraph.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g);
            if (properNouns && properNouns.length > 0) {
              // Filter out common words that aren't names
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
        
        const result = await ChatAPI.parseScenes(responseText, personaName);
        if (result.success && result.scenes.length > 0) {
          setScenes({
            scenes: result.scenes,
            personaName: result.personaName,
            responseText: responseText
          });
          // Clear previous generated videos when new scenes are detected
          setGeneratedVideos(null);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Scene parsing error:', error);
      return false;
    }
  }, []);

  const generateVisuals = useCallback(async () => {
    if (!scenes) return;

    setIsGeneratingVisuals(true);
    setVisualError(null);
    setVisualProgress(null);
    setGeneratedVideos(null);

    try {
      const response = await ChatAPI.generateVisualSequence(scenes.scenes, scenes.personaName);
      
      // Stream the visual generation progress
      for await (const data of ChatAPI.streamVisualGeneration(response)) {
        if (data.type === 'error') {
          throw new Error(data.message || 'Visual generation failed');
        }
        
        if (data.type === 'status' || data.type === 'progress') {
          setVisualProgress(data);
        }
        
        if (data.type === 'scene_complete') {
          setVisualProgress(prev => ({
            ...prev,
            completedScenes: [...(prev?.completedScenes || []), data.scene]
          }));
        }
        
        if (data.type === 'complete') {
          const completedPersona = {
            personaName: scenes.personaName,
            scenes: data.results,
            totalScenes: data.results.length,
            timestamp: new Date().toISOString()
          };
          
          setGeneratedVideos(completedPersona);
          setAllGeneratedPersonas(prev => [...prev, completedPersona]);
          setVisualProgress(null);
        }
      }
    } catch (error) {
      setVisualError(error.message);
      console.error('Visual generation error:', error);
    } finally {
      setIsGeneratingVisuals(false);
    }
  }, [scenes]);

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
          
          // Auto-parse scenes from the completed response
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
    setScenes(null);
    setGeneratedVideos(null);
    setAllGeneratedPersonas([]);
    setVisualProgress(null);
    setVisualError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    // Visual generation exports
    scenes,
    isGeneratingVisuals,
    visualProgress,
    generatedVideos,
    allGeneratedPersonas,
    visualError,
    generateVisuals,
    parseScenes
  };
}
