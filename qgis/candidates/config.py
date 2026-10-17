"""All thresholds and weights in one place — calibrate here (docs/PLAN.md, Etap 1)."""

# Local relief model: DEM minus mean-filtered DEM within this radius.
LRM_RADIUS_M = 15.0  # slider 5–30 m

# Convex where LRM > +t, concave where LRM < −t.
THRESHOLD_M = 0.25  # slider 0.10–0.80 m

# Morphological opening radius in cells. NOTE: it removes features narrower
# than 2·r+1 cells — at a 1 m grid, r=1 drops ditches narrower than 3 m.
OPENING_RADIUS_CELLS = 1

MIN_AREA_M2 = 4.0
MAX_AREA_M2 = 5000.0
MIN_HOLE_M2 = 4.0  # smaller enclosed gaps are noise, not a ring's centre

# Classification rules, checked in this order. Diameters are equivalent
# diameters (from area), except the ring which uses its outer length.
RULES = {
    "pierscien": {"sign": +1, "min_holes": 1, "diameter_m": (30, 200)},
    "kopiec_okragly": {"sign": +1, "circularity": 0.7, "diameter_m": (3, 40), "height_m": (0.3, 3)},
    "zaglebienie_okragle": {"sign": -1, "circularity": 0.65, "diameter_m": (2, 20)},
    "zaglebienie_prostokatne": {"sign": -1, "rectangularity": 0.8, "sides_m": (2, 15)},
    "row_liniowy": {"sign": -1, "elongation": 4, "width_m": (0.5, 4)},
    "wal_liniowy": {"sign": +1, "elongation": 4},
}

# Probably an archaeological monument — never a search target.
PROTECTED_MOUND = {"min_diameter_m": 8, "min_height_m": 0.5}
PROTECTED_CLASSES = {"pierscien"}
BARROW_CEMETERY = {"min_count": 3, "radius_m": 50}

# Score 0–100 = relief·w + shape·w + context·w
WEIGHTS = {"relief": 40, "shape": 25, "context": 35}
RELIEF_FULL_M = 1.0  # |relief| giving the full relief component
SHAPE_UNDETERMINED = 0.2
ELONGATION_FULL = 10.0  # elongation giving the full shape component for linear forms
CONTEXT_MAX_DISTANCE_M = 300.0
CLUSTER = {"min_count": 3, "radius_m": 50, "bonus": 0.2}
