"""Whole analysis for one sheet: LRM → masks → components → measure → classify → score."""
from dataclasses import dataclass, field

import numpy as np
from osgeo import osr
from scipy import ndimage
from shapely.geometry.base import BaseGeometry

from . import config
from .classify import barrow_sized, classify, neighbours_within, protected_by_shape
from .grid import Grid, fill_nodata, local_relief, valid_zone
from .measure import Measurement, measure
from .score import context_component, score
from .segment import components, masks, open_mask, split_component


@dataclass
class Params:
    lrm_radius_m: float = config.LRM_RADIUS_M
    threshold_m: float = config.THRESHOLD_M
    opening_radius_cells: int = config.OPENING_RADIUS_CELLS
    min_area_m2: float = config.MIN_AREA_M2
    max_area_m2: float = config.MAX_AREA_M2
    weights: dict = field(default_factory=lambda: dict(config.WEIGHTS))


@dataclass
class Result:
    candidates: list[dict]
    labels: np.ndarray  # candidate index + 1 per cell, 0 elsewhere
    lrm: np.ndarray


def _to_wgs84():
    src = osr.SpatialReference(); src.ImportFromEPSG(2180)
    dst = osr.SpatialReference(); dst.ImportFromEPSG(4326)
    for s in (src, dst):
        s.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    return osr.CoordinateTransformation(src, dst)


def analyse(grid: Grid, sheet_id: str, context: list[BaseGeometry] | None = None,
            params: Params | None = None, exclude: np.ndarray | None = None) -> Result:
    """`exclude`: cells to ignore (buildings, built-up areas) — see candidates.exclude."""
    p = params or Params()
    cell = grid.cell
    radius = max(1, round(p.lrm_radius_m / cell))
    lrm = local_relief(fill_nodata(grid.dem), radius)
    ok = valid_zone(grid.nodata, radius)
    if exclude is not None:
        ok &= ~exclude
    convex, concave = masks(lrm, ok, p.threshold_m)

    min_cells = p.min_area_m2 / (cell * cell)
    max_cells = p.max_area_m2 / (cell * cell)
    found: list[tuple[Measurement, str, np.ndarray, tuple]] = []
    split = config.SPLIT
    for sign, mask in ((1, convex), (-1, concave)):
        labels, n = components(open_mask(mask, p.opening_radius_cells))
        if n == 0:
            continue
        sizes = np.bincount(labels.ravel())
        for idx, slc in enumerate(ndimage.find_objects(labels), start=1):
            if slc is None or not (min_cells <= sizes[idx] <= max_cells):
                continue
            offset = (slc[0].start, slc[1].start)
            comp = labels[slc] == idx
            m = measure(comp, lrm[slc], offset, cell, config.MIN_HOLE_M2, config.RING_CLOSING_CELLS)
            parts = [comp]
            if m.area_m2 >= split["min_area_m2"] and m.elongation < split["max_elongation"] and m.holes == 0:
                parts = split_component(comp, lrm[slc], sign, p.threshold_m, cell,
                                        split["min_separation_m"], split["min_depth_factor"])
            for part in parts:
                if len(parts) > 1:
                    if np.count_nonzero(part) < min_cells:
                        continue
                    m = measure(part, lrm[slc], offset, cell, config.MIN_HOLE_M2, config.RING_CLOSING_CELLS)
                found.append((m, classify(m), part, slc))

    xy = [grid.cell_center(m.row, m.col) for m, *_ in found]
    forms = [f for _, f, *_ in found]
    tr = _to_wgs84()
    out_labels = np.zeros(grid.dem.shape, dtype=np.int32)
    candidates = []
    for i, (m, form, comp, slc) in enumerate(found):
        same = [f == form for f in forms]
        protected = protected_by_shape(form, m)
        if barrow_sized(form, m):
            bc = config.BARROW_CEMETERY
            barrows = [barrow_sized(f, mm) for (mm, f, *_) in found]
            protected = protected or neighbours_within(xy, i, bc["radius_m"], barrows) >= bc["min_count"]
        clustered = neighbours_within(xy, i, config.CLUSTER["radius_m"], same) >= config.CLUSTER["min_count"]
        ctx = context_component(*xy[i], context or [], clustered)
        lng, lat, _ = tr.TransformPoint(*xy[i])
        candidates.append({
            "id": f"{sheet_id}-{i + 1:04d}",
            "sheetId": sheet_id,
            "form": form,
            "lat": round(lat, 7),
            "lng": round(lng, 7),
            "areaM2": round(m.area_m2, 1),
            "lengthM": round(m.length_m, 1),
            "widthM": round(m.width_m, 1),
            "reliefM": round(m.relief_m, 2),
            "circularity": round(m.circularity, 3),
            "elongation": round(m.elongation, 2),
            "rectangularity": round(m.rectangularity, 3),
            "score": score(form, m, ctx, p.weights),
            "protectedLikely": bool(protected),
            "decision": "nowy",
            "note": "",
        })
        out_labels[slc][comp] = i + 1
    return Result(candidates=candidates, labels=out_labels, lrm=lrm)
