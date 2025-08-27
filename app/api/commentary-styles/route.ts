import { NextResponse } from 'next/server';
import { COMMENTARY_STYLES } from '@/lib/voice-styles';

/**
 * Commentary Styles API Endpoint
 * GET /api/commentary-styles - Get list of available commentary styles
 * 
 * Returns an array of available commentary styles with their descriptions
 * and characteristics for user selection
 */

export async function GET() {
  try {
    console.log('🎭 Fetching available commentary styles...');
    
    return NextResponse.json({
      success: true,
      message: 'Commentary styles retrieved successfully',
      styles: COMMENTARY_STYLES,
      count: COMMENTARY_STYLES.length,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Failed to fetch commentary styles:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve commentary styles',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
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