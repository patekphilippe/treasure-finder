"""Reading NMT sheets and the local relief model."""
from dataclasses import dataclass

import numpy as np
from osgeo import gdal
from scipy import ndimage

gdal.UseExceptions()


@dataclass
class Grid:
    """DEM in EPSG:2180; NODATA cells are NaN. origin = top-left corner of the top-left cell."""

    dem: np.ndarray
    cell: float
    origin_x: float
    origin_y: float

    @property
    def nodata(self) -> np.ndarray:
        return np.isnan(self.dem)

    def cell_center(self, row: float, col: float) -> tuple[float, float]:
        return self.origin_x + (col + 0.5) * self.cell, self.origin_y - (row + 0.5) * self.cell


def read_grid(path: str) -> Grid:
    """ESRI ASCII Grid (xllcorner/xllcenter, optional NODATA_value) or GeoTIFF via GDAL."""
    ds = gdal.Open(path)
    band = ds.GetRasterBand(1)
    dem = band.ReadAsArray().astype(np.float32)
    nd = band.GetNoDataValue()
    if nd is not None:
        dem[dem == nd] = np.nan
    gt = ds.GetGeoTransform()
    if abs(gt[1] + gt[5]) > 1e-9 or gt[2] or gt[4]:
        raise ValueError(f"{path}: only north-up square cells are supported")
    return Grid(dem=dem, cell=gt[1], origin_x=gt[0], origin_y=gt[3])


def fill_nodata(dem: np.ndarray) -> np.ndarray:
    """NODATA → nearest valid value (for computation only; the mask is kept separately)."""
    nan = np.isnan(dem)
    if not nan.any():
        return dem
    idx = ndimage.distance_transform_edt(nan, return_distances=False, return_indices=True)
    return dem[tuple(idx)]


def local_relief(dem: np.ndarray, radius_cells: int) -> np.ndarray:
    """LRM = DEM − mean over a (2r+1)² window (summed-area based, O(n))."""
    smooth = ndimage.uniform_filter(dem.astype(np.float64), size=2 * radius_cells + 1, mode="nearest")
    return (dem - smooth).astype(np.float32)


def valid_zone(nodata: np.ndarray, radius_cells: int) -> np.ndarray:
    """Cells whose LRM window is complete: away from the sheet edge and from NODATA."""
    near_nodata = ndimage.maximum_filter(nodata, size=2 * radius_cells + 1)
    ok = ~near_nodata
    r = radius_cells
    ok[:r, :] = ok[-r:, :] = False
    ok[:, :r] = ok[:, -r:] = False
    return ok
