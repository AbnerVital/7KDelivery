import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

export async function POST(request: NextRequest) {
  try {
    const { deliveryAddress } = await request.json();

    if (!deliveryAddress || !deliveryAddress.lat || !deliveryAddress.lng) {
      return NextResponse.json(
        { error: 'Delivery address with coordinates is required' },
        { status: 400 }
      );
    }

    // Get settings
    const settings = await db.settings.findFirst();
    
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
    let deliveryFee = distance * settings.deliveryFeePerKm;
    
    // Apply minimum delivery fee if configured
    if (settings.minimumDeliveryFee && deliveryFee < settings.minimumDeliveryFee) {
      deliveryFee = settings.minimumDeliveryFee;
    }

    // Round to 2 decimal places
    deliveryFee = Math.round(deliveryFee * 100) / 100;
    const roundedDistance = Math.round(distance * 100) / 100;

    const calculationMethod = `Por distância: ${roundedDistance} km × R$ ${settings.deliveryFeePerKm.toFixed(2)}/km`;
    
    if (settings.minimumDeliveryFee && deliveryFee === settings.minimumDeliveryFee) {
      calculationMethod += ` (Taxa mínima aplicada)`;
    }

    return NextResponse.json({
      deliveryFee,
      distance: roundedDistance,
      calculationMethod,
      deliveryAddress: {
        street: deliveryAddress.street,
        number: deliveryAddress.number,
        neighborhood: deliveryAddress.neighborhood,
        city: deliveryAddress.city,
        zipCode: deliveryAddress.zipCode,
        lat: deliveryAddress.lat,
        lng: deliveryAddress.lng
      }
    });

  } catch (error) {
    console.error('Calculate delivery fee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}