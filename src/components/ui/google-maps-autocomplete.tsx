'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface GoogleMapsAutocompleteProps {
  onAddressSelect: (address: PlaceDetails) => void;
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export default function GoogleMapsAutocomplete({
  onAddressSelect,
  onLocationSelect,
  placeholder = "Buscar endereço...",
  className = "",
  initialValue = ""
}: GoogleMapsAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for address suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.trim().length > 2) {
        searchAddresses(inputValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const searchAddresses = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: query })
      });

      const data = await response.json();
      
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: placeId })
      });

      const data = await response.json();
      
      if (data.coordinates && data.address) {
        onAddressSelect(data);
        if (onLocationSelect) {
          onLocationSelect(data.coordinates);
        }
        setInputValue(data.formatted_address);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get address from coordinates
          const response = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              address: `${latitude}, ${longitude}` 
            })
          });

          if (response.ok) {
            const data = await response.json();
            setInputValue(data.address);
            
            if (onLocationSelect) {
              onLocationSelect({ lat: latitude, lng: longitude });
            }
            
            // Create a place details-like object
            const placeDetails: PlaceDetails = {
              place_id: 'current_location',
              formatted_address: data.address,
              address: {
                street: '',
                number: '',
                neighborhood: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
              },
              coordinates: { lat: latitude, lng: longitude }
            };
            
            onAddressSelect(placeDetails);
          }
        } catch (error) {
          console.error('Error getting current location:', error);
          alert('Não foi possível obter o endereço da sua localização');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Não foi possível obter sua localização');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pr-20"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {inputValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearInput}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="h-6 w-6 p-0"
            >
              {isGettingLocation ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MapPin className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto shadow-lg"
        >
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                onClick={() => getPlaceDetails(suggestion.place_id)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {suggestion.structured_formatting?.main_text || suggestion.description}
                    </div>
                    {suggestion.structured_formatting?.secondary_text && (
                      <div className="text-xs text-gray-500 truncate">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}