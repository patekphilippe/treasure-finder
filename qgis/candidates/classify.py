"""Threshold classification (docs/PLAN.md, table "Klasyfikacja")."""
import math

from . import config
from .measure import Measurement


def _within(value: float, bounds: tuple[float, float]) -> bool:
    return bounds[0] <= value <= bounds[1]


def classify(m: Measurement, rules: dict = config.RULES) -> str:
    sign = 1 if m.relief_m > 0 else -1
    height = abs(m.relief_m)
    for form, r in rules.items():
        if r["sign"] != sign:
            continue
        if form == "pierscien":
            ok = m.holes >= r["min_holes"] and _within(m.length_m, r["diameter_m"])
        elif form in ("kopiec_okragly", "zaglebienie_okragle"):
            ok = m.circularity > r["circularity"] and _within(m.equivalent_diameter_m, r["diameter_m"])
            if "height_m" in r:
                ok = ok and _within(height, r["height_m"])
        elif form == "zaglebienie_prostokatne":
            ok = (m.rectangularity > r["rectangularity"]
                  and _within(m.length_m, r["sides_m"]) and _within(m.width_m, r["sides_m"]))
        elif form == "row_liniowy":
            ok = m.elongation > r["elongation"] and _within(m.width_m, r["width_m"])
        elif form == "wal_liniowy":
            ok = m.elongation > r["elongation"]
        else:
            raise ValueError(f"unknown rule {form}")
        if ok:
            return form
    return "nieokreslony"


def protected_by_shape(form: str, m: Measurement) -> bool:
    if form in config.PROTECTED_CLASSES:
        return True
    p = config.PROTECTED_MOUND
    return (form == "kopiec_okragly" and m.equivalent_diameter_m >= p["min_diameter_m"]
            and abs(m.relief_m) >= p["min_height_m"])


def barrow_sized(form: str, m: Measurement) -> bool:
    bc = config.BARROW_CEMETERY
    return (form == "kopiec_okragly" and m.equivalent_diameter_m >= bc["min_diameter_m"]
            and abs(m.relief_m) >= bc["min_height_m"])


def neighbours_within(xy: list[tuple[float, float]], i: int, radius: float, same: list[bool]) -> int:
    """How many items (including i) of the same group lie within `radius` of item i."""
    x0, y0 = xy[i]
    return sum(1 for j, (x, y) in enumerate(xy) if same[j] and math.hypot(x - x0, y - y0) <= radius)
