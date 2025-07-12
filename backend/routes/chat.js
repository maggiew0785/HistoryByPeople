const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a knowledgeable and empathetic historian helping people explore historical events from personal perspectives. Your role is to:

1. Help users understand historical events through the lens of ordinary people who lived through them
2. Provide context about daily life, emotions, and human experiences during historical periods
3. Share stories that make history feel personal and relatable
4. Encourage users to think about how historical events affected real people
5. Be respectful when discussing sensitive historical topics
6. Keep responses engaging but historically accurate

IMPORTANT: Keep responses concise and focused. Use markdown formatting for emphasis (**bold**, *italic*), lists, and structure. Always respond in a conversational, warm tone that makes history feel accessible and human.`;

// Helper function to manage conversation context
function manageContext(messages, maxTokens = 3000) {
  // Keep system prompt + recent messages within token limit
  const systemMessage = { role: 'system', content: SYSTEM_PROMPT };
  
  // Estimate tokens (rough: 1 token ≈ 4 characters)
  let totalTokens = SYSTEM_PROMPT.length / 4;
  const recentMessages = [];
  
  // Add messages from most recent, staying within token limit
  for (let i = messages.length - 1; i >= 0; i--) {
    const messageTokens = messages[i].content.length / 4;
    if (totalTokens + messageTokens > maxTokens) break;
    
    recentMessages.unshift(messages[i]);
    totalTokens += messageTokens;
  }
  
  return [systemMessage, ...recentMessages];
}

router.post('/', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build conversation context
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];
    
    const contextMessages = manageContext(messages);

    // Set up streaming response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: contextMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
      }
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({ content: '', done: true, fullResponse })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Chat API Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
    res.end();
  }
});

module.exports = router;
