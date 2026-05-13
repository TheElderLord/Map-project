import { FormEvent, useEffect, useState } from 'react';
import { PLACE_TYPES, TYPE_LABELS } from '../constants';
import { Coordinates, CreatePlacePayload, Place, PlaceType } from '../types';

const initialState: CreatePlacePayload = {
  title: '',
  description: '',
  type: 'CAFE',
  address: '',
  rating: 4,
  latitude: 43.238949,
  longitude: 76.889709,
};

interface PlaceFormProps {
  onSubmit: (payload: CreatePlacePayload) => Promise<void>;
  loading: boolean;
  draftCoordinates: Coordinates | null;
  onClearDraft: () => void;
  editingPlace: Place | null;
  onCancelEdit: () => void;
}

export function PlaceForm({
  onSubmit,
  loading,
  draftCoordinates,
  onClearDraft,
  editingPlace,
  onCancelEdit,
}: PlaceFormProps) {
  const [formState, setFormState] = useState<CreatePlacePayload>(initialState);
  const isEvent = formState.type === 'EVENT';

  useEffect(() => {
    if (!editingPlace) {
      return;
    }

    setFormState({
      title: editingPlace.title,
      description: editingPlace.description ?? '',
      type: editingPlace.type,
      address: editingPlace.address ?? '',
      rating: editingPlace.rating,
      latitude: editingPlace.latitude,
      longitude: editingPlace.longitude,
      eventStartAt: editingPlace.eventStartAt,
      ticketPrice: editingPlace.ticketPrice,
      eventDetails: editingPlace.eventDetails ?? '',
      ticketUrl: editingPlace.ticketUrl ?? '',
    });
  }, [editingPlace]);

  useEffect(() => {
    if (!draftCoordinates || editingPlace) {
      return;
    }

    setFormState((current) => ({
      ...current,
      latitude: Number(draftCoordinates.latitude.toFixed(6)),
      longitude: Number(draftCoordinates.longitude.toFixed(6)),
    }));
  }, [draftCoordinates, editingPlace]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(formState);
    setFormState(initialState);
    onClearDraft();
    onCancelEdit();
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-header panel-header-row">
        <div>
          <p className="eyebrow">{editingPlace ? 'Edit Note' : 'Create Note'}</p>
          <h2>{editingPlace ? 'Refine the selected place' : 'Drop a place from the map'}</h2>
        </div>
        <div className="form-actions">
          {editingPlace ? (
            <button
              className="ghost-button compact-button"
              onClick={onCancelEdit}
              type="button"
            >
              Cancel edit
            </button>
          ) : null}
          {draftCoordinates && !editingPlace ? (
            <button
              className="ghost-button compact-button"
              onClick={onClearDraft}
              type="button"
            >
              Clear pin
            </button>
          ) : null}
        </div>
      </div>

      {isEvent ? (
        <div className="event-callout">
          <strong>Upcoming event mode</strong>
          <span>
            Add date, ticket info, and program details so this note behaves as a
            full event card across the map and popups.
          </span>
        </div>
      ) : null}

      <div
        className={`draft-banner ${
          draftCoordinates || editingPlace ? 'active' : ''
        }`}
      >
        {editingPlace ? (
          <>
            <strong>Editing existing note</strong>
            <span>
              Update title, description, coordinates, rating, or type and save.
            </span>
          </>
        ) : draftCoordinates ? (
          <>
            <strong>Pinned from map click</strong>
            <span>
              {draftCoordinates.latitude.toFixed(5)},{' '}
              {draftCoordinates.longitude.toFixed(5)}
            </span>
          </>
        ) : (
          <>
            <strong>Tip</strong>
            <span>Click anywhere on the map to prefill note coordinates.</span>
          </>
        )}
      </div>

      <label>
        <span>Title</span>
        <input
          value={formState.title}
          onChange={(event) =>
            setFormState((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Coffee Boom"
          required
        />
      </label>

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
          rows={3}
          placeholder="What makes this place worth saving?"
        />
      </label>

      <div className="grid two-columns">
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

      <label>
        <span>Address</span>
        <input
          value={formState.address}
          onChange={(event) =>
            setFormState((current) => ({ ...current, address: event.target.value }))
          }
          placeholder="Almaty"
        />
      </label>

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
                placeholder="0 for free"
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
              placeholder="Lineup, agenda, speakers, highlights..."
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

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? 'Saving...' : editingPlace ? 'Update note' : 'Save note'}
      </button>
    </form>
  );
}
