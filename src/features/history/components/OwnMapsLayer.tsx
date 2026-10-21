import { useEffect, useMemo } from 'react';
import { useLayersStore } from '@/features/layers';
import { WarpedImageLayer, type WarpedImage } from '@/features/map';
import { crsTransform } from '@/shared/lib/geo';
import { invertHomography } from '@/shared/lib/georef';
import { useOwnMapImages } from '../hooks/useOwnMapImages';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { shownMaps } from '../utils/shownMaps';

/** The user's own historical maps, warped onto the map above the base layer. */
export function OwnMapsLayer() {
  const all = useOwnMapsStore((s) => s.maps);
  const years = useOwnMapsStore((s) => s.years);
  // the ones on the map, marked visible so their images are decoded
  const maps = useMemo(
    () => shownMaps(all, years).map((m) => ({ ...m, visible: true })),
    [all, years],
  );
  const images = useOwnMapImages(maps);
  // one opacity for all old maps (Warstwy); the map being fitted keeps its own
  const opacity = useLayersStore((s) => s.historicalOpacity);
  const fittingId = useOwnMapsStore((s) => s.fitting?.id ?? null);

  useEffect(() => {
    void useOwnMapsStore.getState().load();
  }, []);

  const layers = useMemo(
    () =>
      maps
        .filter((m) => m.visible && images[m.id])
        .map((m) => {
          const crs = crsTransform(m.epsg);
          if (!crs) return null;
          const source: WarpedImage = {
            image: images[m.id]!,
            width: m.width,
            height: m.height,
            sourceToPixel: invertHomography(m.pixelToSource),
            crs,
          };
          return { id: m.id, source, opacity: fittingId === m.id ? m.opacity : opacity };
        })
        .filter((l) => l !== null),
    [maps, images, opacity, fittingId],
  );

  return layers.map((l) => (
    <WarpedImageLayer key={l.id} source={l.source} opacity={l.opacity} zIndex={40} />
  ));
}
