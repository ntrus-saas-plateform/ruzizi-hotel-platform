import { NextRequest, NextResponse } from 'next/server';
import UserService from '@/services/User.service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const resetToken = await UserService.generatePasswordResetToken(email);

    // TODO: Envoyer l'email avec le token
    // Pour l'instant, on retourne le token (à ne pas faire en production!)
    console.log('Reset token:', resetToken);

    return NextResponse.json({
      message: 'Un email de réinitialisation a été envoyé',
      // En production, ne pas retourner le token!
      token: resetToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
