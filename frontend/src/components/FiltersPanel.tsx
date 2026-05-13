import { ChangeEvent } from 'react';
import { PLACE_TYPES, TYPE_LABELS } from '../constants';
import { PlacesQuery } from '../types';

interface FiltersPanelProps {
  filters: PlacesQuery;
  onChange: (next: PlacesQuery) => void;
  restrictToViewport: boolean;
  onToggleViewport: () => void;
  totalCount: number;
  visibleCount: number;
  isSearching: boolean;
}

export function FiltersPanel({
  filters,
  onChange,
  restrictToViewport,
  onToggleViewport,
  totalCount,
  visibleCount,
  isSearching,
}: FiltersPanelProps) {
  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    onChange({
      ...filters,
      [name]:
        event.target instanceof HTMLInputElement &&
        event.target.type === 'checkbox'
          ? event.target.checked
          : value,
    });
  }

  return (
    <section className="panel filters-panel">
      <div className="panel-header panel-header-row">
        <div>
          <p className="eyebrow">Filters</p>
          <h2>Tune the view</h2>
        </div>
        <div className="stats-strip">
          <div className="stat-chip">
            <span>Loaded</span>
            <strong>{totalCount}</strong>
          </div>
          <div className="stat-chip accent">
            <span>In view</span>
            <strong>{visibleCount}</strong>
          </div>
        </div>
      </div>

      <div className="grid filters-grid">
        <label>
          <span>Search</span>
          <input
            name="search"
            value={filters.search ?? ''}
            onChange={updateField}
            placeholder="Cafe, park, coffee..."
          />
        </label>

        <label>
          <span>Type</span>
          <select name="type" value={filters.type ?? ''} onChange={updateField}>
            <option value="">All types</option>
            {PLACE_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Min rating</span>
          <input
            name="minRating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={filters.minRating ?? ''}
            onChange={updateField}
          />
        </label>

        <label className="checkbox-field">
          <span>Upcoming only</span>
          <input
            name="upcomingOnly"
            type="checkbox"
            checked={filters.upcomingOnly ?? false}
            onChange={updateField}
          />
        </label>

        <label>
          <span>Sort by</span>
          <select
            name="sortBy"
            value={filters.sortBy ?? 'createdAt'}
            onChange={updateField}
          >
            <option value="createdAt">Newest</option>
            <option value="eventStartAt">Event date</option>
            <option value="rating">Rating</option>
            <option value="title">Title</option>
          </select>
        </label>

        <label>
          <span>Order</span>
          <select
            name="sortOrder"
            value={filters.sortOrder ?? 'desc'}
            onChange={updateField}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>

      <div className="filters-footer">
        <button
          className={`toggle-chip ${restrictToViewport ? 'active' : ''}`}
          onClick={onToggleViewport}
          type="button"
        >
          {restrictToViewport ? 'Viewport filter on' : 'Viewport filter off'}
        </button>
        <p className="filters-hint">
          {isSearching
            ? 'Refreshing notes for the new query...'
            : 'Pan or zoom the map to update visible notes dynamically.'}
        </p>
      </div>
    </section>
  );
}
