"""Writing results: candidate points (GeoJSON, app format) and outlines (GeoPackage, EPSG:2180)."""
import json

import numpy as np
from osgeo import gdal, ogr, osr
from shapely import wkt
from shapely.geometry import shape
from shapely.ops import transform

from .grid import Grid

gdal.UseExceptions()
ogr.UseExceptions()

FIELDS = [("cid", ogr.OFTInteger), ("id", ogr.OFTString), ("form", ogr.OFTString), ("score", ogr.OFTInteger),
          ("protected", ogr.OFTInteger), ("reliefM", ogr.OFTReal), ("lengthM", ogr.OFTReal),
          ("widthM", ogr.OFTReal), ("areaM2", ogr.OFTReal)]


def srs_2180() -> osr.SpatialReference:
    s = osr.SpatialReference(); s.ImportFromEPSG(2180)
    s.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    return s


def write_candidates_geojson(candidates: list[dict], path: str) -> None:
    """kandydaci.geojson — same properties as the app's Candidate model (docs/PLAN.md)."""
    features = [{"type": "Feature",
                 "geometry": {"type": "Point", "coordinates": [c["lng"], c["lat"]]},
                 "properties": {k: v for k, v in c.items() if k not in ("lat", "lng")}}
                for c in candidates]
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f, ensure_ascii=False)


def write_outlines(labels: np.ndarray, grid: Grid, candidates: list[dict], gpkg: str, layer_name: str) -> None:
    """Polygonises candidate cells into one layer per call (appended to the GeoPackage)."""
    rows, cols = labels.shape
    mem = gdal.GetDriverByName("MEM").Create("", cols, rows, 1, gdal.GDT_Int32)
    mem.SetGeoTransform((grid.origin_x, grid.cell, 0, grid.origin_y, 0, -grid.cell))
    mem.SetProjection(srs_2180().ExportToWkt())
    band = mem.GetRasterBand(1)
    band.WriteArray(labels)
    drv = ogr.GetDriverByName("GPKG")
    ds = drv.Open(gpkg, 1) if gdal.VSIStatL(gpkg) else drv.CreateDataSource(gpkg)
    if ds.GetLayerByName(layer_name):
        ds.DeleteLayer(layer_name)
    lyr = ds.CreateLayer(layer_name, srs_2180(), ogr.wkbPolygon)
    for name, kind in FIELDS:
        lyr.CreateField(ogr.FieldDefn(name, kind))
    gdal.Polygonize(band, band, lyr, 0, [], callback=None)  # mask=band skips 0
    by_cid = {i + 1: c for i, c in enumerate(candidates)}
    lyr.StartTransaction()
    for feat in lyr:
        c = by_cid.get(feat.GetField("cid"))
        if not c:
            continue
        feat.SetField("id", c["id"]); feat.SetField("form", c["form"]); feat.SetField("score", c["score"])
        feat.SetField("protected", int(c["protectedLikely"])); feat.SetField("reliefM", c["reliefM"])
        feat.SetField("lengthM", c["lengthM"]); feat.SetField("widthM", c["widthM"]); feat.SetField("areaM2", c["areaM2"])
        lyr.SetFeature(feat)
    lyr.CommitTransaction()
    ds = None


def load_context(path: str) -> list:
    """Context features (old settlements, roads, mills…) drawn in QGIS, GeoJSON in EPSG:4326 → EPSG:2180."""
    src = osr.SpatialReference(); src.ImportFromEPSG(4326)
    src.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    tr = osr.CoordinateTransformation(src, srs_2180())
    to_2180 = lambda x, y, z=None: tuple(zip(*[tr.TransformPoint(a, b)[:2] for a, b in zip(  # noqa: E731
        np.atleast_1d(x), np.atleast_1d(y))]))
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return [transform(to_2180, shape(feat["geometry"])) for feat in data.get("features", []) if feat.get("geometry")]
