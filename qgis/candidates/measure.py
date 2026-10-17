"""Shape measurements of one connected component."""
import math
from dataclasses import dataclass

import numpy as np
from scipy import ndimage


@dataclass
class Measurement:
    row: float  # centroid, cells
    col: float
    area_m2: float
    perimeter_m: float
    length_m: float  # extent along the main PCA axis
    width_m: float  # extent across it
    relief_m: float  # signed LRM with the largest magnitude: + convex, − concave
    circularity: float  # 4πA/P², 1 = disk
    elongation: float  # L/W
    rectangularity: float  # A / (L·W)
    holes: int
    equivalent_diameter_m: float


def crofton_perimeter(mask: np.ndarray, cell: float) -> float:
    """Perimeter from boundary crossings in 4 directions (Crofton) — unbiased for round shapes,
    unlike counting pixel edges (which inflates a disk's perimeter by 4/π)."""
    m = np.pad(mask, 1)
    n0 = np.count_nonzero(m[:, 1:] != m[:, :-1])
    n90 = np.count_nonzero(m[1:, :] != m[:-1, :])
    n45 = np.count_nonzero(m[1:, 1:] != m[:-1, :-1])
    n135 = np.count_nonzero(m[1:, :-1] != m[:-1, 1:])
    return math.pi / 8 * (n0 + n90 + (n45 + n135) / math.sqrt(2)) * cell


def count_holes(mask: np.ndarray, min_cells: int, closing_cells: int = 0) -> int:
    """Enclosed background areas; small gaps in the rim are closed first."""
    if closing_cells > 0:
        pad = closing_cells + 1
        mask = ndimage.binary_closing(np.pad(mask, pad), structure=np.ones((3, 3), bool),
                                      iterations=closing_cells)[pad:-pad, pad:-pad]
    holes = ndimage.binary_fill_holes(mask) & ~mask
    labels, n = ndimage.label(holes)
    if n == 0:
        return 0
    sizes = ndimage.sum_labels(holes, labels, index=np.arange(1, n + 1))
    return int(np.count_nonzero(sizes >= min_cells))


def measure(mask: np.ndarray, lrm: np.ndarray, offset: tuple[int, int], cell: float,
            min_hole_m2: float, ring_closing_cells: int = 0) -> Measurement:
    """`mask` and `lrm` are crops around the component; `offset` = crop's (row, col) in the sheet."""
    rows, cols = np.nonzero(mask)
    n = rows.size
    area = n * cell * cell
    perimeter = crofton_perimeter(mask, cell)

    values = lrm[rows, cols]
    relief = float(values[np.argmax(np.abs(values))])

    pts = np.stack([cols, rows]).astype(np.float64)
    centered = pts - pts.mean(axis=1, keepdims=True)
    if n > 1:
        _, vecs = np.linalg.eigh(np.cov(centered))
        major, minor = vecs[:, 1], vecs[:, 0]
    else:
        major, minor = np.array([1.0, 0.0]), np.array([0.0, 1.0])
    extent = lambda axis: (np.ptp(axis @ centered) + 1) * cell  # noqa: E731
    length, width = extent(major), extent(minor)
    if width > length:
        length, width = width, length

    return Measurement(
        row=offset[0] + rows.mean(),
        col=offset[1] + cols.mean(),
        area_m2=area,
        perimeter_m=perimeter,
        length_m=length,
        width_m=width,
        relief_m=relief,
        circularity=min(1.0, 4 * math.pi * area / perimeter**2) if perimeter else 0.0,
        elongation=length / width,
        rectangularity=min(1.0, area / (length * width)),
        holes=count_holes(mask, max(1, round(min_hole_m2 / (cell * cell))), ring_closing_cells),
        equivalent_diameter_m=2 * math.sqrt(area / math.pi),
    )
