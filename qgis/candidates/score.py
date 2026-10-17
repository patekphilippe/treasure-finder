"""Score 0–100 (docs/PLAN.md, "Ocena 0–100")."""
from shapely.geometry.base import BaseGeometry
from shapely.geometry import Point

from . import config
from .measure import Measurement


def shape_component(form: str, m: Measurement) -> float:
    if form in ("kopiec_okragly", "zaglebienie_okragle", "pierscien"):
        return m.circularity
    if form == "zaglebienie_prostokatne":
        return m.rectangularity
    if form in ("row_liniowy", "wal_liniowy"):
        return min(1.0, (m.elongation - 1) / (config.ELONGATION_FULL - 1))
    return config.SHAPE_UNDETERMINED


def context_component(x: float, y: float, features: list[BaseGeometry], clustered: bool) -> float:
    """1 at a context feature, linearly 0 at 300 m; +0.2 (max 1) inside a cluster of the same class."""
    best = 0.0
    if features:
        p = Point(x, y)
        d = min(f.distance(p) for f in features)
        best = max(0.0, 1 - d / config.CONTEXT_MAX_DISTANCE_M)
    if clustered:
        best += config.CLUSTER["bonus"]
    return min(1.0, best)


def score(form: str, m: Measurement, context: float, weights: dict = config.WEIGHTS) -> int:
    relief = min(1.0, abs(m.relief_m) / config.RELIEF_FULL_M)
    return round(weights["relief"] * relief + weights["shape"] * shape_component(form, m)
                 + weights["context"] * context)
