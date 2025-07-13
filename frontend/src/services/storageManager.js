// localStorage Manager for HistoryByPeople
class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      CONVERSATIONS: 'historyByPeople_conversations',
      PERSONAS: 'historyByPeople_personas',
      SETTINGS: 'historyByPeople_settings',
      ACTIVE_CONVERSATION: 'historyByPeople_activeConversation'
    };
    
    this.MAX_CONVERSATIONS = 50;
    this.MAX_PERSONAS = 100;
  }

  // Generate unique IDs
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Conversation Management
  saveConversation(conversationId, messages, phase = 'clarification', metadata = {}) {
    try {
      const conversations = this.getConversations();
      const existingIndex = conversations.findIndex(c => c.id === conversationId);
      
      const conversationData = {
        id: conversationId,
        title: this.generateTitle(messages),
        createdAt: existingIndex >= 0 ? conversations[existingIndex].createdAt : Date.now(),
        lastModified: Date.now(),
        messages: [...messages], // Deep copy to avoid mutations
        currentPhase: phase,
        metadata: {
          ...metadata,
          messageCount: messages.length
        }
      };
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversationData;
      } else {
        conversations.unshift(conversationData); // Add to beginning for recent-first order
        
        // Limit total conversations
        if (conversations.length > this.MAX_CONVERSATIONS) {
          const removed = conversations.splice(this.MAX_CONVERSATIONS);
          // Clean up associated personas for removed conversations
          removed.forEach(conv => this.deletePersonasByConversation(conv.id));
        }
      }
      
      localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      
      // Set as active conversation
      this.setActiveConversation(conversationId);
      
      return conversationData;
    } catch (error) {
      console.error('Error saving conversation:', error);
      return null;
    }
  }

  getConversations() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CONVERSATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  getConversation(conversationId) {
    return this.getConversations().find(c => c.id === conversationId);
  }

  deleteConversation(conversationId) {
    try {
      const conversations = this.getConversations().filter(c => c.id !== conversationId);
      localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      
      // Delete associated personas
      this.deletePersonasByConversation(conversationId);
      
      // Clear active conversation if it was deleted
      if (this.getActiveConversationId() === conversationId) {
        this.clearActiveConversation();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  // Persona Management
  savePersona(conversationId, personaData) {
    try {
      const personas = this.getPersonas();
      const personaId = `${conversationId}_${personaData.personaName.replace(/\s+/g, '_')}`;
      
      const persona = {
        id: personaId,
        conversationId,
        name: personaData.personaName,
        createdAt: Date.now(),
        scenes: personaData.scenes || [],
        metadata: {
          totalScenes: personaData.scenes?.length || 0,
          ...personaData.metadata
        }
      };
      
      const existingIndex = personas.findIndex(p => p.id === personaId);
      if (existingIndex >= 0) {
        personas[existingIndex] = { ...personas[existingIndex], ...persona };
      } else {
        personas.unshift(persona);
        
        // Limit total personas
        if (personas.length > this.MAX_PERSONAS) {
          personas.splice(this.MAX_PERSONAS);
        }
      }
      
      localStorage.setItem(this.STORAGE_KEYS.PERSONAS, JSON.stringify(personas));
      return persona;
    } catch (error) {
      console.error('Error saving persona:', error);
      return null;
    }
  }

  updatePersonaScene(personaId, sceneNumber, sceneData) {
    try {
      const personas = this.getPersonas();
      const personaIndex = personas.findIndex(p => p.id === personaId);
      
      if (personaIndex >= 0) {
        const sceneIndex = personas[personaIndex].scenes.findIndex(s => s.sceneNumber === sceneNumber);
        
        if (sceneIndex >= 0) {
          personas[personaIndex].scenes[sceneIndex] = {
            ...personas[personaIndex].scenes[sceneIndex],
            ...sceneData,
            lastUpdated: Date.now()
          };
        } else {
          personas[personaIndex].scenes.push({
            sceneNumber,
            ...sceneData,
            createdAt: Date.now()
          });
        }
        
        // Update video URL with expiration if provided
        if (sceneData.videoUrl) {
          personas[personaIndex].scenes[sceneIndex >= 0 ? sceneIndex : personas[personaIndex].scenes.length - 1] = {
            ...personas[personaIndex].scenes[sceneIndex >= 0 ? sceneIndex : personas[personaIndex].scenes.length - 1],
            videoUrl: sceneData.videoUrl,
            status: 'complete',
            generatedAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
          };
        }
        
        localStorage.setItem(this.STORAGE_KEYS.PERSONAS, JSON.stringify(personas));
        return personas[personaIndex];
      }
      return null;
    } catch (error) {
      console.error('Error updating persona scene:', error);
      return null;
    }
  }

  getPersonas() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.PERSONAS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading personas:', error);
      return [];
    }
  }

  getPersonasByConversation(conversationId) {
    return this.getPersonas().filter(p => p.conversationId === conversationId);
  }

  deletePersona(personaId) {
    try {
      const personas = this.getPersonas().filter(p => p.id !== personaId);
      localStorage.setItem(this.STORAGE_KEYS.PERSONAS, JSON.stringify(personas));
      return true;
    } catch (error) {
      console.error('Error deleting persona:', error);
      return false;
    }
  }

  deletePersonasByConversation(conversationId) {
    try {
      const personas = this.getPersonas().filter(p => p.conversationId !== conversationId);
      localStorage.setItem(this.STORAGE_KEYS.PERSONAS, JSON.stringify(personas));
      return true;
    } catch (error) {
      console.error('Error deleting personas by conversation:', error);
      return false;
    }
  }

  // Video URL validation (24-hour expiration)
  isVideoValid(scene) {
    if (!scene || !scene.videoUrl) {
      console.log('🔍 Video invalid: No scene or videoUrl', { scene: !!scene, videoUrl: !!scene?.videoUrl });
      return false;
    }
    
    // If no creation timestamp, assume it's valid (backward compatibility)
    if (!scene.createdAt && !scene.expiresAt) {
      console.log('🔍 Video valid: No expiration timestamp (backward compatibility)', scene.videoUrl);
      return true;
    }
    
    // Check expiration
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    let expiresAt;
    if (scene.expiresAt) {
      expiresAt = scene.expiresAt;
    } else if (scene.createdAt) {
      const createdTime = new Date(scene.createdAt).getTime();
      expiresAt = createdTime + TWENTY_FOUR_HOURS;
    } else {
      // No expiration data, assume valid
      console.log('🔍 Video valid: No expiration data available', scene.videoUrl);
      return true;
    }
    
    const isValid = now < expiresAt;
    const hoursRemaining = Math.max(0, (expiresAt - now) / (1000 * 60 * 60));
    
    console.log('🔍 Video expiration check:', {
      videoUrl: scene.videoUrl,
      now: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      hoursRemaining: hoursRemaining.toFixed(1),
      isValid
    });
    
    return isValid;
  }

  // Active conversation tracking
  setActiveConversation(conversationId) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.ACTIVE_CONVERSATION, conversationId);
    } catch (error) {
      console.error('Error setting active conversation:', error);
    }
  }

  getActiveConversationId() {
    try {
      return localStorage.getItem(this.STORAGE_KEYS.ACTIVE_CONVERSATION);
    } catch (error) {
      console.error('Error getting active conversation:', error);
      return null;
    }
  }

  clearActiveConversation() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.ACTIVE_CONVERSATION);
    } catch (error) {
      console.error('Error clearing active conversation:', error);
    }
  }

  // Utility functions
  generateTitle(messages) {
    if (!messages || messages.length === 0) return 'New Conversation';
    
    const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
    if (firstUserMessage.length === 0) return 'New Conversation';
    
    // Create a meaningful title from the first user message
    let title = firstUserMessage.length > 50 
      ? firstUserMessage.substring(0, 47) + '...'
      : firstUserMessage;
    
    // Clean up title
    title = title.replace(/[^\w\s\-.,!?]/g, '').trim();
    
    return title || 'New Conversation';
  }

  // Settings management
  getSettings() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : {
        autoSave: true,
        maxConversations: this.MAX_CONVERSATIONS,
        maxPersonas: this.MAX_PERSONAS,
        autoRestore: true
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  saveSettings(settings) {
    try {
      const currentSettings = this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      return newSettings;
    } catch (error) {
      console.error('Error saving settings:', error);
      return null;
    }
  }

  // Data management
  clearAllData() {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  exportData() {
    try {
      const data = {
        conversations: this.getConversations(),
        personas: this.getPersonas(),
        settings: this.getSettings(),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.conversations) {
        localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(data.conversations));
      }
      if (data.personas) {
        localStorage.setItem(this.STORAGE_KEYS.PERSONAS, JSON.stringify(data.personas));
      }
      if (data.settings) {
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Storage stats
  getStorageStats() {
    try {
      const conversations = this.getConversations();
      const personas = this.getPersonas();
      
      return {
        conversations: conversations.length,
        personas: personas.length,
        totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
        totalScenes: personas.reduce((sum, persona) => sum + persona.scenes.length, 0),
        activeVideos: personas.reduce((sum, persona) => 
          sum + persona.scenes.filter(scene => this.isVideoValid(scene)).length, 0
        ),
        expiredVideos: personas.reduce((sum, persona) => 
          sum + persona.scenes.filter(scene => scene.videoUrl && !this.isVideoValid(scene)).length, 0
        )
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {};
    }
  }
}

// Export singleton instance
export default new StorageManager();
