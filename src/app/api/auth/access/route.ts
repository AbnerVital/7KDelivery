import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { name, whatsappNumber } = await request.json();

    if (!name || !whatsappNumber) {
      return NextResponse.json(
        { error: 'Name and WhatsApp number are required' },
        { status: 400 }
      );
    }

    // Clean WhatsApp number (remove non-digits)
    const cleanWhatsAppNumber = whatsappNumber.replace(/\D/g, '');

    // Check if user exists
    let user = await db.user.findUnique({
      where: { whatsappNumber: cleanWhatsAppNumber },
      include: { addresses: true }
    });

    if (user) {
      // Check if name matches (case-insensitive)
      if (user.name.toLowerCase() !== name.toLowerCase()) {
        return NextResponse.json(
          { error: 'Name does not match the registered account' },
          { status: 400 }
        );
      }
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          name,
          whatsappNumber: cleanWhatsAppNumber,
        },
        include: { addresses: true }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        name: user.name, 
        whatsappNumber: user.whatsappNumber,
        type: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        whatsappNumber: user.whatsappNumber,
        addresses: user.addresses
      },
      token
    });

    // Set HTTP-only cookie
    response.cookies.set('customer-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}