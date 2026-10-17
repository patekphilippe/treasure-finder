import { useRoughnessStore } from '@/features/roughness';
import { RoughnessLayer } from '../layers/RoughnessLayer';

export function RoughnessOverlay() {
  const raster = useRoughnessStore((s) => s.result?.raster);
  const visible = useRoughnessStore((s) => s.visible);
  const opacity = useRoughnessStore((s) => s.opacity);
  if (!raster || !visible) return null;
  return <RoughnessLayer source={raster} opacity={opacity} />;
}
