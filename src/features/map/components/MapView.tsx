import type { ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useLayersStore } from '@/features/layers';
import { useCoverageStore } from '@/shared/store/useCoverageStore';
import {
  DEFAULT_ZOOM,
  GEOPORTAL_WMS_OPTIONS,
  MAX_ZOOM,
  ORTHO_WMTS_URL,
  OSM_LAYER,
  POLAND_CENTER,
} from '../config/mapLayers';
import { NmtShadedLayer } from '../layers/NmtShadedLayer';
import { AreaMarkers } from './AreaMarkers';
import { CoverageLayer } from './CoverageLayer';
import { CustomLayers } from './CustomLayers';
import { DraftMarker } from './DraftMarker';
import { GuidanceLine } from './GuidanceLine';
import { MapEvents } from './MapEvents';
import { PointMarkers } from './PointMarkers';
import { RoughnessOverlay } from './RoughnessOverlay';
import { PositionMarker } from './PositionMarker';
import { TrackLines } from './TrackLines';
import { ZoneLayers } from './ZoneLayers';

interface MapViewProps {
  /** extra layers from other features (e.g. analysis candidates) */
  children?: ReactNode;
}

export function MapView({ children }: MapViewProps) {
  const { baseLayer, nmtOn, nmtOpacity } = useLayersStore();
  const showCoverage = useCoverageStore((s) => s.showCoverage);

  return (
    <MapContainer
      style={{ position: 'absolute', inset: 0 }}
      center={POLAND_CENTER}
      zoom={DEFAULT_ZOOM}
      maxZoom={MAX_ZOOM}
      zoomControl={false}
    >
      {baseLayer === 'osm' ? (
        <TileLayer
          key="osm"
          url={OSM_LAYER.url}
          attribution={OSM_LAYER.attribution}
          maxNativeZoom={OSM_LAYER.maxNativeZoom}
          maxZoom={MAX_ZOOM}
        />
      ) : (
        <TileLayer
          key="ortho"
          url={ORTHO_WMTS_URL}
          attribution={GEOPORTAL_WMS_OPTIONS.attribution}
          maxNativeZoom={19}
          maxZoom={MAX_ZOOM}
        />
      )}
      <CustomLayers />
      <RoughnessOverlay />
      {nmtOn && <NmtShadedLayer opacity={nmtOpacity} zIndex={50} maxZoom={MAX_ZOOM} />}
      <ZoneLayers />
      {showCoverage ? <CoverageLayer /> : <TrackLines />}
      <GuidanceLine />
      <AreaMarkers />
      <PointMarkers />
      <DraftMarker />
      {children}
      <PositionMarker />
      <MapEvents />
    </MapContainer>
  );
}
