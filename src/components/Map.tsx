import { useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Box, CircularProgress, Alert } from '@mui/material';
import type { MapPosition } from '../types';

interface MapProps {
  position: MapPosition;
  onPositionChange: (position: MapPosition) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export function Map({ position, onPositionChange }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const isLoadingRef = useRef(false);
  const errorRef = useRef<string | null>(null);
  const isUpdatingFromPropsRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current || isLoadingRef.current) return;
    if (!GOOGLE_MAPS_API_KEY) {
      errorRef.current = 'Google Maps API key not configured';
      return;
    }

    isLoadingRef.current = true;

    const loadMap = async () => {
      try {
        // Configure the API
        setOptions({ key: GOOGLE_MAPS_API_KEY, v: 'weekly' });

        // Load the maps library
        await importLibrary('maps');

        if (!mapRef.current) return;

        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: position.lat, lng: position.lon },
          zoom: position.zoom,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        googleMapRef.current = map;

        // Add marker for selected location
        const marker = new google.maps.Marker({
          position: { lat: position.lat, lng: position.lon },
          map,
          draggable: true,
          title: 'Tide location',
        });

        markerRef.current = marker;

        // Update position when marker is dragged
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) {
            onPositionChange({
              lat: pos.lat(),
              lon: pos.lng(),
              zoom: map.getZoom() || position.zoom,
            });
          }
        });

        // Update position and marker when map is clicked
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            marker.setPosition(e.latLng);
            onPositionChange({
              lat: e.latLng.lat(),
              lon: e.latLng.lng(),
              zoom: map.getZoom() || position.zoom,
            });
          }
        });

        // Update zoom when map zoom changes (only from user interaction)
        map.addListener('zoom_changed', () => {
          if (isUpdatingFromPropsRef.current) return;
          const center = map.getCenter();
          if (center) {
            onPositionChange({
              lat: center.lat(),
              lon: center.lng(),
              zoom: map.getZoom() || position.zoom,
            });
          }
        });

        // Update when map is dragged (only from user interaction)
        map.addListener('dragend', () => {
          if (isUpdatingFromPropsRef.current) return;
          const center = map.getCenter();
          if (center) {
            onPositionChange({
              lat: center.lat(),
              lon: center.lng(),
              zoom: map.getZoom() || position.zoom,
            });
          }
        });
      } catch (error: unknown) {
        console.error('Error loading Google Maps:', error);
        errorRef.current = `Failed to load Google Maps: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    };

    loadMap();
  }, []);

  // Update map position when prop changes
  useEffect(() => {
    if (googleMapRef.current && markerRef.current) {
      isUpdatingFromPropsRef.current = true;
      const newCenter = { lat: position.lat, lng: position.lon };
      googleMapRef.current.setCenter(newCenter);
      googleMapRef.current.setZoom(position.zoom);
      markerRef.current.setPosition(newCenter);
      // Reset flag after a short delay to allow map events to settle
      setTimeout(() => {
        isUpdatingFromPropsRef.current = false;
      }, 100);
    }
  }, [position]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Alert severity="error">
          Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {isLoadingRef.current && !googleMapRef.current && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}
