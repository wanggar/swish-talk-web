import { NextRequest, NextResponse } from 'next/server';
import { generateBasketballCommentary } from '@/lib/openai';
import { analyzeVideoDescription } from '@/lib/twelvelabs';
import { generateSpeech } from '@/lib/elevenlabs';
import { getVoiceIdFromStyle, getDefaultCommentaryStyle, isValidCommentaryStyle } from '@/lib/voice-styles';

/**
 * Basketball Audio Commentary API Endpoint
 * GET /api/basketball-audio?videoId=...&duration=...&commentaryStyle=... - Generate audio commentary for a specific video
 * POST /api/basketball-audio - Generate audio commentary from provided text
 * 
 * Parameters:
 * - videoId (GET): Video ID for Twelve Labs analysis
 * - duration (GET/POST): Video duration in seconds for commentary length matching
 * - text (POST): Commentary text to convert to speech
 * - commentaryStyle (GET/POST): Commentary style ('kevin-harlan', 'mike-breen', 'british-analyst', 'espn-steroid') - default: 'espn-steroid'
 * - voiceId (GET/POST): Legacy parameter - Voice ID (overrides commentaryStyle if provided)
 * 
 * This endpoint generates basketball commentary in various styles and converts it to speech using ElevenLabs
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🏀🔊 Starting basketball audio commentary generation (GET)...');
    
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');
    const duration = searchParams.get('duration');
    const commentaryStyle = searchParams.get('commentaryStyle');
    const legacyVoiceId = searchParams.get('voiceId'); // For backward compatibility
    
    // Determine voice ID from commentary style or legacy voiceId
    let voiceId: string;
    let selectedStyle: string;
    
    if (legacyVoiceId) {
      voiceId = legacyVoiceId;
      selectedStyle = 'custom';
    } else if (commentaryStyle && isValidCommentaryStyle(commentaryStyle)) {
      voiceId = getVoiceIdFromStyle(commentaryStyle);
      selectedStyle = commentaryStyle;
    } else {
      const defaultStyle = getDefaultCommentaryStyle();
      voiceId = defaultStyle.voiceId;
      selectedStyle = defaultStyle.id;
    }
    
    if (!videoId) {
      return NextResponse.json({
        success: false,
        message: 'Video ID is required',
        error: 'Please provide a videoId parameter'
      }, { status: 400 });
    }
    
    // Validate duration if provided
    const durationSeconds = duration ? Number(duration) : undefined;
    if (duration !== null && (isNaN(durationSeconds!) || durationSeconds! <= 0)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid duration',
        error: 'Duration must be a positive number (in seconds)'
      }, { status: 400 });
    }
    
    console.log(`📹 Analyzing video ID: ${videoId}`);
    if (durationSeconds) {
      console.log(`⏱️ Duration: ${durationSeconds} seconds`);
    }
    console.log(`🎭 Commentary Style: ${selectedStyle}`);
    console.log(`🎤 Voice ID: ${voiceId}`);
    
    // Step 1: Get the video description from Twelve Labs
    console.log('📹 Step 1: Analyzing video...');
    const analysisResult = await analyzeVideoDescription(videoId);
    
    // Step 2: Generate ESPN-style basketball commentary
    console.log('📝 Step 2: Generating commentary text...');
    const commentary = await generateBasketballCommentary(analysisResult.text, durationSeconds);
    
    // Step 3: Convert commentary to speech
    console.log('🔊 Step 3: Converting text to speech...');
    const audioBuffer = await generateSpeech(commentary, voiceId);
    
    console.log('✅ Basketball Audio Commentary Generated Successfully!');
    console.log('================================================');
    console.log('📹 Video ID:', videoId);
    console.log('📝 Original Description:', analysisResult.text.substring(0, 100) + '...');
    console.log('🏀 Commentary:', commentary.substring(0, 100) + '...');
    console.log('🔊 Audio size:', audioBuffer.length, 'bytes');
    console.log('================================================');
    
    // Return the audio file as a response
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="basketball-commentary-${selectedStyle}-${videoId}.mp3"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('❌ Basketball audio commentary generation failed:');
    console.error(error);
    
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('OpenAI API error')) {
        statusCode = 502; // Bad Gateway
      } else if (error.message.includes('ElevenLabs API error')) {
        statusCode = 502; // Bad Gateway
      } else if (error.message.includes('Invalid videoId')) {
        statusCode = 400; // Bad Request
      } else if (error.message.includes('API error')) {
        statusCode = 502; // Bad Gateway
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Basketball audio commentary generation failed',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏀🔊 Starting basketball audio commentary generation (POST)...');
    
    const body = await request.json();
    const { text, description, duration, commentaryStyle, voiceId } = body;
    
    // Determine voice ID from commentary style or legacy voiceId
    let actualVoiceId: string;
    let selectedStyle: string;
    
    if (voiceId) {
      actualVoiceId = voiceId;
      selectedStyle = 'custom';
    } else if (commentaryStyle && isValidCommentaryStyle(commentaryStyle)) {
      actualVoiceId = getVoiceIdFromStyle(commentaryStyle);
      selectedStyle = commentaryStyle;
    } else {
      const defaultStyle = getDefaultCommentaryStyle();
      actualVoiceId = defaultStyle.voiceId;
      selectedStyle = defaultStyle.id;
    }
    
    // Check if we have text directly or need to generate commentary from description
    let commentaryText: string;
    
    if (text && typeof text === 'string') {
      // Use provided text directly
      commentaryText = text;
      console.log('📝 Using provided commentary text...');
    } else if (description && typeof description === 'string') {
      // Generate commentary from description
      console.log('📝 Generating commentary from description...');
      
      // Validate duration if provided
      const durationSeconds = duration ? Number(duration) : undefined;
      if (duration !== undefined && (isNaN(durationSeconds!) || durationSeconds! <= 0)) {
        return NextResponse.json({
          success: false,
          message: 'Invalid duration',
          error: 'Duration must be a positive number (in seconds)'
        }, { status: 400 });
      }
      
      commentaryText = await generateBasketballCommentary(description, durationSeconds);
    } else {
      return NextResponse.json({
        success: false,
        message: 'Text or description is required',
        error: 'Please provide either "text" (for direct audio conversion) or "description" (to generate commentary first) in the request body'
      }, { status: 400 });
    }
    
    console.log(`🎭 Commentary Style: ${selectedStyle}`);
    console.log(`🎤 Voice ID: ${actualVoiceId}`);
    console.log(`📝 Commentary text length: ${commentaryText.length} characters`);
    
    // Convert commentary to speech
    console.log('🔊 Converting text to speech...');
    const audioBuffer = await generateSpeech(commentaryText, actualVoiceId);
    
    console.log('✅ Basketball Audio Commentary Generated Successfully!');
    console.log('================================================');
    console.log('🏀 Commentary:', commentaryText.substring(0, 100) + '...');
    console.log('🔊 Audio size:', audioBuffer.length, 'bytes');
    console.log('================================================');
    
    // Return the audio file as a response
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="basketball-commentary-${selectedStyle}.mp3"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('❌ Basketball audio commentary generation failed:');
    console.error(error);
    
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('OpenAI API error')) {
        statusCode = 502; // Bad Gateway
      } else if (error.message.includes('ElevenLabs API error')) {
        statusCode = 502; // Bad Gateway
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Basketball audio commentary generation failed',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}