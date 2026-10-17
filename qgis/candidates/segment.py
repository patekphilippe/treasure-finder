"""Masks, morphological opening and 8-connected components."""
import numpy as np
from scipy import ndimage

EIGHT = np.ones((3, 3), dtype=bool)


def masks(lrm: np.ndarray, ok: np.ndarray, threshold: float) -> tuple[np.ndarray, np.ndarray]:
    return (lrm > threshold) & ok, (lrm < -threshold) & ok


def open_mask(mask: np.ndarray, radius_cells: int) -> np.ndarray:
    if radius_cells <= 0:
        return mask
    return ndimage.binary_opening(mask, structure=EIGHT, iterations=radius_cells)


def components(mask: np.ndarray) -> tuple[np.ndarray, int]:
    return ndimage.label(mask, structure=EIGHT)


def split_component(comp: np.ndarray, lrm: np.ndarray, sign: int, threshold: float, cell: float,
                    min_separation_m: float, min_depth_factor: float) -> list[np.ndarray]:
    """Splits a blob of merged pits (or mounds) between its separate extrema: every cell goes to
    the nearest extremum (Voronoi inside the blob). Returns [comp] when there is only one."""
    v = np.where(comp, -sign * lrm, 0.0)  # extrema of the feature become minima
    size = 2 * max(1, round(min_separation_m / cell)) + 1
    minima = comp & (v == ndimage.minimum_filter(v, size=size)) & (v < -threshold * min_depth_factor)
    markers, n = ndimage.label(minima, structure=EIGHT)
    if n < 2:
        return [comp]
    # (scipy's watershed_ift splits two identical pits 244:12 — nearest-extremum is predictable)
    _, (ri, ci) = ndimage.distance_transform_edt(markers == 0, return_indices=True)
    regions = markers[ri, ci]
    parts = [comp & (regions == k) for k in range(1, n + 1)]
    return [part for part in parts if part.any()]
