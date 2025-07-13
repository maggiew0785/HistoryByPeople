const express = require('express');
const RunwayML = require('@runwayml/sdk').default;
const { TaskFailedError } = require('@runwayml/sdk');
const router = express.Router();

const runwayClient = new RunwayML({
  apiKey: process.env.RUNWAY_API_KEY,
});

// Parse scenes from AI response text
function parseScenes(responseText) {
  const sceneRegex = /\*\*Scene (\d+): ([^*]+)\*\*\s*Visual Prompt: ([^\n]+(?:\n(?!\*\*Scene|\n)[^\n]*)*)\s*Context: ([^\n]+(?:\n(?!\*\*Scene|\n)[^\n]*)*)/g;
  const scenes = [];
  let match;
  
  while ((match = sceneRegex.exec(responseText)) !== null) {
    scenes.push({
      sceneNumber: parseInt(match[1]),
      title: match[2].trim(),
      visualPrompt: match[3].trim().replace(/\n/g, ' '),
      context: match[4].trim().replace(/\n/g, ' ')
    });
  }
  
  return scenes;
}

// Generate a single scene (image + video)
async function generateScene(scene, personaName) {
  console.log(`🎬 Generating Scene ${scene.sceneNumber}: ${scene.title}`);
  
  try {
    // Step 1: Generate image
    console.log(`📸 Generating image for Scene ${scene.sceneNumber}...`);
    const imageTask = await runwayClient.textToImage
      .create({
        model: 'gen4_image',
        ratio: '1280:720',
        promptText: scene.visualPrompt,
      })
      .waitForTaskOutput();

    console.log(`✅ Image generated for Scene ${scene.sceneNumber}`);
    const imageUrl = imageTask.output[0];
    
    // Step 2: Generate video from image
    console.log(`🎥 Generating video for Scene ${scene.sceneNumber}...`);
    const videoTask = await runwayClient.imageToVideo
      .create({
        model: 'gen4_turbo',
        promptImage: imageUrl,
        promptText: `Cinematic view: ${scene.context}`,
        ratio: '1280:720',
        duration: 5,
      })
      .waitForTaskOutput();

    console.log(`✅ Video generated for Scene ${scene.sceneNumber}`);
    
    return {
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      context: scene.context,
      imageUrl: imageUrl,
      videoUrl: videoTask.output[0],
      status: 'complete'
    };

  } catch (error) {
    console.error(`❌ Scene ${scene.sceneNumber} failed:`, error);
    
    if (error instanceof TaskFailedError) {
      console.error('Task Details:', error.taskDetails);
    }
    
    return {
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      context: scene.context,
      error: error.message,
      status: 'failed'
    };
  }
}

// Main visual generation endpoint
router.post('/generate-sequence', async (req, res) => {
  try {
    const { scenes, personaName } = req.body;
    
    if (!scenes || !Array.isArray(scenes)) {
      return res.status(400).json({ error: 'Scenes array is required' });
    }
    
    if (!personaName) {
      return res.status(400).json({ error: 'Persona name is required' });
    }

    console.log(`🚀 Starting visual sequence generation for ${personaName}`);
    console.log(`📋 Generating ${scenes.length} scenes`);

    // Set up Server-Sent Events for progress tracking
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial status
    res.write(`data: ${JSON.stringify({ 
      type: 'status', 
      message: `Starting generation of ${scenes.length} scenes for ${personaName}...`,
      totalScenes: scenes.length,
      currentScene: 0
    })}\n\n`);

    const results = [];
    
    // Generate scenes sequentially
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      // Send progress update
      res.write(`data: ${JSON.stringify({ 
        type: 'progress', 
        message: `Generating Scene ${scene.sceneNumber}: ${scene.title}`,
        currentScene: i + 1,
        totalScenes: scenes.length,
        sceneStatus: 'generating'
      })}\n\n`);

      const result = await generateScene(scene, personaName);
      results.push(result);
      
      // Send scene completion update
      res.write(`data: ${JSON.stringify({ 
        type: 'scene_complete', 
        scene: result,
        currentScene: i + 1,
        totalScenes: scenes.length
      })}\n\n`);
    }

    // Send final completion
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      message: `Generated ${results.length} scenes for ${personaName}`,
      results: results,
      success: true
    })}\n\n`);

    console.log(`🎉 Visual sequence generation completed for ${personaName}`);
    res.end();

  } catch (error) {
    console.error('Visual Generation Error:', error);
    
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: 'Failed to generate visual sequence',
      error: error.message,
      success: false
    })}\n\n`);
    
    res.end();
  }
});

// Parse scenes from chat response (for frontend to extract scenes)
router.post('/parse-scenes', async (req, res) => {
  try {
    const { responseText, personaName } = req.body;
    
    if (!responseText) {
      return res.status(400).json({ error: 'Response text is required' });
    }
    
    const scenes = parseScenes(responseText);
    
    res.json({
      scenes: scenes,
      personaName: personaName || 'Unknown',
      sceneCount: scenes.length,
      success: true
    });

  } catch (error) {
    console.error('Scene Parsing Error:', error);
    res.status(500).json({ 
      error: 'Failed to parse scenes',
      message: error.message,
      success: false
    });
  }
});

module.exports = router;
