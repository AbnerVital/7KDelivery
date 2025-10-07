import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

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

// GET /api/orders - Get orders (customer or admin)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyCustomerToken(request);
    const admin = await verifyAdminToken(request);

    if (!user && !admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let orders;
    
    if (admin) {
      // Admin can see all orders
      orders = await db.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              whatsappNumber: true
            }
          },
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Customer can only see their own orders
      orders = await db.order.findMany({
        where: { userId: user!.id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order (customer only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyCustomerToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { items, deliveryType, deliveryAddress, paymentMethod } = await request.json();

    if (!items || !deliveryType || !paymentMethod) {
      return NextResponse.json(
        { error: 'Items, delivery type, and payment method are required' },
        { status: 400 }
      );
    }

    // Validate delivery address for delivery orders
    if (deliveryType === 'DELIVERY' && !deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required for delivery orders' },
        { status: 400 }
      );
    }

    // Get settings for delivery fee calculation
    const settings = await db.settings.findFirst();
    
    let deliveryFee = 0;
    
    // Calculate delivery fee only for delivery orders
    if (deliveryType === 'DELIVERY') {
      if (!settings) {
        return NextResponse.json(
          { error: 'Settings not configured' },
          { status: 400 }
        );
      }

      // Check if store coordinates are available
      if (!settings.storeLat || !settings.storeLng) {
        return NextResponse.json(
          { error: 'Store location not configured' },
          { status: 400 }
        );
      }

      // Calculate distance from store to delivery address
      const distance = calculateDistance(
        settings.storeLat,
        settings.storeLng,
        deliveryAddress.lat,
        deliveryAddress.lng
      );

      // Calculate delivery fee based on per KM rate
      deliveryFee = distance * settings.deliveryFeePerKm;
      
      // Apply minimum delivery fee if configured
      if (settings.minimumDeliveryFee && deliveryFee < settings.minimumDeliveryFee) {
        deliveryFee = settings.minimumDeliveryFee;
      }

      // Round to 2 decimal places
      deliveryFee = Math.round(deliveryFee * 100) / 100;
    }
    // For pickup orders, deliveryFee remains 0

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId }
      });

      if (!product || !product.available) {
        return NextResponse.json(
          { error: `Product ${item.productId} is not available` },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        customizations: item.customizations || null
      });
    }

    // Check minimum order
    if (settings && totalAmount < settings.minimumOrder) {
      return NextResponse.json(
        { error: `Minimum order amount is ${settings.minimumOrder}` },
        { status: 400 }
      );
    }

    // Create order
    const order = await db.order.create({
      data: {
        userId: user.id,
        totalAmount,
        deliveryFee,
        deliveryType,
        deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : null,
        paymentMethod,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}