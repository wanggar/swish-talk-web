import { NextRequest, NextResponse } from 'next/server';
import { generateBasketballCommentary } from '@/lib/openai';
import { analyzeVideoDescription } from '@/lib/twelvelabs';
import { generateSpeech } from '@/lib/elevenlabs';
import { getVoiceIdFromStyle, getDefaultCommentaryStyle, isValidCommentaryStyle } from '@/lib/voice-styles';

/**
 * Unified Basketball Commentary Audio Pipeline
 * GET /api/get-commentary-audio?videoId=...&duration=...&commentaryStyle=...
 * 
 * Complete pipeline that:
 * 1. Analyzes video using Twelve Labs API (videoId → description)
 * 2. Generates basketball commentary using OpenAI (description + duration → commentary)
 * 3. Converts commentary to speech using ElevenLabs (commentary + voiceId → audio)
 * 
 * Parameters:
 * - videoId (required): Video ID for Twelve Labs analysis
 * - duration (required): Video duration in seconds for commentary length matching
 * - commentaryStyle (optional): Commentary style ('kevin-harlan', 'mike-breen', 'british-analyst', 'espn-steroid') - default: 'espn-steroid'
 * - voiceId (optional): Legacy parameter - Voice ID for speech generation (overrides commentaryStyle if provided)
 * 
 * Output: MP3 audio file containing basketball commentary in the selected style
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🏀🎬🔊 Starting unified commentary audio pipeline...');
    
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');
    const duration = searchParams.get('duration');
    const commentaryStyle = searchParams.get('commentaryStyle');
    const legacyVoiceId = searchParams.get('voiceId'); // For backward compatibility
    
    // Determine voice ID from commentary style or legacy voiceId
    let voiceId: string;
    let selectedStyle: string;
    
    if (legacyVoiceId) {
      // Legacy mode: use provided voiceId directly
      voiceId = legacyVoiceId;
      selectedStyle = 'custom';
      console.log('🔄 Using legacy voiceId parameter');
    } else if (commentaryStyle && isValidCommentaryStyle(commentaryStyle)) {
      // New mode: map commentary style to voice ID
      voiceId = getVoiceIdFromStyle(commentaryStyle);
      selectedStyle = commentaryStyle;
      console.log(`🎭 Using commentary style: ${commentaryStyle}`);
    } else {
      // Default mode: use ESPN on Steroid
      const defaultStyle = getDefaultCommentaryStyle();
      voiceId = defaultStyle.voiceId;
      selectedStyle = defaultStyle.id;
      if (commentaryStyle && !isValidCommentaryStyle(commentaryStyle)) {
        console.warn(`⚠️ Invalid commentary style '${commentaryStyle}', falling back to '${defaultStyle.id}'`);
      }
    }
    
    // Validate required parameters
    if (!videoId) {
      return NextResponse.json({
        success: false,
        message: 'Video ID is required',
        error: 'Please provide a videoId parameter'
      }, { status: 400 });
    }
    
    if (!duration) {
      return NextResponse.json({
        success: false,
        message: 'Duration is required',
        error: 'Please provide a duration parameter (in seconds)'
      }, { status: 400 });
    }
    
    // Validate duration
    const durationSeconds = Number(duration);
    if (isNaN(durationSeconds) || durationSeconds <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid duration',
        error: 'Duration must be a positive number (in seconds)'
      }, { status: 400 });
    }
    
    console.log(`📹 Video ID: ${videoId}`);
    console.log(`⏱️ Duration: ${durationSeconds} seconds`);
    console.log(`🎭 Commentary Style: ${selectedStyle}`);
    console.log(`🎤 Voice ID: ${voiceId}`);
    console.log('================================================');
    
    // STEP 1: Video Analysis (videoId → description)
    console.log('📹 STEP 1: Analyzing video content...');
    const analysisResult = await analyzeVideoDescription(videoId);
    console.log('✅ Video analysis completed');
    console.log(`📝 Description preview: ${analysisResult.text.substring(0, 100)}...`);
    
    // STEP 2: Commentary Generation (description + duration → commentary)
    console.log('🏀 STEP 2: Generating basketball commentary...');
    const commentary = await generateBasketballCommentary(analysisResult.text, durationSeconds);
    console.log('✅ Commentary generation completed');
    console.log(`🎯 Commentary preview: ${commentary.substring(0, 100)}...`);
    console.log(`📊 Commentary length: ${commentary.length} characters`);
    
    // STEP 3: Speech Generation (commentary + voiceId → audio)
    console.log('🔊 STEP 3: Converting commentary to speech...');
    let audioBuffer: Buffer;
    try {
      audioBuffer = await generateSpeech(commentary, voiceId);
      console.log('✅ Speech generation completed');
      console.log(`🎵 Audio size: ${audioBuffer.length} bytes`);
    } catch (speechError) {
      console.warn('⚠️ Speech generation failed, but pipeline partially succeeded');
      console.warn('Returning JSON response with commentary text instead of audio');
      
      // Return successful response with commentary text when speech fails
      return NextResponse.json({
        success: true,
        message: 'Pipeline completed successfully (audio generation failed, returning text)',
        videoId: videoId,
        duration: durationSeconds,
        commentaryStyle: selectedStyle,
        voiceId: voiceId,
        originalDescription: analysisResult.text,
        commentary: commentary,
        audioGenerationError: speechError instanceof Error ? speechError.message : 'Unknown speech generation error',
        timestamp: new Date().toISOString(),
        note: 'Audio generation failed - this response contains the generated commentary text'
      }, { status: 200 });
    }
    
    console.log('================================================');
    console.log('🎉 PIPELINE COMPLETED SUCCESSFULLY!');
    console.log('📹 Video ID:', videoId);
    console.log('⏱️ Duration:', durationSeconds, 'seconds');
    console.log('🎭 Commentary Style:', selectedStyle);
    console.log('📝 Original Description Length:', analysisResult.text.length, 'characters');
    console.log('🏀 Commentary Length:', commentary.length, 'characters');
    console.log('🔊 Final Audio Size:', audioBuffer.length, 'bytes');
    console.log('🎤 Voice Used:', voiceId);
    console.log('================================================');
    
    // Return the audio file as response
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="commentary-${selectedStyle}-${videoId}-${durationSeconds}s.mp3"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Custom headers for pipeline info
        'X-Video-ID': videoId,
        'X-Duration': durationSeconds.toString(),
        'X-Commentary-Style': selectedStyle,
        'X-Voice-ID': voiceId,
        'X-Commentary': commentary,
        'X-Commentary-Length': commentary.length.toString(),
        'X-Description-Length': analysisResult.text.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('❌ PIPELINE FAILED:');
    console.error(error);
    
    let errorMessage = 'Unknown error occurred in commentary pipeline';
    let statusCode = 500;
    let failedStep = 'unknown';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Determine which step failed based on error message
      if (error.message.includes('Twelve Labs') || error.message.includes('Invalid videoId')) {
        failedStep = 'video-analysis';
        statusCode = error.message.includes('Invalid videoId') ? 400 : 502;
      } else if (error.message.includes('OpenAI')) {
        failedStep = 'commentary-generation';
        statusCode = 502;
      } else if (error.message.includes('ElevenLabs')) {
        failedStep = 'speech-generation';
        statusCode = 502;
      } else if (error.message.includes('API error')) {
        statusCode = 502;
      }
    }
    
    console.log(`💥 Failed at step: ${failedStep}`);
    
    return NextResponse.json({
      success: false,
      message: 'Commentary audio pipeline failed',
      error: errorMessage,
      failedStep: failedStep,
      videoId: request.nextUrl.searchParams.get('videoId'),
      duration: request.nextUrl.searchParams.get('duration'),
              commentaryStyle: request.nextUrl.searchParams.get('commentaryStyle') || 'espn-steroid',
      voiceId: request.nextUrl.searchParams.get('voiceId'),
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}