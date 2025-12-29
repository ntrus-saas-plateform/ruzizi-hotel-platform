import { NextResponse } from 'next/server';
import { clearRateLimitCache } from '@/lib/security/rate-limit';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  clearRateLimitCache();
  
  return NextResponse.json({
    success: true,
    message: 'Rate limit cache cleared'
  });
}
