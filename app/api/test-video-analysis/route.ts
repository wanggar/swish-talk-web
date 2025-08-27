import { NextResponse } from 'next/server';
import { analyzeVideoDescription } from '@/lib/twelvelabs';

/**
 * Test endpoint for Twelve Labs video analysis
 * GET /api/test-video-analysis
 * 
 * This endpoint tests the analyzeVideoDescription function with a predefined video ID
 * and returns the analysis results.
 */
export async function GET() {
  try {
    console.log('🎬 Starting video analysis test...');
    
    // Use the specified video ID from the requirements
    const testVideoId = '68a52308a48949683bb311b2';
    
    console.log(`📹 Analyzing video ID: ${testVideoId}`);
    
    // Call the analyzeVideoDescription function
    const analysisResult = await analyzeVideoDescription(testVideoId);
    
    // Log the output to console as requested
    console.log('✅ Video Analysis Results:');
    console.log('================================================');
    console.log('📹 Video ID:', testVideoId);
    console.log('📝 Analysis Text:');
    console.log(analysisResult.text);
    console.log('================================================');
    
    // Return success response with the analysis data
    return NextResponse.json({
      success: true,
      message: 'Video analysis completed successfully',
      videoId: testVideoId,
      analysis: analysisResult.text,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Video analysis failed:');
    console.error(error);
    
    // Determine error message and status code
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('API error')) {
        statusCode = 502; // Bad Gateway
      } else if (error.message.includes('Invalid videoId')) {
        statusCode = 400; // Bad Request
      }
    }
    
    // Return error response
    return NextResponse.json({
      success: false,
      message: 'Video analysis failed',
      error: errorMessage,
      videoId: '68a52308a48949683bb311b2',
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