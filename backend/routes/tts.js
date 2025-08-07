const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/', async (req, res) => {
  try {
    const { text, personaName } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Create voice instructions based on persona or use default historical narrative style
    const instructions = getVoiceInstructions(personaName);

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      instructions: instructions,
      response_format: "wav",
    });

    // Convert the response to a buffer and send it
    const buffer = Buffer.from(await response.arrayBuffer());
    
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length,
      'Access-Control-Allow-Origin': '*',
    });
    
    res.send(buffer);

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

function getVoiceInstructions(personaName) {
  // Special instructions for Charles Thorton
  if (personaName && personaName.toLowerCase().includes('charles thorton')) {
    return `Speak with dignified, authoritative, and measured tone. The voice of an experienced civic leader who has witnessed great change, speaking with the gravity that comes from living through historical events. Use sincere, reflective tone with the weight of historical perspective. Convey both the formality of the 1906 era and the human cost of the disaster. Use slower pacing during descriptions of the earthquake's impact, measured pace when explaining moral dilemmas, slightly faster when describing emergency response actions. Include deliberate pauses before key revelations about social inequities. Maintain crisp articulation befitting an educated 1906 official with emphasis on key historical terms.`;
  }
  
  // Special instructions for Mei Lin (Chinese immigrant perspective)
  if (personaName && personaName.toLowerCase().includes('mei lin')) {
    return `Speak with gentle strength and quiet dignity. The voice of someone who has faced hardship but maintains hope and resilience. Use a warm, compassionate tone that reflects the perspective of an immigrant navigating challenges in early 1900s America. Pace should be thoughtful and deliberate, with slight pauses when discussing discrimination or loss. Convey both vulnerability and inner strength. Pronunciation should be clear and respectful, especially when mentioning cultural terms or places like Chinatown.`;
  }
  
  // Default historical narrative style
  return `Speak as a dignified historical narrator with thoughtful gravitas and historical empathy. Use a measured, respectful tone that conveys the weight of historical events. Pace should be deliberate with appropriate pauses for emotional impact. Maintain clear articulation suitable for educational historical content.`;
}

module.exports = router;
