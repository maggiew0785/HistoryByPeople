const API_BASE_URL = 'http://localhost:4000';

export class ChatAPI {
  static async sendMessage(message, conversationHistory = []) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationHistory }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response;
  }

  static async *streamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data;
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Parse scenes from AI response text
  static async parseScenes(responseText, personaName) {
    const response = await fetch(`${API_BASE_URL}/api/visual/parse-scenes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ responseText, personaName }),
    });

    if (!response.ok) {
      throw new Error('Failed to parse scenes');
    }

    return response.json();
  }

  // Generate visual sequence for parsed scenes
  static async generateVisualSequence(scenes, personaName) {
    const response = await fetch(`${API_BASE_URL}/api/visual/generate-sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scenes, personaName }),
    });

    if (!response.ok) {
      throw new Error('Failed to start visual generation');
    }

    return response;
  }

  // Stream visual generation progress
  static async *streamVisualGeneration(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data;
            } catch (e) {
              console.warn('Failed to parse visual SSE data:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
