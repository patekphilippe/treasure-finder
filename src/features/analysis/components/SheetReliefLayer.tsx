import { Image2180Layer } from '@/features/map';
import { useReliefSources } from '../hooks/useReliefSources';
import { useReliefStore } from '../store/useReliefStore';

/** The chosen relief layer (LRM, hillshade or slope) of every analysed sheet. */
export function SheetReliefLayer() {
  const sources = useReliefSources();
  const opacity = useReliefStore((s) => s.opacity);
  return sources.map(({ id, source }) => (
    <Image2180Layer key={id} source={source} opacity={opacity} zIndex={52} />
  ));
}
