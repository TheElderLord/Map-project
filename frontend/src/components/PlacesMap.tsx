import { useEffect } from 'react';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { Coordinates, MapBounds, MapViewport, Place } from '../types';
import { TYPE_LABELS } from '../constants';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const defaultCenter: [number, number] = [43.238949, 76.889709];

interface PlacesMapProps {
  places: Place[];
  activePlaceId: number | null;
  onSelect: (placeId: number) => void;
  onOpenDetails: (placeId: number) => void;
  draftCoordinates: Coordinates | null;
  onMapClick: (coordinates: Coordinates) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  viewport: MapViewport;
  onViewportChange: (viewport: MapViewport) => void;
  aiRoutePlaceIds: number[];
}

function MapClickHandler({
  onMapClick,
  onBoundsChange,
  onViewportChange,
}: {
  onMapClick: (coordinates: Coordinates) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  onViewportChange: (viewport: MapViewport) => void;
}) {
  function updateViewportState(event: { target: L.Map }) {
    const bounds = event.target.getBounds();
    const center = event.target.getCenter();

    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    onViewportChange({
      center: {
        latitude: center.lat,
        longitude: center.lng,
      },
      zoom: event.target.getZoom(),
    });
  }

  useMapEvents({
    click(event) {
      onMapClick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
    moveend(event) {
      updateViewportState(event);
    },
    zoomend(event) {
      updateViewportState(event);
    },
  });

  return null;
}

function ActivePlaceFocus({
  places,
  activePlaceId,
  onBoundsChange,
  onViewportChange,
}: {
  places: Place[];
  activePlaceId: number | null;
  onBoundsChange: (bounds: MapBounds) => void;
  onViewportChange: (viewport: MapViewport) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!activePlaceId) {
      return;
    }

    const activePlace = places.find((place) => place.id === activePlaceId);
    if (!activePlace) {
      return;
    }

    map.flyTo([activePlace.latitude, activePlace.longitude], Math.max(map.getZoom(), 13), {
      duration: 0.65,
    });
  }, [activePlaceId, map, places]);

  useEffect(() => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    onViewportChange({
      center: {
        latitude: center.lat,
        longitude: center.lng,
      },
      zoom: map.getZoom(),
    });
  }, [map, onBoundsChange, onViewportChange]);

  return null;
}

export function PlacesMap({
  places,
  activePlaceId,
  onSelect,
  onOpenDetails,
  draftCoordinates,
  onMapClick,
  onBoundsChange,
  viewport,
  onViewportChange,
  aiRoutePlaceIds,
}: PlacesMapProps) {
  const aiRoutePlaces = aiRoutePlaceIds
    .map((placeId) => places.find((place) => place.id === placeId))
    .filter((place): place is Place => Boolean(place));
  const aiRoutePositions: [number, number][] = aiRoutePlaces.map((place) => [
    place.latitude,
    place.longitude,
  ]);
  const aiRoutePlaceIdSet = new Set(aiRoutePlaceIds);

  return (
    <MapContainer
      center={[viewport.center.latitude, viewport.center.longitude]}
      zoom={viewport.zoom}
      scrollWheelZoom
      className="map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler
        onMapClick={onMapClick}
        onBoundsChange={onBoundsChange}
        onViewportChange={onViewportChange}
      />
      <ActivePlaceFocus
        places={places}
        activePlaceId={activePlaceId}
        onBoundsChange={onBoundsChange}
        onViewportChange={onViewportChange}
      />
      {aiRoutePositions.length > 1 ? (
        <Polyline
          positions={aiRoutePositions}
          pathOptions={{
            color: '#57d6ff',
            dashArray: '10 12',
            lineCap: 'round',
            lineJoin: 'round',
            opacity: 0.92,
            weight: 4,
          }}
        />
      ) : null}
      {aiRoutePlaces.map((place, index) => (
        <Circle
          center={[place.latitude, place.longitude]}
          key={`ai-route-${place.id}`}
          pathOptions={{
            color: '#57d6ff',
            fillColor: '#57d6ff',
            fillOpacity: 0.14,
            opacity: 0.9,
            weight: 3,
          }}
          radius={140 + index * 18}
        />
      ))}
      {draftCoordinates ? (
        <CircleMarker
          center={[draftCoordinates.latitude, draftCoordinates.longitude]}
          pathOptions={{
            color: '#ffd06f',
            fillColor: '#f3993f',
            fillOpacity: 0.9,
            weight: 2,
          }}
          radius={12}
        >
          <Popup>
            <strong>Draft note</strong>
            <br />
            Click Save note in the side panel to persist this marker.
          </Popup>
        </CircleMarker>
      ) : null}
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          icon={markerIcon}
          eventHandlers={{
            click: () => onSelect(place.id),
          }}
        >
          <Popup>
            <div className="mini-place-card">
              <strong>{place.title}</strong>
              {aiRoutePlaceIdSet.has(place.id) ? (
                <span className="mini-place-route">AI route stop</span>
              ) : null}
              <span>
                {TYPE_LABELS[place.type]} · {place.rating.toFixed(1)}
              </span>
              {place.type === 'EVENT' ? (
                <span className="mini-place-event">
                  {place.eventStartAt
                    ? new Date(place.eventStartAt).toLocaleDateString()
                    : 'Date TBD'}
                </span>
              ) : null}
              <button
                className="mini-place-button"
                onClick={() => onOpenDetails(place.id)}
                type="button"
              >
                Open details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      <div className="map-overlay">
        <span className="map-overlay-title">Click map to create a note</span>
        <span className="map-overlay-copy">
          Drag or zoom to filter the visible collection.
        </span>
      </div>
    </MapContainer>
  );
}

export const defaultMapViewport: MapViewport = {
  center: {
    latitude: defaultCenter[0],
    longitude: defaultCenter[1],
  },
  zoom: 12,
};
