import { useFollowPosition } from '../hooks/useFollowPosition';

/** Renderless child of MapContainer that drives position following. */
export function FollowController() {
  useFollowPosition();
  return null;
}
