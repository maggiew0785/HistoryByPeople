// Recovery script for Li Hua videos
// Run this in browser console or add it to your app temporarily

export const recoverLiHuaVideos = () => {
  const videoData = {
    personaName: "Li Hua",
    scenes: [
      {
        sceneNumber: 1,
        title: "Identity & Daily Life",
        visualPrompt: "Li Hua, 18, oval face, almond-shaped dark brown eyes, straight nose, olive skin, long wavy black hair in high coiled bun with ornamental pins, slender build, average height, wearing embroidered Sogdian silk robe with Tang-style sash, era-appropriate jewelry, serene expression, graceful posture, in bustling Dunhuang market with stalls of spices and silks, 8th-century Silk Road, daylight, background of traders with Persian caps and Chinese tunics, camels and goods visible, photorealistic style, vibrant colors",
        context: "This scene captures Li Hua's daily environment as a merchant's daughter in the cosmopolitan world of the Silk Road.",
        imageUrl: "https://dnznrvs05pmza.cloudfront.net/e45ab237-8fda-47b7-aa05-a3d6d5cbcd34.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMjc2YzJkZTE2ZDlhNGY2NyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.Ayz2d_8LgvOm9TJr5nGj4F1y0XX64qnq_r2O0Kt3vtA",
        videoUrl: "https://dnznrvs05pmza.cloudfront.net/e45ab237-8fda-47b7-aa05-a3d6d5cbcd34.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMjc2YzJkZTE2ZDlhNGY2NyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.Ayz2d_8LgvOm9TJr5nGj4F1y0XX64qnq_r2O0Kt3vtA", // video failed, using image
        status: "complete",
        videoFallback: true,
        videoError: "An unexpected error occurred."
      },
      {
        sceneNumber: 2,
        title: "Historical Moment",
        visualPrompt: "Li Hua, 18, oval face, almond-shaped dark brown eyes, straight nose, olive skin, long wavy black hair in high coiled bun with ornamental pins, slender build, average height, wearing formal Tang-style silk dress with Sogdian patterns, anxious expression, hands clasped, in Buddhist temple courtyard decorated for festival, monks in yellow robes and foreign pilgrims present, 8th-century Silk Road, early evening lantern light",
        context: "This moment captures Li Hua during a religious festival that brings together diverse cultures along the Silk Road.",
        imageUrl: "https://dnznrvs05pmza.cloudfront.net/a73995ed-a7cf-457d-a18e-71801ea93163.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZDM4MGJjOGU5Nzc3Nzk2MCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.RCA3HJyyIHjm2M1WYKSsc7Uoz0uNIZanpouJimaIap8",
        videoUrl: "https://dnznrvs05pmza.cloudfront.net/27fa4390-bffb-4fa9-80ab-4a77c251de9c.mp4?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZGRkODBjNTFiNTY2Y2Q3MCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.qtBcVqa3g75PFTRf0XuNnQ1iOqnsOCoSHmEbMv-ios8",
        status: "complete",
        videoFallback: false
      },
      {
        sceneNumber: 3,
        title: "Impact & Consequences",
        visualPrompt: "Li Hua, 18, oval face, almond-shaped dark brown eyes, straight nose, olive skin, long wavy black hair in high coiled bun with ornamental pins, slender build, average height, wearing practical travel cloak over Sogdian-Chinese attire, determined expression, holding account scrolls, standing by caravan at city gate as dusk falls, other merchants loading goods nearby",
        context: "This scene shows Li Hua taking on new responsibilities as trade patterns shift along the Silk Road.",
        imageUrl: "https://dnznrvs05pmza.cloudfront.net/7a0e2b73-78c5-44b4-8bb1-6572a6c66268.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNzgyM2E2NTU0ZTZhM2EyZSIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.wpgRa1x_obAJHYEz4nVKL1FpGveyr3FM4ipw1sY-Z1k",
        videoUrl: "https://dnznrvs05pmza.cloudfront.net/c4edfc2e-1bd1-4bad-a1bf-64b4452f9a56.mp4?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMzA4NDNjYjllYzdiYzQ3ZiIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.WhEXGFM6tpiBA1z83jAWGWdT0Vo_yhtiWbNw85KINzo",
        status: "complete",
        videoFallback: false
      }
    ],
    totalScenes: 3,
    inProgress: false,
    completedAt: Date.now(),
    recoveredAt: Date.now()
  };
  
  // Find current conversation ID (you might need to adjust this)
  const conversationKeys = Object.keys(localStorage).filter(key => key.startsWith('historyByPeople_conversations'));
  let currentConversationId = null;
  
  if (conversationKeys.length > 0) {
    const conversations = JSON.parse(localStorage.getItem('historyByPeople_conversations') || '[]');
    if (conversations.length > 0) {
      currentConversationId = conversations[0].id; // Use the most recent conversation
    }
  }
  
  if (!currentConversationId) {
    currentConversationId = 'recovered_conversation_' + Date.now();
    console.log('🆔 Created new conversation ID for recovery:', currentConversationId);
  }
  
  // Save the video data
  const key = `videos_${currentConversationId}_Li_Hua`;
  localStorage.setItem(key, JSON.stringify(videoData));
  
  console.log('✅ Li Hua videos recovered successfully!');
  console.log('📹 Video data saved to key:', key);
  console.log('🔄 Refresh the page to see the videos in the panel');
  
  return videoData;
};

// For console use - just copy and paste this function:
window.recoverLiHuaVideos = () => {
  const videoData = {
    personaName: "Li Hua",
    scenes: [
      {
        sceneNumber: 1,
        title: "Identity & Daily Life",
        imageUrl: "https://dnznrvs05pmza.cloudfront.net/e45ab237-8fda-47b7-aa05-a3d6d5cbcd34.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMjc2YzJkZTE2ZDlhNGY2NyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.Ayz2d_8LgvOm9TJr5nGj4F1y0XX64qnq_r2O0Kt3vtA",
        videoUrl: "https://dnznrvs05pmza.cloudfront.net/e45ab237-8fda-47b7-aa05-a3d6d5cbcd34.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMjc2YzJkZTE2ZDlhNGY2NyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.Ayz2d_8LgvOm9TJr5nGj4F1y0XX64qnq_r2O0Kt3vtA",
        status: "complete"
      },
      {
        sceneNumber: 2,
        title: "Historical Moment",
        imageUrl: "https://dnznrvs05pmza.cloudfront.net/a73995ed-a7cf-457d-a18e-71801ea93163.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZDM4MGJjOGU5Nzc3Nzk2MCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.RCA3HJyyIHjm2M1WYKSsc7Uoz0uNIZanpouJimaIap8",
        videoUrl: "https://dnznrvs05pmza.cloudfront.net/27fa4390-bffb-4fa9-80ab-4a77c251de9c.mp4?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZGRkODBjNTFiNTY2Y2Q3MCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.qtBcVqa3g75PFTRf0XuNnQ1iOqnsOCoSHmEbMv-ios8",
        status: "complete"
      },
      {
        sceneNumber: 3,
        title: "Impact & Consequences",
        imageUrl: "https://dnznrvs05pmza.cloudfront.net/7a0e2b73-78c5-44b4-8bb1-6572a6c66268.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNzgyM2E2NTU0ZTZhM2EyZSIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.wpgRa1x_obAJHYEz4nVKL1FpGveyr3FM4ipw1sY-Z1k",
        videoUrl: "https://dnznrvs05pmza.cloudfront.net/c4edfc2e-1bd1-4bad-a1bf-64b4452f9a56.mp4?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMzA4NDNjYjllYzdiYzQ3ZiIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc1MjUzNzYwMH0.WhEXGFM6tpiBA1z83jAWGWdT0Vo_yhtiWbNw85KINzo",
        status: "complete"
      }
    ],
    totalScenes: 3,
    completedAt: Date.now()
  };
  
  // Get current conversation ID
  const conversations = JSON.parse(localStorage.getItem('historyByPeople_conversations') || '[]');
  const currentConversationId = conversations.length > 0 ? conversations[0].id : 'recovered_' + Date.now();
  
  const key = `videos_${currentConversationId}_Li_Hua`;
  localStorage.setItem(key, JSON.stringify(videoData));
  
  console.log('✅ Li Hua videos recovered! Key:', key);
  console.log('🔄 Refresh the page to see the videos');
  
  return key;
};
