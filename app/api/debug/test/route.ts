import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Test endpoint called - server is responding');
    
    return NextResponse.json({
      success: true,
      message: 'Server is working',
      timestamp: new Date().toISOString(),
      test: 'PDF download debug'
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed'
    }, { status: 500 });
  }
}
