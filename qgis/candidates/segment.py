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
