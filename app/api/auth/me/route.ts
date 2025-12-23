import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { connectDB } from '@/lib/db/connection';
import User from '@/models/User.model';

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les cookies ou le header Authorization
    let token = request.cookies.get('auth-token')?.value;

    // Si pas de token dans les cookies, vérifier le header Authorization
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Vérifier le token
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: { message: 'Invalid token' } },
        { status: 401 }
      );
    }

    // Connecter à la base de données et récupérer les données utilisateur complètes
    await connectDB();
    
    const user = await User.findById(payload.userId)
      .populate('establishmentId', 'name location')
      .select('-password -passwordResetToken -emailVerificationToken');

    if (!user) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    // Retourner les informations complètes de l'utilisateur
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name, // Virtual field
        role: user.role,
        establishmentId: user.establishmentId ? 
          (typeof user.establishmentId === 'object' ? (user.establishmentId as any)._id?.toString() : (user.establishmentId as any).toString()) 
          : null,
        establishment: user.establishmentId && typeof user.establishmentId === 'object' ? {
          id: (user.establishmentId as any)._id.toString(),
          name: (user.establishmentId as any).name,
          location: (user.establishmentId as any).location
        } : null,
        permissions: user.permissions,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
