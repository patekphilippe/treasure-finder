# Narzędzia QGIS

Rozpoznawanie form terenu działa w aplikacji (tryb Analiza, wczytanie arkusza NMT) i w
`npm run calibrate`; kod: `src/shared/lib/detect/`. Tu zostały pomocnicze skrypty do oglądania
reliefu w QGIS, uruchamiane interpreterem z QGIS LTR:

```bash
# wizualizacje reliefu (SLRM, SVF, cieniowanie) dla arkusza
qgis/run.sh qgis/visualize.py data/ARKUSZ.asc data/derived

# projekt QGIS z ortofotomapą i warstwami reliefu
qgis/run.sh qgis/build_project.py data/derived
```

Kandydatów z aplikacji (Dane → eksport: `kandydaci.geojson`, `strefy_poszukiwan.geojson`)
można dodać do projektu jako zwykłe warstwy GeoJSON.

Wymaga QGIS LTR w `/Applications/QGIS-LTR.app` (`brew install --cask qgis@ltr`)
i wtyczki RVT w profilu QGIS (dla `visualize.py`).
