import { NextResponse } from 'next/server';
import { autoInitRootUser } from '@/lib/init/autoInit';

let initialized = false;

export async function GET() {
  if (initialized) {
    return NextResponse.json({ success: true, message: 'Already initialized' });
  }

  try {
    await autoInitRootUser();
    initialized = true;
    return NextResponse.json({ success: true, message: 'Initialization complete' });
  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Initialization failed' },
      { status: 500 }
    );
  }
}
