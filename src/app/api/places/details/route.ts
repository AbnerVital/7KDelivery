import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { place_id } = await request.json();

    if (!place_id) {
      return NextResponse.json(
        { error: 'Place ID is required' },
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

    // Use Google Places Details API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${apiKey}&language=pt-BR`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.result) {
      return NextResponse.json(
        { error: `Place details failed: ${data.status}` },
        { status: 400 }
      );
    }

    const result = data.result;
    
    // Extract address components
    const addressComponents = result.address_components || [];
    const getAddressComponent = (type: string) => {
      const component = addressComponents.find((comp: any) => comp.types.includes(type));
      return component ? component.long_name : '';
    };

    // Extract coordinates
    const location = result.geometry?.location;
    
    return NextResponse.json({
      place_id: result.place_id,
      formatted_address: result.formatted_address,
      address: {
        street: getAddressComponent('route') || getAddressComponent('street_address'),
        number: getAddressComponent('street_number'),
        neighborhood: getAddressComponent('sublocality') || getAddressComponent('administrative_area_level_2'),
        city: getAddressComponent('administrative_area_level_2') || getAddressComponent('locality'),
        state: getAddressComponent('administrative_area_level_1'),
        zipCode: getAddressComponent('postal_code'),
        country: getAddressComponent('country')
      },
      coordinates: location ? {
        lat: location.lat,
        lng: location.lng
      } : null,
      address_components: addressComponents,
      types: result.types,
      url: result.url
    });

  } catch (error) {
    console.error('Place details error:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch place details'
    }, { status: 500 });
  }
}