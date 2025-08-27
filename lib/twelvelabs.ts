/**
 * Twelve Labs API utility functions
 * Provides video analysis capabilities using the Twelve Labs API
 */

// Constants
const TWELVE_LABS_API_KEY = process.env.TWELVE_LABS_API_KEY;
const TWELVE_LABS_BASE_URL = 'https://api.twelvelabs.io/v1.3';

/**
 * Response interface for video analysis
 */
interface VideoAnalysisResult {
  text: string;
  video_id: string;
}

/**
 * Analyzes a video using Twelve Labs API
 * @param videoId - The unique identifier of the video to analyze
 * @returns Promise<VideoAnalysisResult> - The analysis result with text
 */
export async function analyzeVideoDescription(videoId: string): Promise<VideoAnalysisResult> {
  // Validate input
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid videoId: must be a non-empty string');
  }

  if (!TWELVE_LABS_API_KEY) {
    throw new Error('TWELVE_LABS_API_KEY environment variable is not set');
  }

  // Make the API request with SSL verification disabled (temporary fix)
  const https = await import('https');
  const agent = new https.Agent({
    rejectUnauthorized: false
  });
  
  const response = await fetch(`${TWELVE_LABS_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': TWELVE_LABS_API_KEY,
    },
    body: JSON.stringify({
      video_id: videoId,
      prompt: "Provide a comprehensive description and summary of this video content.",
      temperature: 0.2,
      stream: false
    }),
    // @ts-expect-error - agent property not in standard fetch options but needed for HTTPS agent
    agent: agent
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twelve Labs API error: ${response.status} - ${errorText}`);
  }

  // Get the response as JSON (non-streaming)
  const result = await response.json();
  
  return {
    text: result.data || result.text || 'No analysis text available',
    video_id: videoId
  };
}