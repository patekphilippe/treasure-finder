"""Relief visualisations for QGIS: local relief (SLRM), sky-view factor and multi-hillshade (RVT library).

  qgis/run.sh qgis/visualize.py data/SHEET.asc data/derived
"""
import sys, os, time
sys.path.insert(0, os.path.expanduser('~/Library/Application Support/QGIS/QGIS3/profiles/default/python/plugins/rvt-qgis'))
import numpy as np
from osgeo import gdal
gdal.UseExceptions()
import rvt.vis

def write_tif(path, arr, ref):
    ds = gdal.GetDriverByName('GTiff').Create(path, ref.RasterXSize, ref.RasterYSize, 1, gdal.GDT_Float32,
                                              options=['COMPRESS=DEFLATE', 'PREDICTOR=3', 'TILED=YES'])
    ds.SetGeoTransform(ref.GetGeoTransform()); ds.SetProjection('EPSG:2180')
    b = ds.GetRasterBand(1); b.SetNoDataValue(-9999); b.WriteArray(arr); ds = None

def write_png(path, rgb, step):
    rgb = rgb[::step, ::step]
    mem = gdal.GetDriverByName('MEM').Create('', rgb.shape[1], rgb.shape[0], 3, gdal.GDT_Byte)
    for i in range(3): mem.GetRasterBand(i + 1).WriteArray(rgb[..., i])
    gdal.GetDriverByName('PNG').CreateCopy(path, mem)

def diverging(v, lim=0.5):
    t = np.clip(v / lim, -1, 1)
    r = np.where(t > 0, 255, 255 * (1 + t)); b = np.where(t < 0, 255, 255 * (1 - t)); g = 255 * (1 - abs(t))
    return np.dstack([r, g, b]).astype(np.uint8)

def gray(v, lo, hi):
    g = (np.clip((v - lo) / (hi - lo), 0, 1) * 255).astype(np.uint8)
    return np.dstack([g, g, g])

src_path, out_dir = sys.argv[1], sys.argv[2]
name = os.path.splitext(os.path.basename(src_path))[0]
t0 = time.time()
src = gdal.Open(src_path)
mem = gdal.GetDriverByName('MEM').CreateCopy('', src)
band = mem.GetRasterBand(1)
nodata_mask = band.ReadAsArray() == band.GetNoDataValue()
gdal.FillNodata(band, None, maxSearchDist=100, smoothingIterations=0)
dem = band.ReadAsArray().astype('float32')
res = src.GetGeoTransform()[1]

slrm = rvt.vis.slrm(dem, radius_cell=15)
svf = rvt.vis.sky_view_factor(dem, resolution=res, compute_svf=True, compute_asvf=False, compute_opns=False, svf_r_max=10)['svf']
mhs = rvt.vis.multi_hillshade(dem, resolution_x=res, resolution_y=res, nr_directions=16, sun_elevation=35)
mhs = mhs.mean(axis=0) if mhs.ndim == 3 else mhs
if mhs.shape != dem.shape: mhs = np.pad(mhs, 1, mode='edge')  # RVT trims a 1-px border
for a in (slrm, svf, mhs): a[nodata_mask] = -9999

write_tif(f'{out_dir}/{name}_slrm.tif', slrm, src)
write_tif(f'{out_dir}/{name}_svf.tif', svf, src)
write_tif(f'{out_dir}/{name}_hillshade.tif', mhs, src)
valid = ~nodata_mask
print(f'{name}: {time.time()-t0:.1f}s | slrm p1/p99 {np.percentile(slrm[valid],1):.2f}/{np.percentile(slrm[valid],99):.2f} m | '
      f'|slrm|>0.25: {(np.abs(slrm[valid])>0.25).mean()*100:.2f}% cells')
write_png(f'{out_dir}/{name}_slrm_preview.png', diverging(np.where(valid, slrm, 0)), 3)
write_png(f'{out_dir}/{name}_svf_preview.png', gray(np.where(valid, svf, 1), 0.85, 1.0), 3)
