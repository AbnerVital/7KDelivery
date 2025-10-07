import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Check if the address is coordinates (lat, lng format)
    const coordinatePattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
    const coordinateMatch = address.match(coordinatePattern);
    
    let geocodeUrl;
    let isReverseGeocoding = false;
    
    if (coordinateMatch) {
      // Reverse geocoding: convert coordinates to address
      const lat = coordinateMatch[1];
      const lng = coordinateMatch[2];
      geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=pt-BR`;
      isReverseGeocoding = true;
    } else {
      // Forward geocoding: convert address to coordinates
      const encodedAddress = encodeURIComponent(address);
      geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&language=pt-BR`;
    }

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status || 'No results found'}` },
        { status: 400 }
      );
    }

    const result = data.results[0];
    
    if (isReverseGeocoding) {
      // Return formatted address and coordinates for reverse geocoding
      return NextResponse.json({
        address: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        addressComponents: result.address_components,
        accuracy: 'high'
      });
    } else {
      // Return coordinates and formatted address for forward geocoding
      return NextResponse.json({
        address: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        addressComponents: result.address_components,
        accuracy: 'high',
        placeId: result.place_id
      });
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    
    // Fallback to default coordinates (São Paulo)
    return NextResponse.json({
      address: address,
      coordinates: {
        lat: -23.550520,
        lng: -46.633308
      },
      accuracy: 'fallback',
      error: 'Geocoding failed, using default coordinates'
    });
  }
}