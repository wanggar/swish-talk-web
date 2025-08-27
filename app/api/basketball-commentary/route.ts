import { NextRequest, NextResponse } from 'next/server';
import { generateBasketballCommentary } from '@/lib/openai';
import { analyzeVideoDescription } from '@/lib/twelvelabs';

/**
 * Basketball Commentary API Endpoint
 * GET /api/basketball-commentary?videoId=...&duration=... - Generate commentary for a specific video
 * POST /api/basketball-commentary - Generate commentary from provided description and optional duration
 * 
 * Parameters:
 * - videoId (GET): Video ID for Twelve Labs analysis
 * - duration (GET/POST): Video duration in seconds for commentary length matching
 * - description (POST): Video description text
 * 
 * This endpoint generates ESPN-style basketball commentary using OpenAI GPT-4o
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🏀 Starting basketball commentary generation (GET)...');
    
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');
    const duration = searchParams.get('duration');
    
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
    
    // First get the video description from Twelve Labs
    const analysisResult = await analyzeVideoDescription(videoId);
    
    console.log('📝 Video description obtained, generating commentary...');
    
    // Generate ESPN-style basketball commentary
    const commentary = await generateBasketballCommentary(analysisResult.text, durationSeconds);
    
    console.log('✅ Basketball Commentary Generated:');
    console.log('================================================');
    console.log('📹 Video ID:', videoId);
    console.log('📝 Original Description:');
    console.log(analysisResult.text);
    console.log('🏀 ESPN Commentary:');
    console.log(commentary);
    console.log('================================================');
    
    return NextResponse.json({
      success: true,
      message: 'Basketball commentary generated successfully',
      videoId: videoId,
      originalDescription: analysisResult.text,
      duration: durationSeconds,
      commentary: commentary,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Basketball commentary generation failed:');
    console.error(error);
    
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('OpenAI API error')) {
        statusCode = 502; // Bad Gateway
      } else if (error.message.includes('Invalid videoId')) {
        statusCode = 400; // Bad Request
      } else if (error.message.includes('API error')) {
        statusCode = 502; // Bad Gateway
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Basketball commentary generation failed',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏀 Starting basketball commentary generation (POST)...');
    
    const body = await request.json();
    const { description, duration } = body;
    
    if (!description || typeof description !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Description is required',
        error: 'Please provide a description in the request body'
      }, { status: 400 });
    }
    
    // Validate duration if provided
    const durationSeconds = duration ? Number(duration) : undefined;
    if (duration !== undefined && (isNaN(durationSeconds!) || durationSeconds! <= 0)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid duration',
        error: 'Duration must be a positive number (in seconds)'
      }, { status: 400 });
    }
    
    console.log('📝 Description provided, generating commentary...');
    if (durationSeconds) {
      console.log(`⏱️ Duration: ${durationSeconds} seconds`);
    }
    
    // Generate ESPN-style basketball commentary
    const commentary = await generateBasketballCommentary(description, durationSeconds);
    
    console.log('✅ Basketball Commentary Generated:');
    console.log('================================================');
    console.log('📝 Original Description:');
    console.log(description);
    console.log('🏀 ESPN Commentary:');
    console.log(commentary);
    console.log('================================================');
    
    return NextResponse.json({
      success: true,
      message: 'Basketball commentary generated successfully',
      originalDescription: description,
      duration: durationSeconds,
      commentary: commentary,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Basketball commentary generation failed:');
    console.error(error);
    
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('OpenAI API error')) {
        statusCode = 502; // Bad Gateway
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Basketball commentary generation failed',
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