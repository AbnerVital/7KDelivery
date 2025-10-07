import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
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

    // Use Google Places Autocomplete API
    const encodedInput = encodeURIComponent(input);
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedInput}&key=${apiKey}&language=pt-BR&components=country:br&types=address`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: `Places autocomplete failed: ${data.status}` },
        { status: 400 }
      );
    }

    // Transform the predictions to a more usable format
    const suggestions = data.predictions.map((prediction: any) => ({
      place_id: prediction.place_id,
      description: prediction.description,
      structured_formatting: prediction.structured_formatting,
      types: prediction.types,
      terms: prediction.terms
    }));

    return NextResponse.json({
      suggestions,
      status: data.status
    });

  } catch (error) {
    console.error('Places autocomplete error:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch address suggestions',
      suggestions: []
    }, { status: 500 });
  }
}