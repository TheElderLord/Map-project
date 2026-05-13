import { FormEvent, useMemo, useState } from 'react';
import { generateAiRecommendation } from '../api';
import { AiRecommendationResponse, Place } from '../types';

interface AiPlannerProps {
  places: Place[];
  onRouteChange: (placeIds: number[]) => void;
}

const quickPrompts = [
  'Plan a relaxed two hour walk',
  'Find the best food and coffee stops',
  'Pick family friendly places',
];

export function AiPlanner({ places, onRouteChange }: AiPlannerProps) {
  const [prompt, setPrompt] = useState(quickPrompts[0]);
  const [result, setResult] = useState<AiRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeContext = useMemo(
    () =>
      places.slice(0, 40).map((place) => ({
        id: place.id,
        title: place.title,
        description: place.description,
        type: place.type,
        address: place.address,
        rating: place.rating,
        latitude: place.latitude,
        longitude: place.longitude,
        eventStartAt: place.eventStartAt,
        ticketPrice: place.ticketPrice,
        eventDetails: place.eventDetails,
      })),
    [places],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const recommendation = await generateAiRecommendation({
        prompt: prompt.trim(),
        places: placeContext,
      });
      setResult(recommendation);
      onRouteChange(recommendation.usedPlaces);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not generate AI recommendation',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel ai-panel">
      <div className="panel-header">
        <p className="eyebrow">AI Planner</p>
        <h2>Ask the current map</h2>
      </div>

      <div className="ai-context-line">
        <strong>{places.length}</strong>
        <span>visible places available for this request</span>
      </div>

      <form className="ai-form" onSubmit={handleSubmit}>
        <label>
          <span>Goal</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            placeholder="Example: build an evening route with dinner and a view"
          />
        </label>

        <div className="ai-quick-prompts">
          {quickPrompts.map((quickPrompt) => (
            <button
              className="toggle-chip"
              key={quickPrompt}
              onClick={() => setPrompt(quickPrompt)}
              type="button"
            >
              {quickPrompt}
            </button>
          ))}
        </div>

        <button
          className="primary-button"
          disabled={loading || placeContext.length === 0}
          type="submit"
        >
          {loading ? 'Thinking...' : 'Generate plan'}
        </button>
      </form>

      {error ? <div className="inline-error">{error}</div> : null}

      {result ? (
        <div className="ai-result">
          <div className="ai-result-topline">
            <span>
              {result.provider === 'local'
                ? 'Local fallback'
                : `${result.provider.toUpperCase()} response`}
            </span>
            <span>{result.usedPlaces.length} places</span>
          </div>
          <p>{result.summary}</p>
          {result.fallbackReason ? (
            <p className="ai-fallback-reason">{result.fallbackReason}</p>
          ) : null}
          <ol>
            {result.steps.map((step) => (
              <li key={`${step.title}-${step.reason}`}>
                <strong>{step.title}</strong>
                <span>{step.reason}</span>
              </li>
            ))}
          </ol>
          <button
            className="ghost-button compact-button ai-clear-route"
            onClick={() => {
              setResult(null);
              onRouteChange([]);
            }}
            type="button"
          >
            Clear map route
          </button>
        </div>
      ) : null}
    </section>
  );
}
