import type { Feature, FeatureCollection, MultiLineString } from 'geojson';
import type { Track } from '@/shared/types/domain';

/** One MultiLineString per track (a line per segment); tracks with nothing drawable are skipped. */
export function toTracksGeoJSON(tracks: readonly Track[]): FeatureCollection<MultiLineString> {
  const features: Feature<MultiLineString>[] = [];
  for (const { segments, ...props } of tracks) {
    const lines = segments
      .filter((s) => s.length >= 2)
      .map((s) => s.map(([lat, lng]) => [lng, lat]));
    if (lines.length === 0) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'MultiLineString', coordinates: lines },
      properties: props,
    });
  }
  return { type: 'FeatureCollection', features };
}
