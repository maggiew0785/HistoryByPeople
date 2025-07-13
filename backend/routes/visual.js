const express = require('express');
const RunwayML = require('@runwayml/sdk').default;
const { RateLimitError } = require('@runwayml/sdk');
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

// Track rate limit status globally
let videoRateLimitHit = false;

// Get base URL for videos (dynamic based on environment)
const getBaseUrl = () => {
  const port = process.env.PORT || 4000;
  return `http://localhost:${port}`;
};

// Generate a single scene (image + video)
async function generateScene(scene, personaName, referenceImageUrl = null) {
  console.log(`🎬 Generating Scene ${scene.sceneNumber}: ${scene.title}`);
  
  // Hard-coded URLs for Mei Lin persona
  if (personaName === "Mei Lin") {
    console.log(`🎯 Using pre-generated content for Mei Lin - Scene ${scene.sceneNumber}`);
    
    const baseUrl = getBaseUrl();
    const videoUrls = {
      1: `${baseUrl}/videos/Mei_Lin_1.mp4`,
      2: `${baseUrl}/videos/Mei_Lin_2.mp4`,
      3: `${baseUrl}/videos/Mei_Lin_3.mp4`
    };
    
    const videoUrl = videoUrls[scene.sceneNumber];
    
    console.log(`🎞️  Hard-coded Video URL: ${videoUrl}`);
    
    return {
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      context: scene.context,
      imageUrl: null, // No image files available
      videoUrl: videoUrl,
      status: 'complete',
      videoFallback: false, // This is actual video, not a fallback
      videoError: null,
      isRateLimited: false,
      hardcoded: true, // Flag to indicate this was hardcoded
      createdAt: new Date().toISOString()
    };
  }
  
  // Hard-coded URLs for Charles Thorton persona
  if (personaName === "Charles Thorton") {
    console.log(`🎯 Using pre-generated content for Charles Thorton - Scene ${scene.sceneNumber}`);
    
    const baseUrl = getBaseUrl();
    const videoUrls = {
      1: `${baseUrl}/videos/Charles_1.mp4`,
      2: `${baseUrl}/videos/Charles_2.mp4`,
      3: `${baseUrl}/videos/Charles_3.mp4`
    };
    
    const videoUrl = videoUrls[scene.sceneNumber];
    
    console.log(`🎞️  Hard-coded Video URL: ${videoUrl}`);
    
    return {
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      context: scene.context,
      imageUrl: null, // No image files available
      videoUrl: videoUrl,
      status: 'complete',
      videoFallback: false, // This is actual video, not a fallback
      videoError: null,
      isRateLimited: false,
      hardcoded: true, // Flag to indicate this was hardcoded
      createdAt: new Date().toISOString()
    };
  }
  
  try {
    // Validate and sanitize the visual prompt
    let promptText = scene.visualPrompt || `${scene.title} - historical scene`;
    
    // Ensure prompt is under 1000 characters (Runway limit)
    if (promptText.length > 990) {
      console.log(`⚠️ Prompt too long (${promptText.length} chars), truncating...`);
      promptText = promptText.substring(0, 897) + '...';
    }
    
    console.log(`📝 Using prompt (${promptText.length} chars): ${promptText}`);
    
    // Prepare image generation parameters
    const imageGenerationParams = {
      model: 'gen4_image',
      ratio: '1280:720',
      promptText: promptText,
    };
    
    // Add reference image if provided (for visual consistency after scene 1)
    if (referenceImageUrl) {
      console.log(`🖼️ Using reference image from Scene 1 for visual consistency`);
      imageGenerationParams.referenceImages = [
        {
          uri: referenceImageUrl,
          tag: 'StyleReference',
        }
      ];
      // Modify prompt to reference the style
      imageGenerationParams.promptText = `@StyleReference ${promptText}`;
    }
    
    // Step 1: Generate image
    console.log(`📸 Generating image for Scene ${scene.sceneNumber}...`);
    const imageTask = await runwayClient.textToImage
      .create(imageGenerationParams)
      .waitForTaskOutput();

    console.log(`✅ Image generated for Scene ${scene.sceneNumber}`);
    const imageUrl = imageTask.output[0];
    
    // 🔍 LOG IMAGE URL
    console.log(`🖼️  Image URL: ${imageUrl}`);
    
    // Step 2: Generate video from image (skip if rate limit already hit)
    console.log(`🎥 Generating video for Scene ${scene.sceneNumber}...`);
    let videoUrl = null;
    let videoError = null;
    let isRateLimited = false;
    
    if (videoRateLimitHit) {
      console.log(`⏸️ Skipping video generation for Scene ${scene.sceneNumber} - rate limit detected earlier`);
      videoError = 'Rate limit reached - using image as fallback';
      videoUrl = imageUrl;
      isRateLimited = true;
    } else {
      try {
        const videoTask = await runwayClient.imageToVideo
          .create({
            model: 'gen4_turbo',
            promptImage: imageUrl,
            promptText: `Cinematic view: ${scene.context}`,
            ratio: '1280:720',
            duration: 5,
          });
        
        // Wait for the task to complete - this is where the rate limit error occurs
        const videoResult = await videoTask.waitForTaskOutput();
        console.log(`✅ Video generated for Scene ${scene.sceneNumber}`);
        videoUrl = videoResult.output[0];
        
        // 🔍 LOG VIDEO URL
        console.log(`🎞️  Video URL: ${videoUrl}`);
        
      } catch (videoGenerationError) {
        console.log(`⚠️ Video generation error caught for Scene ${scene.sceneNumber}:`, videoGenerationError.message);
        console.log(`📊 Error details:`, {
          errorType: videoGenerationError.constructor.name,
          status: videoGenerationError.status,
          errorObject: videoGenerationError.error
        });
        
        // Check if this is a rate limit error - handle RateLimitError specifically
        const isRateLimit = videoGenerationError instanceof RateLimitError ||
                           videoGenerationError.status === 429 ||
                           (videoGenerationError.error && 
                            typeof videoGenerationError.error === 'object' && 
                            videoGenerationError.error.error && 
                            videoGenerationError.error.error.toLowerCase().includes('daily task limit'));
        
        if (isRateLimit) {
          console.log(`🚫 Rate limit hit for video generation on Scene ${scene.sceneNumber} - switching to image-only mode`);
          console.log(`📊 Rate limit details:`, {
            errorType: videoGenerationError.constructor.name,
            status: videoGenerationError.status,
            errorMessage: videoGenerationError.error?.error || videoGenerationError.message
          });
          videoRateLimitHit = true; // Set global flag to skip future video attempts
          isRateLimited = true;
          videoError = 'Rate limit reached - switching to image-only mode';
        } else {
          console.log(`⚠️ Video generation failed for Scene ${scene.sceneNumber}, using image URL as fallback`);
          console.log(`📸 Video error:`, videoGenerationError.message);
          videoError = videoGenerationError.message;
        }
        
        videoUrl = imageUrl; // Use image URL as fallback
      }
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
      isRateLimited: isRateLimited,
      createdAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Scene ${scene.sceneNumber} failed:`, error);
    
    // Check if it's a rate limit error at the image generation level
    if (error instanceof RateLimitError || error.status === 429) {
      console.log(`🚫 Rate limit hit at image generation level for Scene ${scene.sceneNumber}`);
      return {
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        visualPrompt: scene.visualPrompt,
        context: scene.context,
        error: 'Rate limit reached - unable to generate image',
        errorCode: 'RATE_LIMIT',
        status: 'failed',
        isRateLimited: true
      };
    }
    
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
        
        // Prepare retry parameters
        const retryParams = {
          model: 'gen4_image',
          ratio: '1280:720',
          promptText: simplifiedPrompt,
        };
        
        // Add reference image if provided (for visual consistency)
        if (referenceImageUrl) {
          retryParams.referenceImages = [
            {
              uri: referenceImageUrl,
              tag: 'StyleReference',
            }
          ];
          retryParams.promptText = `@StyleReference ${simplifiedPrompt}`;
        }
        
        const retryImageTask = await runwayClient.textToImage
          .create(retryParams)
          .waitForTaskOutput();

        const retryImageUrl = retryImageTask.output[0];
        
        // Try video generation, but fallback to image if it fails or rate limited
        let retryVideoUrl = retryImageUrl;
        let retryVideoError = null;
        let retryIsRateLimited = false;
        
        if (videoRateLimitHit) {
          console.log(`⏸️ Skipping retry video generation for Scene ${scene.sceneNumber} - rate limit detected`);
          retryVideoError = 'Rate limit reached - using image as fallback';
          retryIsRateLimited = true;
        } else {
          try {
            const retryVideoTask = await runwayClient.imageToVideo
              .create({
                model: 'gen4_turbo',
                promptImage: retryImageUrl,
                promptText: scene.context.substring(0, 100), // Shorten context
                ratio: '1280:720',
                duration: 5,
              });
            
            const retryVideoResult = await retryVideoTask.waitForTaskOutput();
            retryVideoUrl = retryVideoResult.output[0];
            console.log(`✅ Scene ${scene.sceneNumber} video succeeded on retry`);
          } catch (retryVideoError) {
            console.log(`⚠️ Retry video generation error caught for Scene ${scene.sceneNumber}:`, retryVideoError.message);
            
            // Check if this is a rate limit error - handle RateLimitError specifically
            const isRateLimit = retryVideoError instanceof RateLimitError ||
                               retryVideoError.status === 429 ||
                               (retryVideoError.error && 
                                typeof retryVideoError.error === 'object' && 
                                retryVideoError.error.error && 
                                retryVideoError.error.error.toLowerCase().includes('daily task limit'));
            
            if (isRateLimit) {
              console.log(`🚫 Rate limit hit on retry for Scene ${scene.sceneNumber} - switching to image-only mode`);
              console.log(`📊 Rate limit details:`, {
                errorType: retryVideoError.constructor.name,
                status: retryVideoError.status,
                errorMessage: retryVideoError.error?.error || retryVideoError.message
              });
              videoRateLimitHit = true;
              retryIsRateLimited = true;
              retryVideoError = 'Rate limit reached on retry - using image as fallback';
            } else {
              console.log(`⚠️ Scene ${scene.sceneNumber} video failed on retry, using image as fallback`);
              retryVideoError = retryVideoError.message;
            }
            // retryVideoUrl already set to retryImageUrl above
          }
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
          isRateLimited: retryIsRateLimited,
          retried: true
        };
        
      } catch (retryError) {
        console.error(`❌ Scene ${scene.sceneNumber} failed on retry:`, retryError);
        
        // Check if retry failed due to rate limit
        if (retryError instanceof RateLimitError || retryError.status === 429) {
          console.log(`🚫 Rate limit hit on retry for Scene ${scene.sceneNumber}`);
          return {
            sceneNumber: scene.sceneNumber,
            title: scene.title,
            visualPrompt: scene.visualPrompt,
            context: scene.context,
            error: 'Rate limit reached on retry - unable to generate image',
            errorCode: 'RATE_LIMIT',
            status: 'failed',
            isRateLimited: true,
            retried: true
          };
        }
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

    // Reset rate limit flag for new sequence
    videoRateLimitHit = false;

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
    let referenceImageUrl = null; // Store the first scene's image for visual consistency
    
    // Generate scenes sequentially
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      // Send progress update with rate limit status
      const progressMessage = videoRateLimitHit ? 
        `Generating Scene ${scene.sceneNumber}: ${scene.title} (image-only mode due to rate limits)` :
        `Generating Scene ${scene.sceneNumber}: ${scene.title}`;
      
      res.write(`data: ${JSON.stringify({ 
        type: 'progress', 
        message: progressMessage,
        currentScene: i + 1,
        totalScenes: scenes.length,
        sceneStatus: 'generating',
        videoRateLimited: videoRateLimitHit
      })}\n\n`);

      // Use reference image from scene 1 for all subsequent scenes
      const result = await generateScene(scene, personaName, referenceImageUrl);
      results.push(result);
      
      // Store the first scene's image as reference for visual consistency
      if (i === 0 && result.status === 'complete' && result.imageUrl) {
        referenceImageUrl = result.imageUrl;
        console.log(`🎨 Using Scene 1 image as reference for visual consistency: ${referenceImageUrl}`);
      }
      
      // Send scene completion update
      res.write(`data: ${JSON.stringify({ 
        type: 'scene_complete', 
        scene: result,
        currentScene: i + 1,
        totalScenes: scenes.length,
        videoRateLimited: videoRateLimitHit
      })}\n\n`);
      
      // Log rate limit detection for first occurrence
      if (result.isRateLimited && !videoRateLimitHit) {
        console.log(`🚫 Rate limit detected - switching to image-only mode for remaining scenes`);
      }
    }

    // Send final completion with rate limit summary
    const rateLimitedScenes = results.filter(r => r.isRateLimited).length;
    const completionMessage = rateLimitedScenes > 0 ? 
      `Generated ${results.length} scenes for ${personaName} (${rateLimitedScenes} scenes used image-only due to rate limits)` :
      `Generated ${results.length} scenes for ${personaName}`;
    
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      message: completionMessage,
      results: results,
      success: true,
      videoRateLimited: videoRateLimitHit,
      rateLimitedScenes: rateLimitedScenes
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

// Reset rate limit flag endpoint (useful for manual resets)
router.post('/reset-rate-limit', async (req, res) => {
  videoRateLimitHit = false;
  console.log('🔄 Video rate limit flag manually reset');
  res.json({ 
    success: true, 
    message: 'Video rate limit flag has been reset' 
  });
});

module.exports = router;
