# Analiza NMT w QGIS

Wykrywanie kandydatów (Etap 1 z docs/PLAN.md) jako skrypty Pythona uruchamiane
interpreterem z QGIS LTR (GDAL, numpy, scipy, shapely, PyQGIS, biblioteka RVT).

```bash
# wizualizacje reliefu (SLRM, SVF, cieniowanie) dla arkusza
qgis/run.sh qgis/visualize.py data/ARKUSZ.asc data/derived

# kandydaci: data/derived/kandydaci.geojson (format aplikacji) + kandydaci.gpkg (kontury)
qgis/run.sh qgis/detect.py data/*.asc --out data/derived [--context kontekst.geojson]

# projekt QGIS z ortofotomapą, warstwami reliefu i kandydatami
qgis/run.sh qgis/build_project.py data/derived

# testy (syntetyczne modele terenu z docs/PLAN.md)
npm run test:qgis
```

Progi i wagi: `qgis/candidates/config.py` (jedno miejsce do kalibracji).
Wymaga QGIS LTR w `/Applications/QGIS-LTR.app` (`brew install --cask qgis@ltr`)
i wtyczki RVT w profilu QGIS (dla `visualize.py`).
