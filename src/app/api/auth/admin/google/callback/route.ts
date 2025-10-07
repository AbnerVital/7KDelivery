import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getGoogleAccessToken(code: string) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    client_secret: GOOGLE_CLIENT_SECRET!,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/admin/google/callback`,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  return response.json();
}

async function getGoogleUserInfo(accessToken: string) {
  const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
  const response = await fetch(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/login?error=${error}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/login?error=missing_code`
      );
    }

    // Exchange code for access token
    const tokenResponse = await getGoogleAccessToken(code);
    
    if (tokenResponse.error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/login?error=token_failed`
      );
    }

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokenResponse.access_token);

    // Check if admin exists
    let admin = await db.admin.findFirst({
      where: {
        OR: [
          { googleId: userInfo.id },
          { email: userInfo.email }
        ]
      }
    });

    if (!admin) {
      // Create new admin
      admin = await db.admin.create({
        data: {
          name: userInfo.name,
          email: userInfo.email,
          googleId: userInfo.id,
          avatarUrl: userInfo.picture,
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        name: admin.name, 
        email: admin.email,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/dashboard`
    );

    // Set HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 1 day
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/login?error=server_error`
    );
  }
}