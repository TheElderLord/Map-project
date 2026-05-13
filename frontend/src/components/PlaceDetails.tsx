import { TYPE_LABELS } from '../constants';
import { Place } from '../types';

interface PlaceDetailsProps {
  place: Place | null;
  totalVisibleCount: number;
  onEdit: () => void;
}

export function PlaceDetails({
  place,
  totalVisibleCount,
  onEdit,
}: PlaceDetailsProps) {
  if (!place) {
    return (
      <section className="panel detail-panel detail-panel-empty">
        <div className="panel-header">
          <p className="eyebrow">Details</p>
          <h2>Choose a note</h2>
          <p className="section-copy">
            Select a marker or card to inspect it here. You currently have{' '}
            {totalVisibleCount} notes in the active view.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel detail-panel">
      <div className="panel-header">
        <p className="eyebrow">Details</p>
        <h2>{place.title}</h2>
        <p className="section-copy">
          {TYPE_LABELS[place.type]} · Updated{' '}
          {new Date(place.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="detail-topline">
        <span className="rating-pill large">{place.rating.toFixed(1)}</span>
        <span className="detail-chip">{place.address || 'Unknown address'}</span>
        <button
          className="ghost-button compact-button detail-edit-button"
          onClick={onEdit}
          type="button"
        >
          Edit
        </button>
      </div>

      <p className="detail-description">
        {place.description || 'No description yet. This note is waiting for context.'}
      </p>

      {place.type === 'EVENT' ? (
        <div className="event-detail-panel">
          <div className="event-detail-topline">
            <span className="event-pill">
              {place.eventStartAt
                ? new Date(place.eventStartAt).toLocaleString()
                : 'Date TBD'}
            </span>
            <span className="event-pill secondary">
              {place.ticketPrice !== undefined && place.ticketPrice !== null
                ? place.ticketPrice === 0
                  ? 'Free entry'
                  : `$${place.ticketPrice.toFixed(2)}`
                : 'Ticket info pending'}
            </span>
          </div>
          <p className="event-detail-copy">
            {place.eventDetails || 'No event program yet. Add details in edit mode.'}
          </p>
          {place.ticketUrl ? (
            <a
              className="event-link"
              href={place.ticketUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open ticket page
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="detail-card">
          <span>Latitude</span>
          <strong>{place.latitude.toFixed(6)}</strong>
        </div>
        <div className="detail-card">
          <span>Longitude</span>
          <strong>{place.longitude.toFixed(6)}</strong>
        </div>
        <div className="detail-card">
          <span>Created</span>
          <strong>{new Date(place.createdAt).toLocaleString()}</strong>
        </div>
        <div className="detail-card">
          <span>Type</span>
          <strong>{TYPE_LABELS[place.type]}</strong>
        </div>
      </div>
    </section>
  );
}
