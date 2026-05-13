import { useEffect, useMemo, useState } from 'react';
import { createPlace, deletePlace, fetchPlaces, updatePlace } from './api';
import { AiPlanner } from './components/AiPlanner';
import { FiltersPanel } from './components/FiltersPanel';
import { PlaceDetails } from './components/PlaceDetails';
import { PlaceForm } from './components/PlaceForm';
import { PlacesList } from './components/PlacesList';
import { defaultMapViewport, PlacesMap } from './components/PlacesMap';
import { PlacePopup } from './components/PlacePopup';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import {
  Coordinates,
  CreatePlacePayload,
  MapBounds,
  MapViewport,
  Place,
  PlacesQuery,
} from './types';

const FILTERS_STORAGE_KEY = 'geo-places-filters';
const VIEWPORT_STORAGE_KEY = 'geo-places-viewport';
const VIEWPORT_FILTER_STORAGE_KEY = 'geo-places-restrict-viewport';

const initialFilters: PlacesQuery = {
  search: '',
  type: '',
  minRating: '',
  upcomingOnly: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filters, setFilters] = useState<PlacesQuery>(() => {
    const storedFilters = window.localStorage.getItem(FILTERS_STORAGE_KEY);
    return storedFilters ? (JSON.parse(storedFilters) as PlacesQuery) : initialFilters;
  });
  const [activePlaceId, setActivePlaceId] = useState<number | null>(null);
  const [draftCoordinates, setDraftCoordinates] = useState<Coordinates | null>(null);
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);
  const [isPlacePopupOpen, setIsPlacePopupOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [aiRoutePlaceIds, setAiRoutePlaceIds] = useState<number[]>([]);
  const [viewport, setViewport] = useState<MapViewport>(() => {
    const storedViewport = window.localStorage.getItem(VIEWPORT_STORAGE_KEY);
    return storedViewport
      ? (JSON.parse(storedViewport) as MapViewport)
      : defaultMapViewport;
  });
  const [restrictToViewport, setRestrictToViewport] = useState<boolean>(() => {
    const storedValue = window.localStorage.getItem(VIEWPORT_FILTER_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : true;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debouncedFilters = useDebouncedValue(filters, 280);

  useEffect(() => {
    void loadPlaces(debouncedFilters);
  }, [debouncedFilters]);

  useEffect(() => {
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    window.localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(viewport));
  }, [viewport]);

  useEffect(() => {
    window.localStorage.setItem(
      VIEWPORT_FILTER_STORAGE_KEY,
      JSON.stringify(restrictToViewport),
    );
  }, [restrictToViewport]);

  async function loadPlaces(query: PlacesQuery) {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPlaces(query);
      setPlaces(data);
      setActivePlaceId((current) =>
        current && data.some((place) => place.id === current)
          ? current
          : data[0]?.id ?? null,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load places',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePlace(payload: CreatePlacePayload) {
    try {
      setSaving(true);
      setError(null);
      const createdPlace = await createPlace(payload);
      await loadPlaces(debouncedFilters);
      setActivePlaceId(createdPlace.id);
      setDraftCoordinates(null);
      setViewport({
        center: {
          latitude: createdPlace.latitude,
          longitude: createdPlace.longitude,
        },
        zoom: Math.max(viewport.zoom, 14),
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not create place',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePlace(payload: CreatePlacePayload) {
    if (!editingPlaceId) {
      return;
    }

    await handleUpdatePlaceById(editingPlaceId, payload);
  }

  async function handleUpdatePlaceById(
    placeId: number,
    payload: CreatePlacePayload,
  ) {
    try {
      setSaving(true);
      setError(null);
      const updatedPlace = await updatePlace(placeId, payload);
      await loadPlaces(debouncedFilters);
      setActivePlaceId(updatedPlace.id);
      setEditingPlaceId(null);
      setDraftCoordinates(null);
      setViewport({
        center: {
          latitude: updatedPlace.latitude,
          longitude: updatedPlace.longitude,
        },
        zoom: Math.max(viewport.zoom, 14),
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not update place',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlace(placeId: number) {
    try {
      setDeletingId(placeId);
      setError(null);
      await deletePlace(placeId);
      await loadPlaces(debouncedFilters);
      if (editingPlaceId === placeId) {
        setEditingPlaceId(null);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not delete place',
      );
    } finally {
      setDeletingId(null);
    }
  }

  function isPlaceInsideBounds(place: Place, bounds: MapBounds) {
    return (
      place.latitude <= bounds.north &&
      place.latitude >= bounds.south &&
      place.longitude <= bounds.east &&
      place.longitude >= bounds.west
    );
  }

  const visiblePlaces =
    restrictToViewport && mapBounds
      ? places.filter((place) => isPlaceInsideBounds(place, mapBounds))
      : places;
  const activePlace =
    visiblePlaces.find((place) => place.id === activePlaceId) ??
    places.find((place) => place.id === activePlaceId) ??
    null;
  const editingPlace =
    places.find((place) => place.id === editingPlaceId) ?? null;
  const appliedSearch = debouncedFilters.search?.trim() ?? '';
  const hasPendingFilters = filters.search !== debouncedFilters.search;
  const insights = useMemo(
    () => [
      restrictToViewport
        ? `${visiblePlaces.length} notes in the live viewport`
        : `${places.length} notes across the full dataset`,
      appliedSearch
        ? `Search: “${appliedSearch}”`
        : 'Search across titles and descriptions',
      draftCoordinates
        ? `Draft pinned at ${draftCoordinates.latitude.toFixed(3)}, ${draftCoordinates.longitude.toFixed(3)}`
        : editingPlace
          ? `Editing ${editingPlace.title}`
          : 'Click map to stage a new note',
    ],
    [
      appliedSearch,
      draftCoordinates,
      editingPlace,
      places.length,
      restrictToViewport,
      visiblePlaces.length,
    ],
  );

  return (
    <div className="app-shell">
      <PlacePopup
        place={activePlace}
        open={isPlacePopupOpen}
        onClose={() => setIsPlacePopupOpen(false)}
        saving={saving}
        onSave={async (payload) => {
          if (!activePlace) {
            return;
          }

          await handleUpdatePlaceById(activePlace.id, payload);
        }}
      />

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Geo Places</p>
          <h1>Click the map, capture a note, and let the viewport curate the feed.</h1>
          <p className="hero-text">
            Build a living note layer over the city: each map click becomes a draft,
            each drag changes the visible collection, and each filter tightens the
            spatial story in real time.
          </p>
        </div>
        <div className="hero-badge hero-badge-grid">
          <div>
            <span>Backend</span>
            <strong>localhost:3000</strong>
          </div>
          <div>
            <span>Visible now</span>
            <strong>{visiblePlaces.length}</strong>
          </div>
        </div>
      </header>

      <section className="insight-ribbon">
        {insights.map((insight) => (
          <div key={insight} className="insight-pill">
            {insight}
          </div>
        ))}
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        restrictToViewport={restrictToViewport}
        onToggleViewport={() => setRestrictToViewport((current) => !current)}
        totalCount={places.length}
        visibleCount={visiblePlaces.length}
        isSearching={loading && hasPendingFilters}
      />

      <main className="content-grid">
        <section className="map-panel panel">
          <div className="panel-header panel-header-row">
            <div>
              <p className="eyebrow">Map</p>
              <h2>Spatial overview</h2>
            </div>
            <div className="map-toolbar">
              <button
                className={`toggle-chip ${draftCoordinates ? 'active' : ''}`}
                onClick={() => setDraftCoordinates(null)}
                type="button"
              >
                {draftCoordinates ? 'Discard draft pin' : 'No draft pin'}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="empty-state">Loading places from the API...</div>
          ) : places.length > 0 ? (
            <PlacesMap
              places={places}
              activePlaceId={activePlaceId}
              onSelect={(placeId) => {
                setActivePlaceId(placeId);
              }}
              onOpenDetails={(placeId) => {
                setActivePlaceId(placeId);
                setIsPlacePopupOpen(true);
              }}
              draftCoordinates={draftCoordinates}
              onMapClick={(coordinates) => {
                setDraftCoordinates(coordinates);
                setActivePlaceId(null);
                setEditingPlaceId(null);
                setIsPlacePopupOpen(false);
              }}
              onBoundsChange={setMapBounds}
              viewport={viewport}
              onViewportChange={setViewport}
              aiRoutePlaceIds={aiRoutePlaceIds}
            />
          ) : (
            <PlacesMap
              places={[]}
              activePlaceId={activePlaceId}
              onSelect={(placeId) => {
                setActivePlaceId(placeId);
              }}
              onOpenDetails={(placeId) => {
                setActivePlaceId(placeId);
                setIsPlacePopupOpen(true);
              }}
              draftCoordinates={draftCoordinates}
              onMapClick={(coordinates) => {
                setDraftCoordinates(coordinates);
                setActivePlaceId(null);
                setEditingPlaceId(null);
                setIsPlacePopupOpen(false);
              }}
              onBoundsChange={setMapBounds}
              viewport={viewport}
              onViewportChange={setViewport}
              aiRoutePlaceIds={aiRoutePlaceIds}
            />
          )}
        </section>

        <div className="sidebar-stack">
          <PlaceForm
            onSubmit={editingPlace ? handleUpdatePlace : handleCreatePlace}
            loading={saving}
            draftCoordinates={draftCoordinates}
            onClearDraft={() => setDraftCoordinates(null)}
            editingPlace={editingPlace}
            onCancelEdit={() => setEditingPlaceId(null)}
          />
          <PlaceDetails
            place={activePlace}
            totalVisibleCount={visiblePlaces.length}
            onEdit={() => {
              if (!activePlace) {
                return;
              }

              setEditingPlaceId(activePlace.id);
              setDraftCoordinates(null);
              setIsPlacePopupOpen(false);
            }}
          />
          <AiPlanner
            places={visiblePlaces}
            onRouteChange={setAiRoutePlaceIds}
          />
          <PlacesList
            places={visiblePlaces}
            activePlaceId={activePlaceId}
            onSelect={(placeId) => {
              setActivePlaceId(placeId);
              setIsPlacePopupOpen(true);
            }}
            onDelete={handleDeletePlace}
            deletingId={deletingId}
            totalCount={places.length}
            viewportFiltering={restrictToViewport}
          />
        </div>
      </main>
    </div>
  );
}
