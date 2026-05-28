import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  useMapsLibrary,
  type MapCameraChangedEvent,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { Stack, TextInput, Text, Alert } from '@mantine/core';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Fallback view when no coordinates are set yet (Mérida, Yucatán).
const DEFAULT_CENTER = { lat: 20.9674, lng: -89.5926 };

export interface PickedLocation {
  lat: number;
  lon: number;
  address: string;
}

interface LocationPickerProps {
  value: PickedLocation;
  onChange: (value: PickedLocation) => void;
}

/* ─── Address autocomplete bound to a Mantine TextInput ─── */
function PlaceAutocomplete({ onPlace }: { onPlace: (place: google.maps.places.PlaceResult) => void }) {
  const places = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const ac = new places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address', 'name'],
    });
    setAutocomplete(ac);
  }, [places]);

  useEffect(() => {
    if (!autocomplete) return;
    const listener = autocomplete.addListener('place_changed', () => {
      onPlace(autocomplete.getPlace());
    });
    return () => listener.remove();
  }, [autocomplete, onPlace]);

  return (
    <TextInput
      ref={inputRef}
      label="Search address"
      placeholder="Start typing an address…"
    />
  );
}

/* ─── Map + autocomplete (camera controlled via React state) ─── */
function PickerInner({ value, onChange }: LocationPickerProps) {
  const hasCoords = !!value.lat && !!value.lon;
  const [camera, setCamera] = useState({
    center: hasCoords ? { lat: value.lat, lng: value.lon } : DEFAULT_CENTER,
    zoom: hasCoords ? 17 : 12,
  });

  const handlePlace = useCallback(
    (place: google.maps.places.PlaceResult) => {
      const loc = place.geometry?.location;
      if (!loc) return;
      const lat = loc.lat();
      const lon = loc.lng();
      onChange({ lat, lon, address: place.formatted_address ?? place.name ?? '' });
      setCamera({ center: { lat, lng: lon }, zoom: 18 });
    },
    [onChange],
  );

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const ll = e.detail.latLng;
      if (!ll) return;
      onChange({ ...value, lat: ll.lat, lon: ll.lng });
    },
    [onChange, value],
  );

  const handleMarkerDrag = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const ll = e.latLng;
      if (!ll) return;
      onChange({ ...value, lat: ll.lat(), lon: ll.lng() });
    },
    [onChange, value],
  );

  return (
    <Stack gap="xs">
      <PlaceAutocomplete onPlace={handlePlace} />
      <div style={{ width: '100%', height: 320, borderRadius: 8, overflow: 'hidden' }}>
        <Map
          center={camera.center}
          zoom={camera.zoom}
          onCameraChanged={(ev: MapCameraChangedEvent) =>
            setCamera({ center: ev.detail.center, zoom: ev.detail.zoom })
          }
          onClick={handleMapClick}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
        >
          {hasCoords && (
            <Marker
              position={{ lat: value.lat, lng: value.lon }}
              draggable
              onDragEnd={handleMarkerDrag}
            />
          )}
        </Map>
      </div>
      {hasCoords ? (
        <Text size="xs" c="dimmed">
          Pin at {value.lat.toFixed(6)}, {value.lon.toFixed(6)} — drag the pin or click the map to adjust.
        </Text>
      ) : (
        <Text size="xs" c="dimmed">Search an address or click the map to drop a pin.</Text>
      )}
    </Stack>
  );
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  if (!API_KEY) {
    return (
      <Alert color="yellow" title="Google Maps not configured">
        Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>frontend/.env</code> to enable the
        map picker (Maps JavaScript API + Places API).
      </Alert>
    );
  }
  return (
    <APIProvider apiKey={API_KEY}>
      <PickerInner value={value} onChange={onChange} />
    </APIProvider>
  );
}
