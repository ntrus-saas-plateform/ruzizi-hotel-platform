import { NextResponse } from 'next/server';
import { autoInitRootUser } from '@/lib/init/autoInit';

export async function GET() {
  try {
    await autoInitRootUser();
    return NextResponse.json({ success: true, message: 'Initialization complete' });
  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Initialization failed' },
      { status: 500 }
    );
  }
}
