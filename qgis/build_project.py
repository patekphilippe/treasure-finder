"""Builds data/derived/analiza.qgz: orthophoto, relief layers per sheet, candidates and review points.

  qgis/run.sh qgis/build_project.py data/derived
"""
import glob
import os
import sys

from qgis.core import (QgsApplication, QgsCategorizedSymbolRenderer, QgsColorRampShader, QgsContrastEnhancement,
                       QgsCoordinateReferenceSystem, QgsFillSymbol, QgsPalLayerSettings, QgsProject, QgsRasterLayer,
                       QgsRasterShader, QgsRectangle, QgsReferencedRectangle, QgsRendererCategory,
                       QgsSingleBandGrayRenderer, QgsSingleBandPseudoColorRenderer, QgsTextFormat,
                       QgsVectorLayer, QgsVectorLayerSimpleLabeling)
from qgis.PyQt.QtGui import QColor

FORMS = {  # same colours as the app will use
    "kopiec_okragly": ("kopiec okrągły", "#d97706"), "zaglebienie_okragle": ("zagłębienie okrągłe", "#2563eb"),
    "zaglebienie_prostokatne": ("zagłębienie prostokątne", "#7c3aed"), "row_liniowy": ("rów liniowy", "#0891b2"),
    "wal_liniowy": ("wał liniowy", "#65a30d"), "pierscien": ("pierścień", "#dc2626"),
    "nieokreslony": ("nieokreślony", "#71717a"),
}


def pseudocolor(layer, lo=-0.5, hi=0.5):
    ramp = QgsColorRampShader(lo, hi)
    ramp.setColorRampType(QgsColorRampShader.Interpolated)
    ramp.setColorRampItemList([QgsColorRampShader.ColorRampItem(lo, QColor(33, 102, 172), f"{lo} m"),
                               QgsColorRampShader.ColorRampItem(0, QColor(247, 247, 247), "0"),
                               QgsColorRampShader.ColorRampItem(hi, QColor(178, 24, 43), f"+{hi} m")])
    shader = QgsRasterShader(); shader.setRasterShaderFunction(ramp)
    layer.setRenderer(QgsSingleBandPseudoColorRenderer(layer.dataProvider(), 1, shader))


def gray(layer, lo, hi):
    r = QgsSingleBandGrayRenderer(layer.dataProvider(), 1)
    ce = QgsContrastEnhancement(layer.dataProvider().dataType(1))
    ce.setContrastEnhancementAlgorithm(QgsContrastEnhancement.StretchToMinimumMaximum)
    ce.setMinimumValue(lo); ce.setMaximumValue(hi); r.setContrastEnhancement(ce)
    layer.setRenderer(r)


def style_outlines(layer):
    cats = []
    for value, (label, color) in FORMS.items():
        sym = QgsFillSymbol.createSimple({"color": color + "33", "outline_color": color, "outline_width": "0.5"})
        cats.append(QgsRendererCategory(value, sym, label))
    layer.setRenderer(QgsCategorizedSymbolRenderer("form", cats))
    pal = QgsPalLayerSettings()
    pal.fieldName = "score"
    fmt = QgsTextFormat(); fmt.setSize(8); pal.setFormat(fmt)
    layer.setLabeling(QgsVectorLayerSimpleLabeling(pal)); layer.setLabelsEnabled(True)
    layer.setSubsetString("score >= 50")


def main(d):
    QgsApplication.setPrefixPath("/Applications/QGIS-LTR.app", True)
    app = QgsApplication([], False); app.initQgis()
    proj = QgsProject.instance()
    proj.setCrs(QgsCoordinateReferenceSystem("EPSG:2180"))
    root = proj.layerTreeRoot()

    poi = f"{d}/do_obejrzenia.geojson"
    if os.path.exists(poi):
        lyr = QgsVectorLayer(poi, "Do obejrzenia", "ogr"); proj.addMapLayer(lyr, False); root.addLayer(lyr)

    gpkg = f"{d}/kandydaci.gpkg"
    extent = QgsRectangle(); extent.setNull()
    for slrm_path in sorted(glob.glob(f"{d}/*_slrm.tif")):
        base = slrm_path[: -len("_slrm.tif")]
        sheet = os.path.basename(base).split("_")[-1]
        group = root.addGroup(f"Arkusz {sheet}")
        layers = []
        if os.path.exists(gpkg):
            out = QgsVectorLayer(f"{gpkg}|layername=kontury_{sheet}", f"Kandydaci {sheet} (ocena ≥ 50)", "ogr")
            if out.isValid():
                style_outlines(out); layers.append((out, True))
        slrm = QgsRasterLayer(slrm_path, f"LRM (relief lokalny) {sheet}")
        pseudocolor(slrm); slrm.renderer().setOpacity(0.65)
        svf = QgsRasterLayer(f"{base}_svf.tif", f"SVF {sheet}"); gray(svf, 0.85, 1.0)
        hs = QgsRasterLayer(f"{base}_hillshade.tif", f"Cieniowanie {sheet}"); gray(hs, 0.35, 0.75)
        layers += [(slrm, True), (svf, False), (hs, False)]
        for lyr, visible in layers:
            proj.addMapLayer(lyr, False); group.addLayer(lyr).setItemVisibilityChecked(visible)
        extent.combineExtentWith(slrm.extent())

    base_group = root.addGroup("Podkład")
    for uri, name, visible in (
        ("contextualWMSLegend=0&crs=EPSG:2180&dpiMode=7&format=image/jpeg&layers=Raster&styles="
         "&url=https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution",
         "Ortofotomapa (Geoportal)", True),
        ("type=xyz&url=https://tile.openstreetmap.org/{z}/{x}/{y}.png&zmax=19&zmin=0", "OpenStreetMap", False),
    ):
        lyr = QgsRasterLayer(uri, name, "wms")
        if lyr.isValid():
            proj.addMapLayer(lyr, False); base_group.addLayer(lyr).setItemVisibilityChecked(visible)

    proj.viewSettings().setDefaultViewExtent(QgsReferencedRectangle(extent, proj.crs()))
    ok = proj.write(f"{d}/analiza.qgz")
    print("zapisano" if ok else "BŁĄD zapisu", f"{d}/analiza.qgz", flush=True)
    os._exit(0 if ok else 1)


if __name__ == "__main__":
    main(sys.argv[1])
