import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123' // Senha simples para testes
};

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Verifica credenciais fixas para testes
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Verifica se já existe um admin, se não, cria um
      let admin = await db.admin.findFirst({
        where: { email: 'admin@7kdelivery.com' }
      });

      if (!admin) {
        admin = await db.admin.create({
          data: {
            name: 'Administrador',
            email: 'admin@7kdelivery.com',
            googleId: 'simple-auth-admin',
            avatarUrl: null
          }
        });
      }

      // Gera token JWT
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

      const response = NextResponse.json({ 
        message: 'Login successful',
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        }
      });

      // Set HTTP-only cookie
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 // 1 day
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Simple admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}