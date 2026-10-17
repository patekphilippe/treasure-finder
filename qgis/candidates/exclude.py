"""Exclusion mask from vector layers (building footprints, built-up areas)."""
import glob
import os

import numpy as np
from osgeo import gdal, ogr
from scipy import ndimage

from . import config
from .grid import Grid

gdal.UseExceptions()
ogr.UseExceptions()


def bdot_layers(folder: str) -> list[tuple[str, float]]:
    """(path, buffer) for the BDOT10k layers from config.BDOT_EXCLUDE found in an unpacked GPKG folder."""
    return [(path, buffer) for code, buffer in config.BDOT_EXCLUDE.items()
            for path in sorted(glob.glob(os.path.join(folder, f"*{code}.gpkg")))]


def exclusion_mask(grid: Grid, layers: list[tuple[str, float]]) -> np.ndarray:
    """True where a cell lies within its layer's buffer of any feature. Layers must be in EPSG:2180."""
    mask = np.zeros(grid.dem.shape, dtype=bool)
    for buffer_m in sorted({b for _, b in layers}):
        mask |= _mask_for(grid, [p for p, b in layers if b == buffer_m], buffer_m)
    return mask


def _mask_for(grid: Grid, paths: list[str], buffer_m: float) -> np.ndarray:
    rows, cols = grid.dem.shape
    mem = gdal.GetDriverByName("MEM").Create("", cols, rows, 1, gdal.GDT_Byte)
    mem.SetGeoTransform((grid.origin_x, grid.cell, 0, grid.origin_y, 0, -grid.cell))
    x0, y1 = grid.origin_x - buffer_m, grid.origin_y + buffer_m
    x1, y0 = grid.origin_x + cols * grid.cell + buffer_m, grid.origin_y - rows * grid.cell - buffer_m
    for path in paths:
        ds = ogr.Open(path)
        for i in range(ds.GetLayerCount()):
            layer = ds.GetLayer(i)
            epsg = layer.GetSpatialRef().GetAuthorityCode(None) if layer.GetSpatialRef() else None
            if epsg not in (None, "2180"):
                raise ValueError(f"{path}: expected EPSG:2180, got EPSG:{epsg}")
            layer.SetSpatialFilterRect(x0, y0, x1, y1)
            gdal.RasterizeLayer(mem, [1], layer, burn_values=[1], options=["ALL_TOUCHED=TRUE"])
    burned = mem.GetRasterBand(1).ReadAsArray().astype(bool)
    if buffer_m <= 0 or not burned.any():
        return burned
    return ndimage.distance_transform_edt(~burned) * grid.cell <= buffer_m
