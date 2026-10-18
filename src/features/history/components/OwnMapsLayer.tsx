import { useEffect, useMemo } from 'react';
import { WarpedImageLayer, type WarpedImage } from '@/features/map';
import { crsTransform } from '@/shared/lib/geo';
import { invertHomography } from '@/shared/lib/georef';
import { useOwnMapImages } from '../hooks/useOwnMapImages';
import { useOwnMapsStore } from '../store/useOwnMapsStore';

/** The user's own historical maps, warped onto the map above the base layer. */
export function OwnMapsLayer() {
  const maps = useOwnMapsStore((s) => s.maps);
  const images = useOwnMapImages(maps);

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
            sourceToPixel: invertHomography(m.pixelToSource),
            crs,
          };
          return { id: m.id, source, opacity: m.opacity };
        })
        .filter((l) => l !== null),
    [maps, images],
  );

  return layers.map((l) => (
    <WarpedImageLayer key={l.id} source={l.source} opacity={l.opacity} zIndex={40} />
  ));
}
