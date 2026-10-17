"""Detects landform candidates on NMT sheets (docs/PLAN.md, Etap 1).

  qgis/run.sh qgis/detect.py data/*.asc --out data/derived [--context kontekst.geojson]

Writes kandydaci.geojson (points, app format — import into the app) and kandydaci.gpkg
(outlines in EPSG:2180, one layer per sheet — for review in QGIS), and prints a summary.
"""
import argparse
import collections
import os
import re
import sys
import time

from candidates import config
from candidates.exclude import bdot_layers, exclusion_mask
from candidates.grid import read_grid
from candidates.output import load_context, write_candidates_geojson, write_outlines
from candidates.pipeline import Params, analyse

LABELS = {
    "kopiec_okragly": "kopiec okrągły", "zaglebienie_okragle": "zagłębienie okrągłe",
    "zaglebienie_prostokatne": "zagłębienie prostokątne", "row_liniowy": "rów liniowy",
    "wal_liniowy": "wał liniowy", "pierscien": "pierścień", "nieokreslony": "nieokreślony",
}


def sheet_id(path: str) -> str:
    """Godło from Geoportal file names like 4102_77565_M-33-33-B-d-3-1.asc, else the file name."""
    name = os.path.splitext(os.path.basename(path))[0]
    m = re.search(r"[MN]-\d{2}-\d{1,3}(-[A-Da-d0-9]+)*$", name)
    return m.group(0) if m else name


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("sheets", nargs="+", help=".asc or GeoTIFF sheets in EPSG:2180")
    ap.add_argument("--out", default="data/derived")
    ap.add_argument("--context", help="GeoJSON (EPSG:4326) with context features")
    ap.add_argument("--radius", type=float, default=config.LRM_RADIUS_M, help="LRM radius in metres")
    ap.add_argument("--threshold", type=float, default=config.THRESHOLD_M, help="LRM threshold in metres")
    ap.add_argument("--opening", type=int, default=config.OPENING_RADIUS_CELLS, help="opening radius in cells")
    ap.add_argument("--bdot", help="folder with unpacked BDOT10k GeoPackages; layers from config.BDOT_EXCLUDE are excluded")
    ap.add_argument("--exclude", action="append", default=[], help="extra vector layer (EPSG:2180) to exclude")
    ap.add_argument("--exclude-buffer", type=float, default=config.EXCLUDE_BUFFER_M, help="buffer in metres")
    ap.add_argument("--top", type=int, default=20)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    gpkg = os.path.join(args.out, "kandydaci.gpkg")
    if os.path.exists(gpkg):
        os.remove(gpkg)
    context = load_context(args.context) if args.context else []
    params = Params(lrm_radius_m=args.radius, threshold_m=args.threshold, opening_radius_cells=args.opening)
    exclude_layers = (bdot_layers(args.bdot) if args.bdot else []) + [(p, args.exclude_buffer) for p in args.exclude]
    if args.bdot and not exclude_layers:
        print(f"Uwaga: brak warstw BDOT10k ({', '.join(config.BDOT_EXCLUDE)}) w {args.bdot}", file=sys.stderr)

    all_candidates = []
    for path in args.sheets:
        t0 = time.time()
        sid = sheet_id(path)
        grid = read_grid(path)
        exclude = exclusion_mask(grid, exclude_layers) if exclude_layers else None
        result = analyse(grid, sid, context, params, exclude)
        write_outlines(result.labels, grid, result.candidates, gpkg, f"kontury_{sid}")
        all_candidates += result.candidates
        excluded = f", wykluczono {exclude.mean() * 100:.0f}% powierzchni (BDOT10k)" if exclude is not None else ""
        print(f"{sid}: {len(result.candidates)} kandydatów{excluded}, {time.time() - t0:.1f} s")

    write_candidates_geojson(all_candidates, os.path.join(args.out, "kandydaci.geojson"))

    counts = collections.Counter(c["form"] for c in all_candidates)
    protected = sum(c["protectedLikely"] for c in all_candidates)
    print(f"\nRazem {len(all_candidates)} (prawdopodobnie chronionych: {protected})")
    for form, label in LABELS.items():
        print(f"  {label:<24} {counts.get(form, 0):>5}")
    print(f"\nTop {args.top} wg oceny:")
    for c in sorted(all_candidates, key=lambda c: -c["score"])[: args.top]:
        flag = " [chroniony]" if c["protectedLikely"] else ""
        print(f"  {c['score']:>3}  {LABELS[c['form']]:<23} {c['lat']:.6f}, {c['lng']:.6f}  "
              f"{c['lengthM']:.0f}×{c['widthM']:.0f} m, relief {c['reliefM']:+.2f} m{flag}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
