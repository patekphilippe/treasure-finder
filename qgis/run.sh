#!/bin/zsh
# Runs Python with QGIS LTR's bundled interpreter (GDAL, numpy, scipy, shapely, PyQGIS).
#   qgis/run.sh qgis/detect.py data/*.asc
#   qgis/run.sh -m unittest discover -s qgis/tests
Q="${QGIS_APP:-/Applications/QGIS-LTR.app}/Contents"
HERE="${0:A:h}"
export PYTHONHOME="$Q/Resources"
export PYTHONPATH="$HERE:$Q/Resources/python3.11:$Q/Resources/python3.11/site-packages:$Q/Resources/python"
export PROJ_DATA="$Q/Resources/qgis/proj"
export QT_QPA_PLATFORM=offscreen
export PYTHONWARNINGS="ignore::FutureWarning"
exec "$Q/MacOS/python" "$@"
