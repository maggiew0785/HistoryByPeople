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
    // Validate and sanitize the visual prompt
    let promptText = scene.visualPrompt || `${scene.title} - historical scene`;
    
    // Ensure prompt is under 1000 characters (Runway limit)
    if (promptText.length > 990) {
      console.log(`⚠️ Prompt too long (${promptText.length} chars), truncating...`);
      promptText = promptText.substring(0, 897) + '...';
    }
    
    console.log(`📝 Using prompt (${promptText.length} chars): ${promptText}`);
    
    // Step 1: Generate image
    console.log(`📸 Generating image for Scene ${scene.sceneNumber}...`);
    const imageTask = await runwayClient.textToImage
      .create({
        model: 'gen4_image',
        ratio: '1280:720',
        promptText: promptText,
      })
      .waitForTaskOutput();

    console.log(`✅ Image generated for Scene ${scene.sceneNumber}`);
    const imageUrl = imageTask.output[0];
    
    // 🔍 LOG IMAGE URL
    console.log(`🖼️  Image URL: ${imageUrl}`);
    
    // Step 2: Generate video from image
    console.log(`🎥 Generating video for Scene ${scene.sceneNumber}...`);
    let videoUrl = null;
    let videoError = null;
    
    try {
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
      videoUrl = videoTask.output[0];
      
      // 🔍 LOG VIDEO URL
      console.log(`🎞️  Video URL: ${videoUrl}`);
      
    } catch (videoGenerationError) {
      console.log(`⚠️ Video generation failed for Scene ${scene.sceneNumber}, using image URL as fallback`);
      console.log(`📸 Video error:`, videoGenerationError.message);
      videoError = videoGenerationError.message;
      videoUrl = imageUrl; // Use image URL as fallback
    }
    
    return {
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      context: scene.context,
      imageUrl: imageUrl,
      videoUrl: videoUrl,
      status: 'complete',
      videoFallback: videoUrl === imageUrl, // Flag to indicate if video is actually an image
      videoError: videoError,
      createdAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Scene ${scene.sceneNumber} failed:`, error);
    
    // Check if it's a Runway task error by examining the error properties
    if (error && error.taskDetails) {
      console.error('Task Details:', error.taskDetails);
      console.error('Failure Code:', error.taskDetails.failureCode);
      console.error('Failure Reason:', error.taskDetails.failure);
    }
    
    // Add retry logic for certain failures
    if (error && error.taskDetails && error.taskDetails.failureCode === 'INTERNAL.BAD_OUTPUT.CODE01') {
      console.log(`🔄 Retrying Scene ${scene.sceneNumber} with simplified prompt...`);
      
      try {
        // Retry with a simplified prompt
        const simplifiedPrompt = scene.visualPrompt.split(',').slice(0, 3).join(', ');
        console.log(`📸 Retrying image generation with simplified prompt: ${simplifiedPrompt}`);
        
        const retryImageTask = await runwayClient.textToImage
          .create({
            model: 'gen4_image',
            ratio: '1280:720',
            promptText: simplifiedPrompt,
          })
          .waitForTaskOutput();

        const retryImageUrl = retryImageTask.output[0];
        
        // Try video generation, but fallback to image if it fails
        let retryVideoUrl = retryImageUrl;
        let retryVideoError = null;
        
        try {
          const retryVideoTask = await runwayClient.imageToVideo
            .create({
              model: 'gen4_turbo',
              promptImage: retryImageUrl,
              promptText: scene.context.substring(0, 100), // Shorten context
              ratio: '1280:720',
              duration: 5,
            })
            .waitForTaskOutput();
          
          retryVideoUrl = retryVideoTask.output[0];
          console.log(`✅ Scene ${scene.sceneNumber} video succeeded on retry`);
        } catch (retryVideoError) {
          console.log(`⚠️ Scene ${scene.sceneNumber} video failed on retry, using image as fallback`);
          retryVideoError = retryVideoError.message;
          // retryVideoUrl already set to retryImageUrl above
        }

        console.log(`✅ Scene ${scene.sceneNumber} succeeded on retry`);
        
        return {
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          visualPrompt: simplifiedPrompt,
          context: scene.context,
          imageUrl: retryImageUrl,
          videoUrl: retryVideoUrl,
          status: 'complete',
          videoFallback: retryVideoUrl === retryImageUrl,
          videoError: retryVideoError,
          retried: true
        };
        
      } catch (retryError) {
        console.error(`❌ Scene ${scene.sceneNumber} failed on retry:`, retryError);
        // Fall through to return error response
      }
    }
    
    return {
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      context: scene.context,
      error: error.message,
      errorCode: error.taskDetails?.failureCode || 'UNKNOWN',
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
