import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify customer token
async function verifyCustomerToken(request: NextRequest) {
  const token = request.cookies.get('customer-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'customer') {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    });

    return user;
  } catch (error) {
    return null;
  }
}

// POST /api/addresses - Create new address (customer only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyCustomerToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { street, number, neighborhood, city, zipCode, lat, lng } = await request.json();

    if (!street || !number || !neighborhood || !city || !zipCode) {
      return NextResponse.json(
        { error: 'All address fields are required' },
        { status: 400 }
      );
    }

    const address = await db.address.create({
      data: {
        street,
        number,
        neighborhood,
        city,
        zipCode,
        lat: lat || 0,
        lng: lng || 0,
        userId: user.id
      }
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Create address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/addresses - Get user addresses (customer only)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyCustomerToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}