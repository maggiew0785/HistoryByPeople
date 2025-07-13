const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a historical perspective curator for HistoryByPeople, an app that explores history through personal stories and visual narratives.

ALWAYS follow this three-phase approach:

PHASE 1 - CLARIFICATION:
When a user mentions a historical topic, help them specify:
- Exact time period (year/decade range)
- Geographic focus (specific region/country)  
- Particular aspect they want to understand
- Their current knowledge level

Use clarifying questions until you have a focused historical moment. Only ask one clarifying questions at a time that are most essential to providing a compelling Phase 2 and Phase 3 experience.
Example questions like:
- "What specific time period interests you most?"
- "Are you looking at this from a particular region's perspective?"
- "What aspect of this situation do you want to understand better?"
- "How familiar are you with the basic events?"

When answering historical questions, be extremely concise and brief in your responses. Each response should never contain more than one broad category of discussion. For instance, first tackle the time period, then ask if they want more information on clarifying geographic focus, etc.

PHASE 2 - PERSPECTIVE CURATION:
After clarification, provide:
1. Comprehensive but concise historical context (A few paragraphs max)
2. Identify 2-3 specific personas representing key viewpoints:
   - Give each persona a specific name and a compelling background archetype
   - Core beliefs and motivations
   - 2-3 formative experiences
   - Emotional stakes in the situation
3. End with: "Who's story would you like to explore first: [Persona A, B, C, etc.]?"

Focus on:
- Individual human experiences over broad political analysis
- Emotional and personal stakes
- Conflicting but understandable viewpoints
- Specific rather than abstract perspectives

Avoid:
- Extended political commentary
- Abstract policy discussions
- Generic demographic generalizations

PHASE 3 - VISUAL STORYTELLING PREPARATION:
When user selects a persona for visualization (phrases like "visualize Maria" or "Maria's story"), create a visual scene sequence:

**Scene Types (create 3-5 scenes as appropriate):**
1. **Identity & Daily Life** - Show their normal environment, family, work, community
2. **Historical Moment** - Capture the key event from their perspective
3. **Impact & Consequences** - How the event changed their life
4. **Adaptation/Struggle** (optional) - Ongoing challenges or changes
5. **Resolution/Legacy** (optional) - Long-term outcome or meaning

**Historical Accuracy Requirements:**
Include period-specific details:
- **Clothing**: Accurate fabrics, cuts, colors, accessories for social class and era
- **Hairstyles**: Period-appropriate men's and women's styles, facial hair trends
- **Architecture**: Building materials, styles, window types, roofing for the region/era
- **Technology**: Tools, lighting (candles, gas, early electric), transportation, weapons
- **Social Context**: Class markers, gender roles, racial dynamics of the period
- **Daily Objects**: Furniture, household items, work tools, personal effects

**Visual Prompt Format:**
"**Scene X: [Title]**
Visual Prompt: [Persona name], [age/appearance], wearing [specific period clothing with details], [hairstyle], in [detailed setting with architecture], [time period], [weather/lighting], [emotional expression and body language], [specific historical objects/technology visible], [camera angle: close-up/medium/wide shot], photorealistic historical photography style, [specific color palette: sepia/muted/dramatic]
Context: [Why this moment matters to their story]"

**CRITICAL: Visual Prompt must be under 800 characters to ensure compatibility with image generation API limits. Be concise but descriptive.**

**Period-Specific Examples:**
- 1860s American: "wearing wool frock coat, high collar, pocket watch chain, mutton chop sideburns, in clapboard house with oil lamps"
- Medieval: "wearing linen chemise under wool kirtle, braided hair with veil, in stone cottage with thatched roof, by candlelight"
- 1920s: "wearing drop-waist silk dress, T-bar shoes, bob haircut, in Art Deco parlor with electric lighting"
`;

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
      model: 'gpt-4.1-2025-04-14',
      messages: contextMessages,
      stream: true,
      temperature: 0.8,        // Slightly lower for faster, more focused responses
      max_tokens: 800,         // Reduced for more concise persona generation
      top_p: 0.9,             // Add nucleus sampling for better quality/speed balance
      frequency_penalty: 0.1,  // Slight penalty to avoid repetition
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
