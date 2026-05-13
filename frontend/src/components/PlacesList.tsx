import { Place } from '../types';
import { TYPE_LABELS } from '../constants';

interface PlacesListProps {
  places: Place[];
  activePlaceId: number | null;
  onSelect: (placeId: number) => void;
  onDelete: (placeId: number) => Promise<void>;
  deletingId: number | null;
  totalCount: number;
  viewportFiltering: boolean;
}

export function PlacesList({
  places,
  activePlaceId,
  onSelect,
  onDelete,
  deletingId,
  totalCount,
  viewportFiltering,
}: PlacesListProps) {
  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <p className="eyebrow">Collection</p>
        <h2>
          {places.length} {viewportFiltering ? 'visible notes' : 'loaded notes'}
        </h2>
        <p className="section-copy">
          {viewportFiltering
            ? `${places.length} of ${totalCount} places are inside the current map frame.`
            : `All ${totalCount} loaded places are shown here.`}
        </p>
      </div>

      <div className="places-list">
        {places.length === 0 ? (
          <div className="list-empty">
            Move the map, relax filters, or click on the map to create a new note.
          </div>
        ) : null}
        {places.map((place) => (
          <article
            key={place.id}
            className={`place-card ${activePlaceId === place.id ? 'active' : ''}`}
            onClick={() => onSelect(place.id)}
          >
            <div className="place-card-top">
              <div>
                <h3>{place.title}</h3>
                <p>{TYPE_LABELS[place.type]}</p>
              </div>
              <span className="rating-pill">{place.rating.toFixed(1)}</span>
            </div>

            <p className="place-description">
              {place.description || 'No description yet.'}
            </p>

            {place.type === 'EVENT' ? (
              <div className="event-list-meta">
                <span>
                  {place.eventStartAt
                    ? new Date(place.eventStartAt).toLocaleString()
                    : 'Date TBD'}
                </span>
                <span>
                  {place.ticketPrice !== undefined && place.ticketPrice !== null
                    ? place.ticketPrice === 0
                      ? 'Free'
                      : `$${place.ticketPrice.toFixed(2)}`
                    : 'Ticket info pending'}
                </span>
              </div>
            ) : null}

            <div className="place-meta">
              <span>{place.address || 'Unknown address'}</span>
              <span>
                {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
              </span>
            </div>

            <button
              className="ghost-button"
              disabled={deletingId === place.id}
              onClick={(event) => {
                event.stopPropagation();
                void onDelete(place.id);
              }}
              type="button"
            >
              {deletingId === place.id ? 'Deleting...' : 'Delete'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
