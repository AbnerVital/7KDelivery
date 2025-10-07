import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify admin token
async function verifyAdminToken(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'admin') {
      return null;
    }

    const admin = await db.admin.findUnique({
      where: { id: decoded.adminId }
    });

    return admin;
  } catch (error) {
    return null;
  }
}

// GET /api/settings - Get settings (public)
export async function GET(request: NextRequest) {
  try {
    let settings = await db.settings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await db.settings.create({
        data: {
          minimumOrder: 20.00,
          workingHours: {
            monday: { open: '18:00', close: '23:00' },
            tuesday: { open: '18:00', close: '23:00' },
            wednesday: { open: '18:00', close: '23:00' },
            thursday: { open: '18:00', close: '23:00' },
            friday: { open: '18:00', close: '23:00' },
            saturday: { open: '18:00', close: '23:00' },
            sunday: { open: '18:00', close: '23:00' }
          },
          whatsappNumber: '+5511999999999',
          phone: '+5511999999999',
          email: 'contato@7kdelivery.com',
          storeAddress: 'Rua das Pizzas, 123, Centro, São Paulo - SP, 01234-567',
          storeLat: -23.550520,
          storeLng: -46.633308,
          deliveryFeePerKm: 5.00,
          minimumDeliveryFee: 0.00
        }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdminToken(request);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      minimumOrder,
      workingHours,
      whatsappNumber,
      phone,
      email,
      storeAddress,
      storeLat,
      storeLng,
      deliveryFeePerKm,
      minimumDeliveryFee
    } = await request.json();

    let settings = await db.settings.findFirst();

    if (settings) {
      // Update existing settings
      settings = await db.settings.update({
        where: { id: settings.id },
        data: {
          minimumOrder: parseFloat(minimumOrder),
          workingHours,
          whatsappNumber,
          phone,
          email,
          storeAddress,
          storeLat: storeLat ? parseFloat(storeLat) : null,
          storeLng: storeLng ? parseFloat(storeLng) : null,
          deliveryFeePerKm: parseFloat(deliveryFeePerKm),
          minimumDeliveryFee: minimumDeliveryFee ? parseFloat(minimumDeliveryFee) : 0.00
        }
      });
    } else {
      // Create new settings
      settings = await db.settings.create({
        data: {
          minimumOrder: parseFloat(minimumOrder),
          workingHours,
          whatsappNumber,
          phone,
          email,
          storeAddress,
          storeLat: storeLat ? parseFloat(storeLat) : null,
          storeLng: storeLng ? parseFloat(storeLng) : null,
          deliveryFeePerKm: parseFloat(deliveryFeePerKm),
          minimumDeliveryFee: minimumDeliveryFee ? parseFloat(minimumDeliveryFee) : 0.00
        }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}