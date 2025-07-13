const express = require('express');
const RunwayML = require('@runwayml/sdk').default;
const router = express.Router();

const runwayClient = new RunwayML({
  apiKey: process.env.RUNWAY_API_KEY,
});

// Parse scenes from AI response text
function parseScenes(responseText) {
  console.log('🔍 Backend parsing scenes...');
  console.log('📝 Response text length:', responseText.length);
  console.log('📝 First 300 chars:', responseText.substring(0, 300));
  
  const sceneRegex = /\*\*Scene (\d+): ([^*]+)\*\*\s*Visual Prompt: ([^\n]+(?:\n(?!\*\*Scene|\n)[^\n]*)*)\s*Context: ([^\n]+(?:\n(?!\*\*Scene|\n)[^\n]*)*)/g;
  const scenes = [];
  let match;
  
  while ((match = sceneRegex.exec(responseText)) !== null) {
    console.log('✅ Found scene:', match[1], match[2]);
    scenes.push({
      sceneNumber: parseInt(match[1]),
      title: match[2].trim(),
      visualPrompt: match[3].trim().replace(/\n/g, ' '),
      context: match[4].trim().replace(/\n/g, ' ')
    });
  }
  
  console.log('📊 Total scenes parsed:', scenes.length);
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
    
    // Fixed error handling - check if error has taskDetails property instead of instanceof
    if (error.taskDetails) {
      console.error('Task Details:', error.taskDetails);
      console.error('Failure Code:', error.taskDetails.failureCode);
      console.error('Failure Reason:', error.taskDetails.failure);
    }
    
    return {
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      context: scene.context,
      error: error.message || 'Generation failed',
      taskDetails: error.taskDetails || null,
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
    
    // Process each scene sequentially to avoid overwhelming the API
    for (const scene of scenes) {
      try {
        // Send progress update
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          message: `Generating Scene ${scene.sceneNumber}: ${scene.title}`,
          currentScene: scene.sceneNumber,
          totalScenes: scenes.length,
          completedScenes: results.length
        })}\n\n`);

        const result = await generateScene(scene, personaName);
        results.push(result);

        // Send completion update for this scene
        res.write(`data: ${JSON.stringify({
          type: 'scene_complete',
          message: `Scene ${scene.sceneNumber} ${result.status === 'complete' ? 'completed' : 'failed'}`,
          scene: result,
          completedScenes: results.length,
          totalScenes: scenes.length
        })}\n\n`);

        // Add a small delay between scenes to be API-friendly
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Visual Generation Error:`, error);
        
        const failedResult = {
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          error: error.message,
          status: 'failed'
        };
        
        results.push(failedResult);

        res.write(`data: ${JSON.stringify({
          type: 'scene_failed',
          message: `Scene ${scene.sceneNumber} failed: ${error.message}`,
          scene: failedResult,
          completedScenes: results.length,
          totalScenes: scenes.length
        })}\n\n`);
      }
    }

    // Send final completion status
    const successfulScenes = results.filter(r => r.status === 'complete').length;
    const failedScenes = results.filter(r => r.status === 'failed').length;

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      message: `Generation complete: ${successfulScenes} successful, ${failedScenes} failed`,
      results: results,
      summary: {
        total: scenes.length,
        successful: successfulScenes,
        failed: failedScenes
      }
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
