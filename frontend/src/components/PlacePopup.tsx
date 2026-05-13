import { FormEvent, useEffect, useState } from 'react';
import { PLACE_TYPES, TYPE_LABELS } from '../constants';
import { CreatePlacePayload, Place, PlaceType } from '../types';

interface PlacePopupProps {
  place: Place | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreatePlacePayload) => Promise<void>;
  saving: boolean;
}

export function PlacePopup({
  place,
  open,
  onClose,
  onSave,
  saving,
}: PlacePopupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<CreatePlacePayload>({
    title: '',
    description: '',
    type: 'CAFE',
    address: '',
    rating: 4,
    latitude: 43.238949,
    longitude: 76.889709,
    eventStartAt: undefined,
    ticketPrice: undefined,
    eventDetails: '',
    ticketUrl: '',
  });

  useEffect(() => {
    if (!place) {
      return;
    }

    setFormState({
      title: place.title,
      description: place.description ?? '',
      type: place.type,
      address: place.address ?? '',
      rating: place.rating,
      latitude: place.latitude,
      longitude: place.longitude,
      eventStartAt: place.eventStartAt,
      ticketPrice: place.ticketPrice,
      eventDetails: place.eventDetails ?? '',
      ticketUrl: place.ticketUrl ?? '',
    });
    setIsEditing(false);
  }, [place]);

  if (!open || !place) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave(formState);
    setIsEditing(false);
  }

  const isEvent = formState.type === 'EVENT';

  return (
    <div className="popup-backdrop" onClick={onClose} role="presentation">
      <section
        className="popup-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-popup-title"
      >
        <div className="popup-header">
          <div>
            <p className="eyebrow">{isEditing ? 'Edit Note' : 'Selected Note'}</p>
            <h2 id="place-popup-title">{place.title}</h2>
            <p className="section-copy">
              {TYPE_LABELS[place.type]} · {place.rating.toFixed(1)} ·{' '}
              {place.address || 'Unknown address'}
            </p>
          </div>
          <button className="popup-close" onClick={onClose} type="button">
            Close
          </button>
        </div>

        {isEditing ? (
          <form className="popup-form" onSubmit={handleSubmit}>
            <div className="grid two-columns">
              <label>
                <span>Title</span>
                <input
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                <span>Type</span>
                <select
                  value={formState.type}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      type: event.target.value as PlaceType,
                    }))
                  }
                >
                  {PLACE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea
                value={formState.description}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
              />
            </label>

            {isEvent ? (
              <>
                <div className="grid two-columns">
                  <label>
                    <span>Event date</span>
                    <input
                      type="datetime-local"
                      value={formState.eventStartAt?.slice(0, 16) ?? ''}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          eventStartAt: event.target.value
                            ? new Date(event.target.value).toISOString()
                            : undefined,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Ticket price</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.ticketPrice ?? ''}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          ticketPrice: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        }))
                      }
                    />
                  </label>
                </div>

                <label>
                  <span>What will happen</span>
                  <textarea
                    value={formState.eventDetails ?? ''}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        eventDetails: event.target.value,
                      }))
                    }
                    rows={4}
                  />
                </label>

                <label>
                  <span>Ticket link</span>
                  <input
                    type="url"
                    value={formState.ticketUrl ?? ''}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        ticketUrl: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </label>
              </>
            ) : null}

            <div className="grid two-columns">
              <label>
                <span>Address</span>
                <input
                  value={formState.address}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Rating</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formState.rating}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      rating: Number(event.target.value),
                    }))
                  }
                  required
                />
              </label>
            </div>

            <div className="grid two-columns">
              <label>
                <span>Latitude</span>
                <input
                  type="number"
                  step="0.000001"
                  value={formState.latitude}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      latitude: Number(event.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label>
                <span>Longitude</span>
                <input
                  type="number"
                  step="0.000001"
                  value={formState.longitude}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      longitude: Number(event.target.value),
                    }))
                  }
                  required
                />
              </label>
            </div>

            <div className="popup-actions">
              <button
                className="ghost-button compact-button"
                onClick={() => setIsEditing(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="primary-button compact-button"
                disabled={saving}
                type="submit"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="popup-description">
              {place.description ||
                'No description yet. Add more context by editing this note.'}
            </p>

            {place.type === 'EVENT' ? (
              <>
                <div className="popup-event-banner">
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
                <p className="popup-event-copy">
                  {place.eventDetails || 'No event program yet.'}
                </p>
              </>
            ) : null}

            <div className="popup-grid">
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
                <span>Updated</span>
                <strong>{new Date(place.updatedAt).toLocaleString()}</strong>
              </div>
            </div>

            <div className="popup-actions">
              <button
                className="ghost-button compact-button"
                onClick={onClose}
                type="button"
              >
                Dismiss
              </button>
              <button
                className="primary-button compact-button"
                onClick={() => setIsEditing(true)}
                type="button"
              >
                Edit note
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
