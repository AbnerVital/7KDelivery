'use client';

import { useEffect, useRef } from 'react';

interface MapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
  }>;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function Map({
  center,
  zoom = 15,
  markers = [],
  onMapClick,
  className = "w-full h-96"
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (!window.google) {
        const script = document.createElement('script');
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`;
        script.async = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Add click listener if provided
      if (onMapClick) {
        map.addListener('click', (event: any) => {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          onMapClick(position);
        });
      }

      // Add markers
      updateMarkers(map, markers);
    };

    const updateMarkers = (map: any, newMarkers: MapProps['markers']) => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add new markers
      newMarkers.forEach(markerData => {
        const marker = new window.google.maps.Marker({
          position: markerData.position,
          map: map,
          title: markerData.title || '',
          icon: markerData.icon || undefined
        });
        markersRef.current.push(marker);
      });
    };

    loadGoogleMaps();

    return () => {
      // Cleanup
      if (mapInstanceRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
      }
    };
  }, []);

  // Update map center when it changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center]);

  // Update markers when they change
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers(mapInstanceRef.current, markers);
    }
  }, [markers]);

  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
}