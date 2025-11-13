import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Créer la réponse
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Supprimer les cookies d'authentification
    response.cookies.delete('auth-token');
    response.cookies.delete('refresh-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to logout' } },
      { status: 500 }
    );
  }
}
