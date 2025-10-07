import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { emitOrderStatusUpdate } from '@/lib/socket';

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

// GET /api/orders/[id] - Get specific order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyCustomerToken(request);
    const admin = await verifyAdminToken(request);

    if (!user && !admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        user: admin ? {
          select: {
            id: true,
            name: true,
            whatsappNumber: true
          }
        } : false,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Customers can only see their own orders
    if (!admin && order.userId !== user!.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken(request);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const order = await db.order.update({
      where: { id: params.id },
      data: { status },
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
      }
    });

    // Emit WebSocket event for real-time updates
    try {
      // Dynamic import to avoid require() issues
      const { Server } = await import('socket.io');
      const io = new Server();
      emitOrderStatusUpdate(io, params.id, status);
    } catch (error) {
      console.error('Failed to emit WebSocket event:', error);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}