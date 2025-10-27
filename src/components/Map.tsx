import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import { icon } from "@fortawesome/fontawesome-svg-core";
import { faLocationCrosshairs } from "@fortawesome/pro-regular-svg-icons";
import type { MapPosition } from "../types";

interface MapProps {
  position: MapPosition;
  onPositionChange: (position: MapPosition, immediate?: boolean) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export function Map({ position, onPositionChange }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const isLoadingRef = useRef(false);
  const errorRef = useRef<string | null>(null);
  const isUpdatingFromPropsRef = useRef(false);
  const [pendingPosition, setPendingPosition] = useState<MapPosition | null>(
    null,
  );
  const [showLoadButton, setShowLoadButton] = useState(false);

  const handleLoadLocation = () => {
    if (pendingPosition && markerRef.current && googleMapRef.current) {
      // Move marker to center and load immediately
      const center = googleMapRef.current.getCenter();
      if (center) {
        markerRef.current.position = { lat: center.lat(), lng: center.lng() };
        onPositionChange(pendingPosition, true); // immediate load
      }
      setShowLoadButton(false);
      setPendingPosition(null);
    }
  };

  useEffect(() => {
    if (!mapRef.current || isLoadingRef.current) return;
    if (!GOOGLE_MAPS_API_KEY) {
      errorRef.current = "Google Maps API key not configured";
      return;
    }

    isLoadingRef.current = true;

    const loadMap = async () => {
      try {
        // Configure the API
        setOptions({ key: GOOGLE_MAPS_API_KEY, v: "weekly" });

        // Load the maps, marker, and geometry libraries
        await importLibrary("maps");
        await importLibrary("geometry");
        const { AdvancedMarkerElement } = (await importLibrary(
          "marker",
        )) as google.maps.MarkerLibrary;

        if (!mapRef.current) return;

        // Initialize map with mapId for AdvancedMarkerElement
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: position.lat, lng: position.lon },
          zoom: position.zoom,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          mapId: "TIDES_MAP", // Required for AdvancedMarkerElement
        });

        googleMapRef.current = map;

        // Add marker for selected location using AdvancedMarkerElement
        const marker = new AdvancedMarkerElement({
          position: { lat: position.lat, lng: position.lon },
          map,
          gmpDraggable: true,
          title: "Tide location",
        });

        markerRef.current = marker;

        // Update position when marker is dragged
        marker.addListener("dragend", () => {
          const pos = marker.position as google.maps.LatLngLiteral;
          if (pos) {
            const newPos = {
              lat: pos.lat,
              lon: pos.lng,
              zoom: map.getZoom() || position.zoom,
            };
            onPositionChange(newPos, true); // immediate load
            map.panTo(pos);
          }
        });

        // Update position and marker when map is clicked
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            marker.position = e.latLng;
            const newPos = {
              lat: e.latLng.lat(),
              lon: e.latLng.lng(),
              zoom: map.getZoom() || position.zoom,
            };
            onPositionChange(newPos, true); // immediate load
            map.panTo(e.latLng);
          }
        });

        // Update when map is dragged (only from user interaction)
        map.addListener("dragend", () => {
          if (isUpdatingFromPropsRef.current) return;
          const center = map.getCenter();
          if (center && marker.position) {
            const markerPos = marker.position as google.maps.LatLngLiteral;
            // Check if marker is not at center
            const distance =
              google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(center.lat(), center.lng()),
                new google.maps.LatLng(markerPos.lat, markerPos.lng),
              );
            // If marker is far from center (more than 100m), show load button
            if (distance > 100) {
              const newPos = {
                lat: center.lat(),
                lon: center.lng(),
                zoom: map.getZoom() || position.zoom,
              };
              setPendingPosition(newPos);
              setShowLoadButton(true);
            }
          }
        });

        // Add custom "current location" button
        const locationButton = document.createElement("button");
        locationButton.title = "Go to current location";
        locationButton.style.backgroundColor = "#fff";
        locationButton.style.border = "2px solid #fff";
        locationButton.style.borderRadius = "3px";
        locationButton.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
        locationButton.style.color = "#666";
        locationButton.style.cursor = "pointer";
        locationButton.style.margin = "10px";
        locationButton.style.padding = "0";
        locationButton.style.textAlign = "center";
        locationButton.style.width = "40px";
        locationButton.style.height = "40px";
        locationButton.style.display = "flex";
        locationButton.style.alignItems = "center";
        locationButton.style.justifyContent = "center";

        // Add Font Awesome icon
        const locationIcon = icon(faLocationCrosshairs);
        locationButton.innerHTML = locationIcon.html[0];
        const svg = locationButton.querySelector("svg");
        if (svg) {
          svg.style.width = "18px";
          svg.style.height = "18px";
        }

        locationButton.addEventListener("click", () => {
          // Try HTML5 geolocation
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const currentPos = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                };
                map.setCenter(currentPos);
                marker.position = currentPos;
                const newPos = {
                  lat: currentPos.lat,
                  lon: currentPos.lng,
                  zoom: map.getZoom() || position.zoom,
                };
                onPositionChange(newPos, true); // immediate load
              },
              () => {
                alert("Error: The Geolocation service failed.");
              },
            );
          } else {
            // Browser doesn't support Geolocation
            alert("Error: Your browser doesn't support geolocation.");
          }
        });

        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(
          locationButton,
        );
      } catch (error: unknown) {
        console.error("Error loading Google Maps:", error);
        errorRef.current = `Failed to load Google Maps: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    };

    loadMap();
  }, [onPositionChange, position.lat, position.lon, position.zoom]);

  // Update map position when prop changes
  useEffect(() => {
    if (googleMapRef.current && markerRef.current) {
      isUpdatingFromPropsRef.current = true;
      const newCenter = { lat: position.lat, lng: position.lon };
      googleMapRef.current.setCenter(newCenter);
      googleMapRef.current.setZoom(position.zoom);
      markerRef.current.position = newCenter;
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
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Alert severity="error">
          Google Maps API key is not configured. Please set
          VITE_GOOGLE_MAPS_API_KEY in your .env file.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      {isLoadingRef.current && !googleMapRef.current && (
        <Box
          sx={{
            position: "absolute",
            top: "10px",
            left: "50%",
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {showLoadButton && pendingPosition && (
        <Box
          sx={{
            position: "absolute",
            top: "10px",
            left: "50%",
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleLoadLocation}
            sx={{
              backgroundColor: "#fff",
              color: "#333",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              textTransform: "none",
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            Load this location
          </Button>
        </Box>
      )}
    </Box>
  );
}
