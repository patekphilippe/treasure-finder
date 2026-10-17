"""Synthetic terrain models from docs/PLAN.md ("Testy"): 200×200 cells at 0.5 m (100×100 m)."""
import math

import numpy as np

from candidates.grid import Grid

N, CELL = 200, 0.5
ORIGIN_X, ORIGIN_Y = 500_000.0, 400_000.0  # EPSG:2180, central Poland


def xy():
    rows, cols = np.mgrid[0:N, 0:N]
    return (cols + 0.5) * CELL, (rows + 0.5) * CELL  # metres from the top-left corner


def grid(dem: np.ndarray) -> Grid:
    return Grid(dem=dem.astype(np.float32), cell=CELL, origin_x=ORIGIN_X, origin_y=ORIGIN_Y)


def plane(slope_deg: float = 2.0) -> np.ndarray:
    x, _ = xy()
    return 150 + math.tan(math.radians(slope_deg)) * x


def gaussian_mound(height=1.0, radius=8.0, cx=50.0, cy=50.0) -> np.ndarray:
    """`radius` ≈ 2σ: where the mound fades into the plane."""
    x, y = xy()
    sigma = radius / 2
    return height * np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * sigma**2))


def cone_crater(depth=1.5, diameter=8.0, cx=50.0, cy=50.0) -> np.ndarray:
    x, y = xy()
    r = np.hypot(x - cx, y - cy)
    return -depth * np.clip(1 - r / (diameter / 2), 0, None)


def trench(width=1.5, length=60.0, depth=0.8, cx=50.0, cy=50.25) -> np.ndarray:
    """Axis on a cell centre, so 1.5 m = exactly 3 cells at 0.5 m."""
    x, y = xy()
    inside = (np.abs(x - cx) <= length / 2) & (np.abs(y - cy) <= width / 2)
    return np.where(inside, -depth, 0.0)


def ring(outer=36.0, inner=26.0, height=1.0, cx=50.0, cy=50.0) -> np.ndarray:
    x, y = xy()
    r = np.hypot(x - cx, y - cy)
    return np.where((r >= inner / 2) & (r <= outer / 2), height, 0.0)


def noise(sigma=0.05, seed=1) -> np.ndarray:
    return np.random.default_rng(seed).normal(0, sigma, (N, N))
